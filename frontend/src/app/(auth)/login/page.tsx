'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { login as sdkLogin } from '@/lib/sdk';
import { getApiUrl } from '@/lib/api';
import { getTenantItem, setTenantItem } from '@/lib/tenant-storage';
import { decodeJwtPayload } from '@/lib/jwt';
import {
  RefreshCw,
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
  GraduationCap,
  Building2,
  ArrowRight,
  BookOpen,
  Database,
  Users,
} from 'lucide-react';
import styles from './login.module.css';

type RolePreset = 'admin' | 'guru' | 'kepsek';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('akselerasi-edu');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');
  const [selectedRole, setSelectedRole] = useState<RolePreset>('admin');
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
      const isTeacher =
        (roleLower === 'guru' || roleLower === 'teacher' || roleLower.startsWith('guru ') || roleLower.startsWith('teacher ')) &&
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

  // Caps Lock keyboard detection handler
  const handleKeyModifierCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: apiErr, response } = await sdkLogin({ body: { email: email.trim(), password } });
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
        const isTeacher =
          (roleLower === 'guru' || roleLower === 'teacher' || roleLower.startsWith('guru ') || roleLower.startsWith('teacher ')) &&
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
        setError('Tidak dapat terhubung ke server. Pastikan koneksi internet aktif.');
      } else if (response.status === 401 || response.status === 400) {
        setError('Email/Username atau kata sandi yang Anda masukkan tidak sesuai.');
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
        setError('Terjadi kendala autentikasi pada server (Kode: ' + response.status + ').');
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

  if (isLoading || isAuthenticated) {
    return null;
  }

  /* ── ENTERPRISE STATUS PAGE MAINTENANCE SCREEN ── */
  if (maintenance?.is_active) {
    return (
      <div className={styles.maintenanceRoot}>
        <div className={styles.maintenanceCard}>
          <div className={styles.maintenanceBadgeRow}>
            <div className={styles.maintenancePill}>
              <Clock size={13} />
              <span>Pemeliharaan Terjadwal</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6b7280)' }}>
              HTTP 503 Maintenance
            </span>
          </div>

          <h1 className={styles.maintenanceTitle}>Sistem Dalam Pemeliharaan</h1>
          <p className={styles.maintenanceDesc}>
            Infrastruktur server dan sinkronisasi database sedang dioptimalkan. Akses ke portal akademik
            akan segera dibuka kembali secara otomatis setelah proses selesai.
          </p>

          <div className={styles.maintenanceMessageCard}>
            &ldquo;{maintenance.message}&rdquo;
          </div>

          <div className={styles.maintenanceStatusBar}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted, #6b7280)' }}>
              <span>Pemeriksaan berkala</span>
              <span>Ulang dalam <strong>{countdown}s</strong></span>
            </div>
            <div className={styles.countdownTrack}>
              <div
                className={styles.countdownProgress}
                style={{ width: `${Math.max(4, ((15 - countdown) / 15) * 100)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => checkMaintenanceStatus(true)}
            disabled={checkingMaintenance}
            className={styles.maintenanceActionBtn}
          >
            <RefreshCw
              size={15}
              style={{ animation: checkingMaintenance ? 'spin 1s linear infinite' : 'none' }}
            />
            <span>{checkingMaintenance ? 'Memeriksa...' : 'Periksa Ulang Sekarang'}</span>
          </button>

          {checkFeedback && (
            <p style={{ fontSize: '0.82rem', color: 'var(--accent-dark, #0284c7)', margin: 0, textAlign: 'center', fontWeight: 500 }}>
              {checkFeedback}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-light, #e5e7eb)', fontSize: '0.78rem', color: 'var(--text-muted, #6b7280)' }}>
            <span>Butuh bantuan darurat? Hubungi Tim IT Sekolah.</span>
            <span
              className={styles.sysAdminSecretLink}
              onClick={() => {
                const next = adminTriggerCount + 1;
                if (next >= 5) router.push('/system-admin/login');
                else setAdminTriggerCount(next);
              }}
            >
              v2.4.0
            </span>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Dynamic helper text based on selected role preset
  const getRoleHint = () => {
    switch (selectedRole) {
      case 'guru':
        return 'Gunakan alamat Email atau Username / NIP yang terdaftar di sistem sekolah.';
      case 'kepsek':
        return 'Gunakan alamat Email kedinasan Kepala Sekolah yang terverifikasi.';
      case 'admin':
      default:
        return 'Gunakan alamat Email resmi Administrator atau Operator Sekolah.';
    }
  };

  const getRolePlaceholder = () => {
    switch (selectedRole) {
      case 'guru':
        return 'nama@sekolah.sch.id atau username / NIP';
      case 'kepsek':
        return 'kepsek@sekolah.sch.id';
      case 'admin':
      default:
        return 'admin@sekolah.sch.id';
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL — INSTITUTIONAL IDENTITY & EDUCATIONAL PILLARS
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.brandPanel}>
          {/* Top: School Crest & Official accreditation */}
          <div className={styles.brandHeader}>
            <div className={styles.schoolLogoWrapper}>
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
                  alt={schoolName || 'Akselerasi-Edu'}
                  className={styles.schoolLogoImg}
                />
              )}
            </div>
            <div className={styles.brandTextGroup}>
              <div className={styles.officialBadgeRow}>
                <span className={styles.officialPill}>
                  <ShieldCheck size={12} />
                  <span>Dapodik Terintegrasi</span>
                </span>
                <span className={styles.sessionPill}>T.A. 2026/2027</span>
              </div>
              <h1 className={styles.schoolTitle}>{schoolName}</h1>
              <p className={styles.schoolSubtitle}>Sistem Manajemen Informasi &amp; Akademik Sekolah</p>
            </div>
          </div>

          {/* Center: Educational Core Value Proposition */}
          <div className={styles.workspaceShowcase}>
            <div>
              <h2 className={styles.heroTagline}>
                Platform Manajemen Sekolah{' '}
                <span className={styles.heroTaglineHighlight}>Terpadu &amp; Modern</span>
              </h2>
              <p className={styles.heroDescription}>
                Dirancang khusus untuk mendukung operasional SD, SMP, SMA, dan PKBM di Indonesia dengan
                efisiensi administrasi, otomasi kurikulum, dan akuntabilitas pembelajaran.
              </p>
            </div>

            {/* Academic Pillars Card */}
            <div className={styles.pillarsCard}>
              <div className={styles.pillarsHeader}>
                <span className={styles.pillarsTitle}>
                  <GraduationCap size={14} /> Layanan Akademik
                </span>
                <span className={styles.pillarsStatus}>
                  <span className={styles.statusDot} /> Sistem Siap Pakai
                </span>
              </div>

              <div className={styles.pillarList}>
                <div className={styles.pillarItem}>
                  <div className={styles.pillarIconBox}>
                    <Database size={16} />
                  </div>
                  <div className={styles.pillarText}>
                    <span className={styles.pillarTitle}>Sinkronisasi Resmi Dapodik &amp; e-Rapor</span>
                    <span className={styles.pillarDesc}>
                      Terhubung dengan database WebService Dapodik lokal dan format kurikulum nasional.
                    </span>
                  </div>
                </div>

                <div className={styles.pillarItem}>
                  <div className={styles.pillarIconBox}>
                    <BookOpen size={16} />
                  </div>
                  <div className={styles.pillarText}>
                    <span className={styles.pillarTitle}>Kurikulum Merdeka &amp; Modul Ajar</span>
                    <span className={styles.pillarDesc}>
                      Kelola jadwal pelajaran, tugas kelas, bank kuis, dan lembar capaian kompetensi.
                    </span>
                  </div>
                </div>

                <div className={styles.pillarItem}>
                  <div className={styles.pillarIconBox}>
                    <Users size={16} />
                  </div>
                  <div className={styles.pillarText}>
                    <span className={styles.pillarTitle}>Portal Khusus Guru, Tendik &amp; Kepala Sekolah</span>
                    <span className={styles.pillarDesc}>
                      Hak akses terisolasi untuk pelaporan supervisi dan presensi harian terverifikasi.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Institutional Compliance */}
          <div className={styles.brandFooter}>
            <span className={styles.kemdikbudRef}>
              <Building2 size={14} />
              <span>Standar Kurikulum Merdeka Kemendikdasmen RI</span>
            </span>
            <span>Akselerasi-Edu v2.4</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — FOCUSED AUTHENTICATION FORM
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.formPanel}>
          {/* Top navigation with Theme switch */}
          <div className={styles.formTopNav}>
            <div className={styles.portalBadge}>
              <GraduationCap size={13} />
              <span>Portal Masuk Sekolah</span>
            </div>
            <div className={styles.navControls}>
              <button
                type="button"
                onClick={toggleTheme}
                className={styles.iconControlBtn}
                aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>

          {/* Center form content wrapper */}
          <div className={styles.formContentWrapper}>
            {/* Mobile header (Only displayed on small viewports) */}
            <div className={styles.mobileBrandHeader}>
              <div className={styles.mobileLogoWrapper}>
                {schoolLogoUrl ? (
                  <img src={schoolLogoUrl} alt={schoolName} className={styles.schoolLogoImg} />
                ) : (
                  <GraduationCap size={22} color="var(--accent-dark, #0284c7)" />
                )}
              </div>
              <div>
                <h3 className={styles.mobileSchoolTitle}>{schoolName}</h3>
                <p className={styles.mobileSchoolSubtitle}>Akselerasi-Edu • Portal Sekolah</p>
              </div>
            </div>

            <div className={styles.formHeader}>
              <h2 className={styles.formMainTitle}>Masuk ke Ruang Kerja</h2>
              <p className={styles.formSubTitle}>
                Pilih peran Anda dan masukkan akun resmi untuk melanjutkan ke dashboard.
              </p>
            </div>

            {/* Quick Role Switcher Segmented Control */}
            <div className={styles.rolePresetBar} role="tablist" aria-label="Pilih Peran Akun">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'admin'}
                className={`${styles.rolePresetBtn} ${selectedRole === 'admin' ? styles.rolePresetBtnActive : ''}`}
                onClick={() => setSelectedRole('admin')}
              >
                Admin &amp; TU
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'guru'}
                className={`${styles.rolePresetBtn} ${selectedRole === 'guru' ? styles.rolePresetBtnActive : ''}`}
                onClick={() => setSelectedRole('guru')}
              >
                Guru &amp; Tendik
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'kepsek'}
                className={`${styles.rolePresetBtn} ${selectedRole === 'kepsek' ? styles.rolePresetBtnActive : ''}`}
                onClick={() => setSelectedRole('kepsek')}
              >
                Kepala Sekolah
              </button>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate={false}>
              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="auth-email" className={styles.label}>
                    {selectedRole === 'guru' ? 'Email atau Username / NIP' : 'Email Akun Resmi'}
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="auth-email"
                    type="text"
                    required
                    placeholder={getRolePlaceholder()}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    autoComplete="username"
                  />
                </div>
                <span className={styles.inputHelper}>{getRoleHint()}</span>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="auth-password" className={styles.label}>
                    Kata Sandi
                  </label>
                  {capsLockActive && (
                    <span className={styles.capsLockBadge}>Caps Lock Aktif</span>
                  )}
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyModifierCheck}
                    onKeyUp={handleKeyModifierCheck}
                    className={styles.formInput}
                    autoComplete="current-password"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Android Mobile Guidance Box */}
            <div className={styles.mobileCrossLink}>
              <div className={styles.mobileCrossIconBox}>
                <Smartphone size={16} />
              </div>
              <div>
                <p className={styles.mobileCrossTitle}>Siswa atau Orang Tua / Wali?</p>
                <p className={styles.mobileCrossDesc}>
                  Akses presensi harian, nilai e-rapor, dan jadwal ujian langsung melalui aplikasi Android Akselerasi-Edu.
                </p>
              </div>
            </div>
          </div>

          {/* Form Bottom Bar */}
          <div className={styles.formBottomBar}>
            <span>Kendala akun? Hubungi Administrator TI Sekolah.</span>
            <span
              className={styles.sysAdminSecretLink}
              title="Akses Administrator Sistem"
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
