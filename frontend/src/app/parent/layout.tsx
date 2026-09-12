'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import parentStyles from './layout.module.css';

const NAV_ITEMS = [
  { href: '/parent?tab=overview', tabKey: 'overview', label: 'Ringkasan', emoji: '🏠' },
  { href: '/parent?tab=scores', tabKey: 'scores', label: 'Nilai', emoji: '📊' },
  { href: '/parent?tab=attendance', tabKey: 'attendance', label: 'Presensi', emoji: '📅' },
  { href: '/parent?tab=upcoming', tabKey: 'upcoming', label: 'Agenda', emoji: '🔔' },
];

const CHILDREN_LIST = [
  { id: 'child-1', name: 'Ahmad Fauzi', className: 'Kelas 10-A IPA' },
  { id: 'child-2', name: 'Aisyah Fauzi', className: 'Kelas 8-B SMP' },
];

function ParentBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  return (
    <nav className={parentStyles.bottomNav}>
      <div className={parentStyles.bottomNavInner}>
        {NAV_ITEMS.map(item => {
          const active = pathname === '/parent' && currentTab === item.tabKey;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${parentStyles.navItem} ${active ? parentStyles.navItemActive : ''}`}
            >
              <span className={parentStyles.navEmoji}>{item.emoji}</span>
              <span className={parentStyles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState('child-1');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const selected = CHILDREN_LIST.find(c => c.id === selectedId) ?? CHILDREN_LIST[0];

  return (
    <div className={parentStyles.root}>
      {/* Dedicated Parent Header */}
      <header className={parentStyles.header}>
        <div className={parentStyles.headerInner}>
          <div className={parentStyles.brand}>
            <div className={parentStyles.brandIcon}>
              <svg viewBox="0 0 64 64" fill="none" width="32" height="32">
                <defs>
                  <linearGradient id="plLg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F46E5" />
                    <stop offset="0.5" stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                  <linearGradient id="capGradPl" x1="16" y1="12" x2="48" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#E0E7FF" />
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="18" fill="url(#plLg)" />
                <path d="M32 10L50 18V32C50 43.5 42.5 51.5 32 55C21.5 51.5 14 43.5 14 32V18L32 10Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M32 18L48 26L32 34L16 26L32 18Z" fill="url(#capGradPl)" />
                <path d="M22 30.5V38C22 41 26.5 43.5 32 43.5C37.5 43.5 42 41 42 38V30.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M44 28V36" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="44" cy="37" r="1.5" fill="#FDE047" />
              </svg>
            </div>
            <div>
              <span className={parentStyles.brandLabel}>School OS</span>
              <p className={parentStyles.brandSub}>Parent Awareness Portal</p>
            </div>
          </div>

          {/* Child switcher dropdown */}
          <div className={parentStyles.switcher}>
            <button
              className={parentStyles.switcherBtn}
              onClick={() => setSwitcherOpen(!switcherOpen)}
            >
              <div className={parentStyles.switcherAvatar}>{selected.name[0]}</div>
              <div className={parentStyles.switcherInfo}>
                <span className={parentStyles.switcherName}>{selected.name}</span>
                <span className={parentStyles.switcherClass}>{selected.className}</span>
              </div>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="12" height="12">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {switcherOpen && (
              <div className={parentStyles.dropdown}>
                <p className={parentStyles.dropdownLabel}>Pilih Anak</p>
                {CHILDREN_LIST.map(child => (
                  <button
                    key={child.id}
                    className={`${parentStyles.dropdownItem} ${selectedId === child.id ? parentStyles.dropdownItemActive : ''}`}
                    onClick={() => { setSelectedId(child.id); setSwitcherOpen(false); }}
                  >
                    <div className={parentStyles.dropdownAvatar}>{child.name[0]}</div>
                    <div>
                      <p className={parentStyles.dropdownName}>{child.name}</p>
                      <p className={parentStyles.dropdownClass}>{child.className}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={parentStyles.main}>{children}</main>

      {/* Mobile-First Bottom Nav wrapped in Suspense */}
      <Suspense fallback={null}>
        <ParentBottomNav />
      </Suspense>
    </div>
  );
}
