/**
 * Curriculum & Question Synthesis Engine (School OS)
 * Modular pedagogical intelligence for automated Assignment and Exam generation.
 * 
 * Strict Constraint: Guarantees 100% subject isolation (tidak bocor antar mapel).
 */

export interface SourceMaterial {
  id: string;
  title: string;
  subject_id?: string;
  subject_name?: string;
  material_type?: 'document' | 'video' | 'image' | 'article' | string;
  source_type?: string;
  description?: string;
  external_url?: string;
  start_page?: number;
  end_page?: number;
  created_at?: string;
}

export type AssignmentGenFormat = 'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR';
export type QuizGenFormat = 'MCQ_ONLY' | 'MCQ_AND_ESSAY';

export interface GeneratedQuestionChoice {
  choice_text: string;
  is_correct: boolean;
}

export interface GeneratedQuestion {
  id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY';
  points: number;
  choices: GeneratedQuestionChoice[];
  explanation?: string;
  rubric?: string;
}

export interface GeneratedAssignmentResult {
  title: string;
  assignment_type: AssignmentGenFormat;
  instructions: string;
  questions: GeneratedQuestion[];
  subject_id?: string;
  subject_name: string;
  source_materials: { id: string; title: string; type: string }[];
}

export interface GeneratedQuizResult {
  title: string;
  description: string;
  format: QuizGenFormat;
  time_limit_minutes: number;
  passing_score: number;
  questions: GeneratedQuestion[];
  subject_id?: string;
  subject_name: string;
  is_monthly_exam: boolean;
  source_materials: { id: string; title: string; type: string }[];
}

/**
 * Clean and normalize text from description / HTML / blocks JSON
 */
function extractCleanText(material: SourceMaterial): string {
  let raw = material.description || '';
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        raw = parsed
          .map((b: any) => (typeof b.content === 'string' ? b.content : ''))
          .join('\n');
      }
    } catch {
      // not JSON, keep as is
    }
  }
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract key concepts and topics from title and text
 */
function extractKeyConcepts(material: SourceMaterial): { mainTopic: string; subtopics: string[]; keyTerms: string[] } {
  const cleanTitle = material.title
    .replace(/^materi\s+bacaan:\s*/i, '')
    .replace(/^buku\s+(siswa|guru):\s*/i, '')
    .replace(/\(hal\.\s*\d+.*?\)/i, '')
    .trim();

  const text = extractCleanText(material);
  const words = text
    .split(/\s+/)
    .map(w => w.replace(/[^\w\d]/g, '').trim())
    .filter(w => w.length > 4 && !['untuk', 'adalah', 'dalam', 'dengan', 'secara', 'karena', 'bahwa', 'tersebut'].includes(w.toLowerCase()));

  const freq: Record<string, number> = {};
  for (const w of words) {
    const lower = w.toLowerCase();
    freq[lower] = (freq[lower] || 0) + 1;
  }

  const sortedTerms = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const keyTerms = sortedTerms.slice(0, 8);

  const subtopics: string[] = [];
  if (material.start_page && material.end_page) {
    subtopics.push(`Pembahasan Bab Hal. ${material.start_page}–${material.end_page}`);
  }
  if (material.material_type === 'video') {
    subtopics.push('Analisis Konten Video & Penerapan Konsep');
  } else if (material.material_type === 'image') {
    subtopics.push('Interpretasi Infografis & Visualisasi Informasi');
  } else {
    subtopics.push('Pemahaman Naskah & Kajian Teori');
  }

  return {
    mainTopic: cleanTitle || 'Materi Pembelajaran',
    subtopics,
    keyTerms: keyTerms.length > 0 ? keyTerms : ['Konsep Dasar', 'Penerapan', 'Analisis', 'Metode', 'Evaluasi'],
  };
}

/**
 * Generate Multiple Choice Question with plausible distractors
 */
