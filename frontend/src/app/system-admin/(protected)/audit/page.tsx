'use client';

import React, { useState, useEffect } from 'react';
import styles from '../dashboard/system.module.css';

type AuditLog = {
  id: string;
  tenant_name: string;
  event_type: string;
  details: string;
  created_at: string;
};

export default function SystemAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch('http://localhost:8000/api/v1/system/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    l.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
    l.event_type.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🛡️ Global Audit Logs &amp; Security Stream</h1>
          <p className={styles.subtitle}>
            Jejak aktivitas keamanan, autentikasi, dan rekonsiliasi data seluruh tenant sekolah secara real-time.
          </p>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchAuditLogs}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          🔄 Refresh Stream
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="🔍 Filter aktivitas, nama tenant, atau tipe event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          Menampilkan {filteredLogs.length} event log audit terbaru
        </div>
      </div>

      <div className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Memuat rekaman log audit keamanan...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>Belum ada rekaman audit log atau filter tidak ditemukan.</p>
          </div>
        ) : (
          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>WAKTU EVENT</th>
                  <th>TENANT SEKOLAH</th>
                  <th>TIPE AKSI / EVENT</th>
                  <th>DETAIL RESOURCE &amp; KEPUTUSAN</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{log.tenant_name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
                        {log.event_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
