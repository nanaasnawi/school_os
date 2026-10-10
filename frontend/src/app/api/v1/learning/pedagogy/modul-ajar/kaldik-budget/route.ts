import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

const SUBJECT_WEEKLY_HOURS: Record<string, number> = {
  '401000000': 4, // Matematika
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
    const semester = (searchParams.get('semester') || 'ODD').toUpperCase();
    const subjectCode = searchParams.get('subject_code') || '';
    const subjectName = searchParams.get('subject_name') || '';

    const mebWeeks = semester === 'EVEN' ? 17 : 18;
    const hebDays = semester === 'EVEN' ? 87 : 93;
    const weeklyHours = getSubjectWeeklyHours(subjectCode || subjectName);
    const totalCapacityJp = mebWeeks * weeklyHours;

    const pool = getDbPool();
    const query = `
      SELECT COALESCE(SUM(allocated_hours), 0)::integer AS allocated_jp
      FROM modul_ajar
      WHERE academic_year = $1
        AND semester = $2
        AND (subject_code = $3 OR subject_name ILIKE $4 OR $3 = '')
        AND status IN ('ACTIVE', 'DRAFT')
        AND deleted_at IS NULL;
    `;

    const res = await pool.query(query, [
      academicYear,
      semester,
      subjectCode,
      subjectName ? `%${subjectName}%` : '%',
    ]);
    const allocatedJp = Number(res.rows[0]?.allocated_jp || 0);
    const remainingAvailableJp = Math.max(0, totalCapacityJp - allocatedJp);
    const allocationPercentage = Math.min(
      100,
      Math.round((allocatedJp / totalCapacityJp) * 100)
    );

    return NextResponse.json({
      success: true,
      budget: {
        academic_year: academicYear,
        semester,
        meb_weeks: mebWeeks,
        heb_days: hebDays,
        weekly_hours: weeklyHours,
        total_capacity_jp: totalCapacityJp,
        allocated_jp: allocatedJp,
        remaining_available_jp: remainingAvailableJp,
        allocation_percentage: allocationPercentage,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