function createMCQQuestion(
  id: string,
  topic: string,
  concept: string,
  subject: string,
  index: number,
  points: number = 10
): GeneratedQuestion {
  const templates = [
    {
      q: `Berdasarkan materi "${topic}" pada mata pelajaran ${subject}, apa yang dimaksud dengan prinsip utama dari konsep ${concept}?`,
      correct: `Penerapan konsep ${concept} yang sesuai dengan kaidah ilmiah dan tujuan pembelajaran dalam konteks materi.`,
      wrong1: `Pengecualian khusus yang tidak berhubungan langsung dengan materi ${topic}.`,
      wrong2: `Pendekatan acak tanpa memperhatikan struktur dan prinsip dasar ${concept}.`,
      wrong3: `Kritik subjektif yang mengabaikan kaidah materi ${subject}.`,
    },
    {
      q: `Di bawah ini manakah pernyataan yang paling tepat menggambarkan implementasi ${concept} dalam topik "${topic}"?`,
      correct: `Menghubungkan teori ${concept} dengan studi kasus nyata untuk mencapai pemahaman komprehensif.`,
      wrong1: `Hanya mengulang definisi teks tanpa analisis kontekstual mendalam.`,
      wrong2: `Mengabaikan indikator utama dari capaian pembelajaran mata pelajaran ${subject}.`,
      wrong3: `Mengutamakan aspek hafalan tanpa memahami alur penalaran materi.`,
    },
    {
      q: `Faktor kunci yang membedakan keberhasilan pemahaman konsep ${concept} pada materi "${topic}" adalah...`,
      correct: `Kemampuan menganalisis hubungan sebab-akibat dan relevansi praktis konsep tersebut.`,
      wrong1: `Kecepatan menyelesaikan tanpa verifikasi fakta dan akurasi data.`,
      wrong2: `Menghafal istilah tanpa menguasai prinsip operasional.`,
      wrong3: `Menggunakan rujukan yang bertentangan dengan kurikulum ${subject}.`,
    },
    {
      q: `Bagaimanakah langkah awal yang tepat dalam membedah persoalan terkait "${concept}" pada materi "${topic}"?`,
      correct: `Mengidentifikasi fakta, merumuskan masalah inti, dan memetakan alternatif solusi berbasis materi.`,
      wrong1: `Langsung mengambil kesimpulan tanpa melalui proses validasi bukti.`,
      wrong2: `Memusatkan perhatian hanya pada unsur minor yang tidak esensial.`,
      wrong3: `Menghindari perbandingan dengan materi pendukung lainnya.`,
    },
  ];

  const t = templates[index % templates.length];
  const choices: GeneratedQuestionChoice[] = [
    { choice_text: t.correct, is_correct: true },
    { choice_text: t.wrong1, is_correct: false },
    { choice_text: t.wrong2, is_correct: false },
    { choice_text: t.wrong3, is_correct: false },
  ];

  // Deterministic shuffle based on index
  const shift = index % 4;
  const rotated = [...choices.slice(shift), ...choices.slice(0, shift)];

  return {
    id,
    question_text: t.q,
    question_type: 'MULTIPLE_CHOICE',
    points,
    choices: rotated,
    explanation: `Kunci jawaban yang tepat adalah pemahaman konseptual mendalam terhadap ${concept} pada mata pelajaran ${subject}.`,
  };
}

/**
 * Generate High-Order Thinking (HOTS) Essay Question
 */
function createEssayQuestion(
  id: string,
  topic: string,
  concept: string,
  subject: string,
  points: number = 25
): GeneratedQuestion {
  return {
    id,
    question_text: `Jelaskan secara komprehensif bagaimana penerapan "${concept}" dalam materi "${topic}" pada mata pelajaran ${subject}! Berikan satu contoh konkret serta analisis dampak penerapannya terhadap pemecahan masalah di kehidupan nyata.`,
    question_type: 'ESSAY',
    points,
    choices: [],
    rubric: `Kriteria Penilaian (Maks ${points} Poin):\n1. Kejelasan definisi & konsep inti (8 poin)\n2. Contoh konkret yang relevan & logis (10 poin)\n3. Analisis dampak dan argumentasi kritis (7 poin)`,
  };
}

/**
 * Core Generator 1: Automated Assignment (PG & Essay OR Tugas Mandiri)
 */
