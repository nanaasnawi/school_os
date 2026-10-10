'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Plus,
  Printer,
  Download,
  RotateCcw,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  List,
  Grid,
  Table as TableIcon,
  Trash2,
  Flag,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './calendar.module.css';

interface CalendarEvent {
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

interface CalendarMetrics {
  effectiveDays: number;
  effectiveWeeks: number;
  holidayDays: number;
  assessmentDays: number;
  totalEvents: number;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const CATEGORY_LABELS: Record<string, { label: string; color: string; border: string }> = {
  EFFECTIVE_LEARNING: { label: 'Hari Efektif Belajar (HEB)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  HOLIDAY_NATIONAL: { label: 'Libur Nasional & Cuti', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  HOLIDAY_SEMESTER: { label: 'Libur Akhir Semester', color: '#dc2626', border: 'rgba(220, 38, 38, 0.3)' },
  ASSESSMENT: { label: 'Asesmen (PTS/PAS/SAT)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  REPORT_CARD: { label: 'Pembagian Buku Rapor', color: '#059669', border: 'rgba(5, 150, 105, 0.3)' },
  SCHOOL_EVENT: { label: 'Kegiatan Sekolah & P5', color: '#0284c7', border: 'rgba(2, 132, 199, 0.3)' },
};

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [metrics, setMetrics] = useState<CalendarMetrics>({
    effectiveDays: 215,
    effectiveWeeks: 38,
    holidayDays: 45,
    assessmentDays: 24,
    totalEvents: 20
  });
  const [loading, setLoading] = useState(true);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<'ALL' | 'ODD' | 'EVEN'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'MATRIX' | 'TIMELINE'>('GRID');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDateInfo, setActiveDateInfo] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formSemester, setFormSemester] = useState<'ODD' | 'EVEN'>('ODD');
  const [formCategory, setFormCategory] = useState<CalendarEvent['category']>('SCHOOL_EVENT');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/academic/calendar?academicYear=${selectedAcademicYear}&semester=${selectedSemester}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data || []);
        if (json.metrics) setMetrics(json.metrics);
      } else {
        showToast(json.error || 'Gagal memuat kalender pendidikan', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke server kalender', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [selectedAcademicYear, selectedSemester]);

  // Handle Preset Reset
  const handleResetPreset = async () => {
    if (!window.confirm('Reset kalender ke template resmi Disdik/Kemendikbud 2026/2027?')) return;
    try {
      const res = await fetch('/api/v1/academic/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_PRESET' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Kalender berhasil di-reset ke template resmi 2026/2027', 'success');
        fetchCalendarData();
      }
    } catch {
      showToast('Gagal memuat template resmi', 'error');
    }
  };

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStartDate) {
      showToast('Judul dan tanggal mulai wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryColor = CATEGORY_LABELS[formCategory]?.color || '#0284c7';
      const res = await fetch('/api/v1/academic/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          startDate: formStartDate,
          endDate: formEndDate || formStartDate,
          academicYear: selectedAcademicYear,
          semester: formSemester,
          category: formCategory,
          color: categoryColor,
          description: formDescription,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Agenda berhasil ditambahkan', 'success');
        setIsModalOpen(false);
        setFormTitle('');
        setFormStartDate('');
        setFormEndDate('');
        setFormDescription('');
        fetchCalendarData();
      } else {
        showToast(json.error || 'Gagal menambahkan agenda', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan agenda', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Hapus agenda "${title}" dari kalender?`)) return;
    try {
      const res = await fetch(`/api/v1/academic/calendar?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Agenda berhasil dihapus', 'success');
        fetchCalendarData();
      }
    } catch {
      showToast('Gagal menghapus agenda', 'error');
    }
  };

  // Helper to get events occurring on a specific date string (YYYY-MM-DD)
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => dateStr >= e.startDate && dateStr <= e.endDate);
  };

  // Month configurations for Academic Year 2026/2027
  // Semester Ganjil: Jul 2026 - Dec 2026
  // Semester Genap: Jan 2027 - Jun 2027
  const monthsToRender = React.useMemo(() => {
    const list: Array<{ year: number; monthIndex: number; semester: 'ODD' | 'EVEN' }> = [];
    if (selectedSemester === 'ALL' || selectedSemester === 'ODD') {
      for (let m = 6; m <= 11; m++) {
        list.push({ year: 2026, monthIndex: m, semester: 'ODD' });
      }
    }
    if (selectedSemester === 'ALL' || selectedSemester === 'EVEN') {
      for (let m = 0; m <= 5; m++) {
        list.push({ year: 2027, monthIndex: m, semester: 'EVEN' });
      }
    }
    return list;
  }, [selectedSemester]);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 99999,
          background: toastMessage.type === 'error' ? '#ef4444' : '#059669',
          color: '#ffffff',
          padding: '0.65rem 1.15rem',
          borderRadius: '9px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          fontWeight: 700,
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/academic-years">Tahun Ajaran</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Kalender Pendidikan</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.mainTitle}>
            <CalendarIcon size={24} color="#0284c7" />
            <span>Kalender Pendidikan (Kaldik) {selectedAcademicYear}</span>
            <span className={styles.standardBadge}>Standar Disdik &amp; Kemendikdasmen</span>
          </h1>
          <p className={styles.subtitle}>
            Matriks alokasi Minggu Efektif Belajar (MEB), Hari Efektif Belajar (HEB), jadwal asesmen formatif &amp; sumatif, serta hari libur sekolah.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleResetPreset}
            className={styles.btnSecondary}
            title="Muat ulang template resmi kalender pendidikan Disdik"
          >
            <RotateCcw size={13} />
            <span>Template Resmi</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className={styles.btnSecondary}
            title="Cetak lembar resmi Kalender Pendidikan"
          >
            <Printer size={13} />
            <span>Cetak Kaldik</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={styles.btnPrimary}
          >
            <Plus size={14} />
            <span>Tambah Agenda</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Metrics Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <BookOpen size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{metrics.effectiveDays} Hari</span>
            <span className={styles.kpiLabel}>Hari Efektif Belajar (HEB)</span>
            <span className={styles.kpiSub}>Aktif Kegiatan Belajar Mengajar</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
            <Clock size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{metrics.effectiveWeeks} Minggu</span>
            <span className={styles.kpiLabel}>Minggu Efektif Belajar (MEB)</span>
            <span className={styles.kpiSub}>Dasar Alokasi RPP &amp; Promes</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Award size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{metrics.assessmentDays} Hari</span>
            <span className={styles.kpiLabel}>Pekan Asesmen &amp; Ujian</span>
            <span className={styles.kpiSub}>PTS, SAS, SAT &amp; Ujian Sekolah</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Flag size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{metrics.holidayDays} Hari</span>
            <span className={styles.kpiLabel}>Hari Libur &amp; Jeda Semester</span>
            <span className={styles.kpiSub}>Nasional, Cuti, &amp; Libur Semester</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Semester Tabs */}
          <div className={styles.tabPills}>
            <button
              type="button"
              onClick={() => setSelectedSemester('ALL')}
              className={`${styles.tabPill} ${selectedSemester === 'ALL' ? styles.tabPillActive : ''}`}
            >
              Semua Semester (1 Tahun)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('ODD')}
              className={`${styles.tabPill} ${selectedSemester === 'ODD' ? styles.tabPillActive : ''}`}
            >
              Semester Ganjil (Jul - Des)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('EVEN')}
              className={`${styles.tabPill} ${selectedSemester === 'EVEN' ? styles.tabPillActive : ''}`}
            >
              Semester Genap (Jan - Jun)
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className={styles.viewModePills}>
          <button
            type="button"
            onClick={() => setViewMode('GRID')}
            className={`${styles.viewBtn} ${viewMode === 'GRID' ? styles.viewBtnActive : ''}`}
          >
            <Grid size={13} />
            <span>Kalender Bulanan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('MATRIX')}
            className={`${styles.viewBtn} ${viewMode === 'MATRIX' ? styles.viewBtnActive : ''}`}
          >
            <TableIcon size={13} />
            <span>Analisis MEB</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('TIMELINE')}
            className={`${styles.viewBtn} ${viewMode === 'TIMELINE' ? styles.viewBtnActive : ''}`}
          >
            <List size={13} />
            <span>Daftar Agenda ({events.length})</span>
          </button>
        </div>
      </div>

      {/* Legend Categories */}
      <div className={styles.legendRow}>
        <span style={{ fontWeight: 800, color: 'var(--text-primary)', marginRight: '0.25rem' }}>Keterangan Warna:</span>
        {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* VIEW 1: GRID KALENDER BULANAN */}
      {viewMode === 'GRID' && (
        <div className={styles.monthsGrid}>
          {monthsToRender.map(({ year, monthIndex, semester }) => {
            const monthName = MONTH_NAMES[monthIndex];
            const firstDayOfMonth = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

            // Calculate effective days in this month
            let effectiveInMonth = 0;
            for (let d = 1; d <= daysInMonth; d++) {
              const dtStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayW = new Date(year, monthIndex, d).getDay();
              const isSun = dayW === 0;
              const evs = getEventsForDate(dtStr);
              const isHol = evs.some(e => e.category === 'HOLIDAY_NATIONAL' || e.category === 'HOLIDAY_SEMESTER');
              if (!isSun && !isHol) effectiveInMonth++;
            }

            return (
              <div key={`${year}-${monthIndex}`} className={styles.monthCard}>
                <div className={styles.monthHeader}>
                  <div className={styles.monthTitle}>
                    {monthName} {year}
                  </div>
                  <span className={styles.monthStats}>
                    {effectiveInMonth} Hari Efektif
                  </span>
                </div>

                <div className={styles.weekDaysRow}>
                  <span style={{ color: '#ef4444' }}>Min</span>
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span>Sab</span>
                </div>

                <div className={styles.daysGrid}>
                  {/* Empty placeholders before 1st day */}
                  {[...Array(firstDayOfMonth)].map((_, i) => (
                    <div key={`empty-${i}`} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />
                  ))}

                  {/* Day Cells */}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayOfWeek = new Date(year, monthIndex, dayNum).getDay();
                    const isSunday = dayOfWeek === 0;

                    const dayEvents = getEventsForDate(dateStr);
                    const holidayEvent = dayEvents.find(e => e.category === 'HOLIDAY_NATIONAL' || e.category === 'HOLIDAY_SEMESTER');
                    const assessmentEvent = dayEvents.find(e => e.category === 'ASSESSMENT');
                    const schoolEvent = dayEvents.find(e => e.category === 'SCHOOL_EVENT');
                    const reportEvent = dayEvents.find(e => e.category === 'REPORT_CARD');

                    let cellClass = styles.dayCell;
                    if (isSunday) cellClass += ` ${styles.dayCellSunday}`;
                    if (holidayEvent) cellClass += ` ${styles.dayCellHoliday}`;
                    else if (assessmentEvent) cellClass += ` ${styles.dayCellAssessment}`;
                    else if (schoolEvent) cellClass += ` ${styles.dayCellSchoolEvent}`;
                    else if (reportEvent) cellClass += ` ${styles.dayCellReportCard}`;

                    const primaryEvent = dayEvents[0];

                    return (
                      <div
                        key={dateStr}
                        className={cellClass}
                        onClick={() => {
                          if (dayEvents.length > 0) {
                            setActiveDateInfo({ date: dateStr, events: dayEvents });
                          }
                        }}
                        title={dayEvents.length > 0 ? dayEvents.map(e => e.title).join('\n') : undefined}
                      >
                        <span>{dayNum}</span>
                        {primaryEvent && (
                          <span
                            className={styles.dayEventDot}
                            style={{ background: primaryEvent.color || '#0284c7' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: MATRIKS MINGGU EFEKTIF BELAJAR (MEB) */}
      {viewMode === 'MATRIX' && (
        <div className={styles.tableCard}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Tabel Analisis Alokasi Waktu &amp; Minggu Efektif (MEB)</h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Panduan resmi penyusunan Program Tahunan (Prota) dan Program Semester (Promes) Guru.</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className={styles.btnSecondary}
              style={{ fontSize: '0.74rem' }}
            >
              <Printer size={13} />
              <span>Cetak Tabel</span>
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                <th>Bulan &amp; Tahun</th>
                <th style={{ textAlign: 'center' }}>Jumlah Minggu</th>
                <th style={{ textAlign: 'center' }}>Minggu Efektif (MEB)</th>
                <th style={{ textAlign: 'center' }}>Minggu Non-Efektif</th>
                <th style={{ textAlign: 'center' }}>Hari Efektif (HEB)</th>
                <th>Keterangan Agenda Utama</th>
              </tr>
            </thead>
            <tbody>
              {monthsToRender.map(({ year, monthIndex }, idx) => {
                const monthName = MONTH_NAMES[monthIndex];
                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

                // Approximate week calculation
                const totalWeeks = Math.ceil(daysInMonth / 7);

                // Count effective days
                let effectiveDaysCount = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                  const dtStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayW = new Date(year, monthIndex, d).getDay();
                  const isSun = dayW === 0;
                  const evs = getEventsForDate(dtStr);
                  const isHol = evs.some(e => e.category === 'HOLIDAY_NATIONAL' || e.category === 'HOLIDAY_SEMESTER');
                  if (!isSun && !isHol) effectiveDaysCount++;
                }

                const effectiveWeeksCount = Math.max(0, Math.round(effectiveDaysCount / 5.5));
                const nonEffectiveWeeksCount = Math.max(0, totalWeeks - effectiveWeeksCount);

                // Events in this month
                const startMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
                const endMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${daysInMonth}`;
                const monthEvents = events.filter(e => !(e.endDate < startMonth || e.startDate > endMonth));

                return (
                  <tr key={`${year}-${monthIndex}`}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{monthName} {year}</td>
                    <td style={{ textAlign: 'center' }}>{totalWeeks}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#10b981' }}>{effectiveWeeksCount}</td>
                    <td style={{ textAlign: 'center', color: '#ef4444' }}>{nonEffectiveWeeksCount}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{effectiveDaysCount} Hari</td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {monthEvents.length > 0 ? (
                        monthEvents.map(e => e.title).join(' • ')
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>KBM Efektif Reguler</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className={styles.tableFooterRow}>
                <td colSpan={2} style={{ textAlign: 'right', paddingRight: '1rem' }}>TOTAL KESELURUHAN:</td>
                <td style={{ textAlign: 'center' }}>{monthsToRender.length * 4}</td>
                <td style={{ textAlign: 'center', color: '#10b981' }}>{metrics.effectiveWeeks} Minggu</td>
                <td style={{ textAlign: 'center', color: '#ef4444' }}>{Math.max(0, (monthsToRender.length * 4) - metrics.effectiveWeeks)} Minggu</td>
                <td style={{ textAlign: 'center' }}>{metrics.effectiveDays} Hari</td>
                <td>Dasar penetapan jam tatap muka dan silabus modul Kurikulum Merdeka</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: TIMELINE AGENDA LIST */}
      {viewMode === 'TIMELINE' && (
        <div className={styles.timelineGrid}>
          {events.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada agenda pada tahun ajaran ini. Klik tombol <strong>Template Resmi</strong> untuk memuat agenda Disdik.
            </div>
          ) : (
            events.map(ev => {
              const catInfo = CATEGORY_LABELS[ev.category] || { label: ev.category, color: '#0284c7' };
              const isMultiDay = ev.startDate !== ev.endDate;

              return (
                <div key={ev.id} className={styles.timelineItem}>
                  <div className={styles.timelineDateBox} style={{ borderColor: catInfo.color }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{ev.semester === 'ODD' ? 'Ganjil' : 'Genap'}</span>
                    <span>{ev.startDate.slice(5)}</span>
                    {isMultiDay && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>s/d {ev.endDate.slice(5)}</span>}
                  </div>

                  <div className={styles.timelineContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: `${catInfo.color}15`,
                          color: catInfo.color,
                          border: `1px solid ${catInfo.color}35`
                        }}
                      >
                        {catInfo.label}
                      </span>
                      <span className={styles.timelineTitle}>{ev.title}</span>
                    </div>
                    {ev.description && (
                      <p className={styles.timelineDesc}>{ev.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.id, ev.title)}
                    className={styles.btnSecondary}
                    style={{ padding: '0.4rem 0.6rem', color: '#ef4444' }}
                    title="Hapus agenda ini"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: DETAIL EVENT DI TANGGAL TERTENTU */}
      {activeDateInfo && (
        <div className={styles.modalOverlay} onClick={() => setActiveDateInfo(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <CalendarIcon size={16} color="#0284c7" />
                <span>Agenda Tanggal {activeDateInfo.date}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveDateInfo(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeDateInfo.events.map(ev => {
                const catInfo = CATEGORY_LABELS[ev.category] || { label: ev.category, color: '#0284c7' };
                return (
                  <div key={ev.id} style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: `1px solid ${catInfo.color}35`,
                    background: `${catInfo.color}08`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: catInfo.color }}>
                      {catInfo.label}
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {ev.title}
                    </strong>
                    {ev.description && (
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {ev.description}
                      </p>
                    )}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Periode: {ev.startDate} s/d {ev.endDate} ({ev.semester === 'ODD' ? 'Semester Ganjil' : 'Semester Genap'})
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setActiveDateInfo(null)}
                className={styles.btnSecondary}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AGENDA KALDIK */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateEvent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <Plus size={16} color="#0284c7" />
                  <span>Tambah Agenda Kalender Pendidikan</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nama Agenda / Kegiatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Asesmen Bakat Minat / Ujian Sekolah"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Tanggal Mulai *</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={e => {
                        setFormStartDate(e.target.value);
                        if (!formEndDate) setFormEndDate(e.target.value);
                      }}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Tanggal Selesai</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={e => setFormEndDate(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Semester</label>
                    <select
                      value={formSemester}
                      onChange={e => setFormSemester(e.target.value as 'ODD' | 'EVEN')}
                      className={styles.input}
                    >
                      <option value="ODD">Semester 1 (Ganjil)</option>
                      <option value="EVEN">Semester 2 (Genap)</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Kategori Kegiatan</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as CalendarEvent['category'])}
                      className={styles.input}
                    >
                      <option value="EFFECTIVE_LEARNING">Hari Efektif Belajar (HEB)</option>
                      <option value="ASSESSMENT">Asesmen / Ujian (PTS/PAS/SAT)</option>
                      <option value="SCHOOL_EVENT">Kegiatan Sekolah / P5 / IHT</option>
                      <option value="REPORT_CARD">Pembagian Buku Rapor</option>
                      <option value="HOLIDAY_NATIONAL">Libur Nasional &amp; Cuti</option>
                      <option value="HOLIDAY_SEMESTER">Libur Akhir Semester</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Keterangan / Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Seluruh siswa hadir berpakaian batik, persiapan berkas rapor..."
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className={styles.input}
                    style={{ height: 'auto', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.btnSecondary}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.btnPrimary}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
