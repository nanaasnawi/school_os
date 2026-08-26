'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { listStudents, listClasses, listTeachers } from '@/lib/sdk/sdk.gen';
import { getLiveDapodikAcademicYear } from './academic-years/page';

export default function DashboardPage() {
  // Live Real-Time Date & Clock State
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  const [trendRange, setTrendRange] = useState('7 Hari Terakhir');
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);

  // Dynamic School Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeClassesCount, setActiveClassesCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [tendikCount, setTendikCount] = useState(0);
  const [guardiansCount, setGuardiansCount] = useState(0);
  const [activeAcademicYear, setActiveAcademicYear] = useState('2025/2026 (Semester Ganjil)');
  const [schoolName, setSchoolName] = useState('');
  const [schoolNpsn, setSchoolNpsn] = useState('P2962010');

  // Load dynamic school identity from Settings / Server
  useEffect(() => {
    const loadSchoolInfo = () => {
      if (typeof window !== 'undefined') {
        const storedName = getTenantItem('dapodik_nama_sekolah');
        const storedNpsn = getTenantItem('dapodik_npsn');
        if (storedName) setSchoolName(storedName);
        if (storedNpsn) setSchoolNpsn(storedNpsn);
      }
    };
    loadSchoolInfo();

    async function fetchProfile() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;
        const res = await fetch('/api/v1/schools/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            if (json.data.name) setSchoolName(json.data.name);
            if (json.data.npsn) setSchoolNpsn(json.data.npsn);
          }
        }
      } catch (err) {}
    }
    fetchProfile();

    if (typeof window !== 'undefined') {
      window.addEventListener('dapodik_settings_updated', loadSchoolInfo);
      window.addEventListener('storage', loadSchoolInfo);
      return () => {
        window.removeEventListener('dapodik_settings_updated', loadSchoolInfo);
        window.removeEventListener('storage', loadSchoolInfo);
      };
    }
  }, []);

  // Live Clock Ticker Effect
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateTime(`${dateStr} · ${timeStr} WIB`);
    };

    updateDateTime();
    const liveAY = getLiveDapodikAcademicYear();
    setActiveAcademicYear(liveAY.name);

    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

    useEffect(() => {
      async function loadSchoolMetrics() {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (!token) return;
          const res = await fetch('/api/v1/analytics/overview', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data) {
              setTotalStudents(json.data.total_students || 0);
              setActiveClassesCount(json.data.active_classes || json.data.total_classes || 0);
              setTeachersCount(json.data.total_teachers || 0);
              setTendikCount(json.data.total_tendik || 0);
              setGuardiansCount(json.data.total_guardians || 0);
            }
          }
        } catch (err) {
          console.error('Error loading dashboard analytics:', err);
        }
      }
      loadSchoolMetrics();
    }, []);

  const ranges = [
    '7 Hari Terakhir',
    '14 Hari Terakhir',
    '30 Hari Terakhir',
    'Bulan Ini',
    'Semester Ini',
  ];

  return (
    <div className={styles.page}>
      {/* Crisp Top Sub-Bar: Live Real-Time Clock, Active Academic Year & Institution Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-info" style={{ fontWeight: 800 }}>{schoolName}</span>
          <span className="badge badge-purple" style={{ fontWeight: 800 }}>NPSN: {schoolNpsn}</span>
          <span className="badge badge-active" style={{ fontWeight: 800 }}>
            🎓 T.A {activeAcademicYear}
          </span>
        </div>

        {/* Live Real-Time Clock Badge */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: '10px',
          padding: '0.4rem 0.85rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ color: 'var(--accent)' }}>🗓️</span>
          <span>{currentDateTime || 'Memuat waktu real-time...'}</span>
          <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
            LIVE ●
          </span>
        </div>
      </div>

      {/* ── 1. Top Metrics Bar (5 Target Cards with Data from API) ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Siswa Aktif</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{totalStudents}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconBlue}`}>🎓</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Dari total {totalStudents} terdaftar</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Guru Pengajar</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{teachersCount}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconPurple}`}>👨‍🏫</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Aktif di Semester Ini</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Tenaga Kependidikan</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{tendikCount}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconGreen}`}>👨‍💼</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Staf & Manajemen</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Rombongan Belajar</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{activeClassesCount}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconWarning || styles.iconOrange}`}>🏫</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Kelas Berjalan</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Wali Murid</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{guardiansCount}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconRed}`}>👨‍👩‍👦</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Orang Tua Terdaftar</span>
          </div>
        </div>
      </div>

      {/* ── 2. Row 2 Grid (Chart, Pusat Peringatan Real, Aksi Cepat) ── */}
      <div className={styles.rowTwoGrid}>
        {/* Card 1: Tren Kehadiran Line Area Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Tren Kehadiran Mobile App ({trendRange})</h2>

            <div style={{ position: 'relative' }}>
              <button
                className={styles.dateSelector}
                onClick={() => setShowTrendDropdown(!showTrendDropdown)}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem' }}
              >
                <span>{trendRange}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.6, transform: showTrendDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>˅</span>
              </button>

              {showTrendDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(15,23,42,0.12)',
                  zIndex: 100,
                  minWidth: '160px',
                  padding: '0.3rem'
                }}>
                  {ranges.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setTrendRange(r);
                        setShowTrendDropdown(false);
                      }}
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.78rem',
                        fontWeight: trendRange === r ? 800 : 600,
                        color: trendRange === r ? 'var(--accent-dark)' : 'var(--text-secondary)',
                        background: trendRange === r ? 'var(--accent-dim)' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{r}</span>
                      {trendRange === r && <span style={{ color: '#2563eb', fontWeight: 800 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.chartContainer} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
            <div className={styles.emptyState} style={{ flex: 1, border: 'none', background: 'transparent' }}>
              <div className={styles.emptyStateIcon}>📉</div>
              <span className={styles.emptyStateText}>Belum ada data kehadiran.</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pusat Peringatan Real PKBM AS-SALAFIYAH */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Pusat Peringatan &amp; Alert Real-Time</h2>
            <Link href="/dashboard/notifications" className={styles.linkMore}>Lihat Semua Notifikasi</Link>
          </div>

          <div className={styles.warningList} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className={styles.emptyState} style={{ flex: 1, border: 'none', background: 'transparent' }}>
              <div className={styles.emptyStateIcon}>🔔</div>
              <span className={styles.emptyStateText}>Tidak ada notifikasi/peringatan saat ini.</span>
            </div>
          </div>
        </div>

        {/* Card 3: Aksi Cepat */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Aksi Cepat Menu Utama</h2>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className={styles.quickActionsGrid}>
              <Link href="/dashboard/announcements" className={styles.actionSquare}>
                <span className={styles.actionIcon}>📣</span>
                <span>Buat Pengumuman</span>
              </Link>

              <Link href="/dashboard/reports/cards" className={styles.actionSquare}>
                <span className={styles.actionIcon}>📄</span>
                <span>Lihat e-Rapor</span>
              </Link>

              <Link href="/dashboard/reports/export" className={styles.actionSquare}>
                <span className={styles.actionIcon}>📥</span>
                <span>Ekspor Data Hub</span>
              </Link>

              <Link href="/dashboard/teachers" className={styles.actionSquare}>
                <span className={styles.actionIcon}>👤+</span>
                <span>Kelola Guru</span>
              </Link>

              <Link href="/dashboard/students" className={styles.actionSquare}>
                <span className={styles.actionIcon}>👥+</span>
                <span>Kelola Siswa</span>
              </Link>

              <Link href="/dashboard/dapodik" className={styles.actionSquare}>
                <span className={styles.actionIcon}>🔄</span>
                <span>Dapodik Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Row 3 Grid (Kualitas Akademik Real, Siswa Berisiko, Aktivitas Terbaru Multi-Platform) ── */}
      <div className={styles.rowThreeGrid}>
        {/* Card 1: Kualitas Akademik per Mata Pelajaran Real */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Kualitas Akademik per Mata Pelajaran (Real)</h2>
            <Link href="/dashboard/learning" className={styles.linkMore}>Lihat Semua</Link>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={styles.emptyState} style={{ flex: 1, border: 'none', margin: '0' }}>
              <div className={styles.emptyStateIcon}>📚</div>
              <span className={styles.emptyStateText}>Belum ada data mata pelajaran yang dinilai.</span>
            </div>
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-dim)', marginTop: 'auto' }}>
            <Link href="/dashboard/learning" className={styles.linkMore}>Lihat Workspace Pembelajaran →</Link>
          </div>
        </div>

        {/* Card 2: Siswa Berisiko per Tingkat Rombel Real */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Siswa Remedial per Tingkat Rombel</h2>
            <Link href="/dashboard/reports/analytics" className={styles.linkMore}>Lihat Detail</Link>
          </div>

          <div className={styles.donutWrapper} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.emptyState} style={{ flex: 1, border: 'none', background: 'transparent' }}>
              <div className={styles.emptyStateIcon}>📊</div>
              <span className={styles.emptyStateText}>Belum ada data remedial.</span>
            </div>
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-dim)', marginTop: 'auto' }}>
            <Link href="/dashboard/reports/analytics" className={styles.linkMore}>Lihat Daftar Siswa Remedial →</Link>
          </div>
        </div>

        {/* Card 3: Aktivitas Terbaru Multi-Platform Real */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Aktivitas Terbaru Multi-Platform</h2>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>Lihat Semua Log</Link>
          </div>

          <div className={styles.activityList} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={styles.emptyState} style={{ flex: 1, border: 'none', background: 'transparent' }}>
              <div className={styles.emptyStateIcon}>📡</div>
              <span className={styles.emptyStateText}>Belum ada aktivitas terekam.</span>
            </div>
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid transparent', marginTop: 'auto' }}>
             {/* Invisible footer to match the height alignment perfectly */}
            <span style={{ opacity: 0, fontSize: '0.75rem', fontWeight: 600 }}>&nbsp;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
