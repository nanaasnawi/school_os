'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { AtRiskStudent } from '../../types';

interface AtRiskStudentsWidgetProps {
  students: AtRiskStudent[];
  onResolve: (studentId: string) => void;
}

type FilterCategory = 'ALL' | 'LOW_SCORE' | 'OVERDUE_ASSIGNMENT' | 'UNREAD_MATERIAL';

export function AtRiskStudentsWidget({ students, onResolve }: AtRiskStudentsWidgetProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifiedStudentIds, setNotifiedStudentIds] = useState<Record<string, boolean>>({});
  const [batchSentMessage, setBatchSentMessage] = useState<string | null>(null);

  // 1. Calculate statistical risk breakdown
  const stats = useMemo(() => {
    let lowScore = 0;
    let overdue = 0;
    let unread = 0;

    for (const s of students) {
      if (s.category === 'LOW_SCORE') lowScore++;
      else if (s.category === 'OVERDUE_ASSIGNMENT') overdue++;
      else if (s.category === 'UNREAD_MATERIAL') unread++;
    }

    const total = students.length;
    return {
      total,
      lowScore,
      overdue,
      unread,
      lowScorePct: total > 0 ? (lowScore / total) * 100 : 0,
      overduePct: total > 0 ? (overdue / total) * 100 : 0,
      unreadPct: total > 0 ? (unread / total) * 100 : 0,
    };
  }, [students]);

  // 2. Filter students by tab & search query
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Tab filter
      if (selectedFilter !== 'ALL' && s.category !== selectedFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.student_name?.toLowerCase().includes(q);
        const matchesClass = s.class_name?.toLowerCase().includes(q);
        const matchesTitle = s.title?.toLowerCase().includes(q);
        if (!matchesName && !matchesClass && !matchesTitle) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedFilter, searchQuery]);

  const handleSendSingleReminder = (studentId: string, studentName: string) => {
    setNotifiedStudentIds((prev) => ({ ...prev, [studentId]: true }));
    onResolve(studentId);
  };

  const handleSendBatchReminder = () => {
    if (filteredStudents.length === 0) return;
    const newNotified = { ...notifiedStudentIds };
    for (const s of filteredStudents) {
      newNotified[s.student_id] = true;
      onResolve(s.student_id);
    }
    setNotifiedStudentIds(newNotified);
    setBatchSentMessage(`✓ Pengingat berhasil dikirimkan ke ${filteredStudents.length} siswa.`);
    setTimeout(() => setBatchSentMessage(null), 4000);
  };

  return (
    <div className={styles.widgetCard}>
      {/* ── Header ── */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h3 className={styles.widgetTitle}>
              Siswa Perlu Perhatian
              <span className={styles.badgeCount}>{students.length}</span>
            </h3>
            <p className={styles.widgetSub}>
              Pemantauan keterlambatan modul, tugas tertunda, atau nilai di bawah standar KKM.
            </p>
          </div>
        </div>

        {students.length > 0 && (
          <button
            onClick={handleSendBatchReminder}
            className={styles.batchActionBtn}
            title="Kirim notifikasi pengingat serentak ke siswa yang tampil"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Kirim Pengingat ({filteredStudents.length})</span>
          </button>
        )}
      </div>

      {batchSentMessage && (
        <div style={{ background: '#ecfdf5', color: '#047857', padding: '0.45rem 1rem', fontSize: '0.74rem', fontWeight: 600, borderBottom: '1px solid #a7f3d0' }}>
          {batchSentMessage}
        </div>
      )}

      {/* ── Statistical Breakdown Bar (Teacher Insight) ── */}
      {students.length > 0 && (
        <div className={styles.insightStrip}>
          <div className={styles.stackedBar}>
            {stats.lowScorePct > 0 && (
              <div
                className={`${styles.barSegment} ${styles.barRed}`}
                style={{ width: `${stats.lowScorePct}%` }}
                title={`Nilai < KKM: ${stats.lowScore} siswa (${Math.round(stats.lowScorePct)}%)`}
              />
            )}
            {stats.overduePct > 0 && (
              <div
                className={`${styles.barSegment} ${styles.barAmber}`}
                style={{ width: `${stats.overduePct}%` }}
                title={`Tugas Menunggak: ${stats.overdue} siswa (${Math.round(stats.overduePct)}%)`}
              />
            )}
            {stats.unreadPct > 0 && (
              <div
                className={`${styles.barSegment} ${styles.barOrange}`}
                style={{ width: `${stats.unreadPct}%` }}
                title={`Materi Tertinggal: ${stats.unread} siswa (${Math.round(stats.unreadPct)}%)`}
              />
            )}
          </div>

          <div className={styles.legendRow}>
            <span className={styles.legendItem}>
              <span className={styles.dotRed} />
              <span>Nilai &lt; KKM: <strong>{stats.lowScore}</strong></span>
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dotAmber} />
              <span>Tugas Tertunda: <strong>{stats.overdue}</strong></span>
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dotOrange} />
              <span>Materi Tertinggal: <strong>{stats.unread}</strong></span>
            </span>
          </div>
        </div>
      )}

      {/* ── Interactive Filter & Search Bar ── */}
      {students.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.tabGroup}>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`${styles.tabBtn} ${selectedFilter === 'ALL' ? styles.tabBtnActive : ''}`}
            >
              Semua ({stats.total})
            </button>
            {stats.unread > 0 && (
              <button
                onClick={() => setSelectedFilter('UNREAD_MATERIAL')}
                className={`${styles.tabBtn} ${selectedFilter === 'UNREAD_MATERIAL' ? styles.tabBtnActive : ''}`}
              >
                Materi ({stats.unread})
              </button>
            )}
            {stats.overdue > 0 && (
              <button
                onClick={() => setSelectedFilter('OVERDUE_ASSIGNMENT')}
                className={`${styles.tabBtn} ${selectedFilter === 'OVERDUE_ASSIGNMENT' ? styles.tabBtnActive : ''}`}
              >
                Tugas ({stats.overdue})
              </button>
            )}
            {stats.lowScore > 0 && (
              <button
                onClick={() => setSelectedFilter('LOW_SCORE')}
                className={`${styles.tabBtn} ${selectedFilter === 'LOW_SCORE' ? styles.tabBtnActive : ''}`}
              >
                Nilai Rendah ({stats.lowScore})
              </button>
            )}
          </div>

          <div className={styles.searchBox}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama / kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Bounded Scrollable List (Prevent Endless Vertical Page) ── */}
      {students.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className={styles.emptyStateTitle}>Seluruh Siswa Berada di Jalur Aman!</span>
          <span>Tidak ada siswa yang mengalami keterlambatan membaca atau tugas saat ini.</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className={styles.emptyState} style={{ padding: '1.5rem 1rem' }}>
          <span>Tidak ditemukan siswa yang sesuai filter pencarian.</span>
        </div>
      ) : (
        <div className={styles.scrollableList}>
          {filteredStudents.map((student) => {
            const isHigh = student.risk_level === 'HIGH';
            const isSent = notifiedStudentIds[student.student_id];

            return (
              <div key={student.student_id} className={styles.riskItem}>
                <div className={styles.riskItemLeft}>
                  <div className={styles.riskItemMeta}>
                    <span className={styles.studentName}>{student.student_name}</span>
                    <span className={styles.classBadge}>{student.class_name}</span>
                    <span
                      className={`${styles.riskCategoryPill} ${
                        student.category === 'LOW_SCORE'
                          ? styles.riskHigh
                          : student.category === 'OVERDUE_ASSIGNMENT'
                          ? styles.riskMedium
                          : styles.riskInfo
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
                  </div>
                  <p className={styles.riskItemTitle}>{student.title}</p>
                  <p className={styles.riskItemDesc}>{student.description}</p>
                </div>

                <div>
                  {isSent ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      ✓ Terkirim
                    </span>
                  ) : student.target_url ? (
                    <Link href={student.target_url} className={styles.actionBtnSmall}>
                      <span>{student.action_label}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSendSingleReminder(student.student_id, student.student_name)}
                      className={styles.actionBtnSmall}
                      title="Kirim pesan notifikasi pengingat ke siswa ini"
                    >
                      <span>{student.action_label || 'Kirim Pengingat'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer Counter ── */}
      {students.length > 0 && (
        <div className={styles.listFooter}>
          <span>
            Menampilkan <strong>{filteredStudents.length}</strong> dari <strong>{students.length}</strong> siswa terpantau
          </span>
          <Link href="/dashboard/teacher/classes" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}>
            Buka Roster Kelas &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
