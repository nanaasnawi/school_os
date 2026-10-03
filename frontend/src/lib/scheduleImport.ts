import * as XLSX from 'xlsx';

export interface ParsedScheduleRow {
  rawId: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  timeStart: string;
  timeEnd: string;
  subjectInput: string;
  teacherInput: string;
  rombelInput: string;
  roomInput: string;
  // Matched entities
  matchedSubjectId?: string;
  matchedSubjectName?: string;
  matchedTeacherId?: string;
  matchedTeacherName?: string;
  matchedClassIds: string[];
  matchedClassNames: string[];
  // Status
  isValid: boolean;
  errors: string[];
}

const VALID_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

function normalizeDay(input: any): 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' {
  if (!input) return 'Senin';
  const str = String(input).trim().toLowerCase();
  if (str.includes('sen') || str.includes('mon')) return 'Senin';
  if (str.includes('sel') || str.includes('tue')) return 'Selasa';
  if (str.includes('rab') || str.includes('wed')) return 'Rabu';
  if (str.includes('kam') || str.includes('thu')) return 'Kamis';
  if (str.includes('jum') || str.includes('fri')) return 'Jumat';
  if (str.includes('sab') || str.includes('sat')) return 'Sabtu';
  return 'Senin';
}

function normalizeTime(input: any, defaultTime: string): string {
  if (!input) return defaultTime;
  if (typeof input === 'number') {
    // Excel decimal time (e.g., 0.333333 for 08:00)
    const totalMinutes = Math.round(input * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  const str = String(input).trim().replace('.', ':');
  // Check format like 8:00 or 08:00
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = String(parseInt(match[1], 10)).padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return defaultTime;
}

export function matchScheduleRow(
  raw: {
    day: any;
    timeStart: any;
    timeEnd: any;
    subject: any;
    teacher: any;
    rombel: any;
    room?: any;
  },
  index: number,
  allTeachers: any[],
  allSubjects: any[],
  allClasses: any[]
): ParsedScheduleRow {
  const errors: string[] = [];

  const day = normalizeDay(raw.day);
  let timeStart = normalizeTime(raw.timeStart, '08:00');
  let timeEnd = normalizeTime(raw.timeEnd, '09:30');

  // Handle case where timeStart contains "08:00 - 09:30"
  if (typeof raw.timeStart === 'string' && raw.timeStart.includes('-')) {
    const parts = raw.timeStart.split('-');
    timeStart = normalizeTime(parts[0], '08:00');
    timeEnd = normalizeTime(parts[1], '09:30');
  }

  const subjectInput = String(raw.subject || '').trim();
  const teacherInput = String(raw.teacher || '').trim();
  const rombelInput = String(raw.rombel || '').trim();
  const roomInput = String(raw.room || 'Ruang Kelas').trim();

  // Match Subject
  let matchedSubject: any = null;
  if (subjectInput) {
    const sLow = subjectInput.toLowerCase();
    matchedSubject = allSubjects.find(s => s.name?.toLowerCase() === sLow || s.code?.toLowerCase() === sLow);
    if (!matchedSubject) {
      // Substring match
      matchedSubject = allSubjects.find(s => 
        s.name?.toLowerCase().includes(sLow) || sLow.includes(s.name?.toLowerCase())
      );
    }
  }
  if (!matchedSubject) {
    errors.push(`Mata Pelajaran "${subjectInput}" tidak terdaftar di sistem`);
  }

  // Match Teacher
  let matchedTeacher: any = null;
  if (teacherInput) {
    const tLow = teacherInput.toLowerCase();
    matchedTeacher = allTeachers.find(t => t.full_name?.toLowerCase() === tLow);
    if (!matchedTeacher) {
      // Ignore titles like S.Pd, S.Si, etc.
      const cleanInput = tLow.replace(/,\s*[a-z.\s]+/gi, '').trim();
      matchedTeacher = allTeachers.find(t => {
        const cleanT = t.full_name?.toLowerCase().replace(/,\s*[a-z.\s]+/gi, '').trim();
        return cleanT === cleanInput || cleanT?.includes(cleanInput) || cleanInput.includes(cleanT);
      });
    }
  }
  if (!matchedTeacher) {
    errors.push(`Guru Pengampu "${teacherInput}" tidak ditemukan di master guru`);
  }

  // Match Rombels (Classes)
  const matchedClassIds: string[] = [];
  const matchedClassNames: string[] = [];

  if (rombelInput) {
    const rLow = rombelInput.toLowerCase();
    // Check bulk keywords like "semua paket a", "semua", "paket a"
    if (rLow.includes('semua paket a') || rLow === 'paket a') {
      allClasses.filter(c => c.name?.toUpperCase().includes('PAKET A')).forEach(c => {
        matchedClassIds.push(c.id);
        matchedClassNames.push(c.name);
      });
    } else if (rLow.includes('semua paket b') || rLow === 'paket b') {
      allClasses.filter(c => c.name?.toUpperCase().includes('PAKET B')).forEach(c => {
        matchedClassIds.push(c.id);
        matchedClassNames.push(c.name);
      });
    } else if (rLow.includes('semua paket c') || rLow === 'paket c') {
      allClasses.filter(c => c.name?.toUpperCase().includes('PAKET C')).forEach(c => {
        matchedClassIds.push(c.id);
        matchedClassNames.push(c.name);
      });
    } else if (rLow.includes('semua') || rLow.includes('seluruh')) {
      allClasses.forEach(c => {
        matchedClassIds.push(c.id);
        matchedClassNames.push(c.name);
      });
    } else {
      // Split by comma, semicolon, or slash
      const tokens = rombelInput.split(/[,;/+]+/).map(t => t.trim()).filter(Boolean);
      for (const token of tokens) {
        const tUp = token.toUpperCase();
        const found = allClasses.find(c => c.name?.toUpperCase() === tUp || c.name?.toUpperCase().replace(/\s+/g, '') === tUp.replace(/\s+/g, ''));
        if (found) {
          if (!matchedClassIds.includes(found.id)) {
            matchedClassIds.push(found.id);
            matchedClassNames.push(found.name);
          }
        } else {
          // Partial match
          const partial = allClasses.find(c => c.name?.toUpperCase().includes(tUp));
          if (partial && !matchedClassIds.includes(partial.id)) {
            matchedClassIds.push(partial.id);
            matchedClassNames.push(partial.name);
          }
        }
      }
    }
  }

  if (matchedClassIds.length === 0) {
    errors.push(`Rombel "${rombelInput}" tidak ada yang cocok dengan kelas aktif`);
  }

  return {
    rawId: `row-${index + 1}`,
    day,
    timeStart,
    timeEnd,
    subjectInput,
    teacherInput,
    rombelInput,
    roomInput,
    matchedSubjectId: matchedSubject?.id,
    matchedSubjectName: matchedSubject?.name,
    matchedTeacherId: matchedTeacher?.id,
    matchedTeacherName: matchedTeacher?.full_name,
    matchedClassIds,
    matchedClassNames,
    isValid: errors.length === 0,
    errors,
  };
}

export function parseExcelSchedule(
  buffer: ArrayBuffer,
  allTeachers: any[],
  allSubjects: any[],
  allClasses: any[]
): ParsedScheduleRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawJson.length === 0) return [];

  return rawJson.map((row, index) => {
    // Look up fields by fuzzy header keys
    const keys = Object.keys(row);
    const getVal = (candidates: string[]) => {
      for (const k of keys) {
        const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const c of candidates) {
          if (clean.includes(c)) return row[k];
        }
      }
      return '';
    };

    const day = getVal(['hari', 'day']);
    const timeStart = getVal(['mulai', 'start', 'waktumulai', 'jam']);
    const timeEnd = getVal(['selesai', 'end', 'waktuselesai']);
    const subject = getVal(['matapelajaran', 'mapel', 'subject', 'pelajaran']);
    const teacher = getVal(['guru', 'gurupengampu', 'teacher', 'namaguru', 'pengampu']);
    const rombel = getVal(['rombel', 'kelas', 'class', 'daftarkelas']);
    const room = getVal(['ruang', 'ruangan', 'room', 'tempat']) || 'Ruang Kelas';

    return matchScheduleRow(
      { day, timeStart, timeEnd, subject, teacher, rombel, room },
      index,
      allTeachers,
      allSubjects,
      allClasses
    );
  });
}

