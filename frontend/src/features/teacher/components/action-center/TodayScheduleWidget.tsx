'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { TodayScheduleItem, WeeklyScheduleItem } from '../../types';
import { fetchWeeklySchedule } from '../../api/teacher-api';

interface TodayScheduleWidgetProps {
  schedules: TodayScheduleItem[];
}

export function TodayScheduleWidget({ schedules }: TodayScheduleWidgetProps) {
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleItem[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const handleOpenWeekly = async () => {
    setShowWeeklyModal(true);
    if (weeklySchedules.length === 0) {
      setLoadingWeekly(true);
      try {
        const data = await fetchWeeklySchedule();
        setWeeklySchedules(data);
      } catch (err) {
        console.error('Failed to load weekly schedule:', err);
      } finally {
        setLoadingWeekly(false);
      }
    }
  };

  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const groupedWeekly = dayOrder.reduce((acc, day) => {
    acc[day] = weeklySchedules.filter(
      (s) => s.day_of_week?.trim().toLowerCase() === day.toLowerCase()
    );
    return acc;
  }, {} as Record<string, WeeklyScheduleItem[]>);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleOpenWeekly}
            className={styles.headerActionLink}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#0284c7',
              fontWeight: 600,
            }}
          >
            <span>Jadwal Mingguan</span>
            <span>&rarr;</span>
          </button>
          <Link href="/dashboard/attendance" className={styles.headerActionLink}>
            <span>Presensi</span>
          </Link>
        </div>
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
              Tidak ada jadwal mengajar tatap muka untuk hari ini. Anda dapat memeriksa jadwal hari lain, menyusun modul belajar, atau melakukan evaluasi.
            </div>
          </div>
          <div className={styles.scheduleEmptyActions} style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleOpenWeekly}
              className={styles.actionBtnSmall}
              style={{ background: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Lihat Jadwal Mingguan (Senin–Sabtu) &rarr;
            </button>
            <Link href="/dashboard/attendance" className={styles.actionBtnSmall}>
              Lembar Presensi
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

      {/* ── Modal Jadwal Mengajar Mingguan (Senin–Sabtu) ── */}
      {showWeeklyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setShowWeeklyModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  📅 Jadwal Mengajar Mingguan (Senin – Sabtu)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Daftar agenda mengajar lengkap Anda berdasarkan plotting kurikulum sekolah.
                </p>
              </div>
              <button
                onClick={() => setShowWeeklyModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#475569',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {loadingWeekly ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Memuat jadwal mengajar...
                </div>
              ) : weeklySchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Belum Ada Jadwal Mengajar Terdaftar
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>
                    Hubungi bagian kurikulum atau administrator sekolah untuk pembagian jadwal mengajar.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {dayOrder.map((day) => {
                    const items = groupedWeekly[day] || [];
                    if (items.length === 0) return null;

                    return (
                      <div
                        key={day}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '0.6rem 1rem',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            color: '#0369a1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                        >
                          <span>{day.toUpperCase()}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                            {items.length} Sesi
                          </span>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {items.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0',
                                borderBottom: '1px dashed #f1f5f9',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {item.start_time} - {item.end_time}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                                    {item.subject_name}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                    {item.class_name} • {item.room || 'Ruang Kelas'}
                                  </div>
                                </div>
                              </div>
                              <Link
                                href={`/dashboard/attendance?class_id=${item.class_id}`}
                                className={styles.actionBtnSmall}
                                style={{ fontSize: '0.74rem' }}
                              >
                                Presensi
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f8fafc',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
              }}
            >
              <button
                onClick={() => setShowWeeklyModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
