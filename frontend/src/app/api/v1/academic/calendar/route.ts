import { NextRequest, NextResponse } from 'next/server';

export interface CalendarEvent {
  id: string;
  academicYear: string; // e.g. "2026/2027"
  semester: 'ODD' | 'EVEN' | 'ALL';
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category: 'EFFECTIVE_LEARNING' | 'HOLIDAY_NATIONAL' | 'HOLIDAY_SEMESTER' | 'ASSESSMENT' | 'REPORT_CARD' | 'SCHOOL_EVENT';
  color: string;
  description?: string;
  isNationalHoliday?: boolean;
}

// In-memory persistent seed for the session, backed by predefined official template
const OFFICIAL_PRESET_EVENTS: CalendarEvent[] = [
  // ── SEMESTER GANJIL 2026/2027 ──
  {
    id: 'kaldik-01',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Hari Pertama Masuk & MPLS (Masa Pengenalan Lingkungan Sekolah)',
    startDate: '2026-07-13',
    endDate: '2026-07-15',
    category: 'SCHOOL_EVENT',
    color: '#0284c7',
    description: 'Orientasi sekolah ramah anak dan pengenalan budaya belajar Kurikulum Merdeka.'
  },
  {
    id: 'kaldik-02',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Awal Pembelajaran Efektif Semester Ganjil',
    startDate: '2026-07-16',
    endDate: '2026-07-16',
    category: 'EFFECTIVE_LEARNING',
    color: '#10b981',
    description: 'Kick-off kegiatan belajar mengajar aktif tatap muka & LMS.'
  },
  {
    id: 'kaldik-03',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Hari Proklamasi Kemerdekaan RI Ke-81',
    startDate: '2026-08-17',
    endDate: '2026-08-17',
    category: 'HOLIDAY_NATIONAL',
    color: '#ef4444',
    description: 'Libur Nasional Upacara Hari Kemerdekaan Republik Indonesia.',
    isNationalHoliday: true
  },
  {
    id: 'kaldik-04',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Maulid Nabi Muhammad SAW (12 Rabiul Awal 1448 H)',
    startDate: '2026-08-25',
    endDate: '2026-08-25',
    category: 'HOLIDAY_NATIONAL',
    color: '#ef4444',
    description: 'Libur Nasional Peringatan Maulid Nabi.',
    isNationalHoliday: true
  },
  {
    id: 'kaldik-05',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Penilaian Tengah Semester (PTS / STS Ganjil)',
    startDate: '2026-09-21',
    endDate: '2026-09-26',
    category: 'ASSESSMENT',
    color: '#8b5cf6',
    description: 'Evaluasi formatif tengah semester untuk mengukur capaian kompetensi siswa.'
  },
  {
    id: 'kaldik-06',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Pekan Gelar Karya P5 & Proyek Penguatan Karakter',
    startDate: '2026-09-28',
    endDate: '2026-10-02',
    category: 'SCHOOL_EVENT',
    color: '#f59e0b',
    description: 'Pameran hasil karya P5 peserta didik dan bazar kewirausahaan.'
  },
  {
    id: 'kaldik-07',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Sumatif Akhir Semester (SAS / PAS Ganjil CBT)',
    startDate: '2026-11-30',
    endDate: '2026-12-11',
    category: 'ASSESSMENT',
    color: '#8b5cf6',
    description: 'Asesmen sumatif akhir semester berbasis komputer dan evaluasi menyeluruh.'
  },
  {
    id: 'kaldik-08',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Pengolahan Nilai & Rapat Pleno Dewan Guru',
    startDate: '2026-12-14',
    endDate: '2026-12-18',
    category: 'SCHOOL_EVENT',
    color: '#0284c7',
    description: 'Finalisasi nilai e-Rapor dan persiapan penyerahan hasil belajar.'
  },
  {
    id: 'kaldik-09',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Pembagian Buku Rapor Semester Ganjil',
    startDate: '2026-12-19',
    endDate: '2026-12-19',
    category: 'REPORT_CARD',
    color: '#059669',
    description: 'Penyerahan laporan capaian hasil belajar peserta didik kepada orang tua/wali.'
  },
  {
    id: 'kaldik-10',
    academicYear: '2026/2027',
    semester: 'ODD',
    title: 'Libur Akhir Semester Ganjil & Libur Hari Raya Natal',
    startDate: '2026-12-21',
    endDate: '2027-01-02',
    category: 'HOLIDAY_SEMESTER',
    color: '#dc2626',
    description: 'Libur jeda semester 1 dan perayaan tahun baru 2027.'
  },

  // ── SEMESTER GENAP 2026/2027 ──
  {
    id: 'kaldik-11',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Hari Pertama Masuk Sekolah Semester Genap',
    startDate: '2027-01-04',
    endDate: '2027-01-04',
    category: 'EFFECTIVE_LEARNING',
    color: '#10b981',
    description: 'Awal proses pembelajaran efektif semester 2.'
  },
  {
    id: 'kaldik-12',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Peringatan Isra Mi\'raj Nabi Muhammad SAW',
    startDate: '2027-02-05',
    endDate: '2027-02-05',
    category: 'HOLIDAY_NATIONAL',
    color: '#ef4444',
    description: 'Libur Nasional Keagamaan.',
    isNationalHoliday: true
  },
  {
    id: 'kaldik-13',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Tahun Baru Imlek 2578 Kongzili',
    startDate: '2027-02-17',
    endDate: '2027-02-17',
    category: 'HOLIDAY_NATIONAL',
    color: '#ef4444',
    description: 'Libur Nasional Tahun Baru Imlek.',
    isNationalHoliday: true
  },
  {
    id: 'kaldik-14',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Penilaian Tengah Semester (PTS / STS Genap)',
    startDate: '2027-03-08',
    endDate: '2027-03-13',
    category: 'ASSESSMENT',
    color: '#8b5cf6',
    description: 'Ujian formatif tengah semester genap.'
  },
  {
    id: 'kaldik-15',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Libur Awal Ramadhan 1448 H & Pesantren Kilat',
    startDate: '2027-03-22',
    endDate: '2027-03-27',
    category: 'SCHOOL_EVENT',
    color: '#f59e0b',
    description: 'Penguatan karakter spiritual G7KAIH dan pembelajaran mandiri.'
  },
  {
    id: 'kaldik-16',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Hari Raya Idul Fitri 1448 H & Cuti Bersama Lebaran',
    startDate: '2027-04-05',
    endDate: '2027-04-10',
    category: 'HOLIDAY_NATIONAL',
    color: '#ef4444',
    description: 'Libur Hari Raya Idul Fitri dan cuti bersama pemerintah.',
    isNationalHoliday: true
  },
  {
    id: 'kaldik-17',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Sumatif Akhir Jenjang & Penilaian Akhir Tahun (SAT / SAS Genap)',
    startDate: '2027-05-17',
    endDate: '2027-05-28',
    category: 'ASSESSMENT',
    color: '#8b5cf6',
    description: 'Ujian penentuan kelulusan dan kenaikan kelas bagi seluruh jenjang.'
  },
  {
    id: 'kaldik-18',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Hari Lahir Pancasila',
    startDate: '2027-06-01',
    endDate: '2027-06-01',
    category: 'HOLIDAY_NATIONAL',
    color: '#ef4444',
    description: 'Libur Nasional Hari Lahir Pancasila.',
    isNationalHoliday: true
  },
  {
    id: 'kaldik-19',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Pembagian Buku Rapor Semester Genap & Kelulusan',
    startDate: '2027-06-19',
    endDate: '2027-06-19',
    category: 'REPORT_CARD',
    color: '#059669',
    description: 'Penyerahan e-Rapor kenaikan kelas dan ijazah/SKL kelulusan.'
  },
  {
    id: 'kaldik-20',
    academicYear: '2026/2027',
    semester: 'EVEN',
    title: 'Libur Akhir Tahun Ajaran 2026/2027',
    startDate: '2027-06-21',
    endDate: '2027-07-10',
    category: 'HOLIDAY_SEMESTER',
    color: '#dc2626',
    description: 'Libur panjang akhir tahun ajaran menuju tahun ajaran berikutnya.'
  }
];

