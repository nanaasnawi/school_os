'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  Server,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Shield,
  Layers,
} from 'lucide-react';
import styles from './shell.module.css';

const NAV_ITEMS = [
  {
    href: '/system-admin/dashboard',
    label: 'Direktori Tenant',
    icon: Building2,
  },
  {
    href: '/system-admin/audit',
    label: 'Audit & Keamanan',
    icon: ShieldCheck,
  },
  {
    href: '/system-admin/server',
    label: 'Kesehatan Server',
    icon: Server,
  },
  {
    href: '/system-admin/settings',
    label: 'Konfigurasi Global',
    icon: Settings,
  },
];

const BREADCRUMB_MAP: Record<string, string> = {
  '/system-admin/dashboard': 'Direktori Tenant & Metrik',
  '/system-admin/audit': 'Audit Log & Keamanan',
  '/system-admin/server': 'Kesehatan Server & Database',
  '/system-admin/settings': 'Konfigurasi Global Platform',
};

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('akselerasi_theme') || localStorage.getItem('school_os_theme');
      return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('akselerasi_theme', 'dark');
      localStorage.setItem('school_os_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('akselerasi_theme', 'light');
      localStorage.setItem('school_os_theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sysAdminToken');
    router.push('/system-admin/login');
  };

  const currentTitle = BREADCRUMB_MAP[pathname] || 'Command Center';

  return (
    <div className={`${styles.layout} ${collapsed ? styles.collapsed : ''}`}>
      {/* Mobile backdrop */}
      <div className={styles.backdrop} onClick={() => setCollapsed(false)} />

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/system-admin/dashboard" className={styles.brand} title="Akselerasi-Edu Command Center">
          <div className={styles.brandMark}>
            <Shield size={14} strokeWidth={2.4} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Akselerasi-Edu</span>
            <span className={styles.brandScope}>Super Admin Console</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <span className={styles.navGroupLabel}>SISTEM OPERASIONAL</span>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  title={item.label}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.operator}>
            <div className={styles.operatorAvatar}>SA</div>
            <div className={styles.operatorText}>
              <span className={styles.operatorName}>Super Admin</span>
              <span className={styles.operatorRole}>Root Authorization</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Keluar dari sesi Super Admin"
          >
            <LogOut size={16} strokeWidth={1.8} />
            <span className={styles.logoutLabel}>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.iconBtn}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Perluas Navigasi' : 'Ciutkan Navigasi'}
              aria-label="Toggle navigation collapse"
            >
              {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <span className={styles.crumbRoot}>Platform</span>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbCurrent}>{currentTitle}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.envTag} title="Koneksi Cluster Aktif">
              <span className={styles.envDot} />
              <span>Multi-Tenant Mesh</span>
            </div>

            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
