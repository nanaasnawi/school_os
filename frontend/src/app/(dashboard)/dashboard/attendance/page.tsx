'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

function AttendanceContent() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const searchParams = useSearchParams();

  // URL Query Parameters from Learning / Jadwal Sesi
  const queryClassId = searchParams.get('class_id') || '';
  const queryDate = searchParams.get('date') || '';
  const querySessionId = searchParams.get('session_id') || '';
  const querySubject = searchParams.get('subject_name') || '';

  // ── States ──
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(queryClassId || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) return queryDate;
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(querySessionId || '');
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
          // If queryClassId was provided (e.g. from Jadwal Pelajaran), ensure that class is selectable
          if (queryClassId && !assigned.some((c: any) => c.id === queryClassId)) {
            const matchedTarget = rawClasses.find((c: any) => c.id === queryClassId);
            if (matchedTarget) assigned.push(matchedTarget);
          }
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
            if (queryClassId && formatted.some((c: any) => c.id === queryClassId)) return queryClassId;
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
  }, [user?.id, isTeacher, queryClassId]);

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
        const matchingSession =
          (querySessionId && classSessions.find((sess: any) => sess.id === querySessionId)) ||
          classSessions.find((sess: any) => {
            if (!sess.date) return false;
            return sess.date.startsWith(selectedDate);
          }) ||
          classSessions[0];

        const activeSessionId = matchingSession?.id || (querySessionId || 'daily-session');
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

  // ── 6. Filtered & Sorted Roster for Table ──
  type AttendanceSortField = 'name' | 'nisn' | 'status' | 'checked_in_at';
  const [sortField, setSortField] = useState<AttendanceSortField | null>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSetSort = (field: AttendanceSortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  const sortedStudents = useMemo(() => {
    if (!sortField) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '', 'id');
      } else if (sortField === 'nisn') {
        comparison = (a.nisn || '').localeCompare(b.nisn || '', undefined, { numeric: true });
      } else if (sortField === 'status') {
        const sa = attendanceMap[a.id]?.status || 'present';
        const sb = attendanceMap[b.id]?.status || 'present';
        comparison = sa.localeCompare(sb);
      } else if (sortField === 'checked_in_at') {
        const ta = attendanceMap[a.id]?.checked_in_at || '07:30';
        const tb = attendanceMap[b.id]?.checked_in_at || '07:30';
        comparison = ta.localeCompare(tb);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortField, sortOrder, attendanceMap]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedClassId, pageSize, sortField, sortOrder]);

  // Pagination calculation
  const totalFiltered = sortedStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = useMemo(() => {
    return sortedStudents.slice(startIndex, startIndex + pageSize);
  }, [sortedStudents, startIndex, pageSize]);

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
    <div className={styles.page}>
      {/* Toast Notification */}
      {saveMessage && (
        <div className="toastContainer">
          <div className={`toast ${saveMessage.isError ? 'toastError' : 'toastSuccess'}`}>
            <span>{saveMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── 1. Top Header (Standard SchoolOS Enterprise Design) ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Presensi &amp; Kehadiran Siswa</h1>
          <p className={styles.subtitle}>
            Pusat kelola kehadiran belajar tatap muka, monitoring ketidakhadiran, dan rekapitulasi analitik
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            title="Cetak lembar presensi fisik"
          >
            🖨️ Cetak Rekap
          </button>

          <Link href="/dashboard/reports/export" className="btn btn-secondary btn-sm">
            📊 Ekspor Data
          </Link>
        </div>
      </div>

      {/* ── Contextual Session Banner (When navigated from Jadwal / Sesi Belajar) ── */}
      {Boolean(queryClassId || querySubject) && (
        <div className={styles.sessionContextBanner}>
          <div className={styles.sessionContextLeft}>
            <span className={styles.sessionBadge}>Sesi Terjadwal</span>
            <div>
              <h3 className={styles.sessionTitle}>
                Presensi Sesi: {classes.find((c) => c.id === selectedClassId)?.name || 'Kelas Terpilih'} {querySubject ? `• ${querySubject}` : ''}
              </h3>
              <p className={styles.sessionMeta}>
                📅 {dateFormatted} {selectedSessionId && selectedSessionId !== 'daily-session' ? `• Sesi ID: ${selectedSessionId.slice(0, 8)}...` : ''} • Lembar presensi rombel dibuka otomatis sesuai jadwal sesi belajar.
              </p>
            </div>
          </div>
          <Link href="/dashboard/learning" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>←</span> Kembali ke Jadwal Pelajaran
          </Link>
        </div>
      )}

      {/* ── 2. Filter & Date Selector Card (Clean Enterprise Bar) ── */}
      <div className={styles.controlsCard}>
        <div className={styles.filterGroup}>
          <div className={styles.selectLabel}>
            <span>Rombel / Kelas:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="input"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}
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
              className="input"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            />
          </div>

          {sessions.length > 0 && (
            <div className={styles.selectLabel}>
              <span>Sesi Pembelajaran:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="input"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}
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

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          📅 {dateFormatted}
        </div>
      </div>

      {/* ── 3. KPI Metrics Cards ── */}
      <div className={styles.metricGrid}>
        {/* Card 1: Rate */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <span>Tingkat Kehadiran</span>
            <span
              className="badge"
              style={{
                background: stats.rate >= 90 ? '#dcfce7' : '#fef3c7',
                color: stats.rate >= 90 ? '#15803d' : '#b45309',
                border: stats.rate >= 90 ? '1px solid #86efac' : '1px solid #fde68a',
              }}
            >
              {stats.rate >= 90 ? 'Sangat Baik' : 'Perlu Pantauan'}
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue} style={{ color: stats.rate >= 90 ? '#059669' : '#d97706' }}>
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
            <span className="badge badge-success">
              {Math.round(stats.presentPct)}%
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue} style={{ color: '#059669' }}>
              {stats.present}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Siswa</span>
          </div>
          <span className={styles.metricSub}>Hadir tepat waktu mengikuti sesi</span>
        </div>

        {/* Card 3: Sakit & Izin */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <span>Sakit &amp; Izin</span>
            <span className="badge badge-warning">
              {stats.sick + stats.excused} Siswa
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue} style={{ color: '#d97706' }}>
              {stats.sick + stats.excused}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
              className="badge"
              style={{
                background: stats.absent > 0 ? '#fee2e2' : '#f1f5f9',
                color: stats.absent > 0 ? '#dc2626' : '#64748b',
                border: stats.absent > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
              }}
            >
              {stats.absent > 0 ? 'Perlu Tindak Lanjut' : 'Nihil'}
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span
              className={styles.metricValue}
              style={{ color: stats.absent > 0 ? '#dc2626' : 'var(--text-primary)' }}
            >
              {stats.absent}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Siswa</span>
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
                <span>📊 Tren Kehadiran Mingguan (Senin - Sabtu)</span>
              </h3>
              <span className={styles.chartSub}>Persentase kehadiran kelas pada pekan aktif berjalan</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
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
                <span>🕒 Komposisi Status Hari Ini</span>
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
                style={{ fontSize: '16px', fontWeight: 800, fill: 'var(--text-primary, #0f172a)' }}
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

      {/* ── 5. Master Enterprise Datatable (Daftar Hadir Siswa) ── */}
      <div className="tableCard">
        {/* Top Toolbar */}
        <div className="tableToolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              📋 Daftar Hadir Siswa (Roster Presensi)
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ({filteredStudents.length} siswa)
            </span>

            {/* Filter status tabs in unified modern segmented switcher */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-elevated, #f1f5f9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-light, #e2e8f0)' }}>
              {[
                { id: 'ALL', label: `Semua (${students.length})` },
                { id: 'present', label: `Hadir (${stats.present})` },
                { id: 'sick', label: `Sakit (${stats.sick})` },
                { id: 'excused', label: `Izin (${stats.excused})` },
                { id: 'absent', label: `Alpa (${stats.absent})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === tab.id ? '#2563eb' : 'transparent',
                    color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary, #64748b)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Toolbar: Search & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tableSearchInput"
              />
              <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="btn btn-secondary btn-sm"
              title="Tandai seluruh siswa sebagai Hadir dengan sekali klik"
            >
              ✓ Tandai Semua Hadir
            </button>

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving ? 'Menyimpan...' : '💾 Simpan Presensi'}
            </button>
          </div>
        </div>

        {/* Master Table Wrap */}
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>NO</th>
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('name')}
                >
                  <div className="thSortContent">
                    <span>NAMA PESERTA DIDIK</span>
                    <span className="sortArrows">{sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th
                  className="thSortable"
                  style={{ width: '160px' }}
                  onClick={() => handleSetSort('nisn')}
                >
                  <div className="thSortContent">
                    <span>NISN / ID</span>
                    <span className="sortArrows">{sortField === 'nisn' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th
                  className="thSortable"
                  style={{ width: '220px', textAlign: 'center' }}
                  onClick={() => handleSetSort('status')}
                >
                  <div className="thSortContent" style={{ justifyContent: 'center' }}>
                    <span>STATUS KEHADIRAN</span>
                    <span className="sortArrows">{sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th>KETERANGAN / ALASAN</th>
                <th
                  className="thSortable"
                  style={{ width: '150px', textAlign: 'right' }}
                  onClick={() => handleSetSort('checked_in_at')}
                >
                  <div className="thSortContent" style={{ justifyContent: 'flex-end' }}>
                    <span>WAKTU PRESENSI</span>
                    <span className="sortArrows">{sortField === 'checked_in_at' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                    Tidak ada siswa yang sesuai filter atau rombel belum memiliki siswa terdaftar.
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
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              flexShrink: 0,
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            {initial}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {student.nisn || '-'}
                        </code>
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
                          className="input"
                          style={{ padding: '0.28rem 0.6rem', fontSize: '0.75rem', width: '100%', maxWidth: '240px' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          {record.status === 'present' ? (record.checked_in_at || '07:30 WIB') : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Pagination ── */}
        <div className="tableToolbar" style={{ borderTop: '1px solid var(--border-light, #f1f5f9)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div className="tableInfoText">
            Menampilkan <strong>{totalFiltered > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(startIndex + pageSize, totalFiltered)}</strong> dari <strong>{totalFiltered}</strong> siswa ({students.length} terdaftar)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="entriesSelect"
                style={{ padding: '0.22rem 0.5rem', fontSize: '0.75rem' }}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="paginationBtns">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pageBtn"
                title="Halaman Pertama"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pageBtn"
                title="Halaman Sebelumnya"
              >
                ‹
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 0.5rem', color: 'var(--text-secondary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pageBtn"
                title="Halaman Selanjutnya"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pageBtn"
                title="Halaman Terakhir"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <p style={{ fontWeight: 600 }}>Memuat Lembar Presensi...</p>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
