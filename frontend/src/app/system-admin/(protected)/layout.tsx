'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/(dashboard)/layout.module.css';

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

  return (
    <div className={`${styles.layout} ${collapsed ? styles.collapsed : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/system-admin/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="lgAdmin" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="url(#lgAdmin)" />
                <path d="M32 14L46 22V32C46 42 39.5 48.5 32 51C24.5 48.5 18 42 18 32V22L32 14Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
                <path d="M32 22L44 28L32 34L20 28L32 22Z" fill="white" />
              </svg>
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>Command Center</span>
              <span className={styles.logoBadge}>Super Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Sistem Manajemen</span>
            <Link
              href="/system-admin/dashboard"
              className={`${styles.navItem} ${pathname === '/system-admin/dashboard' ? styles.navItemActive : ''}`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <rect x="2" y="2" width="7" height="7" rx="1.5" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" />
              </svg>
              <span className={styles.itemLabel}>Daftar Tenant Sekolah</span>
            </Link>

            <Link
              href="/system-admin/audit"
              className={`${styles.navItem} ${pathname === '/system-admin/audit' ? styles.navItemActive : ''}`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M10 2l6 3v5c0 5-3.5 8-6 9-2.5-1-6-4-6-9V5l6-3z" />
                <path d="M7 10l2 2 4-4" />
              </svg>
              <span className={styles.itemLabel}>Audit Logs &amp; Security</span>
            </Link>

            <Link
              href="/system-admin/server"
              className={`${styles.navItem} ${pathname === '/system-admin/server' ? styles.navItemActive : ''}`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <rect x="2" y="4" width="16" height="4" rx="1" />
                <rect x="2" y="12" width="16" height="4" rx="1" />
                <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2.5" />
                <line x1="6" y1="14" x2="6.01" y2="14" strokeWidth="2.5" />
              </svg>
              <span className={styles.itemLabel}>Server &amp; Database Health</span>
            </Link>

            <Link
              href="/system-admin/settings"
              className={`${styles.navItem} ${pathname === '/system-admin/settings' ? styles.navItemActive : ''}`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <circle cx="10" cy="10" r="3" />
                <path d="M16 10a6 6 0 0 1-.5 2.3l1.4 1.4-2 2-1.4-1.4A6 6 0 0 1 11 15v2H9v-2a6 6 0 0 1-2.5-.7L5.1 15.7l-2-2 1.4-1.4A6 6 0 0 1 4 10H2V8h2a6 6 0 0 1 .7-2.3L3.3 4.3l2-2 1.4 1.4A6 6 0 0 1 9 3V1h2v2a6 6 0 0 1 2.5.7l1.4-1.4 2 2-1.4 1.4A6 6 0 0 1 16 8h2v2h-2z" />
              </svg>
              <span className={styles.itemLabel}>Konfigurasi Global</span>
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter} style={{ padding: '1rem' }}>
          <button
            onClick={() => {
              localStorage.removeItem('sysAdminToken');
              router.push('/system-admin/login');
            }}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, justifyContent: 'center' }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M13 15h4V5h-4M9 14l4-4-4-4M13 10H4"/></svg>
            {!collapsed && <span>Keluar (Logout)</span>}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.hamburgerBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="16" height="16">
                <path d="M3 5h14M3 10h14M3 15h10"/>
              </svg>
            </button>
            <div className={styles.headerGreeting}>
              <h1 className={styles.greetingTitle}>Super Admin Dashboard 👑</h1>
              <span className={styles.greetingSub}>Kelola koneksi database dan aktivasi master akun tenant</span>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.themeToggle} onClick={toggleTheme} title={isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}>
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
          </div>
        </header>

        <div className={styles.pageContentWrapper}>
          {children}
        </div>
      </div>
    </div>
  );
}
