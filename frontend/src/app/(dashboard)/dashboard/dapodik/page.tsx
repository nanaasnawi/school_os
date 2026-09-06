'use client';

import React, { useState, useEffect } from 'react';
import styles from './dapodik.module.css';
import {
  DapodikSyncRecord,
  DapodikHealthStatus,
  checkDapodikHealth,
  getDapodikSyncRecords,
  pullDataFromDapodik,
} from '@/lib/dapodik-bridge';

export default function DapodikHubPage() {
  const [syncRecords, setSyncRecords] = useState<DapodikSyncRecord[]>([]);
  const [healthStatus, setHealthStatus] = useState<DapodikHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Reset pagination when data or search changes
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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load health status & sync records on mount
  useEffect(() => {
    async function loadData() {
      setIsCheckingHealth(true);
      try {
        const [health, liveRecords] = await Promise.all([
          checkDapodikHealth(),
          getDapodikSyncRecords(),
        ]);
        setHealthStatus(health);
        setSyncRecords(liveRecords);
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
        lastCheckedAt: new Date().toISOString(),
      });
      setToastMessage('🔴 OFFLINE: Tidak dapat menghubungi Aplikasi Dapodik.');
    }
  };

  // Pull Data Handler (1-Click Pull from Dapodik Localhost)
  const handlePullData = async () => {
    setIsPulling(true);
    setToastMessage('🔍 Menghubungi Dapodik Localhost (http://localhost:5774)...');

    try {
      const res = await pullDataFromDapodik();
      setSyncRecords(res.updatedRecords);
      setToastMessage(`✅ PULL SUKSES! ${res.newRecordsCount} Data Siswa Berhasil Ditarik dari Dapodik!`);
    } catch (err: any) {
      setToastMessage(
        `ℹ️ ${err.message || 'Dapodik Localhost belum di-start. Pastikan aplikasi Dapodik di komputer Anda aktif pada port 5774.'}`
      );
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background:
              toastMessage.includes('❌') || toastMessage.includes('🔴') || toastMessage.includes('⚠️')
                ? 'rgba(220, 38, 38, 0.10)'
                : 'rgba(22, 163, 74, 0.10)',
            border: `1px solid ${
              toastMessage.includes('❌') || toastMessage.includes('🔴') || toastMessage.includes('⚠️')
                ? '#fca5a5'
                : 'rgba(22, 163, 74, 0.25)'
            }`,
            color:
              toastMessage.includes('❌') || toastMessage.includes('🔴') || toastMessage.includes('⚠️')
                ? '#b91c1c'
                : 'var(--success)',
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
            <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
              Pusat Sinkronisasi Data Dapodik
            </h1>
            <span className="badge badge-info" style={{ fontWeight: 800 }}>
              🛡️ Koneksi Aman &amp; Tervalidasi
            </span>
          </div>
          <p className={styles.subtitle}>
            Tarik data siswa terbaru dari aplikasi Dapodik lokal ke database School OS secara otomatis.
          </p>
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
        </div>
      </div>

      {/* Connection Health Banner */}
      <div
        style={{
          background: healthStatus?.connected ? 'rgba(22, 163, 74, 0.10)' : 'rgba(234, 179, 8, 0.10)',
          border: `1.5px solid ${healthStatus?.connected ? 'rgba(22, 163, 74, 0.25)' : 'rgba(234, 179, 8, 0.30)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
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
            }}
          >
            {healthStatus?.connected ? '🟢' : '⚡'}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Status Dapodik Localhost (Port 5774):{' '}
              {isCheckingHealth
                ? '⚡ Mengecek Koneksi...'
                : healthStatus?.connected
                ? 'AKTIF TERHUBUNG (SINKRONISASI REAL-TIME)'
                : 'OFFLINE (DATA DI POSTGRESQL TETAP TERSIMPAN AMAN)'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', fontWeight: 500 }}>
              {healthStatus?.connected
                ? 'Terhubung ke aplikasi Dapodik lokal. Anda dapat menarik data siswa terbaru.'
                : 'Aplikasi Dapodik lokal sedang tidak aktif. Semua data siswa yang pernah ditarik tetap tersimpan aman di Database PostgreSQL School OS.'}
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

      {/* List Toolbar / Header */}
      <div
        className={styles.filterCard}
        style={{
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            📊 Daftar Siswa Sinkron
          </span>
          <span className="badge badge-info" style={{ fontWeight: 800 }}>
            {syncRecords.length} Siswa Terdaftar
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Cari nama, NISN, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm"
            style={{ minWidth: '260px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className={styles.tableCard}>
        {filteredRecords.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
              {syncRecords.length === 0
                ? 'Belum Ada Data Siswa di Database School OS'
                : 'Tidak Ada Siswa yang Sesuai Pencarian'}
            </div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', maxWidth: '600px', margin: '0.35rem auto 0' }}>
              {syncRecords.length === 0
                ? 'Gunakan tombol Tarik Data Siswa Baru di atas untuk menarik data siswa dari aplikasi Dapodik lokal (port 5774) ke database PostgreSQL.'
                : `Tidak ditemukan siswa dengan kata kunci "${searchQuery}". Coba kata kunci lain.`}
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
                </tr>
              </thead>
              <tbody>
                {paginatedMatrix.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.nisn}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {r.nik}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.namaSchoolOS}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.namaDapodik}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {r.rombel}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${r.identityState === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: 700 }}
                      >
                        {r.identityState}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {r.mobilityCase}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${r.classification === 'MATCH' ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: 700 }}
                      >
                        {r.classification}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {r.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className={styles.pagination}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Menampilkan {paginatedMatrix.length} dari {filteredRecords.length} data siswa tersinkron
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  disabled={currentPageMatrix === 1}
                  onClick={() => setCurrentPageMatrix((prev) => prev - 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Halaman {currentPageMatrix} dari {totalMatrixPages}
                </span>
                <button
                  disabled={currentPageMatrix === totalMatrixPages}
                  onClick={() => setCurrentPageMatrix((prev) => prev + 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
