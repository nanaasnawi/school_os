'use client';

import React from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { PendingGradingTask } from '../../types';

interface PendingGradingWidgetProps {
  tasks: PendingGradingTask[];
}

export function PendingGradingWidget({ tasks }: PendingGradingWidgetProps) {
  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              Pengumpulan tugas siswa yang siap diperiksa dan dinilai menggunakan Mass Grader.
            </p>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className={styles.emptyStateTitle}>Semua Pengumpulan Sudah Dinilai!</span>
          <span>Tidak ada antrean koreksi tugas saat ini.</span>
        </div>
      ) : (
        <div className={styles.riskList}>
          {tasks.map((task) => (
            <div key={task.assignment_id} className={styles.riskItem}>
              <div className={styles.riskItemLeft}>
                <div className={styles.riskItemMeta}>
                  <span className={styles.studentName}>{task.assignment_title}</span>
                  <span className={styles.classBadge}>{task.class_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    {task.subject_name}
                  </span>
                </div>
                <p className={styles.riskItemDesc}>
                  <strong>{task.pending_count}</strong> belum dinilai dari {task.total_submissions} siswa mengumpulkan.
                </p>
              </div>

              <div>
                <Link
                  href={`/dashboard/learning/assignments?id=${task.assignment_id}`}
                  className={styles.actionBtnSmall}
                  title="Buka Lembar Kerja dan Koreksi Massal"
                >
                  <span>Koreksi ({task.pending_count})</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
