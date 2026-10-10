import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entry_ids = [],
      parent_feedback,
      verified_by_user_id
    } = body;

    if (!Array.isArray(entry_ids) || entry_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar entry_ids wajib diisi minimal 1 ID.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    const updateQuery = `
      UPDATE habit_tracker_entries
      SET 
        verification_status = 'PARENT_VERIFIED',
        verified_by_user_id = $1,
        verified_by_role = 'PARENT',
        verified_at = NOW(),
        parent_feedback = COALESCE($2, parent_feedback),
        updated_at = NOW()
      WHERE id = ANY($3::uuid[])
      RETURNING id, student_id, entry_date, completed_count, compliance_rate, verification_status, verified_at, parent_feedback;
    `;

    const res = await pool.query(updateQuery, [
      verified_by_user_id || null,
      parent_feedback || null,
      entry_ids
    ]);

    return NextResponse.json({
      success: true,
      message: `Berhasil memverifikasi ${res.rows.length} jurnal pembiasaan karakter peserta didik.`,
      verified_count: res.rows.length,
      entries: res.rows
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
