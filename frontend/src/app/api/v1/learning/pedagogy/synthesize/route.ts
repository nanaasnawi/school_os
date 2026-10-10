import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbPool } from '@/lib/db';

const NVIDIA_API_KEY =
  process.env.NVIDIA_API_KEY ||
  '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';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/ising-calibration-1.5-31b';
const NVIDIA_URL =
  process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
const PROMPT_VERSION = 'v1.0-merdeka-kko';

export interface ProposedTpItem {
  code: string;
  competency: string;
  bloom_level: string;
  content_scope: string;
  statement: string;
  pancasila_profiles: string[];
  evidence_indicators: string[];
  estimated_hours: number;
  suggested_semester: 'ODD' | 'EVEN';
  sequence_order: number;
  pedagogical_approach?: string;
}

function cleanRobotText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\(AI\s+NVIDIA\s+NIM\)/gi, '')
    .replace(/\s*\(NVIDIA\s+NIM\)/gi, '')
    .replace(/\s*oleh\s+AI\s+NVIDIA\s+NIM/gi, '')
    .trim();
}

function extractCleanJson(text: string): string {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  else if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();

  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let first = -1;
  if (firstBrace !== -1 && firstBracket !== -1) first = Math.min(firstBrace, firstBracket);
  else if (firstBrace !== -1) first = firstBrace;
  else first = firstBracket;

  const lastBrace = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');
  const last = Math.max(lastBrace, lastBracket);

  if (first !== -1 && last > first) {
    clean = clean.substring(first, last + 1);
  }
  return clean;
}

