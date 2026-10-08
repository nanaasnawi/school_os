'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import styles from '../dashboard/system.module.css';
import auditStyles from './audit.module.css';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  List,
  Clock,
  KeyRound,
  BarChart2,
  Building2,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

type AuditLog = {
  id: string;
  tenant_name: string;
  event_type: string;
  details: string;
  created_at: string;
};

type EventCategory = 'all' | 'auth' | 'data' | 'grade' | 'system' | 'security';

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Login: { bg: 'rgba(37,99,235,0.1)', text: '#2563eb', dot: '#3b82f6' },
  Logout: { bg: 'rgba(100,116,139,0.1)', text: '#64748b', dot: '#64748b' },
  GradeReleased: { bg: 'rgba(16,185,129,0.12)', text: '#059669', dot: '#10b981' },
  GradeUpdated: { bg: 'rgba(16,185,129,0.12)', text: '#059669', dot: '#10b981' },
  MaterialCreated: { bg: 'rgba(139,92,246,0.12)', text: '#7c3aed', dot: '#7c3aed' },
  AssignmentPosted: { bg: 'rgba(245,158,11,0.12)', text: '#d97706', dot: '#f59e0b' },
  QuizPublished: { bg: 'rgba(239,68,68,0.12)', text: '#dc2626', dot: '#ef4444' },
  DapodikSync: { bg: 'rgba(6,182,212,0.12)', text: '#0891b2', dot: '#06b6d4' },
  TenantCreated: { bg: 'rgba(236,72,153,0.12)', text: '#db2777', dot: '#ec4899' },
  PasswordReset: { bg: 'rgba(249,115,22,0.12)', text: '#ea580c', dot: '#f97316' },
  Default: { bg: 'rgba(99,102,241,0.12)', text: '#4f46e5', dot: '#6366f1' },
};

