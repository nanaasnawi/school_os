'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './modul-ajar.module.css';

interface KaldikBudget {
  academic_year: string;
  semester: string;
  meb_weeks: number;
  heb_days: number;
  weekly_hours: number;
  total_capacity_jp: number;
  allocated_jp: number;
  remaining_available_jp: number;
  allocation_percentage: number;
}

interface DifferentiationStrategy {
  content?: Array<{ style: string; description: string; resources: string[] }>;
  process?: { needs_guidance: string; regular_students: string; advanced_students: string };
  product?: Array<{ format: string; target_students?: string; rubric_focus: string }>;
}

interface LearningActivity {
  meeting_number: number;
  topic: string;
  allocated_time_minutes: number;
  opening: { duration_minutes: number; steps: string[] };
  core: { duration_minutes: number; steps: string[] };
  closing: { duration_minutes: number; steps: string[] };
}

interface ModulAjarItem {
  id: string;
  learning_objective_id: string;
  tp_code?: string;
  tp_statement?: string;
  tp_competency?: string;
  tp_content_scope?: string;
  tp_publication_status?: string;
  academic_year: string;
  semester: string;
  title: string;
  grade_level: string;
  subject_code: string;
  subject_name: string;
  phase: string;
  allocated_hours: number;
  total_meetings: number;
  hours_per_meeting: number;
  pancasila_profiles: string[];
  meaningful_understanding: string;
  trigger_questions: string[];
  differentiation_strategies: DifferentiationStrategy;
  learning_activities: LearningActivity[];
  assessment_plan: { diagnostic?: string; formative?: string; summative?: string };
  lkpd_attachments: Array<{ title: string; instructions: string; scaffolding_notes?: string }>;
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  suspension_reason?: string | null;
  version: number;
  is_ai_generated: boolean;
  created_at: string;
}

interface PublishedTp {
  id: string;
  code: string;
  competency: string;
  content_scope: string;
  statement: string;
  publication_status: string;
  estimated_hours: number;
  subject_name?: string;
}

