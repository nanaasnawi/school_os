import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    const teacherIdParam = searchParams.get('teacher_id');
    const userIdParam = searchParams.get('user_id');
    const allParam = searchParams.get('all');
    const academicYearId = searchParams.get('academic_year_id');

    const pool = getDbPool();

    // 1. Dapatkan daftar seluruh kelas aktif di database PostgreSQL dengan relasi guru wali dan jumlah siswa aktif
    let query = `
      SELECT 
        c.id, 
        c.name, 
        c.academic_year_id,
        c.grade_level_id, 
        c.homeroom_teacher_id, 
        c.tingkat, 
        c.capacity,
        t.full_name AS homeroom_teacher_name,
        t.user_id AS homeroom_user_id,
        COUNT(e.id)::int AS student_count
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN enrollments e ON c.id = e.class_id AND (e.status IS NULL OR LOWER(e.status) = 'active')
      WHERE c.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (academicYearId) {
      params.push(academicYearId);
      query += ` AND c.academic_year_id = $${params.length}`;
    }

    query += `
      GROUP BY c.id, c.name, c.academic_year_id, c.grade_level_id, c.homeroom_teacher_id, c.tingkat, c.capacity, t.full_name, t.user_id
      ORDER BY c.name ASC
    `;

    const res = await pool.query(query, params);
    const allClasses = res.rows;

    // 2. Jika peran adalah Kepala Sekolah / Admin / SuperAdmin atau parameter all=true, kembalikan seluruh kelas
    const isPrincipalOrAdmin = 
      allParam === 'true' ||
      roleParam?.toLowerCase().includes('kepala') ||
      roleParam?.toLowerCase().includes('admin') ||
      roleParam?.toLowerCase().includes('operator') ||
      roleParam?.toLowerCase().includes('staff');

    if (isPrincipalOrAdmin || (!teacherIdParam && !userIdParam)) {
      return NextResponse.json({
        success: true,
        data: allClasses,
        classes: allClasses,
        total: allClasses.length,
        role_scope: isPrincipalOrAdmin ? 'SCHOOL_WIDE_SUPERVISOR' : 'ALL_CLASSES',
      });
    }

    // 3. Jika pengguna adalah Guru, cek kelas yang diampu (wali kelas atau jadwal mengajar)
    let teacherId = teacherIdParam;
    if (!teacherId && userIdParam) {
      const tRes = await pool.query(
        `SELECT id FROM teachers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [userIdParam]
      );
      if (tRes.rows.length > 0) {
        teacherId = tRes.rows[0].id;
      }
    }

    if (teacherId) {
      const assignedClassRes = await pool.query(
        `SELECT DISTINCT c.id FROM classes c
         WHERE c.deleted_at IS NULL
           AND (
             c.homeroom_teacher_id = $1
             OR EXISTS (
               SELECT 1 FROM class_schedules cs 
               WHERE cs.class_id = c.id AND cs.teacher_id = $1 AND cs.deleted_at IS NULL
             )
           )`,
        [teacherId]
      );
      const assignedIds = new Set(assignedClassRes.rows.map((r: any) => r.id));

      // Berikan penanda is_assigned pada setiap kelas
      const markedClasses = allClasses.map((c: any) => ({
        ...c,
        is_assigned: assignedIds.has(c.id),
      }));

      // Urutkan kelas binaan guru di atas, namun jangan sembunyikan kelas lain agar guru tetap dapat berkolaborasi
      markedClasses.sort((a: any, b: any) => {
        if (a.is_assigned && !b.is_assigned) return -1;
        if (!a.is_assigned && b.is_assigned) return 1;
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({
        success: true,
        data: markedClasses,
        classes: markedClasses,
        total: markedClasses.length,
        assigned_count: assignedIds.size,
        role_scope: 'TEACHER_ASSIGNMENT',
      });
    }

    return NextResponse.json({
      success: true,
      data: allClasses,
      classes: allClasses,
      total: allClasses.length,
      role_scope: 'DEFAULT',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