async function callNvidiaNim(messages: Array<{ role: string; content: string }>): Promise<string> {
  const models = [NVIDIA_MODEL, 'meta/llama-3.2-11b-vision-instruct'];
  let lastError: Error | null = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);

    try {
      const res = await fetch(NVIDIA_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.25,
          max_tokens: 3000,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`NVIDIA NIM HTTP ${res.status}: ${errBody}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('NVIDIA NIM returned empty response content');
      }
      return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`[NVIDIA NIM Provider] Model ${model} failed:`, err.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('Gagal menghubungi layanan NVIDIA NIM AI.');
}

function buildPedagogicalPrompt(params: {
  subjectName: string;
  phase: string;
  gradeLevel: string;
  elementName: string;
  cpDescription: string;
}): string {
  const cleanSubjectCode = params.subjectName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase() || 'MAPEL';
  const gradeDigit = params.gradeLevel.replace(/\D/g, '') || '5';

  return `Anda adalah Pakar Kurikulum Merdeka (Kemendikdasmen RI).
Anda diberikan naskah resmi Capaian Pembelajaran (CP) berikut:
- Mata Pelajaran: ${params.subjectName}
- Fase: ${params.phase} (${params.gradeLevel})
- Elemen CP: ${params.elementName}
- Teks Resmi CP: "${params.cpDescription}"

ATURAN KETAT PEDAGOGIS:
1. DILARANG MENGARANG, MERUBAH, ATAU MENGURANGI teks Capaian Pembelajaran (CP) di atas. Naskah CP adalah standar otoritatif.
2. Tugas Anda adalah membedah naskah CP di atas menjadi 3 sampai 6 butir Tujuan Pembelajaran (TP) yang operasional dan terukur.
3. Setiap butir TP HARUS memiliki:
   - "code": format "TP.${cleanSubjectCode}.${gradeDigit}.[NOMOR]" (contoh: "TP.${cleanSubjectCode}.${gradeDigit}.1")
   - "competency": Kata Kerja Operasional (KKO) Taksonomi Bloom (contoh: "Mengidentifikasi", "Menganalisis", "Menyelidiki", "Merancang", "Menyimpulkan")
   - "bloom_level": salah satu dari ["C1", "C2", "C3", "C4", "C5", "C6"]
   - "content_scope": Lingkup materi / topik esensial
   - "statement": Rumusan kalimat TP lengkap diawali "Peserta didik dapat..."
   - "pancasila_profiles": array profil pelajar pancasila (pilih dari: ["Bernalar Kritis", "Mandiri", "Gotong Royong", "Kreatif", "Kebinekaan Global", "Beriman & Bertakwa"])
   - "evidence_indicators": minimal 2 indikator ketercapaian tujuan pembelajaran (IKTP) yang teramati
   - "estimated_hours": alokasi Jam Pelajaran (JP) bernilai bilangan bulat antara 2 sampai 8 JP
   - "suggested_semester": "ODD" untuk semester ganjil atau "EVEN" untuk semester genap
   - "sequence_order": nomor urut alur pembelajaran (1, 2, 3...)
   - "pedagogical_approach": pendekatan pembelajaran yang cocok (contoh: "Problem-Based Learning", "Inquiry-Based Learning", "Project-Based Learning")

FORMAT KELUARAN HARUS BERUPA JSON MURNI DENGAN SKEMA:
{
  "tps": [
    {
      "code": "TP.${cleanSubjectCode}.${gradeDigit}.1",
      "competency": "Menganalisis",
      "bloom_level": "C4",
      "content_scope": "Nama Lingkup Materi",
      "statement": "Peserta didik dapat menganalisis...",
      "pancasila_profiles": ["Bernalar Kritis", "Mandiri"],
      "evidence_indicators": ["Indikator 1", "Indikator 2"],
      "estimated_hours": 6,
      "suggested_semester": "ODD",
      "sequence_order": 1,
      "pedagogical_approach": "Problem-Based Learning"
    }
  ]
}

OUTPUT HANYA JSON MURNI TANPA PEMBUKA/PENUTUP MARKDOWN ATAU PENJELASAN LAIN.`;
}

function validateGeneratedTps(data: any): ProposedTpItem[] {
  if (!data || typeof data !== 'object') {
    throw new Error('Hasil AI bukan berupa objek JSON valid');
  }
  const tps = data.tps || data.learning_objectives || data.objectives;
  if (!Array.isArray(tps) || tps.length === 0) {
    throw new Error('Hasil AI tidak memuat daftar TP (tps array kosong)');
  }

  const validBloom = new Set(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
  const validated: ProposedTpItem[] = [];

  for (let i = 0; i < tps.length; i++) {
    const item = tps[i];
    const code = String(item.code || `TP-${i + 1}`).trim();
    const competency = cleanRobotText(String(item.competency || '').trim());
    const rawBloom = String(item.bloom_level || 'C3').trim().toUpperCase();
    const bloom_level = validBloom.has(rawBloom) ? rawBloom : 'C3';
    const content_scope = cleanRobotText(String(item.content_scope || '').trim());
    const statement = cleanRobotText(String(item.statement || '').trim());

    if (!statement || !content_scope) {
      continue;
    }

    const pancasila_profiles = Array.isArray(item.pancasila_profiles)
      ? item.pancasila_profiles.map((p: any) => cleanRobotText(String(p).trim())).filter(Boolean)
      : ['Bernalar Kritis'];

    const evidence_indicators = Array.isArray(item.evidence_indicators)
      ? item.evidence_indicators.map((e: any) => cleanRobotText(String(e).trim())).filter(Boolean)
      : ['Memahami konsep dengan baik'];

    let hours = parseInt(item.estimated_hours, 10);
    if (isNaN(hours) || hours <= 0 || hours > 16) {
      hours = 4;
    }

    const sem = String(item.suggested_semester || '').trim().toUpperCase();
    const suggested_semester: 'ODD' | 'EVEN' = sem === 'EVEN' ? 'EVEN' : 'ODD';
    const sequence_order = parseInt(item.sequence_order, 10) || i + 1;
    const pedagogical_approach = item.pedagogical_approach
      ? cleanRobotText(String(item.pedagogical_approach).trim())
      : 'Problem-Based Learning';

    validated.push({
      code,
      competency: competency || 'Memahami',
      bloom_level,
      content_scope,
      statement,
      pancasila_profiles,
      evidence_indicators,
      estimated_hours: hours,
      suggested_semester,
      sequence_order,
      pedagogical_approach,
    });
  }

  if (validated.length === 0) {
    throw new Error('Validasi gagal: tidak ada butir TP yang memenuhi syarat kelengkapan data.');
  }

  return validated;
}

/**
 * POST /api/v1/learning/pedagogy/synthesize
 * Endpoint on-demand AI dekonstruksi CP menjadi usulan TP dan ATP
 */
export async function POST(req: NextRequest) {
  const pool = getDbPool();
  const traceId = `trace-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  try {
    const body = await req.json();
    const {
      source_cp_id,
      grade_level = 'Kelas 5 SD',
      academic_year = '2026/2027',
      force_regenerate = false,
      tenant_id = null,
      actor_id = null,
    } = body;

    if (!source_cp_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'source_cp_id' (UUID Capaian Pembelajaran) wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 1. TAHAP REGISTRY GATEKEEPER:
    // Pastikan CP berasal dari registry dan BERSTATUS TERVERIFIKASI
    const cpRes = await pool.query(
      `
      SELECT 
        id, tenant_id, subject_code, subject_name, phase, target_grades,
        element_name, element_code, description, source_origin, source_version,
        verification_status
      FROM learning_outcomes
      WHERE id = $1 AND deleted_at IS NULL
    `,
      [source_cp_id]
    );

    if (cpRes.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Capaian Pembelajaran dengan ID '${source_cp_id}' tidak ditemukan di registry.`,
        },
        { status: 404 }
      );
    }

    const cp = cpRes.rows[0];
    const isEligible =
      cp.verification_status === 'NATIONAL_VERIFIED' ||
      cp.verification_status === 'SCHOOL_VERIFIED';

    if (!isEligible) {
      return NextResponse.json(
        {
          success: false,
          error: `Capaian Pembelajaran '${cp.element_name}' berstatus '${cp.verification_status}'. Hanya CP berstatus NATIONAL_VERIFIED atau SCHOOL_VERIFIED yang boleh dijadikan basis dekonstruksi AI.`,
          source_verification_status: cp.verification_status,
        },
        { status: 422 }
      );
    }

    // 2. TAHAP CACHE KOMPOSIT LOOKUP:
    const cacheKey = crypto
      .createHash('sha256')
      .update(
        `${tenant_id || 'global'}:${cp.id}:${cp.source_version}:${grade_level}:${academic_year}:${NVIDIA_MODEL}:${PROMPT_VERSION}`
      )
      .digest('hex');

    if (!force_regenerate) {
      const cacheCheck = await pool.query(
        `SELECT id, status, raw_response, created_at FROM curriculum_ai_cache WHERE cache_key = $1`,
        [cacheKey]
      );

      if (cacheCheck.rows.length > 0 && cacheCheck.rows[0].status === 'DRAFT_GENERATED') {
        // Ambil baris TP draf aktif yang berelasi
        const activeTpsRes = await pool.query(
          `
          SELECT 
            tp.id, tp.code, tp.competency, tp.bloom_level, tp.content_scope,
            tp.statement, tp.pancasila_profiles, tp.evidence_indicators,
            tp.estimated_hours, tp.publication_status, tp.version,
            atp.semester, atp.sequence_order
          FROM learning_objectives tp
          LEFT JOIN learning_objective_flows atp ON atp.learning_objective_id = tp.id
          WHERE tp.learning_outcome_id = $1
            AND tp.publication_status = 'DRAFT'
            AND tp.is_superseded = false
            AND ($2::uuid IS NULL OR tp.tenant_id = $2::uuid OR tp.tenant_id IS NULL)
          ORDER BY atp.semester ASC, atp.sequence_order ASC, tp.order_index ASC
        `,
          [cp.id, tenant_id]
        );

        if (activeTpsRes.rows.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              cache_hit: true,
              source_cp_id: cp.id,
              source_cp_element: cp.element_name,
              source_verification_status: cp.verification_status,
              grade_level,
              academic_year,
              version: activeTpsRes.rows[0].version,
              proposed_tps_count: activeTpsRes.rows.length,
              proposed_tps: activeTpsRes.rows,
              ai_generation_meta: {
                model_name: NVIDIA_MODEL,
                prompt_version: PROMPT_VERSION,
                trace_id: traceId,
                generated_at: cacheCheck.rows[0].created_at,
              },
            },
            message: 'Mengembalikan rancangan draf TP & ATP tersimpan dari cache.',
          });
        }
      }
    }

    // 3. TAHAP INFERENSI NVIDIA NIM (PROMPT SYNTHESIZER):
    const prompt = buildPedagogicalPrompt({
      subjectName: cp.subject_name,
      phase: cp.phase,
      gradeLevel: grade_level,
      elementName: cp.element_name,
      cpDescription: cp.description,
    });

    const messages = [
      {
        role: 'system',
        content:
          'You are an expert Indonesian educational curriculum analyst. You deconstruct official national learning outcomes into strict JSON learning objectives with Bloom taxonomy.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const rawResponse = await callNvidiaNim(messages);
    const cleanedJson = extractCleanJson(rawResponse);

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(cleanedJson);
    } catch (parseErr: any) {
      throw new Error(`Gagal mem-parsing keluaran AI sebagai JSON: ${parseErr.message}`);
    }

    // 4. TAHAP VALIDASI STRUKTUR PEDAGOGIS:
    const validatedTps = validateGeneratedTps(parsedJson);

    // 5. TAHAP TRANSAKSI DATABASE (PERSISTENSI DRAF & VERSIONING):
    const client = await pool.connect();
    let savedTps: any[] = [];
    let nextVersion = 1;

    try {
      await client.query('BEGIN');

      // Hitung versi draf berikutnya
      const verRes = await client.query(
        `
        SELECT COALESCE(MAX(version), 0) + 1 AS next_version
        FROM learning_objectives
        WHERE learning_outcome_id = $1 AND ($2::uuid IS NULL OR tenant_id = $2::uuid)
      `,
        [cp.id, tenant_id]
      );
      nextVersion = parseInt(verRes.rows[0]?.next_version, 10) || 1;

      // Tandai draf lama sebagai superseded jika regenerasi
      await client.query(
        `
        UPDATE learning_objectives
        SET is_superseded = true, updated_at = NOW()
        WHERE learning_outcome_id = $1
          AND publication_status = 'DRAFT'
          AND is_superseded = false
          AND ($2::uuid IS NULL OR tenant_id = $2::uuid)
      `,
        [cp.id, tenant_id]
      );

      await client.query(
        `
        UPDATE learning_objective_flows
        SET is_superseded = true, updated_at = NOW()
        WHERE learning_objective_id IN (
          SELECT id FROM learning_objectives WHERE learning_outcome_id = $1
        )
        AND publication_status = 'DRAFT'
        AND is_superseded = false
        AND ($2::uuid IS NULL OR tenant_id = $2::uuid)
      `,
        [cp.id, tenant_id]
      );

      const aiMeta = {
        model_name: NVIDIA_MODEL,
        prompt_version: PROMPT_VERSION,
        source_cp_id: cp.id,
        source_cp_version: cp.source_version,
        trace_id: traceId,
        generated_at: new Date().toISOString(),
      };

      // Simpan setiap TP dan pasangkan alur ATP
      for (let i = 0; i < validatedTps.length; i++) {
        const item = validatedTps[i];

        const tpInsert = await client.query(
          `
          INSERT INTO learning_objectives (
            tenant_id,
            learning_outcome_id,
            code,
            competency,
            bloom_level,
            content_scope,
            statement,
            pancasila_profiles,
            evidence_indicators,
            estimated_hours,
            order_index,
            publication_status,
            version,
            is_superseded,
            ai_generation_meta
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'DRAFT', $12, false, $13::jsonb
          )
          RETURNING id, code, competency, bloom_level, content_scope, statement,
                    pancasila_profiles, evidence_indicators, estimated_hours, publication_status, version
        `,
          [
            tenant_id,
            cp.id,
            item.code,
            item.competency,
            item.bloom_level,
            item.content_scope,
            item.statement,
            item.pancasila_profiles,
            item.evidence_indicators,
            item.estimated_hours,
            i + 1,
            nextVersion,
            JSON.stringify(aiMeta),
          ]
        );

        const savedTp = tpInsert.rows[0];

        // Insert ke learning_objective_flows (ATP)
        const atpInsert = await client.query(
          `
          INSERT INTO learning_objective_flows (
            tenant_id,
            learning_objective_id,
            academic_year,
            grade_level,
            semester,
            sequence_order,
            allocated_hours,
            pedagogical_approach,
            publication_status,
            version,
            is_superseded
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9, false
          )
          RETURNING id, semester, sequence_order, allocated_hours
        `,
          [
            tenant_id,
            savedTp.id,
            academic_year,
            grade_level,
            item.suggested_semester,
            item.sequence_order,
            item.estimated_hours,
            item.pedagogical_approach || 'Problem-Based Learning',
            nextVersion,
          ]
        );

        const savedAtp = atpInsert.rows[0];

        savedTps.push({
          ...savedTp,
          semester: savedAtp.semester,
          sequence_order: savedAtp.sequence_order,
        });
      }

      // Catat ke curriculum_ai_cache
      await client.query(
        `
        INSERT INTO curriculum_ai_cache (
          tenant_id, cache_key, source_cp_id, source_cp_version,
          subject_code, phase, grade_level, academic_year,
          model_name, prompt_version, status, raw_response
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DRAFT_GENERATED', $11::jsonb
        )
        ON CONFLICT (cache_key) DO UPDATE
        SET status = 'DRAFT_GENERATED',
            raw_response = EXCLUDED.raw_response,
            created_at = NOW();
      `,
        [
          tenant_id,
          cacheKey,
          cp.id,
          cp.source_version,
          cp.subject_code,
          cp.phase,
          grade_level,
          academic_year,
          NVIDIA_MODEL,
          PROMPT_VERSION,
          JSON.stringify(parsedJson),
        ]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      data: {
        cache_hit: false,
        source_cp_id: cp.id,
        source_cp_element: cp.element_name,
        source_verification_status: cp.verification_status,
        grade_level,
        academic_year,
        version: nextVersion,
        proposed_tps_count: savedTps.length,
        proposed_tps: savedTps,
        ai_generation_meta: {
          model_name: NVIDIA_MODEL,
          prompt_version: PROMPT_VERSION,
          trace_id: traceId,
          generated_at: new Date().toISOString(),
        },
      },
      message: `Berhasil mendekonstruksi CP '${cp.element_name}' menjadi ${savedTps.length} butir usulan TP & ATP (Status: DRAFT v${nextVersion}).`,
    });
  } catch (error: any) {
    console.error(`[Pedagogy Synthesize Error | ${traceId}]:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal memproses dekonstruksi CP dengan AI.',
        trace_id: traceId,
      },
      { status: 500 }
    );
  }
}