export default function ModulAjarPage() {
  const { user } = useAuth();
  const isPrincipal = user?.role === 'Kepala Sekolah' || user?.role?.toLowerCase().includes('kepala');

  const [modulList, setModulList] = useState<ModulAjarItem[]>([]);
  const [publishedTps, setPublishedTps] = useState<PublishedTp[]>([]);
  const [subjectsList, setSubjectsList] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [budget, setBudget] = useState<KaldikBudget | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<string>('ODD');
  const [selectedSubject, setSelectedSubject] = useState<string>('401000000');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isSynthesizeOpen, setIsSynthesizeOpen] = useState<boolean>(false);
  const [selectedDetailModul, setSelectedDetailModul] = useState<ModulAjarItem | null>(null);
  const [detailTab, setDetailTab] = useState<'IDENTITY' | 'DIFF' | 'ACTIVITIES' | 'ASSESSMENT'>('IDENTITY');

  // Synthesis Form
  const [synTpId, setSynTpId] = useState<string>('');
  const [synHours, setSynHours] = useState<number>(6);
  const [synMeetings, setSynMeetings] = useState<number>(2);
  const [synHoursPerMeeting, setSynHoursPerMeeting] = useState<number>(3);
  const [synNotes, setSynNotes] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synError, setSynError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load Subjects Dynamically
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/v1/academic/subjects');
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data.subjects || [];
          setSubjectsList(list);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Kaldik Budget
      const budgetRes = await fetch(
        `/api/v1/learning/pedagogy/modul-ajar/kaldik-budget?academic_year=${academicYear}&semester=${selectedSemester}&subject_code=${selectedSubject}`
      );
      if (budgetRes.ok) {
        const bData = await budgetRes.json();
        if (bData.success) setBudget(bData.budget);
      }

      // 2. Fetch Modul Ajar List
      const modulRes = await fetch(
        `/api/v1/learning/pedagogy/modul-ajar?academic_year=${academicYear}&semester=${selectedSemester}&subject_code=${selectedSubject}&status=${selectedStatus}`
      );
      if (modulRes.ok) {
        const mData = await modulRes.json();
        if (mData.success) setModulList(mData.modul_ajar || []);
      }

      // 3. Fetch Published TPs for Synthesis
      const atpRes = await fetch('/api/v1/learning/pedagogy/atp');
      if (atpRes.ok) {
        const atpData = await atpRes.json();
        const allTps: PublishedTp[] = [];
        if (atpData.atp_matrix?.odd_semester?.flows) {
          allTps.push(...atpData.atp_matrix.odd_semester.flows);
        }
        if (atpData.atp_matrix?.even_semester?.flows) {
          allTps.push(...atpData.atp_matrix.even_semester.flows);
        }
        // Filter strictly for PUBLISHED
        const publishedOnly = allTps.filter(
          (tp) => tp.publication_status === 'PUBLISHED'
        );
        setPublishedTps(publishedOnly);
        if (publishedOnly.length > 0 && !synTpId) {
          setSynTpId(publishedOnly[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading Modul Ajar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [academicYear, selectedSemester, selectedSubject, selectedStatus]);

  // Supervisi Modul Ajar oleh Kepala Sekolah
  const handleSupervise = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/learning/pedagogy/modul-ajar/${id}/supervise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          supervisor_id: user?.id,
          supervisor_name: user?.full_name || 'Kepala Sekolah',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 5000);
        await loadData();
      } else {
        alert(data.error || 'Gagal memproses supervisi modul ajar.');
      }
    } catch (err) {
      console.error('Error supervising modul ajar:', err);
    }
  };

  // Handle AI Synthesis
  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSynError(null);

    if (!synTpId) {
      setSynError('Silakan pilih Tujuan Pembelajaran (TP) yang berstatus PUBLISHED.');
      return;
    }

    if (budget && synHours > budget.remaining_available_jp) {
      setSynError(
        `Alokasi waktu (${synHours} JP) melampaui sisa kapasitas efektif semester (${budget.remaining_available_jp} JP tersisa dari ${budget.total_capacity_jp} JP Kaldik).`
      );
      return;
    }

    try {
      setIsSynthesizing(true);
      const chosenTp = publishedTps.find((t) => t.id === synTpId);

      const res = await fetch('/api/v1/learning/pedagogy/modul-ajar/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_objective_id: synTpId,
          academic_year: academicYear,
          semester: selectedSemester,
          grade_level: 'Kelas 5',
          subject_name: chosenTp?.subject_name || 'IPAS',
          subject_code: selectedSubject,
          phase: 'FASE_C',
          allocated_hours: Number(synHours),
          total_meetings: Number(synMeetings),
          hours_per_meeting: Number(synHoursPerMeeting),
          user_instructions: synNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Gagal melakukan sintesis AI.');
      }

      setIsSynthesizeOpen(false);
      setActionSuccess('Modul Ajar berhasil dirancang oleh NVIDIA NIM dan disimpan sebagai draf.');
      setTimeout(() => setActionSuccess(null), 5000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan sintesis AI';
      setSynError(msg);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Handle Activate Modul Ajar
  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/learning/pedagogy/modul-ajar/${id}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || data.error || 'Gagal mengaktifkan modul ajar.');
        return;
      }
      setActionSuccess('Modul Ajar berhasil disahkan dan diaktifkan untuk kegiatan belajar mengajar!');
      setTimeout(() => setActionSuccess(null), 5000);
      if (selectedDetailModul && selectedDetailModul.id === id) {
        setSelectedDetailModul(data.modul_ajar);
      }
      await loadData();
    } catch (err) {
      console.error('Error activating modul ajar:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Hero Header ── */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            {isPrincipal ? (
              <span style={{ background: '#7e22ce', color: '#f3e8ff' }}>
                👑 SUPERVISI KOSP / RPP • KEPALA SEKOLAH
              </span>
            ) : (
              <span>Fase 3: RPP / Modul Ajar Generator &amp; Hub</span>
            )}
          </div>
          <h1 className={styles.heroTitle}>
            {isPrincipal ? 'Supervisi Dokumen Modul Ajar (RPP Merdeka)' : 'Workstation Modul Ajar (RPP Merdeka)'}
          </h1>
          <p className={styles.heroSubtitle}>
            {isPrincipal
              ? 'Pemeriksaan keselarasan alokasi waktu Kaldik MEB, validasi diferensiasi proses peserta didik, dan pengesahan resmi Modul Ajar seluruh pendidik satuan pendidikan.'
              : 'Perencanaan pembelajaran berdiferensiasi (Konten, Proses: VAK/Scaffolding, Produk) yang tersinkronisasi penuh dengan alokasi Minggu Efektif Kaldik & Tujuan Pembelajaran (TP) berstatus PUBLISHED.'}
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            onClick={() => {
              setSynError(null);
              setIsSynthesizeOpen(true);
            }}
            className={styles.btnPrimary}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Sintesis Modul AI (NVIDIA NIM)
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#dcfce7',
          color: '#15803d',
          borderRadius: '0.75rem',
          fontWeight: 600,
          fontSize: '0.88rem',
          border: '1px solid #86efac'
        }}>
          ✓ {actionSuccess}
        </div>
      )}

      {/* ── Kaldik MEB Alignment Bar (Critical Directive 1) ── */}
      {budget && (
        <div className={styles.kaldikBar}>
          <div className={styles.kaldikHeader}>
            <div className={styles.kaldikTitle}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" color="#0284c7">
                <rect x="3" y="4" width="14" height="13" rx="2" />
                <path d="M16 2v4M4 2v4M3 8h14" />
              </svg>
              <span>Sinkronisasi Alokasi Waktu Kalender Pendidikan (Kaldik)</span>
              <span className={styles.kaldikBadge}>
                {budget.semester === 'ODD' ? 'Semester Ganjil' : 'Semester Genap'} TA {budget.academic_year}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Standar Mata Pelajaran: {budget.weekly_hours} JP / Pekan
            </div>
          </div>

          <div className={styles.kaldikStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Minggu Efektif (MEB)</span>
              <span className={styles.statValue}>{budget.meb_weeks} Pekan ({budget.heb_days} Hari)</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Kapasitas JP</span>
              <span className={styles.statValue}>{budget.total_capacity_jp} JP</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Terpakai (Modul Aktif/Draf)</span>
              <span className={styles.statValue} style={{ color: '#0284c7' }}>{budget.allocated_jp} JP</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Sisa Kuota Efektif</span>
              <span className={styles.statValue} style={{ color: budget.remaining_available_jp < 10 ? '#ef4444' : '#10b981' }}>
                {budget.remaining_available_jp} JP Tersisa
              </span>
            </div>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressLabelRow}>
              <span>Keterisian Jam Pembelajaran Semester</span>
              <span style={{ fontWeight: 700 }}>{budget.allocation_percentage}% dari batas Kaldik</span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={`${styles.progressBarFill} ${budget.allocation_percentage >= 100 ? styles.progressExceeded : ''}`}
                style={{ width: `${Math.min(100, budget.allocation_percentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Filters & Controls ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester:</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ODD">Semester Ganjil (18 MEB)</option>
            <option value="EVEN">Semester Genap (17 MEB)</option>
          </select>

          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mata Pelajaran:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={styles.selectInput}
          >
            {subjectsList.length > 0 ? (
              <>
                <option value="ALL">Semua Mapel</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </>
            ) : (
              <>
                <option value="401000000">Matematika (4 JP/mg)</option>
                <option value="401900000">IPAS (5 JP/mg)</option>
                <option value="300110000">Bahasa Indonesia (4 JP/mg)</option>
                <option value="ALL">Semua Mapel</option>
              </>
            )}
          </select>

          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Siap Ajar)</option>
            <option value="DRAFT">Draf (Review)</option>
            <option value="SUSPENDED">Disuspensi (TP Ditarik)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {modulList.length} Modul Terdaftar
        </div>
      </div>

      {/* ── Modul Ajar Grid ── */}
      {loading ? (
        <div className={styles.emptyState}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Memuat Dokumen Modul Ajar...</div>
          <p style={{ color: 'var(--text-secondary)' }}>Menyelaraskan data relasional Kaldik &amp; TP.</p>
        </div>
      ) : modulList.length === 0 ? (
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" color="#94a3b8">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Belum Ada Modul Ajar untuk Filter Ini</div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 450 }}>
            Rancang Modul Ajar operasional pertama Anda dengan bantuan AI NVIDIA NIM atau sesuaikan langsung dari Tujuan Pembelajaran (TP) yang telah disahkan.
          </p>
          <button
            onClick={() => setIsSynthesizeOpen(true)}
            className={styles.btnPrimary}
            style={{ marginTop: '0.5rem' }}
          >
            ⚡ Buat Modul Ajar Sekarang
          </button>
        </div>
      ) : (
        <div className={styles.modulGrid}>
          {modulList.map((m) => (
            <div key={m.id} className={styles.modulCard}>
              <div className={styles.cardHeader}>
                <div className={styles.badgeRow}>
                  {m.status === 'ACTIVE' && (
                    <span className={styles.statusActive}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                      AKTIF / SIAP AJAR
                    </span>
                  )}
                  {m.status === 'DRAFT' && (
                    <span className={styles.statusDraft}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                      DRAF REVIEW
                    </span>
                  )}
                  {m.status === 'SUSPENDED' && (
                    <span className={styles.statusSuspended}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                      SUSPENDED (TP BELUM SAH)
                    </span>
                  )}
                  {m.is_ai_generated && <span className={styles.aiBadge}>NVIDIA NIM</span>}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {m.allocated_hours} JP ({m.total_meetings} Pertemuan)
                </span>
              </div>

              <div>
                <h3 className={styles.cardTitle}>{m.title}</h3>
                <div className={styles.cardSubtitle}>
                  <span>{m.subject_name}</span>
                  <span>•</span>
                  <span>{m.phase} / {m.grade_level}</span>
                  <span>•</span>
                  <span>{m.semester === 'ODD' ? 'Ganjil' : 'Genap'}</span>
                </div>
              </div>

              {/* Suspended Alert */}
              {m.status === 'SUSPENDED' && (
                <div className={styles.suspendedNotice}>
                  <div className={styles.suspendedNoticeTitle}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Peringatan Integritas Kurikulum: Modul Disuspensi
                  </div>
                  <div className={styles.suspendedNoticeDesc}>
                    {m.suspension_reason || 'Tujuan Pembelajaran induk telah ditarik kembali status pengesahannya.'}
                  </div>
                </div>
              )}

              {/* TP Link Badge (Critical Directive 2) */}
              <div className={styles.tpLinkBadge}>
                <span className={styles.tpCode}>{m.tp_code || 'TP INDUK'}</span>
                <span className={styles.tpStatement}>
                  {m.tp_statement || m.meaningful_understanding}
                </span>
              </div>

              {/* Differentiation Matrix Summary (Critical Directive 3) */}
              <div className={styles.diffMatrixBox}>
                <span className={styles.diffMatrixTitle}>Strategi Berdiferensiasi 3-Pilar</span>
                <div className={styles.diffPillRow}>
                  <span className={styles.diffPill}>
                    👁️ Visual ({m.differentiation_strategies?.content?.filter(c => c.style === 'Visual').length || 1})
                  </span>
                  <span className={styles.diffPill}>
                    🎧 Auditori ({m.differentiation_strategies?.content?.filter(c => c.style === 'Auditori').length || 1})
                  </span>
                  <span className={styles.diffPill}>
                    ✋ Kinestetik ({m.differentiation_strategies?.content?.filter(c => c.style === 'Kinestetik').length || 1})
                  </span>
                  <span className={styles.diffPill} style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                    🪜 Scaffolding 3-Tingkat
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {m.pancasila_profiles?.slice(0, 2).map((p, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--bg-subtle)', borderRadius: '0.35rem', color: 'var(--text-secondary)' }}>
                      {p}
                    </span>
                  ))}
                </div>

                <div className={styles.actionBtnGroup}>
                  <button
                    onClick={() => {
                      setSelectedDetailModul(m);
                      setDetailTab('IDENTITY');
                    }}
                    className={styles.btnSm}
                  >
                    Buka Dokumen
                  </button>

                  {isPrincipal && m.status !== 'ACTIVE' ? (
                    <button
                      onClick={() => handleSupervise(m.id, 'ACTIVE')}
                      className={styles.btnSm}
                      style={{ background: '#7e22ce', color: '#fff', borderColor: '#6b21a8' }}
                      title="Sahkan Modul Ajar sebagai Kepala Sekolah"
                    >
                      👑 Sahkan RPP
                    </button>
                  ) : (
                    m.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleActivate(m.id)}
                        className={`${styles.btnSm} ${styles.btnSmActive}`}
                        title={m.status === 'SUSPENDED' ? 'Aktifkan kembali setelah TP disahkan' : 'Aktifkan Modul'}
                      >
                        Aktifkan
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Synthesis Modal (NVIDIA NIM) ── */}
      {isSynthesizeOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 640 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚡ Rancang Modul Ajar AI (NVIDIA NIM)</h2>
              <button onClick={() => setIsSynthesizeOpen(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSynthesize}>
              <div className={styles.modalBody}>
                {synError && (
                  <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                    ⚠️ {synError}
                  </div>
                )}

                {/* Parent TP Selection */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Pilih Tujuan Pembelajaran (TP) Otoritatif:
                  </label>
                  {publishedTps.length === 0 ? (
                    <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#b45309', borderRadius: '0.5rem', fontSize: '0.82rem' }}>
                      ⚠️ Belum ada Tujuan Pembelajaran yang berstatus <strong>PUBLISHED</strong>. Silakan sahkan TP terlebih dahulu di halaman Kurikulum.
                    </div>
                  ) : (
                    <select
                      value={synTpId}
                      onChange={(e) => setSynTpId(e.target.value)}
                      className={styles.formSelect}
                      required
                    >
                      {publishedTps.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          [{tp.code}] {tp.competency} - {tp.content_scope} ({tp.estimated_hours} JP)
                        </option>
                      ))}
                    </select>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ✓ Sesuai Aturan: Hanya TP yang telah berstatus PUBLISHED yang dapat disintesis.
                  </span>
                </div>

                {/* Kaldik Time Budget Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Total Jam (JP):</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={synHours}
                      onChange={(e) => setSynHours(Number(e.target.value))}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Jumlah Pertemuan:</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={synMeetings}
                      onChange={(e) => setSynMeetings(Number(e.target.value))}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>JP per Pertemuan:</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={synHoursPerMeeting}
                      onChange={(e) => setSynHoursPerMeeting(Number(e.target.value))}
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {budget && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    background: synHours > budget.remaining_available_jp ? '#fee2e2' : '#f0fdf4',
                    border: `1px solid ${synHours > budget.remaining_available_jp ? '#fca5a5' : '#bbf7d0'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    color: synHours > budget.remaining_available_jp ? '#b91c1c' : '#166534'
                  }}>
                    {synHours > budget.remaining_available_jp ? (
                      <strong>❌ Peringatan Kaldik: Permintaan {synHours} JP melebihi sisa kapasitas ({budget.remaining_available_jp} JP tersisa)!</strong>
                    ) : (
                      <span>✓ Aman: {synHours} JP dapat dialokasikan (Sisa {budget.remaining_available_jp} JP dari {budget.total_capacity_jp} JP semester).</span>
                    )}
                  </div>
                )}

                {/* Custom Notes */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Catatan / Konteks Khusus Guru (Opsional):</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Tekankan kearifan lokal pertanian desa dan simulasi peran dengan barang bekas..."
                    value={synNotes}
                    onChange={(e) => setSynNotes(e.target.value)}
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsSynthesizeOpen(false)}
                  className={styles.btnSecondary}
                  disabled={isSynthesizing}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isSynthesizing || publishedTps.length === 0 || (budget ? synHours > budget.remaining_available_jp : false)}
                >
                  {isSynthesizing ? 'Menghasilkan Modul Ajar (NVIDIA NIM)...' : 'Mulai Sintesis 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Document Modal (Workstation Editor & Viewer) ── */}
      {selectedDetailModul && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{selectedDetailModul.title}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {selectedDetailModul.subject_name} • {selectedDetailModul.grade_level} • {selectedDetailModul.allocated_hours} JP ({selectedDetailModul.total_meetings} Pertemuan)
                </div>
              </div>
              <button onClick={() => setSelectedDetailModul(null)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {/* Document Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-color)',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setDetailTab('IDENTITY')}
                className={styles.btnSm}
                style={{ background: detailTab === 'IDENTITY' ? '#0284c7' : undefined, color: detailTab === 'IDENTITY' ? '#ffffff' : undefined }}
              >
                1. Identitas &amp; TP Induk
              </button>
              <button
                onClick={() => setDetailTab('DIFF')}
                className={styles.btnSm}
                style={{ background: detailTab === 'DIFF' ? '#0284c7' : undefined, color: detailTab === 'DIFF' ? '#ffffff' : undefined }}
              >
                2. Strategi Berdiferensiasi (VAK)
              </button>
              <button
                onClick={() => setDetailTab('ACTIVITIES')}
                className={styles.btnSm}
                style={{ background: detailTab === 'ACTIVITIES' ? '#0284c7' : undefined, color: detailTab === 'ACTIVITIES' ? '#ffffff' : undefined }}
              >
                3. Skenario Pembelajaran ({selectedDetailModul.learning_activities?.length || 0} Pertemuan)
              </button>
              <button
                onClick={() => setDetailTab('ASSESSMENT')}
                className={styles.btnSm}
                style={{ background: detailTab === 'ASSESSMENT' ? '#0284c7' : undefined, color: detailTab === 'ASSESSMENT' ? '#ffffff' : undefined }}
              >
                4. Asesmen &amp; LKPD
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Tab 1: Identity */}
              {detailTab === 'IDENTITY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {selectedDetailModul.status === 'SUSPENDED' && (
                    <div className={styles.suspendedNotice}>
                      <div className={styles.suspendedNoticeTitle}>
                        Modul Ajar Sedang Dalam Status Suspensi
                      </div>
                      <div className={styles.suspendedNoticeDesc}>
                        {selectedDetailModul.suspension_reason}
                      </div>
                    </div>
                  )}

                  <div className={styles.tpLinkBadge} style={{ flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span className={styles.tpCode}>{selectedDetailModul.tp_code}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                        STATUS: {selectedDetailModul.tp_publication_status || 'PUBLISHED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {selectedDetailModul.tp_statement}
                    </div>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Pemahaman Bermakna (Meaningful Understanding)</span>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {selectedDetailModul.meaningful_understanding}
                    </p>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Pertanyaan Pemantik (Trigger Questions)</span>
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.88rem' }}>
                      {selectedDetailModul.trigger_questions?.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Dimensi Profil Pelajar Pancasila</span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {selectedDetailModul.pancasila_profiles?.map((p, idx) => (
                        <span key={idx} className={styles.diffPill} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                          ★ {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Differentiation 3-Pilar */}
              {detailTab === 'DIFF' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Content Differentiation */}
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>1. Diferensiasi Konten (Modalitas Belajar)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {selectedDetailModul.differentiation_strategies?.content?.map((c, idx) => (
                        <div key={idx} style={{ padding: '0.65rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: '#0284c7', fontSize: '0.85rem' }}>Modalitas {c.style}</strong>
                          <p style={{ fontSize: '0.78rem', margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                            {c.description}
                          </p>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>Sumber:</div>
                          <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1rem', fontSize: '0.72rem' }}>
                            {c.resources?.map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Process Differentiation */}
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>2. Diferensiasi Proses (Sintaks Scaffolding)</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ padding: '0.6rem 0.75rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                        <strong style={{ color: '#b45309' }}>Kelompok Butuh Bimbingan: </strong>
                        {selectedDetailModul.differentiation_strategies?.process?.needs_guidance}
                      </div>
                      <div style={{ padding: '0.6rem 0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                        <strong style={{ color: '#166534' }}>Kelompok Siswa Reguler: </strong>
                        {selectedDetailModul.differentiation_strategies?.process?.regular_students}
                      </div>
                      <div style={{ padding: '0.6rem 0.75rem', background: '#e0e7ff', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                        <strong style={{ color: '#4338ca' }}>Kelompok Pengayaan (Advanced): </strong>
                        {selectedDetailModul.differentiation_strategies?.process?.advanced_students}
                      </div>
                    </div>
                  </div>

                  {/* Product Differentiation */}
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>3. Diferensiasi Produk (Opsi Unjuk Kerja Siswa)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {selectedDetailModul.differentiation_strategies?.product?.map((p, idx) => (
                        <div key={idx} style={{ padding: '0.65rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#4f46e5' }}>{p.format}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Sasaran: {p.target_students || 'Siswa yang berminat'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.35rem', fontWeight: 600 }}>
                            Fokus Rubrik: {p.rubric_focus}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Activities */}
              {detailTab === 'ACTIVITIES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {selectedDetailModul.learning_activities?.map((act) => (
                    <div key={act.meeting_number} className={styles.statItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.95rem' }}>
                          Pertemuan ke-{act.meeting_number}: {act.topic}
                        </strong>
                        <span className={styles.kaldikBadge}>{act.allocated_time_minutes} Menit</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                        {/* Pendahuluan */}
                        <div style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                            A. Kegiatan Pendahuluan ({act.opening?.duration_minutes} Menit)
                          </span>
                          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem' }}>
                            {act.opening?.steps?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Inti */}
                        <div style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                            B. Kegiatan Inti Berdiferensiasi ({act.core?.duration_minutes} Menit)
                          </span>
                          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem' }}>
                            {act.core?.steps?.map((s, idx) => (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Penutup */}
                        <div style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>
                            C. Kegiatan Penutup &amp; Refleksi ({act.closing?.duration_minutes} Menit)
                          </span>
                          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem' }}>
                            {act.closing?.steps?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Assessment & LKPD */}
              {detailTab === 'ASSESSMENT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Rencana Asesmen Berkelanjutan</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>🔍 Asesmen Diagnostik (Awal): </strong>
                        {selectedDetailModul.assessment_plan?.diagnostic}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>📝 Asesmen Formatif (Proses): </strong>
                        {selectedDetailModul.assessment_plan?.formative}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>🎯 Asesmen Sumatif (Lingkup Materi): </strong>
                        {selectedDetailModul.assessment_plan?.summative}
                      </div>
                    </div>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Lampiran Lembar Kerja Peserta Didik (LKPD)</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {selectedDetailModul.lkpd_attachments?.map((l, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: '#0284c7', fontSize: '0.88rem' }}>{l.title}</strong>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.82rem' }}>{l.instructions}</p>
                          {l.scaffolding_notes && (
                            <div style={{ fontSize: '0.75rem', color: '#166534', background: '#f0fdf4', padding: '0.3rem 0.5rem', borderRadius: '0.35rem', marginTop: '0.35rem' }}>
                              Catatan Scaffolding: {l.scaffolding_notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => window.print()}
                className={styles.btnSecondary}
              >
                🖨️ Cetak Dokumen Resmi
              </button>
              {selectedDetailModul.status !== 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => handleActivate(selectedDetailModul.id)}
                  className={styles.btnPrimary}
                >
                  ✓ Sahkan &amp; Aktifkan Modul
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
