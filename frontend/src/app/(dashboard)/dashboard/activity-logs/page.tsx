'use client';
import { getTenantItem } from '@/lib/tenant-storage';

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
  payloadJson: Record<string, unknown> | null;
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [schoolName, setSchoolName] = useState(() => {
    if (typeof window !== 'undefined') {
      return getTenantItem('dapodik_nama_sekolah') || '';
    }
    return '';
  });
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
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
    const refreshLogs = (e?: Event) => {
      if (typeof window !== 'undefined') {
        try {
          const storedLogs = localStorage.getItem('school_os_audit_logs');
          let currentList: AuditLogItem[] = storedLogs ? JSON.parse(storedLogs) : [];
          if (!Array.isArray(currentList)) currentList = [];

          if (e && e.type === 'dapodik_data_updated') {
            const customEvt = e as CustomEvent<{ count?: number }>;
            const count = customEvt.detail?.count || 0;
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
      showToast('Belum ada transaksi log audit untuk diekspor!');
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
    showToast('Berkas CSV Audit Trail Log berhasil diunduh!');
  };

  const filtered = logs.filter((l) => {
    const matchPlatform = platformFilter === 'ALL' || l.platform === platformFilter;
    const matchSearch = l.actor.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()) || l.eventId.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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

      {/* ── Workstation Hero Header ── */}
      <div className="workstationHero">
        <div className="workstationHeroContent">
          <div className="workstationHeroBadge">
            <span>🛡️ AUDIT TRAIL &amp; KEAMANAN SISTEM</span>
          </div>
          <h1 className="workstationHeroTitle">Log Aktivitas &amp; Security Audit Trail</h1>
          <p className="workstationHeroSubtitle">
            Jejak audit immutable seluruh transaksi Local Bridge Agent, Android Mobile App, Web Portal, dan Rust Core di {schoolName}.
          </p>
        </div>

        <div className="workstationHeroActions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportAuditCsv} disabled={filtered.length === 0}>
            📊 Ekspor Audit CSV
          </button>
          <Link href="/dashboard/dapodik" className="btn btn-secondary btn-sm">
            🔄 Dapodik Hub
          </Link>
          <Link href="/dashboard/announcements" className="btn btn-primary btn-sm">
            📢 Broadcast Info
          </Link>
        </div>
      </div>

      {/* Audit Log Main Table Card */}
      <div className="tableCard">
        {/* Table Toolbar */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}</strong> to <strong>{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries {filtered.length !== logs.length ? `(filtered from ${logs.length} total entries)` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Platform ({logs.length} Events)</option>
              <option value="LOCAL_BRIDGE">Local Bridge Agent</option>
              <option value="ANDROID_MOBILE">Android Mobile App</option>
              <option value="WEB_PORTAL">Web Admin &amp; Portal</option>
              <option value="RUST_API">Rust API Server</option>
            </select>

            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Cari event ID, aktor, IP..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="tableSearchInput"
              />
              <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>

        {paginated.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Belum Ada Jejak Transaksi Audit Log
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Seluruh riwayat transaksi keamanan, sinkronisasi Dapodik, autentikasi Rust API, dan aktivitas mobile app di <strong>{schoolName}</strong> akan tercatat secara otomatis di sini saat transaksi berlangsung.
            </p>
          </div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="thSortable">
                    <div className="thSortContent">
                      <span>Timestamp &amp; Event ID</span>
                      <span className="sortArrows">⇅</span>
                    </div>
                  </th>
                  <th className="thSortable">
                    <div className="thSortContent">
                      <span>Platform Sumber</span>
                      <span className="sortArrows">⇅</span>
                    </div>
                  </th>
                  <th className="thSortable">
                    <div className="thSortContent">
                      <span>Aktor / Pengguna</span>
                      <span className="sortArrows">⇅</span>
                    </div>
                  </th>
                  <th className="thSortable">
                    <div className="thSortContent">
                      <span>Tipe Operasi</span>
                      <span className="sortArrows">⇅</span>
                    </div>
                  </th>
                  <th className="thSortable">
                    <div className="thSortContent">
                      <span>Detail Transaksi</span>
                      <span className="sortArrows">⇅</span>
                    </div>
                  </th>
                  <th className="thSortable">
                    <div className="thSortContent">
                      <span>IP &amp; Device Info</span>
                      <span className="sortArrows">⇅</span>
                    </div>
                  </th>
                  <th style={{ textAlign: 'right' }}>Payload JSON</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="itemPrimaryTitle">
                        <span>{l.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l.eventId}</div>
                    </td>
                    <td>
                      <span className={`statusPill ${l.platform === 'LOCAL_BRIDGE' ? 'statusPillMuted' : l.platform === 'ANDROID_MOBILE' ? 'statusPillActive' : 'statusPillActive'}`}>
                        {l.platform === 'LOCAL_BRIDGE' && 'Local Bridge'}
                        {l.platform === 'ANDROID_MOBILE' && 'Android Mobile'}
                        {l.platform === 'WEB_PORTAL' && 'Web Portal'}
                        {l.platform === 'RUST_API' && 'Rust Core'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{l.actor}</strong>
                    </td>
                    <td>
                      <span className="statusPill statusPillMuted">
                        {l.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '280px', lineHeight: 1.4 }}>
                      {l.detail}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.74rem', background: 'var(--bg-elevated)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--text-primary)', display: 'inline-block' }}>
                        {l.ip}
                      </code>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{l.deviceInfo}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="tableActionBtn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'inline-flex' }}
                        onClick={() => setInspectedLog(l)}
                      >
                        Inspect JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="tableFooter">
          <div className="entriesControl">
            <span className="entriesLabel">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="entriesLabel">entries</span>
          </div>

          <div className="paginationControls">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="pageBtn"
              title="First Page"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="pageBtn"
              title="Previous Page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <div key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pageDots">…</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`pageBtn ${p === safePage ? 'pageBtnActive' : ''}`}
                  >
                    {p}
                  </button>
                </div>
              ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="pageBtn"
              title="Next Page"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="pageBtn"
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
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
                  Full Raw Audit Event Payload (JSON):
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
