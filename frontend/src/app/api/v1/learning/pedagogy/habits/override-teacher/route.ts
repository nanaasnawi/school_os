import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entry_ids,
      class_id,
      student_id,
      start_date,
      end_date,
      target_status = 'ALL', // 'PENDING' | 'SYSTEM_EXPIRED' | 'ALL'
      teacher_id,
      teacher_notes,
      override_reason = 'Diverifikasi berdasarkan pengamatan langsung kebiasaan dan pembiasaan karakter peserta didik di lingkungan sekolah (Fallback Window 7 Hari).'
    } = body;

    const pool = getDbPool();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: RUN 7-DAY EXPIRY FUNCTION ON RELEVANT TENANTS
    // ─────────────────────────────────────────────────────────────────────────
    let tenantId: string | null = null;
    if (class_id) {
      const cRes = await pool.query('SELECT tenant_id FROM classes WHERE id = $1', [class_id]);
      if (cRes.rows.length > 0) tenantId = cRes.rows[0].tenant_id;
    } else if (student_id) {
      const sRes = await pool.query('SELECT tenant_id FROM students WHERE id = $1', [student_id]);
      if (sRes.rows.length > 0) tenantId = sRes.rows[0].tenant_id;
    } else {
      const tRes = await pool.query('SELECT id FROM tenants LIMIT 1');
      if (tRes.rows.length > 0) tenantId = tRes.rows[0].id;
    }

    let expiredCount = 0;
    if (tenantId) {
      const expireRes = await pool.query(
        'SELECT fn_expire_stale_habit_entries($1, 7) AS expired_count',
        [tenantId]
      );
      expiredCount = expireRes.rows[0]?.expired_count || 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: BULK OVERRIDE EXECUTION
    // ─────────────────────────────────────────────────────────────────────────
    let updateQuery = '';
    let params: any[] = [];

    if (Array.isArray(entry_ids) && entry_ids.length > 0) {
      params = [
        teacher_id || null,
        override_reason,
        teacher_notes || null,
        entry_ids
      ];

      updateQuery = `
        UPDATE habit_tracker_entries
        SET 
          verification_status = 'TEACHER_OVERRIDE',
          verified_by_user_id = $1,
          verified_by_role = 'HOMEROOM_TEACHER',
          verified_at = NOW(),
          override_reason = $2,
          teacher_notes = COALESCE($3, teacher_notes),
          updated_at = NOW()
        WHERE id = ANY($4::uuid[])
          AND verification_status IN ('PENDING', 'SYSTEM_EXPIRED')
        RETURNING id, student_id, entry_date, completed_count, compliance_rate, verification_status, verified_at, override_reason;
      `;
    } else if (class_id) {
      // Find students in class
      params = [
        teacher_id || null,
        override_reason,
        teacher_notes || null,
        class_id
      ];

      let filterConditions = `WHERE h.student_id IN (
        SELECT student_id FROM enrollments WHERE class_id = $4 AND (status IS NULL OR status = 'ACTIVE')
      )`;

      if (target_status === 'SYSTEM_EXPIRED') {
        filterConditions += ` AND h.verification_status = 'SYSTEM_EXPIRED'`;
      } else if (target_status === 'PENDING') {
        filterConditions += ` AND h.verification_status = 'PENDING'`;
      } else {
        filterConditions += ` AND h.verification_status IN ('PENDING', 'SYSTEM_EXPIRED')`;
      }

      if (student_id) {
        params.push(student_id);
        filterConditions += ` AND h.student_id = $${params.length}`;
      }

      if (start_date) {
        params.push(start_date);
        filterConditions += ` AND h.entry_date >= $${params.length}`;
      }

      if (end_date) {
        params.push(end_date);
        filterConditions += ` AND h.entry_date <= $${params.length}`;
      }

      updateQuery = `
        UPDATE habit_tracker_entries h
        SET 
          verification_status = 'TEACHER_OVERRIDE',
          verified_by_user_id = $1,
          verified_by_role = 'HOMEROOM_TEACHER',
          verified_at = NOW(),
          override_reason = $2,
          teacher_notes = COALESCE($3, teacher_notes),
          updated_at = NOW()
        ${filterConditions}
        RETURNING h.id, h.student_id, h.entry_date, h.completed_count, h.compliance_rate, h.verification_status, h.verified_at, h.override_reason;
      `;
    } else {
      return NextResponse.json(
        { success: false, error: 'Wajib menyertakan entry_ids atau class_id untuk melakukan override verifikasi.' },
        { status: 400 }
      );
    }

    const res = await pool.query(updateQuery, params);

    return NextResponse.json({
      success: true,
      message: `Override verifikasi berhasil diterapkan pada ${res.rows.length} jurnal pembiasaan karakter.`,
      stale_expired_marked: expiredCount,
      overridden_count: res.rows.length,
      entries: res.rows
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
