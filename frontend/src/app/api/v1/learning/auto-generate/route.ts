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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // 'ASSIGNMENT_STRUCTURED' | 'ASSIGNMENT_HOMEWORK' | 'QUIZ_MCQ_ONLY' | 'QUIZ_MCQ_ESSAY' | 'EXAM_MONTHLY'
      subject_id,
      subject_name: inputSubjectName,
      topic: inputTopic,
      grade_level: inputGradeLevel,
      num_questions: inputNumQuestions,
      difficulty: inputDifficulty,
      source_mode = 'LATEST_PUBLISHED', // 'CURRENT_UNSAVED' | 'LATEST_PUBLISHED' | 'SELECTED_IDS' | 'PAST_MONTH'
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

    // 3. Generate questions or task using NVIDIA NIM AI exclusively
    if (type === 'ASSIGNMENT_STRUCTURED' || type === 'ASSIGNMENT_HOMEWORK') {
      const isHomework = type === 'ASSIGNMENT_HOMEWORK';
      const topic = inputTopic?.trim() || materials.map(m => m.title).slice(0, 2).join(', ') || subjectName;
      const gradeLevel = inputGradeLevel || 'Kelas 5 SD';
      const backendEndpoint = getApiUrl('/api/v1/ai/generate-content');
      const authHeader = req.headers.get('authorization');

      if (type === 'ASSIGNMENT_STRUCTURED') {
        // Parallel call to NVIDIA NIM for both Assignment task & MCQ questions
        const [taskRes, quizRes] = await Promise.all([
          fetch(backendEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
              mode: 'ASSIGNMENT',
              topic,
              grade_level: gradeLevel,
              subject_name: subjectName,
            }),
          }),
          fetch(backendEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
              mode: 'QUIZ',
              topic,
              grade_level: gradeLevel,
              subject_name: subjectName,
              num_questions: inputNumQuestions || 4,
              difficulty: inputDifficulty || 'Sedang',
            }),
          }),
        ]);

        if (!taskRes.ok && !quizRes.ok) {
          const failedRes = !taskRes.ok ? taskRes : quizRes;
          const errJson = await failedRes.json().catch(() => null);
          return NextResponse.json(
            {
              success: false,
              error: errJson?.error?.message || errJson?.message || `Gagal menghubungi AI NVIDIA NIM (${failedRes.status}). Pastikan API server aktif.`
            },
            { status: failedRes.status }
          );
        }

        const taskJson = taskRes.ok ? await taskRes.json() : null;
        const quizJson = quizRes.ok ? await quizRes.json() : null;

        const aiTask = taskJson?.data?.assignment;
        const aiQuiz = quizJson?.data?.quiz;

        const structuredQuestions: any[] = [];

        // 1. Add MCQ questions from AI Quiz
        if (aiQuiz?.questions) {
          aiQuiz.questions.forEach((q: any, idx: number) => {
            structuredQuestions.push({
              id: `task-mcq-${idx + 1}-${Date.now()}`,
              question_text: q.question_text,
              question_type: 'MULTIPLE_CHOICE' as const,
              points: 15,
              choices: (q.choices || []).map((c: any) => ({
                choice_text: typeof c === 'string' ? c : (c.choice_text || c.text || ''),
                is_correct: typeof c === 'object' ? Boolean(c.is_correct || c.isCorrect) : false,
              })),
              explanation: q.explanation || 'Pembahasan kunci oleh AI NVIDIA NIM',
            });
          });
        }

        // 2. Add Essay questions from AI Assignment tasks
        if (aiTask?.tasks) {
          aiTask.tasks.slice(0, 2).forEach((t: string, idx: number) => {
            structuredQuestions.push({
              id: `task-essay-${idx + 1}-${Date.now()}`,
              question_text: t,
              question_type: 'ESSAY' as const,
              points: 20,
              choices: [],
              explanation: aiTask.rubric || 'Rubrik penilaian objektif AI NVIDIA NIM',
            });
          });
        }

        const title = aiTask?.title || aiQuiz?.title || `Tugas Mandiri: ${topic}`;
        const instructions = aiTask?.instructions
          ? `${aiTask.instructions}\n\nRubrik Penilaian Objektif (AI NVIDIA NIM):\n${aiTask.rubric || ''}`
          : `Kerjakan seluruh butir soal pilihan ganda dan essay analitis berikut dengan teliti.`;

        const result = {
          title,
          assignment_type: 'STRUCTURED_QUESTIONS',
          instructions,
          questions: structuredQuestions,
          subject_id: effectiveSubjectId,
          subject_name: subjectName,
          source_materials: materials.map(m => ({ id: m.id, title: m.title, type: m.material_type || 'document' })),
        };
        return NextResponse.json({ success: true, data: result });
      }

      // Pure Homework
      const aiRes = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          mode: 'ASSIGNMENT',
          topic,
          grade_level: gradeLevel,
          subject_name: subjectName,
        }),
      });

      if (!aiRes.ok) {
        const errJson = await aiRes.json().catch(() => null);
        return NextResponse.json(
          {
            success: false,
            error: errJson?.error?.message || errJson?.message || `Gagal menghubungi AI NVIDIA NIM (${aiRes.status}). Pastikan API server aktif.`
          },
          { status: aiRes.status }
        );
      }

      const aiJson = await aiRes.json();
      const aiTask = aiJson?.data?.assignment;
      if (!aiTask || !aiTask.title) {
        return NextResponse.json(
          { success: false, error: 'Respons format penugasan dari AI NVIDIA NIM tidak valid.' },
          { status: 502 }
        );
      }

      const questions = (aiTask.tasks || []).map((t: string, idx: number) => ({
        id: `task-q-${idx + 1}-${Date.now()}`,
        question_text: t,
        question_type: 'ESSAY' as const,
        points: Math.round(100 / Math.max(1, aiTask.tasks?.length || 1)),
        choices: [],
        explanation: aiTask.rubric || '',
      }));

      const result = {
        title: aiTask.title,
        assignment_type: isHomework ? 'HOMEWORK_PR' : 'STRUCTURED_QUESTIONS',
        instructions: `${aiTask.instructions}\n\nRubrik Penilaian Objektif (AI NVIDIA NIM):\n${aiTask.rubric}`,
        questions,
        subject_id: effectiveSubjectId,
        subject_name: subjectName,
        source_materials: materials.map(m => ({ id: m.id, title: m.title, type: m.material_type || 'document' })),
      };
      return NextResponse.json({ success: true, data: result });
    }

    if (type === 'QUIZ_MCQ_ONLY' || type === 'QUIZ_MCQ_ESSAY' || type === 'EXAM_MONTHLY') {
      const isMonthly = type === 'EXAM_MONTHLY';
      const format: QuizGenFormat = (type === 'QUIZ_MCQ_ONLY' || body.format === 'MCQ_ONLY') ? 'MCQ_ONLY' : 'MCQ_AND_ESSAY';
      const numQuestions = inputNumQuestions || (isMonthly ? 10 : 5);
      const difficulty = inputDifficulty || (isMonthly ? 'HOTS' : 'Sedang');
      const topic = inputTopic?.trim() || materials.map(m => m.title).slice(0, 3).join(', ') || subjectName;
      const gradeLevel = inputGradeLevel || 'Kelas 5 SD';

      const backendEndpoint = getApiUrl('/api/v1/ai/generate-content');
      const authHeader = req.headers.get('authorization');

      if (format === 'MCQ_AND_ESSAY') {
        const [quizRes, taskRes] = await Promise.all([
          fetch(backendEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
              mode: 'QUIZ',
              topic,
              grade_level: gradeLevel,
              subject_name: subjectName,
              num_questions: numQuestions,
              difficulty,
            }),
          }),
          fetch(backendEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
              mode: 'ASSIGNMENT',
              topic,
              grade_level: gradeLevel,
              subject_name: subjectName,
            }),
          }),
        ]);

        if (!quizRes.ok) {
          const errJson = await quizRes.json().catch(() => null);
          return NextResponse.json(
            {
              success: false,
              error: errJson?.error?.message || errJson?.message || `Gagal menghubungi AI NVIDIA NIM (${quizRes.status}).`
            },
            { status: quizRes.status }
          );
        }

        const quizJson = await quizRes.json();
        const taskJson = taskRes.ok ? await taskRes.json() : null;

        const aiQuiz = quizJson?.data?.quiz;
        const aiTask = taskJson?.data?.assignment;

        const generatedQuestions = (aiQuiz?.questions || []).map((q: any, idx: number) => ({
          id: `gen-mcq-${idx + 1}-${Date.now()}`,
          question_text: q.question_text,
          question_type: 'MULTIPLE_CHOICE' as const,
          points: q.points || 15,
          choices: (q.choices || []).map((c: any) => ({
            choice_text: typeof c === 'string' ? c : (c.choice_text || c.text || ''),
            is_correct: typeof c === 'object' ? Boolean(c.is_correct || c.isCorrect) : false,
          })),
          explanation: q.explanation || 'Pembahasan kunci jawaban oleh AI NVIDIA NIM.',
        }));

        if (aiTask?.tasks) {
          aiTask.tasks.slice(0, 2).forEach((t: string, idx: number) => {
            generatedQuestions.push({
              id: `gen-essay-${idx + 1}-${Date.now()}`,
              question_text: t,
              question_type: 'ESSAY' as const,
              points: 20,
              choices: [],
              explanation: aiTask.rubric || 'Kriteria penilaian essay AI NVIDIA NIM.',
            });
          });
        }

        const result = {
          title: aiQuiz?.title || (isMonthly ? `Ujian Bulanan CBT: ${subjectName}` : `Kuis Pembelajaran: ${subjectName}`),
          description: aiQuiz?.description || `Paket soal CBT resmi disusun otomatis oleh AI NVIDIA NIM berbasis materi ${subjectName}.`,
          format,
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

      // MCQ Only
      const aiRes = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          mode: 'QUIZ',
          topic,
          grade_level: gradeLevel,
          subject_name: subjectName,
          num_questions: numQuestions,
          difficulty,
        }),
      });

      if (!aiRes.ok) {
        const errJson = await aiRes.json().catch(() => null);
        return NextResponse.json(
          {
            success: false,
            error: errJson?.error?.message || errJson?.message || `Gagal menghubungi AI NVIDIA NIM (${aiRes.status}). Pastikan API server aktif.`
          },
          { status: aiRes.status }
        );
      }

      const aiJson = await aiRes.json();
      const aiQuiz = aiJson?.data?.quiz;
      if (!aiQuiz || !aiQuiz.questions || aiQuiz.questions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Respons bank butir soal dari AI NVIDIA NIM kosong.' },
          { status: 502 }
        );
      }

      const generatedQuestions = aiQuiz.questions.map((q: any, idx: number) => ({
        id: `gen-q-${idx + 1}-${Date.now()}`,
        question_text: q.question_text,
        question_type: 'MULTIPLE_CHOICE' as const,
        points: q.points || 20,
        choices: (q.choices || []).map((c: any) => ({
          choice_text: typeof c === 'string' ? c : (c.choice_text || c.text || ''),
          is_correct: typeof c === 'object' ? Boolean(c.is_correct || c.isCorrect) : false,
        })),
        explanation: q.explanation || 'Pembahasan kunci jawaban oleh AI NVIDIA NIM.',
      }));

      const result = {
        title: aiQuiz.title || (isMonthly ? `Ujian Bulanan CBT: ${subjectName}` : `Kuis Pembelajaran: ${subjectName}`),
        description: aiQuiz.description || `Paket soal CBT resmi disusun otomatis oleh AI NVIDIA NIM berbasis materi ${subjectName}.`,
        format,
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
