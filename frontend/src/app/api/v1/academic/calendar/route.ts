import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getApiBaseUrl } from '@/lib/api';

// PostgreSQL client pool for direct database connectivity
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:ePssELIUrkhPIlsGqKvIgGvMuDodFsYM@altaria.proxy.rlwy.net:21200/railway',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

export interface CalendarEventResponse {
  id: string;
  academicYear: string;
  semester: 'ODD' | 'EVEN' | 'ALL';
  title: string;
  startDate: string;
  endDate: string;
  category: 'EFFECTIVE_LEARNING' | 'HOLIDAY_NATIONAL' | 'HOLIDAY_SEMESTER' | 'ASSESSMENT' | 'REPORT_CARD' | 'SCHOOL_EVENT';
  color: string;
  description?: string;
  isNationalHoliday?: boolean;
}

export interface CalendarMetricsResponse {
  effectiveDays: number;
  effectiveWeeks: number;
  holidayDays: number;
  assessmentDays: number;
  totalEvents: number;
}

// Map backend category format to frontend standardized categories
function mapCategory(cat: string): CalendarEventResponse['category'] {
  const c = (cat || '').toUpperCase();
  if (c === 'LEARNING_DAY' || c === 'EFFECTIVE_LEARNING') return 'EFFECTIVE_LEARNING';
  if (c === 'NATIONAL_HOLIDAY' || c === 'HOLIDAY_NATIONAL') return 'HOLIDAY_NATIONAL';
  if (c === 'HOLIDAY_SEMESTER') return 'HOLIDAY_SEMESTER';
  if (c === 'EXAM' || c === 'ASSESSMENT') return 'ASSESSMENT';
  if (c === 'REPORT_CARD') return 'REPORT_CARD';
  return 'SCHOOL_EVENT';
}

