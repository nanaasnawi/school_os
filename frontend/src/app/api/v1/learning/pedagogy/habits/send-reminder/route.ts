import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      class_id,
      student_id,
      days_lookback = 7
    } = body;

    const pool = getDbPool();

    // 1. Query pending habit entries in lookback window
    let filterQuery = `
      SELECT 
        h.id as entry_id,
        h.student_id,
        h.entry_date,
        s.tenant_id,
        s.full_name as student_name,
        s.guardian_id,
        g.user_id as guardian_user_id,
        g.phone_number as guardian_phone,
        g.full_name as guardian_name
      FROM habit_tracker_entries h
      JOIN students s ON h.student_id = s.id
      LEFT JOIN guardians g ON s.guardian_id = g.id
      WHERE h.verification_status = 'PENDING'
        AND h.entry_date >= (CURRENT_DATE - ($1 || ' days')::interval)::date
    `;
    const params: any[] = [days_lookback];

    if (student_id) {
      params.push(student_id);
      filterQuery += ` AND h.student_id = $${params.length}`;
    } else if (class_id) {
      params.push(class_id);
      filterQuery += ` AND h.student_id IN (
        SELECT student_id FROM enrollments WHERE class_id = $${params.length} AND (status IS NULL OR status = 'ACTIVE')
      )`;
    }

    const res = await pool.query(filterQuery, params);
    const rows = res.rows;

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada jurnal pembiasaan berstatus PENDING dalam rentang hari tersebut.',
        notifications_sent: 0,
        outbox_jobs_created: 0
      });
    }

    // 2. Group by student
    const studentGroups = new Map<string, {
      student_name: string;
      tenant_id: string;
      guardian_user_id: string | null;
      guardian_name: string | null;
      guardian_phone: string | null;
      entries_count: number;
    }>();

    for (const r of rows) {
      if (!studentGroups.has(r.student_id)) {
        studentGroups.set(r.student_id, {
          student_name: r.student_name,
          tenant_id: r.tenant_id,
          guardian_user_id: r.guardian_user_id,
          guardian_name: r.guardian_name,
          guardian_phone: r.guardian_phone,
          entries_count: 0
        });
      }
      studentGroups.get(r.student_id)!.entries_count++;
    }

    let notificationsCreated = 0;
    let outboxJobsCreated = 0;

    for (const [sId, group] of studentGroups.entries()) {
      const notifTitle = 'Pengingat Jurnal Karakter G7KAIH';
      const notifBody = `Ayah/Bunda dari ${group.student_name}, terdapat ${group.entries_count} catatan pembiasaan karakter 7 Kebiasaan pekan ini yang menunggu verifikasi Anda.`;

      // Insert notification if guardian_user_id exists
      if (group.guardian_user_id) {
        await pool.query(
          `INSERT INTO notifications (
            tenant_id, user_id, title, body, notification_type, channel, priority, is_read, created_at
          ) VALUES (
            $1, $2, $3, $4, 'HABIT_VERIFICATION_REMINDER', 'ALL', 'HIGH', false, NOW()
          )`,
          [group.tenant_id, group.guardian_user_id, notifTitle, notifBody]
        );
        notificationsCreated++;
      }

      // Enqueue Outbox job for WhatsApp gateway if phone exists
      if (group.guardian_phone) {
        await pool.query(
          `INSERT INTO local_bridge_outbox_jobs (
            job_id, tenant_id, req_id, operation, entity_id, idempotency_key, attempts, status, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, 'SEND_WHATSAPP_HABIT_REMINDER', $3, $4, 0, 'QUEUED', NOW(), NOW()
          )`,
          [
            group.tenant_id,
            `req_habit_rem_${Date.now()}`,
            sId,
            `idemp_habit_rem_${sId}_${new Date().toISOString().split('T')[0]}`
          ]
        );
        outboxJobsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pengingat berhasil dikirimkan kepada orang tua/wali murid untuk ${studentGroups.size} peserta didik.`,
      pending_entries_count: rows.length,
      students_affected: studentGroups.size,
      notifications_sent: notificationsCreated,
      outbox_jobs_created: outboxJobsCreated
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
