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
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronRight,
  Award,
  ListOrdered,
  X,
  FileCheck,
  PlusCircle,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  allocated_hours?: number;
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
  const { user } = useAuth();
  const isPrincipal = user?.role === 'Kepala Sekolah' || user?.role === 'Administrator' || user?.role === 'Kurikulum';

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

  // KOSP Registration Modal state (Khusus Kepala Sekolah)
  const [isKospModalOpen, setIsKospModalOpen] = useState(false);
  const [kospElementName, setKospElementName] = useState('');
  const [kospDescription, setKospDescription] = useState('');
  const [kospDocument, setKospDocument] = useState('Dokumen KOSP PKBM As-Salafiyah 2026/2027');
  const [kospPageRef, setKospPageRef] = useState('SK No. 421.2/012/2026');
  const [isSubmittingKosp, setIsSubmittingKosp] = useState(false);

  const activeSubject = STANDARD_SUBJECTS.find((s) => s.code === subjectCode) || STANDARD_SUBJECTS[0];

  // 1. Fetch CP Registry whenever Phase or Subject changes
  useEffect(() => {
    async function fetchCpRegistry() {
      setIsLoadingRegistry(true);
      try {
        const res = await fetch(
          `/api/v1/learning/pedagogy/cp?phase=${phase}&subject=${encodeURIComponent(activeSubject.name)}&verification=ALL`
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

  // 3. Handler: Daftarkan Naskah KOSP (Otoritas Kepala Sekolah)
  const handleRegisterSchoolKosp = async () => {
    if (!kospElementName.trim() || !kospDescription.trim()) {
      showToast('error', 'Nama elemen CP dan naskah rumusan KOSP wajib diisi.');
      return;
    }

    setIsSubmittingKosp(true);
    try {
      const res = await fetch('/api/v1/learning/pedagogy/cp/school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: activeSubject.name,
          subject_code: subjectCode,
          phase: phase,
          target_grades: gradeLevel,
          element_name: kospElementName,
          description: kospDescription,
          source_document: kospDocument,
          document_page_ref: kospPageRef,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengesahkan naskah KOSP satuan pendidikan.');
      }

      showToast('success', 'Naskah KOSP berhasil disahkan & terdaftar di registry sekolah!');
      setIsKospModalOpen(false);
      setKospElementName('');
      setKospDescription('');

      // Refresh registry
      const regRes = await fetch(
        `/api/v1/learning/pedagogy/cp?phase=${phase}&subject=${encodeURIComponent(activeSubject.name)}&verification=ALL`
      );
      const regJson = await regRes.json();
      if (regJson.success && regJson.data) {
        setRegistryData(regJson.data);
        if (regJson.data.elements.length > 0) {
          setSelectedCp(regJson.data.elements[regJson.data.elements.length - 1]);
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan saat menyimpan naskah KOSP.');
    } finally {
      setIsSubmittingKosp(false);
    }
  };

  // 4. Handler: Sintesis Usulan TP & ATP via NVIDIA NIM
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

  // 5. Handler: Simpan Hasil Edit TP (Review)
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

      showToast('success', `TP ${editingTp.code} berhasil diverifikasi dan ditandai REVIEWED!`);
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

  // 6. Handler: Pengesahan & Publikasi Resmi TP & ATP
  const handlePublishAll = async () => {
    const allTps = [
      ...(atpMatrix?.odd_semester.items || []),
      ...(atpMatrix?.even_semester.items || []),
    ];

    const tpIds = allTps.map((t) => t.tp_id || t.id).filter(Boolean);

    if (tpIds.length === 0) {
      showToast('error', 'Tidak ada butir TP yang dapat disahkan. Silakan rumuskan usulan TP terlebih dahulu.');
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
        throw new Error(json.error || 'Gagal mengesahkan alur TP & ATP.');
      }

      showToast(
        'success',
        isPrincipal
          ? 'Perangkat Pembelajaran resmi disahkan dan diratifikasi dengan legalitas Kepala Sekolah!'
          : 'Alur TP & ATP berhasil dipublikasikan secara resmi!'
      );

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

  const totalPlannedHours = allItems.reduce(
    (sum, item) => sum + (parseInt(item.allocated_hours || item.estimated_hours, 10) || 0),
    0
  );

  const publishedCount = allItems.filter((t) => t.publication_status === 'PUBLISHED').length;

  return (
    <div className={styles.container}>
      {/* ── 1. Breadcrumb (Adaptif Role) ── */}
      <nav className={styles.breadcrumb}>
        <Link href="/dashboard">Dashboard</Link>
        <ChevronRight size={13} />
        <Link href={isPrincipal ? "/dashboard/learning" : "/dashboard/teacher"}>
          {isPrincipal ? "Pembelajaran" : "Workstation Guru"}
        </Link>
        <ChevronRight size={13} />
        <span className={styles.breadcrumbCurrent}>
          {isPrincipal ? "Supervisi & Tata Kelola KOSP (CP & ATP)" : "Kurikulum Merdeka (CP, TP & ATP)"}
        </span>
      </nav>

      {/* ── 2. Toast Alert ── */}
      {toastMessage && (
        <div
          className={`${styles.toast} ${
            toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── 3. Executive Workspace Header (Adaptif Role KS vs Guru) ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={`${styles.headerIconBadge} ${isPrincipal ? styles.principalHeaderBadge : ''}`}>
            {isPrincipal ? <ShieldCheck size={22} /> : <Compass size={22} />}
          </div>
          <div className={styles.headerTitleArea}>
            <div className={`${styles.workspaceTag} ${isPrincipal ? styles.principalTag : ''}`}>
              <span className={styles.pulseGreen} />
              <span>
                {isPrincipal
                  ? 'SUPERVISI AKADEMIK • KEPALA SEKOLAH'
                  : 'TEACHER WORKSTATION • BSKAP 033/H/KR/2024'}
              </span>
            </div>
            <h1 className={styles.pageTitle}>
              {isPrincipal
                ? 'Supervisi & Pengesahan Kurikulum Merdeka (KOSP)'
                : 'Kurikulum Merdeka (CP, TP & ATP)'}
            </h1>
            <p className={styles.pageSubtitle}>
              {isPrincipal
                ? 'Panel pengesahan naskah KOSP, verifikasi Alur Tujuan Pembelajaran (ATP) guru, dan audit keselarasan Kalender Pendidikan.'
                : 'Registry resmi Capaian Pembelajaran, dekonstruksi AI NVIDIA NIM, dan sinkronisasi Kalender Pendidikan.'}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link href="/dashboard/academic-years/calendar" className={styles.actionBtnSecondary}>
            <Calendar size={13} />
            <span>Kalender Kaldik</span>
          </Link>

          {isPrincipal ? (
            <>
              <button
                className={styles.actionBtnPrimary}
                onClick={() => setIsKospModalOpen(true)}
                title="Mendaftarkan rumusan KOSP resmi satuan pendidikan"
              >
                <PlusCircle size={13} />
                <span>+ Daftarkan KOSP</span>
              </button>

              {allItems.length > 0 && (
                <button
                  className={styles.actionBtnSuccess}
                  onClick={handlePublishAll}
                  disabled={isPublishing}
                >
                  <CheckCheck size={13} />
                  <span>{isPublishing ? 'Mengesahkan...' : 'Sahkan & Ratifikasi (SK KS)'}</span>
                </button>
              )}

              <button
                className={styles.actionBtnAi}
                onClick={() => handleSynthesizeAi(false)}
                disabled={!selectedCp?.is_eligible_source || isSynthesizing}
                title="Uji coba dekonstruksi AI NVIDIA NIM untuk telaah kurikulum"
              >
                {isSynthesizing ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>{isSynthesizing ? 'Memproses...' : 'Uji Simulasi AI'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.actionBtnAi}
                onClick={() => handleSynthesizeAi(false)}
                disabled={!selectedCp?.is_eligible_source || isSynthesizing}
                title={!selectedCp?.is_eligible_source ? 'Pilih CP resmi terverifikasi terlebih dahulu' : 'Dekonstruksi CP menjadi TP dengan AI'}
              >
                {isSynthesizing ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>{isSynthesizing ? 'Mendekonstruksi...' : 'Sintesis TP & ATP (AI)'}</span>
              </button>

              {allItems.length > 0 && (
                <button
                  className={styles.actionBtnSuccess}
                  onClick={handlePublishAll}
                  disabled={isPublishing}
                >
                  <FileCheck size={13} />
                  <span>{isPublishing ? 'Menerbitkan...' : 'Publikasikan Perangkat'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── 4. Unified Scope & Filter Toolbar ── */}
      <section className={styles.workstationToolbar}>
        <div className={styles.toolbarFilterGroup}>
          <div className={styles.filterIconPill}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>

          <div className={styles.filterFieldItem}>
            <label htmlFor="select-phase" className={styles.filterTitle}>Jenjang / Fase:</label>
            <select
              id="select-phase"
              className={styles.toolbarSelect}
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
            >
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterFieldItem}>
            <label htmlFor="select-subject" className={styles.filterTitle}>Mata Pelajaran:</label>
            <select
              id="select-subject"
              className={styles.toolbarSelect}
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
            >
              {STANDARD_SUBJECTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterFieldItem}>
            <label htmlFor="select-grade" className={styles.filterTitle}>Kelas Target:</label>
            <select
              id="select-grade"
              className={styles.toolbarSelect}
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
        </div>

        <div className={styles.academicYearBadge}>
          <Calendar size={13} />
          <span>Tahun Ajaran: {academicYear}</span>
        </div>
      </section>

      {/* ── 5. CP Source Registry Status Callout Banner ── */}
      {selectedCp ? (
        <section
          className={`${styles.calloutBanner} ${
            selectedCp.verification_status === 'NATIONAL_VERIFIED'
              ? styles.calloutBannerVerified
              : selectedCp.verification_status === 'SCHOOL_VERIFIED'
              ? styles.calloutBannerSchool
              : styles.calloutBannerEmpty
          }`}
        >
          <div className={styles.calloutLeft}>
            <div
              className={`${styles.calloutIconPill} ${
                selectedCp.verification_status === 'NATIONAL_VERIFIED'
                  ? styles.calloutIconVerified
                  : selectedCp.verification_status === 'SCHOOL_VERIFIED'
                  ? styles.calloutIconSchool
                  : styles.calloutIconEmpty
              }`}
            >
              <ShieldCheck size={20} />
            </div>
            <div className={styles.calloutContent}>
              <div className={styles.calloutHeaderRow}>
                <span
                  className={`${styles.calloutBadge} ${
                    selectedCp.verification_status === 'NATIONAL_VERIFIED'
                      ? styles.calloutBadgeVerified
                      : selectedCp.verification_status === 'SCHOOL_VERIFIED'
                      ? styles.calloutBadgeSchool
                      : styles.calloutBadgeEmpty
                  }`}
                >
                  {selectedCp.verification_status}
                </span>
                <span className={styles.calloutTitle}>
                  {selectedCp.element_name} ({selectedCp.target_grades})
                </span>
              </div>
              <p className={styles.calloutDesc}>{selectedCp.description}</p>
              <span className={styles.calloutMeta}>
                Sumber: {selectedCp.source_document || 'Regulasi Kemendikdasmen BSKAP 033/H/KR/2024'} ({selectedCp.source_version})
                {selectedCp.document_page_ref ? ` • Rujukan: ${selectedCp.document_page_ref}` : ''}
              </span>
            </div>
          </div>

          <div className={styles.calloutActions}>
            <button
              className={styles.actionBtnSecondary}
              onClick={() => handleSynthesizeAi(true)}
              disabled={!selectedCp.is_eligible_source || isSynthesizing}
              title="Regenerasi draf usulan TP tanpa merusak data terbitan"
            >
              <RefreshCw size={13} />
              <span>Regenerasi Draf</span>
            </button>
          </div>
        </section>
      ) : (
        <section className={`${styles.calloutBanner} ${styles.calloutBannerEmpty}`}>
          <div className={styles.calloutLeft}>
            <div className={`${styles.calloutIconPill} ${styles.calloutIconEmpty}`}>
              <AlertTriangle size={20} />
            </div>
            <div className={styles.calloutContent}>
              <div className={styles.calloutHeaderRow}>
                <span className={`${styles.calloutBadge} ${styles.calloutBadgeEmpty}`}>
                  REGISTRY STATUS: BELUM TERSEDIA
                </span>
                <span className={styles.calloutTitle}>
                  Naskah Capaian Pembelajaran Belum Terdaftar di Registry
                </span>
              </div>
              <p className={styles.calloutDesc}>
                Belum ditemukan naskah CP terverifikasi untuk <strong>{activeSubject.name}</strong> pada <strong>{phase}</strong>. Sesuai prinsip tata kelola data Kemendikdasmen, AI tidak diperbolehkan mengarang rumusan CP mandiri.
              </p>
              <span className={styles.calloutMeta}>
                {isPrincipal
                  ? 'Sebagai Kepala Sekolah, Anda dapat mendaftarkan dokumen KOSP resmi satuan pendidikan secara langsung menggunakan tombol di sebelah kanan.'
                  : 'Silakan pilih mata pelajaran lain yang telah terdaftar, atau koordinasikan dengan Kepala Sekolah untuk mendaftarkan dokumen KOSP.'}
              </span>
            </div>
          </div>

          <div className={styles.calloutActions}>
            {isPrincipal ? (
              <button
                type="button"
                className={styles.actionBtnPrimary}
                onClick={() => setIsKospModalOpen(true)}
              >
                <PlusCircle size={13} />
                <span>+ Daftarkan KOSP</span>
              </button>
            ) : (
              <Link href="/dashboard/settings" className={styles.actionBtnSecondary}>
                <span>Panduan Dokumen KOSP</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── 6. Executive 4-Metric KPI Grid ── */}
      <section className={styles.metricGrid}>
        {/* Card 1: Minggu Efektif (Kaldik) */}
        <div className={styles.metricCard} style={{ '--card-color': '#10b981' } as React.CSSProperties}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconPill} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <Calendar size={16} />
            </div>
            <span className={styles.metricStatusBadge} data-status="live">
              <span className={styles.livePulse} />
              Kaldik Live
            </span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue} style={{ color: '#059669' }}>35 Pekan</div>
            <div className={styles.metricLabel}>
              {isPrincipal ? 'Kapasitas MEB Satuan Pendidikan' : 'Minggu Efektif Belajar (MEB)'}
            </div>
            <div className={styles.metricSubLabel}>Kapasitas Kaldik Semester 1 &amp; 2</div>
          </div>
        </div>

        {/* Card 2: Total Jam Terencana (JP) */}
        <div className={styles.metricCard} style={{ '--card-color': '#0284c7' } as React.CSSProperties}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconPill} style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <Clock size={16} />
            </div>
            <span className={styles.metricStatusBadge} data-status="info">
              Alokasi JP
            </span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue} style={{ color: '#0284c7' }}>{totalPlannedHours} JP</div>
            <div className={styles.metricLabel}>Total Jam Terencana</div>
            <div className={styles.metricSubLabel}>Distribusi alur jam tatap muka</div>
          </div>
        </div>

        {/* Card 3: Total TP Terpetakan */}
        <div className={styles.metricCard} style={{ '--card-color': '#7c3aed' } as React.CSSProperties}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconPill} style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' }}>
              <Award size={16} />
            </div>
            <span className={styles.metricStatusBadge} data-status="normal">
              {allItems.length} Butir
            </span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue} style={{ color: '#7c3aed' }}>{allItems.length} Butir</div>
            <div className={styles.metricLabel}>
              {isPrincipal ? 'Target Kompetensi Guru' : 'Total TP Terpetakan'}
            </div>
            <div className={styles.metricSubLabel}>Hasil dekonstruksi Taksonomi Bloom</div>
          </div>
        </div>

        {/* Card 4: Rasio Publikasi & Validasi */}
        <div className={styles.metricCard} style={{ '--card-color': publishedCount > 0 ? '#059669' : '#d97706' } as React.CSSProperties}>
          <div className={styles.metricTopRow}>
            <div
              className={styles.metricIconPill}
              style={{
                background: publishedCount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: publishedCount > 0 ? '#059669' : '#d97706',
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <span className={styles.metricStatusBadge} data-status={publishedCount > 0 ? 'good' : 'warn'}>
              {publishedCount === allItems.length && allItems.length > 0
                ? '100% Sah'
                : publishedCount > 0
                ? 'Sebagian Sah'
                : 'Draf Awal'}
            </span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue} style={{ color: publishedCount > 0 ? '#059669' : '#d97706' }}>
              {publishedCount} / {allItems.length}
            </div>
            <div className={styles.metricLabel}>
              {isPrincipal ? 'Kesiapan Pengesahan KS' : 'Status Publikasi Resmi'}
            </div>
            <div className={styles.metricSubLabel}>
              {publishedCount === allItems.length && allItems.length > 0
                ? 'Semua TP siap dihubungkan ke RPP'
                : isPrincipal
                ? 'Menunggu pengesahan resmi Kepala Sekolah'
                : 'Menunggu publikasi resmi perangkat'}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Tabs Navigation Strip ── */}
      <nav className={styles.tabsContainer} aria-label="Navigasi Kurikulum">
        <button
          className={`${styles.tabBtn} ${activeTab === 'CP' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('CP')}
        >
          <BookOpen size={15} />
          <span>{isPrincipal ? '1. Naskah KOSP Satuan Pendidikan' : '1. Capaian Pembelajaran (CP)'}</span>
          <span className={styles.tabCountBadge}>{registryData?.elements_count || 0}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'TP' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('TP')}
        >
          <Award size={15} />
          <span>{isPrincipal ? '2. Telaah Usulan TP Guru' : '2. Tujuan Pembelajaran (TP)'}</span>
          <span className={styles.tabCountBadge}>{allItems.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'ATP' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ATP')}
        >
          <ListOrdered size={15} />
          <span>3. Alur Pembelajaran (ATP) &amp; Kaldik</span>
        </button>
      </nav>

      {/* ── 8. Tab Content Views ── */}

      {/* TAB 1: Capaian Pembelajaran (CP / KOSP) */}
      {activeTab === 'CP' && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Layers size={17} style={{ color: '#0284c7' }} />
              {isPrincipal
                ? `Naskah KOSP Terdaftar (${registryData?.elements_count || 0} Elemen)`
                : `Elemen Capaian Pembelajaran Terdaftar (${registryData?.elements_count || 0} Elemen)`}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isPrincipal && (
                <button
                  type="button"
                  className={styles.actionBtnPrimary}
                  style={{ padding: '0.28rem 0.65rem', fontSize: '0.72rem' }}
                  onClick={() => setIsKospModalOpen(true)}
                >
                  <PlusCircle size={12} />
                  <span>+ Tambah Elemen KOSP</span>
                </button>
              )}
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Fase: {phase} • {activeSubject.name}
              </span>
            </div>
          </div>

          {isLoadingRegistry ? (
            <div className={styles.emptyState}>
              <RefreshCw size={28} className="animate-spin" style={{ color: '#0284c7', opacity: 0.7 }} />
              <p className={styles.emptyStateDesc}>Memuat naskah Capaian Pembelajaran dari registry...</p>
            </div>
          ) : registryData && registryData.elements.length > 0 ? (
            <div className={styles.cpElementList}>
              {registryData.elements.map((el) => {
                const isSelected = el.id === selectedCp?.id;
                return (
                  <div
                    key={el.id}
                    className={`${styles.cpElementItem} ${isSelected ? styles.cpElementItemSelected : ''}`}
                    onClick={() => setSelectedCp(el)}
                  >
                    <div className={styles.cpElementTop}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span
                          className={`${styles.calloutBadge} ${
                            el.verification_status === 'NATIONAL_VERIFIED'
                              ? styles.calloutBadgeVerified
                              : el.verification_status === 'SCHOOL_VERIFIED'
                              ? styles.calloutBadgeSchool
                              : styles.calloutBadgeEmpty
                          }`}
                        >
                          {el.verification_status}
                        </span>
                        <span className={styles.cpElementName}>{el.element_name}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {el.target_grades}
                      </span>
                    </div>
                    <p className={styles.cpElementDesc}>{el.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <BookOpen size={36} style={{ color: '#94a3b8', opacity: 0.5 }} />
              <h3 className={styles.emptyStateTitle}>Belum Ada Naskah CP Terdaftar</h3>
              <p className={styles.emptyStateDesc}>
                {isPrincipal
                  ? 'Belum ditemukan naskah CP untuk mata pelajaran ini. Silakan klik tombol "+ Tambah Elemen KOSP" untuk mendaftarkan naskah resmi sekolah.'
                  : 'Belum ditemukan naskah Capaian Pembelajaran resmi untuk mata pelajaran ini pada ' + phase + '.'}
              </p>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Tujuan Pembelajaran (TP) Grid */}
      {activeTab === 'TP' && (
        <section className={styles.tpGrid}>
          {allItems.length > 0 ? (
            allItems.map((item, idx) => (
              <div key={item.id || item.tp_id || idx} className={styles.tpCard}>
                <div className={styles.tpHeader}>
                  <div className={styles.tpBadgeGroup}>
                    <span className={styles.tpCode}>{item.code}</span>
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
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0284c7' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
                      {item.allocated_hours || item.estimated_hours} JP
                    </span>
                    <button
                      className={styles.actionBtnSecondary}
                      style={{ padding: '0.28rem 0.6rem', fontSize: '0.72rem' }}
                      onClick={() => setEditingTp(item)}
                    >
                      <Edit3 size={12} />
                      <span>{isPrincipal ? 'Telaah & Catatan' : 'Edit / Telaah'}</span>
                    </button>
                  </div>
                </div>

                <p className={styles.tpStatement}>{item.statement}</p>

                <div style={{ marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Lingkup Materi: <strong>{item.content_scope}</strong>
                  </span>
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
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Indikator Ketercapaian (IKTP):
                    </span>
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
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <Sparkles size={38} style={{ color: '#7c3aed', opacity: 0.6 }} />
                <h3 className={styles.emptyStateTitle}>
                  {isPrincipal ? 'Belum Ada Usulan TP Guru Terpetakan' : 'Belum Ada Usulan Tujuan Pembelajaran'}
                </h3>
                <p className={styles.emptyStateDesc}>
                  {isPrincipal
                    ? 'Guru pengampu mata pelajaran belum merumuskan butir-butir TP. Anda dapat memicu simulasi perumusan AI atau meminta guru menyusun alur perangkat ajar.'
                    : 'Gunakan tombol Sintesis TP & ATP (AI) di atas untuk meminta AI NVIDIA NIM membedah CP terverifikasi menjadi rumusan TP operasional.'}
                </p>
                <button
                  className={styles.actionBtnAi}
                  onClick={() => handleSynthesizeAi(false)}
                  disabled={!selectedCp?.is_eligible_source || isSynthesizing}
                  style={{ marginTop: '0.5rem' }}
                >
                  <Sparkles size={14} />
                  <span>{isPrincipal ? 'Jalankan Uji Simulasi AI' : 'Mulai Sintesis TP Sekarang'}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Alur Pembelajaran (ATP) & Kaldik */}
      {activeTab === 'ATP' && (
        <section className={styles.atpGrid}>
          {/* Semester Ganjil */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <h3 className={styles.cardTitle}>Semester Ganjil (Juli – Desember)</h3>
              </div>
              <span className={styles.calloutBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                {atpMatrix?.odd_semester.total_hours || 0} JP Terencana (18 MEB)
              </span>
            </div>

            {atpMatrix?.odd_semester.items && atpMatrix.odd_semester.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {atpMatrix.odd_semester.items.map((flow, idx) => (
                  <div key={flow.id || flow.atp_id || idx} className={styles.atpItem}>
                    <div>
                      <span className={styles.atpOrderBadge}>
                        #{flow.sequence_order || idx + 1} {flow.code}
                      </span>
                      <span className={styles.atpText}>{flow.statement}</span>
                    </div>
                    <span className={styles.atpHoursBadge}>
                      {flow.allocated_hours || flow.estimated_hours} JP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                Belum ada butir alur TP yang dipetakan di semester ganjil.
              </p>
            )}
          </div>

          {/* Semester Genap */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                <h3 className={styles.cardTitle}>Semester Genap (Januari – Juni)</h3>
              </div>
              <span className={styles.calloutBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                {atpMatrix?.even_semester.total_hours || 0} JP Terencana (17 MEB)
              </span>
            </div>

            {atpMatrix?.even_semester.items && atpMatrix.even_semester.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {atpMatrix.even_semester.items.map((flow, idx) => (
                  <div key={flow.id || flow.atp_id || idx} className={styles.atpItem}>
                    <div>
                      <span className={styles.atpOrderBadge}>
                        #{flow.sequence_order || idx + 1} {flow.code}
                      </span>
                      <span className={styles.atpText}>{flow.statement}</span>
                    </div>
                    <span className={styles.atpHoursBadge}>
                      {flow.allocated_hours || flow.estimated_hours} JP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                Belum ada butir alur TP yang dipetakan di semester genap.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 9. Modal Daftarkan Naskah KOSP (Khusus Kepala Sekolah) ── */}
      {isKospModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Daftarkan Naskah KOSP Resmi Satuan Pendidikan</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setIsKospModalOpen(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(79, 70, 229, 0.06)', borderRadius: '8px', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 700 }}>
                Legalitas Kepala Sekolah • SK Satuan Pendidikan
              </span>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Naskah ini akan terdaftar sebagai <strong>SCHOOL_VERIFIED</strong> resmi sekolah dan menjadi basis penyusunan TP oleh guru pengampu.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mata Pelajaran:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={activeSubject.name}
                  disabled
                  style={{ opacity: 0.8 }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Jenjang / Fase:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={`${phase} (${gradeLevel})`}
                  disabled
                  style={{ opacity: 0.8 }}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nama Elemen Capaian Pembelajaran (CP):</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Contoh: Pemahaman IPAS (Sains dan Sosial) / Keterampilan Proses"
                value={kospElementName}
                onChange={(e) => setKospElementName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Teks Lengkap Rumusan Naskah KOSP:</label>
              <textarea
                className={styles.textareaInput}
                placeholder="Masukkan rumusan naskah Capaian Pembelajaran resmi satuan pendidikan..."
                style={{ minHeight: '95px' }}
                value={kospDescription}
                onChange={(e) => setKospDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dokumen KOSP Satuan Pendidikan:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={kospDocument}
                  onChange={(e) => setKospDocument(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nomor SK / Halaman Rujukan KOSP:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={kospPageRef}
                  onChange={(e) => setKospPageRef(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.actionBtnSecondary}
                onClick={() => setIsKospModalOpen(false)}
                disabled={isSubmittingKosp}
              >
                Batal
              </button>
              <button
                className={styles.actionBtnPrimary}
                onClick={handleRegisterSchoolKosp}
                disabled={isSubmittingKosp}
              >
                {isSubmittingKosp ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{isSubmittingKosp ? 'Mengesahkan...' : 'Sahkan Naskah KOSP (SK KS)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. Modal Edit / Telaah TP ── */}
      {editingTp && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isPrincipal ? `Supervisi & Telaah: ${editingTp.code}` : `Sunting & Telaah: ${editingTp.code}`}
              </h3>
              <button className={styles.closeBtn} onClick={() => setEditingTp(null)} aria-label="Tutup">
                <X size={18} />
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
                  className={styles.modalSelect}
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

            <div className={styles.modalFooter}>
              <button className={styles.actionBtnSecondary} onClick={() => setEditingTp(null)}>
                Batal
              </button>
              <button className={styles.actionBtnPrimary} onClick={handleSaveEditedTp}>
                <CheckCircle2 size={14} />
                <span>
                  {isPrincipal ? 'Sahkan Perubahan & Tandai REVIEWED' : 'Simpan Perubahan & Tandai REVIEWED'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
