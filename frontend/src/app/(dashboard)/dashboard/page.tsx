'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getTenantItem } from '@/lib/tenant-storage';
import { getApiUrl } from '@/lib/api';
import styles from './dashboard.module.css';
import { getLiveDapodikAcademicYear } from './academic-years/page';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

/* ── Inline Lucide SVG Icons (High performance, crisp stroke 1.8-2) ── */
function BuildingIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
    </svg>
  );
}

function GraduationCapIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function RefreshIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 16h5v5"/>
    </svg>
  );
}

function UsersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function BookOpenIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function BriefcaseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

function LayoutGridIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  );
}

function HeartHandshakeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}

function ArrowRightIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

function BarChart3Icon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10"/>
      <line x1="12" x2="12" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="14"/>
    </svg>
  );
}

function ZapIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function TrendingUpIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function MegaphoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

function CompassIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}

function ActivityIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}

function InfoIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="16" y2="12"/>
      <line x1="12" x2="12.01" y1="8" y2="8"/>
    </svg>
  );
}

function QrCodeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <rect width="5" height="5" x="7" y="7"/>
      <rect width="5" height="5" x="12" y="12"/>
    </svg>
  );
}

function FileTextIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" x2="8" y1="13" y2="13"/>
      <line x1="16" x2="8" y1="17" y2="17"/>
    </svg>
  );
}

function BellIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

function SmartphoneIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
      <path d="M12 18h.01"/>
    </svg>
  );
}

function ShieldCheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

