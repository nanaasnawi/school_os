'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './notifications.module.css';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  formatRelativeTime,
  getNotificationVisual,
  RealNotification,
} from '@/lib/notifications';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'DAPODIK' | 'MOBILE' | 'RAPOR' | 'CBT' | 'WARNING' | 'SYSTEM';
  isUnread: boolean;
  linkPath?: string;
  linkText?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'DAPODIK' | 'MOBILE' | 'WARNING'>('ALL');
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadNotificationsData = async () => {
    try {
      const data = await fetchNotifications(1, 50);
      const serverNotifs: NotificationItem[] = (data.items || []).map((n: RealNotification) => {
        const visual = getNotificationVisual(n.notification_type, n.title, n.body);
        let nType: NotificationItem['type'] = 'SYSTEM';
        const rawT = (n.notification_type || '').toUpperCase();
        if (rawT.includes('DAPODIK')) nType = 'DAPODIK';
        else if (rawT.includes('MOBILE') || rawT.includes('ATTENDANCE') || rawT.includes('ANNOUNCEMENT')) nType = 'MOBILE';
        else if (rawT.includes('RAPOR') || rawT.includes('GRADE')) nType = 'RAPOR';
        else if (rawT.includes('QUIZ') || rawT.includes('CBT')) nType = 'CBT';
        else if (rawT.includes('WARNING')) nType = 'WARNING';

        return {
          id: n.id,
          title: n.title,
          body: n.body,
          time: formatRelativeTime(n.created_at),
          type: nType,
          isUnread: !n.is_read,
          linkPath: visual.link,
          linkText: 'Buka Halaman',
        };
      });

      // Also merge any local broadcast notifications if present
      let localNotifs: NotificationItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('dapodik_android_notifications');
          if (raw) {
            const parsed = JSON.parse(raw);
            localNotifs = parsed.map((p: any) => ({
              id: p.id || `local-${Math.random()}`,
              title: `[Push Android] ${p.title}`,
              body: `${p.body} (Target: ${p.target || 'Semua'} · Pengirim: ${p.sentBy || 'Admin'})`,
              time: p.timestamp ? formatRelativeTime(p.timestamp) : 'Baru Saja',
              type: 'MOBILE' as const,
              isUnread: true,
              linkPath: '/dashboard/announcements',
              linkText: 'Lihat Detail Pengumuman',
            }));
          }
        } catch {
          // ignore
        }
      }

      // Deduplicate by ID
      const all = [...serverNotifs, ...localNotifs];
      const seen = new Set<string>();
      const deduped: NotificationItem[] = [];
      for (const item of all) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduped.push(item);
        }
      }

      setNotifications(deduped);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = getTenantItem('dapodik_nama_sekolah');
      if (stored) {
        setSchoolName(stored);
      }
    }

    async function fetchSchoolProfile() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.name) {
            setSchoolName(json.data.name);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchSchoolProfile();

    loadNotificationsData();

    // Listen to real-time notification updates
    if (typeof window !== 'undefined') {
      window.addEventListener('schoolos_notification_updated', loadNotificationsData);
      return () => {
        window.removeEventListener('schoolos_notification_updated', loadNotificationsData);
      };
    }
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    await markAllNotificationsRead();
    showToast('✓ Seluruh notifikasi telah ditandai dibaca.');
  };

  const handleItemClick = async (n: NotificationItem) => {
    if (n.isUnread) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isUnread: false } : item));
      await markNotificationRead(n.id);
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dapodik_android_notifications');
    }
    showToast('Log notifikasi lokal berhasil dibersihkan.');
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return n.isUnread;
    if (activeFilter === 'DAPODIK') return n.type === 'DAPODIK';
    if (activeFilter === 'MOBILE') return n.type === 'MOBILE';
    if (activeFilter === 'WARNING') return n.type === 'WARNING';
    return true;
  });

  const unreadCount = notifications.filter(n => n.isUnread).length;

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
            Pusat Notifikasi &amp; Broadcast Log
          </h1>
          <p className={styles.subtitle}>
            Riwayat aktivitas akademik, Dapodik, dan mobile push notification{schoolName ? ` di ${schoolName}` : ''} secara real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead} disabled={unreadCount === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Tandai Dibaca Semua</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClearNotifications} style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={notifications.length === 0}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Bersihkan Log</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.6rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveFilter('ALL')}
        >
          Semua Notifikasi ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'UNREAD' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveFilter('UNREAD')}
        >
          Belum Dibaca ({unreadCount})
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'MOBILE' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveFilter('MOBILE')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <span>Mobile Push Android</span>
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'DAPODIK' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveFilter('DAPODIK')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Dapodik Sync</span>
        </button>
      </div>

      {/* Notification Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span>Memuat notifikasi real-time...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '3.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Belum Ada Notifikasi Baru
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Semua aktivitas akademik, presensi mobile, evaluasi kuis CBT, dan sinkronisasi Dapodik akan tercatat di sini secara otomatis.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/dashboard/announcements" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Buat Pengumuman Baru &amp; Push Android</span>
              </Link>
              <Link href="/dashboard/dapodik" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Cek Integrasi Dapodik</span>
              </Link>
            </div>
          </div>
        ) : (
          filtered.map(n => (
            <div
              key={n.id}
              style={{
                background: n.isUnread ? 'var(--bg-card)' : 'var(--bg-elevated)',
                border: n.isUnread ? '1.5px solid #2563eb' : '1px solid var(--border-light)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
              onClick={() => handleItemClick(n)}
            >
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: n.type === 'DAPODIK' ? '#eff6ff' : n.type === 'MOBILE' ? '#f5f3ff' : n.type === 'RAPOR' ? '#ecfdf5' : n.type === 'CBT' ? '#fffbeb' : n.type === 'WARNING' ? '#fef2f2' : '#f1f5f9',
                  color: n.type === 'DAPODIK' ? '#2563eb' : n.type === 'MOBILE' ? '#7c3aed' : n.type === 'RAPOR' ? '#059669' : n.type === 'CBT' ? '#d97706' : n.type === 'WARNING' ? '#dc2626' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {n.type === 'DAPODIK' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  ) : n.type === 'MOBILE' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  ) : n.type === 'RAPOR' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  ) : n.type === 'CBT' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  ) : n.type === 'WARNING' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                    {n.isUnread && <span className="badge badge-primary" style={{ fontSize: '0.65rem', fontWeight: 800 }}>BARU</span>}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {n.body}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{n.time}</span>
                  </div>
                </div>
              </div>

              {n.linkPath && (
                <Link href={n.linkPath} className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                  {n.linkText || 'Buka Halaman'}
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
