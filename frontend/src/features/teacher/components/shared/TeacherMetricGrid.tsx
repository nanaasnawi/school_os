'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './shared.module.css';
import type { TeacherWorkstationStats } from '../../types';

interface TeacherMetricGridProps {
  stats: TeacherWorkstationStats;
}

export function TeacherMetricGrid({ stats }: TeacherMetricGridProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const readingPct = Math.min(100, Math.max(0, stats.average_class_reading_progress));

  const cards = [
    {
      id: 'students',
      color: '#0284c7',
      colorLight: '#e0f2fe',
      colorDim: 'rgba(2,132,199,0.08)',
      gradient: 'linear-gradient(135deg,#38bdf8 0%,#0284c7 100%)',
      value: stats.total_students.toString(),
      label: 'Siswa Aktif Terdaftar',
      subLabel: `${stats.total_assigned_classes} rombel diampu`,
      href: '/dashboard/teacher/classes',
      cta: 'Peserta Didik (Kelas Saya)',
      status: 'normal',
      statusLabel: 'Aktif',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      extra: null,
    },
    {
      id: 'grading',
      color: stats.pending_essay_submissions > 0 ? '#ea580c' : '#059669',
      colorLight: stats.pending_essay_submissions > 0 ? '#fff7ed' : '#ecfdf5',
      colorDim: stats.pending_essay_submissions > 0 ? 'rgba(234,88,12,0.08)' : 'rgba(5,150,105,0.08)',
      gradient: stats.pending_essay_submissions > 0
        ? 'linear-gradient(135deg,#fb923c 0%,#ea580c 100%)'
        : 'linear-gradient(135deg,#34d399 0%,#059669 100%)',
      value: stats.pending_essay_submissions.toString(),
      label: 'Menunggu Penilaian Esai',
      subLabel: stats.pending_essay_submissions > 0 ? 'Perlu segera dikoreksi' : 'Semua sudah dinilai',
      href: '/dashboard/teacher/grading',
      cta: 'Koreksi Massal Siswa',
      status: stats.pending_essay_submissions > 5 ? 'urgent' : stats.pending_essay_submissions > 0 ? 'warn' : 'good',
      statusLabel: stats.pending_essay_submissions > 0 ? `${stats.pending_essay_submissions} berkas` : 'Lunas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      extra: null,
    },
    {
      id: 'quiz',
      color: '#059669',
      colorLight: '#ecfdf5',
      colorDim: 'rgba(5,150,105,0.08)',
      gradient: 'linear-gradient(135deg,#34d399 0%,#059669 100%)',
      value: stats.active_quizzes_count.toString(),
      label: 'Kuis Berjalan Aktif',
      subLabel: stats.active_quizzes_count > 0 ? 'Sesi CBT sedang berlangsung' : 'Tidak ada sesi aktif',
      href: '/dashboard/learning/quizzes',
      cta: 'Kuis & Asesmen CBT',
      status: stats.active_quizzes_count > 0 ? 'live' : 'normal',
      statusLabel: stats.active_quizzes_count > 0 ? 'Live' : 'Standby',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      extra: null,
    },
    {
      id: 'reading',
      color: '#7c3aed',
      colorLight: '#ede9fe',
      colorDim: 'rgba(124,58,237,0.08)',
      gradient: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)',
      value: `${readingPct}%`,
      label: 'Rata-rata Keterbacaan Modul',
      subLabel: readingPct >= 75 ? 'Progres literasi sangat baik' : readingPct >= 50 ? 'Perlu peningkatan literasi' : 'Literasi perlu perhatian',
      href: '/dashboard/teacher/analytics',
      cta: 'Teacher Analytics & Literasi',
      status: readingPct >= 75 ? 'good' : readingPct >= 40 ? 'warn' : 'urgent',
      statusLabel: readingPct >= 75 ? 'Sangat Baik' : readingPct >= 40 ? 'Cukup' : 'Rendah',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      extra: readingPct,
    },
  ];

  return (
    <div className={styles.metricGrid}>
      {cards.map((card) => (
        <div
          key={card.id}
          className={styles.metricCard}
          style={{ '--card-color': card.color, '--card-dim': card.colorDim } as React.CSSProperties}
        >
          {/* ── Top: Icon pill + Status badge ── */}
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconPill} style={{ background: card.colorLight, color: card.color }}>
              {card.icon}
            </div>
            <span
              className={styles.metricStatusBadge}
              data-status={card.status}
            >
              {card.status === 'live' && mounted && (
                <span className={styles.livePulse} />
              )}
              {card.statusLabel}
            </span>
          </div>

          {/* ── Middle: Value + Label ── */}
          <div className={styles.metricBody}>
            <div className={styles.metricValue} style={{ color: card.color }}>
              {card.value}
            </div>
            <div className={styles.metricLabel}>{card.label}</div>
            <div className={styles.metricSubLabel}>{card.subLabel}</div>

            {/* Reading progress bar for the last card */}
            {card.id === 'reading' && typeof card.extra === 'number' && (
              <div className={styles.metricProgressTrack}>
                <div
                  className={styles.metricProgressFill}
                  style={{
                    width: mounted ? `${card.extra}%` : '0%',
                    background: card.gradient,
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Bottom CTA bar ── */}
          <Link
            href={card.href}
            className={styles.metricCta}
          >
            <span>{card.cta}</span>
            <svg className={styles.metricCtaArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      ))}
    </div>
  );
}
