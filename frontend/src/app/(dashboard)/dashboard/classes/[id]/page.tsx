'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './classDetail.module.css';
import { listClasses, listTeachers, listStudents } from '@/lib/sdk/sdk.gen';

type ClassProfile = {
  id: string;
  name: string;
  academic_year: string;
  grade_level: string;
  homeroom_teacher: string;
  student_count: number;
  room: string;
};

type RombelStudent = {
  id: string;
  nisn: string;
  full_name: string;
  gender: string;
  attendance_pct: string;
  enrolled_date: string;
};

const DEMO_CLASSES: Record<string, ClassProfile> = {
  '1': { id: '1', name: 'Kelas 10-A IPA', academic_year: '2025/2026 (Ganjil)', grade_level: '10', homeroom_teacher: 'Bpk. Hendra Wijaya', student_count: 28, room: 'R. 101' },
  '2': { id: '2', name: 'Kelas 10-B IPS', academic_year: '2025/2026 (Ganjil)', grade_level: '10', homeroom_teacher: 'Ibu Ratna Pertiwi', student_count: 26, room: 'R. 102' },
  '3': { id: '3', name: 'Kelas 11-A IPA', academic_year: '2025/2026 (Ganjil)', grade_level: '11', homeroom_teacher: 'Ibu Dewi Susanti', student_count: 30, room: 'R. 201' },
};

const DEFAULT_FALLBACK: ClassProfile = {
  id: '1',
  name: 'Kelas 10-A IPA',
  academic_year: '2025/2026 (Ganjil)',
  grade_level: '10',
  homeroom_teacher: 'Bpk. Hendra Wijaya',
  student_count: 28,
  room: 'R. 101',
};

const DEMO_ROMBEL_STUDENTS: RombelStudent[] = [
  { id: '1', nisn: '0081234567', full_name: 'Ahmad Fauzi', gender: 'Laki-laki', attendance_pct: '98%', enrolled_date: '15 Jul 2025' },
  { id: '2', nisn: '0081234568', full_name: 'Budi Santoso', gender: 'Laki-laki', attendance_pct: '95%', enrolled_date: '15 Jul 2025' },
  { id: '3', nisn: '0081234569', full_name: 'Citra Dewi', gender: 'Perempuan', attendance_pct: '96%', enrolled_date: '15 Jul 2025' },
  { id: '4', nisn: '0081234571', full_name: 'Eko Prasetyo', gender: 'Laki-laki', attendance_pct: '100%', enrolled_date: '15 Jul 2025' },
  { id: '5', nisn: '0081234572', full_name: 'Fatimah Azzahra', gender: 'Perempuan', attendance_pct: '97%', enrolled_date: '16 Jul 2025' },
  { id: '6', nisn: '0081234573', full_name: 'Gilang Ramadhan', gender: 'Laki-laki', attendance_pct: '92%', enrolled_date: '16 Jul 2025' },
  { id: '7', nisn: '0081234574', full_name: 'Hana Pertiwi', gender: 'Perempuan', attendance_pct: '99%', enrolled_date: '17 Jul 2025' },
];


