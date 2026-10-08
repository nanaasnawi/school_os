'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FolderSync,
  QrCode,
  Sparkles,
  Server,
  Layers,
  Smartphone,
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  CheckCircle2,
  Cpu,
  Clock,
  ShieldCheck,
  Activity,
  Check,
  FileCheck2,
  ExternalLink,
  Lock,
  Zap,
  Globe,
  Database
} from 'lucide-react';

export default function LandingPage() {
  const [activeArchTab, setActiveArchTab] = useState<'RUST' | 'BRIDGE' | 'DDD' | 'MOBILE'>('RUST');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number>(0);

  const faqs = [
    {
      q: 'Bagaimana cara integrasi dengan aplikasi Dapodik lokal sekolah?',
      a: 'Akselerasi-Edu dilengkapi dengan Local Bridge Agent berbasis Rust yang berjalan sangat ringan di server lokal sekolah. Agen ini membaca database PostgreSQL lokal Dapodik (Port 5432) dan menyinkronkan data rombel, siswa, dan guru secara otomatis ke cloud tanpa perlu entri manual ganda.',
    },
    {
      q: 'Apakah sistem tetap dapat digunakan saat koneksi internet lambat?',
      a: 'Ya! Arsitektur kami mengadopsi prinsip offline-first dan idempotency. Mobile app siswa menyimpan materi pembelajaran dan buku SIBI secara lokal, sementara Local Bridge menyimpan antrean outbox events yang otomatis tersinkronisasi saat koneksi internet sekolah pulih.',
    },
    {
      q: 'Bagaimana Akselerasi-Edu melindungi keamanan dan isolasi data sekolah?',
      a: 'Sistem menerapkan isolasi multi-tenant yang ketat (ADR-0004). Setiap tenant/sekolah memiliki ruang data terenkripsi berdasarkan NPSN unik. Akses diamankan dengan RBAC berbasis klaim JWT dan enkripsi password berstandar industri Argon2.',
    },
    {
      q: 'Apakah guru dan wali murid mendapatkan modul antarmuka khusus?',
      a: 'Tentu! Guru memiliki Teacher Workstation lengkap dengan Action Center, Mass Grader koreksi esai, dan presensi kelas 1-klik. Wali murid memiliki Parent Portal terpisah untuk memantau rekap nilai, kehadiran, dan agenda sekolah secara real-time.',
    },
    {
      q: 'Bagaimana proses migrasi data dari sistem lama ke Akselerasi-Edu?',
      a: 'Proses migrasi berlangsung cepat dan otomatis melalui impor basis data Dapodik lokal atau file Excel/CSV standar Kemdikdasmen. Tim teknis kami menyediakan pendampingan deployment dan verifikasi integritas data hingga siap digunakan.',
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* Subtle Dot Grid Background Pattern */}
      <div className={styles.bgDotGrid} />

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
                <span className={styles.logoBadge}>EDU</span>
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
                  <a href="#process" className={styles.navLink}>
                    <span>Cara Kerja</span>
                  </a>
                </li>
                <li>
                  <a href="#architecture" className={styles.navLink}>
                    <span>Arsitektur</span>
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
              <Link href="/dashboard" className={styles.ctaPillPurple}>
                <span>Mulai Sekarang</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
         2. HERO SECTION (High-End Light Mode Figma node-id=0-485)
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            {/* Left Hero Content */}
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <Sparkles size={14} color="#6C5CE7" />
                <span>OPERATING SYSTEM SEKOLAH MODERN • RUST &amp; NEXT.JS</span>
              </div>

              <h1 className={styles.heroTitle}>
                Transformasi Digital Pendidikan Terintegrasi dengan{' '}
                <span className={styles.heroGradientText}>Akselerasi-Edu OS</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Platform SaaS generasi baru untuk sekolah modern. Menyatukan Teacher Workstation,
                LMS buku digital SIBI Kemdikdasmen, sinkronisasi Dapodik otomatis tanpa entri ulang ganda,
                dan portal pantau orang tua dalam satu arsitektur tangguh.
              </p>

              {/* Official Store Badges (App Store & Google Play) */}
              <div className={styles.storeBadgesRow}>
                <a
                  href="#download-ios"
                  className={styles.storeBadgeBtn}
                  aria-label="Download on the App Store"
                >
                  <svg width="22" height="26" viewBox="0 0 170 170" fill="currentColor">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.85-11.75-14.44-6.1-9.69-10.88-20.65-14.33-32.88-3.46-12.23-5.19-23.47-5.19-33.72 0-14.03 3.65-25.75 10.96-35.16 7.31-9.41 16.54-14.24 27.69-14.48 4.9.11 10.36 1.39 16.37 3.84 6.01 2.45 10.02 3.73 12.03 3.84 1.58-.22 5.86-1.61 12.83-4.17 6.97-2.56 12.79-3.73 17.47-3.52 13.25.86 23.86 5.56 31.84 14.1-11.53 6.96-17.18 16.54-16.96 28.74.22 9.69 3.92 17.74 11.1 24.16 7.18 6.42 15.78 10.23 25.8 11.43-2.18 6.64-4.8 13.59-7.86 20.85zM119.22 33.64c0-7.4 2.66-14.37 7.99-20.91 5.33-6.54 11.87-10.78 19.62-12.73.54 3.7.38 7.35-.48 10.96-.86 3.61-2.4 7.08-4.63 10.41-4.79 6.86-11.23 11.08-19.32 12.67-.32-.13-.72-.25-1.18-.35v-.05z" />
                  </svg>
                  <div>
                    <span className={styles.storeBadgeSub}>Download on the</span>
                    <span className={styles.storeBadgeName}>App Store</span>
                  </div>
                </a>

                <a
                  href="#download-android"
                  className={styles.storeBadgeBtn}
                  aria-label="Get it on Google Play"
                >
                  <svg width="22" height="24" viewBox="0 0 512 512" fill="none">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#00CEC9" />
                    <path d="M47 36.7c-4.4 7.6-7 16.9-7 27.3v384c0 10.4 2.6 19.7 7 27.3l222-222L47 36.7z" fill="#6C5CE7" />
                    <path d="M325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z" fill="#EF4444" />
                    <path d="M441 230.1L385.4 198l-60.1 36.3 60.1 36.3 55.6-32.1c8.3-4.8 8.3-13.6 0-18.4z" fill="#F59E0B" />
                  </svg>
                  <div>
                    <span className={styles.storeBadgeSub}>GET IT ON</span>
                    <span className={styles.storeBadgeName}>Google Play</span>
                  </div>
                </a>

                <Link href="/dashboard" className={styles.ctaOutlinePurple}>
                  <span>Akses Web Portal</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            {/* Right Hero 3D Futuristic Smartphone Mockup */}
            <div className={styles.heroVisualWrapper}>
              {/* Background Concentric Glowing Aura Rings */}
              <div className={styles.heroAuraBackdrop} />
              <div className={styles.heroAuraRing2} />

              {/* 3D Angled Phone Chassis */}
              <div className={styles.phoneIsometricChassis}>
                <div className={styles.phoneInnerScreen}>
                  {/* Status Bar */}
                  <div className={styles.phoneStatusBar}>
                    <span>9:41</span>
                    <div className={styles.phonePunchHole} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={11} color="#00CEC9" />
                      <span style={{ fontSize: '0.62rem', color: '#10B981', fontWeight: 800 }}>5G</span>
                    </div>
                  </div>

                  {/* School Identity */}
                  <div className={styles.phoneSchoolHeader}>
                    <div className={styles.phoneSchoolOrb}>
                      <GraduationCap size={16} color="#FFFFFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#FFFFFF' }}>SMA Negeri 1 Prestasi</div>
                      <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>NPSN: 20108920 • Semester Ganjil</div>
                    </div>
                  </div>

                  {/* Main Attendance Highlight Card */}
                  <div className={styles.phoneCardAttendance}>
                    <span className={styles.phoneCardLabel}>Tingkat Kehadiran Hari Ini</span>
                    <span className={styles.phoneCardValue}>98.4%</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#E0E7FF' }}>
                      <CheckCircle2 size={12} color="#34D399" />
                      <span>36 Rombel Aktif • 1.280 Siswa Hadir</span>
                    </div>
                  </div>

                  {/* Quick SIBI Reader Progress Feed */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#CBD5E1' }}>
                      <span style={{ fontWeight: 800 }}>Materi SIBI Kemdikdasmen</span>
                      <span style={{ color: '#00CEC9', fontWeight: 800 }}>Aktif Dibaca</span>
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#94A3B8' }}>Bahasa Indonesia Kelas X - Bab 3 Teks Negosiasi</div>
                    <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: '84%', height: '100%', background: 'linear-gradient(90deg, #6C5CE7, #00CEC9)' }} />
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div style={{ marginTop: 'auto', background: '#6C5CE7', color: '#FFFFFF', borderRadius: '12px', padding: '10px 14px', textAlign: 'center', fontSize: '0.74rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(108, 92, 231, 0.4)' }}>
                    <QrCode size={14} />
                    <span>Presensi Kartu QR Instan</span>
                  </div>
                </div>
              </div>

              {/* Floating 3D Glass Card 1 (Top Left) */}
              <div className={styles.floatingGlassCard1}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  <FolderSync size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>Dapodik Local Bridge</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#FFFFFF' }}>100% Selaras (3.420 Data)</div>
                </div>
                <span style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.35)' }}>
                  +2.96%
                </span>
              </div>

              {/* Floating 3D Glass Card 2 (Bottom Right) */}
              <div className={styles.floatingGlassCard2}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C5CE7', border: '1px solid #DDD6FE' }}>
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Teacher Workstation</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0F172A' }}>32 Esai Menunggu Koreksi</div>
                </div>
              </div>

              {/* Floating 3D Badge (Bottom Left) */}
              <div className={styles.floatingBadgeGradient}>
                <Sparkles size={14} />
                <span>Mass Grader Aktif</span>
              </div>
            </div>
          </div>

          {/* 3-Column Hero Feature Ticker Bar (media_1790964832641.png) */}
          <div className={styles.heroTickerRow}>
            <div className={styles.heroTickerItem}>
              <div className={styles.tickerDot} style={{ background: '#00CEC9', boxShadow: '0 0 8px #00CEC9' }} />
              <div>
                <h4 className={styles.tickerTitle}>Presensi Real-Time 1-Klik</h4>
                <p className={styles.tickerDesc}>Presensi kilat kartu QR siswa &amp; rekap kehadiran otomatis.</p>
              </div>
            </div>

            <div className={styles.heroTickerItem}>
              <div className={styles.tickerDot} style={{ background: '#6C5CE7', boxShadow: '0 0 8px #6C5CE7' }} />
              <div>
                <h4 className={styles.tickerTitle}>Local Dapodik Bridge</h4>
                <p className={styles.tickerDesc}>Sinkronisasi dua arah dari database PostgreSQL Dapodik lokal.</p>
              </div>
            </div>

            <div className={styles.heroTickerItem}>
              <div className={styles.tickerDot} style={{ background: '#EC4899', boxShadow: '0 0 8px #EC4899' }} />
              <div>
                <h4 className={styles.tickerTitle}>Buku Digital SIBI Kemdikdasmen</h4>
                <p className={styles.tickerDesc}>Ribuan buku kurikulum resmi &amp; modul ujian CBT interaktif.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         3. 3-STEP IMPLEMENTATION SECTION (media_1790964851896.png)
         ══════════════════════════════════════════════════════════ */}
      <section id="process" className={styles.processSection}>
        <div className={styles.watermarkText}>GET STARTED</div>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <h2 className={styles.sectionTitle}>
              Implementasi Sekolah Modern dalam 3 Langkah
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDot} />
              <span className={styles.accentBar} />
            </div>
            <p className={styles.sectionSubtitle}>
              Hanya butuh beberapa menit tanpa konfigurasi rumit. Terintegrasi penuh di web browser guru,
              smartphone Android siswa, serta server lokal sekolah.
            </p>
          </div>

          {/* 3 Spherical Floating Medallions with Horizontal Connectors */}
          <div className={styles.stepsMedallionRow}>
            {/* Step 1 */}
            <div className={styles.stepItemCol}>
              <div className={`${styles.stepMedallionSphere} ${styles.spherePurple}`}>
                <FolderSync size={46} strokeWidth={2.2} />
              </div>
              <h3 className={styles.stepItemTitle}>1. Hubungkan Local Bridge</h3>
              <p className={styles.stepItemDesc}>
                Jalankan agen daemon Rust lokal di server sekolah. Data Dapodik, rombel, guru,
                dan peserta didik langsung tersinkronisasi otomatis tanpa entri ulang ganda.
              </p>
            </div>

            {/* Connector 1 */}
            <div className={styles.stepConnectorTrack}>
              <div className={styles.connectorDot} style={{ background: '#00CEC9' }} />
              <div className={styles.connectorPill} style={{ background: 'linear-gradient(90deg, #00CEC9, #6C5CE7)' }} />
            </div>

            {/* Step 2 */}
            <div className={styles.stepItemCol}>
              <div className={`${styles.stepMedallionSphere} ${styles.sphereCyan}`}>
                <QrCode size={46} strokeWidth={2.2} />
              </div>
              <h3 className={styles.stepItemTitle}>2. Aktivasi Kartu QR Siswa</h3>
              <p className={styles.stepItemDesc}>
                Cetak kartu QR login instan untuk peserta didik. Siswa dan guru dapat langsung
                masuk ke sistem CBT dan absensi kelas tanpa risiko lupa sandi.
              </p>
            </div>

            {/* Connector 2 */}
            <div className={styles.stepConnectorTrack}>
              <div className={styles.connectorDot} style={{ background: '#6C5CE7' }} />
              <div className={styles.connectorPill} style={{ background: 'linear-gradient(90deg, #6C5CE7, #EC4899)' }} />
            </div>

            {/* Step 3 */}
            <div className={styles.stepItemCol}>
              <div className={`${styles.stepMedallionSphere} ${styles.spherePink}`}>
                <GraduationCap size={46} strokeWidth={2.2} />
              </div>
              <h3 className={styles.stepItemTitle}>3. Jalankan Workstation &amp; LMS</h3>
              <p className={styles.stepItemDesc}>
                Guru langsung mengelola jadwal mengajar, modul bacaan SIBI Kemdikdasmen,
                dan koreksi massal esai dengan efisiensi waktu hingga 70%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         4. SOLID ROYAL PURPLE CARD (media_1790964865136.png)
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.highlightSection}>
        <div className={styles.container}>
          <div className={styles.highlightCard}>
            <div className={styles.ambientSphereTopLeft} />

            <div className={styles.highlightLeft}>
              <h2 className={styles.highlightTitle}>
                Pantau Kinerja Akademik &amp; Sistem Real-Time
              </h2>
              <div className={styles.accentLine}>
                <span className={styles.accentDot} style={{ background: '#00CEC9' }} />
                <span className={styles.accentBar} style={{ background: 'linear-gradient(90deg, #00CEC9, rgba(0, 206, 201, 0.3))' }} />
              </div>
              <p className={styles.highlightSubtitle}>
                Didesain dengan arsitektur Event-Driven dan Clean Architecture (ADR-0001).
                Seluruh aktivitas presensi, penilaian, dan pembacaan buku teragregasi
                dengan latensi sub-detik melalui Rust Axum core engine.
              </p>
              <Link href="/dashboard" className={styles.highlightBtn}>
                <span>Eksplorasi Fitur Lengkap</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Wide Area Sparkline Rows (Crypto Table Layout in Figma) */}
            <div className={styles.sparklineList}>
              {/* Row 1: Dapodik Local Bridge */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                    <FolderSync size={20} />
                  </div>
                  <div>
                    <div className={styles.sparklineName}>DAPODIK SYNC</div>
                    <div className={styles.sparklineMeta}>3.420 Rekor Selaras</div>
                  </div>
                </div>
                <svg className={styles.sparklineAreaSvg} viewBox="0 0 160 38" fill="none">
                  <defs>
                    <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 28 Q 20 8, 40 20 T 80 10 T 120 16 T 160 4 L 160 38 L 0 38 Z" fill="url(#areaGreen)" />
                  <path d="M0 28 Q 20 8, 40 20 T 80 10 T 120 16 T 160 4" stroke="#34D399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <div className={styles.sparklineChange} style={{ color: '#34D399' }}>
                  ▲ +100%
                </div>
              </div>

              {/* Row 2: Attendance Rate */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: 'linear-gradient(135deg, #00CEC9 0%, #0891B2 100%)' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <div className={styles.sparklineName}>PRESENSI SISWA</div>
                    <div className={styles.sparklineMeta}>98.4% Hadir Pekan Ini</div>
                  </div>
                </div>
                <svg className={styles.sparklineAreaSvg} viewBox="0 0 160 38" fill="none">
                  <defs>
                    <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00CEC9" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#00CEC9" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 32 Q 30 18, 60 26 T 110 8 T 160 2 L 160 38 L 0 38 Z" fill="url(#areaCyan)" />
                  <path d="M0 32 Q 30 18, 60 26 T 110 8 T 160 2" stroke="#00CEC9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <div className={styles.sparklineChange} style={{ color: '#00CEC9' }}>
                  ▲ +3.2%
                </div>
              </div>

              {/* Row 3: Mass Grader */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)' }}>
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <div className={styles.sparklineName}>MASS GRADER</div>
                    <div className={styles.sparklineMeta}>4.120 Esai Terselesaikan</div>
                  </div>
                </div>
                <svg className={styles.sparklineAreaSvg} viewBox="0 0 160 38" fill="none">
                  <defs>
                    <linearGradient id="areaPink" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F472B6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#F472B6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 24 Q 25 10, 50 18 T 100 6 T 160 2 L 160 38 L 0 38 Z" fill="url(#areaPink)" />
                  <path d="M0 24 Q 25 10, 50 18 T 100 6 T 160 2" stroke="#F472B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <div className={styles.sparklineChange} style={{ color: '#F472B6' }}>
                  ▲ 99.1%
                </div>
              </div>

              {/* Row 4: SIBI Digital Books */}
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineLeft}>
                  <div className={styles.sparklineIcon} style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className={styles.sparklineName}>SIBI KEMDIKDASMEN</div>
                    <div className={styles.sparklineMeta}>1.250 Eksemplar Dibaca</div>
                  </div>
                </div>
                <svg className={styles.sparklineAreaSvg} viewBox="0 0 160 38" fill="none">
                  <defs>
                    <linearGradient id="areaViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C084FC" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#C084FC" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 30 Q 35 22, 70 12 T 120 18 T 160 6 L 160 38 L 0 38 Z" fill="url(#areaViolet)" />
                  <path d="M0 30 Q 35 22, 70 12 T 120 18 T 160 6" stroke="#C084FC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
                <div className={styles.sparklineChange} style={{ color: '#C084FC' }}>
                  ▲ +450
                </div>
              </div>

              {/* Explore More link in Cyan */}
              <a href="#features" className={styles.sparklineExploreLink}>
                <span>Lihat Semua Metrik Sistem</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         5. FEATURE SECTION 1: TEACHER WORKSTATION (media_1790964895957.png)
         ══════════════════════════════════════════════════════════ */}
      <section id="features" className={styles.featureSection}>
        <div className={styles.container}>
          <div className={styles.featureGrid}>
            {/* Visual Composite with Circular Portal & Studio Cutout Photo */}
            <div className={styles.featureVisualComposite}>
              {/* Circular Portal Frame with Luminous Gradient */}
              <div className={styles.featureCirclePortal}>
                <Image
                  src="/teacher-phone.jpg"
                  alt="Guru Akselerasi-Edu menggunakan Teacher Workstation di ponsel"
                  width={360}
                  height={360}
                  className={styles.featurePersonPhoto}
                  priority
                />
              </div>

              {/* Floating Stat Card 1 (Top Left) */}
              <div className={styles.featureFloatingCard1}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Presensi Cepat 1-Klik</div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0F172A' }}>38/38 Siswa Hadir</div>
                  </div>
                </div>
              </div>

              {/* Floating Stat Card 2 (Bottom Right) */}
              <div className={styles.featureFloatingCard2}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C5CE7', border: '1px solid #DDD6FE' }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Mass Grader Esai</div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0F172A' }}>92% Tugas Terperiksa</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Content */}
            <div className={styles.featureContent}>
              <div className={styles.featureBadge}>
                <GraduationCap size={14} color="#6C5CE7" />
                <span>TEACHER WORKSTATION</span>
              </div>

              <h2 className={styles.featureTitle}>
                Beban Administrasi Guru Berkurang hingga 70%
              </h2>

              <div className={styles.accentLine}>
                <span className={styles.accentDot} />
                <span className={styles.accentBar} />
              </div>

              <p className={styles.featureSubtitle}>
                Dirancang khusus dari hasil riset lapangan bersama puluhan tenaga pendidik.
                Guru tidak lagi dipusingkan oleh rekap presensi berbelit atau koreksi ratusan esai
                secara manual.
              </p>

              {/* Feature Benefit Checklist with Custom Check Medallions */}
              <ul className={styles.featureList}>
                <li className={styles.featureListItem}>
                  <div className={styles.featureCheckIcon}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Action Center Cerdas:</strong> Menyoroti seketika siswa yang membutuhkan perhatian khusus dan tugas yang menunggu penilaian.
                  </span>
                </li>
                <li className={styles.featureListItem}>
                  <div className={styles.featureCheckIcon}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Presensi 1-Klik &amp; Scan QR:</strong> Catat kehadiran satu kelas hanya dalam hitungan detik tanpa memanggil nama satu per satu.
                  </span>
                </li>
                <li className={styles.featureListItem}>
                  <div className={styles.featureCheckIcon}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Mass Grader Esai:</strong> Rubrik penilaian terstruktur yang memungkinkan penilaian cepat puluhan tugas siswa dalam satu layar.
                  </span>
                </li>
              </ul>

              <div style={{ marginTop: '10px' }}>
                <Link href="/dashboard" className={styles.ctaPillPurple}>
                  <span>Buka Workstation Guru</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         6. ARCHITECTURE SECTION (media_1790964914283.png)
         ══════════════════════════════════════════════════════════ */}
      <section id="architecture" className={styles.featureSection} style={{ background: '#F8F9FE' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.featureBadge}>
              <Cpu size={14} color="#6C5CE7" />
              <span>ARSITEKTUR &amp; PERFORMA</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Dibangun dengan Rust &amp; Clean DDD untuk Keandalan Maksimal
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDot} />
              <span className={styles.accentBar} />
            </div>
            <p className={styles.sectionSubtitle}>
              Menjawab tantangan server sekolah yang sering tumbang saat ujian massal.
              Arsitektur Axum Rust memberikan performa kilat, penggunaan memori minimal, dan isolasi data ketat.
            </p>
          </div>

          {/* Architecture Switcher Tabs */}
          <div className={styles.archTabsRow}>
            <button
              onClick={() => setActiveArchTab('RUST')}
              className={`${styles.archTabBtn} ${activeArchTab === 'RUST' ? styles.archTabBtnActive : ''}`}
            >
              <Server size={15} />
              <span>Rust Axum Core API</span>
            </button>
            <button
              onClick={() => setActiveArchTab('BRIDGE')}
              className={`${styles.archTabBtn} ${activeArchTab === 'BRIDGE' ? styles.archTabBtnActive : ''}`}
            >
              <FolderSync size={15} />
              <span>Dapodik Local Bridge</span>
            </button>
            <button
              onClick={() => setActiveArchTab('DDD')}
              className={`${styles.archTabBtn} ${activeArchTab === 'DDD' ? styles.archTabBtnActive : ''}`}
            >
              <Layers size={15} />
              <span>Clean Architecture DDD</span>
            </button>
            <button
              onClick={() => setActiveArchTab('MOBILE')}
              className={`${styles.archTabBtn} ${activeArchTab === 'MOBILE' ? styles.archTabBtnActive : ''}`}
            >
              <Smartphone size={15} />
              <span>Native Android App</span>
            </button>
          </div>

          {/* Interactive Code Preview Box & Specification */}
          <div className={styles.featureGridReverse}>
            {/* Left: 3D Tilted Dark Mac Code Card */}
            <div className={styles.codeSpecCard}>
              <div className={styles.codeMacHeader}>
                <div className={styles.codeMacDots}>
                  <span className={`${styles.codeMacDot} ${styles.codeMacDotRed}`} />
                  <span className={`${styles.codeMacDot} ${styles.codeMacDotYellow}`} />
                  <span className={`${styles.codeMacDot} ${styles.codeMacDotGreen}`} />
                </div>
                <span className={styles.codeFilePath}>
                  {activeArchTab === 'RUST' && 'api-server/src/presentation/materials/controller.rs'}
                  {activeArchTab === 'BRIDGE' && 'local-bridge-agent/src/sync/daemon.rs'}
                  {activeArchTab === 'DDD' && 'core/domain/tenant/model.rs'}
                  {activeArchTab === 'MOBILE' && 'android/app/src/main/java/ReaderActivity.kt'}
                </span>
                <span className={styles.codeTag}>
                  {activeArchTab === 'RUST' && 'Rust 1.80+ Axum'}
                  {activeArchTab === 'BRIDGE' && 'Tokio Async Daemon'}
                  {activeArchTab === 'DDD' && 'Clean Architecture'}
                  {activeArchTab === 'MOBILE' && 'Kotlin Coroutines'}
                </span>
              </div>

              {/* Code Snippet */}
              <pre className={styles.codeContent}>
                {activeArchTab === 'RUST' && (
`// Handler Axum Rust dengan isolasi multi-tenant ketat
pub async fn submit_material_progress(
    State(ctx): State<Arc<AppContext>>,
    Extension(tenant): Extension<TenantContext>,
    Json(payload): Json<ProgressPayload>,
) -> Result<impl IntoResponse, AppError> {
    // Audit log & event idempotency
    let event = StudentCompletedMaterialEvent::new(
        tenant.id, payload.student_id, payload.material_id
    );
    ctx.outbox.dispatch(event).await?;
    Ok(StatusCode::ACCEPTED)
}`
                )}
                {activeArchTab === 'BRIDGE' && (
`// Local Bridge Daemon menghubungkan PostgreSQL Dapodik (5432)
pub async fn sync_dapodik_incremental(
    local_pool: &PgPool,
    cloud_client: &ApiClient,
) -> Result<SyncSummary, BridgeError> {
    let uncommitted = dapodik::query_uncommitted_roster(local_pool).await?;
    let batch = StreamChunk::from(uncommitted);
    let ack = cloud_client.push_roster_batch(batch).await?;
    dapodik::mark_synced(local_pool, ack.ids).await?;
    Ok(SyncSummary::ok(ack.count))
}`
                )}
                {activeArchTab === 'DDD' && (
`// Domain Model: Tenant & Role-Based Access Control
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantContext {
    pub npsn: String,
    pub school_id: Uuid,
    pub active_academic_year: String,
    pub subscription_tier: Tier,
}

impl TenantContext {
    pub fn enforce_isolation(&self, query_npsn: &str) -> Result<(), SecurityError> {
        if self.npsn != query_npsn {
            return Err(SecurityError::TenantBoundaryViolation);
        }
        Ok(())
    }
}`
                )}
                {activeArchTab === 'MOBILE' && (
`// Offline-first Android SIBI Reader dengan Enkripsi Cache
class SibiReaderViewModel(private val repository: SibiRepository) : ViewModel() {
    val materialStream = repository.observeMaterialWithCache(materialId)
        .catch { emit(MaterialUiState.OfflineFallback) }
        .stateIn(viewModelScope, SharingStarted.Lazily, MaterialUiState.Loading)

    fun markCompleted() = viewModelScope.launch {
        repository.queueOfflineSync(SyncPayload(materialId, System.currentTimeMillis()))
    }
}`
                )}
              </pre>

              {/* Latency & Resource Metrics */}
              <div className={styles.codeMetricsRow}>
                <div className={styles.codeMetric}>
                  <span className={styles.codeMetricLabel}>Cold Start Latency</span>
                  <span className={styles.codeMetricVal}>&lt; 1.6s</span>
                </div>
                <div className={styles.codeMetric}>
                  <span className={styles.codeMetricLabel}>Memory Footprint</span>
                  <span className={styles.codeMetricVal}>~18 MB RAM</span>
                </div>
                <div className={styles.codeMetric}>
                  <span className={styles.codeMetricLabel}>Garbage Collection</span>
                  <span className={styles.codeMetricVal}>0 ms (Zero GC)</span>
                </div>
              </div>
            </div>

            {/* Right: Technical Explanation */}
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>
                {activeArchTab === 'RUST' && 'Performa Kilat Tanpa Beban Runtime'}
                {activeArchTab === 'BRIDGE' && 'Sinkronisasi Otomatis Tanpa Entri Ganda'}
                {activeArchTab === 'DDD' && 'Struktur Kode Bersih & Skalabilitas Tinggi'}
                {activeArchTab === 'MOBILE' && 'Aplikasi Siswa Nyaman Digunakan Offline'}
              </h3>

              <div className={styles.accentLine}>
                <span className={styles.accentDot} />
                <span className={styles.accentBar} />
              </div>

              <p className={styles.featureSubtitle}>
                {activeArchTab === 'RUST' &&
                  'Dibangun di atas framework web Axum dan Tokio runtime async di bahasa Rust. Menghasilkan respons secepat kilat bahkan saat ribuan siswa mengakses ujian serentak.'}
                {activeArchTab === 'BRIDGE' &&
                  'Aplikasi Dapodik lokal sekolah tetap menjadi sumber kebenaran (source of truth). Local Bridge membaca langsung PostgreSQL lokal dan melakukan sinkronisasi dua arah secara aman.'}
                {activeArchTab === 'DDD' &&
                  'Menerapkan Domain-Driven Design dengan pemisahan Domain, Use Cases, dan Infrastructure. Memastikan logika bisnis sekolah terlindungi dan mudah dirawat jangka panjang.'}
                {activeArchTab === 'MOBILE' &&
                  'Siswa dapat membaca buku SIBI Kemdikdasmen dan mengerjakan modul pembelajaran tanpa perlu internet stabil sepanjang waktu. Data tersimpan aman di database SQLite lokal.'}
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureListItem}>
                  <div className={styles.featureCheckIcon}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Multi-Tenant Isolation (ADR-0004):</strong> Basis data terenkripsi dan tersekat rapi per NPSN sekolah mitra.
                  </span>
                </li>
                <li className={styles.featureListItem}>
                  <div className={styles.featureCheckIcon}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Idempotent Event Sourcing:</strong> Mencegah duplikasi data absensi atau tugas ganda akibat jaringan tidak stabil.
                  </span>
                </li>
                <li className={styles.featureListItem}>
                  <div className={styles.featureCheckIcon}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Keamanan Standar Industri:</strong> Enkripsi kata sandi Argon2, JWT token klaim bertingkat, dan TLS 1.3.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         7. INTERSECTING DUAL-CIRCLE ECOSYSTEM (media_1790965024224.png)
         ══════════════════════════════════════════════════════════ */}
      <section id="ecosystem" className={styles.ecosystemSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.featureBadge}>
              <Users size={14} color="#6C5CE7" />
              <span>KOLABORASI SEMUA PIHAK</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Ekosistem Pendidikan yang Menghubungkan Semua Pihak
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDot} />
              <span className={styles.accentBar} />
            </div>
            <p className={styles.sectionSubtitle}>
              Akselerasi-Edu menjembatani komunikasi transparan antara pendidik, peserta didik,
              wali murid, dan manajemen sekolah dalam satu kesatuan sistem.
            </p>
          </div>

          {/* Dual Intersecting Circular Frames with Studio Portraits */}
          <div className={styles.dualOrbitWrapper}>
            <div className={styles.orbitCirclePurple}>
              <Image
                src="/teacher-phone.jpg"
                alt="Pendidik modern menggunakan ponsel"
                width={240}
                height={240}
                className={styles.featurePersonPhoto}
              />
            </div>
            <div className={styles.orbitCircleCyan}>
              <Image
                src="/teacher-laptop.jpg"
                alt="Pendidik menggunakan laptop di kelas"
                width={240}
                height={240}
                className={styles.featurePersonPhoto}
              />
            </div>
          </div>

          {/* 4 Role Cards Grid */}
          <div className={styles.roleCardsGrid}>
            {/* Role 1: Guru */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconBox} style={{ background: '#F5F3FF', color: '#6C5CE7' }}>
                <GraduationCap size={24} />
              </div>
              <h4 className={styles.roleTitle}>Guru &amp; Pendidik</h4>
              <p className={styles.roleDesc}>
                Workstation mengajar modern, pembuatan tugas cepat, koreksi esai massal, dan presensi 1-klik.
              </p>
              <span className={styles.roleBadge} style={{ background: '#F5F3FF', color: '#6C5CE7' }}>
                Workstation Web &amp; Tablet
              </span>
            </div>

            {/* Role 2: Siswa */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconBox} style={{ background: '#ECFEFF', color: '#00CEC9' }}>
                <BookOpen size={24} />
              </div>
              <h4 className={styles.roleTitle}>Peserta Didik</h4>
              <p className={styles.roleDesc}>
                Akses ribuan buku digital SIBI Kemdikdasmen, CBT interaktif, materi video, dan kartu QR instan.
              </p>
              <span className={styles.roleBadge} style={{ background: '#ECFEFF', color: '#00CEC9' }}>
                Android &amp; iOS Mobile App
              </span>
            </div>

            {/* Role 3: Orang Tua */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconBox} style={{ background: '#FCE7F3', color: '#EC4899' }}>
                <Users size={24} />
              </div>
              <h4 className={styles.roleTitle}>Wali Murid</h4>
              <p className={styles.roleDesc}>
                Parent Portal untuk memantau rekap absensi harian, nilai akademik, dan komunikasi langsung dengan wali kelas.
              </p>
              <span className={styles.roleBadge} style={{ background: '#FCE7F3', color: '#EC4899' }}>
                Parent Portal Web &amp; Notifikasi
              </span>
            </div>

            {/* Role 4: Pimpinan */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconBox} style={{ background: '#ECFDF5', color: '#10B981' }}>
                <BarChart3 size={24} />
              </div>
              <h4 className={styles.roleTitle}>Pimpinan Sekolah</h4>
              <p className={styles.roleDesc}>
                Dashboard analitik eksekutif tentang tingkat kehadiran, ketercapaian kurikulum, dan sinkronisasi Dapodik.
              </p>
              <span className={styles.roleBadge} style={{ background: '#ECFDF5', color: '#10B981' }}>
                Executive Analytics Dashboard
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         8. STATS COUNTER ROW (media_1790965043539.png)
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>+50</div>
              <div className={styles.statPillBarCyan} />
              <div className={styles.statLabel}>Sekolah Siap Implementasi</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>+120K</div>
              <div className={styles.statPillBarPurple} />
              <div className={styles.statLabel}>Siswa &amp; Guru Terhubung</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>&lt; 1.6s</div>
              <div className={styles.statPillBarCyan} />
              <div className={styles.statLabel}>Cold-start Latensi Rust Core</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>99.98%</div>
              <div className={styles.statPillBarPink} />
              <div className={styles.statLabel}>SLA Ketersediaan Sistem</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         9. FAQ SECTION (media_1790965109963.png)
         ══════════════════════════════════════════════════════════ */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.featureBadge}>
              <ShieldCheck size={14} color="#6C5CE7" />
              <span>PERTANYAAN UMUM</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Pertanyaan yang Sering Diajukan
            </h2>
            <div className={styles.accentLine}>
              <span className={styles.accentDot} />
              <span className={styles.accentBar} />
            </div>
            <p className={styles.sectionSubtitle}>
              Temukan jawaban seputar integrasi Dapodik, keamanan multi-tenant, dan kemudahan implementasi.
            </p>
          </div>

          <div className={styles.faqGrid}>
            {/* Left: Presenter Photo Cutout inside Organic Petal Shape */}
            <div className={styles.faqPresenterCol}>
              <div className={styles.faqPresenterShape}>
                <Image
                  src="/faq-presenter.jpg"
                  alt="Konsultan Akselerasi-Edu siap menjawab pertanyaan sekolah"
                  width={320}
                  height={380}
                  className={styles.featurePersonPhoto}
                />
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>Butuh Konsultasi Lanjutan?</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px' }}>Tim spesialis kami siap mendemonstrasikan sistem ke sekolah Anda.</div>
              </div>
            </div>

            {/* Right: Accordion FAQ List */}
            <div className={styles.faqList}>
              {faqs.map((faq, idx) => {
                const isExpanded = activeFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveFaqIndex(isExpanded ? -1 : idx)}
                    className={isExpanded ? styles.faqItemExpanded : styles.faqItemCollapsed}
                  >
                    <div className={styles.faqQuestionRow}>
                      <h4 className={styles.faqQuestion}>{faq.q}</h4>
                      {isExpanded ? (
                        <ChevronUp size={22} color="#FFFFFF" />
                      ) : (
                        <ChevronDown size={22} color="#6C5CE7" />
                      )}
                    </div>
                    {isExpanded && <p className={styles.faqAnswer}>{faq.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         10. CALL TO ACTION BANNER (media_1790965085101.png)
         ══════════════════════════════════════════════════════════ */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.container}>
          <div className={styles.ctaBannerCard}>
            <div>
              <h2 className={styles.ctaBannerTitle}>
                Siap Modernisasi Sekolah Anda Hari Ini?
              </h2>
              <p className={styles.ctaBannerSubtitle}>
                Tingkatkan efisiensi kerja guru, integrasikan buku digital SIBI, dan nikmati sinkronisasi Dapodik otomatis.
              </p>
            </div>
            <div className={styles.storeBadgesRow}>
              <Link href="/dashboard" className={styles.ctaPillPurple}>
                <span>Coba Demo Sistem</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/login" className={styles.ctaOutlinePurple}>
                <span>Masuk ke Akun</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         11. FOOTER (Light Mode)
         ══════════════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            {/* Col 1: Brand Info */}
            <div className={styles.footerCol}>
              <div className={styles.logoGroup}>
                <div className={styles.logoOrb}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className={styles.logoText}>
                  <span>AKSELERASI</span>
                  <span className={styles.logoBadge}>EDU</span>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.65', margin: '8px 0 0' }}>
                Operating System sekolah modern berbasis Rust Axum dan Clean Architecture. Menghubungkan guru, peserta didik, dan Dapodik secara mulus.
              </p>
            </div>

            {/* Col 2: Fitur & Modul */}
            <div className={styles.footerCol}>
              <h5 className={styles.footerColTitle}>Fitur Utama</h5>
              <ul className={styles.footerLinks}>
                <li><Link href="/dashboard" className={styles.footerLink}>Teacher Workstation</Link></li>
                <li><Link href="/dashboard" className={styles.footerLink}>Presensi Kelas 1-Klik</Link></li>
                <li><Link href="/dashboard" className={styles.footerLink}>Buku Digital SIBI</Link></li>
                <li><Link href="/dashboard" className={styles.footerLink}>Mass Grader Esai</Link></li>
                <li><Link href="/dashboard" className={styles.footerLink}>Kartu QR Siswa</Link></li>
              </ul>
            </div>

            {/* Col 3: Arsitektur */}
            <div className={styles.footerCol}>
              <h5 className={styles.footerColTitle}>Teknologi</h5>
              <ul className={styles.footerLinks}>
                <li><a href="#architecture" className={styles.footerLink}>Rust Axum Core</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Dapodik Local Bridge</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Clean Architecture DDD</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Multi-Tenant Security</a></li>
                <li><a href="#architecture" className={styles.footerLink}>Offline-First Android</a></li>
              </ul>
            </div>

            {/* Col 4: Hubungi Kami */}
            <div className={styles.footerCol}>
              <h5 className={styles.footerColTitle}>Akses Cepat</h5>
              <ul className={styles.footerLinks}>
                <li><Link href="/login" className={styles.footerLink}>Masuk Akun Guru</Link></li>
                <li><Link href="/login" className={styles.footerLink}>Portal Siswa</Link></li>
                <li><Link href="/login" className={styles.footerLink}>Parent Portal</Link></li>
                <li><a href="#faq" className={styles.footerLink}>Pusat Bantuan &amp; FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>
              &copy; {new Date().getFullYear()} Akselerasi-Edu. Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#" className={styles.footerLink}>Ketentuan Layanan</a>
              <a href="#" className={styles.footerLink}>Kebijakan Privasi</a>
              <a href="#" className={styles.footerLink}>Standar Keamanan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
