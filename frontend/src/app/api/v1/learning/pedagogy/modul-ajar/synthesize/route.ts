import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

const NVIDIA_API_KEY =
  process.env.NVIDIA_API_KEY ||
  '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';
const PRIMARY_MODEL = process.env.NVIDIA_MODEL || 'nvidia/ising-calibration-1.5-31b';
const FALLBACK_MODEL = 'meta/llama-3.2-11b-vision-instruct';
const NVIDIA_URL =
  process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';

const SUBJECT_WEEKLY_HOURS: Record<string, number> = {
  '401000000': 4,
  matematika: 4,
  ipas: 5,
  ipa: 5,
  ips: 4,
  'bahasa indonesia': 4,
  'bahasa inggris': 3,
  'pendidikan pancasila': 3,
  ppkn: 3,
  'pendidikan agama': 3,
  pjok: 3,
  'seni budaya': 3,
};

function getSubjectWeeklyHours(subjectCodeOrName: string): number {
  if (!subjectCodeOrName) return 4;
  const key = subjectCodeOrName.trim().toLowerCase();
  if (SUBJECT_WEEKLY_HOURS[key]) return SUBJECT_WEEKLY_HOURS[key];
  for (const [k, v] of Object.entries(SUBJECT_WEEKLY_HOURS)) {
    if (key.includes(k)) return v;
  }
  return 4;
}

function extractCleanJson(text: string): string {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  else if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return clean;
}

