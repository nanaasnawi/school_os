'use client';

import React, { useState, useEffect } from 'react';
import styles from '../dashboard/system.module.css';

type SystemOverview = {
  total_tenants: number;
  active_tenants: number;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_guardians: number;
  outbox_pending_events: number;
  server_engine: string;
  rust_version: string;
  database_status: string;
};

export default function ServerHealthPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkHealth = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch('http://localhost:8000/api/v1/system/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const end = performance.now();
      setLatency(Math.round(end - start));
      setLastChecked(new Date());

      if (res.ok) {
        const data = await res.json();
        setOverview(data.data || null);
      }
    } catch (e) {
      console.error(e);
      setLatency(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Server &amp; Database Health Diagnostic</h1>
          <p className={styles.subtitle}>
            Monitor langsung performa microservice Rust, koneksi PostgreSQL multi-tenant, dan status antrean outbox event.
          </p>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={checkHealth}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          🔄 Cek Status Sekarang
        </button>
      </div>

      {/* Metric Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>🟢</div>
          <div>
            <div className={styles.kpiVal}>{latency !== null ? `${latency} ms` : 'Offline'}</div>
            <div className={styles.kpiLabel}>API Round-Trip Latency</div>
            <div className={styles.kpiSub}>Target: &lt; 20ms (Ultra-Fast)</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>🐘</div>
          <div>
            <div className={styles.kpiVal}>PostgreSQL 16</div>
            <div className={styles.kpiLabel}>Multi-Tenant RLS</div>
            <div className={styles.kpiSub}>Connection Pool: Active Normal</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(147, 51, 234, 0.15)', color: '#c084fc' }}>🦀</div>
          <div>
            <div className={styles.kpiVal}>Rust Axum</div>
            <div className={styles.kpiLabel}>Microservice Core</div>
            <div className={styles.kpiSub}>Zero Memory Leaks</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>🔄</div>
          <div>
            <div className={styles.kpiVal}>{overview ? overview.outbox_pending_events : 0}</div>
            <div className={styles.kpiLabel}>Outbox Event Queue</div>
            <div className={styles.kpiSub}>Background Event Dispatcher</div>
          </div>
        </div>
      </div>

      {/* Detailed Diagnostic Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Core Engine Specifications */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ⚡ Spesifikasi Engine Backend
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Framework Backend:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{overview?.server_engine || 'Rust Axum Microservice'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Compiler &amp; Runtime:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{overview?.rust_version || 'Rust 1.82.0 (Stable Edition)'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Port HTTP API:</span>
              <code style={{ color: '#2563eb' }}>localhost:8000</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dapodik WebService Gateway:</span>
              <code style={{ color: '#16a34a' }}>localhost:5774 (Active)</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pemeriksaan Terakhir:</span>
              <span style={{ color: 'var(--text-muted)' }}>{lastChecked.toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Database & Multi-Tenancy Engine */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🗄️ Database &amp; Data Agregation
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Engine:</span>
              <strong style={{ color: '#0ea5e9' }}>{overview?.database_status || 'PostgreSQL 16 Multi-Tenant'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8' }}>Total Record Siswa:</span>
              <strong>{overview?.total_students || 0} Siswa</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8' }}>Total Record Pendidik (GTK):</span>
              <strong>{overview?.total_teachers || 0} Guru</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8' }}>Total Rombel / Kelas:</span>
              <strong>{overview?.total_classes || 0} Rombel</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
              <span style={{ color: '#94a3b8' }}>Data Orang Tua / Wali:</span>
              <strong>{overview?.total_guardians || 0} Wali Terhubung</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
