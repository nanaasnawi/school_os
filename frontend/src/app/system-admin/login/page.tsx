'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import {
  ShieldAlert,
  Terminal,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Activity,
  Server,
  Lock,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
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
    document.title = 'Root Command Center — School OS';
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
        setError(json?.message || 'Autentikasi gagal: Kredensial Root Administrator tidak sah.');
      }
    } catch {
      setError('Koneksi ke gateway autentikasi terputus atau ditolak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Background space and grid */}
      <div className={styles.bgAtmosphere} />
      <div className={styles.bgGrid} />

      <div className={styles.container}>
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL — CLUSTER MISSION CONTROL & NODE TELEMETRY
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.terminalPanel}>
          {/* Top Panel Header */}
          <div className={styles.panelHeader}>
            <Link href="/login" className={styles.backLink} title="Kembali ke Portal Sekolah">
              <ArrowLeft size={14} />
              <span>Portal Sekolah</span>
            </Link>

            <div className={styles.brandIdentity}>
              <div className={styles.brandLogoBox}>
                <ShieldAlert size={24} color="#f87171" />
              </div>
              <div className={styles.brandTitles}>
                <div className={styles.systemBadgeRow}>
                  <span className={styles.rootBadge}>ROOT PRIVILEGE</span>
                  <span className={styles.envBadge}>CLUSTER-AP-ID</span>
                </div>
                <h1 className={styles.systemTitle}>Command Center</h1>
                <p className={styles.systemSubtitle}>School OS Platform Control &amp; Provisioning</p>
              </div>
            </div>
          </div>

          {/* Center Telemetry & Hardware Node Status */}
          <div className={styles.telemetrySection}>
            <div>
              <h2 className={styles.missionTagline}>
                Operasional Multi-Tenant{' '}
                <span className={styles.missionTaglineRed}>Tingkat Pusat</span>
              </h2>
              <p className={styles.missionDesc}>
                Akses level sistem terdistribusi untuk pengawasan master instance sekolah, aktivasi tenant,
                pemantauan throughput API, dan manajemen infrastruktur database.
              </p>
            </div>

            {/* Simulated Live Terminal Cluster Status Box */}
            <div className={styles.terminalCard}>
              <div className={styles.terminalBar}>
                <div className={styles.terminalLights}>
                  <span className={styles.termLightRed} />
                  <span className={styles.termLightYellow} />
                  <span className={styles.termLightGreen} />
                </div>
                <span>sys_cluster_diagnostics.sh</span>
                <span>TCP:443</span>
              </div>
              <div className={styles.terminalContent}>
                <div className={styles.terminalRow}>
                  <span className={styles.termKey}>TARGET_ZONE</span>
                  <span className={styles.termVal}>AP-SOUTHEAST-3 (ID)</span>
                </div>
                <div className={styles.terminalRow}>
                  <span className={styles.termKey}>CLUSTER_HEALTH</span>
                  <span className={styles.termValSuccess}>
                    <span className={styles.liveDot} /> ALL NODES SYNCHRONIZED
                  </span>
                </div>
                <div className={styles.terminalRow}>
                  <span className={styles.termKey}>DATA_ISOLATION</span>
                  <span className={styles.termVal}>ROW-LEVEL + TENANT SCHEMAS</span>
                </div>
                <div className={styles.terminalRow}>
                  <span className={styles.termKey}>HARDWARE_RNG</span>
                  <span className={styles.termVal}>CHACHA20-POLY1305 / TLS 1.3</span>
                </div>
                <div className={styles.terminalRow}>
                  <span className={styles.termKey}>AUDIT_TRAIL</span>
                  <span className={styles.termValAlert}>IMMUTABLE JOURNALING ENFORCED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Audit Footer */}
          <div className={styles.auditNoticeFooter}>
            <div className={styles.auditItem}>
              <Activity size={13} />
              <span>LOGGING: IP &amp; GEO-SIGNATURE LOGGED</span>
            </div>
            <span>REV: 2.4.0-CORE</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — MASTER ROOT AUTHENTICATION FORM
            ══════════════════════════════════════════════════════════ */}
        <div className={styles.formPanel}>
          <div className={styles.formTopBar}>
            <div className={styles.securityShieldBadge}>
              <Lock size={12} />
              <span>SUPER ADMIN CONSOLE</span>
            </div>
            <span className={styles.escNotice}>
              Tekan <kbd>Esc</kbd> untuk kembali
            </span>
          </div>

          <div className={styles.formContentWrapper}>
            <div className={styles.formHeading}>
              <h2 className={styles.formTitle}>Otorisasi Sistem</h2>
              <p className={styles.formDesc}>
                Masukkan kredensial operator master untuk membuka sesi root platform.
              </p>
            </div>

            <div className={styles.warningPill}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#f87171' }} />
              <span>
                <strong>Akses Terbatas:</strong> Seluruh aktivitas dan perubahan konfigurasi sistem
                dicatat secara permanen dalam audit trail pengawas platform.
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
                    SYS_ADMIN_IDENTITY
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
                    placeholder="sysadmin@schoolos.id"
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
                    SYS_SECRET_KEY
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
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyModifierCheck}
                    onKeyUp={handleKeyModifierCheck}
                    className={styles.formInput}
                    autoComplete="current-password"
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan secret' : 'Tampilkan secret'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>MENGOTENTIKASI KUNCI...</span>
                  </>
                ) : (
                  <>
                    <Terminal size={15} />
                    <span>BUKA KONSOL UTAMA</span>
                    <ChevronRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={styles.formBottomBar}>
            <span>ENDPOINT: /api/v1/system/login</span>
            <span>TLSv1.3 AES-256-GCM</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