async function callNvidiaNim(messages: Array<{ role: string; content: string }>, modelName: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.3,
        max_tokens: 3500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NVIDIA NIM returned HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      learning_objective_id,
      academic_year = '2026/2027',
      semester = 'ODD',
      grade_level = 'Kelas 5',
      subject_name = 'IPAS',
      subject_code = '401000000',
      phase = 'FASE_C',
      allocated_hours = 4,
      total_meetings = 2,
      hours_per_meeting = 2,
      user_instructions = '',
    } = body;

    if (!learning_objective_id) {
      return NextResponse.json(
        { success: false, error: 'learning_objective_id wajib disertakan.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. POIN KRITIS 2: Validasi Relasional ke TP & Status PUBLISHED
    // ─────────────────────────────────────────────────────────────────────────
    const tpRes = await pool.query(
      `SELECT id, code, competency, content_scope, statement, pancasila_profiles, publication_status, estimated_hours
       FROM learning_objectives
       WHERE id = $1 AND deleted_at IS NULL`,
      [learning_objective_id]
    );

    if (tpRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tujuan Pembelajaran (TP) tidak ditemukan dalam sistem.' },
        { status: 404 }
      );
    }

    const tp = tpRes.rows[0];

    if (tp.publication_status !== 'PUBLISHED') {
      return NextResponse.json(
        {
          success: false,
          error_code: 'TP_NOT_PUBLISHED',
          message: `Tujuan Pembelajaran (${tp.code}) berstatus '${tp.publication_status}'. Modul Ajar hanya dapat dibuat dan diaktifkan dari TP yang telah disahkan (PUBLISHED).`,
          current_status: tp.publication_status,
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. POIN KRITIS 1: Sinkronisasi Alokasi Waktu Kaldik (MEB Engine)
    // ─────────────────────────────────────────────────────────────────────────
    const mebWeeks = semester.toUpperCase() === 'EVEN' ? 17 : 18;
    const weeklyHours = getSubjectWeeklyHours(subject_code || subject_name);
    const totalCapacityJp = mebWeeks * weeklyHours;

    const budgetRes = await pool.query(
      `SELECT COALESCE(SUM(allocated_hours), 0)::integer AS allocated_jp
       FROM modul_ajar
       WHERE academic_year = $1
         AND semester = $2
         AND (subject_code = $3 OR subject_name ILIKE $4 OR $3 = '')
         AND status IN ('ACTIVE', 'DRAFT')
         AND deleted_at IS NULL`,
      [academic_year, semester.toUpperCase(), subject_code, `%${subject_name}%`]
    );

    const currentlyAllocated = Number(budgetRes.rows[0]?.allocated_jp || 0);
    const remainingAvailable = Math.max(0, totalCapacityJp - currentlyAllocated);

    if (allocated_hours > remainingAvailable) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'KALDIK_HOURS_EXCEEDED',
          message: `Alokasi waktu modul ajar (${allocated_hours} JP) melampaui sisa alokasi efektif semester (${remainingAvailable} JP tersisa dari kapasitas total ${totalCapacityJp} JP pada ${mebWeeks} Pekan MEB Kaldik).`,
          budget: {
            academic_year,
            semester: semester.toUpperCase(),
            meb_weeks: mebWeeks,
            weekly_hours: weeklyHours,
            total_capacity_jp: totalCapacityJp,
            allocated_jp: currentlyAllocated,
            remaining_available_jp: remainingAvailable,
            requested_jp: allocated_hours,
          },
        },
        { status: 422 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. POIN KRITIS 3: Prompt NVIDIA NIM untuk Strategi Berdiferensiasi 3-Pilar
    // ─────────────────────────────────────────────────────────────────────────
    const prompt = `Anda adalah Ahli Spesialis Kurikulum Merdeka Kemendikdasmen RI & Perancang Modul Ajar Berdiferensiasi.
Rancang Modul Ajar operasional resmi berdasarkan Tujuan Pembelajaran yang telah disahkan berikut:

Target & Konteks:
- Mata Pelajaran: ${subject_name} (${subject_code})
- Fase / Kelas: ${phase} / ${grade_level}
- Semester: ${semester.toUpperCase() === 'EVEN' ? 'Genap (EVEN)' : 'Ganjil (ODD)'}
- Alokasi Jam: ${allocated_hours} JP (${total_meetings} Pertemuan @ ${hours_per_meeting} JP)
- Kode TP: ${tp.code}
- Rumusan Tujuan Pembelajaran: "${tp.statement}"
- Lingkup Materi Esensial: "${tp.content_scope}"
- Profil Pelajar Pancasila: ${JSON.stringify(tp.pancasila_profiles || ['Bernalar Kritis', 'Mandiri'])}
${user_instructions ? `- Catatan Khusus Guru: ${user_instructions}` : ''}

Format Respon: Wajib JSON murni tanpa markdown/backticks/pembuka/penutup, dengan schema berikut:
{
  "title": "Modul Ajar: [Judul Pembelajaran Kontekstual & Menarik]",
  "meaningful_understanding": "[Pemahaman bermakna yang mendalam, aplikatif bagi kehidupan peserta didik]",
  "trigger_questions": [
    "[Pertanyaan pemantik 1 - menggugah rasa ingin tahu]",
    "[Pertanyaan pemantik 2 - berpikir kritis/HOTS]"
  ],
  "differentiation_strategies": {
    "content": [
      {
        "style": "Visual",
        "description": "[Materi berbasis visual, infografis, diagram konsep]",
        "resources": ["[Sumber visual 1]", "[Sumber visual 2]"]
      },
      {
        "style": "Auditori",
        "description": "[Materi berbasis audio, diskusi lisan, narasi edukatif]",
        "resources": ["[Sumber auditori 1]", "[Sumber auditori 2]"]
      },
      {
        "style": "Kinestetik",
        "description": "[Materi berbasis manipulatif fisik, peraga, simulasi]",
        "resources": ["[Sumber kinestetik 1]", "[Sumber kinestetik 2]"]
      }
    ],
    "process": {
      "needs_guidance": "[Sintaks pendampingan guru intensif berjenjang / scaffolding]",
      "regular_students": "[Sintaks kolaboratif terarah berpasangan/kelompok sedang]",
      "advanced_students": "[Sintaks penugasan studi kasus tantangan tingkat lanjut]"
    },
    "product": [
      {
        "format": "Peta Konsep / Infografis / Laporan Bergambar",
        "target_students": "Peserta didik visual / minat seni desain",
        "rubric_focus": "[Fokus penilaian kualitas dan akurasi materi]"
      },
      {
        "format": "Presentasi Lisan / Podcast / Rekaman Audio",
        "target_students": "Peserta didik auditori / minat komunikasi",
        "rubric_focus": "[Fokus penilaian artikulasi dan alur berpikir logis]"
      },
      {
        "format": "Model Peraga / Produk Fisik / Simulasi Nyata",
        "target_students": "Peserta didik kinestetik / minat kriya terapan",
        "rubric_focus": "[Fokus penilaian kreativitas material dan fungsionalitas]"
      }
    ]
  },
  "learning_activities": [
    {
      "meeting_number": 1,
      "topic": "[Topik Pertemuan 1]",
      "allocated_time_minutes": ${hours_per_meeting * 35},
      "opening": {
        "duration_minutes": 15,
        "steps": ["[Salam dan apersepsi mengaitkan kehidupan]", "[Asesmen diagnostik non-kognitif singkat]", "[Penyampaian tujuan dan alur kegiatan]"]
      },
      "core": {
        "duration_minutes": ${hours_per_meeting * 35 - 30},
        "steps": [
          "[Aktivitas diferensiasi proses di stasiun belajar sesuai modalitas]",
          "[Eksplorasi materi terpandu dan diskusi kolaboratif]",
          "[Unjuk kerja bertahap dengan pendampingan berjenjang]",
          "[Presentasi hasil kelompok dan umpan balik formatif]"
        ]
      },
      "closing": {
        "duration_minutes": 15,
        "steps": ["[Refleksi belajar peserta didik]", "[Penguatan konsep dan kesimpulan oleh guru]", "[Tindak lanjut dan salam penutup]"]
      }
    }
  ],
  "assessment_plan": {
    "diagnostic": "[Asesmen diagnostik awal materi kognitif & non-kognitif]",
    "formative": "[Instrumen observasi proses & kuis cek pemahaman berkala]",
    "summative": "[Evaluasi portofolio unjuk kerja berdiferensiasi produk]"
  },
  "lkpd_attachments": [
    {
      "title": "LKPD 1: Eksplorasi Konseptual Berdiferensiasi",
      "instructions": "[Petunjuk langkah kerja terstruktur bagi siswa]",
      "scaffolding_notes": "[Bantuan khusus kelompok yang membutuhkan bimbingan]"
    }
  ]
}`;

    const messages = [
      {
        role: 'system',
        content:
          'Anda adalah asisten AI resmi Kurikulum Merdeka Kemendikdasmen. Berikan respons HANYA berupa JSON valid sesuai skema yang diminta tanpa penjelasan tambahan.',
      },
      { role: 'user', content: prompt },
    ];

    let rawOutput = '';
    let usedModel = PRIMARY_MODEL;

    try {
      rawOutput = await callNvidiaNim(messages, PRIMARY_MODEL);
    } catch (e) {
      console.warn(`Primary model ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, e);
      usedModel = FALLBACK_MODEL;
      rawOutput = await callNvidiaNim(messages, FALLBACK_MODEL);
    }

    const cleanJson = extractCleanJson(rawOutput);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      throw new Error('Gagal mem-parsing keluaran AI menjadi JSON terstruktur.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Simpan ke database modul_ajar (Status DRAFT)
    // ─────────────────────────────────────────────────────────────────────────
    const tenantIdRes = await pool.query('SELECT tenant_id FROM learning_objectives WHERE id = $1', [learning_objective_id]);
    const tenantId = tenantIdRes.rows[0]?.tenant_id || null;

    const insertRes = await pool.query(
      `INSERT INTO modul_ajar (
        tenant_id, learning_objective_id, academic_year, semester,
        title, grade_level, subject_code, subject_name, phase,
        allocated_hours, total_meetings, hours_per_meeting,
        pancasila_profiles, meaningful_understanding, trigger_questions,
        differentiation_strategies, learning_activities, assessment_plan,
        lkpd_attachments, status, is_ai_generated, ai_generation_meta
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, 'DRAFT', true, $20
      ) RETURNING *;`,
      [
        tenantId,
        learning_objective_id,
        academic_year,
        semester.toUpperCase(),
        parsed.title || `Modul Ajar: ${tp.content_scope}`,
        grade_level,
        subject_code,
        subject_name,
        phase,
        allocated_hours,
        total_meetings,
        hours_per_meeting,
        tp.pancasila_profiles || ['Bernalar Kritis', 'Mandiri'],
        parsed.meaningful_understanding || '',
        JSON.stringify(parsed.trigger_questions || []),
        JSON.stringify(parsed.differentiation_strategies || {}),
        JSON.stringify(parsed.learning_activities || []),
        JSON.stringify(parsed.assessment_plan || {}),
        JSON.stringify(parsed.lkpd_attachments || []),
        JSON.stringify({
          model: usedModel,
          prompt_version: 'v1.0-modul-ajar-differentiated',
          generated_at: new Date().toISOString(),
        }),
      ]
    );

    const saved = insertRes.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Modul Ajar berhasil disintesis oleh AI dan disimpan sebagai draf.',
      modul_ajar: {
        ...saved,
        tp_code: tp.code,
        tp_statement: tp.statement,
        tp_publication_status: tp.publication_status,
      },
    }, { status: 201 });

  } catch (err: unknown) {
    console.error('Error in modul-ajar synthesis:', err);
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
