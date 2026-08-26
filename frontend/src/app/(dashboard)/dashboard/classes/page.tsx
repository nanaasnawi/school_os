'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './classes.module.css';
import { listClasses, listTeachers, listStudents } from '@/lib/sdk/sdk.gen';
import { getDapodikSyncRecords } from '@/lib/dapodik-bridge';
import { exportToExcel } from '@/lib/exportExcel';

type ClassItem = {
  id: string;
  name: string;
  grade_level: string;
  homeroom_teacher: string;
  student_count: number;
  room: string;
  category: 'PAKET_A' | 'PAKET_B' | 'PAKET_C' | 'KKA' | 'REGULER';
};

export default function ClassesPage() {
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    async function loadData() {
      try {
        const [classRes, teacherRes, studentRes] = await Promise.all([
          listClasses({ query: { page_size: 200 } as any }).catch(() => null),
          listTeachers({ query: { page_size: 200 } as any }).catch(() => null),
          listStudents({ query: { page_size: 1000 } as any }).catch(() => null),
        ]);

        const teacherMap = new Map<string, string>();
        if (teacherRes?.data?.data) {
          teacherRes.data.data.forEach((t: any) => {
            if (t.id && t.full_name) {
              teacherMap.set(t.id, t.full_name);
            }
          });
        }

        const studentCountMap = new Map<string, number>();
        if (studentRes?.data?.data) {
          studentRes.data.data.forEach((s: any) => {
            const className = s.class_name;
            if (className) {
              studentCountMap.set(className, (studentCountMap.get(className) || 0) + 1);
            }
          });
        }

        if (classRes?.data?.success && classRes.data.data && classRes.data.data.length > 0) {
          const apiClasses = classRes.data.data || [];
          const mapped: ClassItem[] = apiClasses.map((c: any) => {
            const teacherName = c.homeroom_teacher_id ? teacherMap.get(c.homeroom_teacher_id) : null;
            const count = studentCountMap.get(c.name) || 0;
            let category: ClassItem['category'] = 'REGULER';
            let gradeLevel = 'Kelas Umum';

            if (c.name.startsWith('PAKET A')) {
              category = 'PAKET_A';
              gradeLevel = 'Paket A (Setara SD)';
            } else if (c.name.startsWith('PAKET B')) {
              category = 'PAKET_B';
              gradeLevel = 'Paket B (Setara SMP)';
            } else if (c.name.startsWith('PAKET C')) {
              category = 'PAKET_C';
              gradeLevel = 'Paket C (Setara SMA)';
            } else if (c.name.startsWith('KKA')) {
              category = 'KKA';
              gradeLevel = 'Keterampilan / KKA';
            } else {
              gradeLevel = 'Kelas Reguler';
            }

            return {
              id: c.id,
              name: c.name,
              grade_level: gradeLevel,
              homeroom_teacher: teacherName || 'Belum ditentukan',
              student_count: count,
              room: c.name.startsWith('PAKET') ? 'Gedung Utama' : c.name.startsWith('KKA') ? 'Lab Keterampilan' : 'R. Belajar',
              category,
            };
          });

          const orderRank = (name: string) => {
            if (name.startsWith('PAKET A')) return 10;
            if (name.startsWith('PAKET B')) return 20;
            if (name.startsWith('PAKET C')) return 30;
            if (name.startsWith('KKA')) return 40;
            return 50;
          };

          mapped.sort((a, b) => {
            const rankA = orderRank(a.name);
            const rankB = orderRank(b.name);
            if (rankA !== rankB) return rankA - rankB;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });

          setClassesList(mapped);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }

      // Fallback: Compute Rombel Classes & Student Counts from Synced Dapodik Records!
      try {
        const syncRecords = await getDapodikSyncRecords();
        if (syncRecords.length > 0) {
          const classCounts = new Map<string, number>();
          syncRecords.forEach(r => {
            const rombel = r.rombel || 'UMUM';
            classCounts.set(rombel, (classCounts.get(rombel) || 0) + 1);
          });

          const fallbackClasses: ClassItem[] = Array.from(classCounts.entries()).map(([name, count], idx) => {
            let category: ClassItem['category'] = 'REGULER';
            let gradeLevel = 'Kelas Reguler';
            if (name.startsWith('PAKET A')) { category = 'PAKET_A'; gradeLevel = 'Paket A (Setara SD)'; }
            else if (name.startsWith('PAKET B')) { category = 'PAKET_B'; gradeLevel = 'Paket B (Setara SMP)'; }
            else if (name.startsWith('PAKET C')) { category = 'PAKET_C'; gradeLevel = 'Paket C (Setara SMA)'; }
            else if (name.startsWith('KKA')) { category = 'KKA'; gradeLevel = 'Keterampilan / KKA'; }

            return {
              id: `cls-${idx}`,
              name,
              grade_level: gradeLevel,
              homeroom_teacher: 'Belum ditentukan',
              student_count: count,
              room: 'Gedung Utama',
              category,
            };
          });

          const orderRank = (name: string) => {
            if (name.startsWith('PAKET A')) return 10;
            if (name.startsWith('PAKET B')) return 20;
            if (name.startsWith('PAKET C')) return 30;
            if (name.startsWith('KKA')) return 40;
            return 50;
          };

          fallbackClasses.sort((a, b) => {
            const rankA = orderRank(a.name);
            const rankB = orderRank(b.name);
            if (rankA !== rankB) return rankA - rankB;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });

          setClassesList(fallbackClasses);
        }
      } catch (e) {
        console.error('Error loading fallback classes:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: 'PAKET B (Setara SMP)',
    homeroom_teacher: 'Bpk. Hendra Wijaya, M.Pd',
    room: 'Gedung Utama',
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      grade_level: 'PAKET B (Setara SMP)',
      homeroom_teacher: 'Bpk. Hendra Wijaya, M.Pd',
      room: 'Gedung Utama',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditClass(c);
    setFormData({
      name: c.name,
      grade_level: c.grade_level,
      homeroom_teacher: c.homeroom_teacher,
      room: c.room,
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    let category: ClassItem['category'] = 'REGULER';
    if (formData.name.startsWith('PAKET A')) category = 'PAKET_A';
    else if (formData.name.startsWith('PAKET B')) category = 'PAKET_B';
    else if (formData.name.startsWith('PAKET C')) category = 'PAKET_C';
    else if (formData.name.startsWith('KKA')) category = 'KKA';

    const newClass: ClassItem = {
      id: String(Date.now()),
      name: formData.name,
      grade_level: formData.grade_level,
      homeroom_teacher: formData.homeroom_teacher,
      student_count: 0,
      room: formData.room,
      category,
    };

    setClassesList([newClass, ...classesList]);
    setShowAddModal(false);
    showToast(`✓ Ruang Kelas "${formData.name}" berhasil ditambahkan!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClass || !formData.name) return;

    setClassesList(classesList.map(c => c.id === editClass.id ? {
      ...c,
      name: formData.name,
      grade_level: formData.grade_level,
      homeroom_teacher: formData.homeroom_teacher,
      room: formData.room,
    } : c));

    setEditClass(null);
    showToast(`✓ Rekord Kelas "${formData.name}" berhasil diperbarui!`);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data kelas untuk diekspor!');
      return;
    }
    const exportData = filtered.map(c => ({
      'ID Kelas': c.id,
      'Nama Rombel': c.name,
      'Tingkat / Program': c.grade_level,
      'Wali Kelas': c.homeroom_teacher,
      'Jumlah Siswa': c.student_count,
      'Ruangan Kelas': c.room,
    }));
    const schoolName = typeof window !== 'undefined' ? (getTenantItem('dapodik_nama_sekolah') || 'Sekolah') : 'Sekolah';
    exportToExcel(exportData, `Data_Kelas_Rombel_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Data Kelas');
    showToast('📊 Berkas Excel (.xlsx) Data Kelas berhasil diunduh!');
  };

  const filtered = classesList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.homeroom_teacher.toLowerCase().includes(search.toLowerCase());
    let matchGrade = true;
    if (gradeFilter === 'PAKET_A') matchGrade = c.category === 'PAKET_A';
    else if (gradeFilter === 'PAKET_B') matchGrade = c.category === 'PAKET_B';
    else if (gradeFilter === 'PAKET_C') matchGrade = c.category === 'PAKET_C';
    else if (gradeFilter === 'KKA') matchGrade = c.category === 'KKA';
    else if (gradeFilter === 'REGULER') matchGrade = c.category === 'REGULER';
    return matchSearch && matchGrade;
  });

  // --- Client-Side Pagination (default 24 so all 21 items are visible at once!) ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 24;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length, gradeFilter, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getBadgeStyle = (category: ClassItem['category']) => {
    if (category === 'PAKET_B') return 'badge-info';
    if (category === 'PAKET_C') return 'badge-purple';
    if (category === 'PAKET_A') return 'badge-active';
    if (category === 'KKA') return 'badge-warning';
    return 'badge-info';
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Data Kelas &amp; Rombongan Belajar</h1>
            <span className="badge badge-info" style={{ fontWeight: 700 }}>{classesList.length} Rombel Terdaftar</span>
          </div>
          <p className={styles.subtitle}>Direktori seluruh kelas dan rombongan belajar di institusi Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Tambah Kelas Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" style={{ color: 'var(--text-muted)' }}>
            <circle cx="8.5" cy="8.5" r="5.5"/>
            <path d="M13 13l4 4"/>
          </svg>
          <input
            type="text"
            placeholder="Cari nama rombel (misal: B7, B8, C11, C12, dll) atau wali kelas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="input"
            style={{ width: '220px', height: '36px' }}
          >
            <option value="ALL">Semua Tingkat ({classesList.length} Rombel)</option>
            <option value="PAKET_B">Paket B (SMP - B7, B8, B9)</option>
            <option value="PAKET_C">Paket C (SMA - C10, C11, C12)</option>
            <option value="PAKET_A">Paket A (Setara SD)</option>
            <option value="KKA">Keterampilan (KKA C11 &amp; C12)</option>
            <option value="REGULER">Kelas Reguler SD</option>
          </select>

          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '0 0.6rem', height: '30px' }}
              title="Tampilan Grid"
            >
              ⊞ Grid
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '0 0.6rem', height: '30px' }}
              title="Tampilan Tabel"
            >
              ☰ Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '150px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tidak Ada Rombel yang Ditemukan</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Coba ubah kata kunci pencarian atau filter tingkat pendidikan.</p>
        </div>
      )}

      {/* View Mode: GRID */}
      {!isLoading && viewMode === 'grid' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {paginated.map(c => (
            <div
              key={c.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge ${getBadgeStyle(c.category)}`}>
                  {c.grade_level}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{c.room}</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  {c.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  Wali Kelas: <strong style={{ color: 'var(--text-secondary)' }}>{c.homeroom_teacher}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
                  👥 {c.student_count} Siswa
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(c)}>
                    ✏️ Edit
                  </button>
                  <Link href={`/dashboard/classes/${c.id}`} className="btn btn-secondary btn-sm">
                    Lihat →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Mode: TABLE */}
      {!isLoading && viewMode === 'table' && filtered.length > 0 && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Rombel / Kelas</th>
                <th>Tingkat</th>
                <th>Wali Kelas</th>
                <th>Ruangan</th>
                <th>Jumlah Siswa</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.name}</strong>
                  </td>
                  <td>
                    <span className={`badge ${getBadgeStyle(c.category)}`}>
                      {c.grade_level}
                    </span>
                  </td>
                  <td>{c.homeroom_teacher}</td>
                  <td>{c.room}</td>
                  <td>
                    <strong style={{ color: 'var(--accent)' }}>{c.student_count} Siswa</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(c)}>
                        ✏️ Edit
                      </button>
                      <Link href={`/dashboard/classes/${c.id}`} className="btn btn-secondary btn-sm">
                        Lihat →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Menampilkan <strong>{paginated.length}</strong> dari {filtered.length} total kelas
          </span>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ← Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                className={`btn btn-sm ${currentPage === num ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCurrentPage(num)}
                style={{ minWidth: '32px' }}
              >
                {num}
              </button>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      {/* ── Modal In-Page: Tambah Kelas Baru ── */}
      {showAddModal && (
        <div className="globalModalOverlay" onClick={() => setShowAddModal(false)}>
          <div className="globalModalCard" onClick={e => e.stopPropagation()}>
            <div className="globalModalHeader">
              <h2 className="globalModalTitle">+ Tambah Kelas (Rombel) Baru</h2>
              <button className="globalModalClose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="globalModalBody">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Rombongan Belajar / Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: PAKET B7, PAKET C11a, dll"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tingkat Pendidikan</label>
                    <select
                      value={formData.grade_level}
                      onChange={e => setFormData({ ...formData, grade_level: e.target.value })}
                      className="input"
                    >
                      <option value="Paket A (Setara SD)">Paket A (Setara SD)</option>
                      <option value="Paket B (Setara SMP)">Paket B (Setara SMP)</option>
                      <option value="Paket C (Setara SMA)">Paket C (Setara SMA)</option>
                      <option value="Keterampilan / KKA">Keterampilan / KKA</option>
                      <option value="Kelas Reguler">Kelas Reguler</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Lokasi Ruangan</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={e => setFormData({ ...formData, room: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Wali Kelas Pengampu</label>
                  <input
                    type="text"
                    value={formData.homeroom_teacher}
                    onChange={e => setFormData({ ...formData, homeroom_teacher: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="globalModalFooter">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Rombel Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal In-Page: Edit Kelas ── */}
      {editClass && (
        <div className="globalModalOverlay" onClick={() => setEditClass(null)}>
          <div className="globalModalCard" onClick={e => e.stopPropagation()}>
            <div className="globalModalHeader">
              <h2 className="globalModalTitle">✏️ Edit Data Kelas ({editClass.name})</h2>
              <button className="globalModalClose" onClick={() => setEditClass(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="globalModalBody">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Kelas *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tingkat Kelas</label>
                    <select
                      value={formData.grade_level}
                      onChange={e => setFormData({ ...formData, grade_level: e.target.value })}
                      className="input"
                    >
                      <option value="Paket A (Setara SD)">Paket A (Setara SD)</option>
                      <option value="Paket B (Setara SMP)">Paket B (Setara SMP)</option>
                      <option value="Paket C (Setara SMA)">Paket C (Setara SMA)</option>
                      <option value="Keterampilan / KKA">Keterampilan / KKA</option>
                      <option value="Kelas Reguler">Kelas Reguler</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Lokasi Ruangan</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={e => setFormData({ ...formData, room: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Wali Kelas Pengampu</label>
                  <input
                    type="text"
                    value={formData.homeroom_teacher}
                    onChange={e => setFormData({ ...formData, homeroom_teacher: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="globalModalFooter">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditClass(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Update Rekord Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
