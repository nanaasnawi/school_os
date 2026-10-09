'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import styles from './learning.module.css';
import {
  Calendar,
  Clock,
  BookOpen,
  FileText,
  CheckCircle2,
  PlayCircle,
  FileCheck,
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  Video,
  Info,
  Check,
  X,
  KeyRound,
  Lock,
  AlertTriangle,
} from 'lucide-react';

interface LearningSessionDto {
  id: string;
  tenant_id: string;
  session_type: string;
  schedule_id?: string | null;
  class_id: string;
  subject_id?: string | null;
  teacher_id: string;
  substitute_teacher_id?: string | null;
  session_date: string;
  session_number: number;
  start_time?: string | null;
  end_time?: string | null;
  status: string; // 'scheduled' | 'active' | 'completed' | 'cancelled'
  notes?: string | null;
  cancellation_reason?: string | null;
  subject_name?: string | null;
  teacher_name?: string | null;
  substitute_teacher_name?: string | null;
  class_name?: string | null;
  room?: string | null;
}

interface ClassScheduleDto {
  id: string;
  tenant_id: string;
  class_id: string;
  class_name?: string;
  subject_id: string;
  subject_name?: string;
  teacher_id: string;
  teacher_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
}

interface MaterialItemDto {
  id: string;
  title: string;
  description?: string | null;
  material_type: string;
  storage_key?: string | null;
  external_url?: string | null;
  session_id?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  subject_name?: string | null;
  teacher_name?: string | null;
  created_at: string;
}

interface AssignmentItemDto {
  id: string;
  title: string;
  description?: string | null;
  due_at?: string | null;
  allow_late_submission?: boolean | null;
  class_name?: string | null;
  subject_name?: string | null;
  session_id?: string | null;
  status: string;
}

interface QuizItemDto {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  time_limit_minutes?: number;
  exam_mode?: string | null;
  exam_token?: string | null;
  max_token_attempts?: number | null;
  class_name?: string | null;
  subject_name?: string | null;
  status: string;
}

interface ScheduleComplianceData {
  date: string;
  total_scheduled: number;
  completed_count: number;
  in_progress_count: number;
  scheduled_count: number;
  substituted_count: number;
  cancelled_count: number;
  overdue_unrecorded_count: number;
  compliance_rate: number;
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || localStorage.getItem('token')
      : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function LearningPortalPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Memuat Timetable Hub &amp; Portal Pembelajaran Terpadu...
        </div>
      }
    >
      <LearningPortalContent />
    </Suspense>
  );
}

