import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

const SUBJECT_WEEKLY_HOURS: Record<string, number> = {
  '401000000': 4,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    // 1. Ambil data modul ajar
    const modulRes = await pool.query(
      `SELECT * FROM modul_ajar WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    );

    if (modulRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Modul Ajar tidak ditemukan.' },
        { status: 404 }
      );
    }

    const modul = modulRes.rows[0];

    // 2. POIN KRITIS 2: Validasi Relasional ke TP & Status PUBLISHED
    const tpRes = await pool.query(
      `SELECT id, code, publication_status FROM learning_objectives WHERE id = $1 AND deleted_at IS NULL;`,
      [modul.learning_objective_id]
    );

    if (tpRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tujuan Pembelajaran induk tidak ditemukan.' },
        { status: 404 }
      );
    }

    const tp = tpRes.rows[0];
    if (tp.publication_status !== 'PUBLISHED') {
      return NextResponse.json(
        {
          success: false,
          error_code: 'TP_NOT_PUBLISHED',
          message: `Gagal mengaktifkan Modul Ajar. Tujuan Pembelajaran induk (${tp.code}) saat ini berstatus '${tp.publication_status}'. Modul Ajar hanya dapat diaktifkan jika TP telah berstatus PUBLISHED.`,
          current_status: tp.publication_status,
        },
        { status: 400 }
      );
    }

    // 3. POIN KRITIS 1: Validasi Alokasi Jam Kaldik (MEB Engine)
    const mebWeeks = modul.semester.toUpperCase() === 'EVEN' ? 17 : 18;
    const weeklyHours = getSubjectWeeklyHours(modul.subject_code || modul.subject_name);
    const totalCapacityJp = mebWeeks * weeklyHours;

    // Hitung alokasi modul ajar aktif lain di semester ini (kecualikan modul ini sendiri)
    const otherAllocatedRes = await pool.query(
      `SELECT COALESCE(SUM(allocated_hours), 0)::integer AS other_allocated_jp
       FROM modul_ajar
       WHERE academic_year = $1
         AND semester = $2
         AND (subject_code = $3 OR subject_name ILIKE $4)
         AND status = 'ACTIVE'
         AND id != $5
         AND deleted_at IS NULL;`,
      [modul.academic_year, modul.semester, modul.subject_code, `%${modul.subject_name}%`, id]
    );

    const otherAllocated = Number(otherAllocatedRes.rows[0]?.other_allocated_jp || 0);
    const remainingAvailable = totalCapacityJp - otherAllocated;

    if (modul.allocated_hours > remainingAvailable) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'KALDIK_HOURS_EXCEEDED',
          message: `Alokasi modul ajar (${modul.allocated_hours} JP) melampaui sisa kapasitas efektif semester (${remainingAvailable} JP tersisa dari total ${totalCapacityJp} JP pada ${mebWeeks} Pekan MEB).`,
          budget: {
            academic_year: modul.academic_year,
            semester: modul.semester,
            meb_weeks: mebWeeks,
            weekly_hours: weeklyHours,
            total_capacity_jp: totalCapacityJp,
            other_allocated_jp: otherAllocated,
            remaining_available_jp: remainingAvailable,
            requested_jp: modul.allocated_hours,
          },
        },
        { status: 422 }
      );
    }

    // 4. Update status ke ACTIVE dan reset suspension_reason
    const updateRes = await pool.query(
      `UPDATE modul_ajar
       SET 
         status = 'ACTIVE',
         suspension_reason = NULL,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Modul Ajar berhasil disahkan dan diaktifkan untuk pembelajaran!',
      modul_ajar: updateRes.rows[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
