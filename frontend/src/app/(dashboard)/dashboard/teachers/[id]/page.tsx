'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './teacherDetail.module.css';

type TeacherProfile = {
  id: string;
  full_name: string;
  nuptk: string;
  nip: string;
  jk: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  status_kepegawaian: string;
  jenis_ptk: string;
  agama: string;
  alamat_jalan: string;
  no_hp: string;
  email: string;
  subject: string;
  status: string;
  is_active: boolean;
  classes_taught: string[];
  total_students: number;
};

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kepegawaian' | 'biodata' | 'beban_ajar'>('kepegawaian');

  useEffect(() => {
    let cancelled = false;

    const fetchTeacher = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch(`http://localhost:8000/api/v1/teachers/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.data && !cancelled) {
            const d = json.data;
            setProfile({
              id: d.id,
              full_name: d.full_name || 'Tanpa Nama',
              nuptk: d.nuptk || '-',
              nip: d.nip || '-',
              jk: d.jk === 'L' || d.jk === 'Laki-laki' ? 'Laki-laki' : (d.jk === 'P' || d.jk === 'Perempuan' ? 'Perempuan' : (d.jk || '-')),
              tempat_lahir: d.tempat_lahir || '-',
              tanggal_lahir: d.tanggal_lahir || '-',
              status_kepegawaian: d.status_kepegawaian || 'Guru Honor Sekolah',
              jenis_ptk: d.jenis_ptk || 'Guru Mapel',
              agama: d.agama || 'Islam',
              alamat_jalan: d.alamat_jalan || '-',
              no_hp: d.no_hp || '-',
              email: d.email || '-',
              subject: d.subject || 'Guru Mata Pelajaran',
              status: d.status || 'ACTIVE',
              is_active: d.is_active !== undefined ? d.is_active : ((d.status || '').toLowerCase() === 'active' || (d.status || '').toLowerCase() === 'aktif'),
              classes_taught: ['Kelas 10-A IPA', 'Kelas 11-A IPA'],
              total_students: 54,
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching teacher detail:', err);
      }

      if (!cancelled) {
        // Fallback jika id demo atau offline
        setProfile({
          id,
          full_name: 'Pendidik / Guru Terdaftar',
          nuptk: '-',
          nip: '-',
          jk: 'Laki-laki',
          tempat_lahir: 'Jakarta',
          tanggal_lahir: '15 Maret 1985',
          status_kepegawaian: 'Guru Tetap Yayasan / PNS',
          jenis_ptk: 'Guru Mata Pelajaran',
          agama: 'Islam',
          alamat_jalan: 'Jl. Pendidikan No. 12',
          no_hp: '0812-3456-7890',
          email: 'guru@school.os',
          subject: 'Matematika',
          status: 'ACTIVE',
          is_active: true,
          classes_taught: ['Kelas 10-A IPA', 'Kelas 11-A IPA'],
          total_students: 52,
        });
        setLoading(false);
      }
    };

    if (id) {
      fetchTeacher();
    }
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Memuat data detail guru...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Data Guru Tidak Ditemukan</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Guru dengan ID {id} tidak ditemukan di database sekolah.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/dashboard/teachers" className="btn btn-secondary">
              ← Kembali ke Daftar Guru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Generate inisial avatar dari nama asli (bukan ID)
  const cleanName = profile.full_name.replace(/^(Bpk\.|Ibu|Drs\.|Dr\.|H\.|Hj\.)\s+/i, '');
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GT';

  return (
    <div className={styles.page}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard" className={styles.breadLink}>Beranda</Link>
        <span className={styles.breadSep}>/</span>
        <Link href="/dashboard/teachers" className={styles.breadLink}>Tenaga Pendidik</Link>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{profile.full_name}</span>
      </div>

      {/* ── Hero Profile Card ── */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarBox}>{initials}</div>
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.teacherName}>{profile.full_name}</h1>
              <span className={styles.subjectBadge}>{profile.subject}</span>
              <span style={{
                background: profile.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: profile.is_active ? '#34d399' : '#f87171',
                border: `1px solid ${profile.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {profile.is_active ? '🟢 Aktif Mengajar' : '🔴 Non-Aktif'}
              </span>
            </div>
            <p className={styles.teacherSub}>
              <span>NUPTK: <strong className={styles.monoText}>{profile.nuptk}</strong></span>
              {' · '}
              <span>NIP: <strong className={styles.monoText}>{profile.nip}</strong></span>
              {' · '}
              <span>Email: <strong>{profile.email}</strong></span>
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/teachers" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            ← Kembali
          </Link>
          <Link href={`/dashboard/teachers/${id}/edit`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            ✏️ Edit Data Guru
          </Link>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('kepegawaian')}
          style={{
            background: activeTab === 'kepegawaian' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'kepegawaian' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          📋 Kepegawaian &amp; Dapodik
        </button>
        <button
          onClick={() => setActiveTab('biodata')}
          style={{
            background: activeTab === 'biodata' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'biodata' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          👤 Biodata &amp; Kontak Pribadi
        </button>
        <button
          onClick={() => setActiveTab('beban_ajar')}
          style={{
            background: activeTab === 'beban_ajar' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'beban_ajar' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          📚 Beban Ajar &amp; Kelas
        </button>
      </div>

      {/* ── Content Grids ── */}
      {activeTab === 'kepegawaian' && (
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Data Identitas Kepegawaian (Dapodik Kemendikbud)</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Lengkap &amp; Gelar</span>
                <span className={styles.infoVal}>{profile.full_name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NUPTK</span>
                <span className={styles.infoVal}><code className={styles.monoText}>{profile.nuptk}</code></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NIP Pegawai</span>
                <span className={styles.infoVal}><code className={styles.monoText}>{profile.nip}</code></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status Kepegawaian</span>
                <span className={styles.infoVal}>{profile.status_kepegawaian}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Jenis PTK</span>
                <span className={styles.infoVal}>{profile.jenis_ptk}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mata Pelajaran Utama</span>
                <span className={styles.infoVal}><strong>{profile.subject}</strong></span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Status Akun &amp; Sistem</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ID Sistem (UUID Database)</span>
                <span className={styles.infoVal}><code style={{ fontSize: '0.78rem', color: 'var(--accent-hover)' }}>{profile.id}</code></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status Penugasan</span>
                <span className={styles.infoVal}>{profile.is_active ? 'Aktif Bertugas' : 'Tidak Aktif / Cuti'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Akses Portal Guru (Web &amp; Mobile)</span>
                <span className={styles.infoVal} style={{ color: '#34d399', fontWeight: 700 }}>✅ Terhubung</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email Akun Portal</span>
                <span className={styles.infoVal}>{profile.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'biodata' && (
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Biodata Pribadi</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Jenis Kelamin</span>
                <span className={styles.infoVal}>{profile.jk}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tempat Lahir</span>
                <span className={styles.infoVal}>{profile.tempat_lahir}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tanggal Lahir</span>
                <span className={styles.infoVal}>{profile.tanggal_lahir}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Agama</span>
                <span className={styles.infoVal}>{profile.agama}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Kontak &amp; Domisili</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nomor WhatsApp / HP</span>
                <span className={styles.infoVal}>{profile.no_hp}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email Korespondensi</span>
                <span className={styles.infoVal}>{profile.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Alamat Tempat Tinggal</span>
                <span className={styles.infoVal}>{profile.alamat_jalan}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'beban_ajar' && (
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Beban Mengajar &amp; Rombel</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mata Pelajaran yang Diampu</span>
                <span className={styles.infoVal}><strong>{profile.subject}</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total Siswa Diampu</span>
                <span className={styles.infoVal}><strong>{profile.total_students} Siswa</strong></span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Daftar Rombel / Kelas Aktif</span>
                <div className={styles.chipList}>
                  {profile.classes_taught.map((c: string) => (
                    <span key={c} className={styles.classChip}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Aktivitas Pembelajaran Terkini</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📝 Kuis &amp; Penilaian Aktif</div>
                <div style={{ marginTop: '0.25rem' }}>Ulangan Harian Bab 1 — {profile.subject} ({profile.classes_taught[0] || 'Kelas 10'})</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📊 Presensi &amp; Kehadiran Guru</div>
                <div style={{ marginTop: '0.25rem' }}>Tingkat kehadiran semester berjalan: <strong style={{ color: '#34d399' }}>98.4%</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
