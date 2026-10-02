'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './staff.module.css';
import { exportToExcel } from '@/lib/exportExcel';

type StaffItem = {
  id: string;
  full_name: string;
  nuptk?: string;
  jk?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  nip?: string;
  status_kepegawaian?: string;
  jenis_ptk?: string;
  agama?: string;
  alamat_jalan?: string;
  no_hp?: string;
  email?: string;
  role_title: string;
  department: string;
  is_active: boolean;
};


export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadStaff() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch('/api/v1/staff?page_size=100', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setStaffList(json.data.map((st: any) => ({
              id: st.id,
              full_name: st.full_name,
              nuptk: st.nuptk || '-',
              jk: st.jk || '-',
              tempat_lahir: st.tempat_lahir || '-',
              tanggal_lahir: st.tanggal_lahir || '-',
              nip: st.nip || '-',
              status_kepegawaian: st.status_kepegawaian || '-',
              jenis_ptk: st.jenis_ptk || '-',
              agama: st.agama || '-',
              alamat_jalan: st.alamat_jalan || '-',
              no_hp: st.no_hp || '-',
              email: st.email || '-',
              role_title: st.job_title || 'Tendik',
              department: 'Tata Usaha / Administrasi',
              is_active: st.is_active !== undefined ? st.is_active : true,
            })));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff list:', err);
      }
      setStaffList([]);
      setIsLoading(false);
    }
    loadStaff();
  }, []);

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffItem | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    nuptk: '',
    jk: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    nip: '',
    status_kepegawaian: '',
    jenis_ptk: '',
    agama: '',
    alamat_jalan: '',
    no_hp: '',
    email: '',
    role_title: 'Staf Administrasi',
    department: 'Administrasi',
    is_active: true,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      nuptk: '',
      jk: 'L',
      tempat_lahir: '',
      tanggal_lahir: '',
      nip: '',
      status_kepegawaian: '',
      jenis_ptk: '',
      agama: '',
      alamat_jalan: '',
      no_hp: '',
      email: '',
      role_title: 'Staf Administrasi',
      department: 'Administrasi',
      is_active: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (st: StaffItem) => {
    setEditStaff(st);
    setFormData({
      full_name: st.full_name,
      nuptk: st.nuptk || '',
      jk: st.jk || 'L',
      tempat_lahir: st.tempat_lahir || '',
      tanggal_lahir: st.tanggal_lahir || '',
      nip: st.nip || '',
      status_kepegawaian: st.status_kepegawaian || '',
      jenis_ptk: st.jenis_ptk || '',
      agama: st.agama || '',
      alamat_jalan: st.alamat_jalan || '',
      no_hp: st.no_hp || '',
      email: st.email || '',
      role_title: st.role_title,
      department: st.department,
      is_active: st.is_active,
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) return;

    const newStaff: StaffItem = {
      id: String(Date.now()),
      full_name: formData.full_name,
      nuptk: formData.nuptk,
      jk: formData.jk,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: formData.tanggal_lahir,
      nip: formData.nip,
      status_kepegawaian: formData.status_kepegawaian,
      jenis_ptk: formData.jenis_ptk,
      agama: formData.agama,
      alamat_jalan: formData.alamat_jalan,
      no_hp: formData.no_hp,
      email: formData.email,
      role_title: formData.role_title,
      department: formData.department,
      is_active: formData.is_active,
    };

    setStaffList([newStaff, ...staffList]);
    setShowAddModal(false);
    showToast(`✓ Data Pegawai "${formData.full_name}" berhasil ditambahkan!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff || !formData.full_name) return;

    setStaffList(staffList.map(st => st.id === editStaff.id ? {
      ...st,
      full_name: formData.full_name,
      nuptk: formData.nuptk,
      jk: formData.jk,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: formData.tanggal_lahir,
      nip: formData.nip,
      status_kepegawaian: formData.status_kepegawaian,
      jenis_ptk: formData.jenis_ptk,
      agama: formData.agama,
      alamat_jalan: formData.alamat_jalan,
      no_hp: formData.no_hp,
      email: formData.email,
      role_title: formData.role_title,
      department: formData.department,
      is_active: formData.is_active,
    } : st));

    setEditStaff(null);
    showToast(`✓ Data Pegawai "${formData.full_name}" berhasil diperbarui!`);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data staf untuk diekspor!');
      return;
    }
    const exportData = filtered.map(st => ({
      'Nama Pegawai': st.full_name,
      'NUPTK': st.nuptk,
      'JK': st.jk,
      'Tempat Lahir': st.tempat_lahir,
      'Tanggal Lahir': st.tanggal_lahir,
      'Status Kepegawaian': st.status_kepegawaian,
      'Jenis PTK': st.jenis_ptk,
      'Agama': st.agama,
      'Alamat Jalan': st.alamat_jalan,
      'No HP': st.no_hp,
      'Email': st.email,
      'Jabatan / Tugas': st.role_title,
      'Departemen': st.department,
      'Status Kepegawaian Aktif': st.is_active ? 'Aktif' : 'Nonaktif',
    }));
    const schoolName = typeof window !== 'undefined' ? (getTenantItem('dapodik_nama_sekolah') || 'Sekolah') : 'Sekolah';
    exportToExcel(exportData, `Data_Staf_Tendik_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Data Staf');
    showToast('Berkas Excel (.xlsx) Data Staf & Tendik berhasil diunduh!');
  };

  const filtered = staffList.filter(st => {
    const matchSearch = st.full_name.toLowerCase().includes(search.toLowerCase()) || st.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || st.department === deptFilter;
    return matchSearch && matchDept;
  });

  // --- Client-Side Sort ---
  type StaffSortField = 'full_name' | 'nuptk' | 'jk' | 'tempat_lahir' | 'tanggal_lahir' | 'status_kepegawaian' | 'jenis_ptk';
  const [sortField, setSortField] = React.useState<StaffSortField | null>('full_name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const handleSetSort = (field: StaffSortField, order: 'asc' | 'desc') => {
    if (sortField === field && sortOrder === order) { setSortField(null); }
    else { setSortField(field); setSortOrder(order); }
  };

  const sorted = React.useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortField] ?? '').toLowerCase();
      const bv = String((b as Record<string, unknown>)[sortField] ?? '').toLowerCase();
      const cmp = av.localeCompare(bv, 'id');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortOrder]);

  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  // ------------------------------

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

      {/* Header & Breadcrumbs */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Staf &amp; Tenaga Kependidikan (Tendik)</h1>
          <p className={styles.subtitle}>Direktori data pegawai tata usaha &amp; tenaga kependidikan terdaftar di sekolah</p>
        </div>
      </div>

      {/* Top Action Pills (Reference Design System) */}
      <div className="tableActionRow">
        <button type="button" className="tableActionBtn" onClick={handleOpenAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Tambah Staf Baru</span>
        </button>

        <button type="button" className="tableActionBtn" onClick={exportToExcelFile}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Ekspor Data Excel (.xlsx)</span>
        </button>

        <Link href="/dashboard/dapodik" className="tableActionBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          <span>Sinkronisasi Dapodik</span>
        </Link>
      </div>

      {/* Main Table Card (Screenshot Reference Design) */}
      <div className="tableCard">
        {/* Top Toolbar: Showing entries info + Search & Filter */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}</strong> to <strong>{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries {filtered.length !== staffList.length ? `(filtered from ${staffList.length} total entries)` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Departemen</option>
              <option value="Manajemen & Pimpinan">Manajemen &amp; Pimpinan</option>
              <option value="IT & Data Administrasi">IT &amp; Data Administrasi</option>
              <option value="Keuangan & Operational">Keuangan &amp; Operasional</option>
            </select>

            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Cari nama pegawai, NUPTK..."
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

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="thSortable" onClick={() => handleSetSort('full_name', sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <div className="thSortContent">
                    <span>Nama Lengkap</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('nuptk', sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <div className="thSortContent">
                    <span>NUPTK</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('jk', sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <div className="thSortContent">
                    <span>L/P</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Tempat, Tgl Lahir</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('status_kepegawaian', sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <div className="thSortContent">
                    <span>Status Kepegawaian</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('jenis_ptk', sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <div className="thSortContent">
                    <span>Jabatan / Jenis PTK</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada data pegawai yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div
                        className="itemPrimaryTitle"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenEdit(st)}
                      >
                        <span>{st.full_name}</span>
                      </div>
                      <div className="itemSubtitleCheck">
                        <span>✓ Terverifikasi PTK</span>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.8rem', color: '#64748b' }}>{st.nuptk}</code></td>
                    <td style={{ fontWeight: 600 }}>{st.jk}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {st.tempat_lahir}, {st.tanggal_lahir}
                    </td>
                    <td>
                      <span className="statusPill statusPillActive">
                        {st.status_kepegawaian || 'Aktif'}
                      </span>
                    </td>
                    <td>
                      <span className="statusPill statusPillMuted">
                        {st.jenis_ptk || st.role_title}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="pageBtnNav"
                        style={{ border: '1px solid #cbd5e1', padding: '0.28rem 0.6rem', fontSize: '0.78rem' }}
                        onClick={() => handleOpenEdit(st)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="tableFooter">
          <div className="entriesSelector">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={() => {}}
              className="entriesSelect"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="paginationControls">
            <button
              className="pageBtnNav"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                className={`pageBtnNum ${pageNum === safePage ? 'pageBtnActive' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              className="pageBtnNav"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal In-Page: Tambah Staf Baru ── */}
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
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>+ Tambah Staf / Tendik Baru</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap Pegawai *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: SITI MUNIROH"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Jabatan / Peran</label>
                    <input
                      type="text"
                      value={formData.role_title}
                      onChange={e => setFormData({ ...formData, role_title: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Departemen</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812-5566-7788"
                    value={formData.no_hp}
                    onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Data Pegawai</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal In-Page: Edit Staf ── */}
      {editStaff && (
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
        }} onClick={() => setEditStaff(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Edit Data Pegawai ({editStaff.full_name})</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setEditStaff(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap Pegawai *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Jabatan</label>
                    <input
                      type="text"
                      value={formData.role_title}
                      onChange={e => setFormData({ ...formData, role_title: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Departemen</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditStaff(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Update Rekord</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
