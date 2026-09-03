'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './layout.module.css';

/* ── Icon Component ── */
function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="2" y="2" width="7" height="7" rx="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" />
      </svg>
    ),
    years: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="2" y="3.5" width="16" height="14" rx="2" />
        <path d="M14 2v3M6 2v3M2 8.5h16" />
      </svg>
    ),
    classes: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M2 3.5h6a3 3 0 013 3V17a2 2 0 00-2-2H2z" />
        <path d="M18 3.5h-6a3 3 0 00-3 3V17a2 2 0 012-2h7z" />
      </svg>
    ),
    students: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M13 16v-1a3 3 0 00-3-3H5a3 3 0 00-3 3v1" />
        <circle cx="7.5" cy="6" r="3" />
        <path d="M14.5 10a2.5 2.5 0 010 5" />
        <path d="M13 4a2.5 2.5 0 010 5" />
      </svg>
    ),
    teachers: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="10" cy="6" r="3.5" />
        <path d="M4 17.5c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" />
      </svg>
    ),
    learning: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M3 4.5h14M3 9.5h14M3 14.5h10" />
      </svg>
    ),
    assignments: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M6 2a2 2 0 00-2 2v13a2 2 0 002 2h8a2 2 0 002-2V7.5L12 2H6z" />
        <path d="M12 2v5.5H16" />
        <path d="M8 12h4M8 15h2" />
      </svg>
    ),
    assessments: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="2" y="3.5" width="16" height="13" rx="2" />
        <path d="M6 9h8M6 12.5h5" />
      </svg>
    ),
    analytics: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <polyline points="2,14 7,9 11,12 18,5" />
        <path d="M15 5h3v3" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3 17a7 7 0 0114 0" />
      </svg>
    ),
    guardians: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M10 2l6 3v5c0 4-3 6.5-6 7.5-3-1-6-3.5-6-7.5V5l6-3z" />
      </svg>
    ),
    staff: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="2" y="5" width="16" height="12" rx="2" />
        <path d="M13 17V3a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 007 3v14" />
      </svg>
    ),
    qr: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="12" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="12" width="5" height="5" rx="1" />
        <path d="M12 12h2v2h-2zM15 15h2v2h-2zM12 15h2v2h-2zM15 12h2v2h-2z" />
      </svg>
    ),
    dapodik: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M4 4h12v12H4z" />
        <path d="M8 4v12M12 4v12M4 8h12M4 12h12" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
      </svg>
    ),
    log: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M4 6h12M4 10h8M4 14h6" />
        <rect x="2" y="2" width="16" height="16" rx="2" />
      </svg>
    ),
    bell: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M10 2.5a6 6 0 016 6v3l1.5 2H2.5L4 11.5v-3a6 6 0 016-6z" />
        <path d="M8 15.5a2 2 0 004 0" />
      </svg>
    ),
    announcement: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M17 7L3 5v9l14-2V7z" />
        <path d="M3 10H1M7 14l1 3" />
      </svg>
    ),
    materials: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M4 2v16h12V6l-4-4H4z" />
        <path d="M12 2v4h4" />
      </svg>
    ),
    enrollments: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M14 4h2a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <path d="M9 2h2a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2v0a2 2 0 012-2z" />
        <circle cx="10" cy="11" r="2" />
        <path d="M6 16v-1a4 4 0 018 0v1" />
      </svg>
    ),
    quizzes: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="10" cy="10" r="8" />
        <path d="M9 7c0-1 2-1 2 0s-2 1.5-2 2.5" />
        <circle cx="10" cy="14" r="1" fill="currentColor" strokeWidth="0" />
      </svg>
    ),
    gradebook: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M4 3h12a2 2 0 012 2v12H2V5a2 2 0 012-2z" />
        <path d="M10 3v14" />
      </svg>
    ),
    final_grades: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="10" cy="8" r="5" />
        <path d="M6.5 11.5L4 18l6-3 6 3-2.5-6.5" />
      </svg>
    ),
    report_cards: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <circle cx="13" cy="7" r="2" />
        <path d="M4 16l4-4 3 3 5-5" />
      </svg>
    ),
    export_data: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M16 14v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
        <path d="M10 3v10M6 9l4 4 4-4" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

