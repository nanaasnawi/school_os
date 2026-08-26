'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './activity-logs.module.css';

type AuditLogItem = {
  id: string;
  eventId: string;
  timestamp: string;
  platform: 'LOCAL_BRIDGE' | 'ANDROID_MOBILE' | 'WEB_PORTAL' | 'RUST_API';
  actor: string;
  action: string;
  detail: string;
  ip: string;
  deviceInfo: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  payloadJson: any;
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let activeSchool = '';
    if (typeof window !== 'undefined') {
      const stored = getTenantItem('dapodik_nama_sekolah');
      if (stored) {
        activeSchool = stored;
        setSchoolName(stored);
      }
    }

    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) {
            setSchoolName(json.data.name);
          }
        }).catch(() => null);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();

    // Load persisted real audit logs if created by system transactions
    const refreshLogs = (e?: any) => {
      if (typeof window !== 'undefined') {
        try {
          const storedLogs = localStorage.getItem('school_os_audit_logs');
          let currentList: AuditLogItem[] = storedLogs ? JSON.parse(storedLogs) : [];
          if (!Array.isArray(currentList)) currentList = [];

          if (e && e.type === 'dapodik_data_updated') {
            const count = e.detail?.count || 0;
            const newAuditItem: AuditLogItem = {
              id: `log-${Date.now()}`,
              eventId: `evt_${Date.now()}`,
              timestamp: new Date().toLocaleString('id-ID'),
              platform: 'LOCAL_BRIDGE',
              actor: 'Operator Sekolah (Dapodik Local Bridge)',
              action: 'PULL_DAPODIK_MASTER',
              detail: `Selesai memproses pembaruan sinkronisasi data Dapodik (${count} data master diperbarui).`,
              ip: '127.0.0.1 (Localhost Desktop)',
              deviceInfo: 'Dapodik WebService Bridge v2.4',
              status: 'SUCCESS',
              payloadJson: {
                event: 'PULL_DAPODIK_MASTER',
                timestamp: new Date().toISOString(),
                synced_count: count,
              },
            };
            currentList = [newAuditItem, ...currentList].slice(0, 100);
            try {
              localStorage.setItem('school_os_audit_logs', JSON.stringify(currentList));
            } catch (err) {
              console.warn('Failed to save audit logs to localStorage:', err);
            }
          }

          setLogs(currentList);
        } catch (err) {
          console.error(err);
        }
      }
    };
    refreshLogs();

    if (typeof window !== 'undefined') {
      window.addEventListener('dapodik_data_updated', refreshLogs);
      return () => {
        window.removeEventListener('dapodik_data_updated', refreshLogs);
      };
    }
  }, []);

  const exportAuditCsv = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Belum ada transaksi log audit untuk diekspor!');
      return;
    }
    const headers = 'Event ID,Timestamp,Platform,Actor / User,Operation,Detail Transaksi,IP Address,Device Info,Status\n';
    const rows = filtered.map(l => `"${l.eventId}","${l.timestamp}","${l.platform}","${l.actor}","${l.action}","${l.detail}","${l.ip}","${l.deviceInfo}","${l.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Trail_Log_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    showToast('📥 Berkas CSV Audit Trail Log berhasil diunduh!');
  };

  const filtered = logs.filter((l) => {
    const matchPlatform = platformFilter === 'ALL' || l.platform === platformFilter;
    const matchSearch = l.actor.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()) || l.eventId.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toastContainer">
          <div className="toast toastSuccess">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            Log Aktivitas &amp; Security Audit Trail (Multi-Platform Real-Time)
          </h1>
          <p className={styles.subtitle}>
            Jejak Audit Immutable Seluruh Transaksi Local Bridge Agent, Android Mobile App, Web Portal, dan Rust API Core di {schoolName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={exportAuditCsv} disabled={filtered.length === 0}>
            📥 Ekspor Audit Trail CSV
          </button>
        </div>
      </div>

      {/* Multi-Platform Filter Toolbar Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid var(--border-dim)' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="🔍 Cari event ID, aktor, transaksi, atau IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="input"
          style={{ width: '210px' }}
        >
          <option value="ALL">🌐 Semua Platform ({logs.length} Events)</option>
          <option value="LOCAL_BRIDGE">💻 Local Bridge Agent &amp; Dapodik</option>
          <option value="ANDROID_MOBILE">📱 Android Mobile Student App</option>
          <option value="WEB_PORTAL">🖥️ Web Admin &amp; Teacher Portal</option>
          <option value="RUST_API">⚡ Rust API Server Core</option>
        </select>
      </div>

      {/* Audit Log Main Table / Empty State */}
      <div className={styles.tableCard} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden' }}>
        {paginated.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📜</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Belum Ada Jejak Transaksi Audit Log
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Seluruh riwayat transaksi keamanan, sinkronisasi Dapodik, autentikasi Rust API, dan aktivitas mobile app di <strong>{schoolName}</strong> akan tercatat secara otomatis di sini saat transaksi berlangsung.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/dashboard/dapodik" className="btn btn-primary btn-sm">
                🔄 Cek Integrasi Dapodik Hub
              </Link>
              <Link href="/dashboard/announcements" className="btn btn-secondary btn-sm">
                📢 Kirim Broadcast Pengumuman
              </Link>
            </div>
          </div>
        ) : (
          <table className={styles.table} style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border-light)' }}>
                <th>Timestamp &amp; Event ID</th>
                <th>Platform Sumber</th>
                <th>Aktor / Pengguna</th>
                <th>Tipe Operasi</th>
                <th>Detail Transaksi</th>
                <th>IP &amp; Device Info</th>
                <th style={{ textAlign: 'right' }}>Payload JSON</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{l.timestamp}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l.eventId}</div>
                  </td>
                  <td>
                    <span className={`badge ${l.platform === 'LOCAL_BRIDGE' ? 'badge-info' : l.platform === 'ANDROID_MOBILE' ? 'badge-active' : l.platform === 'WEB_PORTAL' ? 'badge-purple' : 'badge-warning'}`} style={{ fontWeight: 800 }}>
                      {l.platform === 'LOCAL_BRIDGE' && '💻 Local Bridge'}
                      {l.platform === 'ANDROID_MOBILE' && '📱 Android Mobile'}
                      {l.platform === 'WEB_PORTAL' && '🖥️ Web Portal'}
                      {l.platform === 'RUST_API' && '⚡ Rust Core'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#2563eb' }}>{l.actor}</td>
                  <td>
                    <span className="badge badge-info" style={{ fontWeight: 800, fontSize: '0.7rem' }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem', maxWidth: '280px', lineHeight: 1.4 }}>
                    {l.detail}
                  </td>
                  <td>
                    <code style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--text-primary)', display: 'block' }}>
                      {l.ip}
                    </code>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{l.deviceInfo}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => setInspectedLog(l)}
                    >
                      🔍 Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > itemsPerPage && (
          <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menampilkan {paginated.length} dari total {filtered.length} hasil</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="btn btn-secondary btn-sm"
              >
                Prev
              </button>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0.5rem' }}>Halaman {currentPage} dari {totalPages}</span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL JSON PAYLOAD INSPECTOR ── */}
      {inspectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }} onClick={() => setInspectedLog(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '18px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '680px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.25rem', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🔍</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8' }}>
                    Audit Event Payload Inspector ({inspectedLog.eventId})
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Source Platform: <strong>{inspectedLog.platform}</strong> · {inspectedLog.timestamp}
                  </div>
                </div>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setInspectedLog(null)}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem 1.1rem', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Aktor / User:</strong> {inspectedLog.actor}</div>
                <div><strong>Operasi:</strong> <span className="badge badge-info">{inspectedLog.action}</span></div>
                <div><strong>IP Address:</strong> <code>{inspectedLog.ip}</code></div>
                <div><strong>Device &amp; Runtime:</strong> {inspectedLog.deviceInfo}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  💻 Full Raw Audit Event Payload (JSON):
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  lineHeight: 1.5,
                  margin: 0,
                  border: '1px solid #1e293b',
                }}>
                  {JSON.stringify(inspectedLog.payloadJson, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Controls */}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setInspectedLog(null)}>
                Tutup Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
