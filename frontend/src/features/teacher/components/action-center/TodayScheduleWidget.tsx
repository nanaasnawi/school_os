'use client';

import React from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { TodayScheduleItem } from '../../types';

interface TodayScheduleWidgetProps {
  schedules: TodayScheduleItem[];
}

export function TodayScheduleWidget({ schedules }: TodayScheduleWidgetProps) {
  return (
    <div className={styles.widgetCard}>
      {/* ── Widget Header ── */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <div className={styles.scheduleHeaderIconBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h3 className={styles.widgetTitle}>
              Jadwal Mengajar Hari Ini
              <span className={schedules.length > 0 ? styles.badgeCountNeutral : styles.badgeCountDim}>
                {schedules.length} Sesi
              </span>
            </h3>
            <p className={styles.widgetSub}>
              Sesi tatap muka terjadwal dan akses cepat presensi rombel.
            </p>
          </div>
        </div>

        <Link href="/dashboard/attendance" className={styles.headerActionLink}>
          <span>Lembar Presensi</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* ── Schedules List or Rich Informative State ── */}
      {schedules.length === 0 ? (
        <div className={styles.scheduleEmptyContainer}>
          <div className={styles.scheduleEmptyIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.scheduleEmptyContent}>
            <div className={styles.scheduleEmptyTitle}>Bebas Sesi Tatap Muka Hari Ini</div>
            <div className={styles.scheduleEmptySub}>
              Jadwal tatap muka langsung Anda hari ini kosong. Anda dapat menyusun bahan ajar, memeriksa tugas siswa, atau melakukan rekapitulasi kehadiran.
            </div>
          </div>
          <div className={styles.scheduleEmptyActions}>
            <Link href="/dashboard/attendance" className={styles.actionBtnSmall}>
              <span>Buka Lembar Presensi &rarr;</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.scheduleList}>
          {schedules.map((s) => (
            <div key={s.id} className={styles.scheduleItem}>
              <div className={styles.scheduleTimeBox}>
                <span className={styles.scheduleTime}>{s.start_time}</span>
                <span className={styles.scheduleTimeSub}>{s.end_time}</span>
              </div>
              <div className={styles.scheduleDetail}>
                <span className={styles.scheduleSubject}>{s.subject_name}</span>
                <span className={styles.scheduleRoom}>{s.class_name} • {s.room}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {s.is_current ? (
                  <span className={`${styles.scheduleStatusBadge} ${styles.badgeLive}`}>
                    <span className={styles.liveDot} />
                    <span>Berlangsung</span>
                  </span>
                ) : (
                  <span className={`${styles.scheduleStatusBadge} ${styles.badgeUpcoming}`}>Mendatang</span>
                )}
                <Link
                  href={`/dashboard/attendance?class_id=${s.class_id || ''}`}
                  className={styles.actionBtnSmall}
                  title="Buka Lembar Presensi Kelas Ini"
                >
                  Presensi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
