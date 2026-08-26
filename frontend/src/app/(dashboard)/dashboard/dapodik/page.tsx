'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dapodik.module.css';
import {
  DapodikSyncRecord,
  DapodikOutboxJob,
  DapodikHealthStatus,
  checkDapodikHealth,
  getDapodikSyncRecords,
  getDapodikOutboxJobs,
  pullDataFromDapodik,
  pushDataToDapodik,
  generateDapodikPrefill,
  uploadDapodikPrefillFile,
} from '@/lib/dapodik-bridge';

export default function DapodikHubPage() {
  const [syncRecords, setSyncRecords] = useState<DapodikSyncRecord[]>([]);
  const [outboxJobs, setOutboxJobs] = useState<DapodikOutboxJob[]>([]);
  const [healthStatus, setHealthStatus] = useState<DapodikHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isGeneratingPrefill, setIsGeneratingPrefill] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'outbox' | 'prefill'>('matrix');

  // Pagination State
  const [currentPageMatrix, setCurrentPageMatrix] = useState(1);
  const [currentPageOutbox, setCurrentPageOutbox] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when data changes
  useEffect(() => { setCurrentPageMatrix(1); }, [syncRecords]);
  useEffect(() => { setCurrentPageOutbox(1); }, [outboxJobs]);

  const totalMatrixPages = Math.ceil(syncRecords.length / itemsPerPage) || 1;
  const paginatedMatrix = syncRecords.slice((currentPageMatrix - 1) * itemsPerPage, currentPageMatrix * itemsPerPage);

  const totalOutboxPages = Math.ceil(outboxJobs.length / itemsPerPage) || 1;
  const paginatedOutbox = outboxJobs.slice((currentPageOutbox - 1) * itemsPerPage, currentPageOutbox * itemsPerPage);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [prefillForm, setPrefillForm] = useState({
    npsn: '20210982',
    kodeRegistrasi: '',
    mirrorUrl: 'https://prefill1.kemendikdasmen.go.id',
  });

  // Perform REAL connection check against Dapodik Localhost (port 5774) & load records on mount
  useEffect(() => {
    async function loadData() {
      setIsCheckingHealth(true);
      try {
        const [health, liveRecords, liveJobs] = await Promise.all([
          checkDapodikHealth(),
          getDapodikSyncRecords(),
          getDapodikOutboxJobs(),
        ]);
        setHealthStatus(health);
        setSyncRecords(liveRecords);
        setOutboxJobs(liveJobs);
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
      const health = await checkDapodikHealth();
      setHealthStatus(health);
      setIsCheckingHealth(false);
      if (health.connected) {
        setToastMessage('🟢 BERHASIL TERHUBUNG: Dapodik Localhost (http://localhost:5774) merespons aktif!');
      } else {
        setToastMessage('🔴 OFFLINE: Dapodik Localhost (http://localhost:5774) belum di-start.');
      }
    } catch (e) {
      setIsCheckingHealth(false);
      setHealthStatus({ 
        connected: false, 
        status: 'OFFLINE',
        message: 'Tidak dapat menghubungi Aplikasi Dapodik Lokal atau Backend API Server.',
        dapodikUrl: 'http://localhost:5774',
        lastCheckedAt: new Date().toISOString()
      });
      setToastMessage('🔴 OFFLINE: Tidak dapat menghubungi Aplikasi Dapodik.');
    }
  };

  // 1. PULL DATA Handler (Direct 1-Click Pull from Dapodik Localhost)
  const handlePullData = async () => {
    setIsPulling(true);
    setToastMessage('🔍 Menghubungi Dapodik Localhost (http://localhost:5774)...');

    try {
      const res = await pullDataFromDapodik();
      setSyncRecords(res.updatedRecords);
      setToastMessage(`✅ PULL SUKSES! ${res.newRecordsCount} Data Siswa Berhasil Ditarik dari Dapodik!`);
    } catch (err: any) {
      setToastMessage(`ℹ️ ${err.message || 'Dapodik Localhost belum di-start. Gunakan Tab 3 (Import Prefill) jika tanpa aplikasi Dapodik.'}`);
    } finally {
      setIsPulling(false);
    }
  };

  // 2. PUSH DATA Handler (Send Data from School OS Master Domain -> Dapodik Local Outbox Queue)
  const handlePushData = async () => {
    setIsPushing(true);
    setToastMessage('📤 Memproses data pendaftaran & mutasi School OS ke Encrypted Outbox Queue...');

    try {
      const res = await pushDataToDapodik('STD-ALL', 'UPDATE_MUTATION');
      if (res.success) {
        setOutboxJobs((prev) => [res.newJob, ...prev]);
        setToastMessage(`✅ PUSH SUKSES! Job [${res.newJob.jobId}] Berhasil Dikirim ke Encrypted Outbox Queue dengan Idempotency Key!`);
      }
    } catch (err: any) {
      setToastMessage(`⚠️ Gagal mengirim data ke Dapodik Outbox Queue: ${err.message || 'Error Ingestion'}`);
    } finally {
      setIsPushing(false);
    }
  };

  // Single Record Row Push Handler
  const handleRecordPush = async (record: DapodikSyncRecord) => {
    setToastMessage(`📤 Mengirim data siswa "${record.namaSchoolOS}" ke Dapodik Local Outbox...`);
    try {
      const res = await pushDataToDapodik(record.id, 'INSERT_STUDENT');
      if (res.success) {
        setOutboxJobs((prev) => [res.newJob, ...prev]);
        setSyncRecords((prev) =>
          prev.map((r) => (r.id === record.id ? { ...r, stage: 'VERIFIED', lastSyncedAt: 'Baru Saja' } : r))
        );
        setToastMessage(`✅ Data "${record.namaSchoolOS}" Berhasil Disinkronkan & Terkirim ke Outbox Job!`);
      }
    } catch (err: any) {
      setToastMessage(`⚠️ Gagal mengirim outbox job: ${err.message || 'Local Bridge Error'}`);
    }
  };

  // Handler Generate & Parse Kemendikdasmen Prefill
  const handleGeneratePrefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefillForm.kodeRegistrasi.trim()) {
      setToastMessage('⚠️ Masukkan Kode Registrasi Dapodik terlebih dahulu.');
      return;
    }
    setIsGeneratingPrefill(true);
    setToastMessage(`📥 Menghubungkan ke Kemendikdasmen Prefill Mirror (${prefillForm.mirrorUrl}) & mengunduh data prefill...`);

    try {
      const res = await generateDapodikPrefill({
        npsn: prefillForm.npsn,
        kodeRegistrasi: prefillForm.kodeRegistrasi,
        mirrorUrl: prefillForm.mirrorUrl,
      });
      const refreshedRecords = await getDapodikSyncRecords();
      setSyncRecords(refreshedRecords);
      setToastMessage(`✅ PREFILL SUKSES! ${res.message}`);
      setActiveTab('matrix');
    } catch (err: any) {
      setToastMessage(`❌ Gagal memproses prefill: ${err.message || 'Error Ingestion'}`);
    } finally {
      setIsGeneratingPrefill(false);
    }
  };

  // Handler Upload Local File Prefill (.prf)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setToastMessage(`📂 Membaca file prefill "${file.name}" dari komputer...`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        try {
          const res = await uploadDapodikPrefillFile(file.name, text || '');
          const refreshedRecords = await getDapodikSyncRecords();
          setSyncRecords(refreshedRecords);
          setToastMessage(`✅ UPLOAD PREFILL SUKSES! ${res.message}`);
          setActiveTab('matrix');
        } catch (err: any) {
          setToastMessage(`❌ Gagal me-parse file prefill: ${err.message}`);
        } finally {
          setIsUploadingFile(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setToastMessage(`❌ Gagal membaca file: ${err.message}`);
      setIsUploadingFile(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.includes('❌') || toastMessage.includes('🔴') || toastMessage.includes('⚠️') ? 'rgba(220, 38, 38, 0.10)' : 'rgba(22, 163, 74, 0.10)',
          border: `1px solid ${toastMessage.includes('❌') || toastMessage.includes('🔴') || toastMessage.includes('⚠️') ? '#fca5a5' : 'rgba(22, 163, 74, 0.25)'}`,
          color: toastMessage.includes('❌') || toastMessage.includes('🔴') || toastMessage.includes('⚠️') ? '#b91c1c' : 'var(--success)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}>
          <div>{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'inherit' }}>✕</button>
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Pusat Sinkronisasi Data Dapodik</h1>
            <span className="badge badge-info" style={{ fontWeight: 800 }}>
              🛡️ Koneksi Aman & Tervalidasi
            </span>
          </div>
          <p className={styles.subtitle}>Tarik data siswa terbaru dan kirim laporan harian ke aplikasi Dapodik lokal secara otomatis.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handlePullData}
            disabled={isPulling}
            className="btn btn-secondary"
            style={{ fontWeight: 800 }}
          >
            {isPulling ? '🔄 Memeriksa Koneksi...' : '📥 Tarik Data Siswa Baru'}
          </button>

          <button
            onClick={handlePushData}
            disabled={isPushing}
            className="btn btn-primary"
            style={{ fontWeight: 800 }}
          >
            {isPushing ? '🔄 Mengirim Data...' : '📤 Kirim Data ke Dapodik'}
          </button>
        </div>
      </div>

      {/* Connection Health Banner */}
      <div style={{
        background: healthStatus?.connected ? 'rgba(22, 163, 74, 0.10)' : 'rgba(234, 179, 8, 0.10)',
        border: `1.5px solid ${healthStatus?.connected ? 'rgba(22, 163, 74, 0.25)' : 'rgba(234, 179, 8, 0.30)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: healthStatus?.connected ? 'rgba(22, 163, 74, 0.15)' : 'rgba(234, 179, 8, 0.18)',
            color: healthStatus?.connected ? 'var(--success)' : '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 800,
          }}>
            {healthStatus?.connected ? '🟢' : '⚡'}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Status Dapodik Localhost (Port 5774): {isCheckingHealth ? '⚡ Mengecek Koneksi...' : healthStatus?.connected ? 'AKTIF TERHUBUNG (SINKRONISASI REAL-TIME)' : 'OFFLINE (DATA DI POSTGRESQL TETAP TERSIMPAN AMAN)'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', fontWeight: 500 }}>
              {healthStatus?.connected
                ? 'Terhubung ke aplikasi Dapodik lokal. Anda dapat menarik atau mengirim perubahan data terbaru.'
                : 'Aplikasi Dapodik lokal sedang tidak aktif. Semua data siswa yang pernah ditarik/diimpor tetap tersimpan aman di Database PostgreSQL School OS.'}
            </div>
          </div>
        </div>

        <button
          onClick={handleRefreshHealth}
          disabled={isCheckingHealth}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', fontWeight: 700 }}
        >
          {isCheckingHealth ? '🔄 Testing...' : '🔍 Check Connectivity'}
        </button>
      </div>

      {/* Tabs Bar */}
      <div className={styles.filterCard} style={{ padding: '0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`btn btn-sm ${activeTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 800 }}
          >
            📊 Daftar Siswa Sinkron ({syncRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`btn btn-sm ${activeTab === 'outbox' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 800 }}
          >
            📤 Antrean Pengiriman Data ({outboxJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('prefill')}
            className={`btn btn-sm ${activeTab === 'prefill' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 800 }}
          >
            📥 File Prefill Kementerian (.prf)
          </button>
        </div>
      </div>

      {/* Tab 1: Matrix Table */}
      {activeTab === 'matrix' && (
        <div className={styles.tableCard}>
          {syncRecords.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>Belum Ada Data Siswa di Database School OS</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', maxWidth: '600px', margin: '0.35rem auto 0' }}>
                Gunakan tombol <strong>Tarik Data Siswa Baru</strong> di atas (jika aplikasi Dapodik aktif) atau <strong>Tab 3 (File Prefill .prf)</strong> untuk mengunggah data awal sekolah ke database PostgreSQL.
              </div>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>NISN / NIK</th>
                    <th>Nama di Sistem</th>
                    <th>Nama di Dapodik</th>
                    <th>Kelas</th>
                    <th>Status Aktif</th>
                    <th>Status Pindah</th>
                    <th>Kecocokan Data</th>
                    <th>Status Sinkronisasi</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMatrix.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.nisn}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.nik}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.namaSchoolOS}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.namaDapodik}</td>
                      <td><span className="badge badge-info" style={{ fontWeight: 700 }}>{r.rombel}</span></td>
                      <td>
                        <span className={`badge ${r.identityState === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                          {r.identityState}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {r.mobilityCase}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.classification === 'MATCH' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                          {r.classification}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          {r.stage}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleRecordPush(r)} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                          📤 Kirim Sekarang
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menampilkan {paginatedMatrix.length} dari {syncRecords.length} data siswa tersinkron</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    disabled={currentPageMatrix === 1} 
                    onClick={() => setCurrentPageMatrix(prev => prev - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Halaman {currentPageMatrix} dari {totalMatrixPages}</span>
                  <button 
                    disabled={currentPageMatrix === totalMatrixPages} 
                    onClick={() => setCurrentPageMatrix(prev => prev + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Outbox Jobs */}
      {activeTab === 'outbox' && (
        <div className={styles.tableCard}>
          {outboxJobs.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>Semua Data Sudah Terkirim (Antrean Kosong)</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', maxWidth: '600px', margin: '0.35rem auto 0' }}>
                Tidak ada data yang sedang mengantre. Laporan pengiriman data ke aplikasi Dapodik akan dicatat di sini jika ada perubahan data.
              </div>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID Pengiriman</th>
                    <th>Jenis Data</th>
                    <th>ID Siswa/Data</th>
                    <th>Kode Keamanan</th>
                    <th>Percobaan</th>
                    <th>Status</th>
                    <th>Waktu Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOutbox.map((j) => (
                    <tr key={j.jobId}>
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{j.jobId}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Req: {j.reqId}</div>
                      </td>
                      <td><span className="badge badge-info" style={{ fontWeight: 700 }}>{j.operation}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{j.entityId}</td>
                      <td><code style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{j.idempotencyKey}</code></td>
                      <td style={{ fontWeight: 700 }}>{j.attempts}x</td>
                      <td>
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          {j.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{j.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menampilkan {paginatedOutbox.length} dari {outboxJobs.length} antrean</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    disabled={currentPageOutbox === 1} 
                    onClick={() => setCurrentPageOutbox(prev => prev - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Halaman {currentPageOutbox} dari {totalOutboxPages}</span>
                  <button 
                    disabled={currentPageOutbox === totalOutboxPages} 
                    onClick={() => setCurrentPageOutbox(prev => prev + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Prefill Kemendikdasmen (.prf) */}
      {activeTab === 'prefill' && (
        <div className={styles.tableCard} style={{ padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-dim)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
              📥
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Pengaturan File Prefill Dapodik (.prf)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Gunakan file <code style={{ background: 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>.prf</code> resmi dari kementerian untuk menginisialisasi atau memulihkan data sekolah Anda secara otomatis.
              </p>
            </div>
          </div>

          {/* Opsi 1: Upload File .prf Lokal */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '2px dashed #cbd5e1',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📂</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Cara 1: Upload File dari Komputer</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
              Jika Anda sudah mengunduh file prefill dari website <a href="https://prefill1.kemendikdasmen.go.id" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#2563eb' }}>prefill1.kemendikdasmen.go.id</a>, langsung pilih file tersebut di bawah:
            </p>
            <label className="btn btn-primary" style={{ cursor: 'pointer', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{isUploadingFile ? '🔄 Memproses File...' : '📁 Pilih File .prf dari Komputer'}</span>
              <input type="file" accept=".prf,.json,.sql,.txt" onChange={handleFileUpload} disabled={isUploadingFile} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0 1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ATAU</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }}></div>
          </div>

          {/* Opsi 2: Unduh Otomatis dari Mirror Server */}
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            🌐 Cara 2: Unduh Otomatis Lewat Server Kementerian
          </div>
          <form onSubmit={handleGeneratePrefill} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pilih Server Tujuan</label>
              <select
                value={prefillForm.mirrorUrl}
                onChange={(e) => setPrefillForm({ ...prefillForm, mirrorUrl: e.target.value })}
                className="input"
                style={{ marginTop: '0.35rem' }}
              >
                <option value="https://prefill1.kemendikdasmen.go.id">Server 1 (prefill1.kemendikdasmen.go.id)</option>
                <option value="https://prefill2.kemendikdasmen.go.id">Server 2 (prefill2.kemendikdasmen.go.id)</option>
                <option value="https://prefill3.kemendikdasmen.go.id">Server 3 (prefill3.kemendikdasmen.go.id)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>NPSN Sekolah</label>
              <input
                type="text"
                value={prefillForm.npsn}
                onChange={(e) => setPrefillForm({ ...prefillForm, npsn: e.target.value })}
                className="input"
                style={{ marginTop: '0.35rem' }}
                placeholder="Masukkan NPSN Sekolah..."
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kode Registrasi</label>
              <input
                type="password"
                value={prefillForm.kodeRegistrasi}
                onChange={(e) => setPrefillForm({ ...prefillForm, kodeRegistrasi: e.target.value })}
                className="input"
                style={{ marginTop: '0.35rem' }}
                placeholder="Masukkan Kode Registrasi Dapodik Sekolah Anda..."
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isGeneratingPrefill}
                className="btn btn-secondary"
                style={{ fontWeight: 800 }}
              >
                {isGeneratingPrefill ? '🔄 Mulai Mengunduh...' : '📥 Mulai Unduh & Proses Otomatis'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
