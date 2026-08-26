'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

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
  const [schoolName, setSchoolName] = useState('');

  // Load school profile & students
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sName = getTenantItem('dapodik_nama_sekolah');
      if (sName) setSchoolName(sName);
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) setSchoolName(json.data.name);
        }).catch(() => null);

        const response = await listStudents({ query: { page_size: 500 } as any });
        if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
          const apiStudents = response.data.data || [];
          const mapped: StudentItem[] = apiStudents.map((apiStudent: any, idx: number) => {
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
    showToast(`✓ Siswa "${newStudent.full_name}" berhasil ditambahkan!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    setStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s));
    setEditStudent(null);
    showToast(`✓ Data siswa "${editStudent.full_name}" berhasil diperbarui!`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${name}"?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      showToast(`🗑️ Siswa "${name}" berhasil dihapus dari sistem.`);
    }
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data siswa untuk diekspor!');
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
    showToast('📊 Berkas Excel (.xlsx) Master Peserta Didik berhasil diunduh!');
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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Direktori Peserta Didik</h1>
          <p className={styles.subtitle}>Master data siswa terintegrasi Dapodik Kemendikdasmen di {schoolName}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.tableHeaderArea} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Cari NISN atau Nama Siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input"
          style={{ width: '180px' }}
        >
          <option value="ALL">Semua Rombel / Kelas</option>
          <option value="-">⚠️ Belum Masuk Rombel</option>
          {availableClasses.map((c, idx) => (
            <option key={idx} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
          style={{ width: '180px' }}
        >
          <option value="ALL">Semua Status Siswa</option>
          <option value="ACTIVE">● Status Aktif</option>
          <option value="MUTASI_OUT">📤 Mutasi Keluar</option>
          <option value="INACTIVE">Non-Aktif / Alumni</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NISN & NIPD</th>
              <th>Nama Lengkap Siswa</th>
              <th>TTL & Agama</th>
              <th>Jenis Kelamin</th>
              <th>Rombel / Kelas</th>
              <th>Status Dapodik</th>
              <th style={{ textAlign: 'right' }}>Aksi Master Data</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  🔄 Memuat data siswa dari database...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Tidak ada data peserta didik ditemukan.
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <tr key={s.id} style={{ opacity: s.status === 'MUTASI_OUT' ? 0.75 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <code style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 800 }}>{s.nisn}</code>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIPD: {s.nipd}</span>
                    </div>
                  </td>
                  <td>
                    <Link href={`/dashboard/students/${s.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }} title="Lihat Detail Siswa">
                      <strong style={{ transition: 'color 0.2s ease' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}>
                        {s.full_name}
                      </strong>
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>{s.place_of_birth}, {s.date_of_birth}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.religion}</span>
                    </div>
                  </td>
                  <td>{s.gender}</td>
                  <td>
                    {s.assigned_class && s.assigned_class !== '-' && s.assigned_class !== 'null' && s.assigned_class !== 'Belum Ada Rombel' && s.assigned_class !== 'Belum Masuk Rombel' && s.assigned_class !== 'UMUM' ? (
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>{s.assigned_class}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic', background: 'var(--bg-muted, rgba(148, 163, 184, 0.1))', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px dashed var(--border-light, rgba(148, 163, 184, 0.25))' }}>
                        — Belum Masuk Rombel —
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      s.status === 'ACTIVE' ? 'badge-active' :
                      s.status === 'MUTASI_OUT' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {s.status === 'ACTIVE' && '● Aktif'}
                      {s.status === 'MUTASI_OUT' && '📤 Mutasi Keluar'}
                      {s.status === 'INACTIVE' && 'Non-Aktif / Alumni'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionsCell} style={{ justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        👁️ Detail
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditStudent(s)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleDelete(s.id, s.full_name)}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
