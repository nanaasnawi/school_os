'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/(auth)/login/login.module.css';

export default function SystemAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/system/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        // Save the special sysAdminToken
        localStorage.setItem('sysAdminToken', data.data.token);
        router.push('/system-admin/dashboard');
      } else {
        setError('Kredensial System Admin tidak valid.');
      }
    } catch (err) {
      setError('Koneksi ke server terputus.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Animated blob backgrounds */}
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />
      <div className={styles.bgBlob3} />
      <div className={styles.gridOverlay} />

      <div className={styles.container}>
        {/* LEFT BRAND PANEL (Customized for System Admin) */}
        <div className={styles.brandPanel} style={{ background: 'linear-gradient(150deg, rgba(14,165,233,0.04) 0%, rgba(2,132,199,0.02) 50%, rgba(56,189,248,0.01) 100%)' }}>
          <div className={styles.brandContent}>
            {/* Logo */}
            <div className={styles.logoMark} style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))', borderColor: 'rgba(239,68,68,0.35)' }}>
              <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
                <rect width="64" height="64" rx="18" fill="rgba(239,68,68,0.5)" />
                <path d="M32 10L50 18V32C50 43.5 42.5 51.5 32 55C21.5 51.5 14 43.5 14 32V18L32 10Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M22 30.5V38C22 41 26.5 43.5 32 43.5C37.5 43.5 42 41 42 38V30.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Brand heading */}
            <div className={styles.brandHeading}>
              <h1 className={styles.brandName} style={{ color: '#fca5a5' }}>Command Center</h1>
              <p className={styles.brandTagline}>School OS Super Admin Portal</p>
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>👑</div>
                <div>
                  <div className={styles.featureTitle}>Akses Penuh</div>
                  <div className={styles.featureDesc}>Kelola semua tenant dan sekolah secara sentral.</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>🔑</div>
                <div>
                  <div className={styles.featureTitle}>Aktivasi Master</div>
                  <div className={styles.featureDesc}>Buat dan aktivasikan akun Kepala Sekolah instan.</div>
                </div>
              </div>
            </div>
            
            <div className={styles.statusLine}>
              <span className={styles.statusDot} style={{ background: '#f87171', boxShadow: '0 0 8px #f87171' }} />
              <span style={{ color: '#f87171' }}>System Admin Access \u2014 Restricted Area</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className={styles.formPanel}>
          <div className={styles.formCard}>

            {/* Header */}
            <div className={styles.formHeader}>
              <div className={styles.formBadge} style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.2)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Super Admin
              </div>
              <h2 className={styles.formTitle}>System Login</h2>
              <p className={styles.formSub}>Masuk menggunakan kredensial master administrator</p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email Admin</label>
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
                    placeholder="sysadmin@schoolos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Master Password</label>
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

              <button type="submit" disabled={loading} className={styles.submitBtn} style={{ background: '#b91c1c', color: 'white' }}>
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Memverifikasi...
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Masuk Command Center
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
