'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { login as sdkLogin } from '@/lib/sdk';
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

  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const checkMaintenanceStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/system/maintenance-status');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.maintenance_mode) {
          setMaintenance({
            is_active: true,
            message: json.data.maintenance_message || 'Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit.'
          });
        } else {
          setMaintenance({ is_active: false, message: '' });
        }
      }
    } catch {
      // Backend offline or unreachable
    }
  };

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

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
            full_name: payload.full_name || '',
            role: payload.role || 'Administrator',
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
          message: (apiErr as any)?.message || 'Sistem sedang dalam mode pemeliharaan server oleh Super Admin.'
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
    { icon: '\u2699\uFE0F', title: 'Manajemen Data Sekolah', desc: 'Kelola data siswa, guru, kelas, dan mata pelajaran secara terpusat' },
    { icon: '\uD83D\uDCCA', title: 'Analitik & Laporan', desc: 'Pantau kinerja akademik real-time dan ekspor laporan otomatis' },
    { icon: '\uD83D\uDCF1', title: 'Terhubung ke Aplikasi Mobile', desc: 'Sinkron langsung dengan app Android untuk siswa, guru, dan orang tua' },
    { icon: '\uD83D\uDD10', title: 'Keamanan Data', desc: 'Proteksi data terenkripsi dengan log aktivitas lengkap' },
  ];

  if (isLoading || isAuthenticated) {
    return null;
  }

  /* ── FULLSCREEN MAINTENANCE SCREEN ── */
  if (maintenance?.is_active) {
    return (
      <div className={styles.root} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
        <div className={styles.gridOverlay} />

        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '24px',
          maxWidth: '620px',
          width: '100%',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.2)',
          zIndex: 10,
          animation: 'fadeIn 0.4s ease'
        }}>
          {/* Animated Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)'
          }}>
            🛡️
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem'
          }}>
            <span>●</span>
            <span>Mode Pemeliharaan Aktif</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            Server Sedang Dalam Pemeliharaan
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            Akses masuk ke portal sekolah ditutup sementara untuk peningkatan performa, sinkronisasi data, dan pemeliharaan server oleh tim teknis.
          </p>

          {/* Broadcast Message Box */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              📢 Pesan dari Super Admin:
            </div>
            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic' }}>
              &ldquo;{maintenance.message}&rdquo;
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={checkMaintenanceStatus}
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              🔄 Cek Status Server Sekarang
            </button>

            <a
              href="/system-admin/login"
              style={{
                display: 'inline-block',
                padding: '0.65rem',
                color: '#60a5fa',
                fontSize: '0.84rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
            >
              🔑 Masuk sebagai Super Admin / Command Center &rarr;
            </a>
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
                    placeholder="admin@sekolah.id"
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
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
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
                  <p style={{ fontSize: '0.72rem', color: 'rgba(165,180,252,0.45)', margin: 0 }}>Khusus Siswa, Guru, dan Orang Tua / Wali</p>
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.2rem 0.5rem', borderRadius: 100, width: 'fit-content' }}>
                  Aplikasi Android Native
                </span>
                <p style={{ fontSize: '0.78rem', color: 'rgba(165,180,252,0.5)', marginTop: 6, marginBottom: 0, lineHeight: 1.55 }}>
                  Portal web ini khusus untuk <strong style={{ color: '#c7d2fe' }}>Administrator &amp; Staf Tata Usaha</strong>. Pengguna lainnya:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Siswa', desc: 'Jadwal pelajaran, kumpul tugas digital, presensi, dan nilai rapor.' },
                  { label: 'Guru', desc: 'Input nilai, absensi harian siswa, dan publikasi materi pembelajaran.' },
                  { label: 'Orang Tua / Wali', desc: 'Pantau kehadiran real-time, tagihan sekolah, dan komunikasi wali kelas.' },
                ].map((item, i) => (
                  <div key={i} className={styles.androidFeature}>
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(5,150,105,0.07)', borderRadius: 10, border: '1px solid rgba(5,150,105,0.18)', fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Build Android (Kotlin + Jetpack Compose) tersedia di folder /android
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
