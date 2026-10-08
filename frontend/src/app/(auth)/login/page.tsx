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
  ArrowRight,
  Activity,
  Layers,
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
              'Sistem sedang dalam optimalisasi server terjadwal.',
          });
          if (isManual) {
            setCheckFeedback('Server masih dalam pemeliharaan.');
          }
        } else {
          setMaintenance({ is_active: false, message: '' });
          if (isManual) {
            setCheckFeedback('Server aktif! Mengalihkan ke login...');
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
              'Sistem sedang dalam optimalisasi server terjadwal.',
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
        setError('Tidak dapat terhubung ke server.');
      } else if (response.status === 401 || response.status === 400) {
        setError('Email/Username atau kata sandi tidak sesuai.');
      } else if (
        response.status === 503 ||
        response.status === 423 ||
        errObj?.message?.includes('Mode Pemeliharaan')
      ) {
        setMaintenance({
          is_active: true,
          message: errObj?.message || 'Sistem sedang dalam optimalisasi server terjadwal.',
        });
      } else {
        setError('Terjadi kendala autentikasi (Kode: ' + response.status + ').');
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
              <Clock size={12} />
              <span>Pemeliharaan</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)' }}>
              HTTP 503
            </span>
          </div>

          <h1 className={styles.maintenanceTitle}>Sistem Dalam Pemeliharaan</h1>
          <p className={styles.maintenanceDesc}>
            Optimalisasi server sedang berlangsung. Portal akan dibuka kembali secara otomatis setelah proses selesai.
          </p>

          <div className={styles.maintenanceMessageCard}>
            &ldquo;{maintenance.message}&rdquo;
          </div>

          <div className={styles.countdownTrack}>
            <div
              className={styles.countdownProgress}
              style={{ width: `${Math.max(4, ((15 - countdown) / 15) * 100)}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => checkMaintenanceStatus(true)}
            disabled={checkingMaintenance}
            className={styles.maintenanceActionBtn}
          >
            <RefreshCw
              size={14}
              style={{ animation: checkingMaintenance ? 'spin 1s linear infinite' : 'none' }}
            />
            <span>{checkingMaintenance ? 'Memeriksa...' : 'Periksa Status'}</span>
          </button>

          {checkFeedback && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-dark, #0284c7)', margin: 0, textAlign: 'center' }}>
              {checkFeedback}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-light, #e2e8f0)', fontSize: '0.76rem', color: 'var(--text-muted, #64748b)' }}>
            <span>Bantuan darurat: Hubungi Admin Sekolah</span>
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
            LEFT PANEL — ENTERPRISE DASHBOARD PREVIEW
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.leftPanel}>
          {/* Top School Header */}
          <div className={styles.schoolHeader}>
            <div className={styles.schoolLogoFrame}>
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
            <div className={styles.schoolTitles}>
              <h1 className={styles.schoolName}>{schoolName}</h1>
              <div className={styles.schoolMetaRow}>
                <span className={styles.dapodikBadge}>
                  <ShieldCheck size={11} />
                  Dapodik Terverifikasi
                </span>
                <span className={styles.sessionTag}>T.A. 2026/2027</span>
              </div>
            </div>
          </div>

          {/* Center Living Software Glance Card */}
          <div className={styles.centerGlance}>
            <div className={styles.glanceHeadlineGroup}>
              <h2 className={styles.glanceHeadline}>
                Pusat Operasional{' '}
                <span className={styles.glanceHeadlineAccent}>Akademik</span>
              </h2>
              <p className={styles.glanceSub}>
                Satu sistem terintegrasi untuk pengelolaan kurikulum merdeka, presensi pintar, dan e-rapor sekolah.
              </p>
            </div>

            {/* Living System Status Card */}
            <div className={styles.glassWidget}>
              <div className={styles.widgetTopBar}>
                <div className={styles.widgetTitleGroup}>
                  <Activity size={14} color="#38bdf8" />
                  <span>Status Sistem Akademik</span>
                </div>
                <div className={styles.liveBeacon}>
                  <span className={styles.pulseDot} />
                  <span>Aktif &amp; Terhubung</span>
                </div>
              </div>

              <div className={styles.statTilesRow}>
                <div className={styles.statTile}>
                  <span className={styles.statVal}>32</span>
                  <span className={styles.statLabel}>Rombel Aktif</span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statVal}>98.6%</span>
                  <span className={styles.statLabel}>Presensi Harian</span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statVal}>100%</span>
                  <span className={styles.statLabel}>e-Rapor Sinkron</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Panel Footer */}
          <div className={styles.leftFooter}>
            <span>Standar Kurikulum Merdeka Kemendikdasmen RI</span>
            <span>Akselerasi-Edu v2.4</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — FOCUSED INTERACTION CONSOLE
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.rightPanel}>
          {/* Top Bar with Theme Switcher */}
          <div className={styles.rightTopNav}>
            <button
              type="button"
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Center Form Container */}
          <div className={styles.formBox}>
            {/* Mobile Header (Hidden on Desktop) */}
            <div className={styles.mobileBrandBar}>
              <div className={styles.mobileBrandLogo}>
                {schoolLogoUrl ? (
                  <img src={schoolLogoUrl} alt={schoolName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <GraduationCap size={22} color="#0284c7" />
                )}
              </div>
              <h3 className={styles.mobileSchoolName}>{schoolName}</h3>
            </div>

            <div className={styles.formTitles}>
              <h2 className={styles.formMainTitle}>Masuk ke Ruang Kerja</h2>
              <p className={styles.formMainSub}>
                Pilih peran Anda dan akses akun resmi untuk melanjutkan.
              </p>
            </div>

            {/* Tactile Segmented Tabs */}
            <div className={styles.segmentedTabs} role="tablist" aria-label="Pilih Peran Akun">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'admin'}
                className={`${styles.segTab} ${selectedRole === 'admin' ? styles.segTabActive : ''}`}
                onClick={() => setSelectedRole('admin')}
              >
                Admin &amp; TU
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'guru'}
                className={`${styles.segTab} ${selectedRole === 'guru' ? styles.segTabActive : ''}`}
                onClick={() => setSelectedRole('guru')}
              >
                Guru &amp; Tendik
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'kepsek'}
                className={`${styles.segTab} ${selectedRole === 'kepsek' ? styles.segTabActive : ''}`}
                onClick={() => setSelectedRole('kepsek')}
              >
                Kepala Sekolah
              </button>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <Info size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="auth-email" className={styles.fieldLabel}>
                    {selectedRole === 'guru' ? 'Email atau Username / NIP' : 'Email Akun'}
                  </label>
                </div>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <Mail size={15} />
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
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="auth-password" className={styles.fieldLabel}>
                    Kata Sandi
                  </label>
                  {capsLockActive && (
                    <span className={styles.capsLockTag}>Caps Lock Aktif</span>
                  )}
                </div>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <KeyRound size={15} />
                  </span>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyModifierCheck}
                    onKeyUp={handleKeyModifierCheck}
                    className={styles.formInput}
                    autoComplete="current-password"
                    style={{ paddingRight: '38px' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Ruang Kerja</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Modern Mobile Guidance Banner */}
            <div className={styles.mobileNoticeCard}>
              <div className={styles.mobileIconBox}>
                <Smartphone size={16} />
              </div>
              <div className={styles.mobileNoticeText}>
                <p className={styles.mobileNoticeTitle}>Akses Siswa &amp; Orang Tua / Wali</p>
                <p className={styles.mobileNoticeSub}>
                  Gunakan aplikasi Android Akselerasi-Edu untuk presensi dan e-rapor.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel Footer */}
          <div className={styles.rightFooter}>
            <span>Butuh bantuan? Hubungi Admin TI Sekolah</span>
            <span
              className={styles.sysAdminSecretLink}
              title="Akses Sistem"
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
