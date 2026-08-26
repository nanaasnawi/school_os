'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './teachers.module.css';
import { exportToExcel } from '@/lib/exportExcel';
import { apiClient } from '@/lib/api';
import { listTeachers } from '@/lib/sdk/sdk.gen';

type TeacherItem = {
  id: string;
  nuptk: string;
  full_name: string;
  nip?: string;
  jk?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  status_kepegawaian?: string;
  jenis_ptk?: string;
  agama?: string;
  alamat_jalan?: string;
  no_hp?: string;
  email?: string;
  subject: string;
  is_active: boolean;
};



export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('Sekolah');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const sName = getTenantItem('dapodik_nama_sekolah');
      if (sName) setSchoolName(sName);
    }

    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) setSchoolName(json.data.name);
        }).catch(() => null);

        const [teacherRes, subjectRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          fetch('/api/v1/academic/subjects', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) {
            setFormData(prev => ({ ...prev, subject: subjectRes.data[0].name }));
          }
        }

        if (teacherRes?.data?.data && teacherRes.data.data.length > 0) {
          setTeachers(teacherRes.data.data.map((t: any) => ({
            id: t.id,
            nuptk: t.nuptk || '-',
            full_name: t.full_name,
            nip: t.nip || '-',
            jk: t.jk || '-',
            tempat_lahir: t.tempat_lahir || '-',
            tanggal_lahir: t.tanggal_lahir || '-',
            status_kepegawaian: t.status_kepegawaian || '-',
            jenis_ptk: t.jenis_ptk || '-',
            agama: t.agama || '-',
            alamat_jalan: t.alamat_jalan || '-',
            no_hp: t.no_hp || '-',
            email: t.email || '-',
            subject: t.subject || '-',
            is_active: t.is_active !== undefined ? t.is_active : ((t.status || '').toLowerCase() === 'active' || (t.status || '').toLowerCase() === 'aktif')
          })));
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
      }

      setTeachers([]);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherItem | null>(null);
  const [formData, setFormData] = useState({
    nip: '',
    full_name: '',
    nuptk: '',
    jk: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    status_kepegawaian: '',
    jenis_ptk: '',
    agama: '',
    alamat_jalan: '',
    no_hp: '',
    email: '',
    subject: 'Matematika',
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
      nip: '',
      full_name: '',
      nuptk: '',
      jk: 'L',
      tempat_lahir: '',
      tanggal_lahir: '',
      status_kepegawaian: '',
      jenis_ptk: '',
      agama: '',
      alamat_jalan: '',
      no_hp: '',
      email: '',
      subject: 'Matematika',
      is_active: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: TeacherItem) => {
    setEditTeacher(t);
    setFormData({
      nip: t.nip || '',
      full_name: t.full_name,
      nuptk: t.nuptk || '',
      jk: t.jk || 'L',
      tempat_lahir: t.tempat_lahir || '',
      tanggal_lahir: t.tanggal_lahir || '',
      status_kepegawaian: t.status_kepegawaian || '',
      jenis_ptk: t.jenis_ptk || '',
      agama: t.agama || '',
      alamat_jalan: t.alamat_jalan || '',
      no_hp: t.no_hp || '',
      email: t.email || '',
      subject: t.subject || 'Matematika',
      is_active: t.is_active,
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) return;

    const newTeacher: TeacherItem = {
      id: String(Date.now()),
      nip: formData.nip,
      full_name: formData.full_name,
      nuptk: formData.nuptk,
      jk: formData.jk,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: formData.tanggal_lahir,
      status_kepegawaian: formData.status_kepegawaian,
      jenis_ptk: formData.jenis_ptk,
      agama: formData.agama,
      alamat_jalan: formData.alamat_jalan,
      no_hp: formData.no_hp,
      email: formData.email,
      subject: formData.subject,
      is_active: formData.is_active,
    };

    setTeachers([newTeacher, ...teachers]);
    setShowAddModal(false);
    showToast(`✓ Data Guru "${formData.full_name}" berhasil ditambahkan!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher || !formData.full_name) return;

    setTeachers(teachers.map(t => t.id === editTeacher.id ? {
      ...t,
      nip: formData.nip,
      full_name: formData.full_name,
      nuptk: formData.nuptk,
      jk: formData.jk,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: formData.tanggal_lahir,
      status_kepegawaian: formData.status_kepegawaian,
      jenis_ptk: formData.jenis_ptk,
      agama: formData.agama,
      alamat_jalan: formData.alamat_jalan,
      no_hp: formData.no_hp,
      email: formData.email,
      subject: formData.subject,
      is_active: formData.is_active,
    } : t));

    setEditTeacher(null);
    showToast(`✓ Data Guru "${formData.full_name}" berhasil diperbarui!`);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data guru untuk diekspor!');
      return;
    }
    const exportData = filtered.map(t => ({
      'Nama': t.full_name,
      'NUPTK': t.nuptk,
      'JK': t.jk,
      'Tempat Lahir': t.tempat_lahir,
      'Tanggal Lahir': t.tanggal_lahir,
      'NIP': t.nip,
      'Status Kepegawaian': t.status_kepegawaian,
      'Jenis PTK': t.jenis_ptk,
      'Agama': t.agama,
      'Alamat Jalan': t.alamat_jalan,
      'No HP': t.no_hp,
      'Email': t.email,
      'Mata Pelajaran': t.subject,
      'Status Aktif': t.is_active ? 'Aktif' : 'Nonaktif',
    }));
    exportToExcel(exportData, `Data_Guru_GTK_${schoolName.replace(/\s+/g, '_')}`, 'Data Guru');
    showToast(`📊 Berkas Excel (.xlsx) Data Guru ${schoolName} berhasil diunduh!`);
  };

  const filtered = teachers.filter(t => {
    const matchSearch = t.full_name.toLowerCase().includes(search.toLowerCase()) || (t.nuptk || '').includes(search) || (t.nip || '').includes(search);
    const matchSubject = subjectFilter === 'ALL' || t.subject === subjectFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? t.is_active : !t.is_active);
    return matchSearch && matchSubject && matchStatus;
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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Data Guru</h1>
          <p className={styles.subtitle}>Direktori data guru pengampu &amp; pengajar terdaftar di {schoolName}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Tambah Guru Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.tableHeaderArea} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Cari NIP atau Nama Guru..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="input"
          style={{ width: '190px' }}
        >
          <option value="ALL">Semua Mapel</option>
          {subjectsList.map((s: any) => (
            <option key={s.id || s.code} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input"
          style={{ width: '150px' }}
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">● Status Aktif</option>
          <option value="INACTIVE">● Status Nonaktif</option>
        </select>
      </div>

      {/* Main Table / Empty State */}
      <div className={styles.tableCard}>
        {isLoading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat data guru...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍🏫</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Belum Ada Data Guru Terdaftar</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px', margin: '8px auto 18px', lineHeight: 1.5 }}>
              Data GTK/Guru belum ditarik dari Dapodik lokal atau belum ditambahkan ke sistem. Silakan lakukan **Tarik Data** di Dapodik Hub.
            </p>
            <Link href="/dashboard/dapodik" className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
              📥 Buka Dapodik Hub &amp; Tarik Data
            </Link>
          </div>
        ) : (
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
            {paginated.map(t => (
              <tr key={t.id}>
                <td className={styles.teacherName}>{t.full_name}</td>
                <td className={styles.nip}><code>{t.nuptk}</code></td>
                <td>{t.jk}</td>
                <td>{t.tempat_lahir}</td>
                <td>{t.tanggal_lahir}</td>
                <td>{t.status_kepegawaian}</td>
                <td><span className="badge badge-info">{t.jenis_ptk || t.subject}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className={styles.actionsCell} style={{ justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <Link href={`/dashboard/teachers/${t.id}`} className="btn btn-secondary btn-sm">
                      Profil
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(t)}>
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}

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

      {/* ── Modal In-Page: Tambah Guru Baru ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                + Tambah Guru Baru
              </h2>
              <button 
                style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }} 
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>NUPTK *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: 1234567890123456"
                    value={formData.nuptk}
                    onChange={e => setFormData({ ...formData, nuptk: e.target.value })}
                    className="input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap &amp; Gelar *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Bpk. Hendra Wijaya, M.Pd"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pengampu Utama</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                    >
                      {subjectsList.map((s: any) => (
                        <option key={s.id || s.code} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>No. Telepon / WA</label>
                    <input
                      type="text"
                      placeholder="0812-3456-7890"
                      value={formData.no_hp}
                      onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Data Guru</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal In-Page: Edit Guru ── */}
      {editTeacher && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setEditTeacher(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '540px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ✏️ Edit Data Guru ({editTeacher.full_name})
              </h2>
              <button 
                style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }} 
                onClick={() => setEditTeacher(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>NUPTK *</label>
                  <input
                    type="text"
                    required
                    value={formData.nuptk}
                    onChange={e => setFormData({ ...formData, nuptk: e.target.value })}
                    className="input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap &amp; Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pengampu Utama</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                    >
                      {subjectsList.map((s: any) => (
                        <option key={s.id || s.code} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>No. WA</label>
                    <input
                      type="text"
                      value={formData.no_hp}
                      onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Status Guru</label>
                    <select
                      value={formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                      onChange={e => setFormData({ ...formData, is_active: e.target.value === 'ACTIVE' })}
                      className="input"
                    >
                      <option value="ACTIVE">● Aktif</option>
                      <option value="INACTIVE">● Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditTeacher(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Update Rekord</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
