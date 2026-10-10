import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academic_year') || '2026/2027';
    const semester = searchParams.get('semester');
    const classId = searchParams.get('class_id');
    const subjectCode = searchParams.get('subject_code');
    const taxonomyType = searchParams.get('taxonomy_type');

    const pool = getDbPool();
    let query = `
      SELECT 
        pa.*,
        c.name AS class_name,
        tp.code AS tp_code,
        tp.statement AS tp_statement,
        tp.competency AS tp_competency,
        tp.content_scope AS tp_content_scope,
        tp.publication_status AS tp_publication_status,
        m.title AS modul_ajar_title,
        kaldik.title AS kaldik_event_title,
        COUNT(asr.id)::int AS graded_students_count
      FROM pedagogical_assessments pa
      JOIN classes c ON pa.class_id = c.id
      LEFT JOIN learning_objectives tp ON pa.learning_objective_id = tp.id
      LEFT JOIN modul_ajar m ON pa.modul_ajar_id = m.id
      LEFT JOIN academic_calendar_events kaldik ON pa.calendar_event_id = kaldik.id
      LEFT JOIN assessment_student_results asr ON pa.id = asr.assessment_id
      WHERE pa.academic_year = $1
        AND pa.deleted_at IS NULL
    `;
    const params: any[] = [academicYear];

    if (semester && semester !== 'ALL') {
      params.push(semester.toUpperCase());
      query += ` AND pa.semester = $${params.length}`;
    }

    if (classId && classId !== 'ALL') {
      params.push(classId);
      query += ` AND pa.class_id = $${params.length}`;
    }

    if (subjectCode && subjectCode !== 'ALL') {
      params.push(subjectCode);
      query += ` AND pa.subject_code = $${params.length}`;
    }

    if (taxonomyType && taxonomyType !== 'ALL') {
      params.push(taxonomyType.toUpperCase());
      query += ` AND pa.taxonomy_type = $${params.length}`;
    }

    query += `
      GROUP BY pa.id, c.name, tp.code, tp.statement, tp.competency, tp.content_scope, tp.publication_status, m.title, kaldik.title
      ORDER BY pa.date_conducted DESC, pa.created_at DESC;
    `;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      total_count: res.rows.length,
      assessments: res.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      learning_objective_id,
      modul_ajar_id,
      academic_year = '2026/2027',
      semester = 'ODD',
      class_id,
      subject_code = '401000000',
      subject_name = 'IPAS',
      title,
      taxonomy_type = 'FORMATIVE',
      assessment_method = 'WRITTEN_TEST',
      passing_threshold = 75.0,
      kktp_criteria = {},
      rubric_descriptors = [],
      date_conducted = new Date().toISOString().split('T')[0],
      calendar_event_id,
      status = 'DRAFT',
    } = body;

    if (!class_id || !title || !taxonomy_type) {
      return NextResponse.json(
        { success: false, error: 'class_id, title, dan taxonomy_type wajib diisi.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDASI INTEGRITAS TP PUBLISHED:
    // Formatif & Sumatif Lingkup Materi WAJIB terikat pada TP berstatus PUBLISHED.
    // ─────────────────────────────────────────────────────────────────────────
    if (taxonomy_type === 'FORMATIVE' || taxonomy_type === 'SUMMATIVE_MATERIAL') {
      if (!learning_objective_id) {
        return NextResponse.json(
          {
            success: false,
            error_code: 'TP_REQUIRED',
            message: `Asesmen berjenis '${taxonomy_type}' wajib terikat pada Tujuan Pembelajaran (TP).`,
          },
          { status: 400 }
        );
      }

      const tpRes = await pool.query(
        `SELECT id, code, publication_status FROM learning_objectives WHERE id = $1 AND deleted_at IS NULL;`,
        [learning_objective_id]
      );

      if (tpRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Tujuan Pembelajaran tidak ditemukan.' },
          { status: 404 }
        );
      }

      const tp = tpRes.rows[0];
      if (tp.publication_status !== 'PUBLISHED') {
        return NextResponse.json(
          {
            success: false,
            error_code: 'TP_NOT_PUBLISHED',
            message: `Tujuan Pembelajaran (${tp.code}) berstatus '${tp.publication_status}'. Asesmen hanya dapat dirancang dari TP yang telah disahkan (PUBLISHED).`,
            current_status: tp.publication_status,
          },
          { status: 400 }
        );
      }

      // Validasi Modul Ajar tidak berstatus SUSPENDED
      if (modul_ajar_id) {
        const modulRes = await pool.query(
          `SELECT id, title, status, suspension_reason FROM modul_ajar WHERE id = $1 AND deleted_at IS NULL;`,
          [modul_ajar_id]
        );
        if (modulRes.rows.length > 0 && modulRes.rows[0].status === 'SUSPENDED') {
          return NextResponse.json(
            {
              success: false,
              error_code: 'MODUL_AJAR_SUSPENDED',
              message: `Dilarang membuat Asesmen Sumatif Lingkup Materi. Modul Ajar '${modulRes.rows[0].title}' saat ini berstatus SUSPENDED (${modulRes.rows[0].suspension_reason}).`,
            },
            { status: 403 }
          );
        }
      }
    }

    // Default KKTP intervals jika kosong
    const defaultKktp = {
      intervals: [
        { min: 0, max: 65, level: 'PERLU_BIMBINGAN', label: 'Perlu Bimbingan', action: 'Intervensi bimbingan khusus di seluruh materi' },
        { min: 66, max: 75, level: 'CUKUP', label: 'Cukup', action: 'Remedial pada bagian kompetensi yang belum tuntas' },
        { min: 76, max: 85, level: 'BAIK', label: 'Baik', action: 'Tuntas mencapai indikator tujuan pembelajaran' },
        { min: 86, max: 100, level: 'SANGAT_BAIK', label: 'Sangat Baik', action: 'Pengayaan atau tantangan materi tingkat lanjut' },
      ],
      passing_score: passing_threshold,
      ...kktp_criteria,
    };

    const tenantIdRes = await pool.query('SELECT tenant_id FROM classes WHERE id = $1', [class_id]);
    const tenantId = tenantIdRes.rows[0]?.tenant_id || null;

    const insertRes = await pool.query(
      `INSERT INTO pedagogical_assessments (
        tenant_id, learning_objective_id, modul_ajar_id, academic_year, semester,
        class_id, subject_code, subject_name, title, taxonomy_type,
        assessment_method, passing_threshold, kktp_criteria, rubric_descriptors,
        date_conducted, calendar_event_id, status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17
      ) RETURNING *;`,
      [
        tenantId,
        learning_objective_id || null,
        modul_ajar_id || null,
        academic_year,
        semester.toUpperCase(),
        class_id,
        subject_code,
        subject_name,
        title,
        taxonomy_type.toUpperCase(),
        assessment_method,
        passing_threshold,
        JSON.stringify(defaultKktp),
        JSON.stringify(rubric_descriptors),
        date_conducted,
        calendar_event_id || null,
        status,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Asesmen pedagogis berhasil dibuat.',
        assessment: insertRes.rows[0],
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
