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
      {/* ── Top Bar ── */}
      <header className={styles.topBar}>
        <Link href="/login" className={styles.backLink} title="Kembali ke Portal Sekolah">
          <ArrowLeft size={14} />
          <span>Kembali ke Portal Sekolah</span>
        </Link>
        <span className={styles.escNotice}>
          Tekan <kbd>Esc</kbd> untuk kembali
        </span>
      </header>

      {/* ── Center Gateway Card ── */}
      <main className={styles.mainContainer}>
        <div className={styles.authCard}>
          <div className={styles.headerGroup}>
            <div className={styles.logoFrame}>
              <ShieldCheck size={26} />
            </div>
            <div className={styles.titleGroup}>
              <h1 className={styles.consoleTitle}>Konsol Pengelola Pusat</h1>
              <p className={styles.consoleSubtitle}>Akselerasi-Edu • Super Administrator</p>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="sys-email" className={styles.fieldLabel}>
                  Email Master
                </label>
              </div>
              <div className={styles.fieldInputWrapper}>
                <span className={styles.fieldIcon}>
                  <Mail size={15} />
                </span>
                <input
                  id="sys-email"
                  type="email"
                  required
                  placeholder="sysadmin@akselerasi-edu.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.fieldInput}
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="sys-password" className={styles.fieldLabel}>
                  Kata Sandi Master
                </label>
                {capsLockActive && <span className={styles.capsLockBadge}>CAPS LOCK</span>}
              </div>
              <div className={styles.fieldInputWrapper}>
                <span className={styles.fieldIcon}>
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
                  className={styles.fieldInput}
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
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>Sesi Aman Terenkripsi TLS 1.3</span>
        <span>Akselerasi-Edu v2.4</span>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
