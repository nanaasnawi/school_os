'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './notifications.module.css';
import { listStudents } from '@/lib/sdk/sdk.gen';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'DAPODIK' | 'MOBILE' | 'RAPOR' | 'CBT' | 'WARNING';
  isUnread: boolean;
  linkPath?: string;
  linkText?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'DAPODIK' | 'MOBILE' | 'WARNING'>('ALL');
  const [schoolName, setSchoolName] = useState('');

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
      if (stored && !stored.includes('PKBM')) {
        activeSchool = stored;
        setSchoolName(stored);
      } else {
        setSchoolName(activeSchool);
        setTenantItem('dapodik_nama_sekolah', activeSchool);
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
            activeSchool = json.data.name;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchSchoolProfile();

    // Load real notifications from localStorage or broadcast outbox
    let realNotifs: NotificationItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('dapodik_android_notifications');
        if (raw) {
          const parsed = JSON.parse(raw);
          realNotifs = parsed.map((p: any) => ({
            id: p.id || `notif-${Math.random()}`,
            title: `📱 Broadcast Push: ${p.title}`,
            body: `${p.body} (Target: ${p.target} · Pengirim: ${p.sentBy})`,
            time: p.timestamp || 'Baru Saja',
            type: 'MOBILE' as const,
            isUnread: true,
            linkPath: '/dashboard/announcements',
            linkText: 'Lihat Detail Pengumuman',
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    setNotifications(realNotifs);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    showToast('✓ Seluruh notifikasi telah ditandai dibaca.');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dapodik_android_notifications');
    }
    showToast('🗑️ Log notifikasi berhasil dibersihkan.');
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
            Riwayat Broadcast Push Notification Mobile Android dan Integrasi Sistem di {schoolName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            ✓ Tandai Dibaca Semua
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClearNotifications} style={{ color: '#dc2626' }} disabled={notifications.length === 0}>
            🗑️ Bersihkan Log
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.6rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
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
        >
          📱 Mobile Push Android
        </button>
        <button
          className={`btn btn-sm ${activeFilter === 'DAPODIK' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveFilter('DAPODIK')}
        >
          🔄 Dapodik Sync
        </button>
      </div>

      {/* Notification Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '3.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔔</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Belum Ada Log Broadcast Notification Baru
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Belum ada notifikasi push yang dipublikasikan ke aplikasi Android siswa &amp; wali di <strong>{schoolName}</strong>. Publikasikan pengumuman baru untuk mengirimkan broadcast notification secara real-time.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/dashboard/announcements" className="btn btn-primary btn-sm">
                📢 Buat Pengumuman Baru &amp; Push Android
              </Link>
              <Link href="/dashboard/dapodik" className="btn btn-secondary btn-sm">
                🔄 Cek Integrasi Dapodik
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
            >
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem', marginTop: '2px' }}>
                  {n.type === 'DAPODIK' ? '🔄' : n.type === 'MOBILE' ? '📱' : n.type === 'RAPOR' ? '📑' : n.type === 'WARNING' ? '⚠️' : '🔔'}
                </span>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                    {n.isUnread && <span className="badge badge-primary" style={{ fontSize: '0.65rem', fontWeight: 800 }}>BARU</span>}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {n.body}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>
                    🕒 {n.time}
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