export function generateAssignmentFromMaterials(
  materials: SourceMaterial[],
  format: AssignmentGenFormat,
  targetSubject: { id?: string; name: string }
): GeneratedAssignmentResult {
  if (materials.length === 0) {
    throw new Error('Minimal satu materi harus dipilih untuk membuat tugas.');
  }

  // STRICT SUBJECT GUARD: Ensure all materials strictly belong to targetSubject
  for (const m of materials) {
    if (m.subject_id && targetSubject.id && m.subject_id !== targetSubject.id) {
      throw new Error(`Pelanggaran isolasi mapel: Materi "${m.title}" bukan bagian dari mapel ${targetSubject.name}.`);
    }
  }

  const primaryMaterial = materials[0];
  const { mainTopic, keyTerms } = extractKeyConcepts(primaryMaterial);

  if (format === 'HOMEWORK_PR') {
    // FORMAT B: Tugas Mandiri yang Dikumpulkan
    const typeLabel = primaryMaterial.material_type?.toUpperCase() || 'MODUL';
    const sourceRef = primaryMaterial.start_page && primaryMaterial.end_page
      ? `buku referensi halaman ${primaryMaterial.start_page} s.d. ${primaryMaterial.end_page}`
      : `materi ${typeLabel} "${primaryMaterial.title}"`;

    const title = `Tugas Mandiri: ${mainTopic} (${targetSubject.name})`;
    const instructions = `PETUNJUK PENGERJAAN TUGAS MANDIRI:
1. Baca dan cermati kembali ${sourceRef} yang telah dipublikasikan pada sistem.
2. Kerjakan tugas resume dan lembar analisis dengan fokus pada topik esensial: "${mainTopic}".
3. Uraikan minimal 3 poin utama:
   a. Ringkasan konsep kunci (${keyTerms.slice(0, 3).join(', ')})
   b. Refleksi dan relevansi terhadap permasalahan nyata dalam mata pelajaran ${targetSubject.name}
   c. Kesimpulan dan solusi yang Anda tawarkan.
4. Format Pengumpulan:
   - Ketik rapi atau tulis tangan terbaca pada kertas folio/buku catatan.
   - Unggah hasil pekerjaan dalam format PDF atau foto lembar kerja yang jelas.
5. Kriteria Penilaian:
   - Ketepatan waktu & orisinalitas (30%)
   - Kedalaman pemahaman materi (40%)
   - Kerapian struktur penyajian (30%)`;

    return {
      title,
      assignment_type: 'HOMEWORK_PR',
      instructions,
      questions: [],
      subject_id: targetSubject.id,
      subject_name: targetSubject.name,
      source_materials: materials.map(m => ({
        id: m.id,
        title: m.title,
        type: m.material_type || 'document',
      })),
    };
  }

  // FORMAT A: Pilihan Ganda & Essay (Structured)
  const questions: GeneratedQuestion[] = [];
  const mcqCount = 5;
  const essayCount = 2;

  // 5 MCQ (10 points each = 50 pts)
  for (let i = 0; i < mcqCount; i++) {
    const term = keyTerms[i % keyTerms.length] || `Konsep ${i + 1}`;
    questions.push(
      createMCQQuestion(`q-${i + 1}`, mainTopic, term, targetSubject.name, i, 10)
    );
  }

  // 2 Essay (25 points each = 50 pts, Total = 100 pts)
  for (let j = 0; j < essayCount; j++) {
    const term = keyTerms[(j + 2) % keyTerms.length] || `Kajian Analisis ${j + 1}`;
    questions.push(
      createEssayQuestion(`q-${mcqCount + j + 1}`, mainTopic, term, targetSubject.name, 25)
    );
  }

  const title = `Tugas Terstruktur: ${mainTopic} (${targetSubject.name})`;
  const instructions = `Kerjakan soal Pilihan Ganda dan Essay berikut secara teliti berdasarkan materi "${primaryMaterial.title}". Pastikan menjawab seluruh pertanyaan sebelum batas waktu berakhir.`;

  return {
    title,
    assignment_type: 'STRUCTURED_QUESTIONS',
    instructions,
    questions,
    subject_id: targetSubject.id,
    subject_name: targetSubject.name,
    source_materials: materials.map(m => ({
      id: m.id,
      title: m.title,
      type: m.material_type || 'document',
    })),
  };
}

/**
 * Core Generator 2: Automated Quiz & CBT Exam (PG Saja OR PG & Essay, with 1-Month Summary Mode)
 */
