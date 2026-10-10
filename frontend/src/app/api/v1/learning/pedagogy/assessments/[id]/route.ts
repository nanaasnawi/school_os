import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const assessQuery = `
      SELECT 
        pa.*,
        c.name AS class_name,
        tp.code AS tp_code,
        tp.statement AS tp_statement,
        tp.competency AS tp_competency,
        tp.content_scope AS tp_content_scope,
        tp.publication_status AS tp_publication_status,
        m.title AS modul_ajar_title,
        kaldik.title AS kaldik_event_title
      FROM pedagogical_assessments pa
      JOIN classes c ON pa.class_id = c.id
      LEFT JOIN learning_objectives tp ON pa.learning_objective_id = tp.id
      LEFT JOIN modul_ajar m ON pa.modul_ajar_id = m.id
      LEFT JOIN academic_calendar_events kaldik ON pa.calendar_event_id = kaldik.id
      WHERE pa.id = $1 AND pa.deleted_at IS NULL;
    `;

    const assessRes = await pool.query(assessQuery, [id]);
    if (assessRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Asesmen tidak ditemukan.' },
        { status: 404 }
      );
    }
    const assessment = assessRes.rows[0];

    // Ambil daftar siswa di kelas bersangkutan beserta nilai asesmen
    const studentsQuery = `
      SELECT 
        s.id AS student_id,
        s.full_name,
        s.nisn,
        asr.id AS result_id,
        asr.raw_score,
        asr.qualitative_level,
        asr.feedback_notes,
        asr.strengths,
        asr.areas_for_improvement,
        asr.evidence_submission
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN assessment_student_results asr 
        ON asr.student_id = s.id AND asr.assessment_id = $1
      WHERE e.class_id = $2
      ORDER BY s.full_name ASC;
    `;

    const studentsRes = await pool.query(studentsQuery, [id, assessment.class_id]);

    return NextResponse.json({
      success: true,
      assessment,
      students: studentsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = getDbPool();

    const existingRes = await pool.query(
      `SELECT * FROM pedagogical_assessments WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Asesmen tidak ditemukan.' },
        { status: 404 }
      );
    }
    const existing = existingRes.rows[0];

    const {
      title = existing.title,
      assessment_method = existing.assessment_method,
      passing_threshold = existing.passing_threshold,
      kktp_criteria = existing.kktp_criteria,
      rubric_descriptors = existing.rubric_descriptors,
      date_conducted = existing.date_conducted,
      calendar_event_id = existing.calendar_event_id,
      status = existing.status,
    } = body;

    const updateRes = await pool.query(
      `UPDATE pedagogical_assessments
       SET 
         title = $1,
         assessment_method = $2,
         passing_threshold = $3,
         kktp_criteria = $4,
         rubric_descriptors = $5,
         date_conducted = $6,
         calendar_event_id = $7,
         status = $8,
         updated_at = NOW()
       WHERE id = $9
       RETURNING *;`,
      [
        title,
        assessment_method,
        passing_threshold,
        JSON.stringify(kktp_criteria),
        JSON.stringify(rubric_descriptors),
        date_conducted,
        calendar_event_id,
        status,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Asesmen berhasil diperbarui.',
      assessment: updateRes.rows[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const res = await pool.query(
      `UPDATE pedagogical_assessments
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Asesmen tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Asesmen berhasil dihapus.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
