'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { login as sdkLogin } from '@/lib/sdk';
import { getApiUrl } from '@/lib/api';
import { getTenantItem } from '@/lib/tenant-storage';
import {
  Server,
  RefreshCw,
  Activity,
  HardDrive,
  Lock,
  Radio,
  Clock,
  Sun,
  Moon,
  ArrowLeft,
  ShieldCheck,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
  Info
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
  const [isDark, setIsDark] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  /* ── Theme synchronization with Dashboard Settings ── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('school_os_theme');
      if (savedTheme === 'dark') {
        setIsDark(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setIsDark(false);
        document.documentElement.removeAttribute('data-theme');
      }
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
            message:
              json.data.maintenance_message ||
              'Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit.',
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
    let isMounted = true;

    // 1. Initial tenant storage check for custom school profile
    if (typeof window !== 'undefined') {
      const storedName = getTenantItem('dapodik_nama_sekolah');
      const storedLogo = getTenantItem('school_logo_url');
      if (storedName) {
        setSchoolName(storedName);
        document.title = `Masuk — ${storedName}`;
      }
      if (storedLogo) {
        setSchoolLogoUrl(storedLogo);
      }
    }

    // 2. Fetch server maintenance status
    fetch(getApiUrl('/api/v1/system/maintenance-status'))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json) return;
        if (json.data && json.data.maintenance_mode) {
          setMaintenance({
            is_active: true,
            message:
              json.data.maintenance_message ||
              'Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit.',
          });
        } else {
          setMaintenance({ is_active: false, message: '' });
        }
      })
      .catch(() => {});

    // 3. Fetch server school info
    fetch(getApiUrl('/api/v1/schools/info'))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json?.data) return;
        if (json.data.name) {
          setSchoolName(json.data.name);
          document.title = `Masuk — ${json.data.name}`;
        }
        if (json.data.logo_url) {
          setSchoolLogoUrl(json.data.logo_url);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
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
          const responseData = data?.data as Record<string, unknown> | undefined;
          login(token, {
            id: payload.sub || '1',
            email: payload.email || email,
            full_name: (responseData?.name as string) || payload.full_name || '',
            role: (responseData?.role as string) || payload.role || 'Administrator',
          });
        } catch {
          login(token, { id: '1', email, role: 'Administrator' });
        }
        router.push('/dashboard');
        return;
      }
      const errObj = apiErr as { message?: string } | undefined;
      if (!response) {
        setError('Tidak dapat terhubung ke server. Pastikan server aplikasi sedang berjalan.');
      } else if (response.status === 401 || response.status === 400) {
        setError('Email atau kata sandi yang kamu masukkan salah.');
      } else if (
        response.status === 503 ||
        response.status === 423 ||
        errObj?.message?.includes('Mode Pemeliharaan')
      ) {
        setMaintenance({
          is_active: true,
          message: errObj?.message || 'Sistem sedang dalam peningkatan performa server terjadwal.',
        });
      } else {
        setError('Terjadi kesalahan pada server (Status: ' + response.status + ').');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Pemeliharaan') || message.includes('503')) {
        setMaintenance({
          is_active: true,
          message: message || 'Mode pemeliharaan sedang aktif.',
        });
      } else {
        setError(message || 'Gagal terhubung ke server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: '🛡️',
      title: 'Sinkronisasi Resmi Dapodik',
      desc: 'Terhubung langsung dengan WebService Kemendikbud & e-Rapor Kurikulum Merdeka',
    },
    {
      icon: '⚡',
      title: 'Portal Akademik Cerdas',
      desc: 'Kelola data siswa, guru, jadwal pelajaran, presensi QR, dan CBT secara terpadu',
    },
    {
      icon: '🔒',
      title: 'Keamanan Data Terenkripsi',
      desc: 'Akses terproteksi dengan audit trail dan log aktivitas keamanan real-time',
    },
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
          {/* Futuristic Concentric Radar Rings & Core Icon */}
          <div className={styles.iconAuraWrapper}>
            <div className={styles.iconCore}>
              <Server size={32} strokeWidth={2} />
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
          <h1 className={styles.maintenanceTitle}>Sistem Sedang Dalam Pemeliharaan</h1>
          <p className={styles.maintenanceSubtitle}>
            Peningkatan performa infrastruktur dan sinkronisasi data sedang berlangsung untuk
            memastikan stabilitas, keamanan, dan keandalan operasional seluruh civitas sekolah.
          </p>

          {/* Telemetry Grid (3 Cards) */}
          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <Activity size={12} />
                <span>Status Server</span>
              </div>
              <div
                className={styles.telemetryValue}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#fbbf24',
                    display: 'inline-block',
                  }}
                />
                Optimalisasi Berjalan
              </div>
            </div>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <Lock size={12} />
                <span>Keamanan Data</span>
              </div>
              <div className={styles.telemetryValue} style={{ color: '#10b981' }}>
                Terenkripsi &amp; Terlindungi
              </div>
            </div>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <HardDrive size={12} />
                <span>Infrastruktur</span>
              </div>
              <div className={styles.telemetryValue}>High-Availability Cloud</div>
            </div>
          </div>

          {/* Official Technical Operational Notice */}
          <div className={styles.messageBox}>
            <div className={styles.messageHeader}>
              <Radio size={13} style={{ animation: 'pulse 1.5s infinite' }} />
              <span>Catatan Teknis Operasional</span>
            </div>
            <div className={styles.messageText}>&ldquo;{maintenance.message}&rdquo;</div>
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
                  transition: 'transform 0.2s ease',
                }}
              />
              <span>
                {checkingMaintenance
                  ? 'Memeriksa Status Terkini...'
                  : 'Periksa Status Server Sekarang'}
              </span>
            </button>

            {checkFeedback && (
              <div
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--accent, #0ea5e9)',
                  background: 'var(--accent-light, #e0f2fe)',
                  border: '1px solid var(--border-medium, #cbd5e1)',
                  borderRadius: '8px',
                  padding: '0.45rem 0.8rem',
                  display: 'inline-block',
                }}
              >
                ℹ️ {checkFeedback}
              </div>
            )}

            <div className={styles.autoTickerRow}>
              <Clock size={13} />
              <span>
                Pemeriksaan otomatis dalam <strong>{countdown} detik</strong>
              </span>
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

      {/* Floating Top Navigation & Theme Settings Toggle */}
      <div className={styles.topActionsRow}>
        <Link href="/" className={styles.backHomeLink}>
          <ArrowLeft size={15} />
          <span>Kembali ke Beranda</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeToggleBtn}
          title={isDark ? 'Mode Gelap Aktif (Ganti ke Mode Terang)' : 'Mode Terang Aktif (Ganti ke Mode Gelap)'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className={styles.container}>
        {/* ══════════════════════════════════════════════════════════
            LEFT SHOWCASE & SECURITY BRAND PANEL
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.brandPanel}>
          {/* School Header */}
          <div className={styles.brandHeader}>
            <div className={styles.logoMark}>
              {schoolLogoUrl ? (
                <img
                  src={schoolLogoUrl}
                  alt={schoolName}
                  className={styles.schoolLogoImg}
                  onError={() => setSchoolLogoUrl('')}
                />
              ) : (
                <img
                  src="/logo.png"
                  alt={schoolName || 'School OS'}
                  className={styles.schoolLogoImg}
                />
              )}
            </div>
            <div className={styles.brandTextGroup}>
              <h1 className={styles.schoolTitle}>{schoolName}</h1>
              <p className={styles.schoolSubtitle}>Portal Admin &amp; Staf Tata Usaha</p>
            </div>
          </div>

          {/* Center Security SVG Animation */}
          <div className={styles.illustrationArea}>
            <img
              src="/images/security-animate.svg"
              alt="Keamanan Terjamin School OS"
              className={styles.securityIllustration}
            />
          </div>

          {/* Bottom Security Trust Highlights */}
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

          {/* Live Operational Status */}
          <div className={styles.statusLine}>
            <span className={styles.statusDot} />
            <span>Server Operasional &amp; Terkoneksi Sinkronisasi Dapodik</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT FORM PANEL
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            {/* Header */}
            <div className={styles.formHeader}>
              <div className={styles.formBadge}>
                <ShieldCheck size={14} />
                <span>Portal Resmi Sekolah</span>
              </div>
              <h2 className={styles.formTitle}>Masuk ke Sistem</h2>
              <p className={styles.formSub}>
                Gunakan kredensial akun administrator atau staf tata usaha Anda untuk mengakses dashboard
              </p>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <Info size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Akun
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="nama@sekolah.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Kata Sandi
                </label>
                <div className={styles.passwordWrapper}>
                  <span className={styles.inputIcon}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.formInput}
                    autoComplete="current-password"
                    style={{ paddingRight: '2.8rem' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <Lock size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Android Mobile Notice Card */}
            <div className={styles.androidNoticeBox}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Smartphone size={15} color="var(--accent, #0ea5e9)" />
                <span>Siswa, Guru, atau Orang Tua?</span>
              </div>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #64748b)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Gunakan <strong>Aplikasi Android School OS</strong> untuk jadwal, tugas, absensi, dan
                e-rapor langsung dari smartphone.
              </p>
              <button
                id="btn-info-android"
                type="button"
                onClick={() => setShowAndroidModal(true)}
                className={styles.androidInfoBtn}
              >
                <span>Pelajari Info Aplikasi Mobile →</span>
              </button>
            </div>

            {/* Footer Assistance & Secret Admin Access */}
            <div className={styles.footerHelpText}>
              <span>Butuh bantuan akses? Hubungi Admin Sekolah.</span>
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
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL ANDROID
          ══════════════════════════════════════════════════════════ */}
      {showAndroidModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAndroidModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--accent-light, #e0f2fe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent, #0ea5e9)',
                  }}
                >
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Aplikasi Mobile School OS</h3>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted, #64748b)',
                      margin: 0,
                    }}
                  >
                    Panduan Akses Siswa, Guru, dan Orang Tua
                  </p>
                </div>
              </div>
              <button
                id="btn-close-modal"
                className={styles.modalCloseBtn}
                onClick={() => setShowAndroidModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.androidCard}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--accent, #0ea5e9)',
                    background: 'var(--accent-light, #e0f2fe)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 100,
                  }}
                >
                  Aplikasi Android Tersedia
                </span>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary, #374151)',
                    marginTop: 8,
                    marginBottom: 0,
                    lineHeight: 1.55,
                  }}
                >
                  Portal web ini khusus untuk{' '}
                  <strong style={{ color: 'var(--text-primary, #0f172a)' }}>
                    Administrator &amp; Staf Tata Usaha
                  </strong>
                  . Untuk Siswa, Guru, dan Orang Tua, silakan gunakan aplikasi di ponsel:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  {
                    label: 'Siswa',
                    desc: 'Jadwal pelajaran, tugas digital, absensi QR harian, dan nilai rapor.',
                  },
                  {
                    label: 'Guru',
                    desc: 'Presensi kelas, penilaian siswa Kurikulum Merdeka, dan modul belajar.',
                  },
                  {
                    label: 'Orang Tua / Wali',
                    desc: 'Pantau kehadiran anak dan perkembangan akademik langsung via notifikasi.',
                  },
                ].map((item, i) => (
                  <div key={i} className={styles.androidFeature}>
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: 10,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: '0.75rem',
                  color: '#10b981',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  Aplikasi Android resmi siap dipasang di ponsel. Hubungi pihak sekolah untuk panduan
                  instalasi.
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                id="btn-modal-tutup"
                className={styles.submitBtn}
                style={{ width: 'auto', padding: '8px 20px', height: '38px', fontSize: '13px' }}
                onClick={() => setShowAndroidModal(false)}
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
