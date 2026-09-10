import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Overview counts
    const overviewRes = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students WHERE deleted_at IS NULL) AS total_students,
        (SELECT COUNT(*) FROM students WHERE status IN ('Active', 'active') AND deleted_at IS NULL) AS active_students,
        (SELECT COUNT(*) FROM students WHERE status IN ('transferred', 'Transferred') AND deleted_at IS NULL) AS transferred_students,
        (SELECT COUNT(*) FROM teachers WHERE deleted_at IS NULL) AS total_teachers,
        (SELECT COUNT(*) FROM teachers WHERE is_active = true AND deleted_at IS NULL) AS active_teachers,
        (SELECT COUNT(*) FROM staff WHERE deleted_at IS NULL) AS total_tendik,
        (SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL) AS total_classes,
        (SELECT COUNT(DISTINCT class_id) FROM enrollments WHERE status = 'Active') AS active_classes_with_students,
        (SELECT COUNT(*) FROM guardians WHERE deleted_at IS NULL) AS total_guardians,
        (SELECT COUNT(*) FROM user_qr_tokens WHERE is_active = true) AS active_qr_tokens,
        (SELECT COUNT(*) FROM learning_materials) AS total_learning_materials,
        (SELECT COUNT(*) FROM quizzes) AS total_quizzes,
        (SELECT COUNT(*) FROM assignments) AS total_assignments,
        (SELECT COUNT(*) FROM assignment_submissions) AS total_submissions,
        (SELECT COUNT(*) FROM dapodik_sync_records) AS dapodik_sync_records,
        (SELECT COUNT(*) FROM notifications) AS total_notifications
    `);
    const o = overviewRes.rows[0];
    const totalStudentsNum = parseInt(o.total_students, 10) || 1;

    // 2. Gender distribution
    const genderRes = await pool.query(`
      SELECT gender, COUNT(*)::int AS count
      FROM students
      WHERE deleted_at IS NULL
      GROUP BY gender
      ORDER BY gender
    `);
    let maleCount = 0;
    let femaleCount = 0;
    genderRes.rows.forEach((r: { gender: string | null; count: number }) => {
      const g = (r.gender || '').toUpperCase();
      if (g === 'L' || g === 'MALE' || g === 'LAKI-LAKI') {
        maleCount += r.count;
      } else if (g === 'P' || g === 'FEMALE' || g === 'PEREMPUAN') {
        femaleCount += r.count;
      }
    });

    const genderDistribution = [
      {
        gender: 'L',
        label: 'Laki-laki',
        count: maleCount,
        percentage: Number(((maleCount / totalStudentsNum) * 100).toFixed(1)),
        color: '#2563eb',
      },
      {
        gender: 'P',
        label: 'Perempuan',
        count: femaleCount,
        percentage: Number(((femaleCount / totalStudentsNum) * 100).toFixed(1)),
        color: '#ec4899',
      },
    ];

    // 3. Jenjang distribution (Paket A, B, C)
    const jenjangRes = await pool.query(`
      SELECT 
        CASE 
          WHEN c.name LIKE 'PAKET A%' THEN 'Paket A (Setara SD)'
          WHEN c.name LIKE 'PAKET B%' THEN 'Paket B (Setara SMP)'
          WHEN c.name LIKE 'PAKET C%' THEN 'Paket C (Setara SMA)'
          ELSE 'Lainnya'
        END AS jenjang,
        COUNT(e.id)::int AS student_count,
        COUNT(DISTINCT c.id)::int AS class_count
      FROM classes c
      LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'Active'
      WHERE c.deleted_at IS NULL
      GROUP BY 1
      ORDER BY 1
    `);

    const jenjangDistribution = jenjangRes.rows
      .filter((r: { jenjang: string; student_count: number; class_count: number }) => r.jenjang !== 'Lainnya' || r.student_count > 0)
      .map((r: { jenjang: string; student_count: number; class_count: number }) => ({
        jenjang: r.jenjang,
        student_count: r.student_count,
        class_count: r.class_count,
        percentage: Number(((r.student_count / totalStudentsNum) * 100).toFixed(1)),
      }));

    // 4. Distribution of students per class / rombel (only active with students, sorted)
    const rombelRes = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.jenis_rombel,
        COUNT(e.id)::int AS student_count
      FROM classes c
      LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'Active'
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.jenis_rombel
      HAVING COUNT(e.id) > 0
      ORDER BY student_count DESC, c.name ASC
    `);

    // 5. Academic Performance per Subject from Gradebooks
    const academicRes = await pool.query(`
      SELECT 
        s.id AS subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        COUNT(g.id)::int AS total_graded,
        ROUND(AVG(CASE WHEN g.final_score > 0 THEN g.final_score ELSE NULL END), 1)::float AS average_score,
        MIN(g.final_score)::float AS min_score,
        MAX(g.final_score)::float AS max_score,
        COUNT(CASE WHEN g.passed = true THEN 1 END)::int AS passed_count,
        COUNT(CASE WHEN g.passed = false THEN 1 END)::int AS remedial_count
      FROM gradebooks g
      JOIN subjects s ON s.id = g.subject_id
      GROUP BY s.id, s.name, s.code
      HAVING MAX(g.final_score) > 0
      ORDER BY average_score DESC
    `);

    // 6. Active Announcements (Pinned and Latest)
    const announcementsRes = await pool.query(`
      SELECT 
        id, 
        title, 
        content, 
        category, 
        target, 
        author, 
        is_pinned, 
        push_status, 
        created_at
      FROM announcements
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT 6
    `);

    // 7. Recent Audit & System Events
    const auditRes = await pool.query(`
      SELECT 
        id, 
        action, 
        resource, 
        decision, 
        reason,
        timestamp AS created_at
      FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 6
    `);

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          total_students: parseInt(o.total_students, 10) || 0,
          active_students: parseInt(o.active_students, 10) || 0,
          transferred_students: parseInt(o.transferred_students, 10) || 0,
          total_teachers: parseInt(o.total_teachers, 10) || 0,
          active_teachers: parseInt(o.active_teachers, 10) || 0,
          total_tendik: parseInt(o.total_tendik, 10) || 0,
          total_classes: parseInt(o.total_classes, 10) || 0,
          active_classes: parseInt(o.active_classes_with_students, 10) || 0,
          total_guardians: parseInt(o.total_guardians, 10) || 0,
          active_qr_tokens: parseInt(o.active_qr_tokens, 10) || 0,
          total_learning_materials: parseInt(o.total_learning_materials, 10) || 0,
          total_quizzes: parseInt(o.total_quizzes, 10) || 0,
          total_assignments: parseInt(o.total_assignments, 10) || 0,
          total_submissions: parseInt(o.total_submissions, 10) || 0,
          dapodik_sync_records: parseInt(o.dapodik_sync_records, 10) || 0,
          total_notifications: parseInt(o.total_notifications, 10) || 0,
        },
        gender_distribution: genderDistribution,
        jenjang_distribution: jenjangDistribution,
        rombel_distribution: rombelRes.rows,
        academic_performance: academicRes.rows,
        announcements: announcementsRes.rows,
        recent_activities: auditRes.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard real analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard real analytics',
      },
      { status: 500 }
    );
  }
}
