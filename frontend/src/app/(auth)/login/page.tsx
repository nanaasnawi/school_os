'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { login as sdkLogin } from '@/lib/sdk';
import { getApiUrl } from '@/lib/api';
import { getTenantItem, setTenantItem } from '@/lib/tenant-storage';
import { decodeJwtPayload } from '@/lib/jwt';
import {
  RefreshCw,
  Lock,
  Clock,
  ShieldCheck,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Info,
  Sun,
  Moon,
  GraduationCap
} from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('akselerasi-edu');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');
  const [maintenance, setMaintenance] = useState<{ is_active: boolean; message: string } | null>(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);
  const [adminTriggerCount, setAdminTriggerCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const router = useRouter();
  const { login, user, isAuthenticated, isLoading } = useAuth();

  /* ── Theme synchronization with Dashboard Settings ── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('school_os_theme');
      const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setTheme('light');
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
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
      const roleLower = user?.role?.toLowerCase() || '';
      const isTeacher = (roleLower === 'guru' || roleLower === 'teacher' || roleLower.startsWith('guru ') || roleLower.startsWith('teacher ')) &&
        !roleLower.includes('kepala') &&
        !roleLower.includes('admin') &&
        !roleLower.includes('staff') &&
        !roleLower.includes('operator');
      if (isTeacher) {
        router.replace('/dashboard/teacher');
      } else if (roleLower.includes('wali') || roleLower.includes('guardian') || roleLower.includes('parent')) {
        router.replace('/parent');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    document.title = 'Masuk — akselerasi-edu';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: apiErr, response } = await sdkLogin({ body: { email, password } });
      if (!apiErr && data?.data?.access_token) {
        const token = data.data.access_token;
        const responseData = data?.data as Record<string, unknown> | undefined;
        const payload = decodeJwtPayload<Record<string, any>>(token);

        const userRole = (responseData?.role as string) || payload?.role || 'Administrator';
        const userId = (responseData?.user_id as string) || payload?.sub || '1';
        const userEmail = (responseData?.email as string) || payload?.email || email;
        const userFullName = (responseData?.name as string) || payload?.full_name || '';

        login(token, {
          id: userId,
          email: userEmail,
          full_name: userFullName,
          role: userRole,
        });

        // Store tenant / school details if present in login response
        if (responseData?.school_name && typeof window !== 'undefined') {
          setTenantItem('dapodik_nama_sekolah', responseData.school_name as string);
        }
        if (responseData?.school_logo_url && typeof window !== 'undefined') {
          setTenantItem('school_logo_url', responseData.school_logo_url as string);
        }

        const roleLower = userRole.toLowerCase();
        const isTeacher = (roleLower === 'guru' || roleLower === 'teacher' || roleLower.startsWith('guru ') || roleLower.startsWith('teacher ')) &&
          !roleLower.includes('kepala') &&
          !roleLower.includes('admin') &&
          !roleLower.includes('staff') &&
          !roleLower.includes('operator');

        if (isTeacher) {
          router.push('/dashboard/teacher');
        } else if (roleLower.includes('wali') || roleLower.includes('guardian') || roleLower.includes('parent')) {
          router.push('/parent');
        } else {
          router.push('/dashboard');
        }
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
        {/* ── Left Panel: Illustration ── */}
        <div className={styles.mntLeft}>
          <img
            src="/images/under-construction-animate.svg"
            alt="Under Construction – akselerasi-edu"
            className={styles.mntIllustration}
            draggable={false}
          />
        </div>

        {/* ── Divider ── */}
        <div className={styles.mntDivider} />

        {/* ── Right Panel: Status ── */}
        <div className={styles.mntRight}>
          {/* Live badge */}
          <div className={styles.mntBadge}>
            <span className={styles.mntBeacon} />
            <span>Pemeliharaan Terjadwal</span>
          </div>

          {/* Title */}
          <h1 className={styles.mntTitle}>
            Sistem Sedang<br />Dalam Pemeliharaan
          </h1>

          <p className={styles.mntDesc}>
            Peningkatan infrastruktur & sinkronisasi data sedang berlangsung
            untuk memastikan stabilitas operasional seluruh civitas sekolah.
          </p>

          {/* Status rows — flat, no card */}
          <div className={styles.mntStatusList}>
            <div className={styles.mntStatusRow}>
              <span className={styles.mntStatusDotWarn} />
              <span className={styles.mntStatusLabel}>Status Server</span>
              <span className={styles.mntStatusVal}>Optimalisasi Berjalan</span>
            </div>
            <div className={styles.mntStatusRow}>
              <span className={styles.mntStatusDotGreen} />
              <span className={styles.mntStatusLabel}>Keamanan Data</span>
              <span className={styles.mntStatusVal} style={{ color: '#10b981' }}>Terenkripsi & Terjaga</span>
            </div>
            <div className={styles.mntStatusRow}>
              <span className={styles.mntStatusDotBlue} />
              <span className={styles.mntStatusLabel}>Infrastruktur</span>
              <span className={styles.mntStatusVal}>High-Availability Cloud</span>
            </div>
          </div>

          {/* Maintenance message */}
          <p className={styles.mntMessage}>
            &ldquo;{maintenance.message}&rdquo;
          </p>

          {/* CTA Button */}
          <button
            type="button"
            onClick={() => checkMaintenanceStatus(true)}
            disabled={checkingMaintenance}
            className={styles.mntBtn}
          >
            <RefreshCw
              size={15}
              style={{ animation: checkingMaintenance ? 'spin 1s linear infinite' : 'none' }}
            />
            {checkingMaintenance ? 'Memeriksa...' : 'Periksa Status Server'}
          </button>

          {checkFeedback && (
            <p className={styles.mntFeedback}>{checkFeedback}</p>
          )}

          {/* Countdown */}
          <div className={styles.mntCountdownRow}>
            <Clock size={12} />
            <span>Auto-check dalam <strong>{countdown}s</strong></span>
            <div className={styles.mntCountdownBar}>
              <div
                className={styles.mntCountdownFill}
                style={{ width: `${Math.max(3, ((15 - countdown) / 15) * 100)}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <p className={styles.mntFooter}>
            Butuh akses darurat?{' '}
            <span>Hubungi Administrator TI Sekolah</span>
            {' · '}
            <span
              className={styles.mntVersion}
              onClick={() => {
                const next = adminTriggerCount + 1;
                if (next >= 5) router.push('/system-admin/login');
                else setAdminTriggerCount(next);
              }}
            >
              v2.4.0
            </span>
          </p>
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
                  alt={schoolName || 'akselerasi-edu'}
                  className={styles.schoolLogoImg}
                />
              )}
            </div>
            <div className={styles.brandTextGroup}>
              <h1 className={styles.schoolTitle}>{schoolName}</h1>
              <p className={styles.schoolSubtitle}>Portal Layanan &amp; Akademik Terpadu</p>
            </div>
          </div>

          {/* Center Security SVG Animation */}
          <div className={styles.illustrationArea}>
            <img
              src="/images/security-animate.svg"
              alt="Keamanan Terjamin akselerasi-edu"
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
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className={styles.formContent}>
            {/* Mobile-only School Brand Header */}
            <div className={styles.mobileBrandHeader}>
              <div className={styles.mobileLogoMark}>
                {schoolLogoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={schoolLogoUrl}
                    alt={schoolName}
                    className={styles.mobileLogoImg}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <GraduationCap size={22} className="text-sky-500" />
                )}
              </div>
              <div>
                <h1 className={styles.mobileSchoolTitle}>{schoolName}</h1>
                <p className={styles.mobileSchoolSubtitle}>Sistem Operasi Akademik Terpadu</p>
              </div>
            </div>

            {/* Header */}
            <div className={styles.formHeader}>
              <div className={styles.formBadge}>
                <ShieldCheck size={14} />
                <span>Portal Resmi Sekolah</span>
              </div>
              <h2 className={styles.formTitle}>Masuk ke Sistem</h2>
              <p className={styles.formSub}>
                Gunakan kredensial akun terdaftar Anda untuk mengakses portal sekolah
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
                  Email atau Username Akun
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    type="text"
                    required
                    placeholder="nama@sekolah.sch.id atau username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    autoComplete="username"
                  />
                </div>
                <span className={styles.inputHint}>
                  Admin/Kepala Sekolah wajib menggunakan Email. Guru, Siswa, &amp; Wali dapat menggunakan Username (cth: <code>nama.pengguna</code>, <code>guru_akselerasi</code>) atau Email.
                </span>
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
              <div className={styles.androidNoticeHeader}>
                <Smartphone size={16} className={styles.androidNoticeIcon} />
                <span>Siswa, Guru, atau Orang Tua?</span>
              </div>
              <p className={styles.androidNoticeText}>
                Gunakan <strong>Aplikasi Android akselerasi-edu</strong> untuk jadwal, tugas, absensi, dan
                e-rapor langsung dari smartphone.
              </p>
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


      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
