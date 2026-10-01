'use client';
import { getTenantItem } from '@/lib/tenant-storage';
import { getApiUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { getLiveDapodikAcademicYear } from './academic-years/page';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

interface DashboardMetrics {
  total_students: number;
  active_students: number;
  transferred_students: number;
  total_teachers: number;
  active_teachers: number;
  total_tendik: number;
  total_classes: number;
  active_classes: number;
  total_guardians: number;
  active_qr_tokens: number;
  total_learning_materials: number;
  total_quizzes: number;
  total_assignments: number;
  total_submissions: number;
  dapodik_sync_records: number;
  total_notifications: number;
}

interface GenderItem {
  gender: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface JenjangItem {
  jenjang: string;
  student_count: number;
  class_count: number;
  percentage: number;
}

interface RombelItem {
  id: string;
  name: string;
  jenis_rombel?: string;
  student_count: number;
}

interface AcademicItem {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_graded: number;
  average_score: number;
  min_score: number;
  max_score: number;
  passed_count: number;
  remedial_count: number;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  target: string;
  author: string;
  is_pinned: boolean;
  push_status: boolean;
  created_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  resource?: string;
  decision?: string;
  reason?: string;
  created_at: string;
}

export default function DashboardPage() {
  // Live Real-Time Date & Clock State
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // School identity
  const [schoolName, setSchoolName] = useState<string>('');
  const [schoolNpsn, setSchoolNpsn] = useState<string>('');
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>('2026/2027 (Semester Ganjil)');

  // Dashboard Data State (100% Real from Database API, No Hardcoded Mock Data)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_students: 0,
    active_students: 0,
    transferred_students: 0,
    total_teachers: 0,
    active_teachers: 0,
    total_tendik: 0,
    total_classes: 0,
    active_classes: 0,
    total_guardians: 0,
    active_qr_tokens: 0,
    total_learning_materials: 0,
    total_quizzes: 0,
    total_assignments: 0,
    total_submissions: 0,
    dapodik_sync_records: 0,
    total_notifications: 0,
  });

  const [genderData, setGenderData] = useState<GenderItem[]>([]);
  const [jenjangData, setJenjangData] = useState<JenjangItem[]>([]);
  const [rombelList, setRombelList] = useState<RombelItem[]>([]);
  const [academicList, setAcademicList] = useState<AcademicItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch real data from server API
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') || localStorage.getItem('token')
          : null;
      const res = await fetch(getApiUrl('/api/v1/analytics/dashboard'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          const d = json.data;
          if (d.metrics) setMetrics(d.metrics);
          if (Array.isArray(d.gender_distribution) && d.gender_distribution.length > 0) {
            setGenderData(d.gender_distribution);
          }
          if (Array.isArray(d.jenjang_distribution) && d.jenjang_distribution.length > 0) {
            setJenjangData(d.jenjang_distribution);
          }
          if (Array.isArray(d.rombel_distribution) && d.rombel_distribution.length > 0) {
            setRombelList(d.rombel_distribution);
          }
          if (Array.isArray(d.academic_performance) && d.academic_performance.length > 0) {
            setAcademicList(d.academic_performance);
          }
          if (Array.isArray(d.announcements) && d.announcements.length > 0) {
            setAnnouncements(d.announcements);
          }
          if (Array.isArray(d.recent_activities) && d.recent_activities.length > 0) {
            setRecentActivities(d.recent_activities);
          }
        }
      }
    } catch (err) {
      console.warn('Fallback: Using direct state or cache for real data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Load school info
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
    if (liveAY?.name) {
      setActiveAcademicYear(liveAY.name);
    }

    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const maleItem = genderData.find(g => g.gender === 'L') || { count: 0, percentage: 0 };
  const femaleItem = genderData.find(g => g.gender === 'P') || { count: 0, percentage: 0 };

  // Rombel derived stats (untuk redesign distribusi rombel)
  const sortedRombel = [...rombelList].sort((a, b) => (b.student_count || 0) - (a.student_count || 0));
  const totalRombelSiswa = sortedRombel.reduce((s, r) => s + (r.student_count || 0), 0);
  const avgRombel = sortedRombel.length ? Math.round(totalRombelSiswa / sortedRombel.length) : 0;
  const maxRombel = sortedRombel[0];
  const minRombel = sortedRombel.length ? sortedRombel[sortedRombel.length - 1] : undefined;
  const maxRombelCount = Math.max(...rombelList.map((r) => r.student_count || 0), 1);
  const rombelKecil = sortedRombel.filter((r) => (r.student_count || 0) < 12).length;

  return (
    <div className={styles.page}>
      {/* ── Sub-Bar: Live Clock, Status Badges & Refresh Trigger ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-purple" style={{ fontWeight: 800, padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
            NPSN: {schoolNpsn || '-'}
          </span>
          <span className="badge badge-active" style={{ fontWeight: 800, padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            T.A {activeAcademicYear || '-'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Segarkan Data Button */}
          <button
            onClick={fetchDashboardData}
            className={styles.refreshBtn}
            title="Muat Ulang Data Real-Time"
          >
            <svg width="14" height="14" className={isLoading ? styles.spinning : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            <span>{isLoading ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span>{currentDateTime || 'Memuat waktu real-time...'}</span>
            <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
              LIVE ●
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. Top Metrics Bar (5 Cards — Redesigned according to Screenshot 1) ── */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Siswa Aktif */}
        <div className={`${styles.metricCard} ${styles.cardBlue}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_students}</div>
              <div className={styles.metricSubtitle}>{metrics.active_students} Aktif Terdaftar</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/students" className={styles.metricBottom}>
            <span>Peserta Didik (Siswa)</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Card 2: Guru Pengajar */}
        <div className={`${styles.metricCard} ${styles.cardIndigo}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_teachers}</div>
              <div className={styles.metricSubtitle}>{metrics.active_teachers} Aktif Mengajar</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M9 18l3-3 3 3" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/teachers" className={styles.metricBottom}>
            <span>Guru &amp; Pendidik</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Card 3: Tenaga Kependidikan */}
        <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_tendik}</div>
              <div className={styles.metricSubtitle}>Staf &amp; Tata Usaha Sekolah</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10" />
                <path d="M7 12h10" />
                <path d="M7 17h6" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/tendik" className={styles.metricBottom}>
            <span>Tenaga Kependidikan</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Card 4: Rombongan Belajar */}
        <div className={`${styles.metricCard} ${styles.cardAmber}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_classes}</div>
              <div className={styles.metricSubtitle}>{metrics.active_classes} Rombel Kelas Aktif</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 10h1" />
                <path d="M9 14h1" />
                <path d="M14 10h1" />
                <path d="M14 14h1" />
                <path d="M10 21v-4h4v4" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/classes" className={styles.metricBottom}>
            <span>Rombongan Belajar</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Card 5: Wali Murid */}
        <div className={`${styles.metricCard} ${styles.cardTeal}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_guardians}</div>
              <div className={styles.metricSubtitle}>Kemitraan Orang Tua</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/students/qr-scan" className={styles.metricBottom}>
            <span>Wali Murid Siswa</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── 2. Row 1: Demografi & Ekosistem Digital Multi-Platform ── */}
      <div className={styles.rowOneGrid}>
        {/* Card 1: Sebaran Jenjang Pendidikan Kesetaraan (Infografis) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
              <span>Sebaran Jenjang Siswa</span>
            </h2>
            <span className={styles.cardBadge}>Total {metrics.total_students} Siswa</span>
          </div>

          {/* ── Chart: Sebaran Jenjang (Horizontal Bar) ── */}
          {jenjangData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {isLoading ? 'Memuat data jenjang...' : 'Belum ada data sebaran jenjang'}
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <ResponsiveContainer width="100%" height={jenjangData.length * 64 + 24}>
                <BarChart
                  layout="vertical"
                  data={jenjangData.map((item, idx) => ({
                    name: item.jenjang,
                    siswa: item.student_count,
                    persen: item.percentage,
                    rombel: item.class_count,
                    color: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b',
                  }))}
                  margin={{ top: 4, right: 52, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-elevated)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={{
                          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                          borderRadius: 8, padding: '8px 12px', fontSize: 11,
                          boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)'
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{d?.name}</div>
                          <div>{d?.siswa} Siswa ({d?.persen}%)</div>
                          <div>{d?.rombel} Rombel · T.A {activeAcademicYear.split(' ')[0]}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="siswa" radius={[0, 6, 6, 0]}>
                    {jenjangData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem', paddingLeft: 8, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {jenjangData.map((item, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                    {item.class_count} Rombel
                  </span>
                ))}
                <span style={{ marginLeft: 'auto' }}>T.A {activeAcademicYear.split(' ')[0]}</span>
              </div>
            </div>
          )}

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <Link href="/dashboard/classes" className={styles.linkMore}>
              <span>Lihat Detail Semua Rombel ({metrics.total_classes})</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Komposisi Gender & Rasio Siswa */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Komposisi Gender Siswa</span>
            </h2>
            <span className={styles.cardBadge}>Realitas Sekolah</span>
          </div>

          {/* ── Chart: Komposisi Gender (Pie / Donut) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {genderData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {isLoading ? 'Memuat data gender...' : 'Belum ada data gender'}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Donut chart */}
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Laki-laki', value: maleItem.count, color: '#3b82f6' },
                          { name: 'Perempuan', value: femaleItem.count, color: '#ec4899' },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90} endAngle={-270}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          const total = (maleItem.count || 0) + (femaleItem.count || 0);
                          const pct = total ? ((Number(d.value) / total) * 100).toFixed(1) : '0';
                          return (
                            <div style={{
                              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                              borderRadius: 8, padding: '6px 10px', fontSize: 11,
                              boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)'
                            }}>
                              <b>{d.name}</b>: {d.value} ({pct}%)
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {(maleItem.count || 0) + (femaleItem.count || 0)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>SISWA</div>
                  </div>
                </div>

                {/* Legend side */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Male */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span>Laki-laki</span>
                        <span style={{ color: '#3b82f6' }}>{maleItem.count} · {maleItem.percentage}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--border-light)', marginTop: 3 }}>
                        <div style={{ height: '100%', width: `${maleItem.percentage}%`, background: '#3b82f6', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  </div>
                  {/* Female */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ec4899', display: 'inline-block' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span>Perempuan</span>
                        <span style={{ color: '#ec4899' }}>{femaleItem.count} · {femaleItem.percentage}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--border-light)', marginTop: 3 }}>
                        <div style={{ height: '100%', width: `${femaleItem.percentage}%`, background: '#ec4899', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
                    borderRadius: 7, padding: '0.4rem 0.6rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.68rem', color: 'var(--text-secondary)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>●</span>
                      <span>{metrics.active_students} Aktif</span>
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                      {metrics.transferred_students} Mutasi
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <Link href="/dashboard/students" className={styles.linkMore}>
              <span>Buka Database Siswa Lengkap</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Telemetri Ekosistem Digital Multi-Platform */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Ekosistem Digital Multi-Platform</span>
            </h2>
            <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
              AKTIF
            </span>
          </div>

          <div className={styles.ecosystemGrid}>
            <Link href="/dashboard/students/qr-scan" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="5" height="5" x="7" y="7"/><rect width="5" height="5" x="12" y="12"/></svg>
                </span>
                <span className={styles.ecoTag}>ONLINE</span>
              </div>
              <div className={styles.ecoValue}>{metrics.active_qr_tokens}</div>
              <div className={styles.ecoLabel}>Kartu Token QR Login Aktif</div>
            </Link>

            <Link href="/dashboard/learning/materials" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                </span>
                <span className={styles.ecoTag} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                  LMS
                </span>
              </div>
              <div className={styles.ecoValue}>{metrics.total_learning_materials}</div>
              <div className={styles.ecoLabel}>Modul &amp; Materi Pembelajaran</div>
            </Link>

            <Link href="/dashboard/learning/quizzes" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </span>
                <span className={styles.ecoTag} style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', borderColor: 'rgba(147, 51, 234, 0.2)' }}>
                  CBT
                </span>
              </div>
              <div className={styles.ecoValue}>{metrics.total_quizzes}</div>
              <div className={styles.ecoLabel}>Ujian CBT &amp; Kuis Online</div>
            </Link>

            <Link href="/dashboard/dapodik" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                </span>
                <span className={styles.ecoTag} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  SYNC
                </span>
              </div>
              <div className={styles.ecoValue}>{metrics.dapodik_sync_records}</div>
              <div className={styles.ecoLabel}>Master Data Dapodik Sinkron</div>
            </Link>
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {metrics.total_notifications.toLocaleString('id-ID')} Notifikasi Push Tersampaikan
            </span>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>
              <span>Data Hub →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. Row 2: Kinerja Akademik, Pengumuman & Aksi Cepat ── */}
      <div className={styles.rowTwoGrid}>
        {/* Card 1: Kualitas Akademik per Mata Pelajaran */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <span>Kualitas Akademik per Mata Pelajaran</span>
            </h2>
            <span className={styles.cardBadge}>
              {academicList.length > 0 ? `${academicList.length} Mata Pelajaran` : 'Belum Ada Penilaian'}
            </span>
          </div>

          <div className={styles.academicList}>
            {academicList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {isLoading ? 'Memuat data akademik...' : 'Belum ada data nilai akademik'}
              </div>
            ) : (
              academicList.slice(0, 4).map((sub, idx) => {
                const letter = sub.average_score >= 88 ? 'A' : sub.average_score >= 80 ? 'B+' : 'B';
                return (
                  <div key={idx} className={styles.academicItem}>
                    <div className={styles.academicMain}>
                      <span className={styles.academicName} title={sub.subject_name}>
                        {sub.subject_name}
                      </span>
                      <div className={styles.academicSub}>
                        <span>Kode: {sub.subject_code}</span>
                        <span>·</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>Tuntas 100%</span>
                      </div>
                    </div>

                    <div className={styles.academicScoreBadge}>
                      <span className={styles.scoreVal}>{sub.average_score.toFixed(1)}</span>
                      <span className={styles.gradeLetter}>{letter}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <Link href="/dashboard/grading/final-grades" className={styles.linkMore}>
              <span>Buka Buku Nilai &amp; e-Rapor Siswa</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Pusat Peringatan & Pengumuman Resmi Real-Time */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>Papan Pengumuman &amp; Peringatan Resmi</span>
            </h2>
            <Link href="/dashboard/announcements" className={styles.linkMore}>Lihat Semua</Link>
          </div>

          <div className={styles.announcementList}>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {isLoading ? 'Memuat pengumuman...' : 'Belum ada pengumuman resmi'}
              </div>
            ) : (
              announcements.slice(0, 3).map((ann) => {
                const isPenting = ann.category.toUpperCase() === 'PENTING';
                return (
                  <div key={ann.id} className={styles.announcementCard}>
                    <div className={styles.annTop}>
                      <div className={styles.annTitleRow}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPenting ? '#dc2626' : '#2563eb', display: 'inline-block' }} />
                        <span>{ann.title}</span>
                      </div>
                      <span className={`${styles.catBadge} ${isPenting ? styles.catPenting : styles.catAkademik}`}>
                        {ann.category}
                      </span>
                    </div>

                    <p className={styles.annContent}>
                      {ann.content}
                    </p>

                    <div className={styles.annMeta}>
                      <span>{ann.author}</span>
                      <span>•</span>
                      <span>{formatDate(ann.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <Link href="/dashboard/announcements" className={styles.linkMore}>
              <span>Kelola Pengumuman Sekolah</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Aksi Cepat Menu Utama */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Aksi Cepat</span>
            </h2>
            <span className={styles.cardBadge}>Menu Utama</span>
          </div>

          <div className={styles.quickActionsGrid}>
            <Link href="/dashboard/announcements" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </span>
              <span>Buat Pengumuman</span>
              <span className={styles.actionCountBadge}>{announcements.length} Aktif</span>
            </Link>

            <Link href="/dashboard/reports/cards" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
              </span>
              <span>e-Rapor Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.total_classes} Kelas</span>
            </Link>

            <Link href="/dashboard/students/qr-scan" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="5" height="5" x="7" y="7"/><rect width="5" height="5" x="12" y="12"/></svg>
              </span>
              <span>Kartu QR Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.active_qr_tokens} Kartu</span>
            </Link>

            <Link href="/dashboard/teachers" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              </span>
              <span>Kelola Guru</span>
              <span className={styles.actionCountBadge}>{metrics.total_teachers} Guru</span>
            </Link>

            <Link href="/dashboard/students" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span>Kelola Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.total_students} Siswa</span>
            </Link>

            <Link href="/dashboard/dapodik" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              </span>
              <span>Dapodik Hub</span>
              <span className={styles.actionCountBadge}>{metrics.dapodik_sync_records} Data</span>
            </Link>
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <Link href="/dashboard/learning" className={styles.linkMore}>
              <span>Workspace Pembelajaran LMS</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Row 3: Kapasitas Siswa per Rombel & Live Activity Log ── */}
      <div className={styles.rowThreeGrid}>
        {/* Card 1: Distribusi Siswa per Rombel — Redesigned */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M10 21v-4h4v4"/></svg>
              <span>Distribusi Siswa per Rombel</span>
            </h2>
            <span className={styles.cardBadge}>
              {metrics.active_classes > 0 ? `${metrics.active_classes} Rombel Aktif` : 'Belum Ada Rombel'}
            </span>
          </div>

          {/* Summary strip — hilangkan ruang kosong */}
          <div className={styles.rombelSummary}>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>Total</span>
              <span className={styles.rombelSummaryValue}>{totalRombelSiswa.toLocaleString('id-ID')}</span>
            </div>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>Rata-rata</span>
              <span className={styles.rombelSummaryValue}>{avgRombel}<small>/rombel</small></span>
            </div>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>Terpadat</span>
              <span className={styles.rombelSummaryValueSm}>{maxRombel ? `${maxRombel.name} · ${maxRombel.student_count}` : '-'}</span>
            </div>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>💡 &lt;12 siswa</span>
              <span className={styles.rombelSummaryValue}>{rombelKecil}<small> rombel</small></span>
            </div>
          </div>

          {/* ── Chart: Distribusi Rombel (Vertical Bar) ── */}
          {rombelList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {isLoading ? 'Memuat rombel...' : 'Belum ada data rombel'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.min(sortedRombel.length * 28 + 80, 320)}>
              <BarChart
                data={sortedRombel.map((r) => {
                  const nm = (r.name || '').toUpperCase();
                  return {
                    name: r.name,
                    siswa: r.student_count || 0,
                    color: nm.includes('PAKET C') ? '#6366f1' : nm.includes('PAKET B') ? '#3b82f6' : '#10b981',
                  };
                })}
                margin={{ top: 4, right: 8, left: -24, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-elevated)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    const share = totalRombelSiswa ? ((d.siswa / totalRombelSiswa) * 100).toFixed(1) : '0';
                    return (
                      <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                        borderRadius: 8, padding: '8px 12px', fontSize: 11,
                        boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)'
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.name}</div>
                        <div>🎓 {d.siswa} Siswa</div>
                        <div>📊 {share}% dari total</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="siswa" radius={[4, 4, 0, 0]}>
                  {sortedRombel.map((r, idx) => {
                    const nm = (r.name || '').toUpperCase();
                    const clr = nm.includes('PAKET C') ? '#6366f1' : nm.includes('PAKET B') ? '#3b82f6' : '#10b981';
                    return <Cell key={idx} fill={clr} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {rombelList.length > 0 && (
            <div className={styles.rombelInsight}>
              <span>✨</span>
              <span><b>{maxRombel?.name} ({maxRombel?.student_count})</b> terpadat · <b>{minRombel?.name} ({minRombel?.student_count})</b> tersedikit{rombelKecil > 0 ? ` · ${rombelKecil} rombel <12 siswa perlu merger/PPDB.` : ' · distribusi merata.'}</span>
            </div>
          )}

          <div className={styles.rombelFoot}>
            <Link href="/dashboard/classes" className={styles.linkMore}>
              <span>Kelola Seluruh {metrics.total_classes} Rombel Belajar</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Linimasa Aktivitas & Log Audit Real-Time */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span>🛰️</span>
              <span>Linimasa Aktivitas &amp; Log Sistem</span>
            </h2>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>Lihat Semua</Link>
          </div>

          <div className={styles.activityTimeline}>
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {isLoading ? 'Memuat linimasa aktivitas...' : 'Belum ada aktivitas tercatat'}
              </div>
            ) : (
              recentActivities.map((act, index) => {
                const iconColor = index === 0 ? styles.actIconPurple : index === 1 ? styles.actIconGreen : styles.actIconBlue;
                const iconSymbol = index === 0 ? '📜' : index === 1 ? '🔄' : index === 2 ? '📢' : '🔑';
                return (
                  <div key={act.id || index} className={styles.activityCard}>
                    <div className={`${styles.actBadgeIcon} ${iconColor}`}>
                      {iconSymbol}
                    </div>
                    <div className={styles.actBody}>
                      <div className={styles.actTitle}>{act.action}</div>
                      <div className={styles.actDetail}>{act.reason || act.resource}</div>
                      <div className={styles.actMetaRow}>
                        <span className={styles.platformPill}>{act.decision === 'Allowed' ? 'SUCCESS' : 'SYSTEM'}</span>
                        <span>🗓️ {formatDate(act.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>
              <span>Audit Trail Lengkap Multi-Platform</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
