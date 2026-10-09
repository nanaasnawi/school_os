'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import styles from './action-center.module.css';
import type { AtRiskStudent } from '../../types';

interface AtRiskStudentsWidgetProps {
  students: AtRiskStudent[];
  onResolve: (studentId: string) => void;
}

type ViewMode = 'CATEGORY' | 'CLASS';

export function AtRiskStudentsWidget({ students, onResolve }: AtRiskStudentsWidgetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('CATEGORY');
  const [batchSentMessage, setBatchSentMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Calculate statistical risk breakdown by category
  const categoryStats = useMemo(() => {
    let unread = 0;
    let lowScore = 0;
    let overdue = 0;

    for (const s of students) {
      if (s.category === 'UNREAD_MATERIAL') unread++;
      else if (s.category === 'LOW_SCORE') lowScore++;
      else if (s.category === 'OVERDUE_ASSIGNMENT') overdue++;
    }

    const total = students.length;
    return {
      total,
      unread,
      lowScore,
      overdue,
      unreadPct: total > 0 ? Math.round((unread / total) * 100) : 0,
      lowScorePct: total > 0 ? Math.round((lowScore / total) * 100) : 0,
      overduePct: total > 0 ? Math.round((overdue / total) * 100) : 0,
    };
  }, [students]);

  // 2. Data for Category BarChart
  const categoryChartData = useMemo(() => {
    return [
      {
        key: 'UNREAD_MATERIAL',
        name: 'Materi Tertinggal',
        count: categoryStats.unread,
        pct: categoryStats.unreadPct,
        fillId: 'url(#gradOrange)',
        color: '#f97316',
        desc: 'Siswa belum tuntas membaca modul literasi',
        actionHint: 'Butuh dorongan membaca modul',
      },
      {
        key: 'LOW_SCORE',
        name: 'Nilai < KKM',
        count: categoryStats.lowScore,
        pct: categoryStats.lowScorePct,
        fillId: 'url(#gradRed)',
        color: '#ef4444',
        desc: 'Skor tugas atau asesmen di bawah standar',
        actionHint: 'Siapkan tugas atau materi remedial',
      },
      {
        key: 'OVERDUE_ASSIGNMENT',
        name: 'Tugas Tertunda',
        count: categoryStats.overdue,
        pct: categoryStats.overduePct,
        fillId: 'url(#gradAmber)',
        color: '#f59e0b',
        desc: 'Siswa belum mengumpulkan tugas terjadwal',
        actionHint: 'Kirim notifikasi pengingat tenggat waktu',
      },
    ];
  }, [categoryStats]);

  // 3. Data for Class Distribution BarChart
  const classChartData = useMemo(() => {
    const classMap = new Map<string, { count: number; unread: number; lowScore: number; overdue: number }>();

    for (const s of students) {
      const cName = s.class_name || 'Rombel';
      const existing = classMap.get(cName) || { count: 0, unread: 0, lowScore: 0, overdue: 0 };
      existing.count++;
      if (s.category === 'UNREAD_MATERIAL') existing.unread++;
      else if (s.category === 'LOW_SCORE') existing.lowScore++;
      else if (s.category === 'OVERDUE_ASSIGNMENT') existing.overdue++;
      classMap.set(cName, existing);
    }

    const total = students.length;
    const colors = ['#0284c7', '#8b5cf6', '#059669', '#d97706'];

    return Array.from(classMap.entries()).map(([name, data], idx) => ({
      name,
      count: data.count,
      pct: total > 0 ? Math.round((data.count / total) * 100) : 0,
      fillId: `url(#gradClass_${idx % colors.length})`,
      color: colors[idx % colors.length],
      desc: `${data.unread} literasi, ${data.lowScore} remedial, ${data.overdue} tugas`,
      actionHint: 'Fokuskan intervensi pada rombel ini',
    }));
  }, [students]);

  const handleSendBatchReminder = () => {
    if (students.length === 0 || isSending) return;
    setIsSending(true);
    for (const s of students) {
      onResolve(s.student_id);
    }
    setBatchSentMessage(`Notifikasi pengingat berhasil dikirimkan ke ${students.length} siswa.`);
    setTimeout(() => {
      setBatchSentMessage(null);
      setIsSending(false);
    }, 4000);
  };

  const activeChartData = viewMode === 'CATEGORY' ? categoryChartData : classChartData;

  return (
    <div className={styles.widgetCard}>
      {/* ── Widget Header ── */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <div className={styles.riskIconPill}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className={styles.widgetTitle}>
              Siswa Perlu Perhatian
              <span className={students.length > 0 ? styles.badgeCount : styles.badgeCountNeutral}>
                {students.length}
              </span>
            </h3>
            <p className={styles.widgetSub}>
              Distribusi keterlambatan modul, tugas tertunda, atau nilai di bawah KKM.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/teacher/at-risk"
          className={styles.viewDetailLink}
          title="Buka daftar lengkap dan intervensi siswa berisiko"
        >
          <span>Detail Siswa ({students.length}) &rarr;</span>
        </Link>
      </div>

      {batchSentMessage && (
        <div className={styles.alertSuccessStrip}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{batchSentMessage}</span>
        </div>
      )}

      {students.length === 0 ? (
        <div className={styles.emptyRiskState}>
          <div className={styles.emptyRiskIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <span className={styles.emptyRiskTitle}>Seluruh Siswa di Jalur Aman!</span>
          <span className={styles.emptyRiskSubtitle}>
            Tidak ada siswa yang mengalami kendala belajar atau keterlambatan modul saat ini.
          </span>
        </div>
      ) : (
        <>
          {/* ── Executive KPI Summary Strip (Spacious & Non-cramped) ── */}
          <div className={styles.kpiStrip}>
            {/* KPI 1: Materi Tertinggal */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardAccent} style={{ background: '#f97316' }} />
              <div className={styles.kpiLabelRow}>
                <span className={styles.dotOrange} />
                <span className={styles.kpiTitle} title="Materi Tertinggal">Materi Tertinggal</span>
              </div>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{categoryStats.unread}</span>
                <span className={styles.kpiUnit}>siswa</span>
                <span className={styles.kpiPct} style={{ background: '#fff7ed', color: '#ea580c' }}>
                  {categoryStats.unreadPct}%
                </span>
              </div>
            </div>

            {/* KPI 2: Nilai < KKM */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardAccent} style={{ background: '#ef4444' }} />
              <div className={styles.kpiLabelRow}>
                <span className={styles.dotRed} />
                <span className={styles.kpiTitle} title="Nilai di bawah KKM">Nilai &lt; KKM</span>
              </div>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{categoryStats.lowScore}</span>
                <span className={styles.kpiUnit}>siswa</span>
                <span className={styles.kpiPct} style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {categoryStats.lowScorePct}%
                </span>
              </div>
            </div>

            {/* KPI 3: Tugas Tertunda */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardAccent} style={{ background: categoryStats.overdue > 0 ? '#f59e0b' : '#10b981' }} />
              <div className={styles.kpiLabelRow}>
                <span className={categoryStats.overdue > 0 ? styles.dotAmber : styles.dotGreen} />
                <span className={styles.kpiTitle} title="Tugas Tertunda">Tugas Tertunda</span>
              </div>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{categoryStats.overdue}</span>
                <span className={styles.kpiUnit}>siswa</span>
                <span
                  className={styles.kpiPct}
                  style={{
                    background: categoryStats.overdue > 0 ? '#fffbeb' : '#f0fdf4',
                    color: categoryStats.overdue > 0 ? '#b45309' : '#15803d',
                  }}
                >
                  {categoryStats.overdue > 0 ? `${categoryStats.overduePct}%` : 'Aman'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Chart Section ── */}
          <div className={styles.chartWidgetBody}>
            {/* Chart Header & View Mode Switcher */}
            <div className={styles.chartNavRow}>
              <span className={styles.chartSubtitleHint}>
                {viewMode === 'CATEGORY' ? 'Grafik Sebaran Kendala Belajar' : 'Distribusi Siswa Berisiko per Rombel'}
              </span>
              <div className={styles.chartToggleGroup}>
                <button
                  type="button"
                  onClick={() => setViewMode('CATEGORY')}
                  className={`${styles.chartToggleBtn} ${viewMode === 'CATEGORY' ? styles.chartToggleBtnActive : ''}`}
                >
                  Kategori
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CLASS')}
                  className={`${styles.chartToggleBtn} ${viewMode === 'CLASS' ? styles.chartToggleBtnActive : ''}`}
                >
                  Per Rombel
                </button>
              </div>
            </div>

            {/* Recharts Horizontal Analytics Chart */}
            <div className={styles.chartAreaBox}>
              {!isMounted ? (
                <div style={{ height: 140, background: 'var(--bg-hover, #f8fafc)', borderRadius: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    layout="vertical"
                    data={activeChartData}
                    margin={{ top: 6, right: 32, left: 4, bottom: 6 }}
                  >
                    <defs>
                      {/* Gradients for Categories */}
                      <linearGradient id="gradOrange" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                      <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="gradAmber" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>

                      {/* Gradients for Classes */}
                      <linearGradient id="gradClass_0" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="gradClass_1" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <linearGradient id="gradClass_2" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="gradClass_3" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" hide domain={[0, 'dataMax + 2']} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={125}
                      tick={{ fontSize: 11.5, fill: 'var(--text-secondary, #64748b)', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className={styles.chartTooltipCard}>
                            <div className={styles.chartTooltipTitle}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                              <span>{d.name}</span>
                              <span
                                className={styles.chartTooltipBadge}
                                style={{ background: `${d.color}15`, color: d.color }}
                              >
                                {d.pct}%
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                              {d.count} Siswa Berisiko
                            </div>
                            <div className={styles.chartTooltipMeta}>{d.desc}</div>
                            <div className={styles.chartTooltipHint}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              <span>{d.actionHint}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      barSize={18}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fillId} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Class Breakdown Chips Strip ── */}
          <div className={styles.classChipsStrip}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>Sebaran Rombel:</span>
            {classChartData.map((item) => (
              <span key={item.name} className={styles.classChipPill}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                <span>{item.name}</span>
                <strong style={{ color: item.color }}>{item.count}</strong>
              </span>
            ))}
          </div>

          {/* ── Quick Actions Footer ── */}
          <div className={styles.chartFooterRow}>
            <button
              onClick={handleSendBatchReminder}
              disabled={isSending}
              className={styles.batchQuickBtn}
              title="Kirimkan notifikasi pengingat serentak ke seluruh siswa berisiko"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>{isSending ? 'Mengirimkan...' : `Kirim Pengingat Serentak (${students.length})`}</span>
            </button>

            <Link href="/dashboard/teacher/at-risk" className={styles.openDetailBtn}>
              <span>Buka Detail &amp; Roster Lengkap &rarr;</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
