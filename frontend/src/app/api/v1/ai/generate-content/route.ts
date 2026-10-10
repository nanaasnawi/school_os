import { NextRequest, NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/ising-calibration-1.5-31b';
const NVIDIA_URL = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';

async function callNvidiaNim(messages: Array<{ role: string; content: string }>, maxTokens = 2500): Promise<string> {
  const models = [
    NVIDIA_MODEL,
    'meta/llama-3.2-11b-vision-instruct',
  ];

  let lastError: Error | null = null;
  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`NVIDIA NIM returned HTTP ${res.status}: ${errBody}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('NVIDIA NIM returned empty choices content');
      }
      return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`[NVIDIA NIM] Model ${model} failed:`, err.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('Gagal menghubungi layanan NVIDIA NIM AI.');
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = 'INFOGRAPHIC',
      topic = '',
      subject_name = 'Umum',
      grade_level = 'Kelas 5 SD',
      num_questions = 5,
      difficulty = 'Sedang',
    } = body;

    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      return NextResponse.json(
        { success: false, error: 'Topik materi pembelajaran wajib diisi' },
        { status: 400 }
      );
    }

    const cleanSubject = subject_name.trim() || 'Umum';
    const cleanGrade = grade_level.trim() || 'Semua Jenjang';
    const cleanMode = (mode || 'INFOGRAPHIC').toUpperCase();

    if (cleanMode === 'INFOGRAPHIC') {
      const prompt = `Anda adalah pendidik spesialis penyusun media pembelajaran visual Kurikulum Merdeka di Indonesia.
Buatkan materi INFOGRAFIS INTERAKTIF untuk siswa jenjang ${cleanGrade} pada mata pelajaran ${cleanSubject} dengan topik: "${cleanTopic}".

Format output HARUS berupa JSON murni dengan skema:
{
  "title": "Judul Infografis Menarik",
  "description": "Deskripsi singkat modul 1-2 kalimat.",
  "cards": [
    {
      "step_number": 1,
      "headline": "Judul Poin Visual 1",
      "summary": "Penjelasan ringkas 2-3 kalimat yang mudah dipahami.",
      "image_suggestion": "Deskripsi ide ilustrasi atau diagram yang cocok"
    },
    {
      "step_number": 2,
      "headline": "Judul Poin Visual 2",
      "summary": "Penjelasan ringkas 2-3 kalimat yang mudah dipahami.",
      "image_suggestion": "Deskripsi ide ilustrasi atau diagram yang cocok"
    },
    {
      "step_number": 3,
      "headline": "Judul Poin Visual 3",
      "summary": "Penjelasan ringkas 2-3 kalimat yang mudah dipahami.",
      "image_suggestion": "Deskripsi ide ilustrasi atau diagram yang cocok"
    },
    {
      "step_number": 4,
      "headline": "Kesimpulan & Tahukah Kamu?",
      "summary": "Fakta menarik dan intisari penting untuk diingat siswa.",
      "image_suggestion": "Deskripsi ide ilustrasi atau diagram yang cocok"
    }
  ]
}

Output HANYA JSON tanpa teks pembuka/penutup.`;

      const raw = await callNvidiaNim([
        { role: 'system', content: 'You are an educational designer creating structured infographic cards in strict JSON.' },
        { role: 'user', content: prompt }
      ], 2000);

      const parsed = JSON.parse(extractCleanJson(raw));
      const nowTs = Date.now();
      const blocks: any[] = [];

      // Hero Cover Image
      const topicSlug = cleanTopic.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, '%20');
      blocks.push({
        id: `ai-block-hero-cover-${nowTs}`,
        type: 'IMAGE',
        content: `https://image.pollinations.ai/prompt/${topicSlug}%20educational%20infographic%20magazine%20cover%20vibrant%20clean%20aesthetic?width=1200&height=630&nologo=true`
      });

      for (let i = 0; i < (parsed.cards || []).length; i++) {
        const card = parsed.cards[i];
        if (card.image_suggestion && card.image_suggestion.trim()) {
          const imgSlug = card.image_suggestion.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, '%20');
          blocks.push({
            id: `ai-block-img-${i + 1}-${nowTs}`,
            type: 'IMAGE',
            content: `https://image.pollinations.ai/prompt/${imgSlug}%20educational%20magazine%20illustration%20vibrant%20clean?width=1000&height=600&nologo=true`
          });
        }
        blocks.push({
          id: `ai-block-text-${i + 1}-${nowTs}`,
          type: 'TEXT',
          content: `### 📌 ${card.step_number || i + 1}. ${card.headline}\n\n${card.summary}`
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          mode: 'INFOGRAPHIC',
          infographic: {
            title: parsed.title || cleanTopic,
            description: parsed.description || `Materi infografis ${cleanSubject}`,
            blocks
          }
        }
      });
    }

    if (cleanMode === 'ARTICLE') {
      const prompt = `Anda adalah guru ahli Kurikulum Merdeka di Indonesia.
Tuliskan naskah ARTIKEL PEMBELAJARAN lengkap untuk jenjang ${cleanGrade} mata pelajaran ${cleanSubject} dengan topik: "${cleanTopic}".

Format output HARUS berupa JSON murni dengan skema:
{
  "title": "Judul Naskah Pembelajaran",
  "description": "Deskripsi pengantar singkat 1-2 kalimat.",
  "markdown_article": "Isi lengkap artikel berformat Markdown terstruktur:\\n# Judul\\n## 1. Pengantar & Apersepsi Menarik\\n## 2. Pembahasan Konsep Inti\\n## 3. Contoh Nyata & Aplikasi\\n## 4. Rangkuman Intisari\\n## 5. Glosarium / Kamus Kata Sulit"
}

Output HANYA JSON tanpa teks lain.`;

      const raw = await callNvidiaNim([
        { role: 'system', content: 'You are an expert Indonesian teacher creating educational articles in strict JSON.' },
        { role: 'user', content: prompt }
      ], 2500);

      const parsed = JSON.parse(extractCleanJson(raw));
      return NextResponse.json({
        success: true,
        data: {
          mode: 'ARTICLE',
          article: {
            title: parsed.title || cleanTopic,
            description: parsed.description || `Artikel pembelajaran ${cleanSubject}`,
            article_content: parsed.markdown_article || ''
          }
        }
      });
    }

    if (cleanMode === 'ASSIGNMENT') {
      const prompt = `Anda adalah guru pengembang tugas siswa Kurikulum Merdeka.
Buatkan LEMBAR PENUGASAN SISWA untuk jenjang ${cleanGrade} mata pelajaran ${cleanSubject} dengan topik: "${cleanTopic}".

Format output HARUS berupa JSON murni dengan skema:
{
  "title": "Judul Tugas Siswa",
  "instructions": "Petunjuk pengerjaan langkah demi langkah bagi siswa.",
  "tasks": [
    "Tugas 1: ...",
    "Tugas 2: ...",
    "Tugas 3: ..."
  ],
  "rubric": "Rubrik penilaian objektif (Skala 1-100 dengan indikator Sangat Baik, Baik, Cukup)."
}

Output HANYA JSON tanpa teks lain.`;

      const raw = await callNvidiaNim([
        { role: 'system', content: 'You are an educational assessor creating student assignments in strict JSON.' },
        { role: 'user', content: prompt }
      ], 2000);

      const parsed = JSON.parse(extractCleanJson(raw));
      return NextResponse.json({
        success: true,
        data: {
          mode: 'ASSIGNMENT',
          assignment: parsed
        }
      });
    }

    if (cleanMode === 'QUIZ') {
      const numQ = Math.max(1, Math.min(15, num_questions || 5));
      const prompt = `Anda adalah tim pembuat soal ujian CBT resmi sekolah (Kurikulum Merdeka).
Buatkan ${numQ} butir soal pilihan ganda (opsi A-D) untuk jenjang ${cleanGrade} mata pelajaran ${cleanSubject} dengan topik: "${cleanTopic}" tingkat kesulitan: ${difficulty}.

Format output HARUS berupa JSON murni dengan skema:
{
  "title": "Paket Soal CBT: ${cleanTopic}",
  "description": "Ujian pilihan ganda ${numQ} butir soal materi ${cleanTopic}.",
  "questions": [
    {
      "question_text": "Teks soal yang jelas...",
      "options": {
        "A": "Pilihan A",
        "B": "Pilihan B",
        "C": "Pilihan C",
        "D": "Pilihan D"
      },
      "correct_key": "A",
      "explanation": "Penjelasan mengapa jawaban tersebut benar...",
      "bloom_level": "C3",
      "points": 20
    }
  ]
}

Output HANYA JSON tanpa teks lain.`;

      const raw = await callNvidiaNim([
        { role: 'system', content: 'You are an exam creator making high quality multiple-choice tests in strict JSON.' },
        { role: 'user', content: prompt }
      ], 2500);

      const parsed = JSON.parse(extractCleanJson(raw));
      const questions = (parsed.questions || []).map((q: any, i: number) => ({
        id: `q-${i + 1}-${Date.now()}`,
        question_text: q.question_text || `Soal ${i + 1}`,
        choices: [
          { choice_text: q.options?.A || 'A', is_correct: q.correct_key === 'A' },
          { choice_text: q.options?.B || 'B', is_correct: q.correct_key === 'B' },
          { choice_text: q.options?.C || 'C', is_correct: q.correct_key === 'C' },
          { choice_text: q.options?.D || 'D', is_correct: q.correct_key === 'D' },
        ],
        correct_key: q.correct_key || 'A',
        explanation: q.explanation || '',
        bloom_level: q.bloom_level || 'C2',
        points: q.points || Math.round(100 / numQ)
      }));

      return NextResponse.json({
        success: true,
        data: {
          mode: 'QUIZ',
          quiz: {
            title: parsed.title || `Kuis: ${cleanTopic}`,
            description: parsed.description || '',
            questions
          }
        }
      });
    }

    return NextResponse.json(
      { success: false, error: `Mode '${mode}' tidak didukung` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[AI Content Generation Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem saat menyusun materi dengan AI' },
      { status: 500 }
    );
  }
}
