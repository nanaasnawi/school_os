'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './gradebook.module.css';
import { getTenantItem } from '@/lib/tenant-storage';
import { listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';
import { getApiUrl } from '@/lib/api';
import {
  BookOpen,
  Download,
  Save,
  Search,
  SlidersHorizontal,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

type GradebookSortField = 'name' | 'className' | 'formatif1' | 'formatif2' | 'pts' | 'pas' | 'totalScore' | 'grade';

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

  const renderSortIcon = (field: GradebookSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className={styles.sortIcon} />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={11} color="var(--accent, #0284c7)" />
    ) : (
      <ArrowDown size={11} color="var(--accent, #0284c7)" />
    );
  };

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: '#10b981',
          color: '#ffffff',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
          fontWeight: 600,
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <BookOpen size={18} />
          </div>
          <div className={styles.headerTextGroup}>
            <h1 className={styles.headerTitle}>
              Buku Nilai (Teacher Gradebook)
            </h1>
            <p className={styles.headerSubtitle}>
              Input &amp; rekapitulasi nilai formatif, sumatif, PTS, dan PAS Kurikulum Merdeka di {schoolName}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={exportToExcelFile}
            title="Unduh data nilai format .xlsx"
          >
            <Download size={13} />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSaveChanges}
            disabled={isSaving}
            title="Simpan rekapitulasi nilai ke database"
          >
            {isSaving ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Executive KPI Stat Cards (4 Columns) */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Total Siswa */}
        <div className={`${styles.metricCard} ${styles.cardBlue}`}>
          <div className={styles.metricTopRow}>
            <span className={styles.metricLabel}>Total Siswa Terdaftar</span>
            <div className={styles.metricIconBox}>
              <Users size={13} />
            </div>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{totalCount}</span>
            <span className={styles.metricSubtext}>Peserta Didik</span>
          </div>
        </div>

        {/* Card 2: Rata-Rata Nilai */}
        <div className={`${styles.metricCard} ${styles.cardIndigo}`}>
          <div className={styles.metricTopRow}>
            <span className={styles.metricLabel}>Rata-Rata Nilai Mapel</span>
            <div className={styles.metricIconBox}>
              <TrendingUp size={13} />
            </div>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{avgTotal}</span>
            <span className={styles.metricSubtext} title={selectedSubject}>/ 100 • {selectedSubject}</span>
          </div>
        </div>

        {/* Card 3: Ketuntasan KKM */}
        <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
          <div className={styles.metricTopRow}>
            <span className={styles.metricLabel}>Ketuntasan KKM (&ge;75)</span>
            <div className={styles.metricIconBox}>
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{passedCount}</span>
            <span className={styles.metricSubtext}>
              {totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0}% Tuntas KKM
            </span>
          </div>
        </div>

        {/* Card 4: Remedial */}
        <div className={`${styles.metricCard} ${styles.cardAmber}`}>
          <div className={styles.metricTopRow}>
            <span className={styles.metricLabel}>Perlu Remedial (&lt;75)</span>
            <div className={styles.metricIconBox}>
              <AlertTriangle size={13} />
            </div>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{Math.max(0, totalCount - passedCount)}</span>
            <span className={styles.metricSubtext}>Perlu Pembinaan</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className={styles.filterCard}>
        <div className={styles.filterControls}>
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari NISN atau nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">Semua Rombel</option>
            {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className={styles.selectInput}
            disabled={isLoadingGrades || isSaving}
          >
            {subjectsList.map((s: RawSubject) => (
              <option key={s.id || s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.weightBadge}>
          <SlidersHorizontal size={12} color="#0284c7" />
          <span>Bobot: Formatif 1 (20%) • Formatif 2 (20%) • PTS (30%) • PAS (30%)</span>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              margin: '0 auto 0.5rem',
              borderRadius: '8px',
              background: 'var(--bg-elevated, #f1f5f9)',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Search size={18} />
            </div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Tidak ada data siswa ditemukan
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Coba sesuaikan kata kunci pencarian atau pilihan filter rombel.
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thSortable} onClick={() => handleSetSort('name')}>
                    <div className={styles.thSortContent}>
                      <span>NISN &amp; NAMA SISWA (DAPODIK REAL)</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSetSort('className')}>
                    <div className={styles.thSortContent}>
                      <span>ROMBEL</span>
                      {renderSortIcon('className')}
                    </div>
                  </th>
                  <th className={styles.thSortable} style={{ textAlign: 'center' }} onClick={() => handleSetSort('formatif1')}>
                    <div className={styles.thSortContent} style={{ justifyContent: 'center' }}>
                      <span>FORMATIF 1 (20%)</span>
                      {renderSortIcon('formatif1')}
                    </div>
                  </th>
                  <th className={styles.thSortable} style={{ textAlign: 'center' }} onClick={() => handleSetSort('formatif2')}>
                    <div className={styles.thSortContent} style={{ justifyContent: 'center' }}>
                      <span>FORMATIF 2 (20%)</span>
                      {renderSortIcon('formatif2')}
                    </div>
                  </th>
                  <th className={styles.thSortable} style={{ textAlign: 'center' }} onClick={() => handleSetSort('pts')}>
                    <div className={styles.thSortContent} style={{ justifyContent: 'center' }}>
                      <span>PTS (30%)</span>
                      {renderSortIcon('pts')}
                    </div>
                  </th>
                  <th className={styles.thSortable} style={{ textAlign: 'center' }} onClick={() => handleSetSort('pas')}>
                    <div className={styles.thSortContent} style={{ justifyContent: 'center' }}>
                      <span>PAS (30%)</span>
                      {renderSortIcon('pas')}
                    </div>
                  </th>
                  <th className={styles.thSortable} style={{ textAlign: 'center' }} onClick={() => handleSetSort('totalScore')}>
                    <div className={styles.thSortContent} style={{ justifyContent: 'center' }}>
                      <span>NILAI AKHIR</span>
                      {renderSortIcon('totalScore')}
                    </div>
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSetSort('grade')}>
                    <div className={styles.thSortContent}>
                      <span>PREDIKAT &amp; STATUS</span>
                      {renderSortIcon('grade')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.studentId}>
                    <td>
                      <div className={styles.studentName}>{item.name}</div>
                      <div className={styles.studentNisn}>NISN: {item.nisn}</div>
                    </td>
                    <td>
                      <span className={styles.classBadge}>{item.className}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.formatif1 || ''}
                        placeholder="0"
                        onChange={(e) => handleScoreChange(item.studentId, 'formatif1', parseInt(e.target.value) || 0)}
                        className={styles.scoreInput}
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
                        className={styles.scoreInput}
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
                        className={styles.scoreInput}
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
                        className={styles.scoreInput}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.totalScore > 0 ? (
                        <span className={styles.finalScore}>{item.totalScore}</span>
                      ) : (
                        <span className={styles.finalScoreEmpty}>-</span>
                      )}
                    </td>
                    <td>
                      {item.totalScore === 0 ? (
                        <span className={styles.badgeGhost}>
                          Belum Diinput
                        </span>
                      ) : (
                        <>
                          <span className={`${styles.gradeBadge} ${
                            item.grade === 'A' ? styles.gradeA : item.grade === 'B' ? styles.gradeB : styles.gradeC
                          }`}>
                            Predikat {item.grade}
                          </span>
                          <div className={`${styles.statusKkmText} ${
                            item.statusKkm === 'Tuntas KKM' ? styles.statusPassed : styles.statusFailed
                          }`}>
                            • {item.statusKkm}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filtered.length > itemsPerPage && (
          <div className={styles.pagination}>
            <span>
              Menampilkan {(safePage - 1) * itemsPerPage + 1} - {Math.min(safePage * itemsPerPage, filtered.length)} dari {filtered.length} siswa
            </span>
            <div className={styles.pageBtnGroup}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={safePage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>
              <span className={styles.pageIndicator}>
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
