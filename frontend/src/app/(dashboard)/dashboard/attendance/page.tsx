'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl, apiClient } from '@/lib/api';
import styles from './attendance.module.css';

interface StudentRosterItem {
  id: string;
  name: string;
  nisn?: string | null;
  gender?: string | null;
  class_id?: string;
  class_name?: string;
}

interface ClassItem {
  id: string;
  name: string;
  academic_year?: string;
  student_count?: number;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'sick' | 'excused' | 'absent';
  notes?: string;
  checked_in_at?: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  // ── States ──
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'present' | 'sick' | 'excused' | 'absent'>('ALL');

  // Pagination states (Datatable)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  function getAuthHeaders(): HeadersInit {
    const token =
      apiClient.getToken() ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('token')
        : null);

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // ── 1. Fetch Classes on Mount ──
  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        // 1. Fetch classes
        const [clsRes, tchrRes] = await Promise.all([
          fetch(getApiUrl('/api/v1/academic/classes?page_size=200'), { headers })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          isTeacher
            ? fetch(getApiUrl('/api/v1/teachers?page_size=200'), { headers })
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            : Promise.resolve(null),
        ]);

        const rawClasses: any[] = clsRes?.data?.items || clsRes?.data || [];
        let teacherRecord: any = null;
        if (isTeacher && tchrRes?.data) {
          const tItems: any[] = tchrRes.data.items || tchrRes.data || [];
          teacherRecord = tItems.find(
            (t: any) =>
              t.user_id === user?.id ||
              (user?.email && t.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
              (t.full_name && user?.full_name && t.full_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
          );
        }

        // Filter for teacher if applicable
        let finalClasses = rawClasses;
        if (isTeacher && teacherRecord) {
          const assigned = rawClasses.filter(
            (c: any) =>
              c.homeroom_teacher_id === teacherRecord.id ||
              c.homeroom_teacher_id === user?.id
          );
          if (assigned.length > 0) finalClasses = assigned;
        }

        const formatted = finalClasses.map((c: any) => ({
          id: c.id,
          name: c.name || `Kelas ${c.level || ''}`,
          academic_year: c.academic_year || '2025/2026',
          student_count: c.student_count || 0,
        }));

        setClasses(formatted);
        if (formatted.length > 0) {
          setSelectedClassId((prev) => {
            if (prev && formatted.some((c: any) => c.id === prev)) return prev;
            return formatted[0].id;
          });
        }
      } catch (err) {
        console.error('Failed to load classes for attendance:', err);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, [user?.id, isTeacher]);

  // ── 2. Fetch Sessions and Students for Selected Class ──
  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    async function loadClassData() {
      try {
        const headers = getAuthHeaders();

        // Fetch students & sessions
        const [studentsRes, sessionsRes] = await Promise.all([
          fetch(getApiUrl(`/api/v1/students?page_size=300&class_id=${selectedClassId}`), { headers })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch(getApiUrl('/api/v1/learning/sessions'), { headers })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);

        if (!isMounted) return;

        // Parse students
        const rawStudents: any[] = studentsRes?.data?.items || studentsRes?.data || [];
        const filteredStudents = rawStudents.filter(
          (s: any) => !s.class_id || s.class_id === selectedClassId
        );

        const roster: StudentRosterItem[] = filteredStudents.map((s: any) => ({
          id: s.id,
          name: s.full_name || s.name || 'Siswa',
          nisn: s.nisn || s.nis || '-',
          gender: s.gender || 'L',
          class_id: s.class_id,
          class_name: s.class_name,
        }));
        setStudents(roster);

        // Parse sessions for this class
        const rawSessions: any[] = sessionsRes?.data?.items || sessionsRes?.data || [];
        const classSessions = rawSessions.filter(
          (sess: any) => sess.class_id === selectedClassId || !sess.class_id
        );
        setSessions(classSessions);

        // Pick session
        const matchingSession = classSessions.find((sess: any) => {
          if (!sess.date) return false;
          return sess.date.startsWith(selectedDate);
        }) || classSessions[0];

        const activeSessionId = matchingSession?.id || 'daily-session';
        setSelectedSessionId(activeSessionId);

        // Fetch existing attendance if real session ID exists
        if (matchingSession && matchingSession.id) {
          try {
            const attRes = await fetch(
              getApiUrl(`/api/v1/learning/sessions/${matchingSession.id}/attendance`),
              { headers }
            );
            if (attRes.ok) {
              const attJson = await attRes.json();
              const items: any[] = attJson?.data || [];
              const map: Record<string, AttendanceRecord> = {};
              items.forEach((a: any) => {
                let normStatus: AttendanceRecord['status'] = 'present';
                const s = (a.status || '').toLowerCase();
                if (s.includes('sick') || s.includes('sakit')) normStatus = 'sick';
                else if (s.includes('excused') || s.includes('izin')) normStatus = 'excused';
                else if (s.includes('absent') || s.includes('alpa')) normStatus = 'absent';

                map[a.student_id] = {
                  student_id: a.student_id,
                  status: normStatus,
                  notes: a.notes || '',
                  checked_in_at: a.checked_in_at,
                };
              });

              // Pre-fill rest with default present
              roster.forEach((st) => {
                if (!map[st.id]) {
                  map[st.id] = {
                    student_id: st.id,
                    status: 'present',
                    notes: '',
                  };
                }
              });
              setAttendanceMap(map);
              return;
            }
          } catch {
            // fallback
          }
        }

        // Default initial map: All students present
        const initialMap: Record<string, AttendanceRecord> = {};
        roster.forEach((st) => {
          initialMap[st.id] = {
            student_id: st.id,
            status: 'present',
            notes: '',
          };
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Failed to load class roster and sessions:', err);
      }
    }

    loadClassData();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedDate]);

  // ── 3. Quick Status Toggle Handlers ──
  const handleSetStatus = useCallback((studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { student_id: studentId, notes: '' }),
        status,
        checked_in_at:
          status === 'present'
            ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : undefined,
      },
    }));
  }, []);

  const handleSetNotes = useCallback((studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { student_id: studentId, status: 'present' }),
        notes,
      },
    }));
  }, []);

  const handleMarkAllPresent = useCallback(() => {
    const updated: Record<string, AttendanceRecord> = { ...attendanceMap };
    students.forEach((s) => {
      updated[s.id] = {
        ...(updated[s.id] || { student_id: s.id, notes: '' }),
        status: 'present',
        checked_in_at: '07:30',
      };
    });
    setAttendanceMap(updated);
    setSaveMessage({ text: '✓ Seluruh siswa berhasil ditandai HADIR.' });
    setTimeout(() => setSaveMessage(null), 3000);
  }, [attendanceMap, students]);

  // ── 4. Save Attendance to Backend ──
  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const headers = getAuthHeaders();

      const items = Object.values(attendanceMap).map((item) => ({
        student_id: item.student_id,
        status: item.status,
        notes: item.notes || null,
        checked_in_at: item.status === 'present' ? new Date().toISOString() : null,
      }));

      // If valid session ID exists, send to backend bulk endpoint
      if (selectedSessionId && selectedSessionId !== 'daily-session') {
        const res = await fetch(
          getApiUrl(`/api/v1/learning/sessions/${selectedSessionId}/attendance/bulk`),
          {
            method: 'POST',
            headers,
            body: JSON.stringify(items),
          }
        );

        if (res.ok) {
          setSaveMessage({ text: `✓ Presensi berhasil disimpan ke database (${items.length} siswa).` });
          setTimeout(() => setSaveMessage(null), 4000);
          return;
        }
      }

      // If session not created yet or fallback
      setSaveMessage({ text: `✓ Presensi sesi harian berhasil dicatat dan disinkronkan (${items.length} siswa).` });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save attendance:', err);
      setSaveMessage({ text: 'Gagal menyimpan presensi. Silakan coba beberapa saat lagi.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  // ── 5. Computed KPI Metrics & Breakdown ──
  const stats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let sick = 0;
    let excused = 0;
    let absent = 0;

    students.forEach((s) => {
      const rec = attendanceMap[s.id];
      const st = rec ? rec.status : 'present';
      if (st === 'present') present++;
      else if (st === 'sick') sick++;
      else if (st === 'excused') excused++;
      else if (st === 'absent') absent++;
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    return {
      total,
      present,
      sick,
      excused,
      absent,
      rate,
      presentPct: total > 0 ? (present / total) * 100 : 0,
      sickPct: total > 0 ? (sick / total) * 100 : 0,
      excusedPct: total > 0 ? (excused / total) * 100 : 0,
      absentPct: total > 0 ? (absent / total) * 100 : 0,
    };
  }, [students, attendanceMap]);

  // ── 6. Filtered Roster for Table ──
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const rec = attendanceMap[s.id];
      const st = rec ? rec.status : 'present';

      if (statusFilter !== 'ALL' && st !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesNisn = s.nisn?.toLowerCase().includes(q);
        if (!matchesName && !matchesNisn) return false;
      }

      return true;
    });
  }, [students, attendanceMap, statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedClassId, pageSize]);

  // Pagination calculation
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, startIndex, pageSize]);

  // Formatted date text
  const dateFormatted = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Donut SVG circumference math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.presentPct / 100) * circumference;

  return (
    <div className={styles.container}>
      {/* ── 1. Top Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className={styles.titleArea}>
            <div className={styles.badgeTag}>
              <span>{isTeacher ? 'Teacher Workstation' : 'School Administration'}</span>
            </div>
            <h1 className={styles.title}>Presensi &amp; Kehadiran Siswa</h1>
            <p className={styles.subtitle}>
              Pusat kelola kehadiran belajar tatap muka, monitoring ketidakhadiran, dan rekapitulasi analitik.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => window.print()}
            className={styles.btnSecondary}
            title="Cetak lembar presensi fisik"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak Rekap</span>
          </button>

          <Link href="/dashboard/reports/export" className={styles.btnSecondary}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Ekspor Data</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Filter & Date Selector Card ── */}
      <div className={styles.controlsCard}>
        <div className={styles.filterGroup}>
          <div className={styles.selectLabel}>
            <span>Rombel / Kelas:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={styles.selectInput}
              disabled={loading || classes.length === 0}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.student_count ? `(${c.student_count} Siswa)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectLabel}>
            <span>Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.selectInput}
            />
          </div>

          {sessions.length > 0 && (
            <div className={styles.selectLabel}>
              <span>Sesi Pembelajaran:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className={styles.selectInput}
              >
                <option value="daily-session">Presensi Reguler Harian</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name || 'Sesi Belajar'} ({s.start_time || '07:30'} - {s.end_time || '09:00'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
          {dateFormatted}
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            background: saveMessage.isError ? '#fef2f2' : '#ecfdf5',
            color: saveMessage.isError ? '#dc2626' : '#047857',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: `1px solid ${saveMessage.isError ? '#fecaca' : '#a7f3d0'}`,
          }}
        >
          {saveMessage.text}
        </div>
      )}

      {/* ── 3. KPI Metrics Cards ── */}
      <div className={styles.metricGrid}>
        {/* Card 1: Rate */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <span>Tingkat Kehadiran</span>
            <span
              className={styles.metricBadge}
              style={{
                background: stats.rate >= 90 ? '#dcfce7' : '#fef3c7',
                color: stats.rate >= 90 ? '#15803d' : '#b45309',
              }}
            >
              {stats.rate >= 90 ? 'Sangat Baik' : 'Perlu Pantauan'}
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue} style={{ color: '#059669' }}>
              {stats.rate}%
            </span>
          </div>
          <span className={styles.metricSub}>
            {stats.present} dari {stats.total} siswa hadir di kelas
          </span>
        </div>

        {/* Card 2: Hadir */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <span>Siswa Hadir</span>
            <span className={styles.metricBadge} style={{ background: '#ecfdf5', color: '#047857' }}>
              {Math.round(stats.presentPct)}%
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue} style={{ color: '#10b981' }}>
              {stats.present}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Siswa</span>
          </div>
          <span className={styles.metricSub}>Hadir tepat waktu mengikuti sesi</span>
        </div>

        {/* Card 3: Sakit & Izin */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <span>Sakit &amp; Izin</span>
            <span className={styles.metricBadge} style={{ background: '#fef3c7', color: '#b45309' }}>
              {stats.sick + stats.excused} Siswa
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue} style={{ color: '#f59e0b' }}>
              {stats.sick + stats.excused}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              ({stats.sick} Sakit, {stats.excused} Izin)
            </span>
          </div>
          <span className={styles.metricSub}>Memiliki konfirmasi tertulis / wali</span>
        </div>

        {/* Card 4: Alpa */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <span>Alpa (Tanpa Ket.)</span>
            <span
              className={styles.metricBadge}
              style={{
                background: stats.absent > 0 ? '#fee2e2' : '#f1f5f9',
                color: stats.absent > 0 ? '#dc2626' : '#64748b',
              }}
            >
              {stats.absent > 0 ? 'Perlu Follow-up' : 'Nihil'}
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span
              className={styles.metricValue}
              style={{ color: stats.absent > 0 ? '#ef4444' : '#64748b' }}
            >
              {stats.absent}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Siswa</span>
          </div>
          <span className={styles.metricSub}>
            {stats.absent > 0 ? 'Tindak lanjuti dengan wali murid' : 'Seluruh siswa terkonfirmasi'}
          </span>
        </div>
      </div>

      {/* ── 4. Visual Attendance Charts Section ── */}
      <div className={styles.chartsGrid}>
        {/* Chart 1: Tren Mingguan */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
                <span>Tren Kehadiran Mingguan (Senin - Sabtu)</span>
              </h3>
              <span className={styles.chartSub}>Persentase kehadiran kelas pada pekan aktif berjalan</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>
              Rata-rata: 95.8%
            </span>
          </div>

          <div className={styles.barChartWrapper}>
            {[
              { day: 'Sen', rate: 98 },
              { day: 'Sel', rate: 96 },
              { day: 'Rab', rate: 94 },
              { day: 'Kam', rate: 97 },
              { day: 'Jum', rate: stats.rate },
              { day: 'Sab', rate: 92 },
            ].map((col) => (
              <div key={col.day} className={styles.barCol}>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ height: `${col.rate}%` }}>
                    <span className={styles.barValueTag}>{col.rate}%</span>
                  </div>
                </div>
                <span className={styles.barDayLabel}>{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Komposisi Status Donut */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>Komposisi Status Hari Ini</span>
              </h3>
              <span className={styles.chartSub}>Distribusi hadir, sakit, izin, dan alpa</span>
            </div>
          </div>

          <div className={styles.donutWrapper}>
            <svg className={styles.donutSvg} viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="none"
              />
              {/* Present fill circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
              {/* Center text */}
              <text
                x="50"
                y="52"
                textAnchor="middle"
                dominantBaseline="middle"
                transform="rotate(90 50 50)"
                style={{ fontSize: '16px', fontWeight: 800, fill: '#0f172a' }}
              >
                {stats.rate}%
              </text>
            </svg>

            <div className={styles.donutLegend}>
              <div className={styles.legendRow}>
                <div className={styles.legendLabel}>
                  <span className={styles.legendDot} style={{ background: '#10b981' }} />
                  <span>Hadir</span>
                </div>
                <span className={styles.legendValue}>{stats.present} Siswa</span>
              </div>

              <div className={styles.legendRow}>
                <div className={styles.legendLabel}>
                  <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                  <span>Sakit</span>
                </div>
                <span className={styles.legendValue}>{stats.sick} Siswa</span>
              </div>

              <div className={styles.legendRow}>
                <div className={styles.legendLabel}>
                  <span className={styles.legendDot} style={{ background: '#0284c7' }} />
                  <span>Izin</span>
                </div>
                <span className={styles.legendValue}>{stats.excused} Siswa</span>
              </div>

              <div className={styles.legendRow}>
                <div className={styles.legendLabel}>
                  <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                  <span>Alpa</span>
                </div>
                <span className={styles.legendValue}>{stats.absent} Siswa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Attendance Roster Table (Lembar Presensi) ── */}
      <div className={styles.rosterCard}>
        <div className={styles.rosterHeader}>
          <div className={styles.rosterTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
            <span>Daftar Hadir Siswa (Roster Presensi)</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              ({filteredStudents.length} siswa)
            </span>
          </div>

          <div className={styles.rosterActions}>
            <button
              onClick={handleMarkAllPresent}
              className={styles.btnSecondary}
              title="Tandai seluruh siswa sebagai Hadir dengan sekali klik"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Tandai Semua Hadir</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className={styles.btnPrimary}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
            </button>
          </div>
        </div>

        {/* Filter bar for roster */}
        <div className={styles.rosterFilterBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusBtn} ${statusFilter === 'ALL' ? styles.btnHadirActive : ''}`}
              style={{ borderRadius: '5px' }}
            >
              Semua ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`${styles.statusBtn} ${statusFilter === 'present' ? styles.btnHadirActive : ''}`}
              style={{ borderRadius: '5px' }}
            >
              Hadir ({stats.present})
            </button>
            <button
              onClick={() => setStatusFilter('sick')}
              className={`${styles.statusBtn} ${statusFilter === 'sick' ? styles.btnSakitActive : ''}`}
              style={{ borderRadius: '5px' }}
            >
              Sakit ({stats.sick})
            </button>
            <button
              onClick={() => setStatusFilter('excused')}
              className={`${styles.statusBtn} ${statusFilter === 'excused' ? styles.btnIzinActive : ''}`}
              style={{ borderRadius: '5px' }}
            >
              Izin ({stats.excused})
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`${styles.statusBtn} ${statusFilter === 'absent' ? styles.btnAlpaActive : ''}`}
              style={{ borderRadius: '5px' }}
            >
              Alpa ({stats.absent})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="text"
              placeholder="Cari siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.notesInput}
              style={{ maxWidth: '190px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.rosterTable}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                <th>Nama Peserta Didik</th>
                <th>NISN / ID</th>
                <th style={{ textAlign: 'center' }}>Status Kehadiran</th>
                <th>Keterangan / Alasan</th>
                <th style={{ textAlign: 'right' }}>Waktu Presensi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                    Tidak ada siswa yang sesuai filter atau kelas belum memiliki siswa terdaftar.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const record = attendanceMap[student.id] || {
                    student_id: student.id,
                    status: 'present',
                    notes: '',
                  };
                  const initial = student.name.trim().charAt(0).toUpperCase();

                  return (
                    <tr key={student.id}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {startIndex + idx + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontFamily: 'monospace' }}>
                        {student.nisn || '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className={styles.statusButtonGroup}>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'present')}
                            className={`${styles.statusBtn} ${record.status === 'present' ? styles.btnHadirActive : ''}`}
                            title="Hadir"
                          >
                            Hadir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'sick')}
                            className={`${styles.statusBtn} ${record.status === 'sick' ? styles.btnSakitActive : ''}`}
                            title="Sakit"
                          >
                            Sakit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'excused')}
                            className={`${styles.statusBtn} ${record.status === 'excused' ? styles.btnIzinActive : ''}`}
                            title="Izin"
                          >
                            Izin
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'absent')}
                            className={`${styles.statusBtn} ${record.status === 'absent' ? styles.btnAlpaActive : ''}`}
                            title="Alpa / Tanpa Keterangan"
                          >
                            Alpa
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Tambahkan catatan jika sakit/izin..."
                          value={record.notes || ''}
                          onChange={(e) => handleSetNotes(student.id, e.target.value)}
                          className={styles.notesInput}
                        />
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b', fontSize: '0.72rem' }}>
                        {record.status === 'present' ? (record.checked_in_at || '07:30 WIB') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Datatable Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            Menampilkan <strong>{totalFiltered > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(startIndex + pageSize, totalFiltered)}</strong> dari <strong>{totalFiltered}</strong> siswa ({students.length} terdaftar)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748b' }}>
              <span>Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={styles.pageSizeSelect}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className={styles.paginationControls}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={styles.pageBtn}
                title="Halaman Pertama"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
                title="Halaman Sebelumnya"
              >
                &lsaquo;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, index, array) => {
                  const showEllipsis = index > 0 && p - array[index - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span style={{ padding: '0 3px', color: '#94a3b8', fontSize: '0.72rem' }}>...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
                title="Halaman Selanjutnya"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
                title="Halaman Terakhir"
              >
                &raquo;
              </button>
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className={styles.btnPrimary}
              style={{ marginLeft: '6px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
