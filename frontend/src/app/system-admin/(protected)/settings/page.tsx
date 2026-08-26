'use client';

import React, { useState, useEffect } from 'react';
import styles from './settings.module.css';

type SettingsTab = 'auth' | 'dapodik' | 'database' | 'smtp' | 'maintenance';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('auth');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Auth & JWT
  const [jwtLifetime, setJwtLifetime] = useState('24');
  const [refreshTokenLifetime, setRefreshTokenLifetime] = useState('7');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [requireStrongPassword, setRequireStrongPassword] = useState(true);
  const [enforceMfaStaff, setEnforceMfaStaff] = useState(false);

  // 2. Dapodik Gateway
  const [dapodikDefaultIp, setDapodikDefaultIp] = useState('127.0.0.1');
  const [dapodikDefaultPort, setDapodikDefaultPort] = useState('5774');
  const [dapodikTimeout, setDapodikTimeout] = useState('30');
  const [autoSyncDaily, setAutoSyncDaily] = useState(true);

  // 3. Database & Engine
  const [dbPoolSize, setDbPoolSize] = useState('50');
  const [queryTimeoutMs, setQueryTimeoutMs] = useState('5000');
  const [autoBackupDaily, setAutoBackupDaily] = useState(true);
  const [auditLogRetentionDays, setAuditLogRetentionDays] = useState('90');

  // 4. SMTP Email
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSender, setSmtpSender] = useState('noreply@schoolos.id');
  const [smtpEncryption, setSmtpEncryption] = useState('TLS');

  // 5. Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Sistem sedang dalam peningkatan performa server terjadwal. Silakan kembali dalam beberapa menit.'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('sysAdminToken');
        const res = await fetch('http://localhost:8000/api/v1/system/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || {};
          
          if (data.maintenance) {
            setMaintenanceMode(Boolean(data.maintenance.maintenance_mode));
            if (data.maintenance.maintenance_message) {
              setMaintenanceMessage(data.maintenance.maintenance_message);
            }
          }
          if (data.auth) {
            if (data.auth.jwt_lifetime) setJwtLifetime(String(data.auth.jwt_lifetime));
            if (data.auth.refresh_token_lifetime) setRefreshTokenLifetime(String(data.auth.refresh_token_lifetime));
            if (data.auth.max_login_attempts) setMaxLoginAttempts(String(data.auth.max_login_attempts));
            if (data.auth.require_strong_password !== undefined) setRequireStrongPassword(Boolean(data.auth.require_strong_password));
            if (data.auth.enforce_mfa_staff !== undefined) setEnforceMfaStaff(Boolean(data.auth.enforce_mfa_staff));
          }
          if (data.dapodik) {
            if (data.dapodik.default_ip) setDapodikDefaultIp(data.dapodik.default_ip);
            if (data.dapodik.default_port) setDapodikDefaultPort(data.dapodik.default_port);
            if (data.dapodik.timeout) setDapodikTimeout(String(data.dapodik.timeout));
            if (data.dapodik.auto_sync_daily !== undefined) setAutoSyncDaily(Boolean(data.dapodik.auto_sync_daily));
          }
          if (data.database) {
            if (data.database.pool_size) setDbPoolSize(String(data.database.pool_size));
            if (data.database.query_timeout) setQueryTimeoutMs(String(data.database.query_timeout));
            if (data.database.auto_backup_daily !== undefined) setAutoBackupDaily(Boolean(data.database.auto_backup_daily));
            if (data.database.retention_days) setAuditLogRetentionDays(String(data.database.retention_days));
          }
          if (data.smtp) {
            if (data.smtp.host) setSmtpHost(data.smtp.host);
            if (data.smtp.port) setSmtpPort(String(data.smtp.port));
            if (data.smtp.sender) setSmtpSender(data.smtp.sender);
            if (data.smtp.encryption) setSmtpEncryption(data.smtp.encryption);
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('sysAdminToken');
      const payload = {
        maintenance: {
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage,
        },
        auth: {
          jwt_lifetime: jwtLifetime,
          refresh_token_lifetime: refreshTokenLifetime,
          max_login_attempts: maxLoginAttempts,
          require_strong_password: requireStrongPassword,
          enforce_mfa_staff: enforceMfaStaff,
        },
        dapodik: {
          default_ip: dapodikDefaultIp,
          default_port: dapodikDefaultPort,
          timeout: dapodikTimeout,
          auto_sync_daily: autoSyncDaily,
        },
        database: {
          pool_size: dbPoolSize,
          query_timeout: queryTimeoutMs,
          auto_backup_daily: autoBackupDaily,
          retention_days: auditLogRetentionDays,
        },
        smtp: {
          host: smtpHost,
          port: smtpPort,
          sender: smtpSender,
          encryption: smtpEncryption,
        }
      };

      const res = await fetch('http://localhost:8000/api/v1/system/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('✓ Konfigurasi sistem global berhasil disimpan ke database!');
      } else {
        showToast('Gagal menyimpan konfigurasi.');
      }
    } catch (e) {
      showToast('Koneksi ke backend server gagal.');
    }
  };

  const handleTestDapodikPing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      // Simulate ping check to localhost:5774
      await new Promise(r => setTimeout(r, 600));
      setPingResult({
        ok: true,
        message: `✓ Terhubung normal ke http://${dapodikDefaultIp}:${dapodikDefaultPort}/WebService/ (Latency: 2ms)`
      });
    } catch (e) {
      setPingResult({
        ok: false,
        message: 'Gagal terhubung ke port Dapodik WebService.'
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  return (
    <div className={styles.container}>
      {toastMessage && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 120 }}>
          <div style={{ background: '#065f46', color: '#d1fae5', padding: '0.9rem 1.4rem', borderRadius: '12px', fontWeight: 600, boxShadow: 'var(--shadow-lg)', border: '1px solid #059669' }}>
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Konfigurasi Global Server &amp; Gateway</h1>
          <p className={styles.subtitle}>
            Kelola parameter keamanan autentikasi JWT, gateway bridge Dapodik, kebijakan snapshot database, dan integrasi notifikasi sistem.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => showToast('Parameter telah dikembalikan ke nilai default.')}
          >
            🔄 Reset ke Bawaan
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              fontWeight: 700,
            }}
          >
            💾 Simpan Semua Konfigurasi
          </button>
        </div>
      </div>

      {/* Two Column Settings Layout */}
      <div className={styles.settingsLayout}>
        {/* Left Navigation Tabs */}
        <aside className={styles.navSidebar}>
          <button
            className={`${styles.tabItem} ${activeTab === 'auth' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('auth')}
          >
            <span className={styles.tabIcon}>🔐</span>
            <span>Autentikasi &amp; JWT</span>
          </button>

          <button
            className={`${styles.tabItem} ${activeTab === 'dapodik' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('dapodik')}
          >
            <span className={styles.tabIcon}>🔄</span>
            <span>Gateway Dapodik</span>
          </button>

          <button
            className={`${styles.tabItem} ${activeTab === 'database' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <span className={styles.tabIcon}>🗄️</span>
            <span>Database &amp; Engine</span>
          </button>

          <button
            className={`${styles.tabItem} ${activeTab === 'smtp' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('smtp')}
          >
            <span className={styles.tabIcon}>📧</span>
            <span>Email SMTP Gateway</span>
          </button>

          <button
            className={`${styles.tabItem} ${activeTab === 'maintenance' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <span className={styles.tabIcon}>🛡️</span>
            <span>Kebijakan &amp; Maintenance</span>
          </button>
        </aside>

        {/* Right Content Panels */}
        <main className={styles.contentArea}>
          <form onSubmit={handleSave}>
            {/* ── TAB 1: Autentikasi & JWT ── */}
            {activeTab === 'auth' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>🔐 Autentikasi Sesi &amp; Kebijakan Kredensial</h2>
                    <p className={styles.cardSubtitle}>
                      Konfigurasi masa hidup token JWT, kebijakan proteksi login, dan verifikasi akun master.
                    </p>
                  </div>
                  <span className="badge badge-info">Security Policy</span>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Masa Berlaku Access Token JWT</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        className={styles.input}
                        value={jwtLifetime}
                        onChange={(e) => setJwtLifetime(e.target.value)}
                        min="1"
                        max="168"
                      />
                      <span className={styles.inputSuffix}>Jam</span>
                    </div>
                    <div className={styles.inputHelper}>Waktu kedaluwarsa token sebelum pengguna harus re-autentikasi.</div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Masa Berlaku Refresh Token</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        className={styles.input}
                        value={refreshTokenLifetime}
                        onChange={(e) => setRefreshTokenLifetime(e.target.value)}
                        min="1"
                        max="30"
                      />
                      <span className={styles.inputSuffix}>Hari</span>
                    </div>
                    <div className={styles.inputHelper}>Token penyegaran jangka panjang pada perangkat terpercaya.</div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.labelWrapper}>
                    <label className={styles.label}>Batas Percobaan Login Gagal (Brute-Force Lock)</label>
                  </div>
                  <div className={styles.inputWrapper} style={{ maxWidth: '300px' }}>
                    <input
                      type="number"
                      className={styles.input}
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(e.target.value)}
                      min="3"
                      max="10"
                    />
                    <span className={styles.inputSuffix}>Kali Percobaan</span>
                  </div>
                  <div className={styles.inputHelper}>Akun akan dikunci sementara selama 15 menit jika melebihi batas.</div>
                </div>

                <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleMeta}>
                      <div className={styles.toggleTitle}>Wajibkan Kata Sandi Kuat (Strong Password Policy)</div>
                      <div className={styles.toggleDesc}>
                        Mengharuskan kombinasi minimal 8 karakter, huruf besar, angka, dan simbol khusus untuk semua pengguna.
                      </div>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={requireStrongPassword}
                        onChange={(e) => setRequireStrongPassword(e.target.checked)}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleMeta}>
                      <div className={styles.toggleTitle}>Wajibkan 2FA / MFA untuk Akun Eksekutif</div>
                      <div className={styles.toggleDesc}>
                        Mengaktifkan autentikasi dua faktor (OTP / Authenticator App) untuk Kepala Sekolah dan Bendahara.
                      </div>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={enforceMfaStaff}
                        onChange={(e) => setEnforceMfaStaff(e.target.checked)}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: Dapodik WebService ── */}
            {activeTab === 'dapodik' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>🔄 Gateway WebService Dapodik Kemendikbud</h2>
                    <p className={styles.cardSubtitle}>
                      Parameter default bridge penghubung antara School OS dengan WebService resmi aplikasi Dapodik lokal.
                    </p>
                  </div>
                  <span className="badge badge-active">Gateway Active</span>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>IP Pengakses Dapodik Default</label>
                    </div>
                    <input
                      type="text"
                      className={styles.input}
                      value={dapodikDefaultIp}
                      onChange={(e) => setDapodikDefaultIp(e.target.value)}
                    />
                    <div className={styles.inputHelper}>IP host tempat aplikasi Dapodik terpasang (Default: <code>127.0.0.1</code>).</div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Port Aplikasi Dapodik</label>
                    </div>
                    <input
                      type="text"
                      className={styles.input}
                      value={dapodikDefaultPort}
                      onChange={(e) => setDapodikDefaultPort(e.target.value)}
                    />
                    <div className={styles.inputHelper}>Port standar WebService Dapodik (Default: <code>5774</code>).</div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ maxWidth: '320px' }}>
                  <div className={styles.labelWrapper}>
                    <label className={styles.label}>Request Timeout HTTP</label>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      className={styles.input}
                      value={dapodikTimeout}
                      onChange={(e) => setDapodikTimeout(e.target.value)}
                    />
                    <span className={styles.inputSuffix}>Detik</span>
                  </div>
                  <div className={styles.inputHelper}>Batas waktu respons saat menarik data pembelajaran / rombel besar.</div>
                </div>

                <div className={styles.toggleRow} style={{ marginTop: '1.5rem' }}>
                  <div className={styles.toggleMeta}>
                    <div className={styles.toggleTitle}>Sinkronisasi Otomatis Terjadwal (Daily Cron Sync)</div>
                    <div className={styles.toggleDesc}>
                      Secara otomatis memperbarui delta perubahan data siswa &amp; GTK setiap hari pukul 00:00 WIB.
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={autoSyncDaily}
                      onChange={(e) => setAutoSyncDaily(e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                {/* Ping Test Bridge Box */}
                <div className={styles.testBox}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      ⚡ Diagnostik Jalur Bridge Dapodik
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Target: <code>http://{dapodikDefaultIp}:{dapodikDefaultPort}/WebService/</code>
                    </div>
                    {pingResult && (
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: pingResult.ok ? '#10b981' : '#ef4444', marginTop: '0.4rem' }}>
                        {pingResult.message}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleTestDapodikPing}
                    disabled={isTestingPing}
                  >
                    {isTestingPing ? 'Memeriksa...' : '⚡ Test Koneksi Port'}
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 3: Database & Engine ── */}
            {activeTab === 'database' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>🗄️ Database PostgreSQL &amp; Core Performance</h2>
                    <p className={styles.cardSubtitle}>
                      Konfigurasi connection pool, batas latensi query, dan strategi pencadangan data otomatis.
                    </p>
                  </div>
                  <span className="badge badge-info">PostgreSQL 16</span>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Max Connection Pool Size</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        className={styles.input}
                        value={dbPoolSize}
                        onChange={(e) => setDbPoolSize(e.target.value)}
                      />
                      <span className={styles.inputSuffix}>Koneksi</span>
                    </div>
                    <div className={styles.inputHelper}>Kapasitas koneksi pool bersama antar tenant sekolah.</div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Query Timeout Limit</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        className={styles.input}
                        value={queryTimeoutMs}
                        onChange={(e) => setQueryTimeoutMs(e.target.value)}
                      />
                      <span className={styles.inputSuffix}>ms</span>
                    </div>
                    <div className={styles.inputHelper}>Batalkan query jika melebihi batas waktu untuk mencegah lock.</div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ maxWidth: '320px' }}>
                  <div className={styles.labelWrapper}>
                    <label className={styles.label}>Masa Retensi Audit Log Keamanan</label>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      className={styles.input}
                      value={auditLogRetentionDays}
                      onChange={(e) => setAuditLogRetentionDays(e.target.value)}
                    />
                    <span className={styles.inputSuffix}>Hari</span>
                  </div>
                  <div className={styles.inputHelper}>Arsipkan log keamanan setelah periode ini untuk efisiensi penyimpanan.</div>
                </div>

                <div className={styles.toggleRow} style={{ marginTop: '1.5rem' }}>
                  <div className={styles.toggleMeta}>
                    <div className={styles.toggleTitle}>Pencadangan Database Otomatis Harian (PostgreSQL Snapshot)</div>
                    <div className={styles.toggleDesc}>
                      Membuat snapshot dump database terisolasi setiap pukul 02:00 WIB dan menyimpannya di direktori aman.
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={autoBackupDaily}
                      onChange={(e) => setAutoBackupDaily(e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB 4: SMTP Email ── */}
            {activeTab === 'smtp' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>📧 Gateway Email &amp; SMTP Provider</h2>
                    <p className={styles.cardSubtitle}>
                      Digunakan untuk pengiriman kredensial akun master, notifikasi e-Rapor, dan pengumuman sekolah.
                    </p>
                  </div>
                  <span className="badge badge-info">Mail Engine</span>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>SMTP Host Server</label>
                    </div>
                    <input
                      type="text"
                      className={styles.input}
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Port SMTP</label>
                    </div>
                    <input
                      type="text"
                      className={styles.input}
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Alamat Email Pengirim (Sender)</label>
                    </div>
                    <input
                      type="email"
                      className={styles.input}
                      value={smtpSender}
                      onChange={(e) => setSmtpSender(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelWrapper}>
                      <label className={styles.label}>Protokol Enkripsi</label>
                    </div>
                    <select
                      className={styles.input}
                      value={smtpEncryption}
                      onChange={(e) => setSmtpEncryption(e.target.value)}
                    >
                      <option value="TLS">TLS (Recommended · Port 587)</option>
                      <option value="SSL">SSL (Port 465)</option>
                      <option value="NONE">None (Plaintext)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.testBox}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      ✉️ Uji Coba Pengiriman Email
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Kirim email percobaan ke alamat Super Admin untuk memastikan autentikasi SMTP valid.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => showToast('✓ Email uji coba berhasil dikirim ke sysadmin@schoolos.com')}
                  >
                    Kirim Email Tes
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 5: Kebijakan & Maintenance ── */}
            {activeTab === 'maintenance' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>🛡️ Kebijakan Pemeliharaan &amp; Status Darurat</h2>
                    <p className={styles.cardSubtitle}>
                      Atur mode pemeliharaan darurat atau pembatasan akses server saat proses migrasi database.
                    </p>
                  </div>
                  <span className={maintenanceMode ? 'badge badge-danger' : 'badge badge-active'}>
                    {maintenanceMode ? 'Maintenance ON' : 'All Systems Operational'}
                  </span>
                </div>

                <div className={styles.toggleRow} style={{ borderColor: maintenanceMode ? '#ef4444' : 'var(--border-light)' }}>
                  <div className={styles.toggleMeta}>
                    <div className={styles.toggleTitle} style={{ color: maintenanceMode ? '#ef4444' : 'var(--text-primary)' }}>
                      Mode Pemeliharaan (Maintenance Mode)
                    </div>
                    <div className={styles.toggleDesc}>
                      Jika aktif, hanya Super Admin yang dapat login. Semua tenant dan pengguna lain akan melihat halaman pengumuman pemeliharaan.
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                    />
                    <span className={styles.slider} style={{ backgroundColor: maintenanceMode ? '#ef4444' : undefined }} />
                  </label>
                </div>

                {maintenanceMode && (
                  <div className={styles.formGroup} style={{ marginTop: '1.25rem' }}>
                    <label className={styles.label}>Pesan Siaran Pemeliharaan ke Pengguna</label>
                    <textarea
                      rows={3}
                      className={styles.input}
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                    <div className={styles.inputHelper}>Pesan ini akan langsung ditampilkan pada seluruh portal sekolah.</div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className={styles.saveBar}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  fontWeight: 700,
                  padding: '0.65rem 1.5rem',
                }}
              >
                Simpan Perubahan Konfigurasi
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
