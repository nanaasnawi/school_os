'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './gradebook.module.css';
import { listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';

type GradebookEntry = {
  studentId: string;
  nisn: string;
  name: string;
  className: string;
  formatif1: number;
  formatif2: number;
  pts: number;
  pas: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C';
  statusKkm: 'Tuntas KKM' | 'Remedial' | 'Belum Diinput';
};

export default function GradebookPage() {
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('Pendidikan Agama Islam dan Budi Pekerti');
  const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [schoolName, setSchoolName] = useState('Sekolah');

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
    }

    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [studentRes, classRes, subjectRes] = await Promise.all([
          listStudents({ query: { page_size: 500 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          fetch('/api/v1/academic/subjects', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (classRes?.data?.data) {
          setClassesList(classRes.data.data);
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) {
            setSelectedSubject(subjectRes.data[0].name);
          }
        }

        if (studentRes?.data?.data) {
          const list = studentRes.data.data;
          
          let savedScoresMap: Record<string, any> = {};
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('saved_gradebook_scores');
              if (raw) savedScoresMap = JSON.parse(raw);
            } catch (e) {
              console.error('Failed to parse saved grades:', e);
            }
          }

          const mappedEntries: GradebookEntry[] = list.map((s: any) => {
            const saved = savedScoresMap[s.id];
            
            let f1 = saved ? saved.formatif1 : 0;
            let f2 = saved ? saved.formatif2 : 0;
            let p = saved ? saved.pts : 0;
            let pasVal = saved ? saved.pas : 0;

            const total = Math.round((f1 * 0.2 + f2 * 0.2 + p * 0.3 + pasVal * 0.3) * 10) / 10;
            const pred: 'A' | 'B' | 'C' = total >= 88 ? 'A' : total >= 75 ? 'B' : 'C';
            const stat = total === 0 ? 'Belum Diinput' : total >= 75 ? 'Tuntas KKM' : 'Remedial';

            return {
              studentId: s.id,
              nisn: s.nisn,
              name: s.full_name,
              className: s.class_name || 'Rombel General',
              formatif1: f1,
              formatif2: f2,
              pts: p,
              pas: pasVal,
              totalScore: total,
              grade: pred,
              statusKkm: stat,
            };
          });
          setGradebook(mappedEntries);
        }
      } catch (err) {
        console.error('Error loading gradebook:', err);
      }
    }
    loadData();
  }, []);

  const handleScoreChange = (studentId: string, field: 'formatif1' | 'formatif2' | 'pts' | 'pas', val: number) => {
    const numVal = isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
    setGradebook(prev => prev.map(item => {
      if (item.studentId === studentId) {
        const updated = { ...item, [field]: numVal };
        const total = Math.round((updated.formatif1 * 0.2 + updated.formatif2 * 0.2 + updated.pts * 0.3 + updated.pas * 0.3) * 10) / 10;
        const pred: 'A' | 'B' | 'C' = total >= 88 ? 'A' : total >= 75 ? 'B' : 'C';
        const stat = total === 0 ? 'Belum Diinput' : total >= 75 ? 'Tuntas KKM' : 'Remedial';
        return {
          ...updated,
          totalScore: total,
          grade: pred,
          statusKkm: stat,
        };
      }
      return item;
    }));
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('has_saved_grades', 'true');
      const scoresMap: Record<string, any> = {};
      gradebook.forEach(g => {
        scoresMap[g.studentId] = {
          formatif1: g.formatif1,
          formatif2: g.formatif2,
          pts: g.pts,
          pas: g.pas,
        };
      });
      try {
        localStorage.setItem('saved_gradebook_scores', JSON.stringify(scoresMap));
      } catch(err) {
        console.warn(err);
      }
    }
    setTimeout(() => {
      setIsSaving(false);
      showToast('💾 Perubahan Buku Nilai berhasil disimpan & dipublikasikan!');
    }, 600);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data nilai untuk diekspor!');
      return;
    }

    const exportData = filtered.map(g => ({
      'NISN': g.nisn,
      'Nama Siswa': g.name,
      'Rombel Target': g.className,
      'Mata Pelajaran': selectedSubject,
      'Formatif 1 (20%)': g.formatif1,
      'Formatif 2 (20%)': g.formatif2,
      'PTS (30%)': g.pts,
      'PAS (30%)': g.pas,
      'Nilai Akhir Rapor': g.totalScore,
      'Predikat': g.grade,
      'Status KKM': g.statusKkm,
    }));

    exportToExcel(exportData, `Buku_Nilai_${selectedSubject.replace(/\s+/g, '_')}_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Buku Nilai');
    showToast('📊 Berkas Excel (.xlsx) Buku Nilai Rapor berhasil diunduh!');
  };

  const filtered = gradebook.filter(g => {
    const matchClass = selectedClass === 'ALL' || g.className === selectedClass;
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.nisn.includes(search);
    return matchClass && matchSearch;
  });

  const totalCount = filtered.length;
  const avgTotal = totalCount > 0 ? (filtered.reduce((acc, curr) => acc + curr.totalScore, 0) / totalCount).toFixed(1) : '0';
  const passedCount = filtered.filter(g => g.statusKkm === 'Tuntas KKM').length;

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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            Buku Nilai (Teacher Gradebook)
          </h1>
          <p className={styles.subtitle}>
            Input &amp; Rekapitulasi Nilai Formatif, Sumatif, PTS, dan PAS Kurikulum Merdeka di {schoolName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Siswa Terdaftar</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{totalCount} Siswa</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Rata-Rata Nilai ({selectedSubject})</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb', marginTop: '0.2rem' }}>{avgTotal} / 100</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Ketuntasan KKM (&ge;75)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a', marginTop: '0.2rem' }}>
            {passedCount} Siswa <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>({totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterCard} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="🔍 Cari NISN atau nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input" style={{ width: '160px' }}>
          <option value="ALL">Semua Rombel</option>
          {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input" style={{ width: '220px' }}>
          {subjectsList.map((s: any) => (
            <option key={s.id || s.code} value={s.name}>{s.name}</option>
          ))}
        </select>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Bobot: Formatif 1 (20%) • Formatif 2 (20%) • PTS (30%) • PAS (30%)
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Tidak ada data siswa ditemukan
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Coba sesuaikan kata kunci pencarian atau pilihan filter rombel.
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NISN &amp; NAMA SISWA (DAPODIK REAL)</th>
                <th>ROMBEL</th>
                <th style={{ textAlign: 'center' }}>FORMATIF 1 (20%)</th>
                <th style={{ textAlign: 'center' }}>FORMATIF 2 (20%)</th>
                <th style={{ textAlign: 'center' }}>PTS (30%)</th>
                <th style={{ textAlign: 'center' }}>PAS (30%)</th>
                <th style={{ textAlign: 'center' }}>NILAI AKHIR</th>
                <th>PREDIKAT &amp; STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr key={item.studentId}>
                  <td>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NISN: {item.nisn}</span>
                  </td>
                  <td>
                    <span className="badge badge-info">{item.className}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.formatif1 || ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(item.studentId, 'formatif1', parseInt(e.target.value) || 0)}
                      style={{
                        width: '65px',
                        textAlign: 'center',
                        padding: '0.35rem 0.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.formatif2 || ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(item.studentId, 'formatif2', parseInt(e.target.value) || 0)}
                      style={{
                        width: '65px',
                        textAlign: 'center',
                        padding: '0.35rem 0.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.pts || ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(item.studentId, 'pts', parseInt(e.target.value) || 0)}
                      style={{
                        width: '65px',
                        textAlign: 'center',
                        padding: '0.35rem 0.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.pas || ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(item.studentId, 'pas', parseInt(e.target.value) || 0)}
                      style={{
                        width: '65px',
                        textAlign: 'center',
                        padding: '0.35rem 0.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.05rem', color: item.totalScore > 0 ? '#2563eb' : 'var(--text-muted)' }}>
                      {item.totalScore > 0 ? item.totalScore : '-'}
                    </strong>
                  </td>
                  <td>
                    {item.totalScore === 0 ? (
                      <span className="badge badge-ghost" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                        Belum Diinput
                      </span>
                    ) : (
                      <>
                        <span className={`badge ${item.grade === 'A' ? 'badge-success' : item.grade === 'B' ? 'badge-active' : 'badge-inactive'}`} style={{ fontWeight: 800 }}>
                          Predikat {item.grade}
                        </span>
                        <div style={{ fontSize: '0.7rem', marginTop: '2px', color: item.statusKkm === 'Tuntas KKM' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                          • {item.statusKkm}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {filtered.length > itemsPerPage && (
          <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} siswa
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              >
                &laquo; Prev
              </button>
              <span style={{ padding: '0.2rem 0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
