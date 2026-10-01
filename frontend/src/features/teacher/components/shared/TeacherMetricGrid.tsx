'use client';

import React from 'react';
import Link from 'next/link';
import styles from './shared.module.css';
import type { TeacherWorkstationStats } from '../../types';

interface TeacherMetricGridProps {
  stats: TeacherWorkstationStats;
}

export function TeacherMetricGrid({ stats }: TeacherMetricGridProps) {
  return (
    <div className={styles.metricGrid}>
      {/* ── Card 1: Siswa Diampu (Blue) ── */}
      <div className={`${styles.metricCard} ${styles.cardBlue}`}>
        <div className={styles.metricTop}>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{stats.total_students}</div>
            <div className={styles.metricSubtitle}>Siswa Aktif Terdaftar</div>
          </div>
          <div className={styles.metricWatermark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
        </div>
        <Link href="/dashboard/teacher/classes" className={styles.metricBottom}>
          <span>Peserta Didik (Kelas Saya)</span>
          <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {/* ── Card 2: Tugas Belum Dinilai (Orange) ── */}
      <div className={`${styles.metricCard} ${styles.cardOrange}`}>
        <div className={styles.metricTop}>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{stats.pending_essay_submissions}</div>
            <div className={styles.metricSubtitle}>Menunggu Penilaian Esai</div>
          </div>
          <div className={styles.metricWatermark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>
        <Link href="/dashboard/teacher/grading" className={styles.metricBottom}>
          <span>Koreksi Massal Siswa</span>
          <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {/* ── Card 3: Kuis & CBT Aktif (Emerald) ── */}
      <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
        <div className={styles.metricTop}>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{stats.active_quizzes_count}</div>
            <div className={styles.metricSubtitle}>Kuis Berjalan Aktif</div>
          </div>
          <div className={styles.metricWatermark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
        <Link href="/dashboard/quizzes" className={styles.metricBottom}>
          <span>Kuis &amp; Asesmen CBT</span>
          <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {/* ── Card 4: Progress Baca Kelas (Purple) ── */}
      <div className={`${styles.metricCard} ${styles.cardPurple}`}>
        <div className={styles.metricTop}>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{stats.average_class_reading_progress}%</div>
            <div className={styles.metricSubtitle}>Rata-rata Keterbacaan Modul</div>
          </div>
          <div className={styles.metricWatermark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </div>
        <Link href="/dashboard/teacher/analytics" className={styles.metricBottom}>
          <span>Teacher Analytics &amp; Literasi</span>
          <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
