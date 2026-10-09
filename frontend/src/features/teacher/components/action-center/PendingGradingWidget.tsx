'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { PendingGradingTask } from '../../types';

interface PendingGradingWidgetProps {
  tasks: PendingGradingTask[];
}

export function PendingGradingWidget({ tasks }: PendingGradingWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH'>('ALL');

  // 1. Calculate overall grading statistics
  const gradingStats = useMemo(() => {
    let totalPending = 0;
    let totalSubmissions = 0;

    for (const t of tasks) {
      totalPending += t.pending_count;
      totalSubmissions += t.total_submissions;
    }

    const gradedCount = Math.max(0, totalSubmissions - totalPending);
    const completionRate = totalSubmissions > 0 ? Math.round((gradedCount / totalSubmissions) * 100) : 100;

    return {
      totalPending,
      totalSubmissions,
      gradedCount,
      completionRate,
    };
  }, [tasks]);

  // 2. Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterPriority === 'HIGH' && t.pending_count < 3) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.assignment_title?.toLowerCase().includes(q);
        const matchesClass = t.class_name?.toLowerCase().includes(q);
        const matchesSubject = t.subject_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClass && !matchesSubject) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filterPriority, searchQuery]);

  return (
    <div className={styles.widgetCard}>
      {/* ── Header ── */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div>
            <h3 className={styles.widgetTitle}>
              Tugas Menunggu Penilaian
              <span className={styles.badgeCountNeutral}>{tasks.length}</span>
            </h3>
            <p className={styles.widgetSub}>
              Pengumpulan tugas siswa yang siap diperiksa menggunakan Mass Grader.
            </p>
          </div>
        </div>

        {gradingStats.totalPending > 0 && (
          <Link
            href="/dashboard/teacher/grading"
            className={styles.actionBtnOrange}
          >
            <span>Koreksi Semua ({gradingStats.totalPending}) &rarr;</span>
          </Link>
        )}
      </div>

      {/* ── Grading Completion Meter (Teacher Insight) ── */}
      {tasks.length > 0 && (
        <div className={styles.insightStrip}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-primary, #0f172a)' }}>
              Progres Koreksi: {gradingStats.gradedCount} dari {gradingStats.totalSubmissions} pengumpulan ({gradingStats.completionRate}%)
            </span>
            <span style={{ color: '#ea580c' }}>
              {gradingStats.totalPending} berkas menunggu
            </span>
          </div>

          <div className={styles.stackedBar}>
            <div
              className={`${styles.barSegment} ${styles.barGreen}`}
              style={{ width: `${gradingStats.completionRate}%` }}
              title={`${gradingStats.gradedCount} berkas sudah dinilai`}
            />
            <div
              className={`${styles.barSegment} ${styles.barOrange}`}
              style={{ width: `${100 - gradingStats.completionRate}%` }}
              title={`${gradingStats.totalPending} berkas menunggu penilaian`}
            />
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      {tasks.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.tabGroup}>
            <button
              onClick={() => setFilterPriority('ALL')}
              className={`${styles.tabBtn} ${filterPriority === 'ALL' ? styles.tabBtnActive : ''}`}
            >
              Semua ({tasks.length})
            </button>
            <button
              onClick={() => setFilterPriority('HIGH')}
              className={`${styles.tabBtn} ${filterPriority === 'HIGH' ? styles.tabBtnActive : ''}`}
            >
              Prioritas (&ge; 3 berkas)
            </button>
          </div>

          <div className={styles.searchBox}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari tugas / rombel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchBtn}
                aria-label="Hapus filter pencarian"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Bounded Scrollable List or Clean Empty State ── */}
      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className={styles.emptyStateTitle}>Semua Pengumpulan Sudah Dinilai!</span>
          <span className={styles.emptyStateSub}>
            Tidak ada antrean koreksi tugas siswa yang tertunda saat ini. Anda dapat membuka Mass Grader untuk melihat riwayat penilaian.
          </span>
          <Link
            href="/dashboard/teacher/grading"
            className={styles.actionBtnSmall}
            style={{ marginTop: '0.45rem' }}
          >
            <span>Buka Mass Grader &rarr;</span>
          </Link>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <span>Tidak ditemukan tugas yang sesuai filter.</span>
        </div>
      ) : (
        <div className={styles.scrollableList}>
          {filteredTasks.map((task) => (
            <div key={task.assignment_id} className={styles.riskItem}>
              <div className={styles.riskItemLeft}>
                <div className={styles.riskItemMeta}>
                  <span className={styles.studentName}>{task.assignment_title}</span>
                  <span className={styles.classBadge}>{task.class_name}</span>
                  <span className={styles.taskSubject}>
                    {task.subject_name}
                  </span>
                </div>
                <p className={styles.riskItemDesc}>
                  <strong style={{ color: '#ea580c' }}>{task.pending_count}</strong> belum dinilai dari {task.total_submissions} siswa mengumpulkan.
                </p>
              </div>

              <div>
                <Link
                  href={`/dashboard/teacher/grading?assignment_id=${task.assignment_id}`}
                  className={styles.actionBtnSmall}
                  title="Buka Lembar Kerja dan Koreksi Massal"
                >
                  <span>Koreksi ({task.pending_count})</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer Counter ── */}
      {tasks.length > 0 && (
        <div className={styles.listFooter}>
          <span>
            Menampilkan <strong>{filteredTasks.length}</strong> tugas • Total <strong>{gradingStats.totalPending}</strong> berkas menunggu koreksi
          </span>
          <Link href="/dashboard/teacher/grading" className={styles.massGraderLink}>
            Buka Mass Grader &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
