import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getApiUrl } from '@/lib/api';
import {
  generateAssignmentFromMaterials,
  generateQuizFromMaterials,
  SourceMaterial,
  AssignmentGenFormat,
  QuizGenFormat,
} from '@/features/automation/curriculum-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // 'ASSIGNMENT_STRUCTURED' | 'ASSIGNMENT_HOMEWORK' | 'QUIZ_MCQ_ONLY' | 'QUIZ_MCQ_ESSAY' | 'EXAM_MONTHLY'
      subject_id,
      subject_name: inputSubjectName,
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
      // 1-Month aggregation strictly filtered by subject_id
      const query = `
        SELECT id, title, description, material_type, source_type, start_page, end_page, created_at, subject_id
        FROM learning_materials
        WHERE subject_id = $1 AND is_active = true AND deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
      `;
      const res = await pool.query(query, [effectiveSubjectId]);

      if (res.rows.length === 0) {
        // Fallback: If no material in 30 days, pick the latest materials for this subject
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
      // Strictly enforce subject_id isolation even for selected IDs
      const query = `
        SELECT id, title, description, material_type, source_type, start_page, end_page, created_at, subject_id
        FROM learning_materials
        WHERE id = ANY($1) AND subject_id = $2 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const res = await pool.query(query, [material_ids, effectiveSubjectId]);
      materials = res.rows;
    } else {
      // Default: Latest published material for that subject
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
      // Fallback: If no published files exist yet in database for this subject, construct standard curriculum syllabus material
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

    // 3. Generate questions or task according to requested type
    const targetSubject = { id: effectiveSubjectId, name: subjectName };

    if (type === 'ASSIGNMENT_STRUCTURED' || type === 'ASSIGNMENT_HOMEWORK') {
      const isHomework = type === 'ASSIGNMENT_HOMEWORK';
      const topic = materials.map(m => m.title).slice(0, 2).join(', ') || subjectName;

      try {
        const backendEndpoint = getApiUrl('/api/v1/ai/generate-content');
        const authHeader = req.headers.get('authorization');
        const aiRes = await fetch(backendEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            mode: 'ASSIGNMENT',
            topic,
            grade_level: 'SD/SMP/SMA',
            subject_name: subjectName,
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const aiTask = aiJson?.data?.assignment;
          if (aiTask && aiTask.title) {
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
              instructions: `${aiTask.instructions}\n\nRubrik Penilaian:\n${aiTask.rubric}`,
              questions,
              subject_id: effectiveSubjectId,
              subject_name: subjectName,
              source_materials: materials.map(m => ({ id: m.id, title: m.title, type: m.material_type || 'document' })),
            };
            return NextResponse.json({ success: true, data: result });
          }
        }
      } catch (aiErr) {
        console.warn('Backend AI assignment auto-generate fallback to template:', aiErr);
      }

      const result = generateAssignmentFromMaterials(materials, isHomework ? 'HOMEWORK_PR' : 'STRUCTURED_QUESTIONS', targetSubject);
      return NextResponse.json({ success: true, data: result });
    }

    if (type === 'QUIZ_MCQ_ONLY' || type === 'QUIZ_MCQ_ESSAY' || type === 'EXAM_MONTHLY') {
      const isMonthly = type === 'EXAM_MONTHLY';
      const format: QuizGenFormat = (type === 'QUIZ_MCQ_ONLY' || body.format === 'MCQ_ONLY') ? 'MCQ_ONLY' : 'MCQ_AND_ESSAY';
      const numQuestions = isMonthly ? 10 : 5;
      const topic = materials.map(m => m.title).slice(0, 3).join(', ') || subjectName;

      try {
        const backendEndpoint = getApiUrl('/api/v1/ai/generate-content');
        const authHeader = req.headers.get('authorization');
        const aiRes = await fetch(backendEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            mode: 'QUIZ',
            topic,
            grade_level: 'SD/SMP/SMA',
            subject_name: subjectName,
            num_questions: numQuestions,
            difficulty: isMonthly ? 'HOTS' : 'Sedang',
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const aiQuiz = aiJson?.data?.quiz;
          if (aiQuiz && aiQuiz.questions && aiQuiz.questions.length > 0) {
            const generatedQuestions = aiQuiz.questions.map((q: any, idx: number) => ({
              id: `gen-q-${idx + 1}-${Date.now()}`,
              question_text: q.question_text,
              question_type: 'MULTIPLE_CHOICE' as const,
              points: q.points || 20,
              choices: (q.choices || []).map((c: any) => ({
                choice_text: typeof c === 'string' ? c : c.choice_text,
                is_correct: typeof c === 'object' ? Boolean(c.is_correct) : false,
              })),
              explanation: q.explanation,
            }));

            const result = {
              title: aiQuiz.title || (isMonthly ? `Ujian Bulanan CBT: ${subjectName}` : `Kuis Pembelajaran: ${subjectName}`),
              description: aiQuiz.description || `Soal disusun otomatis oleh AI NVIDIA berbasis kurikulum materi ${subjectName}.`,
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
        }
      } catch (aiErr) {
        console.warn('Backend AI Quiz auto-generate fallback to rule engine:', aiErr);
      }

      // Fallback to deterministic template generator
      const result = generateQuizFromMaterials(materials, format, targetSubject, isMonthly);
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
