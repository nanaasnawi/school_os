'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [activePreviewTab, setActivePreviewTab] = useState<'overview' | 'dapodik' | 'rapor' | 'presensi' | 'cbt'>('overview');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Ambient background glow orbs */}
      <div className={styles.bgGlow1} aria-hidden="true" />
      <div className={styles.bgGlow2} aria-hidden="true" />
      <div className={styles.bgGlow3} aria-hidden="true" />

      {/* Top Announcement Banner */}
      <div className={styles.topBanner}>
        <span className={styles.bannerTag}>Baru</span>
        <span>✨ <strong>School OS v1.0</strong>: Integrasi Penuh WebService Dapodik Kemendikbud &amp; e-Rapor Kurikulum Merdeka</span>
      </div>

      {/* Navigation Header */}
      <header className={styles.navHeader}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.brandLogo}>
            <div className={styles.brandIcon}>
              <svg viewBox="0 0 64 64" fill="none" width="36" height="36">
                <defs>
                  <linearGradient id="lgLandingBrand" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563EB" />
                    <stop offset="0.5" stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="18" fill="url(#lgLandingBrand)" />
                <path d="M32 12L48 20V32C48 43.5 40.5 51.5 32 55C23.5 51.5 16 43.5 16 32V20L32 12Z" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="2.2" />
                <path d="M32 20L46 27L32 34L18 27L32 20Z" fill="white" />
                <path d="M23 31V37.5C23 40.5 27 42.5 32 42.5C37 42.5 41 40.5 41 37.5V31" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </div>
            <span>School OS</span>
            <span className={styles.versionBadge}>v1.0 Core</span>
          </Link>

          <nav>
            <ul className={styles.navMenu}>
              <li><a href="#preview" className={styles.navLink}>Fitur Utama</a></li>
              <li><a href="#modules" className={styles.navLink}>Modul Sistem</a></li>
              <li><a href="#roles" className={styles.navLink}>Portal Peran</a></li>
              <li><a href="#faq" className={styles.navLink}>Tanya Jawab</a></li>
            </ul>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.ghostBtn}>
              Masuk Akun
            </Link>
            <Link href="/dashboard" className={styles.primaryNavBtn}>
              <span>Buka Dashboard</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>
            <span className={styles.heroDot} />
            <span>Sistem Manajemen Sekolah &amp; Akademik Generasi Baru</span>
          </div>

          <h1 className={styles.heroTitle}>
            Platform Cerdas untuk <span className={styles.gradientText}>Digitalisasi Sekolah</span> &amp; Integrasi Dapodik
          </h1>

          <p className={styles.heroSubtitle}>
            Solusi tata kelola akademik modern dengan performa tinggi: sinkronisasi otomatis Dapodik, pencetakan e-Rapor Kurikulum Merdeka, presensi QR pintar, dan portal multi-peran untuk seluruh komunitas sekolah.
          </p>

          <div className={styles.heroActions}>
            <Link href="/dashboard" className={styles.ctaBtnPrimary}>
              <span>🚀 Buka Dashboard Utama</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link href="/login" className={styles.ctaBtnSecondary}>
              <span>🔐 Masuk Portal Login</span>
            </Link>
          </div>

          {/* ── Interactive Live Dashboard Preview Mockup ── */}
          <div id="preview" className={styles.mockupContainer}>
            <div className={styles.mockupWindow}>
              {/* Window Topbar */}
              <div className={styles.mockupHeader}>
                <div className={styles.windowDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <div className={styles.mockupTitle}>
                  <span>🏫 School OS Workspace — PKBM As-Salafiyah (NPSN: P2962010)</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                  ● System Online (5ms)
                </div>
              </div>

              {/* Sub-Tabs Nav */}
              <div className={styles.mockupNavTabs}>
                <button
                  className={`${styles.mockupTabBtn} ${activePreviewTab === 'overview' ? styles.mockupTabActive : ''}`}
                  onClick={() => setActivePreviewTab('overview')}
                >
                  📊 Ringkasan Sekolah
                </button>
                <button
                  className={`${styles.mockupTabBtn} ${activePreviewTab === 'dapodik' ? styles.mockupTabActive : ''}`}
                  onClick={() => setActivePreviewTab('dapodik')}
                >
                  🔄 Dapodik Hub &amp; Sinkronisasi
                </button>
                <button
                  className={`${styles.mockupTabBtn} ${activePreviewTab === 'rapor' ? styles.mockupTabActive : ''}`}
                  onClick={() => setActivePreviewTab('rapor')}
                >
                  📄 e-Rapor &amp; Kurikulum Merdeka
                </button>
                <button
                  className={`${styles.mockupTabBtn} ${activePreviewTab === 'presensi' ? styles.mockupTabActive : ''}`}
                  onClick={() => setActivePreviewTab('presensi')}
                >
                  📱 Presensi QR &amp; Kartu Pelajar
                </button>
                <button
                  className={`${styles.mockupTabBtn} ${activePreviewTab === 'cbt' ? styles.mockupTabActive : ''}`}
                  onClick={() => setActivePreviewTab('cbt')}
                >
                  📝 Ujian Online CBT
                </button>
              </div>

              {/* Mockup Dynamic Content Body */}
              <div className={styles.mockupBody}>
                {activePreviewTab === 'overview' && (
                  <div>
                    <div className={styles.mockupMetricGrid}>
                      <div className={styles.mockupCard}>
                        <div className={styles.mockupCardIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>👥</div>
                        <div>
                          <div className={styles.mockupCardVal}>287</div>
                          <div className={styles.mockupCardLabel}>Peserta Didik Aktif</div>
                        </div>
                      </div>
                      <div className={styles.mockupCard}>
                        <div className={styles.mockupCardIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>👨‍🏫</div>
                        <div>
                          <div className={styles.mockupCardVal}>18</div>
                          <div className={styles.mockupCardLabel}>Pendidik &amp; GTK</div>
                        </div>
                      </div>
                      <div className={styles.mockupCard}>
                        <div className={styles.mockupCardIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>🏫</div>
                        <div>
                          <div className={styles.mockupCardVal}>19</div>
                          <div className={styles.mockupCardLabel}>Rombel Belajar</div>
                        </div>
                      </div>
                      <div className={styles.mockupCard}>
                        <div className={styles.mockupCardIcon} style={{ background: 'rgba(147, 51, 234, 0.15)', color: '#c084fc' }}>📚</div>
                        <div>
                          <div className={styles.mockupCardVal}>16</div>
                          <div className={styles.mockupCardLabel}>Mata Pelajaran</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>⚡ Status Infrastruktur &amp; Rekonsiliasi Master Data</span>
                        <span className="badge badge-active" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                          ✓ Sinkron dengan Dapodik Localhost
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                        <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                          <span style={{ color: '#94a3b8' }}>API Engine:</span> <strong>Rust Microservice (&lt; 5ms)</strong>
                        </div>
                        <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                          <span style={{ color: '#94a3b8' }}>Database:</span> <strong>PostgreSQL Multi-Tenant</strong>
                        </div>
                        <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                          <span style={{ color: '#94a3b8' }}>Kurikulum:</span> <strong>Kurikulum Merdeka 2026/2027</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'dapodik' && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>🔄 Dapodik WebService Localhost Bridge</h4>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Terhubung ke http://127.0.0.1:5774 (Port 5774 Kemendikbudristek)</p>
                      </div>
                      <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                        ● WebService Authorized (200 OK)
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Peserta Didik Terverifikasi</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>287 Siswa</div>
                      </div>
                      <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Data Orang Tua &amp; Wali</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>Tersinkron Otomatis</div>
                      </div>
                      <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mata Pelajaran &amp; Rombel</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc' }}>16 Mapel / 19 Kelas</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'rapor' && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(147, 51, 234, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📄 Format e-Rapor Kurikulum Merdeka &amp; K13</h4>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Cetak buku rapor digital resmi berstandar Kemendikdasmen dengan tanda tangan elektronik</p>
                      </div>
                      <span style={{ background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                        Siap Cetak PDF &amp; QR Validasi
                      </span>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>Pendidikan Agama Islam dan Budi Pekerti</span>
                        <strong style={{ color: '#34d399' }}>Nilai: 92 (A) — Sangat Mahir</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>Bahasa Indonesia</span>
                        <strong style={{ color: '#34d399' }}>Nilai: 88 (B+) — Mahir</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Matematika (Umum)</span>
                        <strong style={{ color: '#34d399' }}>Nilai: 90 (A) — Sangat Mahir</strong>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'presensi' && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📱 Presensi Real-Time &amp; Kartu QR Siswa</h4>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Scan kartu QR instan via smartphone / webcam sekolah</p>
                      </div>
                      <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                        Kehadiran Hari Ini: 97.4%
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Hadir Tepat Waktu</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>279 Siswa</div>
                      </div>
                      <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Izin / Sakit</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>8 Siswa</div>
                      </div>
                      <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Notifikasi WhatsApp Wali</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>Terkirim Otomatis</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'cbt' && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📝 Computer-Based Test (CBT) &amp; Bank Soal</h4>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Ujian daring interaktif anti-kecurangan dengan penilaian otomatis</p>
                      </div>
                      <span style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                        Auto-Grading &amp; Live Timer
                      </span>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Asesmen Sumatif Akhir Semester (ASAS)</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>Status: Aktif</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Total Soal: 40 Butir (Pilihan Ganda &amp; Esai) · Acak Soal &amp; Opsi Jawaban Otomatis
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Bento Grid: Modules & Capabilities ── */}
        <section id="modules" className={styles.sectionWrapper}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Modul Unggulan</span>
            <h2 className={styles.sectionTitle}>Dirancang Khusus untuk Sekolah Modern</h2>
            <p className={styles.sectionSubtitle}>
              Semua fitur penting manajemen akademik, administrasi guru, dan pemantauan siswa tersusun dalam arsitektur terintegrasi.
            </p>
          </div>

          <div className={styles.bentoGrid}>
            {/* Bento Card 1: Dapodik Integration */}
            <div className={`${styles.bentoCard} ${styles.bentoSpan8}`}>
              <div>
                <span className={styles.bentoBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  ⚡ Sinkronisasi 1-Klik
                </span>
                <h3 className={styles.bentoTitle}>Integrasi WebService Dapodik &amp; Prefill Kemendikbud</h3>
                <p className={styles.bentoDesc}>
                  Hubungkan server Dapodik lokal (port 5774) secara *real-time* atau impor langsung file Prefill resmi (`.prf`). Data peserta didik, guru (GTK), rombongan belajar, hingga 16 mata pelajaran langsung tersinkron tanpa input manual.
                </p>
              </div>
              <ul className={styles.bentoFeatureList}>
                <li className={styles.bentoFeatureItem}>
                  <span style={{ color: '#34d399' }}>✓</span> Ekstraksi otomatis data Ayah, Ibu, dan Wali murid
                </li>
                <li className={styles.bentoFeatureItem}>
                  <span style={{ color: '#34d399' }}>✓</span> Deteksi mutasi keluar dan pembaruan NISN/NIPD real-time
                </li>
                <li className={styles.bentoFeatureItem}>
                  <span style={{ color: '#34d399' }}>✓</span> Rekonsiliasi data master dengan stage approval otomatis
                </li>
              </ul>
            </div>

            {/* Bento Card 2: e-Rapor */}
            <div className={`${styles.bentoCard} ${styles.bentoSpan4}`}>
              <div>
                <span className={styles.bentoBadge} style={{ background: 'rgba(147, 51, 234, 0.15)', color: '#c084fc', border: '1px solid rgba(147, 51, 234, 0.3)' }}>
                  📄 Format Resmi
                </span>
                <h3 className={styles.bentoTitle}>Buku Nilai &amp; e-Rapor</h3>
                <p className={styles.bentoDesc}>
                  Generasi rapor Kurikulum Merdeka &amp; K13 lengkap dengan capaian kompetensi, grafik perkembangan nilai, dan tanda tangan digital QR.
                </p>
              </div>
              <Link href="/dashboard/reports/cards" style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                Lihat Format Rapor →
              </Link>
            </div>

            {/* Bento Card 3: QR Attendance */}
            <div className={`${styles.bentoCard} ${styles.bentoSpan4}`}>
              <div>
                <span className={styles.bentoBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  📱 Presensi Cepat
                </span>
                <h3 className={styles.bentoTitle}>Kartu QR Pelajar</h3>
                <p className={styles.bentoDesc}>
                  Presensi kehadiran tanpa antre menggunakan kamera smartphone atau barcode scanner sekolah dengan verifikasi data instan.
                </p>
              </div>
              <Link href="/dashboard/students/qr-scan" style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                Buka Scan Presensi →
              </Link>
            </div>

            {/* Bento Card 4: CBT & Quiz */}
            <div className={`${styles.bentoCard} ${styles.bentoSpan4}`}>
              <div>
                <span className={styles.bentoBadge} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                  📝 Asesmen Digital
                </span>
                <h3 className={styles.bentoTitle}>CBT &amp; Bank Soal</h3>
                <p className={styles.bentoDesc}>
                  Pelaksanaan ujian harian, PTS, dan PAS secara daring dengan timer interaktif, pengacakan soal, dan penilaian otomatis.
                </p>
              </div>
              <Link href="/dashboard/learning/quizzes" style={{ color: '#f472b6', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                Kelola Bank Soal →
              </Link>
            </div>

            {/* Bento Card 5: Core Rust Engine */}
            <div className={`${styles.bentoCard} ${styles.bentoSpan4}`}>
              <div>
                <span className={styles.bentoBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  ⚡ Rust Core
                </span>
                <h3 className={styles.bentoTitle}>Kecepatan &lt; 5ms</h3>
                <p className={styles.bentoDesc}>
                  Dibangun di atas engine Rust yang tangguh dan PostgreSQL multi-tenant untuk keandalan beban tinggi saat ujian serentak.
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Zero Memory Leaks · 99.99% Uptime</span>
            </div>
          </div>
        </section>

        {/* ── Role Portals Section ── */}
        <section id="roles" className={styles.sectionWrapper}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Portal Khusus</span>
            <h2 className={styles.sectionTitle}>Akses Khusus Sesuai Peran Anda</h2>
            <p className={styles.sectionSubtitle}>
              Setiap pemangku kepentingan memiliki antarmuka yang dirancang khusus untuk kenyamanan dan efisiensi kerja.
            </p>
          </div>

          <div className={styles.rolesGrid}>
            {/* Kepala Sekolah */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconWrapper}>👑</div>
              <h3 className={styles.roleTitle}>Kepala Sekolah</h3>
              <p className={styles.roleDesc}>
                Dashboard analitik eksekutif, pengawasan kehadiran guru &amp; siswa, laporan pencapaian kurikulum, dan pengesahan rapor digital.
              </p>
              <Link href="/login" className={styles.roleCardBtn}>
                <span>Masuk Portal Kepsek</span>
                <span>→</span>
              </Link>
            </div>

            {/* Guru / Pendidik */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconWrapper}>📚</div>
              <h3 className={styles.roleTitle}>Guru &amp; Pendidik</h3>
              <p className={styles.roleDesc}>
                Pengisian nilai kompetensi harian &amp; sumatif, input absensi rombel, pembuatan tugas, ujian CBT, dan agenda mengajar.
              </p>
              <Link href="/login" className={styles.roleCardBtn}>
                <span>Masuk Portal Guru</span>
                <span>→</span>
              </Link>
            </div>

            {/* Staf Tata Usaha / Operator */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconWrapper}>💼</div>
              <h3 className={styles.roleTitle}>Staf TU &amp; Operator</h3>
              <p className={styles.roleDesc}>
                Pengelolaan sinkronisasi Dapodik, master data siswa &amp; wali, manajemen kelas, pengaturan jadwal mapel, dan administrasi sekolah.
              </p>
              <Link href="/login" className={styles.roleCardBtn}>
                <span>Masuk Portal Operator</span>
                <span>→</span>
              </Link>
            </div>

            {/* Siswa & Orang Tua */}
            <div className={styles.roleCard}>
              <div className={styles.roleIconWrapper}>🎓</div>
              <h3 className={styles.roleTitle}>Siswa &amp; Orang Tua</h3>
              <p className={styles.roleDesc}>
                Akses kartu presensi QR, jadwal pelajaran, pengerjaan tugas &amp; ujian CBT, serta pantauan rapor digital secara berkala.
              </p>
              <Link href="/login" className={styles.roleCardBtn}>
                <span>Masuk Portal Siswa</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section id="faq" className={styles.sectionWrapper}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Pertanyaan Umum</span>
            <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan</h2>
            <p className={styles.sectionSubtitle}>
              Informasi lengkap seputar penerapan, sinkronisasi Dapodik, dan kompatibilitas sistem di sekolah Anda.
            </p>
          </div>

          <div className={styles.faqGrid}>
            <div className={styles.faqItem} onClick={() => toggleFaq(0)}>
              <h4 className={styles.faqQuestion}>
                <span>Bagaimana cara menghubungkan School OS dengan aplikasi Dapodik?</span>
                <span style={{ fontSize: '1.2rem', color: '#60a5fa' }}>{openFaqIndex === 0 ? '−' : '+'}</span>
              </h4>
              {openFaqIndex === 0 && (
                <p className={styles.faqAnswer}>
                  Cukup buka menu <strong>Pengaturan Sistem</strong> di School OS, masukkan NPSN sekolah dan Token WebService yang dibuat di aplikasi Dapodik (menu Pengaturan &gt; Web Service dengan IP Pengakses `127.0.0.1`). Selanjutnya klik <em>Tarik Data dari Dapodik</em> di menu Dapodik Hub.
                </p>
              )}
            </div>

            <div className={styles.faqItem} onClick={() => toggleFaq(1)}>
              <h4 className={styles.faqQuestion}>
                <span>Apakah mendukung pencetakan e-Rapor Kurikulum Merdeka?</span>
                <span style={{ fontSize: '1.2rem', color: '#60a5fa' }}>{openFaqIndex === 1 ? '−' : '+'}</span>
              </h4>
              {openFaqIndex === 1 && (
                <p className={styles.faqAnswer}>
                  Ya, School OS telah dilengkapi generator buku rapor digital sesuai panduan penilaian resmi Kemendikbudristek untuk Kurikulum Merdeka (Fase A hingga F) maupun Kurikulum 2013, lengkap dengan deskripsi capaian kompetensi dan QR validasi keaslian.
                </p>
              )}
            </div>

            <div className={styles.faqItem} onClick={() => toggleFaq(2)}>
              <h4 className={styles.faqQuestion}>
                <span>Apakah data siswa dan nilai aman jika dijalankan di server lokal?</span>
                <span style={{ fontSize: '1.2rem', color: '#60a5fa' }}>{openFaqIndex === 2 ? '−' : '+'}</span>
              </h4>
              {openFaqIndex === 2 && (
                <p className={styles.faqAnswer}>
                  Sangat aman. School OS menggunakan arsitektur Multi-Tenant Row-Level Security dengan isolasi data menyeluruh. Sistem dapat dijalankan sepenuhnya di jaringan lokal sekolah (LAN / Offline) maupun di-deploy ke Cloud Server dengan enkripsi data standar industri.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ── */}
        <section className={styles.ctaBanner}>
          <h2 className={styles.ctaTitle}>Siap Mentransformasi Digital Sekolah Anda?</h2>
          <p className={styles.ctaSubtitle}>
            Mulai kelola seluruh administrasi sekolah, sinkronisasi Dapodik, dan buku nilai dengan sistem operasi yang cepat, mudah, dan andal.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className={styles.ctaBtnPrimary}>
              <span>Masuk ke Dashboard Sekolah</span>
              <span>→</span>
            </Link>
            <Link href="/login" className={styles.ctaBtnSecondary}>
              <span>Halaman Login</span>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontWeight: 800, color: '#f8fafc' }}>School OS</span>
            <span>· Sistem Manajemen &amp; Operasi Sekolah Terpadu</span>
          </div>
          <ul className={styles.footerLinks}>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/dashboard/dapodik">Dapodik Hub</Link></li>
            <li><Link href="/dashboard/reports/cards">e-Rapor</Link></li>
            <li><Link href="/dashboard/students">Siswa</Link></li>
            <li><Link href="/dashboard/settings">Pengaturan</Link></li>
            <li><Link href="/login">Login</Link></li>
          </ul>
          <div>
            © {new Date().getFullYear()} School OS Engine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
