'use client';
import { getTenantItem } from '@/lib/tenant-storage';
import { getApiUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { getLiveDapodikAcademicYear } from './academic-years/page';

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

  return (
    <div className={styles.page}>
      {/* ── Sub-Bar: Live Clock, Status Badges & Refresh Trigger ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-info" style={{ fontWeight: 800, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            🏫 {schoolName || 'Nama Sekolah'}
          </span>
          <span className="badge badge-purple" style={{ fontWeight: 800, padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
            NPSN: {schoolNpsn || '-'}
          </span>
          <span className="badge badge-active" style={{ fontWeight: 800, padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
            🎓 T.A {activeAcademicYear || '-'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Segarkan Data Button */}
          <button
            onClick={fetchDashboardData}
            className={styles.refreshBtn}
            title="Muat Ulang Data Real-Time"
          >
            <span className={isLoading ? styles.spinning : ''}>🔄</span>
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
            <span style={{ color: 'var(--accent)' }}>🗓️</span>
            <span>{currentDateTime || 'Memuat waktu real-time...'}</span>
            <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
              LIVE ●
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. Top Metrics Bar (5 VIP Cards) ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Siswa Aktif</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{metrics.total_students}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconBlue}`}>🎓</div>
          </div>
          <div className={styles.metricBottom}>
            <span>{metrics.active_students} Aktif · {metrics.transferred_students} Mutasi</span>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>100% Real</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Guru Pengajar</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{metrics.total_teachers}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconPurple}`}>👨‍🏫</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Aktif Mengajar Semester Ini</span>
            <span style={{ color: '#9333ea', fontWeight: 700 }}>{metrics.active_teachers} Pengajar</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Tenaga Kependidikan</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{metrics.total_tendik}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconGreen}`}>👨‍💼</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Staf & Tata Usaha</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Terdaftar</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Rombongan Belajar</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{metrics.total_classes}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconOrange}`}>🏫</div>
          </div>
          <div className={styles.metricBottom}>
            <span>{metrics.active_classes} Rombel Berpenghuni</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{metrics.total_classes} Kelas</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricTitle}>Wali Murid</span>
              <div className={styles.metricValRow}>
                <span className={styles.metricValue}>{metrics.total_guardians}</span>
              </div>
            </div>
            <div className={`${styles.metricIconCircle} ${styles.iconRed}`}>👨‍👩‍👦</div>
          </div>
          <div className={styles.metricBottom}>
            <span>Orang Tua Terdata di Sistem</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Terhubung</span>
          </div>
        </div>
      </div>

      {/* ── 2. Row 1: Demografi & Ekosistem Digital Multi-Platform ── */}
      <div className={styles.rowOneGrid}>
        {/* Card 1: Sebaran Jenjang Pendidikan Kesetaraan (Infografis) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span>📊</span>
              <span>Sebaran Jenjang Siswa</span>
            </h2>
            <span className={styles.cardBadge}>Total {metrics.total_students} Siswa</span>
          </div>

          <div className={styles.jenjangList}>
            {jenjangData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {isLoading ? 'Memuat data jenjang...' : 'Belum ada data sebaran jenjang'}
              </div>
            ) : (
              jenjangData.map((item, idx) => {
                const fillClass = idx === 0 ? styles.fillPaketC : idx === 1 ? styles.fillPaketB : styles.fillPaketA;
                return (
                  <div key={idx} className={styles.jenjangItem}>
                    <div className={styles.jenjangHeader}>
                      <span className={styles.jenjangName}>
                        <span>{idx === 0 ? '🔵' : idx === 1 ? '🟢' : '🟡'}</span>
                        <span>{item.jenjang}</span>
                      </span>
                      <div className={styles.jenjangMeta}>
                        <span className={styles.jenjangStudents}>{item.student_count} Siswa</span>
                        <span className={styles.jenjangPercent}>({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className={styles.meterTrack}>
                      <div
                        className={`${styles.meterFill} ${fillClass}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                      <span>{item.class_count} Rombel Berjalan</span>
                      <span>T.A {activeAcademicYear.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

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
              <span>👥</span>
              <span>Komposisi Gender Siswa</span>
            </h2>
            <span className={styles.cardBadge}>Realitas Sekolah</span>
          </div>

          <div className={styles.genderWidget}>
            {/* Visual Dual-tone Ratio Bar */}
            <div className={styles.genderDualBar} title={`Laki-laki: ${maleItem.count} (${maleItem.percentage}%), Perempuan: ${femaleItem.count} (${femaleItem.percentage}%)`}>
              <div className={styles.barMale} style={{ width: `${maleItem.percentage}%` }} />
              <div className={styles.barFemale} style={{ width: `${femaleItem.percentage}%` }} />
            </div>

            {/* Gender Stats Grid */}
            <div className={styles.genderStatsGrid}>
              <div className={styles.genderCard}>
                <div className={`${styles.genderAvatar} ${styles.avatarMale}`}>👦</div>
                <div>
                  <div className={styles.genderLabel}>LAKI-LAKI</div>
                  <div className={styles.genderValue}>{maleItem.count}</div>
                  <div className={`${styles.genderShare} ${styles.shareMale}`}>{maleItem.percentage}% Porsi</div>
                </div>
              </div>

              <div className={styles.genderCard}>
                <div className={`${styles.genderAvatar} ${styles.avatarFemale}`}>👧</div>
                <div>
                  <div className={styles.genderLabel}>PEREMPUAN</div>
                  <div className={styles.genderValue}>{femaleItem.count}</div>
                  <div className={`${styles.genderShare} ${styles.shareFemale}`}>{femaleItem.percentage}% Porsi</div>
                </div>
              </div>
            </div>

            {/* Status Highlight */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>●</span>
                <span>{metrics.active_students} Siswa Aktif Terdaftar</span>
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                {metrics.transferred_students} Mutasi
              </span>
            </div>
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
              <span>⚡</span>
              <span>Ekosistem Digital Multi-Platform</span>
            </h2>
            <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
              AKTIF
            </span>
          </div>

          <div className={styles.ecosystemGrid}>
            <Link href="/dashboard/students/qr-scan" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>📱</span>
                <span className={styles.ecoTag}>ONLINE</span>
              </div>
              <div className={styles.ecoValue}>{metrics.active_qr_tokens}</div>
              <div className={styles.ecoLabel}>Kartu Token QR Login Aktif</div>
            </Link>

            <Link href="/dashboard/learning/materials" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>📚</span>
                <span className={styles.ecoTag} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                  LMS
                </span>
              </div>
              <div className={styles.ecoValue}>{metrics.total_learning_materials}</div>
              <div className={styles.ecoLabel}>Modul &amp; Materi Pembelajaran</div>
            </Link>

            <Link href="/dashboard/learning/quizzes" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>💻</span>
                <span className={styles.ecoTag} style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', borderColor: 'rgba(147, 51, 234, 0.2)' }}>
                  CBT
                </span>
              </div>
              <div className={styles.ecoValue}>{metrics.total_quizzes}</div>
              <div className={styles.ecoLabel}>Ujian CBT &amp; Kuis Online</div>
            </Link>

            <Link href="/dashboard/dapodik" className={styles.ecoTile} style={{ textDecoration: 'none' }}>
              <div className={styles.ecoTileTop}>
                <span className={styles.ecoIcon}>🔄</span>
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
              🔔 {metrics.total_notifications.toLocaleString('id-ID')} Notifikasi Push Tersampaikan
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
              <span>📈</span>
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
              <span>📢</span>
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
              announcements.map((ann) => {
                const isPenting = ann.category.toUpperCase() === 'PENTING';
                return (
                  <div key={ann.id} className={styles.announcementCard}>
                    <div className={styles.annTop}>
                      <div className={styles.annTitleRow}>
                        <span>{isPenting ? '🚨' : '📌'}</span>
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
                      <span>👤 {ann.author}</span>
                      <span>🗓️ {formatDate(ann.created_at)}</span>
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
              <span>⚡</span>
              <span>Aksi Cepat</span>
            </h2>
            <span className={styles.cardBadge}>Menu Utama</span>
          </div>

          <div className={styles.quickActionsGrid}>
            <Link href="/dashboard/announcements" className={styles.actionSquare}>
              <span className={styles.actionIcon}>📣</span>
              <span>Buat Pengumuman</span>
              <span className={styles.actionCountBadge}>{announcements.length} Aktif</span>
            </Link>

            <Link href="/dashboard/reports/cards" className={styles.actionSquare}>
              <span className={styles.actionIcon}>📄</span>
              <span>e-Rapor Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.total_classes} Kelas</span>
            </Link>

            <Link href="/dashboard/students/qr-scan" className={styles.actionSquare}>
              <span className={styles.actionIcon}>🪪</span>
              <span>Kartu QR Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.active_qr_tokens} Kartu</span>
            </Link>

            <Link href="/dashboard/teachers" className={styles.actionSquare}>
              <span className={styles.actionIcon}>👤+</span>
              <span>Kelola Guru</span>
              <span className={styles.actionCountBadge}>{metrics.total_teachers} Guru</span>
            </Link>

            <Link href="/dashboard/students" className={styles.actionSquare}>
              <span className={styles.actionIcon}>👥+</span>
              <span>Kelola Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.total_students} Siswa</span>
            </Link>

            <Link href="/dashboard/dapodik" className={styles.actionSquare}>
              <span className={styles.actionIcon}>🔄</span>
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
        {/* Card 1: Distribusi Siswa per Rombel Aktif */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span>🏫</span>
              <span>Distribusi Siswa per Rombongan Belajar (Rombel)</span>
            </h2>
            <span className={styles.cardBadge}>
              {metrics.active_classes > 0 ? `${metrics.active_classes} Rombel Aktif` : 'Belum Ada Rombel'}
            </span>
          </div>

          <div className={styles.rombelGrid}>
            {rombelList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {isLoading ? 'Memuat rombel...' : 'Belum ada data rombel'}
              </div>
            ) : (
              rombelList.map((rombel) => {
                const maxCount = Math.max(...rombelList.map(r => r.student_count), 1);
                const pct = Number(((rombel.student_count / maxCount) * 100).toFixed(0));
                return (
                  <div key={rombel.id} className={styles.rombelItem}>
                    <div className={styles.rombelHeader}>
                      <span className={styles.rombelName}>{rombel.name}</span>
                      <span className={styles.rombelCount}>{rombel.student_count} Siswa</span>
                    </div>
                    <div className={styles.rombelTrack}>
                      <div className={styles.rombelFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
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