async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Pembacaan berkas PDF hanya dapat dilakukan di browser.');
  }

  const win = window as any;
  if (win.pdfjsLib) {
    return win.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('pdfjs-cdn-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (win.pdfjsLib) resolve(win.pdfjsLib);
        else reject(new Error('Gagal memuat PDF reader'));
      });
      existingScript.addEventListener('error', () => reject(new Error('Gagal mengunduh script PDF dari CDN')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (win.pdfjsLib) {
        win.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(win.pdfjsLib);
      } else {
        reject(new Error('Pustaka PDF tidak berhasil diinisialisasi'));
      }
    };
    script.onerror = () => reject(new Error('Koneksi ke CDN PDF reader gagal'));
    document.head.appendChild(script);
  });
}

export async function parsePdfSchedule(
  file: File,
  allTeachers: any[],
  allSubjects: any[],
  allClasses: any[]
): Promise<ParsedScheduleRow[]> {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const lines: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      let lastY: number | null = null;
      let currentLine = '';
      for (const item of textContent.items as any[]) {
        if (lastY === null || Math.abs(item.transform[5] - lastY) < 5) {
          currentLine += ' ' + item.str;
        } else {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = item.str;
        }
        lastY = item.transform[5];
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
    }

    return parseLinesToSchedule(lines, allTeachers, allSubjects, allClasses);
  } catch (err: any) {
    console.error('Failed to parse PDF with pdfjs:', err);
    throw new Error(err?.message || 'Format PDF tidak terbaca atau terproteksi. Silakan gunakan format Excel (.xlsx) atau masukkan jadwal secara langsung.');
  }
}

