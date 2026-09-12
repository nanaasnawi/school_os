'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { login as sdkLogin } from '@/lib/sdk';
import { getApiUrl } from '@/lib/api';
import { 
  Server, 
  ShieldAlert, 
  RefreshCw, 
  Activity, 
  HardDrive, 
  Lock, 
  Radio, 
  Clock 
} from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [schoolName, setSchoolName] = useState('School OS');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');
  const [maintenance, setMaintenance] = useState<{ is_active: boolean; message: string } | null>(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);
  const [adminTriggerCount, setAdminTriggerCount] = useState(0);

  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const checkMaintenanceStatus = async (isManual = false) => {
    if (isManual) {
      setCheckingMaintenance(true);
      setCheckFeedback(null);
    }
    try {
      const res = await fetch(getApiUrl('/api/v1/system/maintenance-status'));
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.maintenance_mode) {
          setMaintenance({
            is_active: true,
            message: json.data.maintenance_message || 'Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit.'
          });
          if (isManual) {
            setCheckFeedback('Server masih dalam optimalisasi terjadwal.');
          }
        } else {
          setMaintenance({ is_active: false, message: '' });
          if (isManual) {
            setCheckFeedback('Server telah aktif! Mengalihkan ke login...');
          }
        }
      } else {
        if (isManual) {
          setCheckFeedback('Status: Server dalam mode pemeliharaan (HTTP 503).');
        }
      }
    } catch {
      if (isManual) {
        setCheckFeedback('Server belum siap merespons, mencoba kembali otomatis...');
      }
    } finally {
      if (isManual) {
        setTimeout(() => setCheckingMaintenance(false), 500);
      }
    }
  };

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  // Auto-countdown timer for maintenance check
  useEffect(() => {
    if (!maintenance?.is_active) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          checkMaintenanceStatus(false);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [maintenance?.is_active]);

  // Hidden emergency shortcut for authorized administrators (Ctrl + Shift + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        router.push('/system-admin/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    document.title = 'Masuk — School OS';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: apiErr, response } = await sdkLogin({ body: { email, password } });
      if (!apiErr && data?.data?.access_token) {
        const token = data.data.access_token;
        try {
          const payloadBase64 = token.split('.')[1];
          const payload = JSON.parse(atob(payloadBase64));
          login(token, {
            id: payload.sub || '1',
            email: payload.email || email,
            full_name: (data?.data as any)?.name || payload.full_name || '',
            role: (data?.data as any)?.role || payload.role || 'Administrator',
          });
        } catch {
          login(token, { id: '1', email, role: 'Administrator' });
        }
        router.push('/dashboard');
        return;
      }
      if (!response) {
        setError('Tidak dapat terhubung ke server. Pastikan server aplikasi sedang berjalan.');
      } else if (response.status === 401 || response.status === 400) {
        setError('Email atau kata sandi yang kamu masukkan salah.');
      } else if (response.status === 503 || response.status === 423 || (apiErr as any)?.message?.includes('Mode Pemeliharaan')) {
        setMaintenance({
          is_active: true,
          message: (apiErr as any)?.message || 'Sistem sedang dalam peningkatan performa server terjadwal.'
        });
      } else {
        setError('Terjadi kesalahan pada server (Status: ' + response.status + ').');
      }
    } catch (err: any) {
      if (err?.message?.includes('Pemeliharaan') || err?.message?.includes('503')) {
        setMaintenance({
          is_active: true,
          message: err?.message || 'Mode pemeliharaan sedang aktif.'
        });
      } else {
        setError(err?.message || 'Gagal terhubung ke server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '⚙️', title: 'Manajemen Data Sekolah', desc: 'Kelola data siswa, guru, kelas, dan mata pelajaran secara terpusat' },
    { icon: '📊', title: 'Analitik & Laporan', desc: 'Pantau kinerja akademik real-time dan ekspor laporan otomatis' },
    { icon: '📱', title: 'Terhubung ke Aplikasi Mobile', desc: 'Sinkron langsung dengan app Android untuk siswa, guru, dan orang tua' },
    { icon: '🔐', title: 'Keamanan Data', desc: 'Proteksi data terenkripsi dengan log aktivitas lengkap' },
  ];

  if (isLoading || isAuthenticated) {
    return null;
  }

  /* ── ENTERPRISE FULLSCREEN MAINTENANCE SCREEN ── */
  if (maintenance?.is_active) {
    return (
      <div className={styles.maintenanceRoot}>
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
        <div className={styles.bgBlob3} />
        <div className={styles.gridOverlay} />

        <div className={styles.maintenanceCard}>
          {/* Top Ambient Glow Line */}
          <div className={styles.cardTopLight} />

          {/* Futuristic Concentric Radar Rings & Core Icon */}
          <div className={styles.iconAuraWrapper}>
            <div className={styles.iconRingOuter} />
            <div className={styles.iconRingPulse} />
            <div className={styles.iconCore}>
              <Server size={36} strokeWidth={1.8} />
            </div>
          </div>

          {/* Operational Live Status Pill */}
          <div>
            <div className={styles.badgeLive}>
              <span className={styles.beaconDot} />
              <span>Status Operasional: Pemeliharaan Terjadwal</span>
            </div>
          </div>

          {/* Headings */}
          <h1 className={styles.maintenanceTitle}>
            Sistem Sedang Dalam Pemeliharaan
          </h1>
          <p className={styles.maintenanceSubtitle}>
            Peningkatan performa infrastruktur dan sinkronisasi data sedang berlangsung untuk memastikan stabilitas, keamanan, dan keandalan operasional seluruh civitas sekolah.
          </p>

          {/* Telemetry Grid (3 Cards) */}
          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <Activity size={12} />
                <span>Status Server</span>
              </div>
              <div className={styles.telemetryValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                Optimalisasi Berjalan
              </div>
            </div>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <Lock size={12} />
                <span>Keamanan Data</span>
              </div>
              <div className={styles.telemetryValue} style={{ color: '#4ade80' }}>
                Terenkripsi & Terlindungi
              </div>
            </div>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <HardDrive size={12} />
                <span>Infrastruktur</span>
              </div>
              <div className={styles.telemetryValue}>
                High-Availability Cloud
              </div>
            </div>
          </div>

          {/* Official Technical Operational Notice */}
          <div className={styles.messageBox}>
            <div className={styles.messageHeader}>
              <Radio size={13} style={{ animation: 'pulse 1.5s infinite' }} />
              <span>Catatan Teknis Operasional</span>
            </div>
            <div className={styles.messageText}>
              &ldquo;{maintenance.message}&rdquo;
            </div>
          </div>

          {/* Actions & Auto-Check Bar */}
          <div>
            <button
              type="button"
              onClick={() => checkMaintenanceStatus(true)}
              disabled={checkingMaintenance}
              className={styles.checkButton}
            >
              <RefreshCw 
                size={16} 
                style={{ 
                  animation: checkingMaintenance ? 'spin 1s linear infinite' : 'none',
                  transition: 'transform 0.2s ease'
                }} 
              />
              <span>{checkingMaintenance ? 'Memeriksa Status Terkini...' : 'Periksa Status Server Sekarang'}</span>
            </button>

            {checkFeedback && (
              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                color: '#7dd3fc',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: '8px',
                padding: '0.45rem 0.8rem',
                display: 'inline-block',
                animation: 'fadeIn 0.2s ease'
              }}>
                ℹ️ {checkFeedback}
              </div>
            )}

            <div className={styles.autoTickerRow}>
              <Clock size={13} />
              <span>Pemeriksaan otomatis dalam <strong>{countdown} detik</strong></span>
            </div>
            <div className={styles.autoProgressBar}>
              <div
                className={styles.autoProgressFill}
                style={{ width: `${Math.max(5, ((15 - countdown) / 15) * 100)}%` }}
              />
            </div>
          </div>

          {/* Footer Assistance & Zero-Leak Secret Admin Access */}
          <div className={styles.footerHelpText}>
            <span>Pertanyaan darurat terkait akses sekolah? Hubungi Administrator TI Sekolah.</span>
            <span>•</span>
            <span
              className={styles.versionBadge}
              title=""
              onClick={() => {
                const next = adminTriggerCount + 1;
                if (next >= 5) {
                  router.push('/system-admin/login');
                } else {
                  setAdminTriggerCount(next);
                }
              }}
            >
              v2.4.0
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Animated blob backgrounds */}
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />
      <div className={styles.bgBlob3} />
      <div className={styles.gridOverlay} />

      <div className={styles.container}>
        {/* LEFT BRAND PANEL */}
        <div className={styles.brandPanel}>
          <div className={styles.brandContent}>

            {/* Logo */}
            <div className={styles.logoMark}>
              {schoolLogoUrl ? (
                <img
                  src={schoolLogoUrl}
                  alt={schoolName}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '12px' }}
                  onError={() => setSchoolLogoUrl('')}
                />
              ) : (
                <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
                  <defs>
                    <linearGradient id="lgLogin" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366F1" />
                      <stop offset="0.5" stopColor="#8B5CF6" />
                      <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                    <linearGradient id="capGradLogin" x1="16" y1="12" x2="48" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="1" stopColor="#E0E7FF" />
                    </linearGradient>
                  </defs>
                  <rect width="64" height="64" rx="18" fill="url(#lgLogin)" />
                  <path d="M32 10L50 18V32C50 43.5 42.5 51.5 32 55C21.5 51.5 14 43.5 14 32V18L32 10Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M32 18L48 26L32 34L16 26L32 18Z" fill="url(#capGradLogin)" />
                  <path d="M22 30.5V38C22 41 26.5 43.5 32 43.5C37.5 43.5 42 41 42 38V30.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M44 28V36" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="44" cy="37" r="1.5" fill="#FDE047" />
                </svg>
              )}
            </div>

            {/* Brand heading */}
            <div className={styles.brandHeading}>
              <h1 className={styles.brandName}>{schoolName}</h1>
              <p className={styles.brandTagline}>Portal Admin &amp; Staf Tata Usaha</p>
            </div>

            {/* Feature cards */}
            <div className={styles.featureList}>
              {features.map((f, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <div>
                    <div className={styles.featureTitle}>{f.title}</div>
                    <div className={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className={styles.statusLine}>
              <span className={styles.statusDot} />
              <span>Aplikasi Mobile (Siswa &middot; Guru &middot; Wali) &mdash; Aktif &amp; Terhubung</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className={styles.formPanel}>
          <div className={styles.formCard}>

            {/* Header */}
            <div className={styles.formHeader}>
              <div className={styles.formBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Akses Admin
              </div>
              <h2 className={styles.formTitle}>Selamat Datang</h2>
              <p className={styles.formSub}>Masuk menggunakan akun administrator atau staf tata usaha yang terdaftar</p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="nama@sekolah.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Kata Sandi</label>
                <div className={styles.passwordWrapper}>
                  <span className={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.formInput}
                    autoComplete="current-password"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'loginSpin 0.7s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Memverifikasi...
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Masuk ke Dasbor
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Android notice */}
            <div className={styles.androidNoticeBox}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8ff', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#818cf8', flexShrink: 0 }}>
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                </svg>
                Siswa, Guru, atau Orang Tua?
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(165,180,252,0.5)', margin: 0, lineHeight: 1.55 }}>
                Gunakan <strong style={{ color: 'rgba(165,180,252,0.75)' }}>Aplikasi Android School OS</strong> untuk akses pembelajaran, presensi, dan rapor.
              </p>
              <button
                id="btn-info-android"
                type="button"
                onClick={() => setShowAndroidModal(true)}
                className={styles.androidInfoBtn}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Info Aplikasi Mobile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ANDROID */}
      {showAndroidModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAndroidModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#818cf8">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                  </svg>
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Aplikasi Mobile School OS</h2>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(165,180,252,0.45)', margin: 0 }}>Panduan Akses Siswa, Guru, dan Orang Tua</p>
                </div>
              </div>
              <button id="btn-close-modal" className={styles.modalCloseBtn} onClick={() => setShowAndroidModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.androidCard}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)', padding: '0.2rem 0.5rem', borderRadius: 100, width: 'fit-content' }}>
                  Aplikasi Android
                </span>
                <p style={{ fontSize: '0.78rem', color: 'rgba(165,180,252,0.5)', marginTop: 6, marginBottom: 0, lineHeight: 1.55 }}>
                  Portal web ini khusus untuk <strong style={{ color: '#c7d2fe' }}>Administrator &amp; Staf Tata Usaha</strong>. Untuk Siswa, Guru, dan Orang Tua, silakan gunakan aplikasi di ponsel:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Siswa', desc: 'Jadwal pelajaran, tugas digital, absensi harian, dan nilai rapor.' },
                  { label: 'Guru', desc: 'Presensi kelas, penilaian siswa, dan pembagian materi pembelajaran.' },
                  { label: 'Orang Tua / Wali', desc: 'Pantau kehadiran anak dan perkembangan belajar secara langsung.' },
                ].map((item, i) => (
                  <div key={i} className={styles.androidFeature}>
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(5,150,105,0.08)', borderRadius: 10, border: '1px solid rgba(5,150,105,0.2)', fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Aplikasi Android resmi siap dipasang di ponsel. Hubungi pihak sekolah untuk panduan instalasi.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button id="btn-modal-tutup" className="btn btn-primary btn-sm" onClick={() => setShowAndroidModal(false)}>
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes loginSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
