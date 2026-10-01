'use client';

import React from 'react';
import styles from './shared.module.css';
import type { TeacherWorkstationStats } from '../../types';

interface TeacherMetricGridProps {
  stats: TeacherWorkstationStats;
}

export function TeacherMetricGrid({ stats }: TeacherMetricGridProps) {
  const items = [
    {
      label: 'Siswa Diampu',
      value: stats.total_students,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Tugas Belum Dinilai',
      value: stats.pending_essay_submissions,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Kuis & CBT Aktif',
      value: stats.active_quizzes_count,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Progress Baca Kelas',
      value: `${stats.average_class_reading_progress}%`,
      iconBg: '#f5f3ff',
      iconColor: '#7c3aed',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.metricGrid}>
      {items.map((item, idx) => (
        <div key={idx} className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: item.iconBg, color: item.iconColor }}>
            {item.icon}
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{item.value}</span>
            <span className={styles.metricLabel}>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
