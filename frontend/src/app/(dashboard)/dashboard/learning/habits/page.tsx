'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './habits.module.css';

interface HabitItemInfo {
  key: string;
  label: string;
  desc: string;
  icon: string;
}

const CANONICAL_HABITS: HabitItemInfo[] = [
  { key: 'bangun_pagi', label: '1. Bangun Pagi', desc: 'Bangun pagi sebelum fajar/subuh dengan penuh semangat dan merapikan tempat tidur.', icon: '🌅' },
  { key: 'beribadah', label: '2. Beribadah', desc: 'Melaksanakan ibadah wajib tepat waktu dan berdoa harian sesuai keyakinan agama.', icon: '🤲' },
  { key: 'berolahraga', label: '3. Berolahraga', desc: 'Beraktivitas fisik atau berolahraga ringan minimal 15-30 menit untuk kebugaran.', icon: '🏃' },
  { key: 'makan_sehat', label: '4. Makan Sehat & Bergizi', desc: 'Mengonsumsi makanan bergizi seimbang (sayur, buah, protein, air putih cukup).', icon: '🥗' },
  { key: 'gemar_belajar', label: '5. Gemar Belajar & Membaca', desc: 'Membaca buku literasi, mengulang pelajaran, atau mengeksplorasi wawasan baru secara mandiri.', icon: '📚' },
  { key: 'bermasyarakat', label: '6. Bermasyarakat & Gotong Royong', desc: 'Membantu orang tua di rumah, bersosialisasi dengan santun, atau gotong royong.', icon: '🤝' },
  { key: 'tidur_tepat_waktu', label: '7. Tidur Tepat Waktu', desc: 'Beristirahat malam tepat waktu (tidak begadang) demi kebugaran dan metabolisme.', icon: '🌙' },
];

interface ClassStudentSummary {
  id: string;
  full_name: string;
  nisn: string;
  gender: string;
  metrics: {
    total_entries: number;
    avg_compliance: string | number;
    pending_count: number;
    expired_count: number;
    verified_count: number;
    override_count: number;
    last_entry_date: string | null;
  };
}

interface StudentDetailCalendar {
  student_id: string;
  date_range: { start_date: string; end_date: string };
  summary: {
    total_days_recorded: number;
    average_compliance_rate: number;
    current_streak_days: number;
    longest_streak_days: number;
    status_counts: {
      pending: number;
      parent_verified: number;
      system_expired: number;
      teacher_override: number;
    };
    habits_breakdown: Record<string, { count: number; rate: number }>;
  };
  entries: Array<{
    id: string;
    entry_date: string;
    completed_count: number;
    compliance_rate: string | number;
    habits: Record<string, boolean>;
    verification_status: string;
    parent_feedback?: string;
    override_reason?: string;
  }>;
}

interface NarrativeItem {
  student_id: string;
  student_name: string;
  nisn: string;
  academic_year: string;
  semester: string;
  total_days_recorded: number;
  overall_compliance_rate: number;
  verification_summary: {
    parent_verified: number;
    teacher_override: number;
    verification_rate: number;
  };
  habits_breakdown: Record<string, { count: number; rate: number }>;
  categorization: {
    sangat_membudaya: string[];
    berkembang_sesuai_harapan: string[];
    perlu_penguatan: string[];
  };
  report_card_narrative: string;
}

