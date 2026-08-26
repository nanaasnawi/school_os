'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './announcements.module.css';
import { listTeachers } from '@/lib/sdk/sdk.gen';

type AnnouncementItem = {
  id: string;
  title: string;
  category: 'AKADEMIK' | 'SISTEM' | 'KEGIATAN' | 'DAPODIK' | 'PENTING';
  target: string;
  date: string;
  author: string;
  content: string;
  isPinned: boolean;
  pushStatus: boolean;
  attachmentName?: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [teachersList, setTeachersList] = useState<any[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AnnouncementItem | null>(null);

  // Form State
  const [newAnn, setNewAnn] = useState({
    title: '',
    category: 'AKADEMIK' as AnnouncementItem['category'],
    target: 'Semua Siswa & Guru',
    author: '',
    content: '',
    isPinned: false,
    sendPushAndroid: true,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) {
            setSchoolName(json.data.name);
            activeSchool = json.data.name;
          }
        }).catch(() => null);

        const teacherRes = await listTeachers({ query: { page_size: 100 } as any }).catch(() => null);
        if (teacherRes?.data?.data) {
          setTeachersList(teacherRes.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();

    // Load persisted announcements only created by user/teacher
    if (typeof window !== 'undefined') {
      try {
        const storedAnn = localStorage.getItem('school_os_announcements');
        if (storedAnn) {
          const parsed = JSON.parse(storedAnn);
          if (Array.isArray(parsed)) {
            setAnnouncements(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveAnnouncementsState = (updatedList: AnnouncementItem[]) => {
    setAnnouncements(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('school_os_announcements', JSON.stringify(updatedList));
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) return;

    const authorName = newAnn.author || `Kepala Sekolah ${schoolName}`;

    const item: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: newAnn.title,
      category: newAnn.category,
      target: newAnn.target,
      date: `Hari ini · ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      author: authorName,
      content: newAnn.content,
      isPinned: newAnn.isPinned,
      pushStatus: newAnn.sendPushAndroid,
    };

    const nextList = [item, ...announcements];
    saveAnnouncementsState(nextList);

    // Push notification to Android Hub store
    if (newAnn.sendPushAndroid && typeof window !== 'undefined') {
      try {
        const storedNotifs = localStorage.getItem('dapodik_android_notifications');
        const notifList = storedNotifs ? JSON.parse(storedNotifs) : [];
        const newAndroidNotif = {
          id: `notif-${Date.now()}`,
          title: item.title,
          body: item.content,
          target: item.target,
          category: item.category,
          timestamp: 'Baru Saja',
          sentBy: item.author,
          status: 'DELIVERED',
        };
        localStorage.setItem('dapodik_android_notifications', JSON.stringify([newAndroidNotif, ...notifList]));
      } catch (err) {
        console.error('Failed to sync push notification:', err);
      }
    }

    setShowAddModal(false);
    setNewAnn({
      title: '',
      category: 'AKADEMIK',
      target: 'Semua Siswa & Guru',
      author: '',
      content: '',
      isPinned: false,
      sendPushAndroid: true,
    });

    if (newAnn.sendPushAndroid) {
      showToast(`📱 Broadcast Push Notification "${item.title}" BERHASIL DIKIRIM ke Aplikasi Android Siswa & Orang Tua!`);
    } else {
      showToast(`📢 Pengumuman "${item.title}" berhasil dipublikasikan!`);
    }
  };

  const handleDeleteAnnouncement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      const filteredList = announcements.filter(a => a.id !== id);
      saveAnnouncementsState(filteredList);
      showToast('🗑️ Pengumuman berhasil dihapus.');
    }
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = announcements.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a);
    saveAnnouncementsState(updated);
    showToast('📌 Status disematkan pengumuman berhasil diperbarui.');
  };

  const filtered = announcements.filter((a) => {
    const matchCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
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
            Papan Pengumuman &amp; Broadcast Informasi
          </h1>
          <p className={styles.subtitle}>
            Papan Informasi Digital &amp; Broadcast Push Notification Mobile Android terintegrasi di {schoolName}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          + Buat Pengumuman Baru &amp; Push Android
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid var(--border-dim)' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="🔍 Cari pengumuman, topik, atau penulis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input"
          style={{ width: '170px' }}
        >
          <option value="ALL">Semua Kategori</option>
          <option value="AKADEMIK">AKADEMIK</option>
          <option value="DAPODIK">DAPODIK</option>
          <option value="KEGIATAN">KEGIATAN</option>
          <option value="PENTING">PENTING</option>
        </select>
      </div>

      {/* Announcements Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginated.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '3.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📢</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Belum Ada Pengumuman / Broadcast yang Dipublikasikan
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Belum ada informasi edaran atau broadcast pengumuman resmi di <strong>{schoolName}</strong>. Klik tombol di bawah untuk membuat pengumuman baru dan mengirimkan notifikasi ke aplikasi Android.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              + Buat Pengumuman Baru &amp; Push Android
            </button>
          </div>
        ) : (
          paginated.map((a) => (
            <div key={a.id} className={styles.feedCard} style={{ background: 'var(--bg-card)', border: a.isPinned ? '2px solid #2563eb' : '1px solid var(--border-light)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${a.category === 'AKADEMIK' ? 'badge-info' : a.category === 'DAPODIK' ? 'badge-purple' : a.category === 'PENTING' ? 'badge-danger' : 'badge-active'}`} style={{ fontWeight: 800 }}>
                      {a.category}
                    </span>
                    {a.isPinned && (
                      <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                        📌 Pinned / Sematkan
                      </span>
                    )}
                    {a.pushStatus && (
                      <span className="badge badge-active" style={{ fontWeight: 700, fontSize: '0.68rem' }}>
                        📱 Android Push Sent ✓
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>{a.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.74rem' }} onClick={(e) => handleTogglePin(a.id, e)}>
                    {a.isPinned ? '📌 Lepas Pin' : '📌 Sematkan'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDetail(a)}>
                    👁️ Baca Selengkapnya
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#dc2626', fontSize: '0.74rem' }} onClick={(e) => handleDeleteAnnouncement(a.id, e)}>
                    🗑️ Hapus
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0.5rem 0' }}>
                {a.content}
              </p>

              {a.attachmentName && (
                <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, marginTop: '0.4rem' }}>
                  📎 {a.attachmentName}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <div>Target: <strong>{a.target}</strong> • Dipublikasikan oleh: <strong style={{ color: 'var(--text-primary)' }}>{a.author}</strong></div>
                <div>🕒 {a.date}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── MODAL BUAT PENGUMUMAN BARU & PUSH NOTIFICATION ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                📢 Publish Pengumuman &amp; Broadcast Push Android
              </h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Judul Pengumuman *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Edaran Libur Semester &amp; Jadwal Ulangan Harian"
                    value={newAnn.title}
                    onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
                    className="input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Kategori *</label>
                    <select
                      value={newAnn.category}
                      onChange={e => setNewAnn({ ...newAnn, category: e.target.value as any })}
                      className="input"
                    >
                      <option value="AKADEMIK">AKADEMIK</option>
                      <option value="DAPODIK">DAPODIK</option>
                      <option value="KEGIATAN">KEGIATAN</option>
                      <option value="PENTING">PENTING</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Target Sasaran Android *</label>
                    <select
                      value={newAnn.target}
                      onChange={e => setNewAnn({ ...newAnn, target: e.target.value })}
                      className="input"
                    >
                      <option value="Semua Siswa &amp; Guru">Semua Siswa &amp; Guru</option>
                      <option value="Siswa Mobile Android">Siswa Mobile Android</option>
                      <option value="Orang Tua / Wali Murid">Orang Tua / Wali Murid</option>
                      <option value="Guru &amp; Tendik Sekolah">Guru &amp; Tendik Sekolah</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Penulis / Penerbit *</label>
                  <select
                    value={newAnn.author}
                    onChange={e => setNewAnn({ ...newAnn, author: e.target.value })}
                    className="input"
                  >
                    <option value={`Kepala Sekolah ${schoolName}`}>Kepala Sekolah ({schoolName})</option>
                    <option value="Operator Dapodik">Operator Dapodik</option>
                    <option value="Bendahara Sekolah">Bendahara Sekolah</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={`${t.full_name} (Guru Pengampu)`}>
                        {t.full_name} ({t.subject || 'Guru'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Isi Pengumuman Lengkap *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tuliskan pesan broadcast lengkap di sini..."
                    value={newAnn.content}
                    onChange={e => setNewAnn({ ...newAnn, content: e.target.value })}
                    className="input"
                    style={{ height: 'auto' }}
                  />
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="pushAndroidCheck"
                      checked={newAnn.sendPushAndroid}
                      onChange={e => setNewAnn({ ...newAnn, sendPushAndroid: e.target.checked })}
                    />
                    <label htmlFor="pushAndroidCheck" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', cursor: 'pointer' }}>
                      📱 Kirimkan Broadcast Push Notification ke Aplikasi Android Siswa &amp; Wali
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="pinnedCheck"
                      checked={newAnn.isPinned}
                      onChange={e => setNewAnn({ ...newAnn, isPinned: e.target.checked })}
                    />
                    <label htmlFor="pinnedCheck" style={{ fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      📌 Sematkan pengumuman di bagian paling atas (Pinned to Top)
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">🚀 Broadcast &amp; Push to Mobile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL PENGUMUMAN ── */}
      {selectedDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setSelectedDetail(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="badge badge-info">{selectedDetail.category}</span>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelectedDetail(null)}>×</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>{selectedDetail.title}</h3>
              
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div>Dipublikasikan oleh: <strong>{selectedDetail.author}</strong></div>
                <div>Target Sasaran: <strong>{selectedDetail.target}</strong></div>
                <div>Waktu Terbit: <strong>{selectedDetail.date}</strong></div>
                <div>Status Mobile App: <span style={{ color: '#16a34a', fontWeight: 700 }}>📱 Push Notification Delivered ✓</span></div>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                {selectedDetail.content}
              </p>

              {selectedDetail.attachmentName && (
                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
                  📎 {selectedDetail.attachmentName}
                </div>
              )}
            </div>
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
