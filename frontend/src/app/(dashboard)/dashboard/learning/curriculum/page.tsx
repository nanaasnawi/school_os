'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Clock,
  Edit3,
  Send,
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronRight,
  Award,
  ListOrdered,
  X,
  FileCheck,
} from 'lucide-react';
import styles from './curriculum.module.css';

interface LearningOutcomeElement {
  id: string;
  subject_code: string | null;
  subject_name: string;
  phase: string;
  target_grades: string;
  element_name: string;
  description: string;
  source_origin: string;
  source_version: string;
  source_document: string | null;
  document_page_ref: string | null;
  verification_status: string;
  is_eligible_source: boolean;
  order_index: number;
}

interface CpRegistryData {
  phase: string;
  subject_query: string;
  source_available: boolean;
  eligible_for_ai_synthesis: boolean;
  elements_count: number;
  elements: LearningOutcomeElement[];
  message: string;
}

interface TpItem {
  id?: string;
  tp_id?: string;
  code: string;
  competency: string;
  bloom_level: string;
  content_scope: string;
  statement: string;
  pancasila_profiles: string[];
  evidence_indicators: string[];
  estimated_hours: number;
  publication_status: 'DRAFT' | 'REVIEWED' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  semester?: 'ODD' | 'EVEN';
  sequence_order?: number;
}

interface AtpMatrixResponse {
  academic_year: string;
  total_items: number;
  total_hours: number;
  odd_semester: {
    items_count: number;
    total_hours: number;
    items: any[];
  };
  even_semester: {
    items_count: number;
    total_hours: number;
    items: any[];
  };
}

const PHASES = [
  { value: 'FASE_A', label: 'Fase A (Kelas 1 - 2 SD)' },
  { value: 'FASE_B', label: 'Fase B (Kelas 3 - 4 SD)' },
  { value: 'FASE_C', label: 'Fase C (Kelas 5 - 6 SD)' },
  { value: 'FASE_D', label: 'Fase D (Kelas 7 - 9 SMP)' },
  { value: 'FASE_E', label: 'Fase E (Kelas 10 SMA/SMK)' },
  { value: 'FASE_F', label: 'Fase F (Kelas 11 - 12 SMA/SMK)' },
];