export function parseLinesToSchedule(
  lines: string[],
  allTeachers: any[],
  allSubjects: any[],
  allClasses: any[]
): ParsedScheduleRow[] {
  const parsedRows: ParsedScheduleRow[] = [];
  let rowIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;

    // Detect if line contains day
    let detectedDay: any = null;
    for (const d of VALID_DAYS) {
      if (new RegExp(`\\b${d}\\b`, 'i').test(trimmed)) {
        detectedDay = d;
        break;
      }
    }
    if (!detectedDay) continue;

    // Detect times e.g. "08:00 - 09:30" or "08.00 - 09.30"
    const timeMatch = trimmed.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);
    const timeStart = timeMatch ? timeMatch[1] : '08:00';
    const timeEnd = timeMatch ? timeMatch[2] : '09:30';

    // Find teacher in line
    let matchedTeacherName = '';
    for (const t of allTeachers) {
      const cleanT = t.full_name?.toLowerCase().replace(/,\s*[a-z.\s]+/gi, '').trim();
      if (cleanT && cleanT.length > 3 && trimmed.toLowerCase().includes(cleanT)) {
        matchedTeacherName = t.full_name;
        break;
      }
    }

    // Find subject in line
    let matchedSubjectName = '';
    for (const s of allSubjects) {
      if (s.name && trimmed.toLowerCase().includes(s.name.toLowerCase())) {
        matchedSubjectName = s.name;
        break;
      }
    }

    // Find classes in line
    const matchedRombels: string[] = [];
    for (const c of allClasses) {
      if (c.name && trimmed.toUpperCase().includes(c.name.toUpperCase())) {
        matchedRombels.push(c.name);
      }
    }

    if (matchedTeacherName || matchedSubjectName || matchedRombels.length > 0) {
      parsedRows.push(
        matchScheduleRow(
          {
            day: detectedDay,
            timeStart,
            timeEnd,
            subject: matchedSubjectName || 'Mata Pelajaran',
            teacher: matchedTeacherName || 'Guru Pengampu',
            rombel: matchedRombels.join(', ') || 'Semua',
            room: 'Ruang Kelas',
          },
          rowIndex++,
          allTeachers,
          allSubjects,
          allClasses
        )
      );
    }
  }

  return parsedRows;
}

export function downloadScheduleExcelTemplate(
  teachers: any[],
  classes: any[],
  subjects: any[]
) {
  // Sheet 1: Template Input
  const sampleData = [
    {
      'Hari': 'Senin',
      'Jam Mulai': '08:00',
      'Jam Selesai': '09:30',
      'Mata Pelajaran': subjects[0]?.name || 'Matematika',
      'Guru Pengampu': teachers[0]?.full_name || 'Nama Guru',
      'Rombel': classes.slice(0, 2).map(c => c.name).join(', ') || 'PAKET A4, PAKET A5',
      'Ruang': 'Ruang Kelas'
    },
    {
      'Hari': 'Selasa',
      'Jam Mulai': '09:45',
      'Jam Selesai': '11:15',
      'Mata Pelajaran': subjects[1]?.name || 'Bahasa Indonesia',
      'Guru Pengampu': teachers[1]?.full_name || teachers[0]?.full_name || 'Nama Guru',
      'Rombel': 'Semua Paket B',
      'Ruang': 'Ruang Kelas'
    },
    {
      'Hari': 'Rabu',
      'Jam Mulai': '13:00',
      'Jam Selesai': '14:30',
      'Mata Pelajaran': subjects[2]?.name || 'Bahasa Inggris',
      'Guru Pengampu': teachers[2]?.full_name || teachers[0]?.full_name || 'Nama Guru',
      'Rombel': 'PAKET C10, PAKET C11',
      'Ruang': 'Lab Komputer'
    }
  ];

  const ws1 = XLSX.utils.json_to_sheet(sampleData);
  ws1['!cols'] = [
    { wch: 12 }, // Hari
    { wch: 14 }, // Jam Mulai
    { wch: 14 }, // Jam Selesai
    { wch: 30 }, // Mata Pelajaran
    { wch: 30 }, // Guru Pengampu
    { wch: 35 }, // Rombel
    { wch: 18 }  // Ruang
  ];

  // Sheet 2: Master Reference Data from DB
  const maxLen = Math.max(classes.length, teachers.length, subjects.length, 1);
  const refData = [];
  for (let i = 0; i < maxLen; i++) {
    refData.push({
      'Daftar Rombel / Kelas (DB)': classes[i]?.name || '',
      'Daftar Guru Pengampu (DB)': teachers[i]?.full_name || '',
      'Daftar Mata Pelajaran (DB)': subjects[i]?.name || ''
    });
  }

  const ws2 = XLSX.utils.json_to_sheet(refData);
  ws2['!cols'] = [
    { wch: 30 },
    { wch: 35 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Jadwal Pelajaran');
  XLSX.utils.book_append_sheet(wb, ws2, 'Referensi Data Sekolah');

  XLSX.writeFile(wb, 'Template_Pemetaan_Jadwal_Rombel_SchoolOS.xlsx');
}
