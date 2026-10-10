import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getApiUrl } from '@/lib/api';

export interface SourceMaterial {
  id: string;
  title: string;
  subject_id?: string;
  subject_name?: string;
  material_type?: string;
  source_type?: string;
  description?: string;
  start_page?: number;
  end_page?: number;
  created_at?: string;
}

export type AssignmentGenFormat = 'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR';
export type QuizGenFormat = 'MCQ_ONLY' | 'MCQ_AND_ESSAY';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/ising-calibration-1.5-31b';
const NVIDIA_URL = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Strips choices (e.g. "A. ...", "B) ...") if accidentally written inside question_text by LLM
 */
export function sanitizeQuestionText(raw: string): string {
  if (!raw) return '';
  const lines = raw.split('\n');
  const cleanLines: string[] = [];
  let inOptionsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^([A-Ea-e][\.\)]|\([A-Ea-e]\)|\[[A-Ea-e]\])\s+/.test(trimmed)) {
      inOptionsSection = true;
      continue;
    }
    if (inOptionsSection && trimmed.length === 0) continue;
    if (!inOptionsSection) {
      cleanLines.push(line);
    }
  }

  return cleanLines
    .join('\n')
    .replace(/(?:Pilihan\s+jawaban|Opsi\s+jawaban|Pilihan|Opsi)\s*:?\s*$/i, '')
    .trim();
}

/**
 * Strips duplicate leading letter (e.g. "A. ", "B) ") from choice text
 */
export function sanitizeChoiceText(choice: string): string {
  if (!choice) return '';
  return choice.replace(/^[A-Ea-e][\.\)]\s*/, '').trim();
}

/**
 * Cleans any robotic '(AI NVIDIA NIM)' or 'oleh AI NVIDIA NIM' branding from educational text
 */
export function cleanRobotText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\(AI\s+NVIDIA\s+NIM\)/gi, '')
    .replace(/\s*\(NVIDIA\s+NIM\)/gi, '')
    .replace(/\s*oleh\s+AI\s+NVIDIA\s+NIM/gi, '')
    .replace(/\s*dari\s+AI\s+NVIDIA\s+NIM/gi, '')
    .trim();
}

/**
 * Builds high-resolution educational diagram image URL
 */
export function resolveDiagramUrl(prompt: string): string {
  if (!prompt || prompt.trim().length === 0) return '';
  if (prompt.startsWith('http://') || prompt.startsWith('https://') || prompt.startsWith('data:image')) {
    return prompt;
  }
  const cleanPrompt = prompt
    .replace(/^gambar\s+(seorang\s+|tentang\s+|dari\s+)?/i, '')
    .replace(/^diagram\s+(tentang\s+|dari\s+)?/i, '')
    .replace(/^ilustrasi\s+(tentang\s+|dari\s+)?/i, '')
    .trim();
  const encoded = encodeURIComponent(`${cleanPrompt} educational science diagram infographic clean vector aesthetic`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`;
}

/**
 * Calls NVIDIA NIM API directly with model fallback & 120s timeout
 */
async function callNvidiaNimDirect(messages: Array<{ role: string; content: string }>, maxTokens = 4200): Promise<string> {
  const modelsToTry = [
    NVIDIA_MODEL, // nvidia/ising-calibration-1.5-31b
    'meta/llama-3.2-11b-vision-instruct',
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for large item counts

    try {
      const res = await fetch(NVIDIA_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`NVIDIA NIM (${model}) returned HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`NVIDIA NIM (${model}) returned empty content`);
      }
      return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`Attempt with model '${model}' failed:`, err.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('Semua model NVIDIA NIM gagal merespons.');
}

