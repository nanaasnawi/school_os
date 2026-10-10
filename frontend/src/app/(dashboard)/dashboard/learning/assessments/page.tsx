'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './assessments.module.css';

interface AssessmentItem {
  id: string;
  learning_objective_id?: string;
  tp_code?: string;
  tp_statement?: string;
  tp_competency?: string;
  tp_content_scope?: string;
  class_id: string;
  class_name: string;
  subject_code: string;
  subject_name: string;
  title: string;
  taxonomy_type: 'DIAGNOSTIC_NON_COGNITIVE' | 'DIAGNOSTIC_COGNITIVE' | 'FORMATIVE' | 'SUMMATIVE_MATERIAL' | 'SUMMATIVE_SEMESTER';
  assessment_method: string;
  passing_threshold: number;
  kktp_criteria: any;
  date_conducted: string;
  calendar_event_id?: string;
  kaldik_event_title?: string;
  status: string;
  graded_students_count?: number;
}

interface StudentGradeItem {
  student_id: string;
  full_name: string;
  nisn: string;
  raw_score: number | string;
  qualitative_level: string;
  feedback_notes: string;
}

interface RaporEntry {
  student_id: string;
  nisn: string;
  full_name: string;
  tp_scores: Array<{ tp_code: string; score: number }>;
  avg_tp_score: number;
  sas_score: number | null;
  final_score: number;
  status_kktp: 'TUNTAS' | 'PERLU_REMEDIAL';
  highest_achievement_desc: string;
  lowest_achievement_desc: string;
}