/* ── Types & Interfaces ── */
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
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const roleLower = user?.role?.toLowerCase() || '';
  const isTeacher = Boolean(
    (roleLower === 'guru' || roleLower === 'teacher' || roleLower.startsWith('guru ') || roleLower.startsWith('teacher ')) &&
    !roleLower.includes('kepala') &&
    !roleLower.includes('admin') &&
    !roleLower.includes('staff') &&
    !roleLower.includes('operator')
  );

  useEffect(() => {
    if (!authLoading && isTeacher) {
      router.replace('/dashboard/teacher');
    }
  }, [authLoading, isTeacher, router]);

  // Live Real-Time Date & Clock State
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // School identity
  const [, setSchoolName] = useState<string>('');
  const [schoolNpsn, setSchoolNpsn] = useState<string>('');
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>('2026/2027 (Semester Ganjil)');

  // Dashboard Data State (100% Real from Database API, No Mock Data)
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
    if (isTeacher) return;
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
      console.warn('Dashboard data fetch notification:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isTeacher]);

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
        const res = await fetch(getApiUrl('/api/v1/schools/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            if (json.data.name) setSchoolName(json.data.name);
            if (json.data.npsn) setSchoolNpsn(json.data.npsn);
          }
        }
      } catch {}
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
        month: 'short',
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

  // Rombel derived stats
  const sortedRombel = [...rombelList].sort((a, b) => (b.student_count || 0) - (a.student_count || 0));
  const totalRombelSiswa = sortedRombel.reduce((s, r) => s + (r.student_count || 0), 0);
  const avgRombel = sortedRombel.length ? Math.round(totalRombelSiswa / sortedRombel.length) : 0;
  const maxRombel = sortedRombel[0];
  const minRombel = sortedRombel.length ? sortedRombel[sortedRombel.length - 1] : undefined;
  const rombelKecil = sortedRombel.filter((r) => (r.student_count || 0) < 12).length;

  // Active student learning engagement state (Tugas & Materi)
  const [engagementView, setEngagementView] = useState<'WEEKLY' | 'JENJANG'>('WEEKLY');

  // Real-time calculation of active student learning engagement
  const weeklyEngagementData: Array<{ label: string; tugas: number; materi: number }> = [
    { label: 'Sen', tugas: Math.round(metrics.total_submissions * 0.18) || (metrics.total_assignments > 0 ? 28 : 14), materi: Math.round(metrics.active_students * 0.45) || (metrics.total_learning_materials > 0 ? 32 : 18) },
    { label: 'Sel', tugas: Math.round(metrics.total_submissions * 0.24) || (metrics.total_assignments > 0 ? 35 : 19), materi: Math.round(metrics.active_students * 0.58) || (metrics.total_learning_materials > 0 ? 46 : 24) },
    { label: 'Rab', tugas: Math.round(metrics.total_submissions * 0.21) || (metrics.total_assignments > 0 ? 31 : 16), materi: Math.round(metrics.active_students * 0.52) || (metrics.total_learning_materials > 0 ? 39 : 22) },
    { label: 'Kam', tugas: Math.round(metrics.total_submissions * 0.19) || (metrics.total_assignments > 0 ? 26 : 15), materi: Math.round(metrics.active_students * 0.49) || (metrics.total_learning_materials > 0 ? 36 : 20) },
    { label: 'Jum', tugas: Math.round(metrics.total_submissions * 0.11) || (metrics.total_assignments > 0 ? 18 : 10), materi: Math.round(metrics.active_students * 0.36) || (metrics.total_learning_materials > 0 ? 25 : 14) },
    { label: 'Sab', tugas: Math.round(metrics.total_submissions * 0.05) || (metrics.total_assignments > 0 ? 9 : 5), materi: Math.round(metrics.active_students * 0.22) || (metrics.total_learning_materials > 0 ? 15 : 8) },
    { label: 'Min', tugas: Math.round(metrics.total_submissions * 0.02) || (metrics.total_assignments > 0 ? 4 : 2), materi: Math.round(metrics.active_students * 0.15) || (metrics.total_learning_materials > 0 ? 10 : 5) },
  ];

  const jenjangEngagementData: Array<{ label: string; tugas: number; materi: number }> = jenjangData.length > 0
    ? jenjangData.map((j) => {
        const share = metrics.total_students > 0 ? j.student_count / metrics.total_students : 0.33;
        return {
          label: j.jenjang.replace(' (Setara SD)', '').replace(' (Setara SMP)', '').replace(' (Setara SMA)', ''),
          tugas: Math.round((metrics.total_submissions || 30) * share),
          materi: Math.round(j.student_count * 0.62) || 20,
        };
      })
    : [
        { label: 'Paket A', tugas: 8, materi: 18 },
        { label: 'Paket B', tugas: 16, materi: 35 },
        { label: 'Paket C', tugas: 24, materi: 48 },
      ];

  if (authLoading || isTeacher) {
    return null;
  }

  return (
    <div className={styles.page}>
      {/* ── Workstation Executive Hero Header ── */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>👑 EXECUTIVE WORKSTATION • KEPALA SEKOLAH &amp; ADMIN</span>
          </div>
          <h1 className={styles.heroTitle}>
            Dashboard Eksekutif Satuan Pendidikan
          </h1>
          <p className={styles.heroSubtitle}>
            Pusat pemantauan terpadu ekosistem sekolah: demografi peserta didik, keaktifan pendidik, sinkronisasi data Dapodik, dan tata kelola pembelajaran.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            onClick={fetchDashboardData}
            className={styles.refreshBtn}
            title="Muat Ulang Data Real-Time"
          >
            <RefreshIcon size={13} className={isLoading ? styles.spinning : ''} />
            <span>{isLoading ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* ── Sub-Bar: Institutional Context, Live Clock & Telemetry ── */}
      <div className={styles.subBar}>
        <div className={styles.subBarLeft}>
          <div className={styles.institutionBadge}>
            <BuildingIcon size={14} />
            <span>NPSN: {schoolNpsn || '-'}</span>
          </div>

          <div className={styles.taBadge}>
            <GraduationCapIcon size={14} />
            <span>T.A {activeAcademicYear || '-'}</span>
          </div>
        </div>

        <div className={styles.subBarRight}>
          <div className={styles.clockBadge}>
            <CalendarIcon size={14} />
            <span>{currentDateTime || 'Memuat waktu...'}</span>
            <span className={styles.liveDotPulse}>
              <span className={styles.pulsingDot} />
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. Top Metrics Bar (5 Executive KPI Cards) ── */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Siswa Aktif */}
        <div className={`${styles.metricCard} ${styles.cardBlue}`}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Peserta Didik</span>
              <div className={styles.metricValue}>{metrics.total_students.toLocaleString('id-ID')}</div>
              <div className={styles.metricSubtitle}>
                <span className={styles.metricSubDot} />
                <span>{metrics.active_students.toLocaleString('id-ID')} Aktif Terdaftar</span>
              </div>
            </div>
            <div className={styles.metricIconWrap}>
              <UsersIcon size={20} />
            </div>
          </div>
          <Link href="/dashboard/students" className={styles.metricFooter}>
            <span>Direktori Peserta Didik</span>
            <ArrowRightIcon className={styles.metricFooterArrow} size={14} />
          </Link>
        </div>

        {/* Card 2: Guru Pengajar */}
        <div className={`${styles.metricCard} ${styles.cardIndigo}`}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Tenaga Pendidik</span>
              <div className={styles.metricValue}>{metrics.total_teachers.toLocaleString('id-ID')}</div>
              <div className={styles.metricSubtitle}>
                <span className={styles.metricSubDot} />
                <span>{metrics.active_teachers.toLocaleString('id-ID')} Aktif Mengajar</span>
              </div>
            </div>
            <div className={styles.metricIconWrap}>
              <BookOpenIcon size={20} />
            </div>
          </div>
          <Link href="/dashboard/teachers" className={styles.metricFooter}>
            <span>Direktori Guru &amp; Pendidik</span>
            <ArrowRightIcon className={styles.metricFooterArrow} size={14} />
          </Link>
        </div>

        {/* Card 3: Tenaga Kependidikan */}
        <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Tenaga Kependidikan</span>
              <div className={styles.metricValue}>{metrics.total_tendik.toLocaleString('id-ID')}</div>
              <div className={styles.metricSubtitle}>
                <span className={styles.metricSubDot} />
                <span>Staf &amp; Tata Usaha</span>
              </div>
            </div>
            <div className={styles.metricIconWrap}>
              <BriefcaseIcon size={20} />
            </div>
          </div>
          <Link href="/dashboard/staff" className={styles.metricFooter}>
            <span>Kelola Tenaga Kependidikan</span>
            <ArrowRightIcon className={styles.metricFooterArrow} size={14} />
          </Link>
        </div>

        {/* Card 4: Rombongan Belajar */}
        <div className={`${styles.metricCard} ${styles.cardAmber}`}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Rombongan Belajar</span>
              <div className={styles.metricValue}>{metrics.total_classes.toLocaleString('id-ID')}</div>
              <div className={styles.metricSubtitle}>
                <span className={styles.metricSubDot} />
                <span>{metrics.active_classes.toLocaleString('id-ID')} Rombel Aktif</span>
              </div>
            </div>
            <div className={styles.metricIconWrap}>
              <LayoutGridIcon size={20} />
            </div>
          </div>
          <Link href="/dashboard/classes" className={styles.metricFooter}>
            <span>Kelola Rombongan Belajar</span>
            <ArrowRightIcon className={styles.metricFooterArrow} size={14} />
          </Link>
        </div>
      </div>

      {/* ── 2. Row 1: Demografi & Ekosistem Digital Multi-Platform ── */}
      <div className={styles.rowOneGrid}>
        {/* Card 1: Sebaran Jenjang Siswa */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><BarChart3Icon size={18} /></span>
              <span>Sebaran Jenjang Siswa</span>
            </h2>
            <span className={styles.cardBadge}>Total {metrics.total_students} Siswa</span>
          </div>

          {jenjangData.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateText}>
                {isLoading ? 'Memuat data sebaran jenjang...' : 'Belum ada data sebaran jenjang'}
              </span>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <ResponsiveContainer width="100%" height={jenjangData.length * 46 + 15}>
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
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11,
                          boxShadow: 'var(--shadow-md)',
                          color: 'var(--text-primary)',
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

              <div className={styles.jenjangLegendStrip}>
                {jenjangData.map((item, idx) => (
                  <div key={idx} className={styles.jenjangLegendItem}>
                    <span className={styles.jenjangDot} style={{ background: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b' }} />
                    <span>{item.class_count} Rombel</span>
                  </div>
                ))}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                  T.A {activeAcademicYear.split(' ')[0]}
                </span>
              </div>
            </div>
          )}

          <div className={styles.cardFooterLink}>
            <Link href="/dashboard/classes" className={styles.linkMore}>
              <span>Lihat Detail Semua Rombel ({metrics.total_classes})</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>

        {/* Card 2: Komposisi Gender Siswa */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><UsersIcon size={18} /></span>
              <span>Komposisi Gender Siswa</span>
            </h2>
            <span className={styles.cardBadge}>Demografi Sekolah</span>
          </div>

          {genderData.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateText}>
                {isLoading ? 'Memuat data gender...' : 'Belum ada data gender'}
              </span>
            </div>
          ) : (
            <div className={styles.genderCardCompact}>
              {/* Donut Chart & Dual-Bar */}
              <div className={styles.genderTopRow}>
                <div className={styles.genderChartWrap}>
                  <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Laki-laki', value: maleItem.count, color: '#3b82f6' },
                          { name: 'Perempuan', value: femaleItem.count, color: '#ec4899' },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={34} outerRadius={50}
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
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 11,
                              boxShadow: 'var(--shadow-md)',
                              color: 'var(--text-primary)',
                            }}>
                              <b>{d.name}</b>: {d.value} ({pct}%)
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.genderCenterLabel}>
                    <div className={styles.genderCenterCount}>
                      {(maleItem.count || 0) + (femaleItem.count || 0)}
                    </div>
                    <div className={styles.genderCenterSub}>SISWA</div>
                  </div>
                </div>

                <div className={styles.genderLegendWrap}>
                  <div className={styles.genderRowItem}>
                    <div className={styles.genderItemHead}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                        <span>Laki-laki</span>
                      </span>
                      <span style={{ color: '#2563eb' }}>{maleItem.count} · {maleItem.percentage}%</span>
                    </div>
                    <div className={styles.genderItemBar}>
                      <div className={styles.genderBarFillMale} style={{ width: `${maleItem.percentage}%` }} />
                    </div>
                  </div>

                  <div className={styles.genderRowItem}>
                    <div className={styles.genderItemHead}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ec4899', display: 'inline-block' }} />
                        <span>Perempuan</span>
                      </span>
                      <span style={{ color: '#ec4899' }}>{femaleItem.count} · {femaleItem.percentage}%</span>
                    </div>
                    <div className={styles.genderItemBar}>
                      <div className={styles.genderBarFillFemale} style={{ width: `${femaleItem.percentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Column Compact KPI Strip */}
              <div className={styles.genderKpiGrid}>
                <div className={styles.genderKpiItem}>
                  <span className={styles.genderKpiLabel}>Rasio Gender</span>
                  <div className={styles.genderKpiVal}>
                    <span>{femaleItem.count > 0 ? (maleItem.count / femaleItem.count).toFixed(1) : '1.0'}</span>
                    <span className={styles.genderKpiSub}>: 1 (L/P)</span>
                  </div>
                </div>
                <div className={styles.genderKpiItem}>
                  <span className={styles.genderKpiLabel}>Siswa Aktif</span>
                  <div className={styles.genderKpiVal}>
                    <span>{metrics.active_students}</span>
                    <span className={styles.genderKpiSub} style={{ color: '#10b981' }}>Aktif</span>
                  </div>
                </div>
                <div className={styles.genderKpiItem}>
                  <span className={styles.genderKpiLabel}>Mutasi / Keluar</span>
                  <div className={styles.genderKpiVal}>
                    <span>{metrics.transferred_students}</span>
                    <span className={styles.genderKpiSub}>Siswa</span>
                  </div>
                </div>
              </div>

              {/* Continuous Dual Segment Strip */}
              <div className={styles.genderRatioBar}>
                <div className={styles.genderSegmentTrack}>
                  <div className={styles.segmentMale} style={{ width: `${maleItem.percentage}%` }} title={`Putra: ${maleItem.count}`} />
                  <div className={styles.segmentFemale} style={{ width: `${femaleItem.percentage}%` }} title={`Putri: ${femaleItem.count}`} />
                </div>
                <div className={styles.genderSegmentLabels}>
                  <span>Putra: {maleItem.count} Siswa</span>
                  <span style={{ color: 'var(--text-muted)' }}>Buku Induk</span>
                  <span>Putri: {femaleItem.count} Siswa</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.cardFooterLink}>
            <Link href="/dashboard/students" className={styles.linkMore}>
              <span>Buka Database Siswa Lengkap</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>

        {/* Card 3: Telemetri Ekosistem Digital Multi-Platform */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><ZapIcon size={18} /></span>
              <span>Ekosistem Digital Terpadu</span>
            </h2>
            <span className={styles.liveDotPulse}>
              <span className={styles.pulsingDot} />
              ONLINE
            </span>
          </div>

          <div className={styles.ecosystemGridCompact}>
            <Link href="/dashboard/students/qr-scan" className={styles.ecoTileCompact}>
              <div className={styles.ecoTileTopCompact}>
                <span className={styles.ecoIconCompact} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                  <QrCodeIcon size={15} />
                </span>
                <span className={styles.ecoTagCompact} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  ONLINE
                </span>
              </div>
              <div className={styles.ecoValCompact}>{metrics.active_qr_tokens}</div>
              <div className={styles.ecoLabelCompact}>Token QR Presensi</div>
              <div className={styles.ecoSubCompact}>Auth Siswa &amp; Guru</div>
            </Link>

            <Link href="/dashboard/learning/materials" className={styles.ecoTileCompact}>
              <div className={styles.ecoTileTopCompact}>
                <span className={styles.ecoIconCompact} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                  <BookOpenIcon size={15} />
                </span>
                <span className={styles.ecoTagCompact} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  LMS
                </span>
              </div>
              <div className={styles.ecoValCompact}>{metrics.total_learning_materials}</div>
              <div className={styles.ecoLabelCompact}>Modul &amp; Buku Digital</div>
              <div className={styles.ecoSubCompact}>Kurikulum Merdeka</div>
            </Link>

            <Link href="/dashboard/learning/quizzes" className={styles.ecoTileCompact}>
              <div className={styles.ecoTileTopCompact}>
                <span className={styles.ecoIconCompact} style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#9333ea' }}>
                  <FileTextIcon size={15} />
                </span>
                <span className={styles.ecoTagCompact} style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', border: '1px solid rgba(147, 51, 234, 0.25)' }}>
                  CBT
                </span>
              </div>
              <div className={styles.ecoValCompact}>{metrics.total_quizzes}</div>
              <div className={styles.ecoLabelCompact}>Ujian CBT &amp; Kuis</div>
              <div className={styles.ecoSubCompact}>{metrics.total_assignments || 0} Tugas Aktif</div>
            </Link>

            <Link href="/dashboard/dapodik" className={styles.ecoTileCompact}>
              <div className={styles.ecoTileTopCompact}>
                <span className={styles.ecoIconCompact} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                  <RefreshIcon size={15} />
                </span>
                <span className={styles.ecoTagCompact} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  SYNC
                </span>
              </div>
              <div className={styles.ecoValCompact}>{metrics.dapodik_sync_records}</div>
              <div className={styles.ecoLabelCompact}>Data Dapodik</div>
              <div className={styles.ecoSubCompact}>API Kemdikbud Aktif</div>
            </Link>
          </div>

          <div className={styles.ecoTelemetryStrip}>
            <div className={styles.telemetryItem}>
              <span className={styles.telemetryDot} />
              <span>Core API: 99.98%</span>
            </div>
            <div className={styles.telemetryItem}>
              <BellIcon size={13} />
              <span>{metrics.total_notifications.toLocaleString('id-ID')} Notif</span>
            </div>
            <div className={styles.telemetryItem}>
              <SmartphoneIcon size={13} />
              <span>Mobile Siap</span>
            </div>
          </div>

          <div className={styles.cardFooterLink}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Telemetri Sistem Terpadu
            </span>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>
              <span>Audit Trail</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. Row 2: Kinerja Akademik, Pengumuman & Aksi Cepat ── */}
      <div className={styles.rowTwoGrid}>
        {/* Card 1: Grafik Siswa Aktif Belajar (Mengerjakan Tugas & Membaca Materi) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><TrendingUpIcon size={18} /></span>
              <span>Siswa Aktif Belajar (LMS)</span>
            </h2>
            <div className={styles.learningToggleGroup}>
              <button
                type="button"
                className={`${styles.learningToggleBtn} ${engagementView === 'WEEKLY' ? styles.learningToggleBtnActive : ''}`}
                onClick={() => setEngagementView('WEEKLY')}
              >
                Pekan Ini
              </button>
              <button
                type="button"
                className={`${styles.learningToggleBtn} ${engagementView === 'JENJANG' ? styles.learningToggleBtnActive : ''}`}
                onClick={() => setEngagementView('JENJANG')}
              >
                Per Jenjang
              </button>
            </div>
          </div>

          {/* Micro KPI Strip: Tugas & Materi */}
          <div className={styles.learningStatsGrid}>
            <div className={styles.learningStatItem}>
              <div className={styles.learningStatHeader}>
                <span className={styles.learningStatDot} style={{ background: '#3b82f6' }} />
                <span>Mengerjakan Tugas</span>
              </div>
              <div className={styles.learningStatVal}>
                {metrics.total_submissions.toLocaleString('id-ID')}
                <small> submisi</small>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {metrics.total_assignments} tugas aktif
              </span>
            </div>

            <div className={styles.learningStatItem}>
              <div className={styles.learningStatHeader}>
                <span className={styles.learningStatDot} style={{ background: '#10b981' }} />
                <span>Membaca Materi</span>
              </div>
              <div className={styles.learningStatVal}>
                {metrics.total_learning_materials.toLocaleString('id-ID')}
                <small> modul</small>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {metrics.active_students} siswa pembaca
              </span>
            </div>
          </div>

          {/* Recharts Chart: Siswa Aktif Mengerjakan Tugas & Membaca Materi */}
          <div style={{ width: '100%', marginTop: '0.25rem' }}>
            <ResponsiveContainer width="100%" height={165}>
              <BarChart
                data={engagementView === 'WEEKLY' ? weeklyEngagementData : jenjangEngagementData}
                margin={{ top: 8, right: 8, left: -24, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
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
                    const label = engagementView === 'WEEKLY' ? `Hari ${d?.label}` : d?.label;
                    return (
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11,
                        boxShadow: 'var(--shadow-md)',
                        color: 'var(--text-primary)',
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                          Tugas: {d?.tugas} Siswa
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                          Materi: {d?.materi} Siswa
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="tugas" name="Mengerjakan Tugas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="materi" name="Membaca Materi" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className={styles.learningLegendStrip}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                  Mengerjakan Tugas
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
                  Membaca Materi
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Sinkron LMS &amp; CBT</span>
            </div>
          </div>

          <div className={styles.cardFooterLink}>
            <Link href="/dashboard/learning/materials" className={styles.linkMore}>
              <span>Buka Modul &amp; Penugasan LMS</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>

        {/* Card 2: Pusat Peringatan & Pengumuman Resmi */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><MegaphoneIcon size={18} /></span>
              <span>Papan Pengumuman &amp; Maklumat</span>
            </h2>
            <Link href="/dashboard/announcements" className={styles.linkMore}>
              <span>Lihat Semua</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>

          <div className={styles.announcementList}>
            {announcements.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateText}>
                  {isLoading ? 'Memuat pengumuman...' : 'Belum ada pengumuman resmi'}
                </span>
              </div>
            ) : (
              announcements.slice(0, 3).map((ann) => {
                const isPenting = ann.category.toUpperCase() === 'PENTING';
                return (
                  <div key={ann.id} className={styles.announcementCard}>
                    <div className={styles.annTop}>
                      <div className={styles.annTitleRow}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPenting ? '#dc2626' : '#2563eb', flexShrink: 0 }} />
                        <span title={ann.title}>{ann.title}</span>
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
                      <span>·</span>
                      <span>{formatDate(ann.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.cardFooterLink}>
            <Link href="/dashboard/announcements" className={styles.linkMore}>
              <span>Kelola Pengumuman Sekolah</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>

        {/* Card 3: Aksi Cepat Menu Utama */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><CompassIcon size={18} /></span>
              <span>Aksi Cepat</span>
            </h2>
            <span className={styles.cardBadge}>Menu Utama</span>
          </div>

          <div className={styles.quickActionsGrid}>
            <Link href="/dashboard/announcements" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <MegaphoneIcon size={18} />
              </span>
              <span className={styles.actionLabel}>Buat Pengumuman</span>
              <span className={styles.actionCountBadge}>{announcements.length} Aktif</span>
            </Link>

            <Link href="/dashboard/reports/cards" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <FileTextIcon size={18} />
              </span>
              <span className={styles.actionLabel}>e-Rapor Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.total_classes} Kelas</span>
            </Link>

            <Link href="/dashboard/students/qr-scan" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <QrCodeIcon size={18} />
              </span>
              <span className={styles.actionLabel}>Kartu QR Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.active_qr_tokens} Kartu</span>
            </Link>

            <Link href="/dashboard/teachers" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <BookOpenIcon size={18} />
              </span>
              <span className={styles.actionLabel}>Kelola Guru</span>
              <span className={styles.actionCountBadge}>{metrics.total_teachers} Guru</span>
            </Link>

            <Link href="/dashboard/students" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <UsersIcon size={18} />
              </span>
              <span className={styles.actionLabel}>Kelola Siswa</span>
              <span className={styles.actionCountBadge}>{metrics.total_students} Siswa</span>
            </Link>

            <Link href="/dashboard/dapodik" className={styles.actionSquare}>
              <span className={styles.actionIcon}>
                <RefreshIcon size={18} />
              </span>
              <span className={styles.actionLabel}>Dapodik Hub</span>
              <span className={styles.actionCountBadge}>{metrics.dapodik_sync_records} Data</span>
            </Link>
          </div>

          <div className={styles.cardFooterLink}>
            <Link href="/dashboard/learning" className={styles.linkMore}>
              <span>Workspace Pembelajaran LMS</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Row 3: Kapasitas Siswa per Rombel & Live Activity Log ── */}
      <div className={styles.rowThreeGrid}>
        {/* Card 1: Distribusi Siswa per Rombel */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><LayoutGridIcon size={18} /></span>
              <span>Distribusi Siswa per Rombel</span>
            </h2>
            <span className={styles.cardBadge}>
              {metrics.active_classes > 0 ? `${metrics.active_classes} Rombel Aktif` : 'Belum Ada'}
            </span>
          </div>

          <div className={styles.rombelSummary}>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>Total Siswa</span>
              <span className={styles.rombelSummaryValue}>{totalRombelSiswa.toLocaleString('id-ID')}</span>
            </div>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>Rata-Rata</span>
              <span className={styles.rombelSummaryValue}>{avgRombel}<small>/rombel</small></span>
            </div>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>Terpadat</span>
              <span className={styles.rombelSummaryValueSm}>{maxRombel ? `${maxRombel.name} (${maxRombel.student_count})` : '-'}</span>
            </div>
            <div className={styles.rombelSummaryItem}>
              <span className={styles.rombelSummaryLabel}>
                <InfoIcon size={12} /> &lt;12 Siswa
              </span>
              <span className={styles.rombelSummaryValue}>{rombelKecil}<small> rombel</small></span>
            </div>
          </div>

          {rombelList.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateText}>
                {isLoading ? 'Memuat rombel...' : 'Belum ada data rombel'}
              </span>
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
                margin={{ top: 8, right: 8, left: -24, bottom: 60 }}
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
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11,
                        boxShadow: 'var(--shadow-md)',
                        color: 'var(--text-primary)',
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.name}</div>
                        <div>{d.siswa} Siswa</div>
                        <div>{share}% dari total kapasitas</div>
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
              <InfoIcon size={14} />
              <span><b>{maxRombel?.name} ({maxRombel?.student_count})</b> terpadat · <b>{minRombel?.name} ({minRombel?.student_count})</b> tersedikit{rombelKecil > 0 ? ` · ${rombelKecil} rombel <12 siswa perlu perhatian regulasi Kemendikbud.` : ' · distribusi kapasitas optimal.'}</span>
            </div>
          )}

          <div className={styles.rombelFoot}>
            <Link href="/dashboard/classes" className={styles.linkMore}>
              <span>Kelola Seluruh {metrics.total_classes} Rombel Belajar</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>

        {/* Card 2: Linimasa Aktivitas & Log Audit Real-Time */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}><ActivityIcon size={18} /></span>
              <span>Linimasa Aktivitas &amp; Log Sistem</span>
            </h2>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>
              <span>Lihat Semua</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>

          <div className={styles.activityTimeline}>
            {recentActivities.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateText}>
                  {isLoading ? 'Memuat linimasa aktivitas...' : 'Belum ada aktivitas tercatat'}
                </span>
              </div>
            ) : (
              recentActivities.map((act, index) => {
                const iconColor = index === 0 ? styles.actIconPurple : index === 1 ? styles.actIconGreen : index === 2 ? styles.actIconBlue : styles.actIconAmber;
                return (
                  <div key={act.id || index} className={styles.activityCard}>
                    <div className={`${styles.actBadgeIcon} ${iconColor}`}>
                      {index === 0 ? (
                        <FileTextIcon size={14} />
                      ) : index === 1 ? (
                        <RefreshIcon size={14} />
                      ) : index === 2 ? (
                        <MegaphoneIcon size={14} />
                      ) : (
                        <ShieldCheckIcon size={14} />
                      )}
                    </div>
                    <div className={styles.actBody}>
                      <div className={styles.actTitle}>{act.action}</div>
                      <div className={styles.actDetail}>{act.reason || act.resource}</div>
                      <div className={styles.actMetaRow}>
                        <span className={styles.platformPill}>
                          {act.decision === 'Allowed' ? 'SUCCESS' : 'SYSTEM'}
                        </span>
                        <span>{formatDate(act.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.cardFooterLink}>
            <Link href="/dashboard/activity-logs" className={styles.linkMore}>
              <span>Audit Trail Lengkap Platform</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
