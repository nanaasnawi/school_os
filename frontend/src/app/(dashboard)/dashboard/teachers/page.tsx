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
  const [schoolName, setSchoolName] = useState('');

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
    showToast('✓ Data guru berhasil ditambahkan');
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
    showToast('✓ Data guru berhasil diperbarui');
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Data kosong');
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
    showToast('✓ Berkas Excel berhasil diunduh');
  };

  const filtered = teachers.filter(t => {
    const matchSearch = t.full_name.toLowerCase().includes(search.toLowerCase()) || (t.nuptk || '').includes(search) || (t.nip || '').includes(search);
    const matchSubject = subjectFilter === 'ALL' || t.subject === subjectFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? t.is_active : !t.is_active);
    return matchSearch && matchSubject && matchStatus;
  });

  // --- Client-Side Sort ---
  type TeacherSortField = 'full_name' | 'nuptk' | 'jk' | 'tempat_lahir' | 'tanggal_lahir' | 'status_kepegawaian' | 'jenis_ptk';
  const [sortField, setSortField] = React.useState<TeacherSortField | null>('full_name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const handleSetSort = (field: TeacherSortField, order: 'asc' | 'desc') => {
    if (sortField === field && sortOrder === order) {
      setSortField(null);
    } else {
      setSortField(field);
      setSortOrder(order);
    }
  };

  const sorted = React.useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String((a as any)[sortField] ?? '').toLowerCase();
      const bv = String((b as any)[sortField] ?? '').toLowerCase();
      const cmp = av.localeCompare(bv, 'id');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortOrder]);

  // --- Client-Side Pagination & Selection ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length, sortField, sortOrder, itemsPerPage]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Direktori Guru &amp; Tenaga Pendidik</h1>
          <p className={styles.subtitle}>Direktori guru pengampu terdaftar terintegrasi Dapodik GTK{schoolName ? ` di ${schoolName}` : ''}</p>
        </div>
      </div>

      {/* Top Action Pills (Reference Design System) */}
      <div className="tableActionRow">
        <button type="button" className="tableActionBtn" onClick={handleOpenAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Tambah Guru Baru</span>
        </button>

        <Link href="/dashboard/students/qr-scan" className="tableActionBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Pusat Kartu Akses QR</span>
        </Link>

        <button type="button" className="tableActionBtn" onClick={exportToExcelFile}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Ekspor Data Excel (.xlsx)</span>
        </button>

        <Link href="/dashboard/dapodik" className="tableActionBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          <span>Tarik Data Dapodik GTK</span>
        </Link>
      </div>

      {/* Main Table Card (Screenshot Reference Design) */}
      <div className="tableCard">
        {/* Top Toolbar */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries {filtered.length !== teachers.length ? `(filtered from ${teachers.length} total entries)` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={subjectFilter}
              onChange={e => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {subjectsList.map((s: any) => (
                <option key={s.id || s.code} value={s.name}>{s.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('full_name', sortField === 'full_name' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>Nama Lengkap Guru</span>
                    <span className="sortArrows">{sortField === 'full_name' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th
                  className="thSortable"
                  onClick={() => handleSetSort('nuptk', sortField === 'nuptk' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>NUPTK / NIP</span>
                    <span className="sortArrows">{sortField === 'nuptk' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th
                  className="thSortable"
                  onClick={() => handleSetSort('jk', sortField === 'jk' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>L/P</span>
                    <span className="sortArrows">{sortField === 'jk' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th
                  className="thSortable"
                  onClick={() => handleSetSort('jenis_ptk', sortField === 'jenis_ptk' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>Jenis PTK / Mapel</span>
                    <span className="sortArrows">{sortField === 'jenis_ptk' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th
                  className="thSortable"
                  onClick={() => handleSetSort('status_kepegawaian', sortField === 'status_kepegawaian' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>Kepegawaian</span>
                    <span className="sortArrows">{sortField === 'status_kepegawaian' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.75rem auto' }} />
                    <span>Memuat data guru dari sistem...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Tidak Ada Data Guru Ditemukan</div>
                    <div style={{ fontSize: '0.82rem' }}>Coba ubah kata kunci pencarian atau tarik data melalui Dapodik Hub.</div>
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const isChecked = selectedIds.has(t.id);
                  return (
                    <tr key={t.id}>
                      <td>
                        <div>
                          <Link href={`/dashboard/teachers/${t.id}`} className="itemPrimaryTitle" title="Lihat Profil Guru">
                            <span>{t.full_name}</span>
                          </Link>
                          <div className="itemSubtitleCheck">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Pendidik Terdaftar</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <code style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>{t.nuptk || t.nip || '—'}</code>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.nip ? `NIP: ${t.nip}` : 'Non-PNS'}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600 }}>{t.jk === 'L' ? 'L' : t.jk === 'P' ? 'P' : (t.jk || '—')}</span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.jenis_ptk || t.subject || 'Guru Mapel'}</span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.status_kepegawaian || 'PNS / Yayasan'}</span>
                      </td>

                      <td>
                        <span className={`statusPill ${t.is_active !== false ? 'statusPillActive' : 'statusPillMuted'}`}>
                          {t.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/dashboard/teachers/${t.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Buka Profil"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Profil
                          </Link>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Guru"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
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
              onChange={e => setItemsPerPage(Number(e.target.value))}
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