export default function PedagogicalAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<'SUMMATIVE' | 'FORMATIVE' | 'DIAGNOSTIC' | 'RAPOR'>('SUMMATIVE');
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [classesList, setClassesList] = useState<Array<{ id: string; name: string }>>([]);
  const [publishedTps, setPublishedTps] = useState<Array<{ id: string; code: string; competency: string; content_scope: string; statement: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<string>('ODD');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('401000000');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [gradingAssessment, setGradingAssessment] = useState<AssessmentItem | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGradeItem[]>([]);
  const [isSavingGrades, setIsSavingGrades] = useState<boolean>(false);

  // Form Buat Asesmen
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTaxonomy, setNewTaxonomy] = useState<AssessmentItem['taxonomy_type']>('SUMMATIVE_MATERIAL');
  const [newTpId, setNewTpId] = useState<string>('');
  const [newMethod, setNewMethod] = useState<string>('WRITTEN_TEST');
  const [newPassingScore, setNewPassingScore] = useState<number>(75);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [createError, setCreateError] = useState<string | null>(null);

  // Diagnostic Clustering State
  const [diagData, setDiagData] = useState<any>(null);

  // Rapor Preview State
  const [raporEntries, setRaporEntries] = useState<RaporEntry[]>([]);
  const [raporSummary, setRaporSummary] = useState<any>(null);

  // Load Classes & Initial Setup
  useEffect(() => {
    const initData = async () => {
      try {
        const clsRes = await fetch('/api/v1/academic/classes');
        if (clsRes.ok) {
          const cData = await clsRes.json();
          const list = cData.data || [];
          setClassesList(list);
          if (list.length > 0 && !selectedClass) {
            setSelectedClass(list[0].id);
          }
        }

        const atpRes = await fetch('/api/v1/learning/pedagogy/atp');
        if (atpRes.ok) {
          const aData = await atpRes.json();
          const allTps: any[] = [];
          if (aData.atp_matrix?.odd_semester?.flows) allTps.push(...aData.atp_matrix.odd_semester.flows);
          if (aData.atp_matrix?.even_semester?.flows) allTps.push(...aData.atp_matrix.even_semester.flows);
          const pub = allTps.filter((t) => t.publication_status === 'PUBLISHED');
          setPublishedTps(pub);
          if (pub.length > 0 && !newTpId) setNewTpId(pub[0].id);
        }
      } catch (err) {
        console.error('Init error:', err);
      }
    };
    initData();
  }, []);

  // Load Assessments & Tab Specific Data
  const loadTabContent = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);

      // Fetch list assessments
      const res = await fetch(
        `/api/v1/learning/pedagogy/assessments?academic_year=${academicYear}&semester=${selectedSemester}&class_id=${selectedClass}&subject_code=${selectedSubject}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAssessments(data.assessments || []);
      }

      // If Tab is DIAGNOSTIC, fetch clustering
      if (activeTab === 'DIAGNOSTIC') {
        const diagRes = await fetch(
          `/api/v1/learning/pedagogy/assessments/diagnostic-clustering?class_id=${selectedClass}&academic_year=${academicYear}`
        );
        if (diagRes.ok) {
          const dData = await diagRes.json();
          if (dData.success) setDiagData(dData);
        }
      }

      // If Tab is RAPOR, fetch rapor preview
      if (activeTab === 'RAPOR') {
        const rapRes = await fetch(
          `/api/v1/learning/pedagogy/assessments/rapor-preview?class_id=${selectedClass}&subject_code=${selectedSubject}&academic_year=${academicYear}&semester=${selectedSemester}`
        );
        if (rapRes.ok) {
          const rData = await rapRes.json();
          if (rData.success) {
            setRaporEntries(rData.report_entries || []);
            setRaporSummary(rData);
          }
        }
      }
    } catch (err) {
      console.error('Tab load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabContent();
  }, [activeTab, selectedClass, selectedSubject, selectedSemester, academicYear]);

  // Handle Create Assessment
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      const chosenTp = publishedTps.find((t) => t.id === newTpId);
      const res = await fetch('/api/v1/learning/pedagogy/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          subject_code: selectedSubject,
          subject_name: 'IPAS',
          title: newTitle,
          taxonomy_type: newTaxonomy,
          learning_objective_id: newTaxonomy === 'FORMATIVE' || newTaxonomy === 'SUMMATIVE_MATERIAL' ? newTpId : null,
          assessment_method: newMethod,
          passing_threshold: Number(newPassingScore),
          date_conducted: newDate,
          academic_year: academicYear,
          semester: selectedSemester,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Gagal membuat asesmen.');
      }

      setIsCreateOpen(false);
      setNewTitle('');
      await loadTabContent();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan submit asesmen';
      setCreateError(msg);
    }
  };

  // Open Grading Modal
  const openGradingModal = async (assess: AssessmentItem) => {
    setGradingAssessment(assess);
    try {
      const res = await fetch(`/api/v1/learning/pedagogy/assessments/${assess.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const list: StudentGradeItem[] = (data.students || []).map((s: any) => ({
            student_id: s.student_id,
            full_name: s.full_name,
            nisn: s.nisn,
            raw_score: s.raw_score !== null && s.raw_score !== undefined ? s.raw_score : '',
            qualitative_level: s.qualitative_level || 'BAIK',
            feedback_notes: s.feedback_notes || '',
          }));
          setStudentGrades(list);
        }
      }
    } catch (err) {
      console.error('Error fetching students for grading:', err);
    }
  };

  // Save Student Grades
  const handleSaveGrades = async () => {
    if (!gradingAssessment) return;
    try {
      setIsSavingGrades(true);
      const res = await fetch(`/api/v1/learning/pedagogy/assessments/${gradingAssessment.id}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: studentGrades }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || data.error || 'Gagal menyimpan nilai.');
        return;
      }
      setGradingAssessment(null);
      await loadTabContent();
    } catch (err) {
      console.error('Error saving grades:', err);
    } finally {
      setIsSavingGrades(false);
    }
  };

  const filteredSummative = assessments.filter(
    (a) => a.taxonomy_type === 'SUMMATIVE_MATERIAL' || a.taxonomy_type === 'SUMMATIVE_SEMESTER'
  );

  const filteredFormative = assessments.filter(
    (a) => a.taxonomy_type === 'FORMATIVE'
  );

  return (
    <div className={styles.container}>
      {/* ── Hero Header ── */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>Fase 4: Integrasi Taksonomi Asesmen</span>
          </div>
          <h1 className={styles.heroTitle}>Taksonomi Asesmen Kurikulum Merdeka</h1>
          <p className={styles.heroSubtitle}>
            Ekosistem evaluasi terpadu: Asesmen Diagnostik (VAK &amp; Kesiapan Kognitif), Asesmen Formatif (IKTP &amp; Rubrik Proses),
            Asesmen Sumatif (Lingkup Materi TP &amp; SAS Kaldik), serta Rekapitulasi Otomatis Narasi Capaian e-Rapor.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/dashboard/learning/modul-ajar" className={styles.btnSecondary}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Modul Ajar
          </Link>
          <button onClick={() => setIsCreateOpen(true)} className={styles.btnPrimary}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M10 5v10m-5-5h10" />
            </svg>
            + Rancang Asesmen Baru
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Kelas / Rombel:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={styles.selectInput}
          >
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mata Pelajaran:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={styles.selectInput}
          >
            <option value="401000000">Matematika</option>
            <option value="IPAS">IPAS</option>
            <option value="BIND">Bahasa Indonesia</option>
          </select>

          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester:</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ODD">Semester Ganjil (18 MEB)</option>
            <option value="EVEN">Semester Genap (17 MEB)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Tahun Ajaran {academicYear}
        </div>
      </div>

      {/* ── 4-Tabs Navigation ── */}
      <div className={styles.tabsNav}>
        <button
          onClick={() => setActiveTab('SUMMATIVE')}
          className={`${styles.tabBtn} ${activeTab === 'SUMMATIVE' ? styles.tabActive : ''}`}
        >
          🎯 Asesmen Sumatif (TP &amp; SAS Kaldik) ({filteredSummative.length})
        </button>
        <button
          onClick={() => setActiveTab('FORMATIVE')}
          className={`${styles.tabBtn} ${activeTab === 'FORMATIVE' ? styles.tabActive : ''}`}
        >
          📝 Asesmen Formatif (IKTP &amp; Rubrik) ({filteredFormative.length})
        </button>
        <button
          onClick={() => setActiveTab('DIAGNOSTIC')}
          className={`${styles.tabBtn} ${activeTab === 'DIAGNOSTIC' ? styles.tabActive : ''}`}
        >
          🔍 Asesmen Diagnostik &amp; Clustering Diferensiasi
        </button>
        <button
          onClick={() => setActiveTab('RAPOR')}
          className={`${styles.tabBtn} ${activeTab === 'RAPOR' ? styles.tabActive : ''}`}
        >
          📊 Rekap Nilai KKTP &amp; Narasi e-Rapor
        </button>
      </div>

      {/* ── TAB 1: ASESMEN SUMATIF ── */}
      {activeTab === 'SUMMATIVE' && (
        <div>
          {loading ? (
            <div className={styles.emptyState}>Memuat Data Asesmen Sumatif...</div>
          ) : filteredSummative.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Belum Ada Asesmen Sumatif Terdaftar</div>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 450 }}>
                Rancang Asesmen Sumatif Lingkup Materi (terikat pada TP PUBLISHED) atau Asesmen Sumatif Akhir Semester (SAS).
              </p>
              <button onClick={() => setIsCreateOpen(true)} className={styles.btnPrimary}>
                + Buat Asesmen Sumatif Sekarang
              </button>
            </div>
          ) : (
            <div className={styles.assessGrid}>
              {filteredSummative.map((a) => (
                <div key={a.id} className={styles.assessCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.badgeSummative}>
                      {a.taxonomy_type === 'SUMMATIVE_MATERIAL' ? 'SUMATIF LINGKUP MATERI' : 'SUMATIF AKHIR SEMESTER (SAS)'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {a.date_conducted}
                    </span>
                  </div>

                  <div>
                    <h3 className={styles.cardTitle}>{a.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Kelas: {a.class_name} • Mapel: {a.subject_name} • Metode: {a.assessment_method}
                    </div>
                  </div>

                  {a.tp_code && (
                    <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', fontSize: '0.78rem' }}>
                      <strong style={{ color: '#4f46e5' }}>TP: {a.tp_code}</strong>
                      <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)' }}>{a.tp_statement}</p>
                    </div>
                  )}

                  <div className={styles.kktpBox}>
                    <span>Ambang Tuntas KKTP: <strong>{a.passing_threshold}</strong></span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      {a.graded_students_count || 0} Siswa Dinilai
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Status: {a.status}
                    </span>
                    <button onClick={() => openGradingModal(a)} className={styles.btnSm}>
                      ✏️ Input / Koreksi Nilai
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ASESMEN FORMATIF ── */}
      {activeTab === 'FORMATIVE' && (
        <div>
          {loading ? (
            <div className={styles.emptyState}>Memuat Data Asesmen Formatif...</div>
          ) : filteredFormative.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Belum Ada Asesmen Formatif Terdaftar</div>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 450 }}>
                Asesmen Formatif digunakan untuk memantau kemajuan belajar siswa (Assessment for &amp; as Learning) dan memberikan umpan balik perbaikan.
              </p>
              <button onClick={() => setIsCreateOpen(true)} className={styles.btnPrimary}>
                + Buat Asesmen Formatif Baru
              </button>
            </div>
          ) : (
            <div className={styles.assessGrid}>
              {filteredFormative.map((a) => (
                <div key={a.id} className={styles.assessCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.badgeFormative}>FORMATIF (PEMERIKSAAN IKTP)</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {a.date_conducted}
                    </span>
                  </div>

                  <div>
                    <h3 className={styles.cardTitle}>{a.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Kelas: {a.class_name} • Mapel: {a.subject_name} • Metode: {a.assessment_method}
                    </div>
                  </div>

                  {a.tp_code && (
                    <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', fontSize: '0.78rem' }}>
                      <strong style={{ color: '#0284c7' }}>Indikator TP: {a.tp_code}</strong>
                      <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)' }}>{a.tp_statement}</p>
                    </div>
                  )}

                  <div className={styles.kktpBox}>
                    <span>Skala Rubrik: <strong>BM • MB • BSH • SB</strong></span>
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>
                      {a.graded_students_count || 0} Siswa Dinilai
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Fungsi: Umpan Balik KBM
                    </span>
                    <button onClick={() => openGradingModal(a)} className={styles.btnSm}>
                      ✏️ Isi Observasi / Ceklis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: DIAGNOSTIC & CLUSTERING DIFERENSIASI ── */}
      {activeTab === 'DIAGNOSTIC' && diagData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Box */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Pemetaan Gaya Belajar &amp; Kesiapan Kognitif Peserta Didik
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Hasil pengelompokan ini otomatis terhubung sebagai basis stasiun belajar pada <strong>Modul Ajar Fase 3</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ padding: '0.4rem 0.8rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                👁️ Visual: {diagData.modality_distribution?.Visual || 0}
              </span>
              <span style={{ padding: '0.4rem 0.8rem', background: '#fef3c7', color: '#b45309', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                🎧 Auditori: {diagData.modality_distribution?.Auditori || 0}
              </span>
              <span style={{ padding: '0.4rem 0.8rem', background: '#dcfce7', color: '#15803d', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                ✋ Kinestetik: {diagData.modality_distribution?.Kinestetik || 0}
              </span>
            </div>
          </div>

          {/* 3 Tier Grid */}
          <div className={styles.tierGrid}>
            {/* Tier 1 */}
            <div className={styles.tierCard} style={{ borderTop: '4px solid #ef4444' }}>
              <div className={styles.tierHeader}>
                <div>
                  <strong style={{ color: '#b91c1c', fontSize: '0.95rem' }}>1. Perlu Bimbingan (Needs Guidance)</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Skor Prasyarat &lt; 66 • Scaffolding Intensif</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444' }}>
                  {diagData.readiness_tiers?.needs_guidance?.count || 0} ({diagData.readiness_tiers?.needs_guidance?.percentage || 0}%)
                </span>
              </div>
              <div className={styles.tierStudentList}>
                {diagData.readiness_tiers?.needs_guidance?.students?.map((s: any) => (
                  <div key={s.student_id} className={styles.studentItem}>
                    <div>
                      <strong>{s.full_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NISN: {s.nisn}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.35rem', fontWeight: 700 }}>
                      {s.modality}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 2 */}
            <div className={styles.tierCard} style={{ borderTop: '4px solid #0284c7' }}>
              <div className={styles.tierHeader}>
                <div>
                  <strong style={{ color: '#0369a1', fontSize: '0.95rem' }}>2. Siswa Reguler (Regular Tier)</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Skor 66 - 85 • Eksplorasi Mandiri Terarah</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0284c7' }}>
                  {diagData.readiness_tiers?.regular_students?.count || 0} ({diagData.readiness_tiers?.regular_students?.percentage || 0}%)
                </span>
              </div>
              <div className={styles.tierStudentList}>
                {diagData.readiness_tiers?.regular_students?.students?.map((s: any) => (
                  <div key={s.student_id} className={styles.studentItem}>
                    <div>
                      <strong>{s.full_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NISN: {s.nisn}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '0.35rem', fontWeight: 700 }}>
                      {s.modality}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 3 */}
            <div className={styles.tierCard} style={{ borderTop: '4px solid #10b981' }}>
              <div className={styles.tierHeader}>
                <div>
                  <strong style={{ color: '#047857', fontSize: '0.95rem' }}>3. Siswa Mahir (Advanced / Pengayaan)</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Skor &gt; 85 • Studi Kasus &amp; Tantangan Tingkat Lanjut</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>
                  {diagData.readiness_tiers?.advanced_students?.count || 0} ({diagData.readiness_tiers?.advanced_students?.percentage || 0}%)
                </span>
              </div>
              <div className={styles.tierStudentList}>
                {diagData.readiness_tiers?.advanced_students?.students?.map((s: any) => (
                  <div key={s.student_id} className={styles.studentItem}>
                    <div>
                      <strong>{s.full_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NISN: {s.nisn}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '0.35rem', fontWeight: 700 }}>
                      {s.modality}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: REKAP KKTP & NARASI E-RAPOR ── */}
      {activeTab === 'RAPOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1rem 1.5rem',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Buku Nilai &amp; Lembar Capaian e-Rapor Kurikulum Merdeka
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Formula: Nilai Akhir (NA) = 60% Rata-rata Sumatif TP + 40% Sumatif Akhir Semester (SAS). Ambang KKTP: 75.0.
              </p>
            </div>
            <button onClick={() => window.print()} className={styles.btnSecondary}>
              🖨️ Cetak / Ekspor e-Rapor
            </button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.raporTable}>
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>No</th>
                  <th style={{ width: '18%' }}>Peserta Didik</th>
                  <th style={{ width: '12%' }}>Sumatif TP</th>
                  <th style={{ width: '10%' }}>SAS</th>
                  <th style={{ width: '10%' }}>Nilai Akhir (NA)</th>
                  <th style={{ width: '10%' }}>Status KKTP</th>
                  <th style={{ width: '36%' }}>Deskripsi Capaian Kompetensi e-Rapor</th>
                </tr>
              </thead>
              <tbody>
                {raporEntries.map((r, idx) => (
                  <tr key={r.student_id}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{r.full_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NISN: {r.nisn}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{r.avg_tp_score}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {r.tp_scores?.length || 0} Lingkup TP
                      </div>
                    </td>
                    <td>
                      {r.sas_score !== null ? (
                        <span style={{ fontWeight: 700 }}>{r.sas_score}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: r.final_score >= 75 ? '#059669' : '#dc2626'
                      }}>
                        {r.final_score}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '0.35rem',
                        background: r.status_kktp === 'TUNTAS' ? '#dcfce7' : '#fee2e2',
                        color: r.status_kktp === 'TUNTAS' ? '#15803d' : '#b91c1c',
                      }}>
                        {r.status_kktp}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: '#059669' }}>Capaian Tertinggi: </strong>
                          <span>{r.highest_achievement_desc}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#b91c1c' }}>Perlu Peningkatan: </strong>
                          <span>{r.lowest_achievement_desc}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Buat Asesmen Baru ── */}
      {isCreateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 600 }}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                Rancang Asesmen Pedagogis Baru
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssessment}>
              <div className={styles.modalBody}>
                {createError && (
                  <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.82rem' }}>
                    ⚠️ {createError}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Jenis Taksonomi Asesmen:</label>
                  <select
                    value={newTaxonomy}
                    onChange={(e) => setNewTaxonomy(e.target.value as any)}
                    className={styles.formSelect}
                    required
                  >
                    <option value="SUMMATIVE_MATERIAL">🎯 Asesmen Sumatif Lingkup Materi (TP)</option>
                    <option value="SUMMATIVE_SEMESTER">🏆 Asesmen Sumatif Akhir Semester (SAS)</option>
                    <option value="FORMATIVE">📝 Asesmen Formatif (Proses &amp; IKTP)</option>
                    <option value="DIAGNOSTIC_NON_COGNITIVE">🔍 Asesmen Diagnostik Non-Kognitif (Gaya Belajar VAK)</option>
                    <option value="DIAGNOSTIC_COGNITIVE">🧠 Asesmen Diagnostik Kognitif (Kesiapan Prasyarat)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Judul Instrumen Asesmen:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sumatif Bab 1 - Struktur & Fungsi Organ Pencernaan"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                {(newTaxonomy === 'FORMATIVE' || newTaxonomy === 'SUMMATIVE_MATERIAL') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tujuan Pembelajaran (TP Induk Berstatus PUBLISHED):</label>
                    <select
                      value={newTpId}
                      onChange={(e) => setNewTpId(e.target.value)}
                      className={styles.formSelect}
                      required
                    >
                      {publishedTps.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          [{tp.code}] {tp.competency} - {tp.content_scope}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ✓ Asesmen Formatif &amp; Sumatif Lingkup Materi wajib terikat ke TP yang telah disahkan.
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bentuk / Metode:</label>
                    <select
                      value={newMethod}
                      onChange={(e) => setNewMethod(e.target.value)}
                      className={styles.formSelect}
                    >
                      <option value="WRITTEN_TEST">Tes Tulis (Esai/Pilihan Ganda)</option>
                      <option value="PERFORMANCE">Unjuk Kerja / Praktik</option>
                      <option value="PRODUCT">Penilaian Produk / Karya</option>
                      <option value="OBSERVATION">Observasi / Ceklis Guru</option>
                      <option value="PORTFOLIO">Portofolio</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ambang KKTP:</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newPassingScore}
                      onChange={(e) => setNewPassingScore(Number(e.target.value))}
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tanggal Pelaksanaan:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsCreateOpen(false)} className={styles.btnSecondary}>
                  Batal
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Simpan Asesmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Input / Koreksi Nilai Siswa Massal ── */}
      {gradingAssessment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 850 }}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  Input Nilai &amp; Umpan Balik: {gradingAssessment.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Ambang KKTP: {gradingAssessment.passing_threshold} • Kelas: {gradingAssessment.class_name}
                </div>
              </div>
              <button onClick={() => setGradingAssessment(null)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.tableContainer} style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className={styles.raporTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>No</th>
                      <th style={{ width: '30%' }}>Peserta Didik</th>
                      <th style={{ width: '18%' }}>Nilai (0-100)</th>
                      <th style={{ width: '22%' }}>Level Kualitatif</th>
                      <th style={{ width: '25%' }}>Catatan Umpan Balik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGrades.map((g, idx) => (
                      <tr key={g.student_id}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{g.full_name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NISN: {g.nisn}</div>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Nilai"
                            value={g.raw_score}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...studentGrades];
                              updated[idx].raw_score = val;
                              // Auto set qualitative level based on score
                              const num = Number(val);
                              if (num >= 86) updated[idx].qualitative_level = 'SANGAT_BAIK';
                              else if (num >= 76) updated[idx].qualitative_level = 'BAIK';
                              else if (num >= 66) updated[idx].qualitative_level = 'CUKUP';
                              else if (val !== '') updated[idx].qualitative_level = 'PERLU_BIMBINGAN';
                              setStudentGrades(updated);
                            }}
                            className={styles.formInput}
                            style={{ padding: '0.35rem 0.5rem', width: '90px' }}
                          />
                        </td>
                        <td>
                          <select
                            value={g.qualitative_level}
                            onChange={(e) => {
                              const updated = [...studentGrades];
                              updated[idx].qualitative_level = e.target.value;
                              setStudentGrades(updated);
                            }}
                            className={styles.formSelect}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            <option value="SANGAT_BAIK">Sangat Baik (SB)</option>
                            <option value="BAIK">Baik (BSH)</option>
                            <option value="CUKUP">Cukup (MB)</option>
                            <option value="PERLU_BIMBINGAN">Perlu Bimbingan (BM)</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Catatan guru..."
                            value={g.feedback_notes}
                            onChange={(e) => {
                              const updated = [...studentGrades];
                              updated[idx].feedback_notes = e.target.value;
                              setStudentGrades(updated);
                            }}
                            className={styles.formInput}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setGradingAssessment(null)}
                className={styles.btnSecondary}
                disabled={isSavingGrades}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveGrades}
                className={styles.btnPrimary}
                disabled={isSavingGrades}
              >
                {isSavingGrades ? 'Menyimpan...' : 'Simpan Seluruh Nilai 💾'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