const STANDARD_SUBJECTS = [
  { code: '401900000', name: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
  { code: '300110000', name: 'Bahasa Indonesia' },
  { code: '401000000', name: 'Matematika (Umum)' },
  { code: '200010300', name: 'Pendidikan Pancasila' },
  { code: '300210000', name: 'Bahasa Inggris' },
  { code: '500010000', name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' },
  { code: '700201020', name: 'Muatan Keterampilan Robotika' },
];

export default function CurriculumWorkstationPage() {
  const [phase, setPhase] = useState('FASE_C');
  const [subjectCode, setSubjectCode] = useState('401900000');
  const [gradeLevel, setGradeLevel] = useState('Kelas 5 SD');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [activeTab, setActiveTab] = useState<'CP' | 'TP' | 'ATP'>('CP');

  const [registryData, setRegistryData] = useState<CpRegistryData | null>(null);
  const [selectedCp, setSelectedCp] = useState<LearningOutcomeElement | null>(null);
  const [atpMatrix, setAtpMatrix] = useState<AtpMatrixResponse | null>(null);

  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Edit TP Modal state
  const [editingTp, setEditingTp] = useState<TpItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeSubject = STANDARD_SUBJECTS.find((s) => s.code === subjectCode) || STANDARD_SUBJECTS[0];

  // 1. Fetch CP Registry whenever Phase or Subject changes
  useEffect(() => {
    async function fetchCpRegistry() {
      setIsLoadingRegistry(true);
      try {
        const res = await fetch(
          `/api/v1/learning/pedagogy/cp?phase=${phase}&subject=${encodeURIComponent(activeSubject.name)}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setRegistryData(json.data);
          if (json.data.elements.length > 0) {
            setSelectedCp(json.data.elements[0]);
          } else {
            setSelectedCp(null);
          }
        }
      } catch (err) {
        console.error('Failed to load CP registry:', err);
      } finally {
        setIsLoadingRegistry(false);
      }
    }

    fetchCpRegistry();
  }, [phase, activeSubject.name]);

  // 2. Fetch ATP Matrix whenever Selected CP changes
  useEffect(() => {
    if (!selectedCp) {
      setAtpMatrix(null);
      return;
    }

    async function fetchAtpMatrix() {
      try {
        const res = await fetch(
          `/api/v1/learning/pedagogy/atp?source_cp_id=${selectedCp?.id}&academic_year=${academicYear}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setAtpMatrix(json.data);
        }
      } catch (err) {
        console.error('Failed to load ATP matrix:', err);
      }
    }

    fetchAtpMatrix();
  }, [selectedCp, academicYear]);

  // Show Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 3. Handler: Sintesis Usulan TP & ATP via NVIDIA NIM
  const handleSynthesizeAi = async (forceRegenerate = false) => {
    if (!selectedCp) return;

    if (!selectedCp.is_eligible_source) {
      showToast('error', 'Hanya Capaian Pembelajaran resmi/terverifikasi yang boleh dijadikan basis dekonstruksi AI.');
      return;
    }

    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/v1/learning/pedagogy/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_cp_id: selectedCp.id,
          grade_level: gradeLevel,
          academic_year: academicYear,
          force_regenerate: forceRegenerate,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memproses sintesis TP & ATP dengan AI.');
      }

      showToast('success', json.message || 'Usulan TP & ATP berhasil dirumuskan sebagai Draf!');
      setActiveTab('TP');

      // Refresh ATP matrix
      const matrixRes = await fetch(
        `/api/v1/learning/pedagogy/atp?source_cp_id=${selectedCp.id}&academic_year=${academicYear}`
      );
      const matrixJson = await matrixRes.json();
      if (matrixJson.success && matrixJson.data) {
        setAtpMatrix(matrixJson.data);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan saat memanggil NVIDIA NIM AI.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 4. Handler: Simpan Hasil Edit TP (Review)
  const handleSaveEditedTp = async () => {
    if (!editingTp || !editingTp.id) return;

    try {
      const res = await fetch('/api/v1/learning/pedagogy/tp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTp.id,
          statement: editingTp.statement,
          competency: editingTp.competency,
          bloom_level: editingTp.bloom_level,
          content_scope: editingTp.content_scope,
          estimated_hours: editingTp.estimated_hours,
          pancasila_profiles: editingTp.pancasila_profiles,
          evidence_indicators: editingTp.evidence_indicators,
          mark_as_reviewed: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan perubahan TP.');
      }

      showToast('success', `TP ${editingTp.code} berhasil diperbarui dan ditandai REVIEWED!`);
      setEditingTp(null);

      // Refresh data
      if (selectedCp) {
        const matrixRes = await fetch(
          `/api/v1/learning/pedagogy/atp?source_cp_id=${selectedCp.id}&academic_year=${academicYear}`
        );
        const matrixJson = await matrixRes.json();
        if (matrixJson.success && matrixJson.data) {
          setAtpMatrix(matrixJson.data);
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan suntingan TP.');
    }
  };

  // 5. Handler: Publikasi Transaksional TP & ATP
  const handlePublishAll = async () => {
    const allTps = [
      ...(atpMatrix?.odd_semester.items || []),
      ...(atpMatrix?.even_semester.items || []),
    ];

    const tpIds = allTps.map((t) => t.tp_id || t.id).filter(Boolean);

    if (tpIds.length === 0) {
      showToast('error', 'Tidak ada butir TP yang dapat dipublikasikan. Silakan rumuskan usulan TP terlebih dahulu.');
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch('/api/v1/learning/pedagogy/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tp_ids: tpIds,
          academic_year: academicYear,
          grade_level: gradeLevel,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menerbitkan alur TP & ATP.');
      }

      showToast('success', json.message || 'Alur TP & ATP berhasil dipublikasikan secara resmi!');

      // Refresh data
      if (selectedCp) {
        const matrixRes = await fetch(
          `/api/v1/learning/pedagogy/atp?source_cp_id=${selectedCp.id}&academic_year=${academicYear}`
        );
        const matrixJson = await matrixRes.json();
        if (matrixJson.success && matrixJson.data) {
          setAtpMatrix(matrixJson.data);
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mempublikasikan perangkat pembelajaran.');
    } finally {
      setIsPublishing(false);
    }
  };

  const allItems = [
    ...(atpMatrix?.odd_semester.items || []),
    ...(atpMatrix?.even_semester.items || []),
  ];

  return (
    <div className={styles.container}>
      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb}>
        <Link href="/dashboard">Dashboard</Link>
        <ChevronRight size={14} />
        <span>Workstation Guru</span>
        <ChevronRight size={14} />
        <span>Kurikulum Merdeka (CP, TP & ATP)</span>
      </nav>

      {/* ── Toast Alert ── */}
      {toastMessage && (
        <div
          className={`${styles.toast} ${
            toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <section className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <div className={styles.heroIconWrapper}>
            <Compass size={28} />
          </div>
          <div>
            <h1 className={styles.heroTitle}>Ekosistem Pedagogis Kurikulum Merdeka</h1>
            <p className={styles.heroSubtitle}>
              Registry resmi Capaian Pembelajaran (CP), dekonstruksi TP cerdas dengan AI NVIDIA NIM, dan sinkronisasi
              Alur Tujuan Pembelajaran (ATP) dengan Kalender Pendidikan (Kaldik).
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <button
            className={`${styles.btn} ${styles.btnAi}`}
            onClick={() => handleSynthesizeAi(false)}
            disabled={!selectedCp?.is_eligible_source || isSynthesizing}
          >
            {isSynthesizing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isSynthesizing ? 'Mendekonstruksi via AI...' : 'Sintesis TP & ATP (AI)'}
          </button>

          {allItems.length > 0 && (
            <button
              className={`${styles.btn} ${styles.btnSuccess}`}
              onClick={handlePublishAll}
              disabled={isPublishing}
            >
              <FileCheck size={18} />
              {isPublishing ? 'Menerbitkan...' : 'Publikasikan Perangkat'}
            </button>
          )}
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <section className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.formLabel}>Jenjang / Fase:</label>
          <select
            className={styles.selectInput}
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
          >
            {PHASES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <label className={styles.formLabel}>Mata Pelajaran:</label>
          <select
            className={styles.selectInput}
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
          >
            {STANDARD_SUBJECTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>

          <label className={styles.formLabel}>Kelas Target:</label>
          <select
            className={styles.selectInput}
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          >
            <option value="Kelas 1 SD">Kelas 1 SD</option>
            <option value="Kelas 2 SD">Kelas 2 SD</option>
            <option value="Kelas 3 SD">Kelas 3 SD</option>
            <option value="Kelas 4 SD">Kelas 4 SD</option>
            <option value="Kelas 5 SD">Kelas 5 SD</option>
            <option value="Kelas 6 SD">Kelas 6 SD</option>
            <option value="Kelas 7 SMP">Kelas 7 SMP</option>
            <option value="Kelas 8 SMP">Kelas 8 SMP</option>
            <option value="Kelas 9 SMP">Kelas 9 SMP</option>
            <option value="Kelas 10 SMA">Kelas 10 SMA</option>
            <option value="Kelas 11 SMA">Kelas 11 SMA</option>
            <option value="Kelas 12 SMA">Kelas 12 SMA</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.badge} style={{ background: '#0284c7', color: '#fff' }}>
            Tahun Ajaran: {academicYear}
          </span>
        </div>
      </section>

      {/* ── CP Source Registry Status Banner ── */}
      {selectedCp ? (
        <section
          className={`${styles.registryBanner} ${
            selectedCp.verification_status === 'NATIONAL_VERIFIED'
              ? styles.bannerVerified
              : selectedCp.verification_status === 'SCHOOL_VERIFIED'
              ? styles.bannerSchool
              : styles.bannerDraft
          }`}
        >
          <div className={styles.bannerContent}>
            {selectedCp.is_eligible_source ? (
              <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span
                  className={`${styles.badge} ${
                    selectedCp.verification_status === 'NATIONAL_VERIFIED'
                      ? styles.badgeVerified
                      : selectedCp.verification_status === 'SCHOOL_VERIFIED'
                      ? styles.badgeSchool
                      : styles.badgeDraft
                  }`}
                >
                  {selectedCp.verification_status}
                </span>
                <strong style={{ fontSize: '0.92rem' }}>
                  {selectedCp.element_name} ({selectedCp.target_grades})
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.45 }}>
                {selectedCp.description}
              </p>
              <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', opacity: 0.85 }}>
                Sumber: {selectedCp.source_document || 'Dokumen Regulasi Kemendikdasmen'} ({selectedCp.source_version})
                {selectedCp.document_page_ref ? ` • ${selectedCp.document_page_ref}` : ''}
              </div>
            </div>
          </div>

          <div style={{ alignSelf: 'center' }}>
            <button
              className={`${styles.btn} ${styles.btnAi}`}
              onClick={() => handleSynthesizeAi(true)}
              disabled={!selectedCp.is_eligible_source || isSynthesizing}
              title="Regenerasi akan membuat versi draf baru tanpa menimpa data yang telah dipublikasikan"
            >
              <RefreshCw size={15} />
              Regenerasi Draf
            </button>
          </div>
        </section>
      ) : (
        <section className={`${styles.registryBanner} ${styles.bannerEmpty}`}>
          <div className={styles.bannerContent}>
            <AlertTriangle size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Naskah Capaian Pembelajaran Belum Tersedia di Registry</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem' }}>
                Belum ditemukan naskah CP resmi untuk {activeSubject.name} pada {phase}. Sesuai prinsip tata kelola data,
                AI tidak diizinkan mengarang naskah CP sendiri. Silakan daftarkan dokumen KOSP resmi sekolah terlebih dahulu.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Kaldik MEB Alignment Stats ── */}
      <section className={styles.kaldikStatsCard}>
        <div className={styles.statItem}>
          <span className={styles.statVal}>35 Pekan</span>
          <span className={styles.statLabel}>Minggu Efektif Belajar (Kaldik)</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statVal}>
            {allItems.reduce((sum, item) => sum + (parseInt(item.allocated_hours || item.estimated_hours, 10) || 0), 0)} JP
          </span>
          <span className={styles.statLabel}>Total Jam Terencana</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statVal}>{allItems.length} Butir</span>
          <span className={styles.statLabel}>Total TP Terpetakan</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statVal}>
            {allItems.filter((t) => t.publication_status === 'PUBLISHED').length} / {allItems.length}
          </span>
          <span className={styles.statLabel}>Status Terpublikasi</span>
        </div>
      </section>

      {/* ── Tabs Navigation ── */}
      <div className={styles.tabsList}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'CP' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('CP')}
        >
          <BookOpen size={17} />
          1. Capaian Pembelajaran (CP)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'TP' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('TP')}
        >
          <Award size={17} />
          2. Tujuan Pembelajaran (TP) [{allItems.length}]
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'ATP' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ATP')}
        >
          <ListOrdered size={17} />
          3. Alur Pembelajaran (ATP) & Kaldik
        </button>
      </div>

      {/* ── TAB 1: Capaian Pembelajaran (CP) Registry ── */}
      {activeTab === 'CP' && (
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
            Elemen Capaian Pembelajaran Terdaftar ({registryData?.elements_count || 0} Elemen)
          </h2>

          {registryData && registryData.elements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {registryData.elements.map((el) => (
                <div
                  key={el.id}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '12px',
                    border: el.id === selectedCp?.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: el.id === selectedCp?.id ? 'rgba(2, 132, 199, 0.03)' : '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedCp(el)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`${styles.badge} ${el.is_eligible_source ? styles.badgeVerified : styles.badgeDraft}`}>
                        {el.verification_status}
                      </span>
                      <strong>{el.element_name}</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{el.target_grades}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                    {el.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <BookOpen size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
              <p>Belum ada naskah CP resmi yang terdaftar untuk mapel ini.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Tujuan Pembelajaran (TP) ── */}
      {activeTab === 'TP' && (
        <div className={styles.tpGrid}>
          {allItems.length > 0 ? (
            allItems.map((item, idx) => (
              <div key={item.id || item.tp_id || idx} className={styles.card}>
                <div className={styles.tpHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#0284c7' }}>{item.code}</span>
                    <span
                      className={`${styles.bloomBadge} ${
                        styles[`bloom${item.bloom_level || 'C3'}`] || styles.bloomC3
                      }`}
                    >
                      {item.competency} ({item.bloom_level})
                    </span>
                    <span
                      className={`${styles.statusPill} ${
                        item.publication_status === 'PUBLISHED'
                          ? styles.statusPublished
                          : item.publication_status === 'REVIEWED'
                          ? styles.statusReviewed
                          : styles.statusDraft
                      }`}
                    >
                      {item.publication_status} v{item.version || 1}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
                      <Clock size={13} style={{ display: 'inline', marginRight: '3px' }} />
                      {item.allocated_hours || item.estimated_hours} JP
                    </span>
                    <button
                      className={`${styles.btn} ${styles.btnOutline}`}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => setEditingTp(item)}
                    >
                      <Edit3 size={13} /> Edit / Review
                    </button>
                  </div>
                </div>

                <p className={styles.tpStatement}>{item.statement}</p>

                <div style={{ marginBottom: '0.5rem' }}>
                  <small style={{ fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                    Lingkup Materi: {item.content_scope}
                  </small>
                </div>

                {item.pancasila_profiles && item.pancasila_profiles.length > 0 && (
                  <div className={styles.tagList}>
                    {item.pancasila_profiles.map((p: string, pIdx: number) => (
                      <span key={pIdx} className={styles.tag}>
                        🌱 {p}
                      </span>
                    ))}
                  </div>
                )}

                {item.evidence_indicators && item.evidence_indicators.length > 0 && (
                  <div>
                    <small style={{ fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>
                      Indikator Ketercapaian (IKTP):
                    </small>
                    <ul className={styles.evidenceList}>
                      {item.evidence_indicators.map((ev: string, evIdx: number) => (
                        <li key={evIdx}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.card} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Sparkles size={40} style={{ color: '#8b5cf6', margin: '0 auto 1rem', opacity: 0.6 }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Belum Ada Usulan Tujuan Pembelajaran</h3>
              <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
                Gunakan tombol <strong>Sintesis TP & ATP (AI)</strong> untuk meminta asisten NVIDIA NIM membedah CP
                terverifikasi menjadi butir-butir TP dengan Taksonomi Bloom.
              </p>
              <button
                className={`${styles.btn} ${styles.btnAi}`}
                onClick={() => handleSynthesizeAi(false)}
                disabled={!selectedCp?.is_eligible_source || isSynthesizing}
              >
                <Sparkles size={16} /> Mulai Sintesis TP Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Alur Pembelajaran (ATP) & Kaldik ── */}
      {activeTab === 'ATP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Semester Ganjil */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  Semester Ganjil (Juli – Desember)
                </h3>
              </div>
              <span className={styles.badge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                {atpMatrix?.odd_semester.total_hours || 0} JP Terencana (dari ~18 Pekan MEB)
              </span>
            </div>

            {atpMatrix?.odd_semester.items && atpMatrix.odd_semester.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {atpMatrix.odd_semester.items.map((flow, idx) => (
                  <div
                    key={flow.id || flow.atp_id || idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0284c7', marginRight: '0.5rem' }}>
                        Urutan #{flow.sequence_order || idx + 1}: {flow.code}
                      </strong>
                      <span style={{ fontSize: '0.88rem', color: '#334155' }}>{flow.statement}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>
                      {flow.allocated_hours || flow.estimated_hours} JP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Belum ada alur TP di semester ganjil.</p>
            )}
          </div>

          {/* Semester Genap */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0284c7' }} />
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  Semester Genap (Januari – Juni)
                </h3>
              </div>
              <span className={styles.badge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                {atpMatrix?.even_semester.total_hours || 0} JP Terencana (dari ~17 Pekan MEB)
              </span>
            </div>

            {atpMatrix?.even_semester.items && atpMatrix.even_semester.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {atpMatrix.even_semester.items.map((flow, idx) => (
                  <div
                    key={flow.id || flow.atp_id || idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0284c7', marginRight: '0.5rem' }}>
                        Urutan #{flow.sequence_order || idx + 1}: {flow.code}
                      </strong>
                      <span style={{ fontSize: '0.88rem', color: '#334155' }}>{flow.statement}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>
                      {flow.allocated_hours || flow.estimated_hours} JP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Belum ada alur TP di semester genap.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Edit / Review TP ── */}
      {editingTp && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Sunting & Telaah: {editingTp.code}</h3>
              <button className={styles.closeBtn} onClick={() => setEditingTp(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rumusan Kalimat Tujuan Pembelajaran (TP):</label>
              <textarea
                className={styles.textareaInput}
                value={editingTp.statement}
                onChange={(e) => setEditingTp({ ...editingTp, statement: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kata Kerja Operasional (KKO):</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={editingTp.competency}
                  onChange={(e) => setEditingTp({ ...editingTp, competency: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Level Taksonomi Bloom:</label>
                <select
                  className={styles.selectInput}
                  value={editingTp.bloom_level}
                  onChange={(e) => setEditingTp({ ...editingTp, bloom_level: e.target.value })}
                >
                  <option value="C1">C1 - Mengingat</option>
                  <option value="C2">C2 - Memahami</option>
                  <option value="C3">C3 - Menerapkan</option>
                  <option value="C4">C4 - Menganalisis</option>
                  <option value="C5">C5 - Mengevaluasi</option>
                  <option value="C6">C6 - Mencipta</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lingkup Materi:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={editingTp.content_scope}
                  onChange={(e) => setEditingTp({ ...editingTp, content_scope: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Alokasi Jam Pelajaran (JP):</label>
                <input
                  type="number"
                  min="2"
                  max="16"
                  className={styles.textInput}
                  value={editingTp.estimated_hours}
                  onChange={(e) =>
                    setEditingTp({ ...editingTp, estimated_hours: parseInt(e.target.value, 10) || 4 })
                  }
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEditingTp(null)}>
                Batal
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSaveEditedTp}>
                <CheckCircle2 size={16} /> Simpan Perubahan & Tandai REVIEWED
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