function extractJson(text: string): any {
  if (!text) throw new Error('Response AI kosong');
  let clean = text.trim();

  // 1. Remove markdown fence blocks if present
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    clean = codeBlockMatch[1].trim();
  } else {
    // 2. Strip standard starting/ending triple backticks
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    clean = clean.trim();

    // 3. Find outermost brackets
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let first = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      first = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      first = firstBrace;
    } else {
      first = firstBracket;
    }

    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    const last = Math.max(lastBrace, lastBracket);

    if (first !== -1 && last > first) {
      clean = clean.substring(first, last + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Remove potential trailing commas before closing braces/brackets
    const relaxed = clean.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(relaxed);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // 'ASSIGNMENT_STRUCTURED' | 'ASSIGNMENT_HOMEWORK' | 'QUIZ_MCQ_ONLY' | 'QUIZ_MCQ_ESSAY' | 'EXAM_MONTHLY'
      subject_id,
      subject_name: inputSubjectName,
      topic: inputTopic,
      grade_level: inputGradeLevel = 'Kelas 5 SD',
      num_questions: inputNumQuestions,
      num_mcq: inputNumMcq,
      num_essay: inputNumEssay,
      include_images = true,
      difficulty: inputDifficulty = 'Sedang',
      source_mode = 'LATEST_PUBLISHED',
      material_ids = [],
      material_data = null,
    } = body;

    if (!subject_id && !material_data?.subject_id) {
      return NextResponse.json(
        { success: false, error: 'Mata pelajaran (subject_id) wajib dipilih agar tidak terjadi kebocoran antar mapel.' },
        { status: 400 }
      );
    }

    const effectiveSubjectId = subject_id || material_data?.subject_id;
    const pool = getDbPool();

    // 1. Resolve subject name if not provided
    let subjectName = inputSubjectName || material_data?.subject_name;
    if (!subjectName && effectiveSubjectId) {
      const subRes = await pool.query('SELECT name FROM subjects WHERE id = $1', [effectiveSubjectId]);
      if (subRes.rows.length > 0) {
        subjectName = subRes.rows[0].name;
      } else {
        subjectName = 'Mata Pelajaran Umum';
      }
    }

    let materials: SourceMaterial[] = [];

    // 2. Fetch or construct source materials based on source_mode
    if (source_mode === 'CURRENT_UNSAVED' && material_data) {
      materials = [
        {
          id: material_data.id || 'temp-material-id',
          title: material_data.title || 'Materi Pembelajaran Baru',
          subject_id: effectiveSubjectId,
          subject_name: subjectName,
          material_type: material_data.material_type || 'document',
          source_type: material_data.source_type,
          description: material_data.description || material_data.instructions || '',
          start_page: material_data.start_page,
          end_page: material_data.end_page,
          created_at: new Date().toISOString(),
        },
      ];
    } else if (source_mode === 'PAST_MONTH' || type === 'EXAM_MONTHLY') {
      const query = `
        SELECT id, title, description, material_type, source_type, start_page, end_page, created_at, subject_id
        FROM learning_materials
        WHERE subject_id = $1 AND is_active = true AND deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
      `;
      const res = await pool.query(query, [effectiveSubjectId]);

      if (res.rows.length === 0) {
        const fallbackRes = await pool.query(
          `SELECT id, title, description, material_type, source_type, start_page, end_page, created_at, subject_id
           FROM learning_materials
           WHERE subject_id = $1 AND is_active = true AND deleted_at IS NULL
           ORDER BY created_at DESC LIMIT 5`,
          [effectiveSubjectId]
        );
        materials = fallbackRes.rows;
      } else {
        materials = res.rows;
      }
    } else if (source_mode === 'SELECTED_IDS' && Array.isArray(material_ids) && material_ids.length > 0) {
      const query = `
        SELECT id, title, description, material_type, source_type, start_page, end_page, created_at, subject_id
        FROM learning_materials
        WHERE id = ANY($1) AND subject_id = $2 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const res = await pool.query(query, [material_ids, effectiveSubjectId]);
      materials = res.rows;
    } else {
      const query = `
        SELECT id, title, description, material_type, source_type, start_page, end_page, created_at, subject_id
        FROM learning_materials
        WHERE subject_id = $1 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const res = await pool.query(query, [effectiveSubjectId]);
      materials = res.rows;
    }

    if (materials.length === 0) {
      materials = [
        {
          id: `curriculum-standard-${effectiveSubjectId}`,
          title: `Kurikulum Standar & Capaian Pembelajaran: ${subjectName}`,
          subject_id: effectiveSubjectId,
          subject_name: subjectName,
          material_type: 'document',
          source_type: 'kemdikbud_curriculum',
          description: `Materi esensial dan kompetensi dasar mata pelajaran ${subjectName} sesuai standar Kurikulum Merdeka.`,
          created_at: new Date().toISOString(),
        },
      ];
    }

    const topic = inputTopic?.trim() || materials.map(m => m.title).slice(0, 2).join(', ') || subjectName;
    const gradeLevel = inputGradeLevel || 'Kelas 5 SD';
    const difficulty = inputDifficulty || 'Sedang';

    // ─────────────────────────────────────────────────────────────────────────
    // 3A. ASSIGNMENT: STRUCTURED (PG + ESSAY)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'ASSIGNMENT_STRUCTURED') {
      const targetMcqCount = Math.max(1, inputNumMcq ?? (inputNumQuestions ? Math.max(1, Math.floor(inputNumQuestions * 0.6)) : 4));
      const targetEssayCount = Math.max(1, inputNumEssay ?? (inputNumQuestions ? Math.max(1, Math.ceil(inputNumQuestions * 0.4)) : 2));

      const systemPrompt = `Anda adalah guru pengembang asesmen Kurikulum Merdeka di Indonesia.
Hasilkan paket penugasan terstruktur yang terdiri dari TEPAT ${targetMcqCount} butir Pilihan Ganda (mcq) dan TEPAT ${targetEssayCount} butir Uraian/Essay (essay).

ATURAN WAJIB FORMAT:
1. "q" HANYA berisi kalimat stimulus dan pertanyaan. DILARANG KERAS menulis huruf A/B/C/D di dalam "q".
2. "a", "b", "c", "d" HANYA berisi teks pilihan tanpa huruf "A.", "B.", dll.
3. "k" adalah huruf kunci jawaban yang benar ("A", "B", "C", atau "D").
4. "rubric" adalah kriteria penilaian singkat untuk soal uraian/essay.
5. ${include_images ? `Sertakan 1-2 butir soal yang memiliki field "img" berupa deskripsi diagram sains, bagan siklus, bagan alur, bangun geometri, grafik, atau peta yang relevan.` : `Field "img" tidak perlu diisi.`}
6. JANGAN gunakan teks branding seperti "(AI NVIDIA NIM)" pada instruksi, rubrik, atau judul.

Format output HARUS berupa JSON murni dengan skema padat:
{
  "title": "Tugas Terstruktur: ${topic}",
  "instructions": "Petunjuk pengerjaan tugas bagi siswa...",
  "mcq": [
    {
      "q": "Pertanyaan pilihan ganda 1...",
      "a": "Opsi A",
      "b": "Opsi B",
      "c": "Opsi C",
      "d": "Opsi D",
      "k": "A",
      "img": "Diagram atau gambar stimulus (opsional)"
    }
  ],
  "essay": [
    {
      "q": "Pertanyaan essay 1...",
      "rubric": "Kriteria penilaian...",
      "img": "Diagram atau gambar stimulus (opsional)"
    }
  ]
}

Output HANYA JSON tanpa teks pengantar atau penutup.`;

      const userPrompt = `Mata pelajaran ${subjectName}, jenjang ${gradeLevel}, topik: "${topic}", kesulitan: ${difficulty}.
Wajib TEPAT ${targetMcqCount} butir soal PG dan TEPAT ${targetEssayCount} butir soal Essay.`;

      const rawContent = await callNvidiaNimDirect([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 4200);

      const parsedAi = extractJson(rawContent);

      const rawMcq = Array.isArray(parsedAi.mcq)
        ? parsedAi.mcq
        : (Array.isArray(parsedAi.mcq_questions) ? parsedAi.mcq_questions : (Array.isArray(parsedAi.questions) ? parsedAi.questions : []));

      const rawEssay = Array.isArray(parsedAi.essay)
        ? parsedAi.essay
        : (Array.isArray(parsedAi.essay_questions) ? parsedAi.essay_questions : (Array.isArray(parsedAi.tasks) ? parsedAi.tasks : []));

      const mcqPoints = rawMcq.length > 0
        ? Math.max(1, Math.round((rawEssay.length > 0 ? 60 : 100) / rawMcq.length))
        : 5;
      const essayPoints = rawEssay.length > 0
        ? Math.max(1, Math.round((rawMcq.length > 0 ? 40 : 100) / rawEssay.length))
        : 10;

      const structuredQuestions: any[] = [];
      const nowTs = Date.now();

      // 1. Multiple Choice Questions
      rawMcq.forEach((q: any, idx: number) => {
        const questionText = sanitizeQuestionText(q.q || q.question_text || q.text || '');
        let choices: any[] = [];

        if (q.a !== undefined && q.b !== undefined && q.c !== undefined && q.d !== undefined) {
          const key = (q.k || q.correct_key || 'A').toUpperCase().trim();
          choices = [
            { choice_text: sanitizeChoiceText(String(q.a)), is_correct: key === 'A' },
            { choice_text: sanitizeChoiceText(String(q.b)), is_correct: key === 'B' },
            { choice_text: sanitizeChoiceText(String(q.c)), is_correct: key === 'C' },
            { choice_text: sanitizeChoiceText(String(q.d)), is_correct: key === 'D' },
          ];
        } else if (q.options && typeof q.options === 'object') {
          const correctKey = (q.correct_key || q.k || 'A').toUpperCase().trim();
          choices = Object.entries(q.options).map(([k, v]) => ({
            choice_text: sanitizeChoiceText(String(v)),
            is_correct: k.toUpperCase().trim() === correctKey,
          }));
        } else if (Array.isArray(q.choices)) {
          choices = q.choices.map((c: any) => ({
            choice_text: sanitizeChoiceText(typeof c === 'string' ? c : (c.choice_text || c.text || '')),
            is_correct: typeof c === 'object' ? Boolean(c.is_correct || c.isCorrect) : false,
          }));
        }

        const imgPrompt = q.img || q.image_prompt;
        const diagramUrl = imgPrompt ? resolveDiagramUrl(imgPrompt) : (q.image_url || undefined);

        structuredQuestions.push({
          id: `task-mcq-${idx + 1}-${nowTs}`,
          question_text: questionText,
          question_type: 'MULTIPLE_CHOICE',
          points: mcqPoints,
          image_url: diagramUrl,
          choices,
          explanation: cleanRobotText(q.exp || q.explanation || 'Pembahasan Kunci Jawaban.'),
        });
      });

      // 2. Essay Questions
      rawEssay.forEach((q: any, idx: number) => {
        const questionText = sanitizeQuestionText(typeof q === 'string' ? q : (q.q || q.question_text || q.text || ''));
        const imgPrompt = typeof q === 'object' ? (q.img || q.image_prompt) : undefined;
        const diagramUrl = imgPrompt ? resolveDiagramUrl(imgPrompt) : (typeof q === 'object' ? q.image_url : undefined);
        const rubricText = typeof q === 'object' ? (q.rubric || q.exp || parsedAi.rubric || 'Rubrik Penilaian Objektif.') : (parsedAi.rubric || 'Rubrik Penilaian Objektif.');

        structuredQuestions.push({
          id: `task-essay-${idx + 1}-${nowTs}`,
          question_text: questionText,
          question_type: 'ESSAY',
          points: essayPoints,
          image_url: diagramUrl,
          choices: [],
          explanation: cleanRobotText(rubricText),
        });
      });

      const cleanInstructions = cleanRobotText(
        parsedAi.instructions
          ? `${parsedAi.instructions}\n\nRubrik Penilaian Objektif:\n${cleanRobotText(parsedAi.rubric || 'Penilaian berdasarkan kebenaran konsep, kelengkapan analisis, dan penalaran sistematis.')}`
          : 'Kerjakan seluruh butir soal pilihan ganda dan uraian/essay berikut dengan teliti.'
      );

      const result = {
        title: cleanRobotText(parsedAi.title || `Tugas Terstruktur: ${topic}`),
        assignment_type: 'STRUCTURED_QUESTIONS',
        instructions: cleanInstructions,
        questions: structuredQuestions,
        subject_id: effectiveSubjectId,
        subject_name: subjectName,
        source_materials: materials.map(m => ({ id: m.id, title: m.title, type: m.material_type || 'document' })),
      };

      return NextResponse.json({ success: true, data: result });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3B. ASSIGNMENT: HOMEWORK PR / LEMBAR KERJA
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'ASSIGNMENT_HOMEWORK') {
      const targetCount = Math.max(1, inputNumEssay || inputNumQuestions || 3);
      const systemPrompt = `Anda adalah guru pengembang tugas mandiri Kurikulum Merdeka di Indonesia.
Buatkan LEMBAR TUGAS MANDIRI / PR untuk jenjang ${gradeLevel} mata pelajaran ${subjectName} topik "${topic}".
Sertakan tepat ${targetCount} butir tugas aplikatif mandiri.
JANGAN gunakan label "(AI NVIDIA NIM)". Gunakan "Rubrik Penilaian Objektif:".

Format output HARUS berupa JSON murni dengan skema:
{
  "title": "Tugas Mandiri: ${topic}",
  "instructions": "Petunjuk pengerjaan tugas mandiri...",
  "tasks": [
    "Tugas 1: ...",
    "Tugas 2: ..."
  ],
  "rubric": "Kriteria penilaian objektif tugas mandiri..."
}
Output HANYA JSON.`;

      const rawContent = await callNvidiaNimDirect([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Buatkan tugas mandiri dengan tepat ${targetCount} butir tugas.` },
      ], 2500);

      const parsedAi = extractJson(rawContent);

      const tasks = Array.isArray(parsedAi.tasks) ? parsedAi.tasks : [];
      const pts = Math.max(10, Math.floor(100 / Math.max(1, tasks.length)));
      const nowTs = Date.now();

      const questions = tasks.map((t: string, idx: number) => ({
        id: `homework-${idx + 1}-${nowTs}`,
        question_text: sanitizeQuestionText(t),
        question_type: 'ESSAY',
        points: pts,
        choices: [],
        explanation: cleanRobotText(parsedAi.rubric || 'Rubrik Penilaian Objektif.'),
      }));

      const cleanInstructions = cleanRobotText(
        `${parsedAi.instructions || 'Kerjakan tugas mandiri berikut dengan teliti.'}\n\nRubrik Penilaian Objektif:\n${cleanRobotText(parsedAi.rubric || '')}`
      );

      const result = {
        title: cleanRobotText(parsedAi.title || `Tugas Mandiri: ${topic}`),
        assignment_type: 'HOMEWORK_PR',
        instructions: cleanInstructions,
        questions,
        subject_id: effectiveSubjectId,
        subject_name: subjectName,
        source_materials: materials.map(m => ({ id: m.id, title: m.title, type: m.material_type || 'document' })),
      };

      return NextResponse.json({ success: true, data: result });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3C. CBT QUIZ / EXAM (MCQ ONLY or MCQ + ESSAY)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'QUIZ_MCQ_ONLY' || type === 'QUIZ_MCQ_ESSAY' || type === 'EXAM_MONTHLY') {
      const isMonthly = type === 'EXAM_MONTHLY';
      const isMcqOnly = type === 'QUIZ_MCQ_ONLY' || body.format === 'MCQ_ONLY';

      const targetMcqCount = isMcqOnly
        ? Math.max(1, inputNumMcq ?? (inputNumQuestions || (isMonthly ? 10 : 5)))
        : Math.max(1, inputNumMcq ?? (isMonthly ? 10 : 5));

      const targetEssayCount = isMcqOnly
        ? 0
        : Math.max(1, inputNumEssay ?? (isMonthly ? 5 : 2));

      const systemPrompt = `Anda adalah tim pembuat bank soal ujian CBT resmi sekolah (Kurikulum Merdeka).
Buatkan paket soal ujian untuk jenjang ${gradeLevel} mata pelajaran ${subjectName} topik "${topic}" tingkat kesulitan ${difficulty}.

KOMPOSISI SOAL:
- Soal Pilihan Ganda (mcq): TEPAT ${targetMcqCount} butir soal (opsi a-d, kunci k).
${!isMcqOnly ? `- Soal Uraian / Essay (essay): TEPAT ${targetEssayCount} butir soal analitis/HOTS.` : `- TIDAK ADA soal essay.`}

ATURAN WAJIB FORMAT:
1. "q" HANYA berisi kalimat stimulus dan pertanyaan. DILARANG KERAS menuliskan opsi A/B/C/D di dalam "q".
2. Pada "a", "b", "c", "d", HANYA tuliskan isi teks pilihan tanpa mengulang huruf opsi A/B/C/D.
3. "k" adalah huruf kunci jawaban ("A", "B", "C", atau "D").
4. ${include_images ? `Sertakan 1-2 butir soal yang memiliki field "img" berupa deskripsi diagram sains, bagan siklus, bangun geometri, grafik, atau peta yang relevan.` : `Field "img" tidak perlu diisi.`}
5. JANGAN gunakan teks branding seperti "(AI NVIDIA NIM)" pada judul, deskripsi, atau pembahasan.

Format output HARUS berupa JSON murni dengan skema padat:
{
  "title": "${isMonthly ? 'Ujian Bulanan CBT' : 'Kuis CBT'}: ${topic}",
  "description": "Paket soal CBT resmi Kurikulum Merdeka materi ${topic}.",
  "mcq": [
    {
      "q": "Kalimat stimulus dan pertanyaan...",
      "a": "Teks opsi A",
      "b": "Teks opsi B",
      "c": "Teks opsi C",
      "d": "Teks opsi D",
      "k": "B",
      "exp": "Pembahasan jawaban...",
      "img": "Diagram atau gambar stimulus visual (opsional)"
    }
  ],
  "essay": [
    {
      "q": "Kalimat pertanyaan essay/uraian...",
      "rubric": "Kriteria penilaian jawaban essay...",
      "img": "Diagram atau gambar stimulus visual (opsional)"
    }
  ]
}

Output HANYA JSON tanpa teks pengantar atau penutup.`;

      const rawContent = await callNvidiaNimDirect([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Mata pelajaran ${subjectName}, jenjang ${gradeLevel}, topik: "${topic}". Wajib tepat ${targetMcqCount} butir PG dan ${targetEssayCount} butir Essay.` },
      ], 4200);

      const parsedAi = extractJson(rawContent);

      const rawMcq = Array.isArray(parsedAi.mcq)
        ? parsedAi.mcq
        : (Array.isArray(parsedAi.mcq_questions) ? parsedAi.mcq_questions : (Array.isArray(parsedAi.questions) ? parsedAi.questions : []));

      const rawEssay = Array.isArray(parsedAi.essay)
        ? parsedAi.essay
        : (Array.isArray(parsedAi.essay_questions) ? parsedAi.essay_questions : []);

      const mcqWeight = isMcqOnly
        ? Math.max(1, Math.round(100 / Math.max(1, rawMcq.length)))
        : Math.max(1, Math.round((rawEssay.length > 0 ? 65 : 100) / Math.max(1, rawMcq.length)));

      const essayWeight = isMcqOnly
        ? 0
        : Math.max(1, Math.round((rawMcq.length > 0 ? 35 : 100) / Math.max(1, rawEssay.length)));

      const generatedQuestions: any[] = [];
      const nowTs = Date.now();

      // 1. Multiple Choice Questions
      rawMcq.forEach((q: any, idx: number) => {
        const cleanQuestion = sanitizeQuestionText(q.q || q.question_text || q.text || '');
        let choices: any[] = [];

        if (q.a !== undefined && q.b !== undefined && q.c !== undefined && q.d !== undefined) {
          const key = (q.k || q.correct_key || 'A').toUpperCase().trim();
          choices = [
            { choice_text: sanitizeChoiceText(String(q.a)), is_correct: key === 'A' },
            { choice_text: sanitizeChoiceText(String(q.b)), is_correct: key === 'B' },
            { choice_text: sanitizeChoiceText(String(q.c)), is_correct: key === 'C' },
            { choice_text: sanitizeChoiceText(String(q.d)), is_correct: key === 'D' },
          ];
        } else if (q.options && typeof q.options === 'object') {
          const correctKey = (q.correct_key || q.k || 'A').toUpperCase().trim();
          choices = Object.entries(q.options).map(([k, v]) => ({
            choice_text: sanitizeChoiceText(String(v)),
            is_correct: k.toUpperCase().trim() === correctKey,
          }));
        } else if (Array.isArray(q.choices)) {
          choices = q.choices.map((c: any) => ({
            choice_text: sanitizeChoiceText(typeof c === 'string' ? c : (c.choice_text || c.text || '')),
            is_correct: typeof c === 'object' ? Boolean(c.is_correct || c.isCorrect) : false,
          }));
        }

        const imgPrompt = q.img || q.image_prompt;
        const diagramUrl = imgPrompt ? resolveDiagramUrl(imgPrompt) : (q.image_url || undefined);

        generatedQuestions.push({
          id: `cbt-mcq-${idx + 1}-${nowTs}`,
          question_text: cleanQuestion,
          question_type: 'MULTIPLE_CHOICE',
          points: mcqWeight,
          image_url: diagramUrl,
          choices,
          explanation: cleanRobotText(q.exp || q.explanation || 'Pembahasan Kunci Jawaban.'),
        });
      });

      // 2. Essay Questions
      rawEssay.forEach((q: any, idx: number) => {
        const questionText = sanitizeQuestionText(typeof q === 'string' ? q : (q.q || q.question_text || q.text || ''));
        const imgPrompt = typeof q === 'object' ? (q.img || q.image_prompt) : undefined;
        const diagramUrl = imgPrompt ? resolveDiagramUrl(imgPrompt) : (typeof q === 'object' ? q.image_url : undefined);

        generatedQuestions.push({
          id: `cbt-essay-${idx + 1}-${nowTs}`,
          question_text: questionText,
          question_type: 'ESSAY',
          points: essayWeight,
          image_url: diagramUrl,
          choices: [],
          explanation: cleanRobotText(typeof q === 'object' ? (q.rubric || q.exp || 'Rubrik Penilaian Objektif.') : 'Rubrik Penilaian Objektif.'),
        });
      });

      const result = {
        title: cleanRobotText(parsedAi.title || (isMonthly ? `Ujian Bulanan CBT: ${subjectName}` : `Kuis Pembelajaran: ${subjectName}`)),
        description: cleanRobotText(parsedAi.description || `Paket soal CBT resmi Kurikulum Merdeka materi ${subjectName}.`),
        format: isMcqOnly ? 'MCQ_ONLY' : 'MCQ_AND_ESSAY',
        time_limit_minutes: isMonthly ? 90 : 45,
        passing_score: 75,
        questions: generatedQuestions,
        subject_id: effectiveSubjectId,
        subject_name: subjectName,
        is_monthly_exam: isMonthly,
        source_materials: materials.map(m => ({ id: m.id, title: m.title, type: m.material_type || 'document' })),
      };

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: `Tipe pembuatan '${type}' tidak dikenal.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Auto-generate error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan dalam membuat tugas/kuis otomatis.' },
      { status: 500 }
    );
  }
}