export default function HabitTrackerWorkstationPage() {
  const [activeTab, setActiveTab] = useState<'MONITORING' | 'VERIFIKASI_OVERRIDE' | 'RAPOR_NARASI' | 'CHECKLIST_SIMULASI'>('MONITORING');
  const [classesList, setClassesList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<string>('GANJIL');
  const [loading, setLoading] = useState<boolean>(true);

  // Class Monitoring Data
  const [classSummary, setClassSummary] = useState<any>(null);
  const [studentsData, setStudentsData] = useState<ClassStudentSummary[]>([]);

  // Modals & Drawers
  const [inspectStudent, setInspectStudent] = useState<string | null>(null);
  const [studentCalendar, setStudentCalendar] = useState<StudentDetailCalendar | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [overrideTargetStudent, setOverrideTargetStudent] = useState<string>('ALL');
  const [overrideReason, setOverrideReason] = useState<string>('Diverifikasi berdasarkan pengamatan langsung kebiasaan dan karakter peserta didik di lingkungan sekolah (Fallback Window 7 Hari).');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Rapor Narrative State
  const [narrativesList, setNarrativesList] = useState<NarrativeItem[]>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState<boolean>(false);

  // Simulator / Direct Daily Input State
  const [simStudentId, setSimStudentId] = useState<string>('');
  const [simDate, setSimDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [simHabits, setSimHabits] = useState<Record<string, boolean>>({
    bangun_pagi: true,
    beribadah: true,
    berolahraga: false,
    makan_sehat: true,
    gemar_belajar: true,
    bermasyarakat: false,
    tidur_tepat_waktu: true
  });
  const [simNotes, setSimNotes] = useState<string>('');
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  // 1. Initial Load of Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/v1/academic/classes');
        if (res.ok) {
          const cData = await res.json();
          const list = cData.data || [];
          setClassesList(list);
          if (list.length > 0 && !selectedClass) {
            setSelectedClass(list[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching classes:', e);
      }
    };
    fetchClasses();
  }, []);

  // 2. Load Class Monitoring Summary when Class or Semester changes
  const loadClassHabits = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/learning/pedagogy/habits/calendar?class_id=${selectedClass}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setClassSummary(data.class_summary);
          setStudentsData(data.students || []);
          if (data.students && data.students.length > 0 && !simStudentId) {
            setSimStudentId(data.students[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error loading habits data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassHabits();
  }, [selectedClass, selectedSemester]);

  // 3. Load Student Calendar details when inspected
  const handleInspectStudent = async (studentId: string) => {
    setInspectStudent(studentId);
    try {
      const res = await fetch(`/api/v1/learning/pedagogy/habits/calendar?student_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStudentCalendar(data);
        }
      }
    } catch (e) {
      console.error('Error inspecting student:', e);
    }
  };

  // 4. Load Rapor Narrative
  const loadNarratives = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/v1/learning/pedagogy/habits/semester-narrative?class_id=${selectedClass}&academic_year=${academicYear}&semester=${selectedSemester}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNarrativesList(Array.isArray(data.narratives) ? data.narratives : [data.narratives]);
        }
      }
    } catch (e) {
      console.error('Error loading narratives:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'RAPOR_NARASI') {
      loadNarratives();
    }
  }, [activeTab, selectedClass, academicYear, selectedSemester]);

  // 5. Execute Homeroom Teacher Override
  const handleExecuteOverride = async () => {
    try {
      setLoading(true);
      const bodyPayload: any = {
        class_id: selectedClass,
        override_reason: overrideReason,
        target_status: 'ALL'
      };
      if (overrideTargetStudent !== 'ALL') {
        bodyPayload.student_id = overrideTargetStudent;
      }

      const res = await fetch('/api/v1/learning/pedagogy/habits/override-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        const data = await res.json();
        setIsOverrideModalOpen(false);
        setActionSuccessMsg(data.message);
        setTimeout(() => setActionSuccessMsg(null), 5000);
        await loadClassHabits();
        if (inspectStudent) handleInspectStudent(inspectStudent);
      }
    } catch (e) {
      console.error('Error executing override:', e);
    } finally {
      setLoading(false);
    }
  };

  // 6. Send Parent Verification Reminders
  const handleSendReminder = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/learning/pedagogy/habits/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: selectedClass, days_lookback: 7 })
      });

      if (res.ok) {
        const data = await res.json();
        setIsReminderModalOpen(false);
        setActionSuccessMsg(data.message);
        setTimeout(() => setActionSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error('Error sending reminder:', e);
    } finally {
      setLoading(false);
    }
  };

  // 7. Save Narratives to Gradebook Snapshot
  const handleSaveToSnapshot = async () => {
    try {
      setIsSavingSnapshot(true);
      const res = await fetch(
        `/api/v1/learning/pedagogy/habits/semester-narrative?class_id=${selectedClass}&academic_year=${academicYear}&semester=${selectedSemester}&save_to_snapshot=true`
      );
      if (res.ok) {
        setActionSuccessMsg('Catatan sikap narasi G7KAIH berhasil disimpan ke Materialized Snapshot Rapor!');
        setTimeout(() => setActionSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error('Error saving snapshot:', e);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // 8. Submit Simulator Habit Entry
  const handleSimSubmit = async () => {
    if (!simStudentId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/v1/learning/pedagogy/habits/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: simStudentId,
          entry_date: simDate,
          academic_year: academicYear,
          semester: selectedSemester,
          habits: simHabits,
          habits_notes: simNotes ? { catatan: simNotes } : {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimSuccessMsg(`Berhasil! Skor kepatuhan otomatis dihitung: ${data.entry.compliance_rate}% (${data.entry.completed_count} dari 7 kebiasaan terpenuhi).`);
        setTimeout(() => setSimSuccessMsg(null), 5000);
        await loadClassHabits();
        if (inspectStudent === simStudentId) handleInspectStudent(simStudentId);
      }
    } catch (e) {
      console.error('Error submitting habit:', e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate live simulator metrics
  const simCompletedCount = Object.values(simHabits).filter(Boolean).length;
  const simComplianceRate = Math.round((simCompletedCount / 7) * 10000) / 100;

  return (
    <div className={styles.container}>
      {/* ── HERO HEADER ── */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>⭐ FASE 5: KARAKTER & PEMBIASAAN</span>
          </div>
          <h1 className={styles.heroTitle}>Gerakan 7 Kebiasaan Anak Indonesia Hebat (G7KAIH)</h1>
          <p className={styles.heroSubtitle}>
            Modul pemantauan longitudinal kebiasaan karakter harian siswa (Bangun Pagi, Beribadah, Berolahraga, Makan Sehat, Gemar Belajar, Bermasyarakat, Tidur Tepat Waktu) terintegrasi verifikasi orang tua dan sintesis narasi sikap Rapor Kurikulum Merdeka.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button 
            className={styles.btnSecondary}
            onClick={() => setIsReminderModalOpen(true)}
            id="btn-send-reminder"
          >
            📢 Kirim Pengingat WA/Notif
          </button>
          <button 
            className={styles.btnPrimary}
            onClick={() => {
              setOverrideTargetStudent('ALL');
              setIsOverrideModalOpen(true);
            }}
            id="btn-override-massal"
          >
            ⚡ Override Verifikasi Wali Kelas
          </button>
        </div>
      </div>

      {/* ── FALLBACK NOTICE BANNER ── */}
      <div className={styles.fallbackBanner}>
        <div className={styles.fallbackBannerText}>
          <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          <span>
            <strong>Aturan Fallback Window 7 Hari:</strong> Jurnal harian yang berstatus <code>PENDING</code> lebih dari 7 hari tanpa verifikasi orang tua otomatis ditandai siap di-override oleh Wali Kelas berdasarkan pengamatan langsung di sekolah agar nilai sikap rapor siswa tidak kosong saat kenaikan kelas.
          </span>
        </div>
        <button
          className={styles.btnSecondary}
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          onClick={() => {
            setOverrideTargetStudent('ALL');
            setIsOverrideModalOpen(true);
          }}
        >
          Terapkan Override Sekarang
        </button>
      </div>

      {/* ── NOTIFICATION SUCCESS TOAST ── */}
      {actionSuccessMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#059669',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          ✅ {actionSuccessMsg}
        </div>
      )}

      {/* ── STATS OVERVIEW ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Siswa Terdaftar</span>
          <span className={styles.statValue}>{classSummary?.total_enrolled || 0}</span>
          <span className={styles.statSub}>Rombel {classesList.find(c => c.id === selectedClass)?.name || '-'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Partisipasi Aktif</span>
          <span className={styles.statValue}>{classSummary?.participation_rate || 0}%</span>
          <span className={styles.statSub}>{classSummary?.active_participating || 0} siswa aktif mencatat</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rerata Kepatuhan Kelas</span>
          <span className={styles.statValue} style={{ color: '#ea580c' }}>
            {classSummary?.average_compliance_rate || 0}%
          </span>
          <span className={styles.statSub}>
            {(classSummary?.average_compliance_rate || 0) >= 85 ? '🌟 Sangat Membudaya' : (classSummary?.average_compliance_rate || 0) >= 70 ? '👍 Berkembang Baik' : '⚠️ Perlu Penguatan'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Ortu</span>
          <span className={styles.statValue} style={{ color: '#d97706' }}>
            {classSummary?.total_pending_verifications || 0}
          </span>
          <span className={styles.statSub}>Menunggu verifikasi</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Expired / Siap Override</span>
          <span className={styles.statValue} style={{ color: '#ef4444' }}>
            {classSummary?.total_expired_needing_override || 0}
          </span>
          <span className={styles.statSub}>Batas 7 hari terlewati</span>
        </div>
      </div>

      {/* ── FILTER CONTROLS ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Rombel / Kelas</span>
          <select 
            className={styles.selectInput}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            id="select-habits-class"
          >
            {classesList.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tahun Ajaran</span>
          <select 
            className={styles.selectInput}
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          >
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Semester</span>
          <select 
            className={styles.selectInput}
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="GANJIL">Ganjil (18 MEB)</option>
            <option value="GENAP">Genap (17 MEB)</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button 
            className={styles.btnSecondary}
            onClick={loadClassHabits}
            title="Muat Ulang Data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'MONITORING' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('MONITORING')}
          id="tab-monitoring"
        >
          📊 Monitoring & Kalender Kelas
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'VERIFIKASI_OVERRIDE' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('VERIFIKASI_OVERRIDE')}
          id="tab-override"
        >
          🛡️ Antrean Verifikasi & Override ({classSummary?.total_pending_verifications || 0} Pending)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'RAPOR_NARASI' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('RAPOR_NARASI')}
          id="tab-rapor"
        >
          📜 Rekapitulasi Catatan Sikap e-Rapor
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'CHECKLIST_SIMULASI' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('CHECKLIST_SIMULASI')}
          id="tab-simulasi"
        >
          ✍️ Jurnal Harian 7 Kebiasaan (Input Siswa/Ortu)
        </button>
      </div>

      {/* ── TAB CONTENT ── */}

      {/* 1. MONITORING TAB */}
      {activeTab === 'MONITORING' && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Peserta Didik</th>
                <th>NISN</th>
                <th>Total Jurnal</th>
                <th>Rata-rata Kepatuhan</th>
                <th>Status Verifikasi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    Memuat data pembiasaan karakter kelas...
                  </td>
                </tr>
              ) : studentsData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Belum ada data siswa terdaftar di rombel ini.
                  </td>
                </tr>
              ) : (
                studentsData.map((s, idx) => {
                  const compRate = parseFloat(s.metrics.avg_compliance as any || 0);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <strong>{s.full_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Terakhir diisi: {s.metrics.last_entry_date || 'Belum pernah'}
                        </div>
                      </td>
                      <td><code>{s.nisn || '-'}</code></td>
                      <td>
                        <strong>{s.metrics.total_entries} hari</strong>
                      </td>
                      <td style={{ width: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                          <span>{compRate}%</span>
                          <span style={{ color: compRate >= 85 ? '#059669' : compRate >= 70 ? '#0284c7' : '#dc2626' }}>
                            {compRate >= 85 ? 'Sangat Membudaya' : compRate >= 70 ? 'Berkembang' : compRate > 0 ? 'Perlu Penguatan' : '-'}
                          </span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div 
                            className={styles.progressBar}
                            style={{ 
                              width: `${compRate}%`,
                              backgroundColor: compRate >= 85 ? '#10b981' : compRate >= 70 ? '#0ea5e9' : '#f59e0b'
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {s.metrics.pending_count > 0 && (
                            <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                              {s.metrics.pending_count} Pending
                            </span>
                          )}
                          {s.metrics.expired_count > 0 && (
                            <span className={`${styles.statusBadge} ${styles.statusExpired}`}>
                              {s.metrics.expired_count} Expired
                            </span>
                          )}
                          {s.metrics.verified_count > 0 && (
                            <span className={`${styles.statusBadge} ${styles.statusVerified}`}>
                              {s.metrics.verified_count} Ortu
                            </span>
                          )}
                          {s.metrics.override_count > 0 && (
                            <span className={`${styles.statusBadge} ${styles.statusOverride}`}>
                              {s.metrics.override_count} Override
                            </span>
                          )}
                          {s.metrics.total_entries === 0 && (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Kosong</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={styles.btnSecondary}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            onClick={() => handleInspectStudent(s.id)}
                            id={`btn-detail-${s.id}`}
                          >
                            🔍 Kalender & Streak
                          </button>
                          {(s.metrics.pending_count > 0 || s.metrics.expired_count > 0) && (
                            <button
                              className={styles.btnPrimary}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                              onClick={() => {
                                setOverrideTargetStudent(s.id);
                                setIsOverrideModalOpen(true);
                              }}
                            >
                              ⚡ Override
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. VERIFIKASI & OVERRIDE TAB */}
      {activeTab === 'VERIFIKASI_OVERRIDE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Antrean Verifikasi Jurnal Karakter</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Wali Kelas memiliki wewenang untuk menyetujui jurnal siswa yang orang tuanya pasif atau jurnal yang telah melewati batas 7 hari (Fallback Window).
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={styles.btnSecondary}
                onClick={() => setIsReminderModalOpen(true)}
              >
                📢 Broadcast Pengingat ke Orang Tua
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  setOverrideTargetStudent('ALL');
                  setIsOverrideModalOpen(true);
                }}
              >
                ⚡ Override Massal Seluruh Siswa Rombel Ini
              </button>
            </div>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Siswa</th>
                  <th>Total Pending</th>
                  <th>Total Expired (&gt;7 Hari)</th>
                  <th>Terverifikasi Ortu</th>
                  <th>Override Guru</th>
                  <th>Aksi Cepat</th>
                </tr>
              </thead>
              <tbody>
                {studentsData
                  .filter(s => s.metrics.pending_count > 0 || s.metrics.expired_count > 0)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.full_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NISN: {s.nisn}</div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                          {s.metrics.pending_count} Entri
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles.statusExpired}`}>
                          {s.metrics.expired_count} Entri Kadaluarsa
                        </span>
                      </td>
                      <td>{s.metrics.verified_count} Entri</td>
                      <td>{s.metrics.override_count} Entri</td>
                      <td>
                        <button
                          className={styles.btnPrimary}
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setOverrideTargetStudent(s.id);
                            setIsOverrideModalOpen(true);
                          }}
                        >
                          ⚡ Setujui Override
                        </button>
                      </td>
                    </tr>
                  ))}
                {studentsData.filter(s => s.metrics.pending_count > 0 || s.metrics.expired_count > 0).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#059669' }}>
                      🎉 Hebat! Tidak ada jurnal yang tertunda verifikasinya di rombel ini. Semua jurnal telah terverifikasi dengan tertib.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RAPOR NARASI TAB */}
      {activeTab === 'RAPOR_NARASI' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Sintesis Catatan Sikap & Pembiasaan Rapor Kurikulum Merdeka</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Algoritma agregasi longitudinal menghitung konsistensi 7 kebiasaan anak selama satu semester dan merangkai narasi rapor resmi sesuai standar BSKAP No. 033/H/KR/2024.
              </p>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={handleSaveToSnapshot}
              disabled={isSavingSnapshot}
            >
              {isSavingSnapshot ? 'Menyimpan...' : '💾 Simpan Narasi ke Snapshot e-Rapor'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
            {narrativesList.map((item) => (
              <div key={item.student_id} className={styles.narrativeCard}>
                <div className={styles.narrativeHeader}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{item.student_name}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>NISN: {item.nisn} • {item.total_days_recorded} hari jurnal</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '1.15rem', 
                      fontWeight: 800, 
                      color: item.overall_compliance_rate >= 85 ? '#059669' : item.overall_compliance_rate >= 70 ? '#0284c7' : '#dc2626' 
                    }}>
                      {item.overall_compliance_rate}%
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Kepatuhan Total</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Karakter Sangat Membudaya (&ge; 85%):
                  </div>
                  <div className={styles.habitPills}>
                    {item.categorization.sangat_membudaya.length > 0 ? (
                      item.categorization.sangat_membudaya.map(label => (
                        <span key={label} className={styles.pillHigh}>🌟 {label}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Belum ada indikator &ge; 85%</span>
                    )}
                  </div>
                </div>

                {item.categorization.perlu_penguatan.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Fokus Pendampingan & Penguatan (&lt; 70%):
                    </div>
                    <div className={styles.habitPills}>
                      {item.categorization.perlu_penguatan.map(label => (
                        <span key={label} className={styles.pillGrowth}>🎯 {label}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Rekomendasi Narasi Buku Rapor:
                  </div>
                  <div className={styles.narrativeContent}>
                    &ldquo;{item.report_card_narrative}&rdquo;
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CHECKLIST SIMULASI TAB */}
      {activeTab === 'CHECKLIST_SIMULASI' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Input Mandiri / Simulasi Jurnal 7 Kebiasaan</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Simulasi antarmuka checklist harian siswa & orang tua. Data disimpan dalam satu baris JSONB efisien dan langsung memicu kalkulasi persentase kepatuhan secara otomatis.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>
                    {simCompletedCount} / 7 ({simComplianceRate}%)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Skor Terpenuhi Hari Ini</div>
                </div>

                <button
                  className={styles.btnPrimary}
                  onClick={handleSimSubmit}
                  disabled={loading}
                  id="btn-sim-submit"
                >
                  💾 Simpan Jurnal Harian
                </button>
              </div>
            </div>

            {simSuccessMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#059669',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                ✅ {simSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Pilih Siswa</span>
                <select
                  className={styles.selectInput}
                  value={simStudentId}
                  onChange={(e) => setSimStudentId(e.target.value)}
                  style={{ minWidth: '220px' }}
                >
                  {studentsData.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Tanggal Jurnal</span>
                <input
                  type="date"
                  className={styles.textInput}
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup} style={{ flex: 1, minWidth: '260px' }}>
                <span className={styles.filterLabel}>Catatan Pendukung / Aktivitas</span>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Contoh: Sholat subuh berjamaah, jogging 20 mnt, baca buku cerita..."
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Canonical 7 Habits Checklist Cards */}
          <div className={styles.habitsGrid}>
            {CANONICAL_HABITS.map(habit => {
              const isChecked = Boolean(simHabits[habit.key]);
              return (
                <div
                  key={habit.key}
                  className={`${styles.habitCheckCard} ${isChecked ? styles.habitCheckCardChecked : ''}`}
                  onClick={() => {
                    setSimHabits(prev => ({
                      ...prev,
                      [habit.key]: !prev[habit.key]
                    }));
                  }}
                  id={`habit-card-${habit.key}`}
                >
                  <div className={styles.habitHeaderRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{habit.icon}</span>
                      <span className={styles.habitTitle}>{habit.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div click
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: '#ea580c', cursor: 'pointer' }}
                    />
                  </div>
                  <p className={styles.habitDesc}>{habit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: OVERRIDE VERIFIKASI WALI KELAS ── */}
      {isOverrideModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>⚡ Override Verifikasi Wali Kelas (Fallback)</h3>
              <button 
                onClick={() => setIsOverrideModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{
                background: 'rgba(234, 88, 12, 0.08)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.85rem',
                lineHeight: 1.5
              }}>
                <strong>Otoritas Wali Kelas:</strong> Fitur ini memverifikasi secara sah jurnal harian berstatus <code>PENDING</code> atau <code>SYSTEM_EXPIRED</code> untuk memastikan data pembiasaan karakter peserta didik tercatat lengkap dalam rapor akhir semester.
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Target Siswa</span>
                <select
                  className={styles.selectInput}
                  value={overrideTargetStudent}
                  onChange={(e) => setOverrideTargetStudent(e.target.value)}
                >
                  <option value="ALL">Seluruh Siswa di Rombel Ini</option>
                  {studentsData.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} (NISN: {s.nisn})</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Alasan Audit Override</span>
                <textarea
                  className={styles.textInput}
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setIsOverrideModalOpen(false)}
              >
                Batal
              </button>
              <button 
                className={styles.btnPrimary}
                onClick={handleExecuteOverride}
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Eksekusi Override Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PENGINGAT VERIFIKASI WA / NOTIFIKASI ── */}
      {isReminderModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📢 Kirim Pengingat Verifikasi ke Orang Tua</h3>
              <button 
                onClick={() => setIsReminderModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
                Sistem akan menyaring seluruh jurnal pembiasaan siswa dalam 7 hari terakhir yang masih berstatus <code>PENDING</code> dan secara otomatis mengirimkan notifikasi push serta mengantrekan pesan ke WhatsApp Gateway orang tua/wali murid terdaftar.
              </p>

              <div style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.82rem'
              }}>
                <strong>Template Pesan:</strong><br />
                <em>&ldquo;Ayah/Bunda dari [Nama Siswa], mohon verifikasi catatan pembiasaan karakter 7 Kebiasaan Anak Indonesia Hebat pekan ini di aplikasi Akselerasi Edu.&rdquo;</em>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setIsReminderModalOpen(false)}
              >
                Batal
              </button>
              <button 
                className={styles.btnPrimary}
                onClick={handleSendReminder}
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Kirim Pengingat Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER / MODAL: DETAIL JURNAL & STREAK SISWA ── */}
      {inspectStudent && studentCalendar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Rekam Jejak Pembiasaan: {studentsData.find(s => s.id === inspectStudent)?.full_name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Rentang: {studentCalendar.date_range.start_date} s.d. {studentCalendar.date_range.end_date}
                </span>
              </div>
              <button 
                onClick={() => setInspectStudent(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Streak summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className={styles.statCard} style={{ padding: '0.85rem' }}>
                  <span className={styles.statLabel}>Current Streak 🔥</span>
                  <span className={styles.statValue} style={{ fontSize: '1.4rem', color: '#ea580c' }}>
                    {studentCalendar.summary.current_streak_days} Hari
                  </span>
                </div>
                <div className={styles.statCard} style={{ padding: '0.85rem' }}>
                  <span className={styles.statLabel}>Longest Streak 🏆</span>
                  <span className={styles.statValue} style={{ fontSize: '1.4rem', color: '#059669' }}>
                    {studentCalendar.summary.longest_streak_days} Hari
                  </span>
                </div>
                <div className={styles.statCard} style={{ padding: '0.85rem' }}>
                  <span className={styles.statLabel}>Rata-rata Kepatuhan</span>
                  <span className={styles.statValue} style={{ fontSize: '1.4rem' }}>
                    {studentCalendar.summary.average_compliance_rate}%
                  </span>
                </div>
              </div>

              {/* Entries list */}
              <h4 style={{ margin: '0.5rem 0 0' }}>Daftar Jurnal Harian:</h4>
              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '0.75rem' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Terpenuhi</th>
                      <th>Skor</th>
                      <th>Status</th>
                      <th>Umpan Balik / Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentCalendar.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td><strong>{entry.entry_date}</strong></td>
                        <td>{entry.completed_count} / 7</td>
                        <td><strong>{entry.compliance_rate}%</strong></td>
                        <td>
                          <span className={`
                            ${styles.statusBadge}
                            ${entry.verification_status === 'PARENT_VERIFIED' ? styles.statusVerified :
                              entry.verification_status === 'TEACHER_OVERRIDE' ? styles.statusOverride :
                              entry.verification_status === 'SYSTEM_EXPIRED' ? styles.statusExpired :
                              styles.statusPending}
                          `}>
                            {entry.verification_status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {entry.parent_feedback || entry.override_reason || '-'}
                        </td>
                      </tr>
                    ))}
                    {studentCalendar.entries.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                          Belum ada jurnal tercatat untuk siswa ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setInspectStudent(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
