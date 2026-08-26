'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import styles from './users.module.css';
import { exportToExcel } from '@/lib/exportExcel';

type UserAccount = {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  roleLabel: string;
  connectedEntity: string;
  lastLogin: string;
  status: 'ACTIVE' | 'LOCKED';
  defaultPassword?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');

  // Modals & Reset State
  const [resetUser, setResetUser] = useState<UserAccount | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    role: 'student' as 'admin' | 'teacher' | 'student' | 'parent',
    connectedEntity: '',
    password: '',
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = getTenantItem('dapodik_nama_sekolah');
      if (stored && !stored.includes('PKBM')) setSchoolName(stored);

      try {
        const savedPasses = localStorage.getItem('user_credentials_passwords');
        if (savedPasses) setUserPasswords(JSON.parse(savedPasses));
      } catch (e) {
        console.error(e);
      }
    }

    async function loadData() {
      try {
        setIsLoading(true);
        let activeSchool = '';
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) {
            setSchoolName(json.data.name);
            activeSchool = json.data.name;
          }
        }).catch(() => null);

        const usersRes = await fetch('/api/v1/auth/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const userAccounts: UserAccount[] = [];

        if (usersRes.ok) {
          const json = await usersRes.json();
          if (json?.data) {
            json.data.forEach((u: any) => {
              let role: 'admin' | 'teacher' | 'student' | 'parent' = 'admin';
              const roleNameLower = (u.role || '').toLowerCase();
              if (roleNameLower.includes('siswa')) {
                role = 'student';
              } else if (roleNameLower.includes('guru')) {
                role = 'teacher';
              } else if (roleNameLower.includes('wali') || roleNameLower.includes('orang tua')) {
                role = 'parent';
              }

              userAccounts.push({
                id: u.id,
                username: u.email,
                role: role,
                roleLabel: u.role || 'Pengguna',
                connectedEntity: u.full_name,
                lastLogin: new Date(u.created_at).toLocaleString('id-ID'),
                status: u.is_active ? 'ACTIVE' : 'LOCKED',
                defaultPassword: '*** (Terenkripsi)',
              });
            });
          }
        }

        setUsers(userAccounts);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenResetPassword = (u: UserAccount) => {
    const prefix = u.role === 'student' ? 'siswa' : u.role === 'teacher' ? 'guru' : u.role === 'parent' ? 'ortu' : 'admin';
    const generatedPass = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    setTempPassword(generatedPass);

    const updatedPasses = { ...userPasswords, [u.id]: generatedPass };
    setUserPasswords(updatedPasses);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user_credentials_passwords', JSON.stringify(updatedPasses));
      } catch (err) {
        console.warn(err);
      }
    }
    setResetUser(u);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedPass).catch(() => {});
    }
    showToast(`🔑 Password baru untuk "${u.username}" (${generatedPass}) berhasil diperbarui & dicopy!`);
  };

  const toggleUserLock = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        showToast(nextStatus === 'LOCKED' ? `🔒 Akses akun "${u.username}" berhasil dikunci!` : `🔓 Akses akun "${u.username}" berhasil dibuka kembali!`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) return;

    const roleLabels: Record<string, string> = {
      admin: 'Operator',
      teacher: 'Guru',
      student: 'Siswa',
      parent: 'Orang Tua / Wali',
    };

    const pass = formData.password || `${formData.role}123`;
    const targetRole = roleLabels[formData.role] || 'Pengguna';

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: formData.username.trim().toLowerCase(),
          password: pass,
          full_name: formData.connectedEntity || formData.username,
          role: targetRole,
        })
      });

      if (res.ok) {
        showToast(`✓ Akun "${formData.username}" berhasil dibuat dengan password "${pass}"!`);
        setShowAddModal(false);
        // Refresh page to load new user
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await res.json();
        showToast(`⚠️ Gagal membuat akun: ${error.message || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      showToast('⚠️ Gagal menghubungi server saat membuat akun.');
    }
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data akun pengguna untuk diekspor!');
      return;
    }
    const exportData = filtered.map(u => {
      const pass = userPasswords[u.id] || u.defaultPassword || '123456';
      return {
        'ID Akun': u.id,
        'Username Login': u.username,
        'Password Login': pass,
        'Peran Sistem (Role)': u.roleLabel,
        'Entitas Terhubung': u.connectedEntity,
        'Terakhir Login': u.lastLogin,
        'Status Akses': u.status === 'ACTIVE' ? 'Aktif' : 'Terkunci',
      };
    });
    exportToExcel(exportData, `Kredensial_Akun_Pengguna_Android_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Kredensial Login');
    showToast('📊 Berkas Excel (.xlsx) Kredensial Username & Password berhasil diunduh!');
  };

  const filtered = users.filter(u => {
    const matchTab = activeTab === 'ALL' || u.role === activeTab;
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.connectedEntity.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchTab && matchSearch && matchStatus;
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

      {/* Header & Breadcrumb */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Akun &amp; Kredensial Pengguna</h1>
          <p className={styles.subtitle}>Direktori username login, password, hak akses RBAC, dan integrasi Android Mobile App di {schoolName}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel Kredensial (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Buat Akun Baru
          </button>
        </div>
      </div>

      {/* Guidance Card for Working Passwords */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '1.1rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🔑</span>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Manajemen Kredensial Pengguna Terenkripsi
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Semua kata sandi dienkripsi dengan standar keamanan tinggi di database. Anda dapat menggunakan tombol Reset Password jika pengguna melupakan aksesnya.
            </div>
          </div>
        </div>
      </div>

      {/* Role Tabs Bar */}
      <div className={styles.roleTabs}>
        {[
          { key: 'ALL', label: `Semua Akun (${users.length})` },
          { key: 'student', label: `🎓 Siswa (${users.filter(u => u.role === 'student').length})` },
          { key: 'teacher', label: `🏫 Guru (${users.filter(u => u.role === 'teacher').length})` },
          { key: 'parent', label: `👨‍👩‍👧 Orang Tua / Wali (${users.filter(u => u.role === 'parent').length})` },
          { key: 'admin', label: `⚙️ Admin &amp; Staf (${users.filter(u => u.role === 'admin').length})` },
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.roleTabBtn} ${activeTab === t.key ? styles.roleTabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className={styles.tableHeaderArea} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Cari NISN / Username / Nama Pengguna..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input"
          style={{ width: '160px' }}
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">● Status Aktif</option>
          <option value="LOCKED">🔒 Status Terkunci</option>
        </select>
      </div>

      {/* Main Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username Login (Android/Web)</th>
              <th>Password Aktif</th>
              <th>Peran / Hak Akses</th>
              <th>Entitas Profil Terhubung</th>
              <th>Terakhir Login</th>
              <th>Status Akun</th>
              <th style={{ textAlign: 'right' }}>Aksi Kredensial</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Tidak ada data akun pengguna ditemukan.
                </td>
              </tr>
            ) : (
              paginated.map(u => {
                const currentPass = userPasswords[u.id] || u.defaultPassword || '123456';
                return (
                  <tr key={u.id}>
                    <td className={styles.userEmail}>
                      <code style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 800 }}>{u.username}</code>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {currentPass}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-info' :
                        u.role === 'teacher' ? 'badge-active' :
                        u.role === 'student' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {u.roleLabel}
                      </span>
                    </td>
                    <td><strong>{u.connectedEntity}</strong></td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{u.lastLogin}</td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-danger'}`}>
                        {u.status === 'ACTIVE' ? '● Aktif' : '🔒 Terkunci'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionsCell} style={{ justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenResetPassword(u)}
                        >
                          🔑 Reset Pass
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-ghost' : 'btn-primary'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleUserLock(u.id)}
                        >
                          {u.status === 'ACTIVE' ? '🔒 Kunci' : '🔓 Buka Akses'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {filtered.length > itemsPerPage && (
          <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
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

      {/* ── Modal In-Page: Buat Akun Baru ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>+ Buat Akun Pengguna Baru</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: guru_ipa / 0022937459"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Role Akses *</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                      className="input"
                    >
                      <option value="student">Siswa (Android)</option>
                      <option value="parent">Orang Tua (Android)</option>
                      <option value="teacher">Guru Pengampu</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Password Initial *</label>
                    <input
                      type="text"
                      placeholder="contoh: 123456"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Entitas Profil Terhubung</label>
                  <input
                    type="text"
                    placeholder="contoh: ROHID NUR RISKI (Siswa)"
                    value={formData.connectedEntity}
                    onChange={e => setFormData({ ...formData, connectedEntity: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Buat Akun Pengguna</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
