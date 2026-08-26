'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './subjects.module.css';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';

type SubjectItem = {
  id: string;
  code: string;
  name: string;
  category: 'Wajib' | 'Peminatan' | 'Muatan Lokal';
  totalHours: number;
};

type ScheduleItem = {
  id: string;
  className: string;
  subjectName: string;
  teacherName: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  timeStart: string;
  timeEnd: string;
  room: string;
};

const MASTER_SUBJECTS: SubjectItem[] = [
  { id: 'subj-1', code: 'MAT-01', name: 'Matematika', category: 'Wajib', totalHours: 4 },
  { id: 'subj-2', code: 'BIN-01', name: 'Bahasa Indonesia', category: 'Wajib', totalHours: 4 },
  { id: 'subj-3', code: 'BIG-01', name: 'Bahasa Inggris', category: 'Wajib', totalHours: 3 },
  { id: 'subj-4', code: 'IPA-01', name: 'Ilmu Pengetahuan Alam (IPA)', category: 'Wajib', totalHours: 4 },
  { id: 'subj-5', code: 'IPS-01', name: 'Ilmu Pengetahuan Sosial (IPS)', category: 'Wajib', totalHours: 3 },
  { id: 'subj-6', code: 'PKN-01', name: 'Pendidikan Pancasila & Kewarganegaraan', category: 'Wajib', totalHours: 2 },
  { id: 'subj-7', code: 'PAI-01', name: 'Pendidikan Agama Islam', category: 'Wajib', totalHours: 2 },
  { id: 'subj-8', code: 'INF-01', name: 'Informatika & Komputer', category: 'Peminatan', totalHours: 2 },
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  
  // Active Filter
  const [selectedClass, setSelectedClass] = useState<string>('PAKET A4');

  // New Schedule Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSchedule, setFormSchedule] = useState({
    className: 'PAKET A4',
    subjectName: 'Pendidikan Agama Islam dan Budi Pekerti',
    teacherName: '',
    day: 'Senin' as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    timeStart: '08:00',
    timeEnd: '09:30',
    room: 'Ruang Kelas',
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [teacherRes, classRes, subjectRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          fetch('/api/v1/academic/subjects', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (list.length > 0) {
            setFormSchedule(prev => ({ ...prev, teacherName: list[0].full_name }));
          }
        }

        if (classRes?.data?.data) {
          const allRombels = classRes.data.data;
          setClassesList(allRombels);
          if (allRombels.length > 0) {
            setSelectedClass(allRombels[0].name);
            setFormSchedule(prev => ({ ...prev, className: allRombels[0].name }));
          }
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          const fetchedSubjects: SubjectItem[] = subjectRes.data.map((s: any) => ({
            id: s.id || s.code,
            code: s.code || 'MAPEL',
            name: s.name,
            category: s.code?.startsWith('7') ? 'Muatan Lokal' : 'Wajib',
            totalHours: 2,
          }));
          setSubjects(fetchedSubjects);
          if (fetchedSubjects.length > 0) {
            setFormSchedule(prev => ({ ...prev, subjectName: fetchedSubjects[0].name }));
          }
        }

        setSchedules([]);

      } catch (err) {
        console.error('Error loading subjects data:', err);
      }
    }
    loadData();
  }, []);

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchedule.teacherName) return;

    const newSch: ScheduleItem = {
      id: String(Date.now()),
      className: formSchedule.className,
      subjectName: formSchedule.subjectName,
      teacherName: formSchedule.teacherName,
      day: formSchedule.day,
      timeStart: formSchedule.timeStart,
      timeEnd: formSchedule.timeEnd,
      room: formSchedule.room,
    };

    setSchedules([newSch, ...schedules]);
    setShowAddForm(false);
    showToast(`✓ Jadwal ${formSchedule.subjectName} untuk ${formSchedule.className} oleh ${formSchedule.teacherName} berhasil disimpan & terhubung!`);
  };

  const filteredSchedules = schedules.filter(s => s.className === selectedClass);

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toastContainer">
          <div className="toast toastSuccess">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Mata Pelajaran &amp; Penjadwalan Rombel</h1>
          <p className={styles.subtitle}>Pengelolaan kurikulum mata pelajaran, alokasi jam mengajar guru, dan struktur jadwal rombel</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            + Tambah Jadwal Pelajaran Rombel
          </button>
        </div>
      </div>

      {/* ── Visual Flow Diagram Integrasi Sistem ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8' }}>
            🔄 ALUR INTEGRASI OTOMATIS PEMBELAJARAN (ADMIN ➔ GURU ➔ SISWA)
          </span>
          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
            Real-time Connected
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 800 }}>LANGKAH 1: SEKOLAH / ADMIN</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.25rem' }}>1. Input Jadwal Pelajaran</div>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.2rem' }}>Admin memetakan Rombel (contoh: PAKET B8), Matpel, &amp; Guru Pengampu.</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 800 }}>LANGKAH 2: GURU PENGAMPU</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.25rem' }}>2. Guru Upload Materi</div>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.2rem' }}>Guru login ➔ Membuat Bab, Modul PDF, Video &amp; Kuis untuk Rombelnya.</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 800 }}>LANGKAH 3: SISWA ROMBEL</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.25rem' }}>3. Siswa Belajar &amp; Latihan</div>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.2rem' }}>Siswa di kelas tersebut membaca materi &amp; mengerjakan tugas di Android/Web.</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Master Subjects & Class Schedule */}
      <div className={styles.gridTwo}>
        {/* Left Column: Master Subjects List */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className={styles.cardTitle}>📚 Daftar Mata Pelajaran</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total: {subjects.length} Matpel</span>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Mata Pelajaran</th>
                  <th>Beban Jam</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td><code>{s.code}</code></td>
                    <td><strong>{s.name}</strong></td>
                    <td><span className="badge badge-info">{s.totalHours} JP / mgg</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Class Schedules Matrix */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 className={styles.cardTitle}>📅 Jadwal Pelajaran Rombel Aktif</h2>
            
            {/* Rombel Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pilih Rombel:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="input"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '160px', fontWeight: 700 }}
              >
                {classesList.length > 0 ? (
                  classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                ) : (
                  <>
                    <option value="PAKET B8">PAKET B8</option>
                    <option value="PAKET C11a">PAKET C11a</option>
                    <option value="PAKET C12a">PAKET C12a</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Schedule Cards Grid */}
          {filteredSchedules.length > 0 ? (
            <div className={styles.scheduleGrid}>
              {filteredSchedules.map(sch => (
                <div key={sch.id} className={styles.scheduleCard}>
                  <div className={styles.scheduleDay}>🗓️ {sch.day} · {sch.timeStart} - {sch.timeEnd}</div>
                  <div className={styles.scheduleSubject}>{sch.subjectName}</div>
                  <div className={styles.scheduleTeacher}>👨‍🏫 Guru: <strong>{sch.teacherName}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-dim)' }}>
                    <span className={styles.scheduleTime}>📍 {sch.room}</span>
                    <Link href={`/dashboard/learning?class=${encodeURIComponent(sch.className)}&subject=${encodeURIComponent(sch.subjectName)}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', color: '#2563eb', padding: '0.2rem 0.4rem' }}>
                      Buka Materi →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Belum ada jadwal pelajaran untuk <strong>{selectedClass}</strong>.
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.75rem' }}
                onClick={() => {
                  setFormSchedule(prev => ({ ...prev, className: selectedClass }));
                  setShowAddForm(true);
                }}
              >
                + Tambah Jadwal untuk {selectedClass}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal In-Page: Form Input Jadwal Pelajaran Rombel ── */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setShowAddForm(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                + Plotting Jadwal &amp; Guru Pengampu
              </h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddForm(false)}>×</button>
            </div>

            <form onSubmit={handleCreateSchedule}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Rombel Target */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rombongan Belajar (Rombel) *</label>
                  <select
                    value={formSchedule.className}
                    onChange={e => setFormSchedule({ ...formSchedule, className: e.target.value })}
                    className="input"
                  >
                    {classesList.length > 0 ? (
                      classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                    ) : (
                      <>
                        <option value="PAKET B8">PAKET B8</option>
                        <option value="PAKET C11a">PAKET C11a</option>
                        <option value="PAKET C12a">PAKET C12a</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mata Pelajaran *</label>
                  <select
                    value={formSchedule.subjectName}
                    onChange={e => setFormSchedule({ ...formSchedule, subjectName: e.target.value })}
                    className="input"
                  >
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* Guru Pengampu */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Guru Pengampu *</label>
                  <select
                    value={formSchedule.teacherName}
                    onChange={e => setFormSchedule({ ...formSchedule, teacherName: e.target.value })}
                    className="input"
                  >
                    {teachers.length > 0 ? (
                      teachers.map((t: any) => <option key={t.id} value={t.full_name}>{t.full_name} (NIP: {t.nip})</option>)
                    ) : (
                      <>
                        <option value="EHA MEIDA KARTIKA">EHA MEIDA KARTIKA</option>
                        <option value="ESI ROKESI">ESI ROKESI</option>
                        <option value="FITRI NAFISAH">FITRI NAFISAH</option>
                        <option value="HASSAN MUSTOFA">HASSAN MUSTOFA</option>
                        <option value="TAUFIQ HIDAYAT">TAUFIQ HIDAYAT</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Hari & Jam Pelajaran */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Hari *</label>
                    <select
                      value={formSchedule.day}
                      onChange={e => setFormSchedule({ ...formSchedule, day: e.target.value as any })}
                      className="input"
                    >
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Sabtu">Sabtu</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Jam Mulai *</label>
                    <input
                      type="time"
                      value={formSchedule.timeStart}
                      onChange={e => setFormSchedule({ ...formSchedule, timeStart: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Jam Selesai *</label>
                    <input
                      type="time"
                      value={formSchedule.timeEnd}
                      onChange={e => setFormSchedule({ ...formSchedule, timeEnd: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan &amp; Hubungkan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
