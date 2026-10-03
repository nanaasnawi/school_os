'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './users.module.css';
import { exportToExcel } from '@/lib/exportExcel';

type UserAccount = {
  id: string;
  username: string;
  email?: string;
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
      if (stored) setSchoolName(stored);

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
                username: u.username || u.email,
                email: u.email,
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
    showToast('✓ Password baru berhasil disalin');
  };

  const toggleUserLock = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        showToast(nextStatus === 'LOCKED' ? '✓ Akun berhasil dikunci' : '✓ Akun berhasil dibuka');
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
        showToast('✓ Akun berhasil dibuat');
        setShowAddModal(false);
        // Refresh page to load new user
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('⚠️ Gagal membuat akun');
      }
    } catch (err) {
      showToast('⚠️ Gagal menghubungi server');
    }
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Data kosong');
      return;
    }
    const exportData = filtered.map(u => ({
      'ID User': u.id,
      'Username': u.username,
      'Role Portal': u.role,
      'Entitas Terhubung': u.connectedEntity,
      'Status Akses': u.status,
      'Aktivitas Terakhir': u.lastLogin,
    }));
    exportToExcel(exportData, 'Data_Pengguna_Portal_SchoolOS', 'Pengguna');
    showToast('✓ Berkas Excel berhasil diunduh');
  };

  type UserSortField = 'username' | 'role' | 'connectedEntity' | 'lastLogin' | 'status';
  const [sortField, setSortField] = useState<UserSortField>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSetSort = (field: UserSortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = users.filter(u => {
    const matchTab = activeTab === 'ALL' || u.role === activeTab;
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.connectedEntity.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchTab && matchSearch && matchStatus;
  });

  const sortedUsers = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'username') {
        comparison = (a.username || '').localeCompare(b.username || '');
      } else if (sortField === 'role') {
        comparison = (a.role || '').localeCompare(b.role || '');
      } else if (sortField === 'connectedEntity') {
        comparison = (a.connectedEntity || '').localeCompare(b.connectedEntity || '');
      } else if (sortField === 'lastLogin') {
        comparison = (a.lastLogin || '').localeCompare(b.lastLogin || '');
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(u => u.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [sortedUsers.length]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginated = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Akun &amp; Kredensial Pengguna</h1>
          <p className={styles.subtitle}>Direktori username login, kata sandi, hak akses peran (RBAC), dan integrasi Mobile App di {schoolName}</p>
        </div>
      </div>

      {/* Top Action Pills (Reference Design System) */}
      <div className="tableActionRow">
        <button type="button" className="tableActionBtn" onClick={() => setShowAddModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Buat Akun Baru</span>
        </button>

        <Link href="/dashboard/students/qr-scan" className="tableActionBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Pusat Kartu Akses QR</span>
        </Link>

        <button type="button" className="tableActionBtn" onClick={exportToExcelFile}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* Main Table Card (Screenshot Reference Design) */}
      <div className="tableCard">
        {/* Top Toolbar */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries {filtered.length !== users.length ? `(filtered from ${users.length} total entries)` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={activeTab}
              onChange={e => { setActiveTab(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Peran ({users.length})</option>
              <option value="student">Siswa ({users.filter(u => u.role === 'student').length})</option>
              <option value="teacher">Guru ({users.filter(u => u.role === 'teacher').length})</option>
              <option value="parent">Wali Murid ({users.filter(u => u.role === 'parent').length})</option>
              <option value="admin">Admin ({users.filter(u => u.role === 'admin').length})</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
            </select>

            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="tableSearchInput"
              />
              <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="thSortable" onClick={() => handleSetSort('username')}>
                  <div className="thSortContent">
                    <span>Username Login</span>
                    <span className="sortArrows">{sortField === 'username' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th>Password Kredensial</th>
                <th className="thSortable" onClick={() => handleSetSort('role')}>
                  <div className="thSortContent">
                    <span>Peran / Hak Akses</span>
                    <span className="sortArrows">{sortField === 'role' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('connectedEntity')}>
                  <div className="thSortContent">
                    <span>Entitas Profil Terhubung</span>
                    <span className="sortArrows">{sortField === 'connectedEntity' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('lastLogin')}>
                  <div className="thSortContent">
                    <span>Terakhir Login</span>
                    <span className="sortArrows">{sortField === 'lastLogin' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('status')}>
                  <div className="thSortContent">
                    <span>Status</span>
                    <span className="sortArrows">{sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Aksi Kredensial</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.75rem auto' }} />
                    <span>Memuat data akun pengguna...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Tidak Ada Akun Ditemukan</div>
                    <div style={{ fontSize: '0.82rem' }}>Coba sesuaikan kata kunci pencarian atau filter peran.</div>
                  </td>
                </tr>
              ) : (
                paginated.map(u => {
                  const isChecked = selectedIds.has(u.id);
                  const currentPass = userPasswords[u.id] || u.defaultPassword || '123456';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div>
                          <span className="itemPrimaryTitle">
                            <code>{u.username}</code>
                          </span>
                          <div className="itemSubtitleCheck">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>{u.email ? u.email : 'Mobile Access ID'}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {currentPass}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: u.role === 'admin' ? '#d97706' : u.role === 'teacher' ? '#2563eb' : '#059669', fontSize: '0.8rem' }}>
                          {u.roleLabel}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{u.connectedEntity}</strong>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.lastLogin}</span>
                      </td>

                      <td>
                        <span className={`statusPill ${u.status === 'ACTIVE' ? 'statusPillActive' : 'statusPillDanger'}`}>
                          {u.status === 'ACTIVE' ? 'Active' : 'Locked'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => handleOpenResetPassword(u)}
                            title="Reset Kata Sandi"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Reset
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-ghost' : 'btn-primary'}`}
                            style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => toggleUserLock(u.id)}
                            title={u.status === 'ACTIVE' ? 'Kunci Akun' : 'Buka Kunci Akun'}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            {u.status === 'ACTIVE' ? 'Kunci' : 'Buka'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls */}
        <div className="tableFooter">
          <div className="entriesSelector">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="paginationControls">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="pageBtnNav"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`pageBtnNum ${currentPage === p ? 'pageBtnActive' : ''}`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="pageBtnNav"
            >
              Next
            </button>
          </div>
        </div>
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
