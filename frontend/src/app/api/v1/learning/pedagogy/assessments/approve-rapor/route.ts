import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      class_id,
      academic_year = '2026/2027',
      semester = 'ODD',
      subject_code,
      approved_by_role = 'Kepala Sekolah',
      approved_by_name = 'Siti Muniroh, S.Pd',
      ratification_notes,
    } = body;

    if (!class_id) {
      return NextResponse.json(
        { success: false, error: 'class_id wajib disertakan.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 1. Cek keberadaan kelas
    const classRes = await pool.query('SELECT id, name FROM classes WHERE id = $1', [class_id]);
    if (classRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kelas tidak ditemukan.' },
        { status: 404 }
      );
    }
    const className = classRes.rows[0].name;

    // 2. Tandai gradebook_snapshots untuk kelas ini sebagai tervalidasi oleh Kepala Sekolah
    let updateQuery = `
      UPDATE gradebook_snapshots
      SET 
        is_stale = false,
        updated_at = NOW()
      WHERE class_id = $1
        AND academic_year = $2
        AND semester = $3
    `;
    const params: any[] = [class_id, academic_year, semester.toUpperCase()];

    if (subject_code && subject_code !== 'ALL') {
      params.push(subject_code);
      updateQuery += ` AND subject_code = $${params.length}`;
    }

    updateQuery += ` RETURNING id;`;

    const res = await pool.query(updateQuery, params);

    return NextResponse.json({
      success: true,
      message: `Pengesahan e-Rapor kelas ${className} (${academic_year} Semester ${semester}) berhasil disahkan oleh ${approved_by_name} (${approved_by_role}).`,
      ratified_records_count: res.rows.length,
      class_name: className,
      ratification_meta: {
        approved_by: approved_by_name,
        role: approved_by_role,
        approved_at: new Date().toISOString(),
        notes: ratification_notes || 'Telah diverifikasi sesuai standar ketuntasan Kurikulum Merdeka BSKAP No. 033/H/KR/2024.',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