function getEventStyle(eventType: string) {
  const key = Object.keys(EVENT_COLORS).find((k) =>
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
  all: 'Semua Event',
  auth: 'Autentikasi',
  grade: 'Penilaian',
  data: 'Sinkronisasi Data',
  system: 'Modul & Konten',
  security: 'Keamanan Sistem',
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

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      l.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || classifyEvent(l.event_type) === category;
    return matchSearch && matchCategory;
  });

  const stats = {
    total: logs.length,
    authEvents: logs.filter((l) => classifyEvent(l.event_type) === 'auth').length,
    gradeEvents: logs.filter((l) => classifyEvent(l.event_type) === 'grade').length,
    tenants: [...new Set(logs.map((l) => l.tenant_name))].length,
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className={styles.title} style={{ margin: 0 }}>
              Jejak Audit &amp; Keamanan Sistem
            </h1>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              <span className={styles.liveText}>Audit Trail Aktif</span>
            </div>
          </div>
          <p className={styles.subtitle}>
            Rekaman aktivitas autentikasi, mutasi data, dan kepatuhan sistem operasi institusi secara immutable.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'timeline' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('timeline')}
              title="Tampilan Linimasa"
            >
              <Clock size={14} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
            >
              <List size={14} />
            </button>
          </div>

          <button
            className={styles.refreshBtn}
            onClick={() => fetchAuditLogs(true)}
            disabled={isRefreshing}
            title="Muat ulang rekaman log"
          >
            <RefreshCw size={13} className={isRefreshing ? styles.spinIcon : ''} />
            <span>{isRefreshing ? 'Memuat…' : 'Perbarui'}</span>
          </button>
        </div>
      </header>

      {/* KPI Stats */}
      <div className={auditStyles.statsRow}>
        <div className={auditStyles.statCard}>
          <div className={auditStyles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }}>
            <FileText size={18} />
          </div>
          <div>
            <div className={auditStyles.statValue} style={{ color: '#4f46e5' }}>{stats.total}</div>
            <div className={auditStyles.statLabel}>Total Rekaman</div>
          </div>
        </div>

        <div className={auditStyles.statCard}>
          <div className={auditStyles.statIcon} style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <KeyRound size={18} />
          </div>
          <div>
            <div className={auditStyles.statValue} style={{ color: '#2563eb' }}>{stats.authEvents}</div>
            <div className={auditStyles.statLabel}>Sesi &amp; Autentikasi</div>
          </div>
        </div>

        <div className={auditStyles.statCard}>
          <div className={auditStyles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <BarChart2 size={18} />
          </div>
          <div>
            <div className={auditStyles.statValue} style={{ color: '#10b981' }}>{stats.gradeEvents}</div>
            <div className={auditStyles.statLabel}>Mutasi Akademik</div>
          </div>
        </div>

        <div className={auditStyles.statCard}>
          <div className={auditStyles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
            <Building2 size={18} />
          </div>
          <div>
            <div className={auditStyles.statValue} style={{ color: '#d97706' }}>{stats.tenants}</div>
            <div className={auditStyles.statLabel}>Institusi Terlibat</div>
          </div>
        </div>

        <div className={auditStyles.refreshInfo}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sinkronisasi Terakhir</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }} suppressHydrationWarning>
            {isMounted && lastRefresh ? lastRefresh.toLocaleTimeString('id-ID') : '-'}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className={auditStyles.categoryBar}>
        {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => (
          <button
            key={cat}
            className={`${auditStyles.catPill} ${category === cat ? auditStyles.catPillActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            <span>{CATEGORY_LABELS[cat]}</span>
            {cat !== 'all' && (
              <span className={auditStyles.catCount}>
                {logs.filter((l) => classifyEvent(l.event_type) === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar} style={{ marginBottom: '1rem' }}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari aktivitas, nama institusi, atau tipe event…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
              title="Bersihkan pencarian"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          Menampilkan {filteredLogs.length} dari {logs.length} rekaman
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.stateContainer}>
          <div className={styles.spinner} />
          <span>Memuat rekaman jejak audit keamanan…</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className={styles.stateContainer}>
          <span>Tidak ada rekaman audit yang sesuai dengan filter pencarian.</span>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
            style={{ marginTop: '8px' }}
          >
            Hapus Semua Filter
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className={auditStyles.timeline}>
          {filteredLogs.map((log, i) => {
            const evStyle = getEventStyle(log.event_type);
            return (
              <div
                key={log.id}
                className={auditStyles.timelineItem}
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                <div className={auditStyles.timelineLine}>
                  <div className={auditStyles.timelineDot} style={{ background: evStyle.dot }} />
                  {i < filteredLogs.length - 1 && <div className={auditStyles.timelineConnector} />}
                </div>

                <div className={auditStyles.timelineCard}>
                  <div className={auditStyles.timelineCardTop}>
                    <span
                      className={auditStyles.eventBadge}
                      style={{ background: evStyle.bg, color: evStyle.text, borderColor: `${evStyle.dot}30` }}
                    >
                      {log.event_type}
                    </span>

                    <span className={auditStyles.tenantChip}>
                      <Building2 size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
                      {log.tenant_name}
                    </span>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={auditStyles.timeAgo} suppressHydrationWarning>
                        {isMounted ? timeAgo(log.created_at) : '…'}
                      </span>
                      <span className={auditStyles.timestamp} suppressHydrationWarning>
                        {isMounted
                          ? new Date(log.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>

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
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Waktu</th>
                  <th style={{ width: '25%' }}>Institusi / Tenant</th>
                  <th style={{ width: '20%' }}>Tipe Peristiwa</th>
                  <th style={{ width: '35%' }}>Detail Parameter</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const evStyle = getEventStyle(log.event_type);
                  return (
                    <tr key={log.id} className={styles.tableRow}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }} suppressHydrationWarning>
                            {isMounted
                              ? new Date(log.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : ''}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} suppressHydrationWarning>
                            {isMounted ? timeAgo(log.created_at) : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className={styles.tenantAvatar} style={{ width: 28, height: 28, fontSize: '11px' }}>
                            {log.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                            {log.tenant_name}
                          </span>
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
                        <code className={auditStyles.detailsCode} style={{ fontSize: '11px' }}>
                          {log.details}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
