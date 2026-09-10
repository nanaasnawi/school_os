'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import styles from '../dashboard/system.module.css';
import auditStyles from './audit.module.css';

type AuditLog = {
  id: string;
  tenant_name: string;
  event_type: string;
  details: string;
  created_at: string;
};

type EventCategory = 'all' | 'auth' | 'data' | 'grade' | 'system' | 'security';

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Login:            { bg: 'rgba(37,99,235,0.1)',   text: '#60a5fa', dot: '#3b82f6' },
  Logout:           { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8', dot: '#64748b' },
  GradeReleased:    { bg: 'rgba(16,185,129,0.12)', text: '#34d399', dot: '#10b981' },
  GradeUpdated:     { bg: 'rgba(16,185,129,0.12)', text: '#34d399', dot: '#10b981' },
  MaterialCreated:  { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', dot: '#7c3aed' },
  AssignmentPosted: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', dot: '#f59e0b' },
  QuizPublished:    { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', dot: '#ef4444' },
  DapodikSync:      { bg: 'rgba(6,182,212,0.12)',  text: '#22d3ee', dot: '#06b6d4' },
  TenantCreated:    { bg: 'rgba(236,72,153,0.12)', text: '#f472b6', dot: '#ec4899' },
  PasswordReset:    { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', dot: '#f97316' },
  Default:          { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', dot: '#6366f1' },
};

function getEventStyle(eventType: string) {
  const key = Object.keys(EVENT_COLORS).find(k =>
    eventType.toLowerCase().includes(k.toLowerCase())
  );
  return EVENT_COLORS[key ?? 'Default'];
}

function classifyEvent(eventType: string): EventCategory {
  const e = eventType.toLowerCase();
  if (e.includes('login') || e.includes('logout') || e.includes('password') || e.includes('auth')) return 'auth';
  if (e.includes('grade')) return 'grade';
  if (e.includes('dapodik') || e.includes('sync') || e.includes('tenant')) return 'data';
  if (e.includes('material') || e.includes('assignment') || e.includes('quiz')) return 'system';
  if (e.includes('security') || e.includes('block') || e.includes('ban')) return 'security';
  return 'system';
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  all:      '🌐 Semua',
  auth:     '🔐 Autentikasi',
  grade:    '📊 Nilai',
  data:     '🔄 Sinkronisasi',
  system:   '📚 Konten',
  security: '🛡️ Keamanan',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

export default function SystemAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EventCategory>('all');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAuditLogs = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch(getApiUrl('/api/v1/system/audit-logs'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

  // Auto-refresh every 30s
  useEffect(() => {
    const iv = setInterval(() => fetchAuditLogs(true), 30000);
    return () => clearInterval(iv);
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter(l => {
    const matchSearch =
      l.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || classifyEvent(l.event_type) === category;
    return matchSearch && matchCategory;
  });

  // Stats
  const stats = {
    total: logs.length,
    authEvents: logs.filter(l => classifyEvent(l.event_type) === 'auth').length,
    gradeEvents: logs.filter(l => classifyEvent(l.event_type) === 'grade').length,
    tenants: [...new Set(logs.map(l => l.tenant_name))].length,
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className={auditStyles.shieldIcon}>🛡️</div>
            <h1 className={styles.title} style={{ margin: 0 }}>
              Global Audit Logs & Security Stream
            </h1>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              <span className={styles.liveText}>LIVE</span>
            </div>
          </div>
          <p className={styles.subtitle}>
            Jejak aktivitas keamanan, autentikasi, dan rekonsiliasi data seluruh tenant sekolah secara real-time.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className={auditStyles.viewToggle}
            onClick={() => setViewMode(v => v === 'table' ? 'timeline' : 'table')}
          >
            {viewMode === 'table' ? '⏱ Timeline' : '📋 Tabel'}
          </button>
          <button
            className={`btn btn-secondary ${isRefreshing ? styles.refreshingBtn : ''}`}
            onClick={() => fetchAuditLogs(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span className={isRefreshing ? styles.spinIcon : ''}>🔄</span>
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className={auditStyles.statsRow}>
        {[
          { icon: '📋', label: 'Total Event', value: stats.total, color: '#6366f1' },
          { icon: '🔐', label: 'Autentikasi', value: stats.authEvents, color: '#3b82f6' },
          { icon: '📊', label: 'Event Nilai', value: stats.gradeEvents, color: '#10b981' },
          { icon: '🏫', label: 'Tenant Aktif', value: stats.tenants, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className={auditStyles.statCard}>
            <div className={auditStyles.statIcon} style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className={auditStyles.statValue} style={{ color: s.color }}>{s.value}</div>
              <div className={auditStyles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
        <div className={auditStyles.refreshInfo}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Terakhir diperbarui</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }} suppressHydrationWarning>
            {isMounted && lastRefresh ? lastRefresh.toLocaleTimeString('id-ID') : '-'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Auto-refresh: 30 dtk</div>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className={auditStyles.categoryBar}>
        {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map(cat => (
          <button
            key={cat}
            className={`${auditStyles.catPill} ${category === cat ? auditStyles.catPillActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
            {cat !== 'all' && (
              <span className={auditStyles.catCount}>
                {logs.filter(l => classifyEvent(l.event_type) === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar} style={{ marginBottom: '1rem' }}>
        <div className={auditStyles.searchBox}>
          <span className={auditStyles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Cari aktivitas, nama tenant, atau tipe event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={auditStyles.searchInput}
          />
          {search && (
            <button className={auditStyles.clearSearch} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredLogs.length} dari {logs.length} event
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className={auditStyles.loadingState}>
          <div className={auditStyles.loadingSpinner} />
          <p>Memuat rekaman audit log keamanan...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className={auditStyles.emptyState}>
          <div className={auditStyles.emptyIcon}>🔍</div>
          <p>Tidak ada event yang cocok dengan filter ini.</p>
          <button className={auditStyles.clearFiltersBtn} onClick={() => { setSearch(''); setCategory('all'); }}>
            Hapus Semua Filter
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* ── Timeline View ── */
        <div className={auditStyles.timeline}>
          {filteredLogs.map((log, i) => {
            const evStyle = getEventStyle(log.event_type);
            return (
              <div key={log.id} className={auditStyles.timelineItem}
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                {/* Timeline Line */}
                <div className={auditStyles.timelineLine}>
                  <div className={auditStyles.timelineDot} style={{ background: evStyle.dot }} />
                  {i < filteredLogs.length - 1 && <div className={auditStyles.timelineConnector} />}
                </div>

                {/* Card */}
                <div className={auditStyles.timelineCard}>
                  <div className={auditStyles.timelineCardTop}>
                    {/* Event Badge */}
                    <span
                      className={auditStyles.eventBadge}
                      style={{ background: evStyle.bg, color: evStyle.text, borderColor: `${evStyle.dot}30` }}
                    >
                      {log.event_type}
                    </span>

                    {/* Tenant */}
                    <span className={auditStyles.tenantChip}>
                      🏫 {log.tenant_name}
                    </span>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={auditStyles.timeAgo} suppressHydrationWarning>
                        {isMounted ? timeAgo(log.created_at) : '...'}
                      </span>
                      <span className={auditStyles.timestamp} suppressHydrationWarning>
                        {isMounted ? new Date(log.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        }) : ''}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className={auditStyles.timelineDetails}>
                    <span className={auditStyles.detailsLabel}>Detail:</span>
                    <code className={auditStyles.detailsCode}>{log.details}</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className={styles.tableCard}>
          <table className={auditStyles.auditTable}>
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>TENANT SEKOLAH</th>
                <th>TIPE EVENT</th>
                <th>DETAIL RESOURCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => {
                const evStyle = getEventStyle(log.event_type);
                return (
                  <tr key={log.id} style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                    className={auditStyles.tableRow}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }} suppressHydrationWarning>
                          {isMounted ? new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          }) : ''}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }} suppressHydrationWarning>
                          {isMounted ? timeAgo(log.created_at) : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className={auditStyles.tenantAvatar}>
                          {log.tenant_name.charAt(0).toUpperCase()}
                        </div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          {log.tenant_name}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <span
                        className={auditStyles.eventBadge}
                        style={{ background: evStyle.bg, color: evStyle.text, borderColor: `${evStyle.dot}30` }}
                      >
                        {log.event_type}
                      </span>
                    </td>
                    <td>
                      <code className={auditStyles.detailsCode} style={{ fontSize: '0.78rem' }}>
                        {log.details}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