/**
 * GET /api/v1/academic/calendar
 * Mengambil agenda kalender pendidikan & analisis MEB dari Backend / Database PostgreSQL
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear') || searchParams.get('academic_year') || '2026/2027';
    const semester = (searchParams.get('semester') || 'ALL').toUpperCase();

    // 1. Coba panggil Backend Rust API Server terlebih dahulu
    const backendBase = getApiBaseUrl();
    const authHeader = req.headers.get('authorization') || '';
    const tenantHeader = req.headers.get('x-tenant-id') || '';

    try {
      const backendRes = await fetch(
        `${backendBase}/api/v1/academic/calendar?academic_year=${encodeURIComponent(academicYear)}&semester=${encodeURIComponent(semester)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
            ...(tenantHeader ? { 'x-tenant-id': tenantHeader } : {}),
          },
          cache: 'no-store',
        }
      );

      if (backendRes.ok) {
        const backendJson = await backendRes.json();
        const payload = backendJson.data || backendJson;

        if (payload && Array.isArray(payload.events)) {
          const events: CalendarEventResponse[] = payload.events.map((e: any) => ({
            id: String(e.id),
            academicYear: e.academic_year || academicYear,
            semester: e.semester || 'ODD',
            title: e.title,
            startDate: typeof e.start_date === 'string' ? e.start_date.split('T')[0] : e.start_date,
            endDate: typeof e.end_date === 'string' ? e.end_date.split('T')[0] : e.end_date,
            category: mapCategory(e.category),
            color: e.color || '#0284c7',
            description: e.description || '',
            isNationalHoliday: Boolean(e.is_national_holiday),
          }));

          const metrics: CalendarMetricsResponse = {
            effectiveDays: payload.metrics?.effective_days ?? 175,
            effectiveWeeks: payload.metrics?.effective_weeks ?? 35,
            holidayDays: payload.metrics?.holiday_days ?? 45,
            assessmentDays: payload.metrics?.assessment_days ?? 24,
            totalEvents: payload.metrics?.total_events ?? events.length,
          };

          return NextResponse.json({
            success: true,
            source: 'rust_backend',
            academicYear,
            semester,
            data: events,
            metrics,
            mebBreakdown: payload.meb_breakdown || [],
          });
        }
      }
    } catch {
      // Backend server sedang redeploy / tidak merespons, beralih ke direct query PostgreSQL
    }

    // 2. Direct Query ke PostgreSQL Database (academic_calendar_events)
    const client = await pool.connect();
    try {
      const semesterCondition = semester !== 'ALL' ? 'AND semester = $2' : '';
      const params: any[] = [academicYear];
      if (semester !== 'ALL') params.push(semester);

      const queryStr = `
        SELECT 
          id,
          academic_year,
          semester,
          title,
          TO_CHAR(start_date, 'YYYY-MM-DD') as start_date,
          TO_CHAR(end_date, 'YYYY-MM-DD') as end_date,
          category,
          COALESCE(color, '#0284c7') as color,
          description,
          is_effective_learning,
          is_national_holiday
        FROM academic_calendar_events
        WHERE academic_year = $1
          AND deleted_at IS NULL
          ${semesterCondition}
        ORDER BY start_date ASC;
      `;

      const result = await client.query(queryStr, params);

      const events: CalendarEventResponse[] = result.rows.map((row: any) => ({
        id: row.id,
        academicYear: row.academic_year,
        semester: row.semester,
        title: row.title,
        startDate: row.start_date,
        endDate: row.end_date,
        category: mapCategory(row.category),
        color: row.color,
        description: row.description || '',
        isNationalHoliday: row.is_national_holiday,
      }));

      // Kalkulasi metrik MEB & hari dari data database
      let holidayCount = 0;
      let assessmentCount = 0;

      for (const ev of events) {
        const start = new Date(ev.startDate).getTime();
        const end = new Date(ev.endDate).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

        if (ev.category === 'HOLIDAY_NATIONAL' || ev.category === 'HOLIDAY_SEMESTER') {
          holidayCount += days;
        } else if (ev.category === 'ASSESSMENT') {
          assessmentCount += days;
        }
      }

      const effectiveWeeks = semester === 'ODD' ? 18 : semester === 'EVEN' ? 17 : 35;
      const effectiveDays = effectiveWeeks * 5;

      const metrics: CalendarMetricsResponse = {
        effectiveDays,
        effectiveWeeks,
        holidayDays: holidayCount,
        assessmentDays: assessmentCount,
        totalEvents: events.length,
      };

      return NextResponse.json({
        success: true,
        source: 'database_postgresql',
        academicYear,
        semester,
        data: events,
        metrics,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error in Kaldik GET handler:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal memuat kalender pendidikan dari backend database',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/academic/calendar
 * Menambah agenda kegiatan baru ke database PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Cek aksi reset preset
    if (body.action === 'RESET_PRESET') {
      const client = await pool.connect();
      try {
        await client.query(`
          UPDATE academic_calendar_events
          SET deleted_at = NOW()
          WHERE tenant_id IS NOT NULL AND deleted_at IS NULL;
        `);
        return NextResponse.json({
          success: true,
          message: 'Berhasil mereset kalender ke baseline nasional resmi',
        });
      } finally {
        client.release();
      }
    }

    const {
      title,
      startDate,
      endDate,
      semester = 'ODD',
      academicYear = '2026/2027',
      category = 'SCHOOL_EVENT',
      color = '#0284c7',
      description = '',
      isNationalHoliday = false,
      isEffectiveLearning = false,
    } = body;

    if (!title?.trim() || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Judul dan tanggal mulai wajib diisi' },
        { status: 400 }
      );
    }

    // Insert ke PostgreSQL database
    const client = await pool.connect();
    try {
      const insertQuery = `
        INSERT INTO academic_calendar_events (
          academic_year, semester, title, start_date, end_date,
          category, color, description, is_effective_learning, is_national_holiday
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id, academic_year, semester, title,
          TO_CHAR(start_date, 'YYYY-MM-DD') as start_date,
          TO_CHAR(end_date, 'YYYY-MM-DD') as end_date,
          category, color, description, is_national_holiday;
      `;

      const result = await client.query(insertQuery, [
        academicYear,
        semester,
        title.trim(),
        startDate,
        endDate || startDate,
        category,
        color,
        description,
        isEffectiveLearning,
        isNationalHoliday,
      ]);

      const created = result.rows[0];

      return NextResponse.json(
        {
          success: true,
          message: 'Agenda kegiatan berhasil disimpan ke database',
          data: {
            id: created.id,
            academicYear: created.academic_year,
            semester: created.semester,
            title: created.title,
            startDate: created.start_date,
            endDate: created.end_date,
            category: mapCategory(created.category),
            color: created.color,
            description: created.description,
            isNationalHoliday: created.is_national_holiday,
          },
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error in Kaldik POST handler:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal menyimpan agenda ke database',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/academic/calendar?id=xxx
 * Menghapus agenda kegiatan dari database PostgreSQL (soft delete)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID agenda tidak ditemukan' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE academic_calendar_events SET deleted_at = NOW() WHERE id = $1;`,
        [id]
      );

      return NextResponse.json({
        success: true,
        message: 'Agenda berhasil dihapus dari database',
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error in Kaldik DELETE handler:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal menghapus agenda dari database',
      },
      { status: 500 }
    );
  }
}
