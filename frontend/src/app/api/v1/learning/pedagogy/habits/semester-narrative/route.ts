import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

interface HabitDescriptor {
  key: string;
  label: string;
  high: string;
  moderate: string;
  low: string;
}

const HABIT_DESCRIPTORS: Record<string, HabitDescriptor> = {
  bangun_pagi: {
    key: 'bangun_pagi',
    label: 'Bangun Pagi',
    high: 'disiplin bangun pagi sebelum fajar secara konsisten dan mengawali hari dengan penuh semangat',
    moderate: 'mulai terbiasa bangun pagi dengan tertib',
    low: 'pembiasaan bangun pagi tepat waktu agar lebih segar saat mengawali aktivitas belajar'
  },
  beribadah: {
    key: 'beribadah',
    label: 'Beribadah',
    high: 'taat dan istikamah dalam menjalankan ibadah wajib serta doa harian sesuai keyakinan agamanya',
    moderate: 'menjalankan ibadah harian dengan tertib dan teratur',
    low: 'kesadaran dan keteraturan dalam beribadah harian secara mandiri di rumah'
  },
  berolahraga: {
    key: 'berolahraga',
    label: 'Berolahraga',
    high: 'antusias menjaga kebugaran jasmani melalui aktivitas fisik dan olahraga teratur',
    moderate: 'cukup aktif berolahraga demi menjaga kesehatan dan kebugaran tubuh',
    low: 'pembiasaan aktivitas fisik dan olahraga ringan minimal 15-30 menit setiap hari'
  },
  makan_sehat: {
    key: 'makan_sehat',
    label: 'Makan Sehat & Bergizi',
    high: 'membudayakan pola makan sehat bergizi seimbang (sayur, buah, protein) dan minum air putih yang cukup',
    moderate: 'terbiasa memilih menu makanan sehat bergizi',
    low: 'pembiasaan mengonsumsi makanan bergizi seimbang dan mengurangi konsumsi makanan instan'
  },
  gemar_belajar: {
    key: 'gemar_belajar',
    label: 'Gemar Belajar & Membaca',
    high: 'memiliki kegemaran belajar yang tinggi, gemar membaca buku literasi, dan bereksplorasi wawasan mandiri di rumah',
    moderate: 'menunjukkan ketekunan yang baik dalam belajar dan membaca mandiri di rumah',
    low: 'meningkatkan minat baca literasi dan alokasi waktu belajar mandiri di luar jam sekolah'
  },
  bermasyarakat: {
    key: 'bermasyarakat',
    label: 'Bermasyarakat & Bergotong Royong',
    high: 'berjiwa sosial tinggi, aktif membantu orang tua di rumah, santun, dan suka bergotong royong di lingkungannya',
    moderate: 'mampu bersosialisasi dengan sopan dan membantu keluarga di rumah',
    low: 'keterlibatan aktif membantu orang tua di rumah serta kepedulian sosial di lingkungan sekitar'
  },
  tidur_tepat_waktu: {
    key: 'tidur_tepat_waktu',
    label: 'Tidur Tepat Waktu',
    high: 'sangat tertib beristirahat malam tepat waktu demi menjaga kebugaran dan daya tahan tubuh',
    moderate: 'teratur beristirahat malam tanpa sering begadang',
    low: 'disiplin waktu tidur malam tidak larut agar metabolisme tubuh dan konsentrasi belajar tetap optimal'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const classId = searchParams.get('class_id');
    const academicYear = searchParams.get('academic_year') || '2026/2027';
    const semester = (searchParams.get('semester') || 'GANJIL').toUpperCase();
    const saveToSnapshot = searchParams.get('save_to_snapshot') === 'true';

    if (!studentId && !classId) {
      return NextResponse.json(
        { success: false, error: 'student_id atau class_id wajib disertakan.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // ─────────────────────────────────────────────────────────────────────────
    // AMBIL DAFTAR SISWA (SINGLE SISWA ATAU SELURUH KELAS)
    // ─────────────────────────────────────────────────────────────────────────
    let studentList: { id: string; full_name: string; nisn: string; tenant_id: string }[] = [];
    if (studentId) {
      const sRes = await pool.query(
        `SELECT id, full_name, nisn, tenant_id FROM students WHERE id = $1 AND deleted_at IS NULL`,
        [studentId]
      );
      if (sRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan.' }, { status: 404 });
      }
      studentList = sRes.rows;
    } else {
      const cRes = await pool.query(
        `SELECT s.id, s.full_name, s.nisn, s.tenant_id
         FROM enrollments e
         JOIN students s ON e.student_id = s.id
         WHERE e.class_id = $1 AND (e.status IS NULL OR LOWER(e.status) = 'active') AND s.deleted_at IS NULL
         ORDER BY s.full_name ASC`,
        [classId]
      );
      studentList = cRes.rows;
    }

    const narratives = [];

    for (const student of studentList) {
      // Query habit entries for this student in the academic year & semester
      const entriesRes = await pool.query(
        `SELECT 
           id, entry_date, completed_count, compliance_rate, habits, verification_status
         FROM habit_tracker_entries
         WHERE student_id = $1
           AND academic_year = $2
           AND (semester = $3 OR semester = CASE WHEN $3 = 'GANJIL' THEN 'ODD' ELSE 'EVEN' END)
         ORDER BY entry_date ASC`,
        [student.id, academicYear, semester]
      );

      const entries = entriesRes.rows;
      const totalDays = entries.length;

      const habitStats: Record<string, { count: number; rate: number }> = {
        bangun_pagi: { count: 0, rate: 0 },
        beribadah: { count: 0, rate: 0 },
        berolahraga: { count: 0, rate: 0 },
        makan_sehat: { count: 0, rate: 0 },
        gemar_belajar: { count: 0, rate: 0 },
        bermasyarakat: { count: 0, rate: 0 },
        tidur_tepat_waktu: { count: 0, rate: 0 }
      };

      let sumCompliance = 0;
      let verifiedCount = 0;
      let overrideCount = 0;

      for (const e of entries) {
        sumCompliance += parseFloat(e.compliance_rate || 0);
        if (e.verification_status === 'PARENT_VERIFIED') verifiedCount++;
        if (e.verification_status === 'TEACHER_OVERRIDE') overrideCount++;

        const h = e.habits || {};
        for (const k of Object.keys(habitStats)) {
          if (h[k] === true) habitStats[k].count++;
        }
      }

      for (const k of Object.keys(habitStats)) {
        habitStats[k].rate = totalDays > 0 ? Math.round((habitStats[k].count / totalDays) * 10000) / 100 : 0;
      }

      const overallCompliance = totalDays > 0 ? Math.round((sumCompliance / totalDays) * 100) / 100 : 0;

      // Klasifikasi Habit: Sangat Membudaya (>= 85%), Berkembang (70-84%), Perlu Penguatan (< 70%)
      const highHabits: string[] = [];
      const moderateHabits: string[] = [];
      const lowHabits: string[] = [];

      for (const [key, stat] of Object.entries(habitStats)) {
        if (stat.rate >= 85.0) {
          highHabits.push(key);
        } else if (stat.rate >= 70.0) {
          moderateHabits.push(key);
        } else {
          lowHabits.push(key);
        }
      }

      // Sort keys by rate descending
      const sortedHabits = Object.entries(habitStats).sort((a, b) => b[1].rate - a[1].rate);
      const topHabits = sortedHabits.slice(0, 2);
      const bottomHabits = sortedHabits.slice(-2).reverse();

      // Sintesis Teks Narasi Rapor Sesuai Format Kemendikdasmen RI
      let narrativeText = '';

      if (totalDays === 0) {
        narrativeText = `Ananda ${student.full_name} belum mencatatkan rekam jejak jurnal harian Gerakan 7 Kebiasaan Anak Indonesia Hebat (G7KAIH) pada semester ini. Diperlukan koordinasi antara wali kelas dan orang tua untuk menumbuhkan komitmen pembiasaan karakter di rumah.`;
      } else {
        const topHabitDesc1 = HABIT_DESCRIPTORS[topHabits[0][0]]?.high || 'menunjukkan karakter terpuji';
        const topHabitDesc2 = topHabits.length > 1 ? HABIT_DESCRIPTORS[topHabits[1][0]]?.high : null;

        let strengthClause = `menunjukkan konsistensi yang sangat membudaya dalam ${topHabitDesc1}`;
        if (topHabitDesc2 && topHabits[1][1].rate >= 70.0) {
          strengthClause += `, serta ${topHabitDesc2}`;
        }

        narrativeText = `Ananda ${student.full_name} ${strengthClause}. Tingkat konsistensi pembiasaan karakter harian mencapai ${overallCompliance}%. `;

        if (lowHabits.length > 0) {
          const weakestKey = bottomHabits[0][0];
          const weakDesc = HABIT_DESCRIPTORS[weakestKey]?.low || 'pembiasaan harian tertentu';
          narrativeText += `Perlu terus didampingi dan dimotivasi bersama keluarga dalam ${weakDesc} agar ritme hidup teratur dan kebugaran tubuh senantiasa terjaga optimal.`;
        } else {
          narrativeText += `Seluruh indikator pembiasaan 7 Kebiasaan telah berkembang sangat baik sesuai harapan. Pertahankan pembiasaan mulia ini sebagai bekal keteladanan bagi lingkungan sekitar.`;
        }
      }

      // Metadata untuk e-Rapor
      const narrativeResult = {
        student_id: student.id,
        student_name: student.full_name,
        nisn: student.nisn,
        academic_year: academicYear,
        semester: semester,
        total_days_recorded: totalDays,
        overall_compliance_rate: overallCompliance,
        verification_summary: {
          parent_verified: verifiedCount,
          teacher_override: overrideCount,
          verification_rate: totalDays > 0 ? Math.round(((verifiedCount + overrideCount) / totalDays) * 10000) / 100 : 0
        },
        habits_breakdown: habitStats,
        categorization: {
          sangat_membudaya: highHabits.map(k => HABIT_DESCRIPTORS[k].label),
          berkembang_sesuai_harapan: moderateHabits.map(k => HABIT_DESCRIPTORS[k].label),
          perlu_penguatan: lowHabits.map(k => HABIT_DESCRIPTORS[k].label)
        },
        report_card_narrative: narrativeText
      };

      // Optional: Simpan atau inject ke gradebook_snapshots jika ada snapshot yang sudah dibuat
      if (saveToSnapshot) {
        await pool.query(
          `UPDATE gradebook_snapshots
           SET snapshot_data = jsonb_set(
             snapshot_data, 
             '{attitude_narrative}', 
             $1::jsonb, 
             true
           ),
           updated_at = NOW()
           WHERE student_id = $2 
             AND academic_year = $3 
             AND semester = $4`,
          [
            JSON.stringify({
              g7kaih_narrative: narrativeText,
              overall_compliance: overallCompliance,
              total_days: totalDays,
              updated_at: new Date().toISOString()
            }),
            student.id,
            academicYear,
            semester
          ]
        );
      }

      narratives.push(narrativeResult);
    }

    return NextResponse.json({
      success: true,
      academic_year: academicYear,
      semester: semester,
      total_students: narratives.length,
      narratives: studentId ? narratives[0] : narratives
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