export default function ClassDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';

  const [profile, setProfile] = useState<ClassProfile>(DEFAULT_FALLBACK);
  const [students, setStudents] = useState<RombelStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadClassData() {
      try {
        const [classRes, teacherRes, studentRes] = await Promise.all([
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listStudents({ query: { page_size: 500 } as any }).catch(() => null),
        ]);

        const teacherMap = new Map<string, string>();
        if (teacherRes?.data?.data) {
          teacherRes.data.data.forEach((t: any) => {
            if (t.id && t.full_name) teacherMap.set(t.id, t.full_name);
          });
        }

        let currentClass: any = null;
        if (classRes?.data?.data) {
          currentClass = classRes.data.data.find((c: any) => c.id === id) || classRes.data.data[0];
        }

        if (currentClass) {
          const teacherName = currentClass.homeroom_teacher_id ? teacherMap.get(currentClass.homeroom_teacher_id) : null;
          
          const allStudents = studentRes?.data?.data || [];
          const enrolled = allStudents.filter((s: any) => s.class_name === currentClass.name);
          
          const mappedStudents: RombelStudent[] = enrolled.map((s: any) => ({
            id: s.id,
            nisn: s.nisn,
            full_name: s.full_name,
            gender: 'Laki-laki',
            attendance_pct: '100%',
            enrolled_date: s.updated_at ? new Date(s.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 Jan 2025',
          }));

          setProfile({
            id: currentClass.id,
            name: currentClass.name,
            academic_year: '2024/2025 (Semester 2)',
            grade_level: currentClass.name.startsWith('PAKET A') ? 'Paket A' : currentClass.name.startsWith('PAKET B') ? 'Paket B' : 'Paket C',
            homeroom_teacher: teacherName || 'Belum ditentukan',
            student_count: mappedStudents.length,
            room: 'R. Utama',
          });

          setStudents(mappedStudents);
        }
      } catch (err) {
        console.error('Error loading class detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClassData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Memuat profil rombongan belajar...</span>
      </div>
    );
  }

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn.includes(search)
  );

  return (
    <div className={styles.page}>
      {/* Header & Breadcrumbs */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <p className={styles.subtitle}>Detail rombongan belajar, wali kelas pengampu, dan daftar siswa terdaftar</p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/dashboard/classes" className="btn btn-secondary btn-sm">
            ← Kembali ke Daftar Kelas
          </Link>
          <Link href={`/dashboard/classes/${id}/edit`} className="btn btn-ghost btn-sm">
            ✏️ Edit Kelas
          </Link>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarBox}>🏫</div>
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.className}>{profile.name}</h1>
              <span className="badge badge-info">Tingkat {profile.grade_level}</span>
            </div>
            <p className={styles.classSub}>
              Tahun Ajaran: <strong>{profile.academic_year}</strong>
              {' · '}
              Lokasi Ruangan: <strong>{profile.room}</strong>
              {' · '}
              Wali Kelas: <strong>{profile.homeroom_teacher}</strong>
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/enrollments/new" className="btn btn-primary btn-sm">
            + Daftarkan Siswa Baru ke Rombel
          </Link>
        </div>
      </div>

      {/* Rombel Specifications Grid */}
      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Spesifikasi Ruang Kelas</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ID Rombel Sistem</span>
              <span className={styles.infoVal}>ROMBEL-{profile.id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nama Rombongan Belajar</span>
              <span className={styles.infoVal}>{profile.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tingkat Pendidikan</span>
              <span className={styles.infoVal}>Kelas {profile.grade_level}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Wali Kelas Pengampu</span>
              <span className={styles.infoVal}>{profile.homeroom_teacher}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Lokasi Ruangan Gedung</span>
              <span className={styles.infoVal}>{profile.room}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ringkasan Pendaftaran &amp; Kapasitas</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Jumlah Siswa Terdaftar</span>
              <span className={styles.infoVal}>{profile.student_count} Siswa</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Batas Maksimum Kapasitas</span>
              <span className={styles.infoVal}>32 Kursi Siswa</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Sisa Kuota Bangku Kosong</span>
              <span className={styles.infoVal}>4 Bangku Tersedia</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status Rombel</span>
              <span className="badge badge-active">● Aktif Berjalan</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Anggota Rombongan Belajar (Daftar Nama Siswa) ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderArea}>
          <div>
            <h3 className={styles.cardTitle}>Daftar Siswa Anggota Rombel ({profile.name})</h3>
            <p className={styles.subtitle}>Daftar seluruh siswa terdaftar dalam rombongan belajar ini</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Cari siswa dalam rombel ini..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ width: '220px' }}
            />
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>NISN</th>
              <th>Nama Lengkap Siswa</th>
              <th>Jenis Kelamin</th>
              <th>Tanggal Plotting Rombel</th>
              <th>Presensi Akumulasi</th>
              <th style={{ textAlign: 'right' }}>Aksi Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => (
              <tr key={s.id}>
                <td><code>{s.nisn}</code></td>
                <td className={styles.studentName}>{s.full_name}</td>
                <td>{s.gender}</td>
                <td>{s.enrolled_date}</td>
                <td>
                  <span className="badge badge-active">
                    {s.attendance_pct} Hadir
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/dashboard/students/${s.id}`} className="btn btn-secondary btn-sm">
                    Profil Siswa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.pagination}>
          <span>Menampilkan {filteredStudents.length} dari {profile.student_count} siswa anggota rombel</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </div>
    </div>
  );
}
