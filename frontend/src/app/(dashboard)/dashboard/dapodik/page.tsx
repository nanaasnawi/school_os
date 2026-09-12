'use client';

import React, { useState, useEffect } from 'react';
import styles from './dapodik.module.css';
import {
  DapodikSyncRecord,
  DapodikHealthStatus,
  DapodikAgentInfo,
  checkDapodikHealth,
  getDapodikSyncRecords,
  pullDataFromDapodik,
  getDapodikAgentInfo,
} from '@/lib/dapodik-bridge';
import { apiClient } from '@/lib/api';

export default function DapodikHubPage() {
  const [syncRecords, setSyncRecords] = useState<DapodikSyncRecord[]>([]);
  const [healthStatus, setHealthStatus] = useState<DapodikHealthStatus | null>(null);
  const [agentInfo, setAgentInfo] = useState<DapodikAgentInfo | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Dynamic School & Dapodik WebService Settings
  const [npsnInput, setNpsnInput] = useState('');
  const [dapodikTokenInput, setDapodikTokenInput] = useState('');
  const [dapodikUrlInput, setDapodikUrlInput] = useState('http://127.0.0.1:5774');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Pagination State
  const [currentPageMatrix, setCurrentPageMatrix] = useState(1);
  const itemsPerPage = 10;

  // Filter records by search query
  const filteredRecords = syncRecords.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.namaSchoolOS.toLowerCase().includes(q) ||
      r.namaDapodik.toLowerCase().includes(q) ||
      r.nisn.toLowerCase().includes(q) ||
      r.nik.toLowerCase().includes(q) ||
      r.rombel.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setCurrentPageMatrix(1);
  }, [searchQuery, syncRecords]);

  const totalMatrixPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedMatrix = filteredRecords.slice(
    (currentPageMatrix - 1) * itemsPerPage,
    currentPageMatrix * itemsPerPage
  );

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load health status, sync records & school agent info on mount
  useEffect(() => {
    async function loadData() {
      setIsCheckingHealth(true);
      try {
        const [health, liveRecords, agent] = await Promise.all([
          checkDapodikHealth(),
          getDapodikSyncRecords(),
          getDapodikAgentInfo(),
        ]);
        setHealthStatus(health);
        setSyncRecords(liveRecords);
        if (agent) {
          setAgentInfo(agent);
          if (agent.npsn) setNpsnInput(agent.npsn);
          if (agent.schoolName) setSchoolName(agent.schoolName);
          if (agent.dapodikToken) setDapodikTokenInput(agent.dapodikToken);
          if (agent.dapodikUrl) setDapodikUrlInput(agent.dapodikUrl);
        }

        // Secondary fallback to /api/v1/schools/profile
        try {
          const token = apiClient.getToken();
          if (token) {
            const pRes = await fetch('/api/v1/schools/profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (pRes.ok) {
              const pJson = await pRes.json();
              const sch = pJson?.data;
              if (sch) {
                if (sch.name && !schoolName) setSchoolName(sch.name);
                if (sch.npsn && !npsnInput) setNpsnInput(sch.npsn);
                if (sch.dapodik_token && !dapodikTokenInput) setDapodikTokenInput(sch.dapodik_token);
                if (sch.dapodik_url && !dapodikUrlInput) setDapodikUrlInput(sch.dapodik_url);
              }
            }
          }
        } catch {
          // non-critical
        }
      } catch (e) {
        console.error('Backend API error on mount:', e);
      } finally {
        setIsCheckingHealth(false);
      }
    }
    loadData();
  }, []);

  const handleRefreshHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const [health, agent] = await Promise.all([
        checkDapodikHealth(),
        getDapodikAgentInfo(),
      ]);
      setHealthStatus(health);
      if (agent) {
        setAgentInfo(agent);
        if (agent.npsn && !npsnInput) setNpsnInput(agent.npsn);
        if (agent.schoolName && !schoolName) setSchoolName(agent.schoolName);
      }
      setIsCheckingHealth(false);
      if (health.connected) {
        setToastMessage('🟢 Dapodik terhubung aktif.');
      } else {
        setToastMessage('🟡 Dapodik offline atau belum di-start di komputer lokal.');
      }
    } catch {
      setIsCheckingHealth(false);
      setHealthStatus({
        connected: false,
        status: 'OFFLINE',
        message: 'Tidak dapat menghubungi Aplikasi Dapodik Lokal.',
        dapodikUrl: 'http://localhost:5774',
        lastCheckedAt: new Date().toISOString(),
      });
      setToastMessage('🟡 Dapodik offline.');
    }
  };

  const handleSaveDapodikSettings = async () => {
    if (!npsnInput.trim()) {
      setToastMessage('⚠️ Mohon masukkan NPSN sekolah terlebih dahulu.');
      return;
    }
    setIsSavingSettings(true);
    try {
      const token = apiClient.getToken() || '';
      const res = await fetch('/api/v1/schools/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          npsn: npsnInput.trim() || null,
          dapodik_token: dapodikTokenInput.trim() || null,
          dapodik_url: dapodikUrlInput.trim() || 'http://127.0.0.1:5774',
        }),
      });

      if (res.ok) {
        setToastMessage('✅ Pengaturan Dapodik berhasil disimpan!');
        const updatedAgent = await getDapodikAgentInfo();
        if (updatedAgent) setAgentInfo(updatedAgent);
        setShowConfigModal(false);
      } else {
        setToastMessage('⚠️ Gagal menyimpan pengaturan.');
      }
    } catch (e: any) {
      setToastMessage(`❌ Error: ${e.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCopyPairingToken = () => {
    const token = apiClient.getToken() || '';
    if (!token) {
      setToastMessage('⚠️ Sesi belum tersedia, silakan login ulang.');
      return;
    }
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setToastMessage('📋 Token Auth berhasil disalin.');
    setTimeout(() => setCopiedToken(false), 3000);
  };

  const handleDownloadBridgeExe = () => {
    const link = document.createElement('a');
    link.href = '/downloads/schoolos-bridge.exe';
    link.download = 'schoolos-bridge.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('📥 Mengunduh schoolos-bridge.exe (1-Klik Autostart)...');
  };

  const handleDownloadBatchInstaller = () => {
    const link = document.createElement('a');
    link.href = '/downloads/install-bridge.bat';
    link.download = 'install-bridge.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('📥 Mengunduh Script Installer (install-bridge.bat)...');
  };

  // Pull Data Handler
  const handlePullData = async () => {
    setIsPulling(true);
    setToastMessage('🔍 Menghubungi Dapodik lokal untuk menarik data...');

    try {
      const res = await pullDataFromDapodik({
        npsn: npsnInput.trim() || agentInfo?.npsn || undefined,
        bearerToken: dapodikTokenInput.trim() || agentInfo?.dapodikToken || undefined,
        dapodikUrl: dapodikUrlInput.trim() || agentInfo?.dapodikUrl || 'http://127.0.0.1:5774',
      });
      setSyncRecords(res.updatedRecords);
      setToastMessage(`🎉 Berhasil menyinkronkan ${res.newRecordsCount} data siswa dari Dapodik!`);
    } catch (err: any) {
      setToastMessage(`ℹ️ ${err.message || 'Gagal menarik data dari Dapodik lokal.'}`);
    } finally {
      setIsPulling(false);
    }
  };

  const isConnected = healthStatus?.connected;

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background:
              toastMessage.includes('❌') || toastMessage.includes('⚠️')
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(22, 163, 74, 0.12)',
            border: `1px solid ${
              toastMessage.includes('❌') || toastMessage.includes('⚠️')
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(22, 163, 74, 0.3)'
            }`,
            color:
              toastMessage.includes('❌') || toastMessage.includes('⚠️')
                ? '#dc2626'
                : 'var(--success)',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div>{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Simplified Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Sinkronisasi Dapodik
            </h1>
            <span
              className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>{isConnected ? '●' : '○'}</span>
              {isCheckingHealth ? 'Mengecek...' : isConnected ? 'Dapodik Terhubung' : 'Dapodik Offline'}
            </span>
          </div>
          <p className={styles.subtitle} style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Integrasi langsung data peserta didik, guru, dan rombel dari aplikasi Dapodik lokal ke database School OS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefreshHealth}
            disabled={isCheckingHealth}
            className="btn btn-secondary btn-sm"
            title="Periksa Ulang Koneksi Dapodik"
            style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
          >
            {isCheckingHealth ? '⏳ Cek...' : '🔄 Tes Koneksi'}
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            ⚙️ Pengaturan Dapodik
          </button>

          <button
            onClick={handlePullData}
            disabled={isPulling}
            className="btn btn-primary"
            style={{ fontWeight: 800, fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
          >
            {isPulling ? '🔄 Sedang Menarik Data...' : '📥 Tarik Data'}
          </button>
        </div>
      </div>

      {/* Clean Metric Summary Cards (Simple, No Machine Jargon) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.10)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Siswa Terdata</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {agentInfo?.totalStudents || syncRecords.length} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Siswa</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.10)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}>
            👨‍🏫
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Guru &amp; Tenaga Pendidik</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {agentInfo?.totalTeachers || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Orang</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.10)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}>
            🏫
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rombongan Belajar</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {agentInfo?.totalClasses || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Rombel</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.10)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Identitas Sekolah (NPSN)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem', fontFamily: 'monospace' }}>
              {agentInfo?.npsn || '20101234'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Sync Matrix & Fast Search) */}
      <div className={styles.card} style={{ border: '1px solid var(--border-light)', borderRadius: '14px', overflow: 'hidden' }}>
        {/* Table Header Controls */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Data Siswa Terdaftar</span>
            <span className="badge badge-info" style={{ fontWeight: 700 }}>
              {filteredRecords.length} Siswa
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="🔍 Cari nama siswa, NISN, atau kelas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageMatrix(1);
              }}
              className="input"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredRecords.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>📥</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
              {syncRecords.length === 0
                ? 'Belum Ada Data Siswa Tersinkron'
                : 'Tidak Ada Siswa yang Sesuai Pencarian'}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0.5rem auto 1.25rem', lineHeight: 1.5 }}>
              {syncRecords.length === 0
                ? 'Klik tombol di bawah ini untuk menarik data siswa langsung dari aplikasi Dapodik lokal ke School OS.'
                : `Tidak ditemukan siswa yang cocok dengan "${searchQuery}". Coba kata kunci lainnya.`}
            </p>
            {syncRecords.length === 0 && (
              <button
                onClick={handlePullData}
                disabled={isPulling}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 800, padding: '0.5rem 1.25rem' }}
              >
                {isPulling ? '🔄 Memeriksa Koneksi...' : '📥 Tarik Data Sekarang'}
              </button>
            )}
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NISN &amp; NIK</th>
                  <th>Nama Lengkap Siswa</th>
                  <th>Kelas / Rombel</th>
                  <th>Status Peserta Didik</th>
                  <th>Kecocokan</th>
                  <th>Status Sinkron</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMatrix.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.nisn}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {r.nik || '-'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {r.namaSchoolOS || r.namaDapodik}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {r.rombel || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${r.identityState === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: 700 }}
                      >
                        {r.identityState === 'ACTIVE' ? 'Aktif' : r.identityState}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${r.classification === 'MATCH' ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: 700 }}
                      >
                        {r.classification === 'MATCH' ? 'Sesuai' : r.classification}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {r.stage === 'VERIFIED' || r.stage === 'APPROVED' ? 'Tersinkron' : r.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                background: 'var(--bg-surface)',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Menampilkan {paginatedMatrix.length} dari {filteredRecords.length} siswa tersinkron
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  disabled={currentPageMatrix === 1}
                  onClick={() => setCurrentPageMatrix((prev) => prev - 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {currentPageMatrix} / {totalMatrixPages}
                </span>
                <button
                  disabled={currentPageMatrix === totalMatrixPages}
                  onClick={() => setCurrentPageMatrix((prev) => prev + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal Konfigurasi & Bantuan (Pop-up Rapi & Bersih) ── */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
              border: '1px solid var(--border-light)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.15rem 1.4rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ⚙️ Pengaturan Dapodik
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Konfigurasi Web Service &amp; Konektor School OS Bridge
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Form Konfigurasi Web Service */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                  Koneksi Web Service Dapodik
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    NPSN Sekolah:
                  </label>
                  <input
                    type="text"
                    value={npsnInput}
                    onChange={(e) => setNpsnInput(e.target.value)}
                    placeholder="Contoh: 20101234"
                    className="input"
                    style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Key / Token Web Service Dapodik:
                  </label>
                  <input
                    type="text"
                    value={dapodikTokenInput}
                    onChange={(e) => setDapodikTokenInput(e.target.value)}
                    placeholder="Token Web Service dari menu Dapodik lokal"
                    className="input"
                    style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    URL Dapodik Localhost:
                  </label>
                  <input
                    type="text"
                    value={dapodikUrlInput}
                    onChange={(e) => setDapodikUrlInput(e.target.value)}
                    placeholder="http://127.0.0.1:5774"
                    className="input"
                    style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <button
                    onClick={handleSaveDapodikSettings}
                    disabled={isSavingSettings}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 800, borderRadius: '8px' }}
                  >
                    {isSavingSettings ? '💾 Menyimpan...' : '💾 Simpan Konfigurasi'}
                  </button>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: 0 }} />

              {/* Seamless School OS Bridge Connector */}
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                padding: '1rem 1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.15rem',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                      flexShrink: 0,
                    }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>School OS Bridge</span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                          color: isConnected ? '#059669' : '#0284c7',
                          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(14, 165, 233, 0.25)'}`,
                        }}>
                          {isConnected ? '● Aktif' : 'Background Sync'}
                        </span>
                      </div>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Konektor background otomatis untuk sinkronisasi Dapodik lokal.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={handleDownloadBridgeExe}
                    className="btn btn-primary btn-sm"
                    style={{
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderRadius: '8px',
                    }}
                  >
                    <span>📥</span> Unduh Bridge (.exe)
                  </button>
                  <button
                    onClick={handleCopyPairingToken}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderRadius: '8px',
                    }}
                  >
                    <span>{copiedToken ? '✅' : '📋'}</span> {copiedToken ? 'Token Tersalin' : 'Salin Token'}
                  </button>
                  <button
                    onClick={handleDownloadBatchInstaller}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderRadius: '8px',
                    }}
                    title="Installer batch (.bat) alternatif"
                  >
                    <span>⚙️</span> Script .bat
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '0.85rem 1.4rem',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-elevated)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700, borderRadius: '8px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