// Persistent runtime cache
let memoryEvents: CalendarEvent[] = [...OFFICIAL_PRESET_EVENTS];

/**
 * Calculates academic calendar metrics:
 * - Effective Learning Days (HEB)
 * - Effective Learning Weeks (MEB)
 * - Total Holidays
 * - Total Assessment Days
 */
function calculateCalendarMetrics(events: CalendarEvent[], targetSemester: 'ODD' | 'EVEN' | 'ALL') {
  // Definition of dates range for semester in 2026/2027
  // Semester 1: 2026-07-01 to 2026-12-31
  // Semester 2: 2027-01-01 to 2027-06-30
  let startDate = new Date('2026-07-01');
  let endDate = new Date('2027-06-30');

  if (targetSemester === 'ODD') {
    startDate = new Date('2026-07-01');
    endDate = new Date('2026-12-31');
  } else if (targetSemester === 'EVEN') {
    startDate = new Date('2027-01-01');
    endDate = new Date('2027-06-30');
  }

  // Pre-filter events relevant to the semester
  const relevantEvents = events.filter(e => {
    if (targetSemester === 'ALL') return true;
    return e.semester === targetSemester || e.semester === 'ALL';
  });

  // Calculate day-by-day mapping
  let totalWorkDays = 0; // Mon - Fri or Mon - Sat
  let totalHolidays = 0;
  let totalAssessmentDays = 0;
  let totalEffectiveDays = 0;

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
    const dateStr = current.toISOString().slice(0, 10);

    // Standard school operates Mon - Fri or Sat (excluding Sunday)
    const isWeekend = dayOfWeek === 0;

    if (!isWeekend) {
      totalWorkDays++;

      // Check if this date falls into a holiday event
      const holidayEvent = relevantEvents.find(
        e => (e.category === 'HOLIDAY_NATIONAL' || e.category === 'HOLIDAY_SEMESTER') &&
             dateStr >= e.startDate && dateStr <= e.endDate
      );

      // Check if this date falls into assessment event
      const assessmentEvent = relevantEvents.find(
        e => e.category === 'ASSESSMENT' && dateStr >= e.startDate && dateStr <= e.endDate
      );

      if (holidayEvent) {
        totalHolidays++;
      } else if (assessmentEvent) {
        totalAssessmentDays++;
        totalEffectiveDays++; // Assessment counts as effective day
      } else {
        totalEffectiveDays++;
      }
    } else {
      totalHolidays++;
    }

    current.setDate(current.getDate() + 1);
  }

  // Standard MEB calculation (Effective days / 5 or ~18-19 weeks per semester)
  const effectiveWeeks = Math.max(1, Math.round(totalEffectiveDays / 5.5));

  return {
    effectiveDays: totalEffectiveDays,
    effectiveWeeks,
    holidayDays: totalHolidays,
    assessmentDays: totalAssessmentDays,
    totalEvents: relevantEvents.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear') || '2026/2027';
    const semester = (searchParams.get('semester')?.toUpperCase() || 'ALL') as 'ODD' | 'EVEN' | 'ALL';

    const filtered = memoryEvents.filter(ev => {
      if (academicYear && ev.academicYear !== academicYear) return false;
      if (semester !== 'ALL' && ev.semester !== semester && ev.semester !== 'ALL') return false;
      return true;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));

    const metrics = calculateCalendarMetrics(memoryEvents, semester);

    return NextResponse.json({
      success: true,
      academicYear,
      semester,
      metrics,
      data: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat Kalender Pendidikan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if reset/preset request
    if (body.action === 'RESET_PRESET') {
      memoryEvents = [...OFFICIAL_PRESET_EVENTS];
      return NextResponse.json({
        success: true,
        message: 'Kalender Pendidikan berhasil di-reset ke template resmi Kemendikbud & Dinas Pendidikan 2026/2027',
        data: memoryEvents,
      });
    }

    const {
      title,
      startDate,
      endDate = startDate,
      academicYear = '2026/2027',
      semester = 'ODD',
      category = 'SCHOOL_EVENT',
      color = '#0284c7',
      description = ''
    } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Judul agenda dan tanggal mulai wajib diisi' },
        { status: 400 }
      );
    }

    const newEvent: CalendarEvent = {
      id: `kaldik-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      academicYear,
      semester,
      title: title.trim(),
      startDate,
      endDate: endDate || startDate,
      category,
      color,
      description: description?.trim() || ''
    };

    memoryEvents.push(newEvent);

    return NextResponse.json({
      success: true,
      message: 'Agenda Kalender Pendidikan berhasil ditambahkan',
      data: newEvent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyimpan agenda Kalender Pendidikan' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID agenda wajib diberikan' },
        { status: 400 }
      );
    }

    const initialLen = memoryEvents.length;
    memoryEvents = memoryEvents.filter(ev => ev.id !== id);

    if (memoryEvents.length === initialLen) {
      return NextResponse.json(
        { success: false, error: 'Agenda tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agenda Kalender Pendidikan berhasil dihapus',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus agenda' },
      { status: 500 }
    );
  }
}
