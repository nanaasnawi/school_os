import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academic_year') || '2026/2027';
    const semester = searchParams.get('semester');
    const subjectCode = searchParams.get('subject_code');
    const status = searchParams.get('status');

    const pool = getDbPool();

    let query = `
      SELECT 
        m.*,
        tp.code AS tp_code,
        tp.statement AS tp_statement,
        tp.competency AS tp_competency,
        tp.content_scope AS tp_content_scope,
        tp.publication_status AS tp_publication_status
      FROM modul_ajar m
      JOIN learning_objectives tp ON m.learning_objective_id = tp.id
      WHERE m.academic_year = $1
        AND m.deleted_at IS NULL
    `;
    const params: any[] = [academicYear];

    if (semester && semester !== 'ALL') {
      params.push(semester.toUpperCase());
      query += ` AND m.semester = $${params.length}`;
    }

    if (subjectCode && subjectCode !== 'ALL') {
      params.push(subjectCode);
      query += ` AND m.subject_code = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status.toUpperCase());
      query += ` AND m.status = $${params.length}`;
    }

    query += ` ORDER BY m.created_at DESC;`;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      total_count: res.rows.length,
      modul_ajar: res.rows,
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
      academic_year = '2026/2027',
      semester = 'ODD',
      title,
      grade_level = 'Kelas 5',
      subject_code = '401000000',
      subject_name = 'IPAS',
      phase = 'FASE_C',
      allocated_hours = 4,
      total_meetings = 1,
      hours_per_meeting = 4,
      pancasila_profiles = ['Bernalar Kritis', 'Mandiri'],
      meaningful_understanding = '',
      trigger_questions = [],
      differentiation_strategies = {},
      learning_activities = [],
      assessment_plan = {},
      lkpd_attachments = [],
      status = 'DRAFT',
    } = body;

    if (!learning_objective_id || !title) {
      return NextResponse.json(
        { success: false, error: 'learning_objective_id dan title wajib diisi.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 1. Validasi TP PUBLISHED
    const tpRes = await pool.query(
      `SELECT id, code, publication_status FROM learning_objectives WHERE id = $1 AND deleted_at IS NULL`,
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
          message: `Tujuan Pembelajaran (${tp.code}) berstatus '${tp.publication_status}'. Modul Ajar hanya dapat dibuat dari TP yang berstatus PUBLISHED.`,
          current_status: tp.publication_status,
        },
        { status: 400 }
      );
    }

    // 2. Validasi Kaldik Capacity
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

    // 3. Simpan
    const insertRes = await pool.query(
      `INSERT INTO modul_ajar (
        learning_objective_id, academic_year, semester,
        title, grade_level, subject_code, subject_name, phase,
        allocated_hours, total_meetings, hours_per_meeting,
        pancasila_profiles, meaningful_understanding, trigger_questions,
        differentiation_strategies, learning_activities, assessment_plan,
        lkpd_attachments, status, is_ai_generated
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, false
      ) RETURNING *;`,
      [
        learning_objective_id,
        academic_year,
        semester.toUpperCase(),
        title,
        grade_level,
        subject_code,
        subject_name,
        phase,
        allocated_hours,
        total_meetings,
        hours_per_meeting,
        pancasila_profiles,
        meaningful_understanding,
        JSON.stringify(trigger_questions),
        JSON.stringify(differentiation_strategies),
        JSON.stringify(learning_activities),
        JSON.stringify(assessment_plan),
        JSON.stringify(lkpd_attachments),
        status,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Modul Ajar berhasil disimpan.',
        modul_ajar: insertRes.rows[0],
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
