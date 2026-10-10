import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const CANONICAL_HABITS = [
  { key: 'bangun_pagi', label: 'Bangun Pagi', description: 'Bangun pagi sebelum fajar/subuh dengan penuh semangat dan merapikan tempat tidur.' },
  { key: 'beribadah', label: 'Beribadah', description: 'Melaksanakan ibadah wajib tepat waktu dan berdoa harian sesuai keyakinan agama.' },
  { key: 'berolahraga', label: 'Berolahraga', description: 'Beraktivitas fisik atau berolahraga ringan minimal 15-30 menit untuk kebugaran.' },
  { key: 'makan_sehat', label: 'Makan Sehat & Bergizi', description: 'Mengonsumsi makanan bergizi seimbang (sayur, buah, protein, air putih cukup).' },
  { key: 'gemar_belajar', label: 'Gemar Belajar & Membaca', description: 'Membaca buku literasi, mengulang pelajaran, atau mengeksplorasi wawasan baru secara mandiri.' },
  { key: 'bermasyarakat', label: 'Bermasyarakat & Gotong Royong', description: 'Membantu orang tua di rumah, bersosialisasi dengan sopan, atau gotong-royong lingkungan.' },
  { key: 'tidur_tepat_waktu', label: 'Tidur Tepat Waktu', description: 'Beristirahat malam tepat waktu (tidak begadang) demi pemulihan daya tahan tubuh.' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'student_id wajib disertakan.' }, { status: 400 });
    }

    const pool = getDbPool();
    const res = await pool.query(
      `SELECT h.*, s.full_name as student_name, s.nisn 
       FROM habit_tracker_entries h
       JOIN students s ON h.student_id = s.id
       WHERE h.student_id = $1 AND h.entry_date = $2`,
      [studentId, date]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({
        success: true,
        entry_date: date,
        is_recorded: false,
        entry: null,
        canonical_habits: CANONICAL_HABITS
      });
    }

    return NextResponse.json({
      success: true,
      entry_date: date,
      is_recorded: true,
      entry: res.rows[0],
      canonical_habits: CANONICAL_HABITS
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      entry_date = new Date().toISOString().split('T')[0],
      academic_year = '2026/2027',
      semester = 'GANJIL',
      habits = {},
      habits_notes = {}
    } = body;

    if (!student_id) {
      return NextResponse.json({ success: false, error: 'student_id wajib diisi.' }, { status: 400 });
    }

    const pool = getDbPool();

    // Verify student exists and get tenant_id
    const studentRes = await pool.query(
      `SELECT id, tenant_id, full_name FROM students WHERE id = $1 AND deleted_at IS NULL`,
      [student_id]
    );

    if (studentRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Data siswa tidak ditemukan.' }, { status: 404 });
    }

    const tenantId = studentRes.rows[0].tenant_id;

    // Normalisasi 7 habits boolean payload
    const normalizedHabits = {
      bangun_pagi: Boolean(habits.bangun_pagi),
      beribadah: Boolean(habits.beribadah),
      berolahraga: Boolean(habits.berolahraga),
      makan_sehat: Boolean(habits.makan_sehat),
      gemar_belajar: Boolean(habits.gemar_belajar),
      bermasyarakat: Boolean(habits.bermasyarakat),
      tidur_tepat_waktu: Boolean(habits.tidur_tepat_waktu)
    };

    // Upsert habit entry
    const upsertQuery = `
      INSERT INTO habit_tracker_entries (
        tenant_id, student_id, entry_date, academic_year, semester,
        habits, habits_notes, verification_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'PENDING'
      )
      ON CONFLICT (tenant_id, student_id, entry_date)
      DO UPDATE SET
        habits = EXCLUDED.habits,
        habits_notes = EXCLUDED.habits_notes,
        academic_year = EXCLUDED.academic_year,
        semester = EXCLUDED.semester,
        verification_status = CASE 
          WHEN habit_tracker_entries.verification_status = 'PARENT_VERIFIED' THEN habit_tracker_entries.verification_status
          ELSE 'PENDING'
        END,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await pool.query(upsertQuery, [
      tenantId,
      student_id,
      entry_date,
      academic_year,
      semester.toUpperCase(),
      JSON.stringify(normalizedHabits),
      JSON.stringify(habits_notes)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Jurnal pembiasaan karakter 7 Kebiasaan berhasil disimpan.',
      entry: result.rows[0]
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