/* ── Menu Categories ── */
const NAV_SECTIONS = [
  {
    label: '',
    items: [
      { label: 'Beranda', path: '/dashboard', icon: 'dashboard' },
    ],
  },
  {
    label: 'Akademik',
    items: [
      { label: 'Tahun Ajaran', path: '/dashboard/academic-years', icon: 'years' },
      { label: 'Kelas', path: '/dashboard/classes', icon: 'classes' },
      { label: 'Siswa', path: '/dashboard/students', icon: 'students' },
      { label: 'Kartu QR Login', path: '/dashboard/students/qr-scan', icon: 'qr' },
      { label: 'Guru', path: '/dashboard/teachers', icon: 'teachers' },

      { label: 'Tenaga Kependidikan', path: '/dashboard/staff', icon: 'staff' },
      { label: 'Mata Pelajaran', path: '/dashboard/learning', icon: 'learning' },
    ],
  },
  {
    label: 'Pembelajaran',
    items: [
      { label: 'Materi', path: '/dashboard/learning/materials', icon: 'materials' },
      { label: 'Pembelajaran', path: '/dashboard/enrollments', icon: 'enrollments' },
      { label: 'Tugas', path: '/dashboard/learning/assignments', icon: 'assignments' },
      { label: 'Kuis & CBT', path: '/dashboard/learning/quizzes', icon: 'quizzes' },
    ],
  },
  {
    label: 'Penilaian',
    items: [
      { label: 'Buku Nilai', path: '/dashboard/grading/gradebook', icon: 'gradebook' },
      { label: 'Nilai Akhir', path: '/dashboard/grading/final-grades', icon: 'final_grades' },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { label: 'Rapor', path: '/dashboard/reports/cards', icon: 'report_cards' },
      { label: 'Analitik', path: '/dashboard/reports/analytics', icon: 'analytics' },
      { label: 'Ekspor', path: '/dashboard/reports/export', icon: 'export_data' },
    ],
  },
  {
    label: 'Komunikasi',
    items: [
      { label: 'Pengumuman', path: '/dashboard/announcements', icon: 'announcement' },
      { label: 'Orang Tua', path: '/dashboard/guardians', icon: 'guardians' },
      { label: 'Notifikasi', path: '/dashboard/notifications', icon: 'bell' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Dapodik Hub', path: '/dashboard/dapodik', icon: 'dapodik' },
      { label: 'Pengguna', path: '/dashboard/users', icon: 'users' },
      { label: 'Pengaturan', path: '/dashboard/settings', icon: 'settings' },
      { label: 'Log Aktivitas', path: '/dashboard/activity-logs', icon: 'log' },
    ],
  },
];

/* ── Theme Toggle Icons ── */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(4);
  const [isDark, setIsDark] = useState(false);
  const [showFab, setShowFab] = useState(false);

  const NOTIF_ITEMS = [
    {
      id: '1',
      icon: '🔄',
      bg: 'rgba(14, 165, 233, 0.12)',
      text: 'Sinkronisasi 124 data siswa Dapodik Kemendikbud berhasil diperbarui.',
      time: '5 menit lalu',
      link: '/dashboard/dapodik'
    },
    {
      id: '2',
      icon: '📱',
      bg: 'rgba(22, 163, 74, 0.12)',
      text: '18 Siswa Paket B7 telah melakukan presensi via Scan QR Mobile.',
      time: '25 menit lalu',
      link: '/dashboard/students/qr-scan'
    },
    {
      id: '3',
      icon: '📝',
      bg: 'rgba(124, 58, 237, 0.12)',
      text: 'Kuis CBT Bahasa Indonesia Paket B7 sedang berlangsung (94% hadir).',
      time: '1 jam lalu',
      link: '/dashboard/learning/quizzes'
    },
    {
      id: '4',
      icon: '⚠️',
      bg: 'rgba(220, 38, 38, 0.12)',
      text: '3 Siswa Paket C11 membutuhkan jadwal remedial Matematika.',
      time: '2 jam lalu',
      link: '/dashboard/reports/analytics'
    }
  ];

  /* ── Theme persistence ── */
  useEffect(() => {
    const saved = localStorage.getItem('school_os_theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('school_os_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('school_os_theme', 'light');
    }
  };

  /* ── School profile ── */
  useEffect(() => {
    const loadSchool = () => {
      if (typeof window !== 'undefined') {
        const storedName = getTenantItem('dapodik_nama_sekolah');
        const storedLogo = getTenantItem('school_logo_url');
        if (storedName) {
          setSelectedSchool(storedName);
        }
        if (storedLogo) {
          setSchoolLogoUrl(storedLogo);
        } else {
          setSchoolLogoUrl('');
        }
      }
    };
    loadSchool();

    async function fetchProfile() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            if (json.data.name) {
              setSelectedSchool(json.data.name);
              setTenantItem('dapodik_nama_sekolah', json.data.name);
            }
            if (json.data.logo_url) {
              setSchoolLogoUrl(json.data.logo_url);
              setTenantItem('school_logo_url', json.data.logo_url);
            } else {
              setSchoolLogoUrl('');
              removeTenantItem('school_logo_url');
            }
          }
        }
      } catch (err) {}
    }
    fetchProfile();
    if (typeof window !== 'undefined') {
      window.addEventListener('dapodik_settings_updated', loadSchool);
      window.addEventListener('storage', loadSchool);
      return () => {
        window.removeEventListener('dapodik_settings_updated', loadSchool);
        window.removeEventListener('storage', loadSchool);
      };
    }
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  /* ── Dynamic Tab Title & Favicon Update Engine (Head Lock) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const schoolName = selectedSchool || 'School OS';
    const breadcrumb = getBreadcrumbLabel();
    const targetTitle = pathname === '/dashboard'
      ? `${schoolName} — Platform Manajemen Sekolah`
      : breadcrumb && breadcrumb !== 'Menu'
      ? `${breadcrumb} — ${schoolName}`
      : `${schoolName} — Enterprise Platform`;

    // 1. Force Document Title
    const enforceTitle = () => {
      if (document.title !== targetTitle) {
        document.title = targetTitle;
      }
    };
    enforceTitle();

    // 2. Force Favicon
    const activeFavicon = schoolLogoUrl || '/logos/tut_wuri_handayani.svg';

    const enforceFavicon = (href: string) => {
      let iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel*='shortcut'], link[rel*='apple-touch']");
      if (iconLinks.length === 0) {
        const link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
        iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel*='shortcut']");
      }
      iconLinks.forEach(link => {
        if (link.getAttribute('href') !== href) {
          link.setAttribute('href', href);
        }
      });
    };

    const processFavicon = (url: string) => {
      if (!url) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 64, 64);
            ctx.beginPath();
            ctx.arc(32, 32, 31, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 0, 0, 64, 64);
            enforceFavicon(canvas.toDataURL('image/png'));
          }
        } catch (e) {
          enforceFavicon(url);
        }
      };
      img.onerror = () => enforceFavicon(url);
      img.src = url;
    };

    processFavicon(activeFavicon);

    // 3. MutationObserver to lock Head against Next.js hydration overrides
    const observer = new MutationObserver(() => {
      enforceTitle();
      processFavicon(activeFavicon);
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const titleEl = document.querySelector('title');
    if (titleEl) {
      observer.observe(titleEl, { childList: true, characterData: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [selectedSchool, schoolLogoUrl, pathname]);

  const isItemActive = (itemPath: string) => {
    if (pathname === itemPath) return true;
    if (itemPath === '/dashboard') return false;

    if (pathname.startsWith(itemPath + '/')) {
      // Check if there is a more specific menu item registered that matches current pathname
      const hasMoreSpecificMatch = NAV_SECTIONS.some(sec =>
        sec.items.some(it => it.path !== itemPath && it.path.startsWith(itemPath + '/') && (pathname === it.path || pathname.startsWith(it.path + '/')))
      );
      return !hasMoreSpecificMatch;
    }
    return false;
  };

  /* ── Breadcrumb label ── */
  const getBreadcrumbLabel = () => {
    if (pathname.includes('/students/qr-scan'))     return 'Scan QR Presensi Siswa';
    if (pathname.includes('/students/new'))         return 'Tambah Siswa Baru';
    if (pathname.includes('/students'))             return 'Manajemen Siswa';
    if (pathname.includes('/learning/materials'))   return 'Materi Pembelajaran';
    if (pathname.includes('/learning/assignments')) return 'Tugas Siswa';
    if (pathname.includes('/learning/quizzes'))     return 'Kuis & CBT';
    if (pathname.includes('/learning'))             return 'Mata Pelajaran & Kurikulum';
    if (pathname.includes('/grading/gradebook'))    return 'Buku Nilai Siswa';
    if (pathname.includes('/grading/final-grades')) return 'Nilai Akhir Rapor';
    if (pathname.includes('/grading'))              return 'Penilaian';
    if (pathname.includes('/reports/cards'))        return 'Cetak Rapor Siswa';
    if (pathname.includes('/reports/analytics'))    return 'Analitik & Laporan';
    if (pathname.includes('/reports/export'))       return 'Ekspor Dokumen';
    if (pathname.includes('/reports'))              return 'Laporan & Rapor';
    if (pathname.includes('/teachers/new'))         return 'Tambah Guru Baru';
    if (pathname.includes('/teachers'))             return 'Manajemen Guru';
    if (pathname.includes('/classes'))              return 'Data Kelas & Rombel';
    if (pathname.includes('/activity-logs'))        return 'Log Aktivitas';
    if (pathname.includes('/notifications'))        return 'Notifikasi';
    if (pathname.includes('/announcements'))        return 'Pengumuman';
    if (pathname.includes('/guardians'))            return 'Orang Tua / Wali';
    if (pathname.includes('/enrollments'))          return 'Pembelajaran & Plotting';
    if (pathname.includes('/users'))                return 'Pengguna & Peran';
    if (pathname.includes('/academic-years'))       return 'Tahun Ajaran';
    if (pathname.includes('/dapodik'))              return 'Integrasi Dapodik';
    if (pathname.includes('/settings'))             return 'Pengaturan Sistem';
    return 'Menu';
  };
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className={`${styles.layout} ${collapsed ? styles.collapsed : ''}`}>
      {/* ═══════════════════════
          SIDEBAR
      ═══════════════════════ */}
      <aside className={styles.sidebar}>
        {/* Brand */}
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              {schoolLogoUrl ? (
                <img
                  key={schoolLogoUrl}
                  src={schoolLogoUrl}
                  alt={selectedSchool || 'Logo Sekolah'}
                  referrerPolicy="no-referrer"
                  style={{ display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const svg = (e.target as HTMLElement).parentElement?.querySelector('svg');
                    if (svg) svg.style.display = 'block';
                  }}
                />
              ) : null}
              <svg
                viewBox="0 0 64 64"
                fill="none"
                style={{ display: schoolLogoUrl ? 'none' : 'block' }}
              >
                <defs>
                  <linearGradient id="lgSidebar" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="url(#lgSidebar)" />
                <path d="M32 14L46 22V32C46 42 39.5 48.5 32 51C24.5 48.5 18 42 18 32V22L32 14Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
                <path d="M32 22L44 28L32 34L20 28L32 22Z" fill="white" />
                <path d="M25 32V37C25 39.5 28 41.5 32 41.5C36 41.5 39 39.5 39 37V32" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName} title={selectedSchool}>{selectedSchool || 'School OS'}</span>
              <span className={styles.logoBadge}>Sistem Manajemen Sekolah</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((sec, secIdx) => (
            <div key={secIdx} className={styles.navSection}>
              {sec.label && <span className={styles.sectionLabel}>{sec.label}</span>}
              {sec.items.map((item, itemIdx) => {
                const active = isItemActive(item.path);
                return (
                  <Link
                    key={`${secIdx}-${itemIdx}-${item.path}`}
                    href={item.path}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                    title={item.label}
                  >
                    <Icon name={item.icon} />
                    <span className={styles.itemLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer — user card + collapse toggle */}
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUserCard}>
            <div className={styles.sidebarAvatarBadge}>
              {user?.full_name
                ? user.full_name.trim().charAt(0).toUpperCase()
                : (user?.email ? user.email.trim().charAt(0).toUpperCase() : 'A')}
            </div>
            <div className={styles.sidebarUserInfo}>
              <span className={styles.sidebarUserName} title={user?.full_name || user?.email || 'Admin Sistem'}>
                {user?.full_name || user?.email || 'Admin Sistem'}
              </span>
              <span className={styles.sidebarUserRole}>
                {user?.role || 'Administrator'}
              </span>
            </div>
            {!collapsed && (
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className={styles.sidebarLogoutBtn}
                title="Keluar (Logout)"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M13 15h4V5h-4M9 14l4-4-4-4M13 10H4"/>
                </svg>
              </button>
            )}
          </div>

          <button
            className={styles.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14" style={{ transition: 'transform 0.3s ease', transform: collapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="M12 15l-5-5 5-5"/>
            </svg>
            <span className={styles.toggleLabel}>Sembunyikan Menu</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════
          MAIN VIEWPORT
      ═══════════════════════ */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.hamburgerBtn}
              onClick={() => setCollapsed(!collapsed)}
              title="Toggle Sidebar"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="16" height="16">
                <path d="M3 5h14M3 10h14M3 15h10"/>
              </svg>
            </button>

            <div className={styles.headerGreeting}>
              {pathname === '/dashboard' ? (
                <>
                  <h1 className={styles.greetingTitle}>Selamat datang, Admin 👋</h1>
                  <span className={styles.greetingSub}>Dashboard ringkasan — pantau kinerja sekolah hari ini</span>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  <Link href="/dashboard" style={{ color: 'inherit', transition: 'color 0.15s' }} onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    Beranda
                  </Link>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="12" height="12"><path d="M6 12l4-4-4-4"/></svg>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getBreadcrumbLabel()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className={styles.topbarCenter}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <circle cx="8.5" cy="8.5" r="5.5"/>
                  <path d="M13 13l4 4"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari menu, siswa, guru..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Right controls */}
          <div className={styles.topbarRight}>
            {/* School badge */}
            <div className={styles.schoolSelector} style={{ cursor: 'default' }} title={selectedSchool}>
              {schoolLogoUrl ? (
                <img
                  key={schoolLogoUrl}
                  src={schoolLogoUrl}
                  alt="Logo"
                  referrerPolicy="no-referrer"
                  style={{ display: 'block', width: '18px', height: '18px', objectFit: 'contain', borderRadius: '50%', flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M10 2L18 7V9H2V7L10 2Z"/><rect x="4" y="9" width="3" height="7"/><rect x="8.5" y="9" width="3" height="7"/><rect x="13" y="9" width="3" height="7"/><path d="M2 16h16"/></svg>
              )}
              <span>{selectedSchool}</span>
            </div>

            {/* Theme toggle */}
            <button className={styles.themeToggle} onClick={toggleTheme} title={isDark ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}>
              {isDark ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Notification bell & popover */}
            <div className={styles.notifWrapper}>
              <button
                className={styles.bellBtn}
                onClick={() => {
                  setShowNotif(!showNotif);
                  setShowDropdown(false);
                }}
                title="Notifikasi & Peringatan Sistem"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M10 2.5a6 6 0 016 6v3l1.5 2H2.5L4 11.5v-3a6 6 0 016-6z"/>
                  <path d="M8 15.5a2 2 0 004 0"/>
                </svg>
                {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
              </button>

              {showNotif && (
                <>
                  <div className={styles.dropdownOverlay} onClick={() => setShowNotif(false)} />
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <span className={styles.notifTitle}>Notifikasi Terbaru</span>
                      {unreadCount > 0 && (
                        <button className={styles.notifMarkRead} onClick={() => setUnreadCount(0)}>
                          ✓ Tandai Dibaca
                        </button>
                      )}
                    </div>
                    <div className={styles.notifList}>
                      {NOTIF_ITEMS.map(n => (
                        <Link
                          key={n.id}
                          href={n.link}
                          className={styles.notifItem}
                          onClick={() => setShowNotif(false)}
                        >
                          <div className={styles.notifIconCircle} style={{ background: n.bg }}>
                            {n.icon}
                          </div>
                          <div className={styles.notifContent}>
                            <span className={styles.notifText}>{n.text}</span>
                            <span className={styles.notifTime}>{n.time}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className={styles.notifFooter}>
                      <Link
                        href="/dashboard/notifications"
                        className={styles.notifFooterLink}
                        onClick={() => setShowNotif(false)}
                      >
                        Lihat Seluruh Notifikasi (8) →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className={styles.pageContentWrapper}>
          {children}
        </div>
      </div>
    </div>
  );
}
