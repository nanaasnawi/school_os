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

const PKBM_STAFF: StaffItem[] = [];

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
    showToast('📊 Berkas Excel (.xlsx) Data Staf & Tendik berhasil diunduh!');
  };

  const filtered = staffList.filter(st => {
    const matchSearch = st.full_name.toLowerCase().includes(search.toLowerCase()) || st.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || st.department === deptFilter;
    return matchSearch && matchDept;
  });

  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Staf &amp; Tenaga Kependidikan (Tendik)</h1>
          <p className={styles.subtitle}>Direktori data pegawai tata usaha &amp; tenaga kependidikan terdaftar di sekolah</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Tambah Staf Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.tableHeaderArea} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Cari Nama Pegawai..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="input"
          style={{ width: '170px' }}
        >
          <option value="ALL">Semua Departemen</option>
          <option value="Manajemen & Pimpinan">Manajemen &amp; Pimpinan</option>
          <option value="IT & Data Administrasi">IT &amp; Data Administrasi</option>
          <option value="Keuangan & Operational">Keuangan &amp; Operasional</option>
        </select>
      </div>

      {/* Main Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>NUPTK</th>
              <th>L/P</th>
              <th>Tempat Lahir</th>
              <th>Tanggal Lahir</th>
              <th>Status Kepegawaian</th>
              <th>Jenis PTK</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(st => (
              <tr key={st.id}>
                <td className={styles.staffName}><strong>{st.full_name}</strong></td>
                <td>{st.nuptk}</td>
                <td>{st.jk}</td>
                <td>{st.tempat_lahir}</td>
                <td>{st.tanggal_lahir}</td>
                <td>{st.status_kepegawaian}</td>
                <td><span className="badge badge-info">{st.jenis_ptk || st.role_title}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className={styles.actionsCell} style={{ justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(st)}>
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>✏️ Edit Data Pegawai ({editStaff.full_name})</h2>
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
