'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import styles from './studentDetail.module.css';

type GradeEntryReal = {
  id: string;
  subject_name?: string | null;
  component_name: string;
  raw_score?: number | null;
  max_raw_score?: number | null;
  calculated_at: string;
};

type ProgressReal = {
  overall_progress: number;
  lesson_completed: number;
  lesson_total: number;
  assignment_completed: number;
  assignment_total: number;
  quiz_completed: number;
  quiz_total: number;
  session_attended: number;
  session_total: number;
  academic_status?: string | null;
  teacher_notes?: string | null;
  teacher_name?: string | null;
  class_name?: string | null;
};

type StudentDetail = {
  nisn: string;
  nipd: string;
  nik: string;
  full_name: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  religion: string;
  alamat_jalan: string;
  no_hp: string;
  email: string;
  class_name: string;
  status: string;
  guardian_name?: string;
  guardian_phone?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  academic_year_name?: string;
  enrollment_status?: string;
};

export default function StudentDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'identitas' | 'biodata' | 'akademik'>('identitas');
  const [grades, setGrades] = useState<GradeEntryReal[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressReal | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStudent = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        // 1) Profil siswa — sumber utama (100% DB)
        const res = await fetch(getApiUrl(`/api/v1/students/${id}`), { headers });
        if (!res.ok) throw new Error(`Profil HTTP ${res.status}`);

        const json = await res.json();
        const d = json?.data;
        if (!d) throw new Error('Profil kosong');

        if (!cancelled) {
          setStudent({
            nisn: d.nisn || '-',
            nipd: d.nipd || '-',
            nik: d.nik || '-',
            full_name: d.full_name || 'Tanpa Nama',
            gender: d.gender === 'L' || d.gender === 'Laki-laki' ? 'Laki-laki' : (d.gender === 'P' || d.gender === 'Perempuan' ? 'Perempuan' : (d.gender || '-')),
            place_of_birth: d.place_of_birth || '-',
            date_of_birth: d.date_of_birth || '-',
            religion: d.religion || '-',
            alamat_jalan: d.alamat_jalan || '-',
            no_hp: d.no_hp || '-',
            email: d.email || '-',
            class_name: d.class_name || d.current_class?.name || 'Belum Ada Rombel',
            status: d.status || 'Active',
            guardian_name: d.guardian?.full_name || d.nama_ibu || '-',
            guardian_phone: d.guardian?.phone_number || '-',
            nama_ayah: d.nama_ayah || '-',
            nama_ibu: d.nama_ibu || '-',
            academic_year_name: d.academic_year?.name || '-',
            enrollment_status: d.current_enrollment?.status || d.status || '-',
          });
        }

        // 2) Nilai gradebook siswa ini — 100% DB (tidak ada fallback hardcode)
        setGradesLoading(true);
        try {
          const gRes = await fetch(getApiUrl(`/api/v1/learning/assessment/gradebook?student_id=${id}`), { headers });
          if (gRes.ok) {
            const gJson = await gRes.json();
            const arr = Array.isArray(gJson?.data) ? gJson.data : [];
            if (!cancelled) {
              setGrades(arr.map((e: any) => ({
                id: String(e.id),
                subject_name: e.subject_name || null,
                component_name: e.component_name || '-',
                raw_score: typeof e.raw_score === 'number' ? e.raw_score : null,
                max_raw_score: typeof e.max_raw_score === 'number' ? e.max_raw_score : null,
                calculated_at: e.calculated_at || '',
              })));
            }
          }
        } catch (e) {
          console.warn('Gradebook siswa gagal dimuat:', e);
        } finally {
          if (!cancelled) setGradesLoading(false);
        }

        // 3) Progress & presensi siswa ini — 100% DB (session_attendances + LMS)
        setProgressLoading(true);
        try {
          const pRes = await fetch(getApiUrl(`/api/v1/learning/progress/student/${id}`), { headers });
          if (pRes.ok) {
            const pJson = await pRes.json();
            if (!cancelled && pJson?.data) setProgress(pJson.data as ProgressReal);
          }
        } catch (e) {
          console.warn('Progress siswa gagal dimuat:', e);
        } finally {
          if (!cancelled) setProgressLoading(false);
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error('Error fetching student detail:', err);
        if (!cancelled) {
          setStudent(null);
          setGrades([]);
          setProgress(null);
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchStudent();
    }
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Memuat profil peserta didik...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Data Siswa Tidak Ditemukan</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Data peserta didik tidak ditemukan di database. Periksa kembali dari daftar siswa.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/dashboard/students" className="btn btn-secondary">
              ← Kembali ke Daftar Siswa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMutasi = (student.status || '').toUpperCase() === 'MUTASI_OUT';
  const isAktif = (student.status || '').toUpperCase() === 'ACTIVE' || (student.status || '').toLowerCase() === 'active';

  const initials = student.full_name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PD';

  // ── Derived 100% dari DB: kehadiran (session_attendances) & nilai (gradebook_entries) ──
  const scoredGrades = grades.filter((g) => typeof g.raw_score === 'number');
  const avgScore = scoredGrades.length
    ? Math.round((scoredGrades.reduce((s, g) => s + (g.raw_score || 0), 0) / scoredGrades.length) * 10) / 10
    : null;
  const bestGrade = scoredGrades.length
    ? scoredGrades.reduce((a, b) => ((a.raw_score || 0) >= (b.raw_score || 0) ? a : b))
    : null;
  const attendancePct = progress && progress.session_total > 0
    ? Math.round(((progress.session_attended || 0) / progress.session_total) * 1000) / 10
    : null;
  const predikat = (v: number) => (v >= 90 ? 'A' : v >= 80 ? 'B' : v >= 70 ? 'C' : v >= 60 ? 'D' : 'E');
  const fmtDate = (iso: string) => {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '-'; }
  };

  return (
    <div className={styles.page}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Beranda</Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <Link href="/dashboard/students" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Peserta Didik</Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{student.full_name}</span>
      </div>

      {/* ── Hero Card ── */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarBox}>{initials}</div>
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.studentName}>{student.full_name}</h1>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                {student.class_name}
              </span>
              <span style={{
                background: isAktif ? 'rgba(16, 185, 129, 0.15)' : (isMutasi ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                color: isAktif ? '#34d399' : (isMutasi ? '#fbbf24' : '#f87171'),
                border: `1px solid ${isAktif ? 'rgba(16, 185, 129, 0.3)' : (isMutasi ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`,
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {isAktif ? '● Aktif' : (isMutasi ? '📤 Mutasi Keluar' : 'Non-Aktif / Alumni')}
              </span>
            </div>
            <p className={styles.studentSub}>
              <span>NISN: <strong className={styles.monoText}>{student.nisn}</strong></span>
              {' · '}
              <span>NIPD: <strong className={styles.monoText}>{student.nipd}</strong></span>
              {' · '}
              <span>NIK: <strong className={styles.monoText}>{student.nik}</strong></span>
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/students" className="btn btn-secondary">
            ← Kembali ke Daftar
          </Link>
          <Link href="/dashboard/students/qr-scan" className="btn btn-secondary">
            📱 Presensi QR
          </Link>
        </div>
      </div>

      {/* ── Stats Summary Bar — 100% DB, tanpa hardcode ── */}
      <div className={styles.statsBar}>
        <div className={styles.statBox}>
          <span className={styles.statBoxIcon}>🏫</span>
          <div>
            <div className={styles.statBoxVal}>{student.class_name}</div>
            <div className={styles.statBoxLabel}>Rombel / Kelas Aktif{student.academic_year_name && student.academic_year_name !== '-' ? ` · ${student.academic_year_name}` : ''}</div>
          </div>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxIcon}>📅</span>
          <div>
            <div className={styles.statBoxVal}>
              {progressLoading ? '…' : attendancePct !== null ? `${attendancePct}%` : 'Belum ada data'}
            </div>
            <div className={styles.statBoxLabel}>
              Tingkat Kehadiran{progress ? ` · ${progress.session_attended}/${progress.session_total} sesi` : ' · session_attendances'}
            </div>
          </div>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxIcon}>🏆</span>
          <div>
            <div className={styles.statBoxVal}>
              {gradesLoading ? '…' : avgScore !== null ? `${avgScore} / 100` : 'Belum ada nilai'}
            </div>
            <div className={styles.statBoxLabel}>
              Rata-rata Nilai{avgScore !== null ? ` · ${predikat(avgScore)} · ${scoredGrades.length} entri gradebook` : ' · gradebook_entries'}
            </div>
          </div>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxIcon}>👩‍👦</span>
          <div>
            <div className={styles.statBoxVal}>{student.guardian_name && student.guardian_name !== '-' ? student.guardian_name : 'Belum ada data'}</div>
            <div className={styles.statBoxLabel}>Nama Ibu Kandung / Wali{student.guardian_phone && student.guardian_phone !== '-' ? ` · ${student.guardian_phone}` : ''}</div>
          </div>
        </div>
      </div>

      {/* ── Hero insight strip: ringkasan DB real ── */}
      <div className={styles.insightStrip}>
        <div className={styles.insightItem}>
          <span className={styles.insightDot} style={{ background: '#38bdf8' }} />
          <span>
            <b>{student.full_name}</b> · {student.class_name}
            {student.enrollment_status && student.enrollment_status !== '-' ? ` · Enroll: ${student.enrollment_status}` : ''}
          </span>
        </div>
        <div className={styles.insightItem}>
          <span className={styles.insightDot} style={{ background: attendancePct !== null && attendancePct >= 85 ? '#34d399' : '#fbbf24' }} />
          <span>
            {progressLoading ? 'Memuat presensi…' : progress
              ? `Presensi LMS: ${progress.session_attended}/${progress.session_total} sesi${attendancePct !== null ? ` (${attendancePct}%)` : ''}${progress.academic_status ? ` · Status: ${progress.academic_status}` : ''}`
              : 'Belum ada data presensi sesi (session_attendances kosong).'}
          </span>
        </div>
        <div className={styles.insightItem}>
          <span className={styles.insightDot} style={{ background: avgScore !== null && avgScore >= 75 ? '#34d399' : '#fbbf24' }} />
          <span>
            {gradesLoading ? 'Memuat nilai…' : scoredGrades.length
              ? `Nilai: ${scoredGrades.length} entri · rata-rata ${avgScore}/100 (${predikat(avgScore || 0)})${bestGrade ? ` · terbaik ${bestGrade.subject_name || bestGrade.component_name} ${bestGrade.raw_score}` : ''}`
              : 'Belum ada entri nilai di gradebook (gradebook_entries kosong).'}
          </span>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'identitas' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('identitas')}
        >
          📋 Identitas &amp; Dapodik
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'biodata' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('biodata')}
        >
          👤 Biodata &amp; Kontak
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'akademik' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('akademik')}
        >
          📚 Akademik &amp; Nilai
        </button>
      </div>

      {/* ── Tab Panels ── */}
      {activeTab === 'identitas' && (
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Identitas Pokok Siswa (Dapodik Kemendikbud)</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Lengkap Siswa</span>
                <span className={styles.infoVal}><strong>{student.full_name}</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NISN (Nomor Induk Siswa Nasional)</span>
                <span className={styles.infoVal}><code className={styles.monoText}>{student.nisn}</code></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NIPD / Nomor Induk Sekolah</span>
                <span className={styles.infoVal}><code className={styles.monoText}>{student.nipd}</code></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NIK (Nomor Induk Kependudukan)</span>
                <span className={styles.infoVal}><code className={styles.monoText}>{student.nik}</code></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Rombel / Kelas</span>
                <span className={styles.infoVal}><strong>{student.class_name}</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status Keaktifan</span>
                <span className={styles.infoVal}>{isAktif ? 'Aktif Mengikuti Pembelajaran' : (isMutasi ? 'Mutasi Keluar' : 'Non-Aktif')}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Status Akademik &amp; Akun</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Rombel / Kelas Aktif</span>
                <span className={styles.infoVal}><strong>{student.class_name}</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tahun Ajaran Berjalan</span>
                <span className={styles.infoVal}>{student.academic_year_name || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status Enrollment</span>
                <span className={styles.infoVal}>{student.enrollment_status || student.status}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Akses Portal Siswa &amp; CBT</span>
                <span className={styles.infoVal} style={{ color: '#34d399', fontWeight: 700 }}>
                  {student.email && student.email !== '-' ? '✅ Terdaftar (via Email)' : '⚠️ Belum ada email login'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email Siswa</span>
                <span className={styles.infoVal}>{student.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Kartu Pelajar &amp; QR Presensi</span>
                <span className={styles.infoVal}>
                  <Link href="/dashboard/students/qr-scan" style={{ color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 700 }}>
                    🔍 Buka Scan QR
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'biodata' && (
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Biodata Siswa</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Jenis Kelamin</span>
                <span className={styles.infoVal}>{student.gender}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tempat Lahir</span>
                <span className={styles.infoVal}>{student.place_of_birth}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tanggal Lahir</span>
                <span className={styles.infoVal}>{student.date_of_birth}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Agama</span>
                <span className={styles.infoVal}>{student.religion}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Data Orang Tua &amp; Wali Murid (Sensitif Dapodik)</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Ayah Kandung</span>
                <span className={styles.infoVal}><strong>{student.nama_ayah && student.nama_ayah !== '-' ? student.nama_ayah : '(Belum Ada Data Ayah)'}</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Ibu Kandung</span>
                <span className={styles.infoVal} style={{ color: '#38bdf8' }}><strong>{student.nama_ibu && student.nama_ibu !== '-' ? student.nama_ibu : '(Belum Ada Data Ibu)'}</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Akun Login Wali (Ibu)</span>
                <span className={styles.infoVal}>
                  <strong style={{ color: '#34d399' }}>{student.guardian_name || student.nama_ibu}</strong>
                  <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.7 }}>(Prioritas Akun Ibu)</span>
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>No. Handphone Siswa</span>
                <span className={styles.infoVal}>{student.no_hp}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>No. Kontak Ibu / Wali</span>
                <span className={styles.infoVal}>{student.guardian_phone}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Alamat Domisili</span>
                <span className={styles.infoVal}>{student.alamat_jalan}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'akademik' && (
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              Nilai Gradebook Siswa (Real-time DB)
              <span className={styles.countPill}>{scoredGrades.length} entri</span>
            </h3>
            {gradesLoading ? (
              <p className={styles.emptyNote}>Memuat nilai dari gradebook…</p>
            ) : grades.length === 0 ? (
              <div className={styles.emptyBox}>
                <div style={{ fontSize: '1.6rem' }}>📭</div>
                <div><b>Belum ada nilai.</b></div>
                <div>Guru belum menginput nilai untuk siswa ini di <code>gradebook_entries</code>. Nilai akan muncul otomatis setelah guru menyimpan via Buku Nilai.</div>
                <Link href="/dashboard/grading/gradebook" className="btn btn-secondary" style={{ marginTop: '0.75rem', justifyContent: 'center' }}>
                  Buka Buku Nilai →
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.avgBanner}>
                  <div>
                    <div className={styles.avgLabel}>Rata-rata (dari {scoredGrades.length} entri bernilai)</div>
                    <div className={styles.avgVal}>{avgScore !== null ? `${avgScore} / 100` : '-'}</div>
                  </div>
                  <span className={`${styles.letterBadge} ${styles[`letter_${predikat(avgScore || 0)}`] || styles.letter_C}`}>
                    {predikat(avgScore || 0)}
                  </span>
                </div>
                <div className={styles.gradeList}>
                  {grades.map((g) => (
                    <div key={g.id} className={styles.gradeRow}>
                      <div>
                        <div className={styles.gradeSubject}>{g.subject_name || g.component_name}</div>
                        <div className={styles.gradeSub}>{g.subject_name ? g.component_name : fmtDate(g.calculated_at)}{g.max_raw_score ? ` · maks ${g.max_raw_score}` : ''}</div>
                      </div>
                      <div className={styles.gradeRight}>
                        <span className={styles.gradeScore}>
                          {typeof g.raw_score === 'number' ? g.raw_score : '—'}
                        </span>
                        {typeof g.raw_score === 'number' && (
                          <span className={`${styles.letterBadge} ${styles[`letter_${predikat(g.raw_score)}`] || styles.letter_C}`}>
                            {predikat(g.raw_score)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={styles.sideStack}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Presensi &amp; Progres LMS (Real-time DB)</h3>
              {progressLoading ? (
                <p className={styles.emptyNote}>Memuat progres…</p>
              ) : !progress ? (
                <div className={styles.emptyBox}>
                  <div style={{ fontSize: '1.6rem' }}>🛰️</div>
                  <div><b>Belum ada data progres.</b></div>
                  <div>Siswa belum tercatat di sesi/LMS. Presensi dihitung dari <code>session_attendances</code> per rombel.</div>
                </div>
              ) : (
                <div className={styles.progressGrid}>
                  <div className={styles.progressItem}>
                    <span>Sesi dihadiri</span>
                    <b>{progress.session_attended}/{progress.session_total}{attendancePct !== null ? ` (${attendancePct}%)` : ''}</b>
                  </div>
                  <div className={styles.meterTrack}>
                    <div className={styles.meterFill} style={{ width: `${attendancePct || 0}%` }} />
                  </div>
                  <div className={styles.progressItem}>
                    <span>Materi tuntas</span>
                    <b>{progress.lesson_completed}/{progress.lesson_total}</b>
                  </div>
                  <div className={styles.progressItem}>
                    <span>Tugas terkumpul</span>
                    <b>{progress.assignment_completed}/{progress.assignment_total}</b>
                  </div>
                  <div className={styles.progressItem}>
                    <span>Kuis dikerjakan</span>
                    <b>{progress.quiz_completed}/{progress.quiz_total}</b>
                  </div>
                  <div className={styles.progressItem}>
                    <span>Progress keseluruhan</span>
                    <b>{progress.overall_progress}%{progress.academic_status ? ` · ${progress.academic_status}` : ''}</b>
                  </div>
                  {progress.teacher_notes && (
                    <div className={styles.teacherNote}>💬 {progress.teacher_notes}</div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Aksi e-Rapor &amp; Kelulusan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/dashboard/reports/cards" className="btn btn-secondary" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  📄 Lihat Buku Rapor Digital
                </Link>
                <Link href="/dashboard/students/qr-scan" className="btn btn-secondary" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  📱 Cetak Kartu QR Presensi
                </Link>
                <Link href="/dashboard/grading/gradebook" className="btn btn-secondary" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  📝 Buka Buku Nilai
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
