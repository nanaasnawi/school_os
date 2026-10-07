import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
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
      return NextResponse.json(
        {
          success: false,
          error: `Belum ada materi pembelajaran yang dipublikasikan untuk mata pelajaran "${subjectName}". Silakan terbitkan materi terlebih dahulu.`,
        },
        { status: 404 }
      );
    }

    // 3. Generate questions or task according to requested type
    const targetSubject = { id: effectiveSubjectId, name: subjectName };

    if (type === 'ASSIGNMENT_STRUCTURED') {
      const result = generateAssignmentFromMaterials(materials, 'STRUCTURED_QUESTIONS', targetSubject);
      return NextResponse.json({ success: true, data: result });
    }

    if (type === 'ASSIGNMENT_HOMEWORK') {
      const result = generateAssignmentFromMaterials(materials, 'HOMEWORK_PR', targetSubject);
      return NextResponse.json({ success: true, data: result });
    }

    if (type === 'QUIZ_MCQ_ONLY') {
      const result = generateQuizFromMaterials(materials, 'MCQ_ONLY', targetSubject, false);
      return NextResponse.json({ success: true, data: result });
    }

    if (type === 'QUIZ_MCQ_ESSAY') {
      const result = generateQuizFromMaterials(materials, 'MCQ_AND_ESSAY', targetSubject, false);
      return NextResponse.json({ success: true, data: result });
    }

    if (type === 'EXAM_MONTHLY') {
      const format: QuizGenFormat = body.format === 'MCQ_ONLY' ? 'MCQ_ONLY' : 'MCQ_AND_ESSAY';
      const result = generateQuizFromMaterials(materials, format, targetSubject, true);
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
