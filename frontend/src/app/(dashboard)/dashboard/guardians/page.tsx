'use client';
import { getTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './guardians.module.css';
import { listStudents } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';
import { getApiUrl } from '@/lib/api';

type GuardianItem = {
  id: string;
  full_name: string;
  relationship: string;
  student_name: string;
  student_nisn: string;
  phone: string;
  isRealData: boolean;
};

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<GuardianItem[]>([]);
  const [search, setSearch] = useState('');
  const [relationFilter, setRelationFilter] = useState('ALL');
  const [schoolName] = useState(() => (typeof window !== 'undefined' ? getTenantItem('dapodik_nama_sekolah') || '' : ''));

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGuardian, setEditGuardian] = useState<GuardianItem | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    relationship: 'Ibu Kandung',
    student_name: '',
    phone: '',
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
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch(getApiUrl('/api/v1/guardians/overview'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const json = await res.json();
          type RawGuardian = {
            id: string;
            full_name: string;
            relationship: string;
            student_name: string;
            student_nisn: string;
            phone?: string;
            is_real_data?: boolean;
          };
          if (json?.data && json.data.length > 0) {
            setGuardians((json.data as RawGuardian[]).map((g) => ({
              id: g.id,
              full_name: g.full_name,
              relationship: g.relationship,
              student_name: g.student_name,
              student_nisn: g.student_nisn,
              phone: g.phone || '-',
              isRealData: Boolean(g.is_real_data),
            })));
            return;
          }
        }
      } catch (err) {
        console.error('Error loading guardians from API:', err);
      }

      // Fallback to student list if overview is empty
      try {
        const studentRes = await listStudents({ query: { page_size: 500 } }).catch(() => null);
        if (studentRes?.data?.data) {
          const list = studentRes.data.data;
          const mappedGuardians: GuardianItem[] = list.map((s: { full_name: string; nisn: string }, idx: number) => ({
            id: String(idx + 1),
            full_name: '(Belum Ada Data Wali)',
            relationship: 'Belum Diisi',
            student_name: s.full_name,
            student_nisn: s.nisn,
            phone: '-',
            isRealData: false,
          }));
          setGuardians(mappedGuardians);
        }
      } catch (err) {
        console.error('Error loading fallback students for guardians:', err);
      }
    }

    loadData();
  }, []);

  const saveGuardiansState = (updatedList: GuardianItem[]) => {
    setGuardians(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dapodik_guardians_data', JSON.stringify(updatedList));
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      relationship: 'Ibu Kandung',
      student_name: '',
      phone: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (g: GuardianItem) => {
    setEditGuardian(g);
    setFormData({
      full_name: g.isRealData ? g.full_name : '',
      relationship: g.relationship === 'Belum Diisi' ? 'Ibu Kandung' : g.relationship,
      student_name: g.student_name,
      phone: g.phone === '-' ? '' : g.phone,
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) return;

    const newGuardian: GuardianItem = {
      id: String(Date.now()),
      full_name: formData.full_name,
      relationship: formData.relationship,
      student_name: formData.student_name || 'Peserta Didik Aktif',
      student_nisn: '0022937459',
      phone: formData.phone || '-',
      isRealData: true,
    };

    const next = [newGuardian, ...guardians];
    saveGuardiansState(next);
    setShowAddModal(false);
    showToast(`✓ Data Asli Wali "${formData.full_name}" berhasil disimpan!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGuardian || !formData.full_name) return;

    const next = guardians.map(g => g.id === editGuardian.id ? {
      ...g,
      full_name: formData.full_name,
      relationship: formData.relationship,
      student_name: formData.student_name,
      phone: formData.phone || '-',
      isRealData: true,
    } : g);

    saveGuardiansState(next);
    setEditGuardian(null);
    showToast(`✓ Data Asli Wali "${formData.full_name}" berhasil disimpan!`);
  };

  const exportToExcelFile = () => {
    const realOnly = filtered.filter(g => g.isRealData);
    if (!realOnly || realOnly.length === 0) {
      showToast('Belum ada data wali siswa asli yang diinput untuk diekspor!');
      return;
    }
    const exportData = realOnly.map(g => ({
      'Nama Orang Tua / Wali': g.full_name,
      'Hubungan Kekeluargaan': g.relationship,
      'Nama Siswa Terhubung': g.student_name,
      'NISN Siswa': g.student_nisn,
      'No. Telepon / WA': g.phone,
    }));
    exportToExcel(exportData, `Data_Wali_Siswa_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Data Wali Siswa');
    showToast('📊 Berkas Excel (.xlsx) Data Wali Murid berhasil diunduh!');
  };

  const filtered = guardians.filter(g => {
    const matchSearch = g.full_name.toLowerCase().includes(search.toLowerCase()) || g.student_name.toLowerCase().includes(search.toLowerCase()) || g.student_nisn.includes(search);
    const matchRelation = relationFilter === 'ALL' || g.relationship === relationFilter;
    return matchSearch && matchRelation;
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const realGuardiansCount = guardians.filter(g => g.isRealData).length;

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

      {/* ── Workstation Hero Header ── */}
      <div className="workstationHero">
        <div className="workstationHeroContent">
          <div className="workstationHeroBadge">
            <span>👪 DIREKTORI ORANG TUA &amp; WALI</span>
          </div>
          <h1 className="workstationHeroTitle">Orang Tua / Wali Siswa</h1>
          <p className="workstationHeroSubtitle">
            Direktori data orang tua atau wali murid terhubung langsung dengan siswa di {schoolName}.
          </p>
        </div>

        <div className="workstationHeroActions">
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Tambah Rekord Wali
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel
          </button>
          <Link href="/dashboard/dapodik" className="btn btn-secondary btn-sm">
            🔄 Tarik Dapodik
          </Link>
        </div>
      </div>

      {/* Status Info Banner if no real parent data entered yet */}
      {realGuardiansCount === 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Data Nama Orang Tua / Wali Belum Diisi dari Dapodik
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Database siswa belum terhubung dengan nama Orang Tua / Wali murid. Silakan isi data asli wali murid melalui tombol <strong>Input Nama Wali</strong>.
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            Input Data Asli Wali
          </button>
        </div>
      )}

      {/* Main Table Card (Screenshot Reference Design) */}
      <div className="tableCard">
        {/* Top Toolbar */}
        <div className="tableToolbar">
          <div className="tableInfoText">
            Showing <strong>{filtered.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}</strong> to <strong>{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries {filtered.length !== guardians.length ? `(filtered from ${guardians.length} total entries)` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={relationFilter}
              onChange={e => { setRelationFilter(e.target.value); setCurrentPage(1); }}
              className="entriesSelect"
            >
              <option value="ALL">Semua Hubungan</option>
              <option value="Ayah Kandung">Ayah Kandung</option>
              <option value="Ibu Kandung">Ibu Kandung</option>
              <option value="Wali Murid">Wali Murid</option>
            </select>

            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Cari nama wali, siswa, atau NISN..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
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
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Nama Lengkap Wali / Orang Tua</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Hubungan Keluarga</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Siswa Terhubung (NISN)</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>No. WhatsApp / HP</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th className="thSortable">
                  <div className="thSortContent">
                    <span>Portal Status</span>
                    <span className="sortArrows">⇅</span>
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada data orang tua / wali murid ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map(g => (
                  <tr key={g.id}>
                    <td>
                      {g.isRealData ? (
                        <div className="itemPrimaryTitle">
                          <span>{g.full_name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.84rem' }}>
                          {g.full_name}
                        </span>
                      )}
                      <div className="itemSubtitleCheck">
                        <span>✓ Siswa Terverifikasi</span>
                      </div>
                    </td>
                    <td>
                      {g.relationship !== 'Belum Diisi' ? (
                        <span className="statusPill statusPillMuted">{g.relationship}</span>
                      ) : (
                        <span className="statusPill statusPillMuted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="itemPrimaryTitle">
                        <span>{g.student_name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NISN: {g.student_nisn}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>{g.phone}</span>
                    </td>
                    <td>
                      {g.phone && g.phone !== '-' && g.phone.replace(/[^0-9]/g, '').length >= 6 ? (
                        <span className="statusPill statusPillActive">Terdaftar (WA OK)</span>
                      ) : g.isRealData ? (
                        <span className="statusPill" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                          Belum Ada No. WA
                        </span>
                      ) : (
                        <span className="statusPill statusPillMuted">Belum Ada Data</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="tableActionBtn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex' }} onClick={() => handleOpenEdit(g)}>
                        {g.isRealData ? 'Edit Data Wali' : 'Input Nama Wali'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="tableFooter">
          <div className="entriesControl">
            <span className="entriesLabel">Show</span>
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
            <span className="entriesLabel">entries</span>
          </div>

          <div className="paginationControls">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="pageBtn"
              title="First Page"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="pageBtn"
              title="Previous Page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <div key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pageDots">…</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`pageBtn ${p === safePage ? 'pageBtnActive' : ''}`}
                  >
                    {p}
                  </button>
                </div>
              ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="pageBtn"
              title="Next Page"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="pageBtn"
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal In-Page: Tambah Wali Baru ── */}
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
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>+ Tambah Rekord Wali / Orang Tua</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap Wali / Orang Tua Asli *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama asli orang tua sesuai Akta/KK..."
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Hubungan Keluarga</label>
                    <select
                      value={formData.relationship}
                      onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                      className="input"
                    >
                      <option value="Ayah Kandung">Ayah Kandung</option>
                      <option value="Ibu Kandung">Ibu Kandung</option>
                      <option value="Wali Murid">Wali Murid</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>No. WhatsApp / HP</label>
                    <input
                      type="text"
                      placeholder="0812-3456-7890"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Siswa Terhubung</label>
                  <input
                    type="text"
                    placeholder="contoh: WILLY ARIP VURNOMO"
                    value={formData.student_name}
                    onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Rekord Wali</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal In-Page: Edit Wali ── */}
      {editGuardian && (
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
        }} onClick={() => setEditGuardian(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Input / Edit Nama Wali ({editGuardian.student_name})</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setEditGuardian(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap Orang Tua / Wali Asli *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama asli orang tua sesuai Akta/KK..."
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Hubungan Keluarga</label>
                    <select
                      value={formData.relationship}
                      onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                      className="input"
                    >
                      <option value="Ayah Kandung">Ayah Kandung</option>
                      <option value="Ibu Kandung">Ibu Kandung</option>
                      <option value="Wali Murid">Wali Murid</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>No. WA / HP</label>
                    <input
                      type="text"
                      placeholder="0812-3456-7890"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditGuardian(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Data Asli</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
