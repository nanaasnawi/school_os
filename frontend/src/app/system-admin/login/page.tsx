'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Building2,
  Database,
  Layers,
} from 'lucide-react';
import styles from './system-admin.module.css';

export default function SystemAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Return to School Portal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    document.title = 'Konsol Pengelola Pusat — Akselerasi-Edu';
  }, []);

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
      const res = await fetch(getApiUrl('/api/v1/system/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Save the privileged sysAdminToken
        localStorage.setItem('sysAdminToken', data.data.token);
        router.push('/system-admin/dashboard');
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.message || 'Autentikasi gagal: Kredensial Administrator Pusat tidak sesuai.');
      }
    } catch {
      setError('Koneksi ke gateway autentikasi terputus atau ditolak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL — NATIONAL PLATFORM CONSOLE & CORE PILLARS
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.terminalPanel}>
          {/* Top Panel Header */}
          <div className={styles.panelHeader}>
            <Link href="/login" className={styles.backLink} title="Kembali ke Portal Sekolah">
              <ArrowLeft size={14} />
              <span>Kembali ke Portal Sekolah</span>
            </Link>

            <div className={styles.brandIdentity}>
              <div className={styles.brandLogoBox}>
                <ShieldCheck size={26} />
              </div>
              <div className={styles.brandTitles}>
                <div className={styles.systemBadgeRow}>
                  <span className={styles.rootBadge}>SUPER ADMIN</span>
                  <span className={styles.envBadge}>PORTAL PUSAT</span>
                </div>
                <h1 className={styles.systemTitle}>Konsol Pengelola Pusat</h1>
                <p className={styles.systemSubtitle}>Akselerasi-Edu Platform Management &amp; Provisioning</p>
              </div>
            </div>
          </div>

          {/* Center Pillars */}
          <div className={styles.telemetrySection}>
            <div>
              <h2 className={styles.missionTagline}>
                Pusat Kendali Ekosistem{' '}
                <span className={styles.missionTaglineHighlight}>Pendidikan Nasional</span>
              </h2>
              <p className={styles.missionDesc}>
                Akses administratif terpusat untuk pengawasan seluruh instansi sekolah (SD, SMP, SMA, PKBM),
                aktivasi tenant, pengawasan integrasi Dapodik, dan tata kelola akun master.
              </p>
            </div>

            {/* Platform Control Pillars Card */}
            <div className={styles.terminalCard}>
              <div className={styles.terminalBar}>
                <span>Lingkup Manajemen Platform</span>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} /> Sesi Terproteksi
                </span>
              </div>

              <div className={styles.pillarList}>
                <div className={styles.pillarItem}>
                  <div className={styles.pillarIcon}>
                    <Building2 size={16} />
                  </div>
                  <div className={styles.pillarDetails}>
                    <span className={styles.pillarTitle}>Tata Kelola Multi-Instansi Sekolah</span>
                    <span className={styles.pillarSub}>
                      Monitoring status operasional, lisensi, dan direktori sekolah secara terpadu.
                    </span>
                  </div>
                </div>

                <div className={styles.pillarItem}>
                  <div className={styles.pillarIcon}>
                    <Database size={16} />
                  </div>
                  <div className={styles.pillarDetails}>
                    <span className={styles.pillarTitle}>Supervisi Pipeline Dapodik &amp; Rapor</span>
                    <span className={styles.pillarSub}>
                      Pengawasan sinkronisasi data Dapodik Kemendikdasmen dan integritas basis data.
                    </span>
                  </div>
                </div>

                <div className={styles.pillarItem}>
                  <div className={styles.pillarIcon}>
                    <Layers size={16} />
                  </div>
                  <div className={styles.pillarDetails}>
                    <span className={styles.pillarTitle}>Manajemen Lisensi &amp; Akun Kepala Sekolah</span>
                    <span className={styles.pillarSub}>
                      Provisi akun pimpinan institusi, audit trail keamanan, dan kontrol privilege.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Audit Footer */}
          <div className={styles.auditNoticeFooter}>
            <span>Akses Terpantau • Audit Trail Terverifikasi</span>
            <span>Versi 2.4.0</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — MASTER ROOT AUTHENTICATION FORM
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.formPanel}>
          <div className={styles.formTopBar}>
            <div className={styles.securityShieldBadge}>
              <Lock size={12} />
              <span>KONSOL SUPER ADMINISTRATOR</span>
            </div>
            <span className={styles.escNotice}>
              Tekan <kbd>Esc</kbd> untuk kembali
            </span>
          </div>

          <div className={styles.formContentWrapper}>
            <div className={styles.formHeading}>
              <h2 className={styles.formTitle}>Otorisasi Akses Pusat</h2>
              <p className={styles.formDesc}>
                Masukkan kredensial administrator master untuk membuka sesi kerja kendali platform.
              </p>
            </div>

            <div className={styles.warningPill}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Perhatian Keamanan:</strong> Seluruh interaksi dan perubahan data pada konsol ini
                dicatat secara permanen dalam catatan audit sistem platform.
              </span>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="sys-email" className={styles.label}>
                    Email Administrator Master
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="sys-email"
                    type="email"
                    required
                    placeholder="sysadmin@akselerasi-edu.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    autoComplete="email"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="sys-password" className={styles.label}>
                    Kata Sandi Master
                  </label>
                  {capsLockActive && <span className={styles.capsLockTag}>CAPS LOCK</span>}
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="sys-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi master"
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
                    <span>Memverifikasi Akses Master...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Konsol Pengelola</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={styles.formBottomBar}>
            <span>Akselerasi-Edu Platform Management</span>
            <span>Akses Terlindungi TLS 1.3</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
