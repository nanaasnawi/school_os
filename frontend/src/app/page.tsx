'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  // Interactive state
  const [activeArchTab, setActiveArchTab] = useState<'RUST' | 'BRIDGE' | 'DDD' | 'MOBILE'>('RUST');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number>(0);
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<'DAPODIK' | 'SIBI' | 'MERDEKA'>('DAPODIK');
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail.trim()) {
      setSubscribeSuccess(true);
      setTimeout(() => {
        setSubscribedEmail('');
        setSubscribeSuccess(false);
      }, 4000);
    }
  };

  const faqs = [
    {
      q: 'Bagaimana cara integrasi dengan aplikasi Dapodik lokal sekolah?',
      a: 'Akselerasi-Edu dilengkapi dengan Local Bridge Agent berbasis Rust yang berjalan ringan di server sekolah. Agen ini membaca database PostgreSQL lokal Dapodik (Port 5432) dan menyinkronkan data rombel, siswa, dan guru secara otomatis ke cloud tanpa perlu entri manual ganda.',
    },
    {
      q: 'Apakah sistem tetap dapat digunakan saat koneksi internet lambat?',
      a: 'Ya! Arsitektur kami mengadopsi prinsip offline-first dan idempotency. Mobile app siswa menyimpan materi pembelajaran dan buku SIBI secara lokal, sementara Local Bridge menyimpan antrean outbox events yang otomatis tersinkronisasi saat koneksi pulih.',
    },
    {
      q: 'Bagaimana Akselerasi-Edu melindungi keamanan dan isolasi data sekolah?',
      a: 'Sistem menerapkan isolasi multi-tenant yang ketat (ADR-0004). Setiap tenant/sekolah memiliki ruang data terenkripsi berdasarkan NPSN unik. Akses diamankan dengan RBAC berbasis klaim JWT dan enkripsi password berstandar industri Argon2.',
    },
    {
      q: 'Apakah guru dan wali murid mendapatkan modul khusus?',
      a: 'Tentu! Guru memiliki Teacher Workstation lengkap dengan Action Center, Mass Grader koreksi esai, dan presensi kelas. Wali murid memiliki Parent Portal terpisah untuk memantau rekap nilai, kehadiran, dan agenda sekolah secara real-time.',
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgVectorLines} />

      {/* ══════════════════════════════════════════════════════════
         1. NAVIGATION HEADER
         ══════════════════════════════════════════════════════════ */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerInner}>
            {/* Brand Logo with 3D Glowing Gradient Orb */}
            <Link href="/" className={styles.logoGroup}>
              <div className={styles.logoOrb}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className={styles.logoText}>
                <span>AKSELERASI</span>
                <span className={styles.logoBadge}>SCHOOL OS</span>
              </div>
            </Link>

            {/* Nav Menu Links */}
            <nav>
              <ul className={styles.navLinks}>
                <li>
                  <a href="#features" className={styles.navLink}>
                    <span>Fitur Utama</span>
                  </a>
                </li>
                <li>
                  <a href="#architecture" className={styles.navLink}>
                    <span>Arsitektur</span>
                  </a>
                </li>
                <li>
                  <a href="#benefits" className={styles.navLink}>
                    <span>Keunggulan</span>
                  </a>
                </li>
                <li>
                  <a href="#ecosystem" className={styles.navLink}>
                    <span>Ekosistem</span>
                  </a>
                </li>
                <li>
                  <a href="#faq" className={styles.navLink}>
                    <span>FAQ</span>
                  </a>
                </li>
              </ul>
            </nav>

            {/* Header Right Actions */}
            <div className={styles.headerRight}>
              <Link href="/login" className={styles.loginBtn}>
                Masuk Sistem
              </Link>
              <Link href="/dashboard" className={styles.ctaPillCyan}>
                <span>Mulai Sekarang</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
         2. HERO SECTION
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            {/* Left Hero Content */}
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span style={{ color: '#00F5D4' }}>●</span>
                <span>OPERATING SYSTEM SEKOLAH MODERN • RUST &amp; NEXT.JS</span>
              </div>

              <h1 className={styles.heroTitle}>
                Transformasi Digital Pendidikan Terintegrasi dengan{' '}
                <span className={styles.heroGradientText}>Akselerasi-Edu OS</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Platform SaaS generasi baru untuk sekolah modern. Menyatukan Teacher Workstation,
                LMS buku digital SIBI Kemdikdasmen, sinkronisasi Dapodik otomatis tanpa entri ulang,
                dan portal pantau wali murid dalam satu arsitektur tangguh.
              </p>

              <div className={styles.heroActionGroup}>
                <Link href="/dashboard" className={styles.ctaPillCyan}>
                  <span>Jelajahi Workstation</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/dashboard/teacher" className={styles.ctaOutline}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Teacher Action Center</span>
                </Link>
              </div>
            </div>

            {/* Right Hero 3D Futuristic Dashboard Mockup */}
            <div className={styles.heroVisualWrapper}>
              <div className={styles.heroPortalRing}>
                {/* 3D Angled Central Card */}
                <div className={styles.heroMockupCard}>
                  <div className={styles.mockupHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚡</span>
                      <span className={styles.mockupTitle}>Akselerasi Core</span>
                    </div>
                    <span className={styles.mockupBadgeLive}>● Live Engine</span>
                  </div>

                  <div className={styles.mockupBalance}>
                    <span className={styles.mockupBalanceLabel}>Kehadiran Sesi Belajar Hari Ini</span>
                    <span className={styles.mockupBalanceValue}>96.8%</span>
                    <span style={{ fontSize: '0.74rem', color: '#34D399', fontWeight: 700 }}>
                      ▲ +3.2% dari pekan lalu • 32 Sesi Aktif
                    </span>
                  </div>

                  {/* Micro dashboard graph */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '8px' }}>
                      <span>Throughput Latensi API</span>
                      <span style={{ color: '#00F5D4', fontWeight: 800 }}>&lt; 1.6s Cold / 45ms Hot</span>
                    </div>
                    <svg viewBox="0 0 100 28" fill="none" style={{ width: '100%', height: '36px' }}>
                      <defs>
                        <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00F5D4" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#00F5D4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 24 Q 20 8, 40 18 T 80 8 L 100 12 L 100 28 L 0 28 Z" fill="url(#heroSpark)" />
                      <path d="M0 24 Q 20 8, 40 18 T 80 8 L 100 12" stroke="#00F5D4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Floating Glass Widget 1: Dapodik Bridge */}
                <div className={styles.floatingBadge1}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#00F5D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B0826', fontWeight: 900 }}>
                    🔄
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF' }}>Dapodik Local Bridge</div>
                    <div style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 700 }}>100% Selaras (3.420 Rekor)</div>
                  </div>
                </div>

                {/* Floating Glass Widget 2: Mass Grader */}
                <div className={styles.floatingBadge2}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 900 }}>
                    📝
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF' }}>Mass Grader Workstation</div>
                    <div style={{ fontSize: '0.68rem', color: '#C4B5FD', fontWeight: 700 }}>4.120 Esai Terselesaikan</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         3. 3-STEP IMPLEMENTATION PROCESS
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.processSection}>
        <div className={styles.watermarkText}>GET STARTED</div>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <h2 className={styles.sectionTitle}>
              Implementasi Sekolah Modern dalam 3 Langkah Mudah
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDot} />
              <span className={styles.accentBar} />
            </div>
            <p className={styles.sectionSubtitle}>
              Hanya butuh beberapa menit tanpa konfigurasi rumit. Tersedia di web browser,
              tablet guru, smartphone Android siswa, serta server lokal sekolah.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {/* Step 1 */}
            <div className={styles.stepCard}>
              <div className={`${styles.stepOrbContainer} ${styles.stepOrbPurple}`}>
                <span>🔌</span>
                <span className={styles.stepNumber}>1</span>
              </div>
              <h3 className={styles.stepTitle}>Hubungkan Local Bridge</h3>
              <p className={styles.stepDesc}>
                Instal agen daemon Rust lokal di server sekolah. Data Dapodik, rombel, guru,
                dan peserta didik langsung tersinkronisasi otomatis tanpa entri ulang ganda.
              </p>
            </div>

            {/* Step 2 */}
            <div className={styles.stepCard}>
              <div className={`${styles.stepOrbContainer} ${styles.stepOrbCyan}`}>
                <span>🪪</span>
                <span className={styles.stepNumber}>2</span>
              </div>
              <h3 className={styles.stepTitle}>Aktivasi Kartu QR Siswa</h3>
              <p className={styles.stepDesc}>
                Cetak kartu QR login instan untuk peserta didik. Siswa dan guru dapat langsung
                masuk ke sistem CBT dan absensi kelas tanpa risiko lupa kata sandi.
              </p>
            </div>

            {/* Step 3 */}
            <div className={styles.stepCard}>
              <div className={`${styles.stepOrbContainer} ${styles.stepOrbPink}`}>
                <span>🚀</span>
                <span className={styles.stepNumber}>3</span>
              </div>
              <h3 className={styles.stepTitle}>Jalankan Workstation &amp; LMS</h3>
              <p className={styles.stepDesc}>
                Guru langsung mengelola jadwal mengajar, modul bacaan SIBI Kemdikdasmen,
                dan koreksi massal esai dengan efisiensi waktu hingga 70%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         4. PORTFOLIO HIGHLIGHT CARD (Live Sparkline Rows)
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.highlightSection}>
        <div className={styles.container}>
          <div className={styles.highlightCard}>
            <div className={styles.highlightLeft}>
              <h2 className={styles.highlightTitle}>
                Pantau Aktivitas Akademik &amp; Kinerja Sistem Real-Time
              </h2>
              <p className={styles.highlightSubtitle}>
                Didesain dengan arsitektur Event-Driven dan Clean Architecture (ADR-0001).
                Seluruh aktivitas kehadiran, penilaian, dan pembacaan buku teragregasi
                secara instan tanpa membebani server lokal sekolah.
              </p>
              <Link href="#features" className={styles.highlightBtn}>
                PELAJARI FITUR &rarr;
              </Link>
            </div>

            {/* Right Live Sparklines */}
            <div className={styles.sparklineList}>
              {/* Row 1 */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: '#0284C7' }}>
                    🏫
                  </div>
                  <div>
                    <div className={styles.sparklineName}>Sinkronisasi Dapodik</div>
                    <div className={styles.sparklineMeta}>3.420 data siswa &amp; rombel selaras</div>
                  </div>
                </div>
                <svg className={styles.sparklineSvg} viewBox="0 0 90 28">
                  <path d="M0 20 Q 25 5, 50 15 T 90 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <span className={styles.sparklineBadgeUp}>▲ 0.4s</span>
              </div>

              {/* Row 2 */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: '#10B981' }}>
                    📅
                  </div>
                  <div>
                    <div className={styles.sparklineName}>Presensi Sesi Belajar</div>
                    <div className={styles.sparklineMeta}>96.8% Kehadiran rombel harian</div>
                  </div>
                </div>
                <svg className={styles.sparklineSvg} viewBox="0 0 90 28">
                  <path d="M0 24 Q 25 18, 50 10 T 90 4" stroke="#34D399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <span className={styles.sparklineBadgeUp}>▲ 3.2%</span>
              </div>

              {/* Row 3 */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: '#EA580C' }}>
                    ✍️
                  </div>
                  <div>
                    <div className={styles.sparklineName}>Mass Grader Koreksi</div>
                    <div className={styles.sparklineMeta}>4.120 berkas esai dinilai cepat</div>
                  </div>
                </div>
                <svg className={styles.sparklineSvg} viewBox="0 0 90 28">
                  <path d="M0 16 Q 30 24, 60 8 T 90 4" stroke="#FB923C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <span className={styles.sparklineBadgeUp}>▲ 14%</span>
              </div>

              {/* Row 4 */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: '#7C3AED' }}>
                    📖
                  </div>
                  <div>
                    <div className={styles.sparklineName}>Perpustakaan Digital SIBI</div>
                    <div className={styles.sparklineMeta}>Buku resmi Kurikulum Merdeka Kemdikdasmen</div>
                  </div>
                </div>
                <svg className={styles.sparklineSvg} viewBox="0 0 90 28">
                  <path d="M0 18 Q 30 6, 60 12 T 90 2" stroke="#A78BFA" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <span className={styles.sparklineBadgeUp}>▲ 99.2%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         5. FEATURE SECTION 1: PRO-LEVEL CONTROL FOR TEACHERS
         ══════════════════════════════════════════════════════════ */}
      <section id="features" className={styles.featureSection}>
        <div className={styles.watermarkText}>FEATURES</div>
        <div className={styles.container}>
          <div className={styles.featureGrid}>
            {/* Visual Composite with floating glass cards */}
            <div className={styles.featureVisualComposite}>
              <div className={styles.featureCircleBackdrop} />

              {/* Central stylized preview */}
              <div style={{ width: '380px', background: 'rgba(18, 14, 56, 0.85)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Teacher Action Center</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#b91c1c', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>
                    3 Perlu Perhatian
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Ahmad Fauzi</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>PAKET A4 • Nilai Matematika &lt; KKM</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#00F5D4', fontWeight: 700 }}>Kirim Pengingat &gt;</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Siti Nurhaliza</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>PAKET A5 • Modul SIBI Tertinggal</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#00F5D4', fontWeight: 700 }}>Kirim Pengingat &gt;</span>
                  </div>
                </div>
              </div>

              {/* Floating Glass Widget 1 */}
              <div className={styles.featureGlassWidget1}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Tingkat Kehadiran Rombel</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34D399', margin: '2px 0' }}>96.8% Hadir</div>
                <div style={{ fontSize: '0.68rem', color: '#00F5D4', fontWeight: 700 }}>28/30 Siswa Tepat Waktu</div>
              </div>

              {/* Floating Glass Widget 2 */}
              <div className={styles.featureGlassWidget2}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Koreksi Cepat Mass Grader</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FB923C' }}>4 Menit / Rombel</div>
                <div style={{ fontSize: '0.68rem', color: '#C4B5FD', fontWeight: 700 }}>Auto-Grading &amp; Rubrik</div>
              </div>
            </div>

            {/* Right Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>
                Kendali Penuh Manajemen Sekolah dalam Satu Platform Terpadu
              </h2>
              <div className={styles.accentLine} style={{ alignSelf: 'flex-start' }}>
                <span className={styles.accentDot} />
                <span className={styles.accentBar} />
              </div>
              <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '0.96rem' }}>
                Guru tidak lagi dibebani tumpukan kertas dan rekonsiliasi nilai manual.
                Dengan Teacher Workstation, pendidik dapat memantau siswa berisiko secara
                otomatis, memeriksa pengumpulan tugas esai dengan Mass Grader, serta mencatat
                presensi kelas hanya dalam satu klik.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#00F5D4', fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Action Center proaktif: deteksi keterlambatan membaca &amp; tugas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#00F5D4', fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Digital Worksheet Viewer untuk koreksi esai tanpa download file</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#00F5D4', fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Integrasi buku nilai otomatis ke rapor kurikulum merdeka</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         6. FEATURE SECTION 2: INDUSTRY-GRADE ARCHITECTURE (Docs)
         ══════════════════════════════════════════════════════════ */}
      <section id="architecture" className={styles.featureSection} style={{ background: 'rgba(18, 14, 56, 0.25)' }}>
        <div className={styles.watermarkText}>ARCHITECTURE</div>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <h2 className={styles.sectionTitle}>
              Arsitektur Berstandar Industri: Rust Core + Outbox Events + UUID v7
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDotCyan} />
              <span className={styles.accentBarCyan} />
            </div>
            <p className={styles.sectionSubtitle}>
              Dibangun berdasarkan dokumentasi teknis dan standar arsitektur kelas dunia (ADR-0001 s.d. ADR-0007).
              Performa luar biasa, keamanan multi-tenant, dan nol redundansi data.
            </p>
          </div>

          {/* Interactive Arch Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[
              { id: 'RUST', label: 'Rust Axum API Server' },
              { id: 'BRIDGE', label: 'Local Dapodik Bridge' },
              { id: 'DDD', label: 'Domain-Driven Design' },
              { id: 'MOBILE', label: 'Native Android Kotlin' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveArchTab(tab.id as any)}
                style={{
                  background: activeArchTab === tab.id ? '#00F5D4' : 'rgba(18, 14, 56, 0.8)',
                  color: activeArchTab === tab.id ? '#0B0826' : '#94A3B8',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.featureGridReverse}>
            {/* Left Technical Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeArchTab === 'RUST' && (
                <>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    ⚡ Backend Rust Berkecepatan Tinggi
                  </h3>
                  <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    Menggunakan Rust Edition 2024 dengan web framework Axum 0.8 dan Tokio 1.52.
                    Menyediakan performa asinkron tanpa garbage collection (zero runtime overhead),
                    menangani puluhan ribu permintaan per detik dengan konsumsi RAM sangat efisien (&lt; 60 MB).
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className={styles.logoBadge}>Axum 0.8</span>
                    <span className={styles.logoBadge}>SQLx 0.7 Compile-Time Query</span>
                    <span className={styles.logoBadge}>PostgreSQL 15</span>
                  </div>
                </>
              )}

              {activeArchTab === 'BRIDGE' && (
                <>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    🔄 Local Bridge Agent untuk Dapodik
                  </h3>
                  <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    Daemon latar belakang independen yang berjalan di komputer operator sekolah.
                    Membaca port 5432 Dapodik secara aman dan menyinkronkan data guru, siswa, dan rombel
                    ke cloud tanpa mengubah database asli Dapodik Kementerian.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className={styles.logoBadge}>Zero Manual Re-Entry</span>
                    <span className={styles.logoBadge}>Isolated Port 5433</span>
                    <span className={styles.logoBadge}>SQLite Offline Cache</span>
                  </div>
                </>
              )}

              {activeArchTab === 'DDD' && (
                <>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    🏛️ Clean Architecture &amp; Outbox Events
                  </h3>
                  <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    Memisahkan lapisan Presentation, Domain (`school-core`), dan Infrastructure (ADR-0001).
                    Menggunakan tabel outbox events untuk menjamin atomisitas pengiriman notifikasi FCM
                    dan pembaruan nilai tanpa risiko inkonsistensi transaksi database.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className={styles.logoBadge}>UUID v7 Time-Sortable</span>
                    <span className={styles.logoBadge}>Multi-Tenant Isolation</span>
                    <span className={styles.logoBadge}>Event-Driven Outbox</span>
                  </div>
                </>
              )}

              {activeArchTab === 'MOBILE' && (
                <>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    📱 Native Android dengan Jetpack Compose
                  </h3>
                  <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    Aplikasi mobile resmi untuk siswa dan orang tua. Dilengkapi CameraX untuk pemindaian
                    QR kartu login, Firebase Cloud Messaging (HTTP v1) untuk notifikasi jam belajar,
                    dan modul offline SIBI Kemdikdasmen reader.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className={styles.logoBadge}>Kotlin &amp; Compose</span>
                    <span className={styles.logoBadge}>CameraX QR Auth</span>
                    <span className={styles.logoBadge}>FCM WakeLock</span>
                  </div>
                </>
              )}
            </div>

            {/* Right Perspective Angled Dashboard */}
            <div className={styles.angledDashboardMockup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00F5D4' }}>system_architecture.spec</span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>PostgreSQL 15 • 58 Migrations</span>
              </div>
              <pre style={{ margin: 0, padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', fontSize: '0.78rem', color: '#38BDF8', fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.6 }}>
{`// Bounded Context Registry (Rust & Next.js)
├── Identity  -> QR Token Auth & RBAC Claims
├── Academic  -> Classes, Rombel, & Dapodik Sync
├── Learning  -> Assignments, CBT & SIBI Library
├── People    -> Students, Teachers, & Guardians
├── Reporting -> Rapor Digital & Attendance Analytics
└── Events    -> Outbox Queue & FCM Push Engine`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         7. INTERSECTING NETWORK NODES (Ecosystem / Multi-Role)
         ══════════════════════════════════════════════════════════ */}
      <section id="ecosystem" className={styles.ecosystemSection}>
        <div className={styles.watermarkText}>ECOSYSTEM</div>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <h2 className={styles.sectionTitle}>
              Sinergi Harmonis: Guru, Siswa, Admin, &amp; Orang Tua
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDot} />
              <span className={styles.accentBar} />
            </div>
            <p className={styles.sectionSubtitle}>
              Satu sistem operasi yang menghubungkan seluruh pemangku kepentingan pendidikan
              dalam interaksi terpadu dan transparan.
            </p>
          </div>

          <div className={styles.networkDiagramWrapper}>
            <div className={styles.orbitCircles}>
              <div className={styles.orbitLeft} />
              <div className={styles.orbitRight} />

              <div className={styles.nodeCenterLeft}>
                <span style={{ fontSize: '1.8rem', marginBottom: '4px' }}>👨‍🏫</span>
                <span>GURU</span>
                <span style={{ fontSize: '0.68rem', color: '#DDD6FE', fontWeight: 600 }}>Workstation</span>
              </div>

              <div className={styles.nodeCenterRight}>
                <span style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🎓</span>
                <span>SISWA</span>
                <span style={{ fontSize: '0.68rem', color: '#A5F3FC', fontWeight: 600 }}>LMS &amp; CBT</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '40px' }}>
            <div style={{ background: 'rgba(18, 14, 56, 0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>👨‍🏫 Pendidik</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Action center, koreksi massal esai, bank soal CBT, dan absensi 1-klik.</div>
            </div>
            <div style={{ background: 'rgba(18, 14, 56, 0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 245, 212, 0.2)' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>🎓 Peserta Didik</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>QR login kilat, modul interaktif SIBI Kemdikdasmen, dan kuis online anti-curang.</div>
            </div>
            <div style={{ background: 'rgba(18, 14, 56, 0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>👨‍👩‍👧 Orang Tua</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Parent Portal untuk melihat nilai, rekapitulasi kehadiran, dan pengumuman sekolah.</div>
            </div>
            <div style={{ background: 'rgba(18, 14, 56, 0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>🏛️ Manajemen &amp; TU</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Otomasi Dapodik, manajemen tahun ajaran, buku rapor, dan analitik multi-rombel.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         8. KEY STATS & METRICS COUNTER
         ══════════════════════════════════════════════════════════ */}
      <section id="benefits" className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>50+</span>
              <div className={styles.accentLine} style={{ margin: '4px 0 0' }}>
                <span className={styles.accentDotCyan} />
                <span className={styles.accentBarCyan} />
              </div>
              <span className={styles.statLabel}>Modul Terintegrasi</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statNumber}>&lt; 1.6s</span>
              <div className={styles.accentLine} style={{ margin: '4px 0 0' }}>
                <span className={styles.accentDot} />
                <span className={styles.accentBar} />
              </div>
              <span className={styles.statLabel}>Latensi Response Core API</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statNumber}>100%</span>
              <div className={styles.accentLine} style={{ margin: '4px 0 0' }}>
                <span className={styles.accentDotCyan} />
                <span className={styles.accentBarCyan} />
              </div>
              <span className={styles.statLabel}>Otomasi Dapodik Lokal</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statNumber}>99.98%</span>
              <div className={styles.accentLine} style={{ margin: '4px 0 0' }}>
                <span className={styles.accentDot} />
                <span className={styles.accentBar} />
              </div>
              <span className={styles.statLabel}>Uptime Reliabilitas Cloud</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         9. FREQUENTLY ASKED QUESTIONS (FAQ Accordion)
         ══════════════════════════════════════════════════════════ */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.watermarkText}>FAQS</div>
        <div className={styles.container}>
          <div className={styles.faqGrid}>
            {/* Left FAQ Intro */}
            <div className={styles.faqLeft}>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>
                Pertanyaan yang Sering Diajukan
              </h2>
              <div className={styles.accentLine} style={{ alignSelf: 'flex-start' }}>
                <span className={styles.accentDotCyan} />
                <span className={styles.accentBarCyan} />
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Temukan jawaban lengkap seputar integrasi Dapodik, keamanan data sekolah,
                metode sinkronisasi lokal, dan kemudahan penggunaan bagi pendidik.
              </p>
              <Link href="/dashboard" className={styles.ctaPillCyan} style={{ width: 'fit-content' }}>
                <span>Coba Akselerasi-Edu &rarr;</span>
              </Link>
            </div>

            {/* Right Accordion */}
            <div className={styles.faqList}>
              {faqs.map((faq, index) => {
                const isExpanded = activeFaqIndex === index;

                return (
                  <div
                    key={index}
                    onClick={() => setActiveFaqIndex(isExpanded ? -1 : index)}
                    className={isExpanded ? styles.faqItemExpanded : styles.faqItemCollapsed}
                  >
                    <div className={styles.faqQuestionRow}>
                      <h4 className={styles.faqQuestion}>{faq.q}</h4>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          color: isExpanded ? '#FFFFFF' : '#00F5D4',
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isExpanded && (
                      <p className={styles.faqAnswer}>{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         10. CALL TO ACTION BANNER
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.container}>
          <div className={styles.ctaBannerCard}>
            <div>
              <h2 className={styles.ctaBannerTitle}>
                Siap Mengakselerasi Manajemen Sekolah Anda?
              </h2>
              <p className={styles.ctaBannerSubtitle}>
                Tingkatkan efisiensi kerja guru, satukan data akademik Dapodik, dan beri
                pengalaman belajar terbaik bagi generasi masa depan.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/dashboard" className={styles.ctaPillCyan}>
                <span>Masuk ke Dashboard</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <Link href="/login" className={styles.ctaOutline}>
                <span>Login Pengguna</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         11. FOOTER (4-Column Directory & Newsletter)
         ══════════════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            {/* Col 1: Brand */}
            <div className={styles.footerCol}>
              <div className={styles.logoGroup}>
                <div className={styles.logoOrb} style={{ width: '32px', height: '32px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF' }}>AKSELERASI-EDU</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                Next-generation Educational Operating System (School OS) berkinerja tinggi
                untuk sekolah digital modern di Indonesia.
              </p>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="email"
                  placeholder="Masukkan email Anda..."
                  value={subscribedEmail}
                  onChange={(e) => setSubscribedEmail(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    color: '#FFFFFF',
                    outline: 'none',
                    flex: 1,
                  }}
                  required
                />
                <button
                  type="submit"
                  style={{
                    background: '#00F5D4',
                    color: '#0B0826',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {subscribeSuccess ? '✓' : 'Kirim'}
                </button>
              </form>
              {subscribeSuccess && (
                <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 700 }}>
                  ✓ Terima kasih telah berlangganan info rilis.
                </span>
              )}
            </div>

            {/* Col 2: Solusi & Fitur */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>SOLUSI SEKOLAH</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/dashboard/teacher" className={styles.footerLink}>Teacher Workstation</Link></li>
                <li><Link href="/dashboard/teacher/grading" className={styles.footerLink}>Mass Grader Esai</Link></li>
                <li><Link href="/dashboard/attendance" className={styles.footerLink}>Presensi &amp; Absensi Sesi</Link></li>
                <li><Link href="/dashboard/learning/materials" className={styles.footerLink}>Perpustakaan Buku SIBI</Link></li>
                <li><Link href="/dashboard/learning/quizzes" className={styles.footerLink}>Kuis &amp; CBT Anti-Curang</Link></li>
              </ul>
            </div>

            {/* Col 3: Arsitektur & Teknologi */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>ARSITEKTUR RUST</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#architecture" className={styles.footerLink}>Clean Architecture (ADR-0001)</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Domain-Driven Design</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Local Dapodik Bridge Agent</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Outbox Events &amp; FCM HTTP v1</a></li>
                <li><a href="#architecture" className={styles.footerLink}>UUID v7 High Indexing</a></li>
              </ul>
            </div>

            {/* Col 4: Akses & Ekosistem */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>PORTAL PENGGUNA</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/dashboard" className={styles.footerLink}>Portal Administrator</Link></li>
                <li><Link href="/dashboard/teacher" className={styles.footerLink}>Portal Guru Pengampu</Link></li>
                <li><Link href="/parent" className={styles.footerLink}>Parent Monitoring Portal</Link></li>
                <li><Link href="/login" className={styles.footerLink}>Login Kartu QR Siswa</Link></li>
                <li><Link href="/dashboard/dapodik" className={styles.footerLink}>Dapodik Sync Hub</Link></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>&copy; {new Date().getFullYear()} Akselerasi-Edu (School OS). Seluruh hak cipta dilindungi.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#features" className={styles.footerLink}>Privasi Data Siswa</a>
              <a href="#architecture" className={styles.footerLink}>Dokumentasi Arsitektur</a>
              <a href="#faq" className={styles.footerLink}>Pusat Bantuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
