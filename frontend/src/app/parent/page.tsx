'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './parent.module.css';

const CHILD = {
  name: 'Ahmad Fauzi',
  nisn: '0081234567',
  class: 'Kelas 10-A IPA',
  year: '2025/2026',
  photo: '🎓',
  avg: 89,
  attendance: '94.2%',
  rank: 3,
  totalStudents: 28,
};

const RECENT_SCORES = [
  { subject: 'Kimia Organik', type: 'Ulangan Harian', score: 92, date: '01 Agu 2025', grade: 'A' },
  { subject: 'Matematika Dasar', type: 'Tugas Bab 3', score: 85, date: '30 Jul 2025', grade: 'B' },
  { subject: 'Fisika Kuantum', type: 'Quiz Harian', score: 78, date: '28 Jul 2025', grade: 'C' },
  { subject: 'Bahasa Indonesia', type: 'Esai Sastra', score: 94, date: '25 Jul 2025', grade: 'A' },
];

const UPCOMING_EVENTS = [
  { type: 'exam', label: 'Ulangan Harian Kimia — Bab 4', date: '10 Agu 2025', time: '08:00 WIB', urgent: true },
  { type: 'assignment', label: 'Pengumpulan Tugas Matematika', date: '12 Agu 2025', time: '23:59 WIB', urgent: false },
  { type: 'event', label: 'Rapat Ortu & Guru (Pertemuan Semester)', date: '15 Agu 2025', time: '09:00 WIB', urgent: false },
  { type: 'exam', label: 'UTS Semester Ganjil 2025/2026', date: '02 Sep 2025', time: '07:30 WIB', urgent: false },
];

const WEEKLY_ATTENDANCE = [
  { day: 'Senin', date: '04 Agu', status: 'present', label: 'Hadir (07:15)' },
  { day: 'Selasa', date: '05 Agu', status: 'present', label: 'Hadir (07:10)' },
  { day: 'Rabu', date: '06 Agu', status: 'present', label: 'Hadir (07:18)' },
  { day: 'Kamis', date: '07 Agu', status: 'late', label: 'Terlambat (07:35)' },
  { day: 'Jumat', date: '08 Agu', status: 'present', label: 'Hadir (07:12)' },
];

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = { A: styles.gradeA, B: styles.gradeB, C: styles.gradeC, D: styles.gradeD };
  return <span className={`${styles.gradeBadge} ${colors[grade] ?? ''}`}>{grade}</span>;
}

function ParentPortalContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') as 'overview' | 'scores' | 'attendance' | 'upcoming' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'attendance' | 'upcoming'>('overview');

  useEffect(() => {
    if (urlTab && ['overview', 'scores', 'attendance', 'upcoming'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  return (
    <div className={styles.page}>
      {/* ── Parent Awareness Hero Header ── */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.childAvatar}>{CHILD.photo}</div>
          <div className={styles.childInfo}>
            <div className={styles.badgeLine}>
              <span className={styles.statusChip}>● Student Active</span>
            </div>
            <h1 className={styles.childName}>{CHILD.name}</h1>
            <p className={styles.childMeta}>{CHILD.class} · TA {CHILD.year}</p>
            <p className={styles.childNisn}>NISN: {CHILD.nisn}</p>
          </div>
        </div>

        <div className={styles.heroStats}>
          {[
            { label: 'Rata-rata Nilai', value: `${CHILD.avg}`, unit: '/100', icon: '📊' },
            { label: 'Kehadiran Total', value: CHILD.attendance, unit: '', icon: '📅' },
            { label: 'Peringkat Kelas', value: `#${CHILD.rank}`, unit: `dari ${CHILD.totalStudents}`, icon: '🏆' },
          ].map(s => (
            <div key={s.label} className={styles.heroStat}>
              <div className={styles.heroStatIcon}>{s.icon}</div>
              <div className={styles.heroStatValue}>
                {s.value} {s.unit && <span className={styles.heroStatUnit}>{s.unit}</span>}
              </div>
              <div className={styles.heroStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Internal Tab Navigation ── */}
      <div className={styles.navBar}>
        {(['overview', 'scores', 'attendance', 'upcoming'] as const).map(s => (
          <button
            key={s}
            className={`${styles.navBtn} ${activeTab === s ? styles.navBtnActive : ''}`}
            onClick={() => setActiveTab(s)}
          >
            {{ overview: '🏠 Ringkasan', scores: '📊 Nilai & Progres', attendance: '📅 Kehadiran', upcoming: '🔔 Agenda' }[s]}
          </button>
        ))}
      </div>

      {/* ── Tab Content: Ringkasan (Overview) ── */}
      {activeTab === 'overview' && (
        <div className={styles.section}>
          {/* Weekly Attendance Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Kehadiran Minggu Ini</h2>
            <div className={styles.weekRow}>
              {WEEKLY_ATTENDANCE.map(d => (
                <div key={d.day} className={styles.daySlot}>
                  <div className={`${styles.dayDot} ${styles[`dot_${d.status}`]}`} />
                  <span className={styles.dayLabel}>{d.day}</span>
                  <span className={styles.dayDate}>{d.date}</span>
                </div>
              ))}
            </div>
            <div className={styles.legendRow}>
              <span className={`${styles.legendDot} ${styles.dot_present}`} /> Hadir
              <span className={`${styles.legendDot} ${styles.dot_late}`} /> Terlambat
              <span className={`${styles.legendDot} ${styles.dot_absent}`} /> Absen
            </div>
          </div>

          {/* Latest Scores Preview */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Nilai Terakhir Diterima</h2>
              <button className={styles.viewMoreBtn} onClick={() => setActiveTab('scores')}>
                Lihat Semua →
              </button>
            </div>
            <div className={styles.scoreList}>
              {RECENT_SCORES.slice(0, 3).map((r, i) => (
                <div key={i} className={styles.scoreRow}>
                  <div className={styles.scoreLeft}>
                    <span className={styles.scoreSubject}>{r.subject}</span>
                    <span className={styles.scoreType}>{r.type} · {r.date}</span>
                  </div>
                  <div className={styles.scoreRight}>
                    <span className={styles.scoreNum}>{r.score}</span>
                    <GradeBadge grade={r.grade} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Event Alert */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Agenda Sekolah Terdekat</h2>
              <button className={styles.viewMoreBtn} onClick={() => setActiveTab('upcoming')}>
                Jadwal Lengkap →
              </button>
            </div>
            <div className={styles.agendaList}>
              {UPCOMING_EVENTS.slice(0, 2).map((u, i) => (
                <div key={i} className={`${styles.agendaItem} ${u.urgent ? styles.agendaUrgent : ''}`}>
                  <span className={styles.agendaIcon}>{{ exam: '📝', assignment: '📋', event: '🗓️' }[u.type]}</span>
                  <div className={styles.agendaInfo}>
                    <div className={styles.agendaLabel}>{u.label}</div>
                    <div className={styles.agendaDate}>{u.date} · {u.time}</div>
                  </div>
                  {u.urgent && <span className={styles.urgentBadge}>Segera</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Nilai (Scores) ── */}
      {activeTab === 'scores' && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Riwayat Nilai Semester Ini</h2>
            <div className={styles.scoreList}>
              {RECENT_SCORES.map((r, i) => (
                <div key={i} className={styles.scoreRow}>
                  <div className={styles.scoreLeft}>
                    <span className={styles.scoreSubject}>{r.subject}</span>
                    <span className={styles.scoreType}>{r.type} · {r.date}</span>
                  </div>
                  <div className={styles.scoreRight}>
                    <span className={styles.scoreNum}>{r.score}</span>
                    <GradeBadge grade={r.grade} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Kehadiran (Attendance) ── */}
      {activeTab === 'attendance' && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Rekapitulasi Kehadiran Siswa</h2>
            <div className={styles.weekRow}>
              {WEEKLY_ATTENDANCE.map(d => (
                <div key={d.day} className={styles.daySlot}>
                  <div className={`${styles.dayDot} ${styles[`dot_${d.status}`]}`} />
                  <span className={styles.dayLabel}>{d.day}</span>
                  <span className={styles.dayStatus}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.attendanceSummaryGrid}>
            <div className={styles.attendStatCard}>
              <span className={styles.attendNumGreen}>18 Hari</span>
              <span className={styles.attendLabelText}>Hadir Tepat Waktu</span>
            </div>
            <div className={styles.attendStatCard}>
              <span className={styles.attendNumAmber}>2 Hari</span>
              <span className={styles.attendLabelText}>Terlambat</span>
            </div>
            <div className={styles.attendStatCard}>
              <span className={styles.attendNumRose}>0 Hari</span>
              <span className={styles.attendLabelText}>Tanpa Keterangan (Alpha)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Agenda (Upcoming) ── */}
      {activeTab === 'upcoming' && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Agenda & Kalender Akademik</h2>
            <div className={styles.agendaList}>
              {UPCOMING_EVENTS.map((u, i) => (
                <div key={i} className={`${styles.agendaItem} ${u.urgent ? styles.agendaUrgent : ''}`}>
                  <span className={styles.agendaIcon}>{{ exam: '📝', assignment: '📋', event: '🗓️' }[u.type]}</span>
                  <div className={styles.agendaInfo}>
                    <div className={styles.agendaLabel}>{u.label}</div>
                    <div className={styles.agendaDate}>{u.date} · {u.time}</div>
                  </div>
                  {u.urgent && <span className={styles.urgentBadge}>Segera</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ParentPortalPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading Parent Portal...</div>}>
      <ParentPortalContent />
    </Suspense>
  );
}
