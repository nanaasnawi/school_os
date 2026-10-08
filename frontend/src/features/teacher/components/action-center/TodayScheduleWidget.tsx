'use client';

import React from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { TodayScheduleItem, ActiveCbtSummary, TeacherClassSummary } from '../../types';

interface TodayScheduleWidgetProps {
  classes: TeacherClassSummary[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  schedules: TodayScheduleItem[];
  activeCbts: ActiveCbtSummary[];
}

export function TodayScheduleWidget({
  classes,
  selectedClassId,
  onSelectClass,
  schedules,
  activeCbts,
}: TodayScheduleWidgetProps) {
  return (
    <div className={styles.todayScheduleColumn}>
      {/* ── Rombel Filter Selector ── */}
      <div className={`${styles.widgetCard} ${styles.classSelectCard}`}>
        <div className={styles.classSelectHeader}>
          <span className={styles.classSelectLabel}>
            Pilih Rombel / Kelas:
          </span>
          <span className={styles.classSelectCount}>
            {classes.length} Rombel Diampu
          </span>
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => onSelectClass(e.target.value)}
          className={styles.classSelectInput}
        >
          <option value="ALL">Semua Rombel Diampu</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.student_count} Siswa)
            </option>
          ))}
        </select>
      </div>

      {/* ── Today's Teaching Schedule & Quick Attendance ── */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Jadwal Mengajar Hari Ini</span>
          </h3>
          <Link href="/dashboard/attendance" className={styles.headerActionLink}>
            <span>Presensi</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {schedules.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateTitle}>Tidak Ada Sesi Mengajar</span>
            <span>Jadwal hari ini bebas dari sesi tatap muka langsung.</span>
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

      {/* ── Active CBT Sessions ── */}
      {activeCbts.length > 0 && (
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Kuis &amp; CBT Aktif</span>
            </h3>
            <Link href="/dashboard/learning/quizzes" className={styles.headerActionLink}>
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className={styles.scheduleList}>
            {activeCbts.map((cbt) => (
              <div key={cbt.quiz_id} className={styles.scheduleItem}>
                <div className={styles.scheduleDetail}>
                  <span className={styles.scheduleSubject}>{cbt.quiz_title}</span>
                  <span className={styles.scheduleRoom}>
                    {cbt.class_name} • {cbt.completed_count}/{cbt.total_participants} Siswa Selesai
                  </span>
                </div>
                <div>
                  <span className={`${styles.scheduleStatusBadge} ${styles.badgeLive}`}>
                    <span className={styles.liveDot} />
                    <span>Aktif</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
