'use client';
import { getTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './gradebook.module.css';
import { listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';
import { getApiUrl } from '@/lib/api';

type RawStudent = { id: string; full_name: string; nisn: string; class_name?: string };
type RawClass = { id: string; name: string };
type RawSubject = { id: string; name: string };

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
  const [studentsList, setStudentsList] = useState<RawStudent[]>([]);
  const [classesList, setClassesList] = useState<RawClass[]>([]);
  const [subjectsList, setSubjectsList] = useState<RawSubject[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [schoolName] = useState(() => (typeof window !== 'undefined' ? getTenantItem('dapodik_nama_sekolah') || 'Sekolah' : 'Sekolah'));

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchGradesForSubject = async (
    subjectName: string,
    students: RawStudent[],
    subjects: RawSubject[]
  ) => {
    if (!students || students.length === 0) return;
    setIsLoadingGrades(true);
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
    const matchedSubject = subjects.find(s => s.name === subjectName);
    const subjectId = matchedSubject?.id;

    const savedScoresMap: Record<string, { formatif1?: number; formatif2?: number; pts?: number; pas?: number }> = {};

    try {
      const qParams = new URLSearchParams();
      if (subjectId) qParams.append('subject_id', subjectId);
      const url = getApiUrl(`/api/v1/learning/assessment/gradebook?${qParams.toString()}`);
      
      const gbRes = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).then(r => r.ok ? r.json() : null);

      if (gbRes?.data && Array.isArray(gbRes.data)) {
        gbRes.data.forEach((e: { student_id: string; raw_score?: string; component_name?: string }) => {
          if (!savedScoresMap[e.student_id]) {
            savedScoresMap[e.student_id] = {};
          }
          const raw = parseFloat(e.raw_score || '0') || 0;
          if (e.component_name === 'Formatif 1') savedScoresMap[e.student_id].formatif1 = raw;
          else if (e.component_name === 'Formatif 2') savedScoresMap[e.student_id].formatif2 = raw;
          else if (e.component_name?.includes('PTS')) savedScoresMap[e.student_id].pts = raw;
          else if (e.component_name?.includes('PAS')) savedScoresMap[e.student_id].pas = raw;
        });
      }
    } catch (e) {
      console.warn('Backend gradebook fetch error:', e);
    }

    const mappedEntries: GradebookEntry[] = students.map((s) => {
      const saved = savedScoresMap[s.id];
      
      const f1 = saved ? (saved.formatif1 ?? 0) : 0;
      const f2 = saved ? (saved.formatif2 ?? 0) : 0;
      const p = saved ? (saved.pts ?? 0) : 0;
      const pasVal = saved ? (saved.pas ?? 0) : 0;

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
    setIsLoadingGrades(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [studentRes, classRes, subjectRes] = await Promise.all([
          listStudents({ query: { page_size: 500 } }).catch(() => null),
          listClasses({ query: { page_size: 100 } }).catch(() => null),
          fetch(getApiUrl('/api/v1/academic/subjects'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        let loadedClasses: RawClass[] = [];
        let loadedSubjects: RawSubject[] = [];
        let loadedStudents: RawStudent[] = [];

        if (classRes?.data?.data) {
          loadedClasses = classRes.data.data as RawClass[];
          setClassesList(loadedClasses);
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          loadedSubjects = subjectRes.data as RawSubject[];
          setSubjectsList(loadedSubjects);
        }

        if (studentRes?.data?.data) {
          loadedStudents = studentRes.data.data as RawStudent[];
          setStudentsList(loadedStudents);
        }

        const initialSub = loadedSubjects.length > 0 ? loadedSubjects[0].name : 'Pendidikan Agama Islam dan Budi Pekerti';
        if (loadedSubjects.length > 0) {
          setSelectedSubject(initialSub);
        }

        if (loadedStudents.length > 0) {
          await fetchGradesForSubject(initialSub, loadedStudents, loadedSubjects);
        }
      } catch (err) {
        console.error('Error loading gradebook data:', err);
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

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;

    const matchedSubject = subjectsList.find(s => s.name === selectedSubject);
    const subjectId = matchedSubject?.id;
    const matchedClass = classesList.find(c => c.name === selectedClass);
    const classId = matchedClass?.id;

    const payloadGrades = gradebook.map(g => ({
      student_id: g.studentId,
      formatif1: g.formatif1,
      formatif2: g.formatif2,
      pts: g.pts,
      pas: g.pas,
      final_score: g.totalScore,
      letter_grade: g.grade,
      passed: g.statusKkm === 'Tuntas KKM',
      status: 'published',
    }));

    try {
      const res = await fetch(getApiUrl('/api/v1/learning/assessment/gradebook/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          class_id: classId || undefined,
          subject_id: subjectId || undefined,
          subject_name: selectedSubject,
          grades: payloadGrades,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Server error (HTTP ${res.status})`);
      }

      showToast(`Nilai [${selectedSubject}] berhasil disimpan & disinkronkan ke Database!`);
      // Re-fetch to ensure complete sync
      await fetchGradesForSubject(selectedSubject, studentsList, subjectsList);
    } catch (err: unknown) {
      console.error('Failed to sync grades to backend:', err);
      const message = err instanceof Error ? err.message : 'Gagal menyimpan nilai ke database';
      showToast(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubjectChange = async (newSubject: string) => {
    setSelectedSubject(newSubject);
    await fetchGradesForSubject(newSubject, studentsList, subjectsList);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('Tidak ada data nilai untuk diekspor!');
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
    showToast('Berkas Excel (.xlsx) Buku Nilai Rapor berhasil diunduh.');
  };

  type GradebookSortField = 'name' | 'className' | 'formatif1' | 'formatif2' | 'pts' | 'pas' | 'totalScore' | 'grade';
  const [sortField, setSortField] = useState<GradebookSortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSetSort = (field: GradebookSortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = gradebook.filter(g => {
    const matchClass = selectedClass === 'ALL' || g.className === selectedClass;
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.nisn.includes(search);
    return matchClass && matchSearch;
  });

  const sortedGradebook = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'className') {
        comparison = (a.className || '').localeCompare(b.className || '');
      } else if (sortField === 'formatif1') {
        comparison = (a.formatif1 || 0) - (b.formatif1 || 0);
      } else if (sortField === 'formatif2') {
        comparison = (a.formatif2 || 0) - (b.formatif2 || 0);
      } else if (sortField === 'pts') {
        comparison = (a.pts || 0) - (b.pts || 0);
      } else if (sortField === 'pas') {
        comparison = (a.pas || 0) - (b.pas || 0);
      } else if (sortField === 'totalScore') {
        comparison = (a.totalScore || 0) - (b.totalScore || 0);
      } else if (sortField === 'grade') {
        comparison = (a.grade || '').localeCompare(b.grade || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  const totalCount = filtered.length;
  const avgTotal = totalCount > 0 ? (filtered.reduce((acc, curr) => acc + curr.totalScore, 0) / totalCount).toFixed(1) : '0';
  const passedCount = filtered.filter(g => g.statusKkm === 'Tuntas KKM').length;

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortedGradebook.length]);

  const totalPages = Math.ceil(sortedGradebook.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sortedGradebook.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveChanges} disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
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
            placeholder="Cari NISN atau nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>

        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input" style={{ width: '160px' }}>
          <option value="ALL">Semua Rombel</option>
          {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select value={selectedSubject} onChange={(e) => handleSubjectChange(e.target.value)} className="input" style={{ width: '220px' }} disabled={isLoadingGrades || isSaving}>
          {subjectsList.map((s: RawSubject) => (
            <option key={s.id || s.name} value={s.name}>{s.name}</option>
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
            <div style={{ width: '40px', height: '40px', margin: '0 auto 0.5rem', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
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
                <th className="thSortable" onClick={() => handleSetSort('name')}>
                  <div className="thSortContent">
                    <span>NISN &amp; NAMA SISWA (DAPODIK REAL)</span>
                    <span className="sortArrows">{sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('className')}>
                  <div className="thSortContent">
                    <span>ROMBEL</span>
                    <span className="sortArrows">{sortField === 'className' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" style={{ textAlign: 'center' }} onClick={() => handleSetSort('formatif1')}>
                  <div className="thSortContent" style={{ justifyContent: 'center' }}>
                    <span>FORMATIF 1 (20%)</span>
                    <span className="sortArrows">{sortField === 'formatif1' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" style={{ textAlign: 'center' }} onClick={() => handleSetSort('formatif2')}>
                  <div className="thSortContent" style={{ justifyContent: 'center' }}>
                    <span>FORMATIF 2 (20%)</span>
                    <span className="sortArrows">{sortField === 'formatif2' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" style={{ textAlign: 'center' }} onClick={() => handleSetSort('pts')}>
                  <div className="thSortContent" style={{ justifyContent: 'center' }}>
                    <span>PTS (30%)</span>
                    <span className="sortArrows">{sortField === 'pts' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" style={{ textAlign: 'center' }} onClick={() => handleSetSort('pas')}>
                  <div className="thSortContent" style={{ justifyContent: 'center' }}>
                    <span>PAS (30%)</span>
                    <span className="sortArrows">{sortField === 'pas' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" style={{ textAlign: 'center' }} onClick={() => handleSetSort('totalScore')}>
                  <div className="thSortContent" style={{ justifyContent: 'center' }}>
                    <span>NILAI AKHIR</span>
                    <span className="sortArrows">{sortField === 'totalScore' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('grade')}>
                  <div className="thSortContent">
                    <span>PREDIKAT &amp; STATUS</span>
                    <span className="sortArrows">{sortField === 'grade' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
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
              Menampilkan {(safePage - 1) * itemsPerPage + 1} - {Math.min(safePage * itemsPerPage, filtered.length)} dari {filtered.length} siswa
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              >
                &laquo; Prev
              </button>
              <span style={{ padding: '0.2rem 0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                Halaman {safePage} dari {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={safePage === totalPages}
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
