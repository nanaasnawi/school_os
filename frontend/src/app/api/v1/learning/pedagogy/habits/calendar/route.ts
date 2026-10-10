import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const classId = searchParams.get('class_id');
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const month = searchParams.get('month');
    const year = searchParams.get('year') || '2026';

    const pool = getDbPool();

    // Determine date boundaries
    let startDate: string;
    let endDate: string;

    if (startDateParam && endDateParam) {
      startDate = startDateParam;
      endDate = endDateParam;
    } else if (month) {
      const m = parseInt(month, 10);
      const start = new Date(parseInt(year, 10), m - 1, 1);
      const end = new Date(parseInt(year, 10), m, 0);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    } else {
      // Default to current 30-day window
      const now = new Date();
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = past30.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: STUDENT SPECIFIC CALENDAR & STREAK BREAKDOWN
    // ─────────────────────────────────────────────────────────────────────────
    if (studentId) {
      const entriesRes = await pool.query(
        `SELECT 
           id, entry_date, completed_count, compliance_rate, 
           habits, habits_notes, verification_status,
           verified_at, verified_by_role, parent_feedback, teacher_notes, override_reason
         FROM habit_tracker_entries
         WHERE student_id = $1
           AND entry_date >= $2 AND entry_date <= $3
         ORDER BY entry_date ASC`,
        [studentId, startDate, endDate]
      );

      const entries = entriesRes.rows;
      const totalDays = entries.length;

      let sumCompliance = 0;
      let pendingCount = 0;
      let verifiedCount = 0;
      let expiredCount = 0;
      let overrideCount = 0;

      const habitTotals: Record<string, number> = {
        bangun_pagi: 0,
        beribadah: 0,
        berolahraga: 0,
        makan_sehat: 0,
        gemar_belajar: 0,
        bermasyarakat: 0,
        tidur_tepat_waktu: 0
      };

      for (const e of entries) {
        sumCompliance += parseFloat(e.compliance_rate || 0);
        if (e.verification_status === 'PENDING') pendingCount++;
        else if (e.verification_status === 'PARENT_VERIFIED') verifiedCount++;
        else if (e.verification_status === 'SYSTEM_EXPIRED') expiredCount++;
        else if (e.verification_status === 'TEACHER_OVERRIDE') overrideCount++;

        const h = e.habits || {};
        for (const k of Object.keys(habitTotals)) {
          if (h[k] === true) habitTotals[k]++;
        }
      }

      const avgCompliance = totalDays > 0 ? Math.round((sumCompliance / totalDays) * 100) / 100 : 0;

      // Calculate streak: consecutive days with completed_count >= 5
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;

      // Sort descending to find current active streak from latest date
      const descEntries = [...entries].reverse();
      let streakActive = true;
      for (const e of descEntries) {
        if (streakActive && e.completed_count >= 5) {
          currentStreak++;
        } else {
          streakActive = false;
        }
      }

      for (const e of entries) {
        if (e.completed_count >= 5) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      const habitsBreakdown: Record<string, { count: number; rate: number }> = {};
      for (const [k, count] of Object.entries(habitTotals)) {
        habitsBreakdown[k] = {
          count,
          rate: totalDays > 0 ? Math.round((count / totalDays) * 10000) / 100 : 0
        };
      }

      return NextResponse.json({
        success: true,
        student_id: studentId,
        date_range: { start_date: startDate, end_date: endDate },
        summary: {
          total_days_recorded: totalDays,
          average_compliance_rate: avgCompliance,
          current_streak_days: currentStreak,
          longest_streak_days: maxStreak,
          status_counts: {
            pending: pendingCount,
            parent_verified: verifiedCount,
            system_expired: expiredCount,
            teacher_override: overrideCount
          },
          habits_breakdown: habitsBreakdown
        },
        entries: entries
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 2: CLASS MONITORING OVERVIEW (HOMEROOM TEACHER WORKSTATION)
    // ─────────────────────────────────────────────────────────────────────────
    if (classId) {
      // Get enrolled students in class
      const classRes = await pool.query(
        `SELECT id, name FROM classes WHERE id = $1`,
        [classId]
      );

      if (classRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan.' }, { status: 404 });
      }

      const studentsRes = await pool.query(
        `SELECT s.id, s.full_name, s.nisn, s.gender
         FROM enrollments e
         JOIN students s ON e.student_id = s.id
         WHERE e.class_id = $1 AND (e.status IS NULL OR e.status = 'ACTIVE') AND s.deleted_at IS NULL
         ORDER BY s.full_name ASC`,
        [classId]
      );

      const students = studentsRes.rows;

      // Get habit aggregated metrics for these students in the range
      const habitAggRes = await pool.query(
        `SELECT 
           h.student_id,
           COUNT(h.id)::int as total_entries,
           ROUND(AVG(h.compliance_rate), 2)::numeric as avg_compliance,
           COUNT(CASE WHEN h.verification_status = 'PENDING' THEN 1 END)::int as pending_count,
           COUNT(CASE WHEN h.verification_status = 'SYSTEM_EXPIRED' THEN 1 END)::int as expired_count,
           COUNT(CASE WHEN h.verification_status = 'PARENT_VERIFIED' THEN 1 END)::int as verified_count,
           COUNT(CASE WHEN h.verification_status = 'TEACHER_OVERRIDE' THEN 1 END)::int as override_count,
           MAX(h.entry_date) as last_entry_date
         FROM habit_tracker_entries h
         WHERE h.student_id = ANY($1::uuid[])
           AND h.entry_date >= $2 AND h.entry_date <= $3
         GROUP BY h.student_id`,
        [students.map((s: any) => s.id), startDate, endDate]
      );

      const aggMap = new Map();
      for (const row of habitAggRes.rows) {
        aggMap.set(row.student_id, row);
      }

      let classSumCompliance = 0;
      let activeStudentsCount = 0;
      let totalPendingInClass = 0;
      let totalExpiredInClass = 0;

      const studentSummaries = students.map((s: any) => {
        const stat = aggMap.get(s.id) || {
          total_entries: 0,
          avg_compliance: 0,
          pending_count: 0,
          expired_count: 0,
          verified_count: 0,
          override_count: 0,
          last_entry_date: null
        };

        if (stat.total_entries > 0) {
          classSumCompliance += parseFloat(stat.avg_compliance);
          activeStudentsCount++;
        }
        totalPendingInClass += stat.pending_count;
        totalExpiredInClass += stat.expired_count;

        return {
          ...s,
          metrics: stat
        };
      });

      const classAvgCompliance = activeStudentsCount > 0 
        ? Math.round((classSumCompliance / activeStudentsCount) * 100) / 100 
        : 0;

      return NextResponse.json({
        success: true,
        class: classRes.rows[0],
        date_range: { start_date: startDate, end_date: endDate },
        class_summary: {
          total_enrolled: students.length,
          active_participating: activeStudentsCount,
          participation_rate: students.length > 0 ? Math.round((activeStudentsCount / students.length) * 10000) / 100 : 0,
          average_compliance_rate: classAvgCompliance,
          total_pending_verifications: totalPendingInClass,
          total_expired_needing_override: totalExpiredInClass
        },
        students: studentSummaries
      });
    }

    return NextResponse.json(
      { success: false, error: 'student_id atau class_id wajib disertakan dalam parameter query.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