function LearningPortalContent() {
  const searchParams = useSearchParams();
  const classParam = searchParams.get('class');
  const subjectParam = searchParams.get('subject');

  // ── Tab Navigation State ──
  const [activeTab, setActiveTab] = useState<
    'hub' | 'library' | 'assignments' | 'cbt' | 'compliance'
  >('hub');

  // ── Data States ──
  const [sessions, setSessions] = useState<LearningSessionDto[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleDto[]>([]);
  const [materials, setMaterials] = useState<MaterialItemDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItemDto[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItemDto[]>([]);
  const [compliance, setCompliance] = useState<ScheduleComplianceData | null>(null);
  const [classesList, setClassesList] = useState<any[]>([]);

  // ── Filter States ──
  const [selectedClass, setSelectedClass] = useState<string>(classParam || 'ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectParam || 'ALL');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('TODAY');

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Cancel Modal State ──
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // ── CBT Exam Token Verification Modal State ──
  const [activeTokenQuiz, setActiveTokenQuiz] = useState<QuizItemDto | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // ── Toast Trigger ──
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Load All Learning & Schedule Hub Data ──
  const loadHubData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [
        sessionsRes,
        schedulesRes,
        materialsRes,
        assignmentsRes,
        quizzesRes,
        complianceRes,
        classesRes,
      ] = await Promise.all([
        fetch(getApiUrl('/api/v1/learning/sessions'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(getApiUrl('/api/v1/academic/schedules'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(getApiUrl('/api/v1/learning/materials'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(getApiUrl('/api/v1/learning/assignments'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(getApiUrl('/api/v1/learning/quizzes'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(getApiUrl('/api/v1/analytics/schedule-compliance'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(getApiUrl('/api/v1/academic/classes?page_size=200'), { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      if (sessionsRes?.data) {
        setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      }
      if (schedulesRes?.data) {
        setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      }
      if (materialsRes?.data) {
        setMaterials(Array.isArray(materialsRes.data) ? materialsRes.data : []);
      }
      if (assignmentsRes?.data) {
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      }
      if (quizzesRes?.data) {
        setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
      }
      if (complianceRes?.data) {
        setCompliance(complianceRes.data);
      }
      if (classesRes?.data) {
        const clsItems = classesRes.data.items || classesRes.data;
        setClassesList(Array.isArray(clsItems) ? clsItems : []);
      }
    } catch (err) {
      console.error('Error fetching learning hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHubData();
  }, []);

  // ── Compute Day of Week in Indonesian ──
  const now = new Date();
  const daysMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const todayIndo = daysMap[now.getDay()];

  // ── Start / Initialize Session from Schedule ──
  const handleStartSession = async (sched: ClassScheduleDto) => {
    try {
      setIsSubmittingAction(true);
      const headers = getAuthHeaders();
      const todayDate = now.toISOString().split('T')[0];

      const res = await fetch(getApiUrl('/api/v1/learning/sessions'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_type: 'scheduled',
          schedule_id: sched.id,
          class_id: sched.class_id,
          subject_id: sched.subject_id,
          teacher_id: sched.teacher_id,
          session_date: todayDate,
          start_time: sched.start_time,
          end_time: sched.end_time,
        }),
      });

      if (res.ok) {
        const _json = await res.json();
        showToast(
          `✓ Sesi ${sched.subject_name || 'Pelajaran'} (${sched.class_name || 'Rombel'}) aktif! Notifikasi & presensi telah dibuka.`
        );
        loadHubData();
      } else {
        showToast('Gagal memulai sesi pembelajaran.');
      }
    } catch (err) {
      console.error('Start session error:', err);
      showToast('Terjadi kendala jaringan saat memulai sesi.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── End Learning Session ──
  const handleEndSession = async (sessionId: string) => {
    try {
      setIsSubmittingAction(true);
      const headers = getAuthHeaders();
      const res = await fetch(getApiUrl(`/api/v1/learning/sessions/${sessionId}/end`), {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        showToast('✓ Sesi pembelajaran telah ditutup secara resmi.');
        loadHubData();
      } else {
        showToast('Gagal mengakhiri sesi.');
      }
    } catch {
      showToast('Gagal mengakhiri sesi.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── Cancel Learning Session ──
  const handleConfirmCancel = async () => {
    if (!cancellingSessionId || !cancelReason.trim()) {
      showToast('Mohon masukkan alasan pembatalan sesi.');
      return;
    }
    try {
      setIsSubmittingAction(true);
      const headers = getAuthHeaders();
      const res = await fetch(
        getApiUrl(`/api/v1/learning/sessions/${cancellingSessionId}/cancel`),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (res.ok) {
        showToast('✓ Sesi pembelajaran berhasil dibatalkan secara tercatat.');
        setCancellingSessionId(null);
        setCancelReason('');
        loadHubData();
      } else {
        showToast('Gagal membatalkan sesi.');
      }
    } catch {
      showToast('Gagal membatalkan sesi.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── Verify CBT Exam Token ──
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTokenQuiz) return;
    if (!tokenInput.trim()) {
      setTokenError('Mohon masukkan token ujian CBT.');
      return;
    }
    try {
      setIsVerifyingToken(true);
      setTokenError(null);
      const headers = getAuthHeaders();
      const res = await fetch(
        getApiUrl(`/api/v1/learning/quizzes/${activeTokenQuiz.id}/verify-token`),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ token: tokenInput.trim().toUpperCase() }),
        }
      );
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.valid) {
        showToast('✓ Token ujian CBT terverifikasi valid! Mengarahkan...');
        setActiveTokenQuiz(null);
        setTokenInput('');
        window.location.href = `/dashboard/learning/quizzes`;
      } else {
        const msg =
          json?.error?.message ||
          json?.data?.message ||
          'Token ujian salah. Pastikan kode huruf kapital sesuai pengumuman pengawas ujian.';
        setTokenError(msg);
      }
    } catch {
      setTokenError('Terjadi kendala jaringan saat memverifikasi token ujian.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // ── Combined Timetable Hub Cards ──
  const hubCards = useMemo(() => {
    const todayDate = now.toISOString().split('T')[0];

    // Filter schedules
    const targetDay = selectedDayFilter === 'TODAY' ? todayIndo : selectedDayFilter.toLowerCase();
    const filteredSchedules = schedules.filter((s) => {
      const matchDay = targetDay === 'all' || s.day_of_week?.toLowerCase() === targetDay;
      const matchClass = selectedClass === 'ALL' || s.class_id === selectedClass || s.class_name === selectedClass;
      const matchSubject = selectedSubject === 'ALL' || s.subject_name === selectedSubject;
      return matchDay && matchClass && matchSubject;
    });

    return filteredSchedules.map((sched) => {
      // Find matching session for today
      const matchingSession = sessions.find(
        (sess) =>
          sess.schedule_id === sched.id ||
          (sess.class_id === sched.class_id &&
            sess.subject_id === sched.subject_id &&
            sess.session_date === todayDate)
      );

      // Match linked materials
      const linkedMaterials = materials.filter(
        (m) =>
          (matchingSession && m.session_id === matchingSession.id) ||
          ((m.class_id === sched.class_id || (m.class_name && sched.class_name && m.class_name.trim().toLowerCase() === sched.class_name.trim().toLowerCase())) &&
            (m.subject_name?.trim().toLowerCase() === sched.subject_name?.trim().toLowerCase() ||
             ((m as any).subject_id && sched.subject_id && (m as any).subject_id === sched.subject_id)))
      );

      // Match linked assignments
      const linkedAssignments = assignments.filter(
        (a) =>
          (matchingSession && a.session_id === matchingSession.id) ||
          (a.class_name === sched.class_name &&
            a.subject_name?.toLowerCase() === sched.subject_name?.toLowerCase())
      );

      // Match linked quizzes
      const linkedQuizzes = quizzes.filter(
        (q) =>
          q.class_name === sched.class_name &&
          q.subject_name?.toLowerCase() === sched.subject_name?.toLowerCase()
      );

      // Current time check
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const isTimeWindow =
        currentHourMin >= sched.start_time && currentHourMin <= sched.end_time;
      const isTimePassed = currentHourMin > sched.end_time;

      let status = 'SCHEDULED';
      if (matchingSession) {
        if (matchingSession.status === 'active') status = 'ACTIVE';
        else if (matchingSession.status === 'completed') status = 'COMPLETED';
        else if (matchingSession.status === 'cancelled') status = 'CANCELLED';
        else if (matchingSession.substitute_teacher_id) status = 'SUBSTITUTED';
      } else if (isTimePassed && selectedDayFilter === 'TODAY') {
        status = 'OVERDUE';
      }

      return {
        schedule: sched,
        session: matchingSession,
        status,
        isTimeWindow,
        linkedMaterials,
        linkedAssignments,
        linkedQuizzes,
      };
    });
  }, [
    schedules,
    sessions,
    materials,
    assignments,
    quizzes,
    selectedClass,
    selectedSubject,
    selectedDayFilter,
    todayIndo,
  ]);

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            fontWeight: 600,
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ── Top Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <Calendar size={26} color="#0284c7" />
            <span>Timetable Hub &amp; Portal Pembelajaran</span>
          </h1>
          <p className={styles.subtitle}>
            Hub terpadu yang memetakan jam tatap muka, modul bahan ajar, tugas terstruktur, ujian CBT, dan presensi siswa ke dalam jadwal aktual.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            href="/dashboard/learning/materials/create"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} />
            <span>Upload Materi</span>
          </Link>
          <Link
            href="/dashboard/learning/assignments/create"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} />
            <span>Buat Tugas</span>
          </Link>
          <Link
            href="/dashboard/learning/quizzes/create"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} />
            <span>Buat CBT Online</span>
          </Link>
          <button
            onClick={loadHubData}
            className="btn btn-ghost btn-sm"
            title="Muat ulang data"
            style={{ padding: '0.4rem' }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Smart Architectural Guidance Banner ── */}
      <div className={styles.archBanner}>
        <div className={styles.archBannerContent}>
          <Info size={20} className={styles.archBannerIcon} />
          <div>
            <div className={styles.archBannerTitle}>
              Arsitektur Pembelajaran Terhubung Jadwal (Timetable Hub)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
              Aplikasi ini membedakan jadwal rutin (template mingguan) dan sesi pembelajaran riil (tanggal konkret).
            </div>
            <div className={styles.archBannerList}>
              <span className={styles.archBannerItem}>
                <CheckCircle2 size={13} color="#059669" />
                <strong>Sesi Aktual:</strong> Pertemuan mandiri setiap minggu tanpa menimpa riwayat sebelumnya.
              </span>
              <span className={styles.archBannerItem}>
                <CheckCircle2 size={13} color="#059669" />
                <strong>Arsip 24/7:</strong> Modul &amp; materi tetap tersimpan di histori belajar siswa setelah jam usai.
              </span>
              <span className={styles.archBannerItem}>
                <CheckCircle2 size={13} color="#059669" />
                <strong>CBT Terproteksi:</strong> Token ujian dilindungi pembatasan 5x salah dan durasi jam server.
              </span>
              <span className={styles.archBannerItem}>
                <CheckCircle2 size={13} color="#059669" />
                <strong>Presensi Permanen:</strong> Dilindungi RESTRICT, data kehadiran siswa tidak pernah hilang.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Compliance Summary Cards ── */}
      {compliance && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{compliance.total_scheduled}</span>
            <span className={styles.statLabel}>Total Jadwal</span>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#a7f3d0' }}>
            <span className={styles.statValue} style={{ color: '#059669' }}>
              {compliance.in_progress_count}
            </span>
            <span className={styles.statLabel}>Berlangsung</span>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#bae6fd' }}>
            <span className={styles.statValue} style={{ color: '#0284c7' }}>
              {compliance.completed_count}
            </span>
            <span className={styles.statLabel}>Selesai</span>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#fde68a' }}>
            <span className={styles.statValue} style={{ color: '#d97706' }}>
              {compliance.substituted_count}
            </span>
            <span className={styles.statLabel}>Pengganti</span>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#fecaca' }}>
            <span className={styles.statValue} style={{ color: '#dc2626' }}>
              {compliance.cancelled_count}
            </span>
            <span className={styles.statLabel}>Dibatalkan</span>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#fed7aa' }}>
            <span className={styles.statValue} style={{ color: '#ea580c' }}>
              {Math.round(compliance.compliance_rate)}%
            </span>
            <span className={styles.statLabel}>Kepatuhan Sesi</span>
          </div>
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Day Filter */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>
              <Clock size={13} />
              <span>Hari:</span>
            </span>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="TODAY">Hari Ini ({todayIndo.toUpperCase()})</option>
              <option value="ALL">Semua Hari (Mingguan)</option>
              <option value="senin">Senin</option>
              <option value="selasa">Selasa</option>
              <option value="rabu">Rabu</option>
              <option value="kamis">Kamis</option>
              <option value="jumat">Jumat</option>
              <option value="sabtu">Sabtu</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Rombel:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">Semua Rombel</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Mapel:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              <option value="Matematika">Matematika</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
              <option value="IPAS">IPAS</option>
              <option value="Pendidikan Agama Islam">Pendidikan Agama Islam</option>
              <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Menampilkan <strong>{hubCards.length}</strong> jadwal pembelajaran
        </div>
      </div>

      {/* ── Portal Navigation Tabs ── */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'hub' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('hub')}
        >
          <Calendar size={15} />
          <span>Hub Sesi &amp; Jadwal Terpadu</span>
          <span className={styles.tabBadge}>{hubCards.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'library' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <BookOpen size={15} />
          <span>Arsip Materi 24/7 ({materials.length})</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'assignments' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={15} />
          <span>Tugas &amp; PR ({assignments.length})</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'cbt' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('cbt')}
        >
          <ShieldCheck size={15} />
          <span>Ujian CBT &amp; Kuis ({quizzes.length})</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'compliance' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <FileCheck size={15} />
          <span>Audit Kepatuhan Jadwal</span>
        </button>
      </div>

      {/* ── TAB 1: Hub Sesi & Jadwal Terpadu ── */}
      {activeTab === 'hub' && (
        <>
          {hubCards.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={40} color="#94a3b8" />
              <div className={styles.emptyStateTitle}>Tidak Ada Jadwal Ditemukan</div>
              <p style={{ margin: 0, fontSize: '0.84rem' }}>
                Tidak ada agenda pembelajaran untuk filter yang dipilih. Silakan pilih hari lain atau plotting jadwal di menu Jadwal Pelajaran.
              </p>
              <Link href="/dashboard/subjects" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                Buka Plotting Jadwal Rombel
              </Link>
            </div>
          ) : (
            <div className={styles.sessionsGrid}>
              {hubCards.map(
                ({
                  schedule,
                  session,
                  status,
                  isTimeWindow,
                  linkedMaterials,
                  linkedAssignments,
                  linkedQuizzes,
                }) => (
                  <div
                    key={schedule.id}
                    className={`${styles.sessionCard} ${
                      status === 'ACTIVE' ? styles.sessionCardActive : ''
                    }`}
                  >
                    {/* Top Row: Time & Status */}
                    <div className={styles.sessionTopRow}>
                      <span className={styles.timePill}>
                        <Clock size={12} color="#0284c7" />
                        <span>
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </span>

                      {status === 'ACTIVE' && (
                        <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                          <span className={styles.pulseDot} />
                          <span>Berlangsung</span>
                        </span>
                      )}
                      {status === 'COMPLETED' && (
                        <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                          ✓ Selesai
                        </span>
                      )}
                      {status === 'SCHEDULED' && (
                        <span className={`${styles.statusBadge} ${styles.statusScheduled}`}>
                          {isTimeWindow ? 'Jam Belajar' : 'Mendatang'}
                        </span>
                      )}
                      {status === 'SUBSTITUTED' && (
                        <span className={`${styles.statusBadge} ${styles.statusSubstituted}`}>
                          Guru Pengganti
                        </span>
                      )}
                      {status === 'CANCELLED' && (
                        <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>
                          Dibatalkan
                        </span>
                      )}
                      {status === 'OVERDUE' && (
                        <span className={`${styles.statusBadge} ${styles.statusOverdue}`}>
                          Terlewat
                        </span>
                      )}
                    </div>

                    {/* Subject & Meta */}
                    <div className={styles.sessionTitleGroup}>
                      <h3 className={styles.sessionSubject}>{schedule.subject_name}</h3>
                      <div className={styles.sessionMeta}>
                        <span>{schedule.class_name}</span>
                        <span>•</span>
                        <span>{schedule.room || 'Ruang Kelas'}</span>
                        <span>•</span>
                        <span>
                          {session?.substitute_teacher_name
                            ? `Pengganti: ${session.substitute_teacher_name}`
                            : schedule.teacher_name}
                        </span>
                      </div>
                    </div>

                    {/* Integrated Activity Section: Materials & Tasks */}
                    <div className={styles.activitySection}>
                      <div className={styles.activityHeader}>
                        <span>Aktivitas Pembelajaran Terlampir</span>
                        <span>
                          {linkedMaterials.length +
                            linkedAssignments.length +
                            linkedQuizzes.length}{' '}
                          Item
                        </span>
                      </div>

                      <div className={styles.activityList}>
                        {/* Linked Materials */}
                        {linkedMaterials.slice(0, 2).map((m) => (
                          <div key={m.id} className={styles.activityItem}>
                            <div className={styles.activityItemLeft}>
                              {m.material_type === 'video' ? (
                                <Video size={13} color="#dc2626" />
                              ) : (
                                <BookOpen size={13} color="#0284c7" />
                              )}
                              <span className={styles.activityItemTitle}>
                                {m.title}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: '#059669',
                                fontWeight: 700,
                              }}
                            >
                              Arsip 24/7
                            </span>
                          </div>
                        ))}

                        {/* Linked Assignments */}
                        {linkedAssignments.slice(0, 1).map((a) => (
                          <div key={a.id} className={styles.activityItem}>
                            <div className={styles.activityItemLeft}>
                              <FileText size={13} color="#d97706" />
                              <span className={styles.activityItemTitle}>
                                Tugas: {a.title}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: '#64748b',
                              }}
                            >
                              {a.due_at ? 'Deadline' : 'Tugas Sesi'}
                            </span>
                          </div>
                        ))}

                        {/* Linked Quizzes */}
                        {linkedQuizzes.slice(0, 1).map((q) => (
                          <div key={q.id} className={styles.activityItem}>
                            <div className={styles.activityItemLeft}>
                              <ShieldCheck size={13} color="#7c3aed" />
                              <span className={styles.activityItemTitle}>
                                CBT: {q.title}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: '#7c3aed',
                                fontWeight: 700,
                              }}
                            >
                              {q.duration_minutes || q.time_limit_minutes || 30}m
                            </span>
                          </div>
                        ))}

                        {linkedMaterials.length === 0 &&
                          linkedAssignments.length === 0 &&
                          linkedQuizzes.length === 0 && (
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: '#94a3b8',
                                fontStyle: 'italic',
                                padding: '4px',
                              }}
                            >
                              Belum ada materi/tugas khusus yang dilampirkan.
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.sessionFooter}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {status === 'SCHEDULED' || status === 'OVERDUE' ? (
                          <button
                            onClick={() => handleStartSession(schedule)}
                            disabled={isSubmittingAction}
                            className="btn btn-primary btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                            }}
                          >
                            <PlayCircle size={13} />
                            <span>Mulai Sesi</span>
                          </button>
                        ) : status === 'ACTIVE' ? (
                          <button
                            onClick={() => session && handleEndSession(session.id)}
                            disabled={isSubmittingAction}
                            className="btn btn-secondary btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              borderColor: '#38bdf8',
                              color: '#0284c7',
                            }}
                          >
                            <Check size={13} />
                            <span>Selesaikan Sesi</span>
                          </button>
                        ) : null}

                        <Link
                          href={`/dashboard/attendance?class_id=${schedule.class_id}`}
                          className="btn btn-ghost btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                          }}
                        >
                          <Users size={13} />
                          <span>Presensi</span>
                        </Link>
                      </div>

                      {status === 'ACTIVE' && session && (
                        <button
                          onClick={() => setCancellingSessionId(session.id)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            color: '#dc2626',
                            fontSize: '0.74rem',
                            padding: '0.2rem 0.5rem',
                          }}
                          title="Batalkan Sesi"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Katalog Materi & Modul (Arsip 24/7) ── */}
      {activeTab === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#334155',
            }}
          >
            <span>
              💡 <strong>Arsip Digital 24/7:</strong> Seluruh modul ajar digital, video YouTube, dan buku kurikulum di bawah ini tetap dapat dipelajari siswa kapan saja di luar jam tatap muka.
            </span>
            <Link
              href="/dashboard/learning/materials/create"
              className="btn btn-primary btn-sm"
            >
              + Upload Modul Baru
            </Link>
          </div>

          <div className={styles.sessionsGrid}>
            {materials.map((m) => (
              <div key={m.id} className={styles.sessionCard}>
                <div className={styles.sessionTopRow}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#0369a1',
                      background: '#f0f9ff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {m.material_type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Tersedia 24/7
                  </span>
                </div>

                <div className={styles.sessionTitleGroup}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                    {m.title}
                  </h4>
                  <div className={styles.sessionMeta}>
                    <span>{m.class_name || 'Semua Rombel'}</span>
                    <span>•</span>
                    <span>{m.subject_name || 'Mata Pelajaran'}</span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#475569',
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {m.description || 'Bahan ajar dan modul pendalaman materi siswa.'}
                </p>

                <div className={styles.sessionFooter}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Oleh: {m.teacher_name || 'Guru Pengampu'}
                  </span>
                  {m.external_url ? (
                    <a
                      href={m.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      Buka Tautan &rarr;
                    </a>
                  ) : (
                    <Link
                      href={`/dashboard/learning/materials?id=${m.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      Lihat Modul &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Tugas Siswa ── */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#334155',
            }}
          >
            <span>
              📝 <strong>Manajemen Tugas:</strong> Tugas yang dipetakan ke jadwal memiliki tenggat waktu terstruktur dan tetap bisa diakses siswa di arsip tugas mereka.
            </span>
            <Link
              href="/dashboard/learning/assignments/create"
              className="btn btn-primary btn-sm"
            >
              + Buat Tugas Baru
            </Link>
          </div>

          <div className={styles.sessionsGrid}>
            {assignments.map((a) => (
              <div key={a.id} className={styles.sessionCard}>
                <div className={styles.sessionTopRow}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#b45309',
                      background: '#fffbeb',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    TUGAS
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {a.allow_late_submission ? 'Terima Terlambat' : 'Tepat Waktu'}
                  </span>
                </div>

                <div className={styles.sessionTitleGroup}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                    {a.title}
                  </h4>
                  <div className={styles.sessionMeta}>
                    <span>{a.class_name || 'Rombel Belajar'}</span>
                    <span>•</span>
                    <span>{a.subject_name || 'Mata Pelajaran'}</span>
                  </div>
                </div>

                <div className={styles.sessionFooter}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {a.due_at
                      ? `Deadline: ${new Date(a.due_at).toLocaleDateString('id-ID')}`
                      : 'Tanpa batas waktu'}
                  </span>
                  <Link
                    href={`/dashboard/learning/assignments`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem' }}
                  >
                    Detail Penugasan &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Ujian CBT & Kuis ── */}
      {activeTab === 'cbt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#334155',
            }}
          >
            <span>
              🛡️ <strong>CBT Anti-Cheat &amp; Token Guard:</strong> Siswa hanya dapat mengerjakan ujian saat jendela aktif dan dibatasi maksimal 5 kali percobaan token sebelum terkunci 15 menit.
            </span>
            <Link
              href="/dashboard/learning/quizzes/create"
              className="btn btn-primary btn-sm"
            >
              + Buat Ujian CBT
            </Link>
          </div>

          <div className={styles.sessionsGrid}>
            {quizzes.map((q) => (
              <div key={q.id} className={styles.sessionCard}>
                <div className={styles.sessionTopRow}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: q.exam_mode === 'PROCTORED_CBT' ? '#b91c1c' : '#6d28d9',
                      background: q.exam_mode === 'PROCTORED_CBT' ? '#fef2f2' : '#f5f3ff',
                      border: q.exam_mode === 'PROCTORED_CBT' ? '1px solid #fecaca' : 'none',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {q.exam_mode === 'PROCTORED_CBT' ? '🛡️ PROCTORED CBT' : 'CBT ONLINE'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#6d28d9', fontWeight: 700 }}>
                    ⏱️ {q.duration_minutes || q.time_limit_minutes || 30} Menit
                  </span>
                </div>

                <div className={styles.sessionTitleGroup}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                    {q.title}
                  </h4>
                  <div className={styles.sessionMeta}>
                    <span>{q.class_name || 'Rombel'}</span>
                    <span>•</span>
                    <span>{q.subject_name || 'Mapel'}</span>
                  </div>
                </div>

                <div className={styles.sessionFooter}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Token: <strong>{q.exam_token ? 'Dilindungi Token' : 'Tanpa Token'}</strong>
                  </span>
                  {q.exam_token || q.exam_mode === 'PROCTORED_CBT' ? (
                    <button
                      onClick={() => {
                        setActiveTokenQuiz(q);
                        setTokenInput('');
                        setTokenError(null);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <KeyRound size={12} />
                      <span>Masuk CBT</span>
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/learning/quizzes`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      Ruang Ujian &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: Audit Kepatuhan Jadwal ── */}
      {activeTab === 'compliance' && compliance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              Laporan Kepatuhan Jadwal &amp; Bukti Fisik Mengajar
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Monitoring waktu nyata (real-time) untuk Kepala Sekolah dan Manajemen Kurikulum berdasarkan 6 status bukti fisik sesi pembelajaran.
            </p>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{compliance.total_scheduled}</span>
                <span className={styles.statLabel}>Total Jadwal Hari Ini</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#059669' }}>
                  {compliance.completed_count}
                </span>
                <span className={styles.statLabel}>Selesai Dijalankan</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#0284c7' }}>
                  {compliance.in_progress_count}
                </span>
                <span className={styles.statLabel}>Sedang Aktif</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#d97706' }}>
                  {compliance.substituted_count}
                </span>
                <span className={styles.statLabel}>Guru Pengganti</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#dc2626' }}>
                  {compliance.cancelled_count}
                </span>
                <span className={styles.statLabel}>Dibatalkan Resmi</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#ea580c' }}>
                  {compliance.overdue_unrecorded_count}
                </span>
                <span className={styles.statLabel}>Terlewat / Alpa</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Session Modal ── */}
      {cancellingSessionId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                Batalkan Sesi Pembelajaran
              </h3>
              <button
                onClick={() => setCancellingSessionId(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569' }}>
                Pembatalan sesi akan dicatat pada sistem audit sekolah dan dilaporkan pada log kepatuhan kurikulum.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Alasan Pembatalan:
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Rapat dinas guru, pemadaman listrik, atau kegiatan sekolah."
                  className="input"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setCancellingSessionId(null)}
                className="btn btn-ghost btn-sm"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isSubmittingAction}
                className="btn btn-primary btn-sm"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CBT Exam Token Verification Modal ── */}
      {activeTokenQuiz && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: '#dc2626' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  Verifikasi Token Ujian CBT
                </h4>
              </div>
              <button
                onClick={() => {
                  setActiveTokenQuiz(null);
                  setTokenInput('');
                  setTokenError(null);
                }}
                className={styles.closeBtn}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleVerifyToken}>
              <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                    {activeTokenQuiz.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    {activeTokenQuiz.class_name || 'Rombel'} • {activeTokenQuiz.subject_name || 'Mata Pelajaran'} • {activeTokenQuiz.duration_minutes || 45} Menit
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Masukkan Token Ujian (Dari Pengawas / Proktor):
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value.toUpperCase());
                      setTokenError(null);
                    }}
                    placeholder="Contoh: CBT01 / PAS2026"
                    className="input"
                    maxLength={10}
                    autoFocus
                    style={{
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      padding: '0.6rem',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    ⚠️ Perlindungan Keamanan: 5 kali salah input berturut-turut akan mengunci akses ujian selama 15 menit.
                  </span>
                </div>

                {tokenError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>{tokenError}</span>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTokenQuiz(null);
                    setTokenInput('');
                    setTokenError(null);
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingToken || !tokenInput.trim()}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: '#6d28d9',
                    borderColor: '#6d28d9',
                    fontWeight: 700,
                  }}
                >
                  {isVerifyingToken ? 'Memverifikasi...' : 'Verifikasi & Mulai Ujian →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
