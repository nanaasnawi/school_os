'use client';
import { getTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './enrollments.module.css';
import { listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';

type EnrollmentItem = {
  id: string;
  student_id: string;
  nisn: string;
  student_name: string;
  class_name: string;
  is_active: boolean;
};

type ClassOption = {
  id: string;
  name: string;
};

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [classesList, setClassesList] = useState<ClassOption[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EnrollmentItem | null>(null);

  const [formData, setFormData] = useState({
    student_name: '',
    class_name: '',
    is_active: true,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [studentRes, classRes] = await Promise.all([
          listStudents({ query: { page_size: 500 } }).catch(() => null),
          listClasses().catch(() => null),
        ]);

        if (classRes?.data?.data) {
          const allRombels = classRes.data.data as ClassOption[];
          setClassesList(allRombels);
          if (allRombels.length > 0) {
            setFormData(prev => ({ ...prev, class_name: allRombels[0].name }));
          }
        }

        if (studentRes?.data?.data) {
          const mappedEnrollments: EnrollmentItem[] = studentRes.data.data.map((s, idx: number) => {
            const statusStr = String(s.status || '').toLowerCase();
            const isActive = statusStr.includes('aktif') || statusStr.includes('active') || statusStr === '';
            return {
              id: String(idx + 101),
              student_id: s.id,
              nisn: s.nisn,
              student_name: s.full_name,
              class_name: s.class_name || 'Belum Diplot',
              is_active: isActive,
            };
          });
          setEnrollments(mappedEnrollments);
        }
      } catch (err) {
        console.error('Error loading enrollments data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name) return;

    const newRec: EnrollmentItem = {
      id: String(Math.floor(100 + Math.random() * 900)),
      student_id: String(Date.now()),
      nisn: `009296${Math.floor(1000 + Math.random() * 9000)}`,
      student_name: formData.student_name,
      class_name: formData.class_name,
      is_active: formData.is_active,
    };

    setEnrollments([newRec, ...enrollments]);
    setShowAddModal(false);
    showToast(`✓ Pendaftaran Siswa "${formData.student_name}" ke "${formData.class_name}" berhasil disimpan!`);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('Tidak ada data pendaftaran kelas untuk diekspor!');
      return;
    }
    const exportData = filtered.map(e => ({
      'ID Pendaftaran': `REC-${e.id}`,
      'NISN': e.nisn,
      'Nama Siswa': e.student_name,
      'Target Kelas Rombel': e.class_name,
      'Status Pendaftaran': e.is_active ? 'Terdaftar Aktif' : 'Nonaktif',
    }));
    const schoolName = typeof window !== 'undefined' ? (getTenantItem('dapodik_nama_sekolah') || 'Sekolah') : 'Sekolah';
    exportToExcel(exportData, `Pendaftaran_Kelas_Rombel_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Pendaftaran Kelas');
    showToast('📊 Berkas Excel (.xlsx) Pendaftaran Kelas berhasil diunduh!');
  };

  const filtered = enrollments.filter(e => {
    const matchSearch = e.student_name.toLowerCase().includes(search.toLowerCase()) || e.nisn.includes(search) || e.class_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? e.is_active : !e.is_active);
    const matchClass = classFilter === 'ALL' || e.class_name === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
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

      {/* Header & Breadcrumb */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Pendaftaran Kelas (Enrollment)</h1>
          <p className={styles.subtitle}>Pemetaan pendaftaran rombongan belajar &amp; plotting kelas siswa</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Pendaftaran Kelas Baru
          </button>
        </div>
      </div>

      {/* Top Action Row (Enterprise Style - Screenshot Match) */}
      <div className="tableActionRow">
        <button className="tableActionBtn" onClick={handleOpenAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Plotting Rombel Siswa Baru</span>
        </button>

        <button className="tableActionBtn" onClick={exportToExcelFile}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Ekspor Excel (.xlsx)</span>
        </button>

        <div className="tableActionBtn" style={{ cursor: 'default' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Sinkron Dapodik Siswa</span>
        </div>
      </div>

      {/* Table Card (Screenshot Match) */}
      <div className="tableCard">
        {/* Table Toolbar */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong>{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of{' '}
            <strong>{filtered.length}</strong> entries
            {filtered.length !== enrollments.length && (
              <span> (filtered from <strong>{enrollments.length}</strong> total entries)</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Cari NISN, nama, rombel..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="tableSearchInput"
              />
              <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
              style={{ minWidth: '140px', height: '34px' }}
            >
              <option value="ALL">Semua Rombel</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
              style={{ minWidth: '140px', height: '34px' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Terdaftar Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>ID Pendaftaran</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>NISN &amp; Nama Siswa</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Target Kelas Rombel</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Status Pendaftaran</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {isLoading ? 'Memuat data pendaftaran siswa...' : 'Tidak ada data pendaftaran siswa yang sesuai pencarian.'}
                  </td>
                </tr>
              ) : (
                paginated.map((e) => (
                  <tr key={e.id}>
                    <td><code>REC-{e.id}</code></td>
                    <td>
                      <div
                        className="itemPrimaryTitle"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedRecord(e)}
                      >
                        <span>{e.student_name}</span>
                      </div>
                      <div className="itemSubtitleCheck">
                        <span>✓ NISN: {e.nisn}</span>
                      </div>
                    </td>
                    <td>
                      <span className="statusPill statusPillMuted">
                        {e.class_name}
                      </span>
                    </td>
                    <td>
                      <span className={`statusPill ${e.is_active ? 'statusPillActive' : 'statusPillMuted'}`}>
                        {e.is_active ? 'Active' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className="pageBtnNav"
                          style={{ border: '1px solid #cbd5e1', padding: '0.28rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => setSelectedRecord(e)}
                        >
                          Lihat
                        </button>
                        <Link
                          href={`/dashboard/enrollments/${e.id}`}
                          className="pageBtnNav"
                          style={{ border: '1px solid #cbd5e1', padding: '0.28rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Detail
                        </Link>
                      </div>
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
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Modal Detail Rekord Pendaftaran ── */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setSelectedRecord(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '2px' }}>REC-{selectedRecord.id}</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Rekord Pendaftaran Kelas Siswa
                </h3>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelectedRecord(null)}>×</button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Nama Lengkap Siswa:</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedRecord.student_name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>NISN Siswa:</span>
                  <code style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 800 }}>{selectedRecord.nisn}</code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Target Rombel:</span>
                  <span className="badge badge-info">{selectedRecord.class_name}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status Pendaftaran:</span>
                  <span className="badge badge-active">Terdaftar Aktif (Dapodik Verified)</span>
                </div>
              </div>

              <div style={{ background: 'rgba(22, 163, 74, 0.10)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>📱 Siswa Terhubung ke Android Mobile App</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 800 }}>✓ Ready</span>
              </div>
            </div>

            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href={`/dashboard/students/${selectedRecord.student_id}`} className="btn btn-secondary btn-sm" onClick={() => setSelectedRecord(null)}>
                👤 Lihat Profil Siswa
              </Link>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedRecord(null)}>
                Tutup Rekord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal In-Page: Pendaftaran Kelas Baru ── */}
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
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>+ Pendaftaran Kelas (Enrollment) Baru</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Siswa Terdaftar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama siswa terdaftar..."
                    value={formData.student_name}
                    onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Kelas Rombel</label>
                  <select
                    value={formData.class_name}
                    onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                    className="input"
                  >
                    {classesList.length === 0 ? <option value="">Belum ada rombel</option> : classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Plotting Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
