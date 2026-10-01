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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Rombel Filter Selector */}
      <div className={styles.widgetCard} style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Pilih Kelas / Rombel:</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{classes.length} Rombel Diampu</span>
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => onSelectClass(e.target.value)}
          className="entriesSelect"
          style={{ width: '100%', fontWeight: 600, padding: '0.6rem 0.85rem', borderRadius: '8px' }}
        >
          <option value="ALL">Semua Rombel Diampu</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.student_count} Siswa)
            </option>
          ))}
        </select>
      </div>

      {/* Today's Teaching Schedule */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Jadwal Mengajar Hari Ini</span>
          </h3>
        </div>

        {schedules.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: '1.75rem 1rem' }}>
            <span className={styles.emptyStateTitle}>Tidak Ada Sesi Mengajar</span>
            <span style={{ fontSize: '0.8rem' }}>Jadwal hari ini bebas dari sesi tatap muka langsung.</span>
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
                <div>
                  {s.is_current ? (
                    <span className={`${styles.scheduleStatusBadge} ${styles.badgeLive}`}>● Berlangsung</span>
                  ) : (
                    <span className={`${styles.scheduleStatusBadge} ${styles.badgeUpcoming}`}>Mendatang</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active CBT Sessions */}
      {activeCbts.length > 0 && (
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Kuis &amp; CBT Aktif</span>
            </h3>
            <Link href="/dashboard/learning/quizzes" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
              Lihat Semua
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
                    Aktif
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