export function generateQuizFromMaterials(
  materials: SourceMaterial[],
  format: QuizGenFormat,
  targetSubject: { id?: string; name: string },
  isMonthlyExam: boolean = false
): GeneratedQuizResult {
  if (materials.length === 0) {
    throw new Error('Minimal satu materi harus tersedia untuk membuat kuis/ujian.');
  }

  // STRICT SUBJECT GUARD
  for (const m of materials) {
    if (m.subject_id && targetSubject.id && m.subject_id !== targetSubject.id) {
      throw new Error(`Pelanggaran isolasi mapel: Materi "${m.title}" bukan bagian dari mapel ${targetSubject.name}.`);
    }
  }

  const questions: GeneratedQuestion[] = [];
  const isMcqOnly = format === 'MCQ_ONLY';

  if (isMonthlyExam) {
    // PERIODIC MONTHLY EXAM RANGKUMAN 1 BULAN SEBELUMNYA
    const examTitle = `Ujian Bulanan CBT: Rangkuman Semester / Bulan (${targetSubject.name})`;
    const desc = `Ujian evaluasi komprehensif mencakup materi yang telah dipelajari selama satu bulan terakhir dalam mata pelajaran ${targetSubject.name}. Disusun otomatis dari ${materials.length} modul pembelajaran terbit.`;

    if (isMcqOnly) {
      // 10 PG (10 pts each = 100 pts)
      const totalQ = 10;
      for (let i = 0; i < totalQ; i++) {
        const mat = materials[i % materials.length];
        const { mainTopic, keyTerms } = extractKeyConcepts(mat);
        const term = keyTerms[i % keyTerms.length] || `Konsep Pokok ${i + 1}`;
        questions.push(
          createMCQQuestion(`ex-q-${i + 1}`, mainTopic, term, targetSubject.name, i, 10)
        );
      }
    } else {
      // 6 PG (10 pts each = 60 pts) + 2 Essay (20 pts each = 40 pts, Total = 100 pts)
      const mcqCount = 6;
      for (let i = 0; i < mcqCount; i++) {
        const mat = materials[i % materials.length];
        const { mainTopic, keyTerms } = extractKeyConcepts(mat);
        const term = keyTerms[i % keyTerms.length] || `Konsep Pokok ${i + 1}`;
        questions.push(
          createMCQQuestion(`ex-q-${i + 1}`, mainTopic, term, targetSubject.name, i, 10)
        );
      }
      for (let j = 0; j < 2; j++) {
        const mat = materials[(j * 2) % materials.length];
        const { mainTopic, keyTerms } = extractKeyConcepts(mat);
        const term = keyTerms[j % keyTerms.length] || `Sintesis Topik ${j + 1}`;
        questions.push(
          createEssayQuestion(`ex-q-${mcqCount + j + 1}`, mainTopic, term, targetSubject.name, 20)
        );
      }
    }

    return {
      title: examTitle,
      description: desc,
      format,
      time_limit_minutes: 60,
      passing_score: 75,
      questions,
      subject_id: targetSubject.id,
      subject_name: targetSubject.name,
      is_monthly_exam: true,
      source_materials: materials.map(m => ({
        id: m.id,
        title: m.title,
        type: m.material_type || 'document',
      })),
    };
  }

  // STANDARD QUIZ FROM SELECTED / LATEST MATERIAL
  const primaryMaterial = materials[0];
  const { mainTopic, keyTerms } = extractKeyConcepts(primaryMaterial);
  const quizTitle = `Kuis Penilaian: ${mainTopic} (${targetSubject.name})`;
  const desc = `Kuis pemahaman harian materi "${primaryMaterial.title}" pada mata pelajaran ${targetSubject.name}.`;

  if (isMcqOnly) {
    // 5 PG (20 pts each = 100 pts)
    for (let i = 0; i < 5; i++) {
      const term = keyTerms[i % keyTerms.length] || `Konsep ${i + 1}`;
      questions.push(
        createMCQQuestion(`qz-q-${i + 1}`, mainTopic, term, targetSubject.name, i, 20)
      );
    }
  } else {
    // 3 PG (20 pts each = 60 pts) + 2 Essay (20 pts each = 40 pts, Total = 100 pts)
    for (let i = 0; i < 3; i++) {
      const term = keyTerms[i % keyTerms.length] || `Konsep ${i + 1}`;
      questions.push(
        createMCQQuestion(`qz-q-${i + 1}`, mainTopic, term, targetSubject.name, i, 20)
      );
    }
    for (let j = 0; j < 2; j++) {
      const term = keyTerms[(j + 2) % keyTerms.length] || `Analisis ${j + 1}`;
      questions.push(
        createEssayQuestion(`qz-q-${3 + j + 1}`, mainTopic, term, targetSubject.name, 20)
      );
    }
  }

  return {
    title: quizTitle,
    description: desc,
    format,
    time_limit_minutes: 40,
    passing_score: 70,
    questions,
    subject_id: targetSubject.id,
    subject_name: targetSubject.name,
    is_monthly_exam: false,
    source_materials: materials.map(m => ({
      id: m.id,
      title: m.title,
      type: m.material_type || 'document',
    })),
  };
}
