import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const pool = getDbPool();
    const { searchParams } = new URL(req.url);
    const tenantIdParam = searchParams.get('tenant_id');

    // Query recent reminder notifications from the database (last 7 days)
    const query = `
      SELECT n.id, n.user_id, n.title, n.body, n.created_at, n.is_read, n.reference_id,
             s.id as student_id, s.full_name as student_name
      FROM notifications n
      JOIN students s ON s.user_id = n.user_id
      WHERE n.notification_type IN ('SMART_REMINDER', 'MATERIAL_REMINDER', 'ASSIGNMENT_REMINDER', 'AT_RISK_REMINDER')
        AND n.created_at >= NOW() - INTERVAL '7 days'
        ${tenantIdParam ? 'AND n.tenant_id = $1' : ''}
      ORDER BY n.created_at DESC
    `;

    const values = tenantIdParam ? [tenantIdParam] : [];
    const res = await pool.query(query, values);

    // Group latest reminder by student_id
    const remindersMap: Record<string, { id: string; sent: boolean; sent_at: string; title: string }> = {};
    for (const row of res.rows) {
      if (row.student_id && !remindersMap[row.student_id]) {
        remindersMap[row.student_id] = {
          id: row.id,
          sent: true,
          sent_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          title: row.title || 'Pengingat Guru',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: remindersMap,
      recentList: res.rows,
    });
  } catch (err: any) {
    console.error('Error fetching teacher reminders:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal memuat riwayat pengingat' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const pool = getDbPool();
    const body = await req.json();
    const {
      student_ids = [],
      student_id,
      title = 'Pengingat Pembelajaran',
      reason,
      category = 'UNREAD_MATERIAL',
      material_id,
      assignment_id,
      teacher_name = 'Guru Pengampu'
    } = body;

    const targetStudentIds: string[] = student_ids.length > 0
      ? student_ids
      : (student_id ? [student_id] : []);

    if (targetStudentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Target siswa (student_ids) tidak boleh kosong' },
        { status: 400 }
      );
    }

    // 1. Fetch student user_id, full_name, and tenant_id from database
    const studentsRes = await pool.query(
      `
      SELECT s.id, s.user_id, s.full_name, s.tenant_id, c.name as class_name
      FROM students s
      LEFT JOIN enrollments en ON en.student_id = s.id AND (en.status = 'Active' OR en.status = 'active')
      LEFT JOIN classes c ON c.id = en.class_id
      WHERE s.id = ANY($1) AND s.deleted_at IS NULL
      `,
      [targetStudentIds]
    );

    if (studentsRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data siswa tidak ditemukan di sistem' },
        { status: 404 }
      );
    }

    const insertedReminders: any[] = [];
    const now = new Date();

    // 2. Insert in-app notifications into notifications table
    for (const st of studentsRes.rows) {
      if (!st.user_id) continue;

      let notifTitle = `[PENGINGAT GURU] ${title}`;
      let notifBody = reason || `Bapak/Ibu Guru ${teacher_name} mengingatkan Anda untuk segera menyelesaikan kendala belajar: "${title}". Tetap semangat belajar!`;

      if (category === 'UNREAD_MATERIAL') {
        notifTitle = `[LITERASI MODUL] Segera Baca: ${title}`;
        notifBody = `Halo ${st.full_name}, Bapak/Ibu Guru mengingatkan untuk segera membaca dan mempelajari modul "${title}".`;
      } else if (category === 'OVERDUE_ASSIGNMENT') {
        notifTitle = `[TUGAS TERTUNDA] Segera Kumpulkan: ${title}`;
        notifBody = `Halo ${st.full_name}, tugas "${title}" telah melewati tenggat waktu. Segera kumpulkan jawaban Anda.`;
      } else if (category === 'LOW_SCORE') {
        notifTitle = `[EVALUASI BELAJAR] Remedial: ${title}`;
        notifBody = `Halo ${st.full_name}, nilai evaluasi "${title}" masih di bawah standar KKM. Silakan hubungi guru untuk bimbingan remedial.`;
      }

      const isValidUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const refType = category === 'UNREAD_MATERIAL' ? 'material' : 'assignment';
      const refId = isValidUuid(material_id) ? material_id : (isValidUuid(assignment_id) ? assignment_id : null);

      const notifRes = await pool.query(
        `
        INSERT INTO notifications (
          id, tenant_id, user_id, title, body, notification_type,
          channel, reference_type, reference_id, is_read, is_urgent,
          priority, scheduled_at, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'SMART_REMINDER',
          'in_app', $5, $6, false, true,
          'HIGH', $7, $7
        )
        RETURNING id, user_id, title, created_at
        `,
        [st.tenant_id, st.user_id, notifTitle, notifBody, refType, refId, now]
      );

      if (notifRes.rows.length > 0) {
        insertedReminders.push({
          notification_id: notifRes.rows[0].id,
          student_id: st.id,
          student_name: st.full_name,
          user_id: st.user_id,
          sent_at: now.toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pengingat berhasil dikirim ke ${insertedReminders.length} siswa secara realtime.`,
      sent_count: insertedReminders.length,
      sent_at: now.toISOString(),
      reminders: insertedReminders,
    });
  } catch (err: any) {
    console.error('Error sending teacher reminder:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal mengirim pengingat ke siswa' },
      { status: 500 }
    );
  }
}
