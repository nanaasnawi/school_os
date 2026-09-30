'use client';
import { getTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './students.module.css';
import { listStudents } from '@/lib/sdk/sdk.gen';
import { getDapodikSyncRecords } from '@/lib/dapodik-bridge';
import { exportToExcel } from '@/lib/exportExcel';

type StudentItem = {
  id: string;
  nisn: string;
  nipd?: string;
  full_name: string;
  nik: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  religion: string;
  alamat_jalan?: string;
  no_hp?: string;
  email?: string;
  assigned_class: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MUTASI_OUT';
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState(() => {
    if (typeof window !== 'undefined') {
      return getTenantItem('dapodik_nama_sekolah') || '';
    }
    return '';
  });

  // Load school profile & students
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) setSchoolName(json.data.name);
        }).catch(() => null);

        const response = await listStudents({ query: { page_size: 500 } });
        if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
          type RawStudent = {
            id: string;
            nisn: string;
            nipd?: string;
            full_name: string;
            nik?: string;
            gender?: string;
            place_of_birth?: string;
            date_of_birth?: string;
            religion?: string;
            alamat_jalan?: string;
            no_hp?: string;
            email?: string;
            class_name?: string;
            rombel?: string;
            status?: string;
          };
          const apiStudents = response.data.data as RawStudent[];
          const mapped: StudentItem[] = apiStudents.map((apiStudent) => {
            const name = apiStudent.full_name || '';
            const statusLower = (apiStudent.status || '').toLowerCase();
            const isMutated = statusLower === 'transferredout' || statusLower === 'transferred' || statusLower === 'mutasi_out';
            const isInactive = isMutated || statusLower === 'inactive' || statusLower === 'alumni';

            const rawGender = (apiStudent.gender || '').toUpperCase();
            const genderStr = rawGender === 'L' ? 'Laki-laki' : rawGender === 'P' ? 'Perempuan' : 'Tidak Diketahui';

            return {
              id: apiStudent.id,
              nisn: apiStudent.nisn,
              nipd: apiStudent.nipd || '-',
              full_name: name,
              nik: apiStudent.nik || '-',
              gender: genderStr,
              place_of_birth: apiStudent.place_of_birth || '-',
              date_of_birth: apiStudent.date_of_birth || '-',
              religion: apiStudent.religion || '-',
              alamat_jalan: apiStudent.alamat_jalan || '-',
              no_hp: apiStudent.no_hp || '-',
              assigned_class: apiStudent.class_name || (apiStudent.rombel && apiStudent.rombel !== 'null' && apiStudent.rombel !== 'UMUM' ? apiStudent.rombel : '-'),
              status: isMutated ? 'MUTASI_OUT' : isInactive ? 'INACTIVE' : 'ACTIVE',
            };
          });
          setStudents(mapped);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching students from API:', err);
      }

      // Fallback: Populate from pulled/cached Dapodik records
      try {
        const syncRecords = await getDapodikSyncRecords();
        if (syncRecords.length > 0) {
          const mapped: StudentItem[] = syncRecords.map((r, idx) => {
            const isMutated = r.mobilityCase === 'TRANSFER_OUT_APPROVED' || (r.identityState as string) === 'MUTASI_OUT';
            const cleanRombel = r.rombel && r.rombel !== 'null' && r.rombel !== 'UMUM' && r.rombel !== 'Belum Ada Rombel' ? r.rombel : '-';
            return {
              id: r.id,
              nisn: r.nisn,
              nipd: (r as any).nipd || '-',
              full_name: r.namaSchoolOS || r.namaDapodik,
              nik: r.nik || '-',
              gender: (r as any).jenis_kelamin === 'L' ? 'Laki-laki' : (r as any).jenis_kelamin === 'P' ? 'Perempuan' : 'Tidak Diketahui',
              place_of_birth: (r as any).tempat_lahir || '-',
              date_of_birth: (r as any).tanggal_lahir || '-',
              religion: (r as any).agama_id_str || '-',
              alamat_jalan: (r as any).alamat_jalan || '-',
              no_hp: (r as any).nomor_telepon_seluler || '-',
              email: (r as any).email || '-',
              assigned_class: cleanRombel,
              status: isMutated ? 'MUTASI_OUT' : r.identityState === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            };
          });
          setStudents(mapped);
        }
      } catch (e) {
        console.error('Error loading Dapodik sync records:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('dapodik_data_updated', loadData);
      return () => {
        window.removeEventListener('dapodik_data_updated', loadData);
      };
    }
  }, []);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nisn: '',
    full_name: '',
    gender: 'Laki-laki',
    assigned_class: '-',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MUTASI_OUT',
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.full_name) return;

    const newStudent: StudentItem = {
      id: `std-${Date.now()}`,
      nisn: formData.nisn,
      nipd: '-',
      full_name: formData.full_name,
      nik: '-',
      gender: formData.gender,
      place_of_birth: '-',
      date_of_birth: '-',
      religion: '-',
      alamat_jalan: '-',
      no_hp: '-',
      email: '-',
      assigned_class: formData.assigned_class || '-',
      status: formData.status,
    };

    setStudents([newStudent, ...students]);
    setShowAddModal(false);
    setFormData({ nisn: '', full_name: '', gender: 'Laki-laki', assigned_class: '-', status: 'ACTIVE' });
    showToast('✓ Siswa berhasil ditambahkan');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    setStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s));
    setEditStudent(null);
    showToast('✓ Data siswa berhasil diperbarui');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${name}"?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      showToast('✓ Siswa berhasil dihapus');
    }
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Data kosong');
      return;
    }
    const exportData = filtered.map(s => ({
      'ID Siswa': s.id,
      'NISN': s.nisn,
      'NIPD': s.nipd,
      'NIK': s.nik,
      'Nama Lengkap': s.full_name,
      'Tempat Lahir': s.place_of_birth,
      'Tanggal Lahir': s.date_of_birth,
      'Jenis Kelamin': s.gender,
      'Agama': s.religion,
      'Alamat Jalan': s.alamat_jalan,
      'No HP': s.no_hp,
      'Email': s.email,
      'Rombel / Kelas': s.assigned_class === '-' ? 'Belum Masuk Rombel' : s.assigned_class,
      'Status DAPODIK': s.status === 'MUTASI_OUT' ? 'Mutasi Keluar' : s.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif',
    }));
    exportToExcel(exportData, `Master_Peserta_Didik_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Data Siswa');
    showToast('✓ Berkas Excel berhasil diunduh');
  };

  const availableClasses = Array.from(
    new Set(
      students
        .map(s => s.assigned_class)
        .filter(c => c && c !== '-' && c !== 'null' && c !== 'Belum Masuk Rombel' && c !== 'Belum Ada Rombel' && c !== 'UMUM')
    )
  ).sort();

  const filtered = students.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || s.nisn.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchClass = classFilter === 'ALL' || s.assigned_class === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  type SortField = 'nisn' | 'full_name' | 'ttl' | 'gender' | 'assigned_class' | 'status';
  type SortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField | null>('full_name');
  const [sortOrder, setSortOrder] = useState<SortOrder | null>('asc');

  const handleSetSort = (field: SortField, order: SortOrder) => {
    if (sortField === field && sortOrder === order) {
      // Toggle off / reset to neutral if clicked again
      setSortField(null);
      setSortOrder(null);
    } else {
      setSortField(field);
      setSortOrder(order);
    }
  };

  const sorted = React.useMemo(() => {
    if (!sortField || !sortOrder) return filtered;
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'nisn') {
        comparison = (a.nisn || '').localeCompare(b.nisn || '', undefined, { numeric: true });
      } else if (sortField === 'full_name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '', 'id', { sensitivity: 'base' });
      } else if (sortField === 'ttl') {
        const aVal = `${a.place_of_birth || ''} ${a.date_of_birth || ''} ${a.religion || ''}`;
        const bVal = `${b.place_of_birth || ''} ${b.date_of_birth || ''} ${b.religion || ''}`;
        comparison = aVal.localeCompare(bVal, 'id', { sensitivity: 'base' });
      } else if (sortField === 'gender') {
        comparison = (a.gender || '').localeCompare(b.gender || '', 'id');
      } else if (sortField === 'assigned_class') {
        comparison = (a.assigned_class || '').localeCompare(b.assigned_class || '', undefined, { numeric: true });
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filtered, sortField, sortOrder]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Direktori Peserta Didik</h1>
          <p className={styles.subtitle}>Master data siswa terintegrasi Dapodik Kemendikdasmen{schoolName ? ` di ${schoolName}` : ''}</p>
        </div>
      </div>

      {/* Top Action Pills (Reference Design System) */}
      <div className="tableActionRow">
        <button type="button" className="tableActionBtn" onClick={() => setShowAddModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Tambah Siswa Baru</span>
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
          <span>Sinkronisasi Dapodik</span>
        </Link>
      </div>

      {/* Main Table Card (Screenshot Reference Design) */}
      <div className="tableCard">
        {/* Top Toolbar: Showing entries info + Search & Filter */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}</strong> to <strong>{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries {filtered.length !== students.length ? `(filtered from ${students.length} total entries)` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Rombel</option>
              {availableClasses.map((c, idx) => (
                <option key={idx} value={c}>Kelas {c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Active</option>
              <option value="MUTASI_OUT">Mutasi</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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
                <th style={{ width: '44px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="tableCheckbox"
                    aria-label="Pilih semua siswa di halaman ini"
                  />
                </th>

                {/* NISN */}
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('nisn', sortField === 'nisn' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>NISN &amp; NIPD</span>
                    <span className="sortArrows">{sortField === 'nisn' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                {/* Nama Lengkap Siswa */}
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('full_name', sortField === 'full_name' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>Nama Peserta Didik</span>
                    <span className="sortArrows">{sortField === 'full_name' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                {/* Rombel / Kelas */}
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('assigned_class', sortField === 'assigned_class' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>Kelas / Rombel</span>
                    <span className="sortArrows">{sortField === 'assigned_class' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                {/* TTL & Gender */}
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('ttl', sortField === 'ttl' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>TTL &amp; Gender</span>
                    <span className="sortArrows">{sortField === 'ttl' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                {/* Status */}
                <th
                  className="thSortable"
                  onClick={() => handleSetSort('status', sortField === 'status' && sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="thSortContent">
                    <span>Status</span>
                    <span className="sortArrows">{sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                {/* Aksi */}
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.75rem auto' }} />
                    <span>Memuat data peserta didik dari database...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Tidak Ada Data Siswa Ditemukan</div>
                    <div style={{ fontSize: '0.82rem' }}>Coba ubah kata kunci pencarian atau sesuaikan filter rombel.</div>
                  </td>
                </tr>
              ) : (
                paginated.map((s) => {
                  const isChecked = selectedIds.has(s.id);
                  return (
                    <tr key={s.id} style={{ opacity: s.status === 'MUTASI_OUT' ? 0.75 : 1 }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(s.id)}
                          className="tableCheckbox"
                          aria-label={`Pilih ${s.full_name}`}
                        />
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <code style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>{s.nisn}</code>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>NIPD: {s.nipd || '—'}</span>
                        </div>
                      </td>

                      <td>
                        <div>
                          <Link href={`/dashboard/students/${s.id}`} className="itemPrimaryTitle" title="Lihat Profil Siswa">
                            <span>{s.full_name}</span>
                            <svg className="externalLinkIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </Link>
                          <div className="itemSubtitleCheck">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>{s.status === 'ACTIVE' ? 'Auto Sync Aktif' : 'Terdata di Sistem'}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {s.assigned_class && s.assigned_class !== '-' ? s.assigned_class : '— Belum Masuk Rombel —'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {s.date_of_birth || s.place_of_birth ? `${s.place_of_birth || ''}, ${s.date_of_birth || ''}` : '—'}
                          <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>•</span>
                          <span>{s.gender === 'L' ? 'Laki-laki' : s.gender === 'P' ? 'Perempuan' : (s.gender || '—')}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`statusPill ${s.status === 'ACTIVE' ? 'statusPillActive' : s.status === 'MUTASI_OUT' ? 'statusPillWarning' : 'statusPillMuted'}`}>
                          {s.status === 'ACTIVE' ? 'Active' : s.status === 'MUTASI_OUT' ? 'Mutasi' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/dashboard/students/${s.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Buka Profil"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Detail
                          </Link>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => setEditStudent(s)}
                            title="Edit Data Siswa"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#dc2626', padding: '0.28rem 0.5rem', fontSize: '0.76rem' }}
                            onClick={() => handleDelete(s.id, s.full_name)}
                            title="Hapus Siswa"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

        {/* Bottom Pagination Controls (Screenshot Reference Design) */}
        <div className="tableFooter">
          <div className="entriesSelector">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
              disabled={safePage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  className={`pageBtnNum ${safePage === p ? 'pageBtnActive' : ''}`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>}

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="pageBtnNav"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* MODAL EDIT SISWA */}
      {editStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setEditStudent(null)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', maxWidth: '480px', width: '100%',
            overflow: 'hidden', border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>✏️ Edit Data Peserta Didik</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setEditStudent(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>NISN *</label>
                  <input type="text" required value={editStudent.nisn} onChange={e => setEditStudent({ ...editStudent, nisn: e.target.value })} className="input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Nama Lengkap Siswa *</label>
                  <input type="text" required value={editStudent.full_name} onChange={e => setEditStudent({ ...editStudent, full_name: e.target.value })} className="input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Rombel / Kelas *</label>
                    <input type="text" required value={editStudent.assigned_class} onChange={e => setEditStudent({ ...editStudent, assigned_class: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Status *</label>
                    <select value={editStudent.status} onChange={e => setEditStudent({ ...editStudent, status: e.target.value as any })} className="input">
                      <option value="ACTIVE">● Status Aktif</option>
                      <option value="MUTASI_OUT">📤 Mutasi Keluar</option>
                      <option value="INACTIVE">Non-Aktif / Alumni</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditStudent(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SISWA */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', maxWidth: '480px', width: '100%',
            overflow: 'hidden', border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>+ Tambah Peserta Didik Baru</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>NISN *</label>
                  <input type="text" required placeholder="contoh: 0092950256" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} className="input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Nama Lengkap Siswa *</label>
                  <input type="text" required placeholder="contoh: MUHAMAD RIZKY" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Rombel / Kelas *</label>
                    <input type="text" required value={formData.assigned_class} onChange={e => setFormData({ ...formData, assigned_class: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Jenis Kelamin *</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="input">
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Buat Record Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
