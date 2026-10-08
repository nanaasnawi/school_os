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
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Activity,
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
    document.title = 'Super Admin — Akselerasi-Edu';
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
        setError(json?.message || 'Kredensial Super Admin tidak sesuai.');
      }
    } catch {
      setError('Koneksi ke gateway terputus.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL — EXECUTIVE NATIONAL TELEMETRY
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <Link href="/login" className={styles.backLink} title="Kembali ke Portal Sekolah">
              <ArrowLeft size={14} />
              <span>Portal Sekolah</span>
            </Link>
            <span className={styles.rootTag}>SUPER ADMIN</span>
          </div>

          <div className={styles.centerGlance}>
            <div>
              <h1 className={styles.glanceHeadline}>
                Konsol Pengelola <span className={styles.headlineAccent}>Pusat</span>
              </h1>
              <p className={styles.glanceSub}>
                Pusat kendali multi-instansi sekolah dan tata kelola infrastruktur platform nasional.
              </p>
            </div>

            {/* Living System Status Card */}
            <div className={styles.glassWidget}>
              <div className={styles.widgetTopBar}>
                <div className={styles.widgetTitleGroup}>
                  <Activity size={14} color="#38bdf8" />
                  <span>Status Gateway Platform</span>
                </div>
                <div className={styles.liveBeacon}>
                  <span className={styles.pulseDot} />
                  <span>Sesi Terproteksi</span>
                </div>
              </div>

              <div className={styles.statTilesRow}>
                <div className={styles.statTile}>
                  <span className={styles.statVal}>38</span>
                  <span className={styles.statLabel}>Provinsi Terkoneksi</span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statVal}>100%</span>
                  <span className={styles.statLabel}>Pipeline Dapodik</span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statVal}>Aktif</span>
                  <span className={styles.statLabel}>Audit Trail</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.leftFooter}>
            <span>Akselerasi-Edu Platform Management</span>
            <span>v2.4.0</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — FOCUSED AUTHENTICATION FORM
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.rightPanel}>
          <div className={styles.rightTopNav}>
            <span className={styles.escNotice}>
              Tekan <kbd>Esc</kbd> untuk kembali
            </span>
          </div>

          <div className={styles.formBox}>
            <div className={styles.formTitles}>
              <h2 className={styles.formMainTitle}>Masuk Super Admin</h2>
              <p className={styles.formMainSub}>
                Masukkan kredensial administrator master platform.
              </p>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="sys-email" className={styles.fieldLabel}>
                    Email Administrator
                  </label>
                </div>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <Mail size={15} />
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
                  <label htmlFor="sys-password" className={styles.fieldLabel}>
                    Kata Sandi Master
                  </label>
                  {capsLockActive && <span className={styles.capsLockTag}>CAPS LOCK</span>}
                </div>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <KeyRound size={15} />
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
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Konsol Pengelola</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={styles.rightFooter}>
            <span>Akses Terlindungi TLS 1.3</span>
            <span>Audit Logging Enforced</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
