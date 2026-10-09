'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import styles from './at-risk.module.css';
import { fetchAtRiskStudents, fetchTeacherClasses, fetchCurrentTeacherProfile } from '@/features/teacher/api';
import { getApiUrl, apiClient } from '@/lib/api';
import type { AtRiskStudent, TeacherClassSummary, RiskCategory, TeacherProfile } from '@/features/teacher/types';

interface ReminderRecord {
  id: string;
  sent: boolean;
  sent_at: string;
  title: string;
}

function getAuthHeaders(): HeadersInit {
  const token =
    apiClient.getToken() ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || localStorage.getItem('token')
      : null);
  const tenantId =
    typeof window !== 'undefined'
      ? localStorage.getItem('active_tenant_id') ||
        localStorage.getItem('tenant_id') ||
        localStorage.getItem('tenantId')
      : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
  };
}

async function safeJsonParse(res: Response) {
  const text = await res.text();
  if (!text || text.trim() === '') {
    return { success: res.ok };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: `Format respon server tidak valid (${res.status})` };
  }
}

function formatReminderTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 2) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (isToday) return `Hari ini ${hours}:${minutes}`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return `Kemarin ${hours}:${minutes}`;

    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[date.getMonth()]}`;
  } catch {
    return 'Terkirim';
  }
}

export default function AtRiskDetailPage() {
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | RiskCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Realtime reminders state
  const [remindersMap, setRemindersMap] = useState<Record<string, ReminderRecord>>({});
  const [sendingStudentId, setSendingStudentId] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Load teacher classes, at-risk students, and active reminders
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const prof = await fetchCurrentTeacherProfile();
        setTeacherProfile(prof);

        const [cls, riskList, reminderRes] = await Promise.all([
          fetchTeacherClasses(prof || undefined),
          fetchAtRiskStudents(selectedClassId === 'ALL' ? undefined : selectedClassId, prof || undefined),
          fetch(getApiUrl('/api/v1/teacher/remind'), { headers: getAuthHeaders() })
            .then(async (r) => (r.ok ? await safeJsonParse(r) : null))
            .catch(() => null),
        ]);

        setClasses(cls);
        setStudents(riskList);
        if (reminderRes?.data) {
          setRemindersMap(reminderRes.data);
        }
      } catch (err) {
        console.error('Error loading at risk students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedClassId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery, selectedClassId, pageSize]);

  // Selected class object
  const selectedClass = useMemo(() => {
    if (selectedClassId === 'ALL') return null;
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Overall Statistics scoped to the selected class
  const stats = useMemo(() => {
    const targetStudents = students.filter((s) => {
      if (selectedClassId === 'ALL') return true;
      const matchesId = s.class_id && s.class_id === selectedClassId;
      const matchesName =
        selectedClass &&
        s.class_name &&
        s.class_name.trim().toLowerCase() === selectedClass.name.trim().toLowerCase();
      return matchesId || matchesName;
    });

    let lowScore = 0;
    let overdue = 0;
    let unread = 0;

    for (const s of targetStudents) {
      if (s.category === 'LOW_SCORE') lowScore++;
      else if (s.category === 'OVERDUE_ASSIGNMENT') overdue++;
      else if (s.category === 'UNREAD_MATERIAL') unread++;
    }

    return {
      total: targetStudents.length,
      lowScore,
      overdue,
      unread,
    };
  }, [students, selectedClassId, selectedClass]);

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Strict class filter
      if (selectedClassId !== 'ALL') {
        const matchesId = s.class_id && s.class_id === selectedClassId;
        const matchesName =
          selectedClass &&
          s.class_name &&
          s.class_name.trim().toLowerCase() === selectedClass.name.trim().toLowerCase();
        if (!matchesId && !matchesName) {
          return false;
        }
      }

      // 2. Category tab filter
      if (selectedFilter !== 'ALL' && s.category !== selectedFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.student_name?.toLowerCase().includes(q);
        const matchesClass = s.class_name?.toLowerCase().includes(q);
        const matchesNisn = s.nisn?.toLowerCase().includes(q);
        const matchesTitle = s.title?.toLowerCase().includes(q);
        if (!matchesName && !matchesClass && !matchesNisn && !matchesTitle) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedClassId, selectedClass, selectedFilter, searchQuery]);

  // Pagination calculation
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, startIndex, pageSize]);

  // Realtime single reminder sending
  const handleSendSingleReminder = async (student: AtRiskStudent) => {
    setSendingStudentId(student.student_id);
    try {
      const res = await fetch(getApiUrl('/api/v1/teacher/remind'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          student_id: student.student_id,
          title: student.title,
          category: student.category,
          reason: student.description,
          material_id: student.material_id,
          assignment_id: student.assignment_id,
          teacher_name: teacherProfile?.full_name || 'Guru Pengampu',
        }),
      });

      const json = await safeJsonParse(res);
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || `Gagal mengirim pengingat (HTTP ${res.status})`);
      }

      const now = new Date().toISOString();
      setRemindersMap((prev) => ({
        ...prev,
        [student.student_id]: {
          id: json.reminders?.[0]?.notification_id || 'sent',
          sent: true,
          sent_at: now,
          title: student.title,
        },
      }));

      showToast(`Pengingat berhasil dikirim ke ${student.student_name} secara realtime.`);
    } catch (err: any) {
      console.error('Error sending single reminder:', err);
      showToast(err?.message || 'Gagal mengirim pengingat ke siswa.', 'error');
    } finally {
      setSendingStudentId(null);
    }
  };

  // Realtime batch reminder sending
  const handleSendBatchReminder = async () => {
    if (filteredStudents.length === 0 || isBatchSending) return;
    setIsBatchSending(true);

    try {
      const studentIds = filteredStudents.map((s) => s.student_id);
      const res = await fetch(getApiUrl('/api/v1/teacher/remind'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          student_ids: studentIds,
          title:
            selectedFilter === 'UNREAD_MATERIAL'
              ? 'Membaca Modul Pembelajaran'
              : selectedFilter === 'OVERDUE_ASSIGNMENT'
              ? 'Tugas Belum Dikumpulkan'
              : selectedFilter === 'LOW_SCORE'
              ? 'Evaluasi & Remedial Belajar'
              : 'Penyelesaian Kendala Belajar',
          category: selectedFilter !== 'ALL' ? selectedFilter : 'UNREAD_MATERIAL',
          teacher_name: teacherProfile?.full_name || 'Guru Pengampu',
        }),
      });

      const json = await safeJsonParse(res);
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || `Gagal mengirim pengingat serentak (HTTP ${res.status})`);
      }

      const now = new Date().toISOString();
      const updatedMap: Record<string, ReminderRecord> = {};
      for (const id of studentIds) {
        updatedMap[id] = {
          id: 'batch_sent',
          sent: true,
          sent_at: now,
          title: 'Pengingat Serentak',
        };
      }
      setRemindersMap((prev) => ({ ...prev, ...updatedMap }));

      showToast(`Notifikasi pengingat berhasil dikirimkan ke ${json.sent_count || studentIds.length} siswa secara serentak.`);
    } catch (err: any) {
      console.error('Error sending batch reminder:', err);
      showToast(err?.message || 'Gagal mengirim pengingat serentak.', 'error');
    } finally {
      setIsBatchSending(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Top Navigation ── */}
      <div className={styles.topNav}>
        <Link href="/dashboard/teacher" className={styles.backBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Kembali ke Action Center Workstation</span>
        </Link>
      </div>

      {/* ── Header Card ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className={styles.titleArea}>
            <div className={styles.badgeTag}>
              <span>Teacher Early Warning System</span>
            </div>
            <h1 className={styles.title}>Daftar Siswa Perlu Perhatian (At-Risk Monitoring)</h1>
            <p className={styles.subtitle}>
              Pemantauan komprehensif kendala belajar: keterlambatan membaca materi modul, tugas belum dikumpulkan, atau nilai di bawah KKM.
            </p>
          </div>
        </div>

        <button
          onClick={handleSendBatchReminder}
          disabled={filteredStudents.length === 0 || isBatchSending}
          className={styles.batchBtn}
          title="Kirim notifikasi pengingat secara serentak ke seluruh siswa yang terfilter"
        >
          {isBatchSending ? (
            <>
              <svg className={styles.spin} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span>Mengirim Notifikasi...</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Kirim Pengingat Serentak ({filteredStudents.length})</span>
            </>
          )}
        </button>
      </div>

      {/* ── Toast Alert Banner ── */}
      {toastMessage && (
        <div
          style={{
            background: toastMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: toastMessage.type === 'success' ? '#047857' : '#b91c1c',
            padding: '0.6rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span>{toastMessage.type === 'success' ? '✓ ' : '⚠ '}{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── KPI Metric Grid (Scoped to Selected Class) ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiVal}>{stats.total}</div>
            <div className={styles.kpiLabel}>Total Perlu Perhatian</div>
          </div>
          <div className={styles.kpiIconPill} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiVal} style={{ color: '#ea580c' }}>{stats.unread}</div>
            <div className={styles.kpiLabel}>Materi Tertinggal</div>
          </div>
          <div className={styles.kpiIconPill} style={{ background: '#fff7ed', color: '#ea580c' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiVal} style={{ color: '#d97706' }}>{stats.overdue}</div>
            <div className={styles.kpiLabel}>Tugas Belum Dikumpulkan</div>
          </div>
          <div className={styles.kpiIconPill} style={{ background: '#fefce8', color: '#d97706' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiVal} style={{ color: '#dc2626' }}>{stats.lowScore}</div>
            <div className={styles.kpiLabel}>Nilai di Bawah Standar KKM</div>
          </div>
          <div className={styles.kpiIconPill} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Datatable Card ── */}
      <div className={styles.tableCard}>
        {/* Toolbar & Filters */}
        <div className={styles.toolbar}>
          <div className={styles.tabGroup}>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`${styles.tabBtn} ${selectedFilter === 'ALL' ? styles.tabBtnActive : ''}`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setSelectedFilter('UNREAD_MATERIAL')}
              className={`${styles.tabBtn} ${selectedFilter === 'UNREAD_MATERIAL' ? styles.tabBtnActive : ''}`}
            >
              Materi Tertinggal ({stats.unread})
            </button>
            <button
              onClick={() => setSelectedFilter('OVERDUE_ASSIGNMENT')}
              className={`${styles.tabBtn} ${selectedFilter === 'OVERDUE_ASSIGNMENT' ? styles.tabBtnActive : ''}`}
            >
              Tugas Tertunda ({stats.overdue})
            </button>
            <button
              onClick={() => setSelectedFilter('LOW_SCORE')}
              className={`${styles.tabBtn} ${selectedFilter === 'LOW_SCORE' ? styles.tabBtnActive : ''}`}
            >
              Nilai Rendah ({stats.lowScore})
            </button>
          </div>

          <div className={styles.filterControls}>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter berdasarkan rombel"
            >
              <option value="ALL">Semua Rombel Diampu</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.student_count} Siswa)
                </option>
              ))}
            </select>

            <div className={styles.searchBox}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari siswa, NISN, modul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', padding: 0 }}
                  aria-label="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                <th>Nama Peserta Didik</th>
                <th>Rombel / Kelas</th>
                <th>Kategori Kendala</th>
                <th>Detail Masalah / Materi</th>
                <th style={{ textAlign: 'right', minWidth: '160px' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <svg className={styles.spin} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                      </svg>
                      <span>Memuat data siswa terpantau...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    {selectedClassId !== 'ALL' && selectedClass ? (
                      <div className={styles.safeEmptyCard}>
                        <div className={styles.safeIconBox}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <h3 className={styles.safeTitle}>
                          Rombel {selectedClass.name} Dalam Kondisi Aman
                        </h3>
                        <p className={styles.safeDesc}>
                          Tidak ada peserta didik yang memerlukan perhatian khusus di rombel ini. Seluruh kegiatan belajar (membaca modul, tugas, dan evaluasi) berjalan tuntas tanpa kendala.
                        </p>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        Tidak ditemukan siswa yang memerlukan perhatian atau seluruh siswa dalam kondisi aman.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const reminderInfo = remindersMap[student.student_id];
                  const isSending = sendingStudentId === student.student_id;
                  const initial = student.student_name.trim().charAt(0).toUpperCase();

                  return (
                    <tr key={`${student.student_id}_${student.category}_${idx}`}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {startIndex + idx + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className={styles.studentAvatar}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                              {student.student_name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                              {student.nisn || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.classPill}>
                          {student.class_name}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.categoryPill} ${
                            student.category === 'LOW_SCORE'
                              ? styles.catRed
                              : student.category === 'UNREAD_MATERIAL'
                              ? styles.catOrange
                              : styles.catAmber
                          }`}
                        >
                          {student.category === 'UNREAD_MATERIAL'
                            ? 'Materi Tertinggal'
                            : student.category === 'OVERDUE_ASSIGNMENT'
                            ? 'Tugas Belum Kumpul'
                            : student.category === 'LOW_SCORE'
                            ? 'Nilai < KKM'
                            : 'Perlu Perhatian'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                          {student.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {student.description}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isSending ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg className={styles.spin} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                            </svg>
                            <span>Mengirim...</span>
                          </span>
                        ) : reminderInfo ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              className={styles.remindBadge}
                              title={`Terkirim pada: ${new Date(reminderInfo.sent_at).toLocaleString('id-ID')}`}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Terkirim ({formatReminderTime(reminderInfo.sent_at)})</span>
                            </span>
                            <button
                              onClick={() => handleSendSingleReminder(student)}
                              className={styles.resendBtn}
                              title="Kirim ulang notifikasi pengingat ke siswa ini"
                            >
                              Kirim Ulang
                            </button>
                          </div>
                        ) : student.category === 'LOW_SCORE' && student.target_url ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link href={student.target_url} className={styles.actionBtnSmall}>
                              <span>{student.action_label}</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleSendSingleReminder(student)}
                              className={styles.actionBtnSmall}
                              title="Kirim notifikasi pengingat remedial ke siswa"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                              <span>Ingatkan</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSendSingleReminder(student)}
                            className={styles.actionBtnSmall}
                            title="Kirim notifikasi pengingat realtime ke siswa"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span>Kirim Pengingat</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            Menampilkan <strong>{totalFiltered > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(startIndex + pageSize, totalFiltered)}</strong> dari <strong>{totalFiltered}</strong> siswa
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b' }}>
              <span>Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={styles.pageSizeSelect}
                aria-label="Jumlah baris per halaman"
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
          </div>
        </div>
      </div>
    </div>
  );
}
