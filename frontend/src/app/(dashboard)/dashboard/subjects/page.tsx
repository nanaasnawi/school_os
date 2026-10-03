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
  classId?: string;
  className: string;
  subjectId?: string;
  subjectName: string;
  teacherId?: string;
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
  
  // View & Filter Mode: 'class' (Rombel) atau 'teacher' (Guru Pengampu)
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // New Schedule Form State (Mendukung Multi-Rombel Sekaligus)
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSchedule, setFormSchedule] = useState({
    selectedClassIds: [] as string[],
    subjectName: '',
    teacherName: '',
    day: 'Senin' as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    timeStart: '08:00',
    timeEnd: '09:30',
    room: 'Ruang Kelas',
  });

  // Helper toggle & quick select rombel
  const toggleClassSelect = (id: string) => {
    setFormSchedule(prev => {
      const exists = prev.selectedClassIds.includes(id);
      return {
        ...prev,
        selectedClassIds: exists
          ? prev.selectedClassIds.filter(cId => cId !== id)
          : [...prev.selectedClassIds, id]
      };
    });
  };

  const selectClassesByPackage = (prefix: string) => {
    const matchingIds = classesList
      .filter(c => c.name.toUpperCase().includes(prefix.toUpperCase()))
      .map(c => c.id);
    setFormSchedule(prev => {
      const set = new Set([...prev.selectedClassIds, ...matchingIds]);
      return { ...prev, selectedClassIds: Array.from(set) };
    });
  };

  const selectAllClasses = () => {
    setFormSchedule(prev => ({
      ...prev,
      selectedClassIds: classesList.map(c => c.id)
    }));
  };

  const clearAllClasses = () => {
    setFormSchedule(prev => ({
      ...prev,
      selectedClassIds: []
    }));
  };

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
        const [teacherRes, classRes, subjectRes, scheduleRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          fetch('/api/v1/academic/subjects', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/v1/academic/schedules', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (list.length > 0) {
            setSelectedTeacher(list[0].full_name);
            setFormSchedule(prev => ({
              ...prev,
              teacherName: list[0].full_name,
              subjectName: list[0].subject || prev.subjectName,
            }));
          }
        }

        if (classRes?.data?.data) {
          const allRombels = classRes.data.data;
          setClassesList(allRombels);
          if (allRombels.length > 0) {
            setSelectedClass(allRombels[0].name);
            setFormSchedule(prev => ({
              ...prev,
              selectedClassIds: prev.selectedClassIds.length > 0 ? prev.selectedClassIds : [allRombels[0].id]
            }));
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

        if (scheduleRes?.data && Array.isArray(scheduleRes.data)) {
          const dbSchedules: ScheduleItem[] = scheduleRes.data.map((item: any) => ({
            id: item.id,
            classId: item.class_id,
            className: item.class_name,
            subjectId: item.subject_id,
            subjectName: item.subject_name,
            teacherId: item.teacher_id,
            teacherName: item.teacher_name,
            day: item.day_of_week,
            timeStart: item.start_time,
            timeEnd: item.end_time,
            room: item.room || 'Ruang Kelas',
          }));
          setSchedules(dbSchedules);
        } else {
          setSchedules([]);
        }

      } catch (err) {
        console.error('Error loading subjects data:', err);
      }
    }
    loadData();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchedule.teacherName) {
      showToast('⚠️ Silakan pilih Guru Pengampu');
      return;
    }
    if (formSchedule.selectedClassIds.length === 0) {
      showToast('⚠️ Pilih minimal 1 Rombel untuk jadwal pelajaran');
      return;
    }

    const matchedSubject = subjects.find(s => s.name === formSchedule.subjectName);
    const matchedTeacher = teachers.find(t => t.full_name === formSchedule.teacherName);

    if (!matchedSubject || !matchedTeacher) {
      showToast('⚠️ Data mata pelajaran atau guru belum lengkap');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch('/api/v1/academic/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          class_ids: formSchedule.selectedClassIds,
          subject_id: matchedSubject.id,
          teacher_id: matchedTeacher.id,
          day_of_week: formSchedule.day,
          start_time: formSchedule.timeStart,
          end_time: formSchedule.timeEnd,
          room: formSchedule.room || 'Ruang Kelas',
        })
      });

      const json = await res.json();
      if (res.ok && json.data) {
        const items = Array.isArray(json.data) ? json.data : [json.data];
        const newScheds: ScheduleItem[] = items.map((item: any) => ({
          id: item.id,
          classId: item.class_id,
          className: item.class_name,
          subjectId: item.subject_id,
          subjectName: item.subject_name,
          teacherId: item.teacher_id,
          teacherName: item.teacher_name,
          day: item.day_of_week,
          timeStart: item.start_time,
          timeEnd: item.end_time,
          room: item.room || 'Ruang Kelas',
        }));
        setSchedules(prev => [...newScheds, ...prev]);
        setShowAddForm(false);
        showToast(`✓ Jadwal berhasil diplot untuk ${newScheds.length} rombel!`);
      } else {
        showToast(json?.error?.message || '⚠️ Gagal menyimpan jadwal');
      }
    } catch (err: any) {
      console.error('Error creating schedule:', err);
      showToast('⚠️ Gagal menghubungi server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string, name: string) => {
    if (!confirm(`Hapus jadwal "${name}"?`)) return;

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(`/api/v1/academic/schedules/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        setSchedules(prev => prev.filter(s => s.id !== id));
        showToast('✓ Jadwal berhasil dihapus');
      } else {
        showToast('⚠️ Gagal menghapus jadwal');
      }
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      showToast('⚠️ Gagal menghapus jadwal');
    }
  };

  const filteredSchedules = schedules.filter(s => {
    if (viewMode === 'class') {
      return s.className === selectedClass;
    } else {
      return s.teacherName === selectedTeacher;
    }
  });

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
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.2rem' }}>Admin memetakan Rombel, Matpel, &amp; Guru Pengampu.</div>
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
          {/* Header & Mode Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                📅 Jadwal Pelajaran &amp; Mengajar
              </h2>

              {/* Tab Filter Switcher */}
              <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('class')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'class' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'class' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  🏛️ Per Rombel
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('teacher')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'teacher' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'teacher' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  👨‍🏫 Per Guru Pengampu
                </button>
              </div>
            </div>

            {/* Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              {viewMode === 'class' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pilih Rombel:</span>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="input"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', flex: 1, fontWeight: 700 }}
                  >
                    {classesList.length > 0 ? (
                      classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                    ) : (
                      <option value="">Belum ada rombel</option>
                    )}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pilih Guru:</span>
                  <select
                    value={selectedTeacher}
                    onChange={e => setSelectedTeacher(e.target.value)}
                    className="input"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', flex: 1, fontWeight: 700 }}
                  >
                    {teachers.length > 0 ? (
                      teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name} (NIP: {t.nip})</option>)
                    ) : (
                      <option value="">Belum ada data guru</option>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Cards Grid */}
          {filteredSchedules.length > 0 ? (
            <div className={styles.scheduleGrid}>
              {filteredSchedules.map(sch => (
                <div key={sch.id} className={styles.scheduleCard}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className={styles.scheduleDay}>🗓️ {sch.day} · {sch.timeStart} - {sch.timeEnd}</div>
                    <button
                      type="button"
                      title="Hapus Jadwal"
                      onClick={() => handleDeleteSchedule(sch.id, sch.subjectName)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                  
                  <div className={styles.scheduleSubject}>{sch.subjectName}</div>
                  <div className={styles.scheduleTeacher}>
                    {viewMode === 'teacher' ? (
                      <>🏛️ Rombel: <strong>{sch.className}</strong></>
                    ) : (
                      <>👨‍🏫 Guru: <strong>{sch.teacherName}</strong></>
                    )}
                  </div>
                  
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
                {viewMode === 'class' ? (
                  <>Belum ada jadwal pelajaran untuk <strong>{selectedClass}</strong>.</>
                ) : (
                  <>Belum ada jadwal mengajar untuk <strong>{selectedTeacher}</strong>.</>
                )}
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.75rem' }}
                onClick={() => {
                  if (viewMode === 'class') {
                    setFormSchedule(prev => ({ ...prev, className: selectedClass }));
                  } else if (selectedTeacher) {
                    setFormSchedule(prev => ({ ...prev, teacherName: selectedTeacher }));
                  }
                  setShowAddForm(true);
                }}
              >
                + Tambah Jadwal Baru
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
                {/* Rombel Target (Multi-Select) */}
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className={styles.label} style={{ margin: 0 }}>
                      Rombongan Belajar (Rombel): <strong style={{ color: '#2563eb' }}>{formSchedule.selectedClassIds.length} Terpilih</strong> *
                    </label>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => selectClassesByPackage('PAKET A')}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                      >
                        + Paket A
                      </button>
                      <button
                        type="button"
                        onClick={() => selectClassesByPackage('PAKET B')}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                      >
                        + Paket B
                      </button>
                      <button
                        type="button"
                        onClick={() => selectClassesByPackage('PAKET C')}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                      >
                        + Paket C
                      </button>
                      <button
                        type="button"
                        onClick={selectAllClasses}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={clearAllClasses}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '0.4rem',
                    maxHeight: '135px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}>
                    {classesList.map(c => {
                      const isSelected = formSchedule.selectedClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleClassSelect(c.id)}
                          style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#1d4ed8' : '#1e293b',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{c.name}</span>
                          <span style={{ fontSize: '0.85rem' }}>{isSelected ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                  {formSchedule.selectedClassIds.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                      * Pilih minimal 1 rombel untuk mem-plotting jadwal mengajar.
                    </div>
                  )}
                </div>

                {/* Guru Pengampu */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Guru Pengampu *</label>
                  <select
                    value={formSchedule.teacherName}
                    onChange={e => {
                      const selectedName = e.target.value;
                      const teacherObj = teachers.find(t => t.full_name === selectedName);
                      setFormSchedule(prev => ({
                        ...prev,
                        teacherName: selectedName,
                        subjectName: teacherObj?.subject || prev.subjectName,
                      }));
                    }}
                    className="input"
                    required
                  >
                    {teachers.length > 0 ? (
                      teachers.map((t: any) => (
                        <option key={t.id} value={t.full_name}>
                          {t.full_name} {t.nip ? `(NIP: ${t.nip})` : ''} {t.subject ? `• ${t.subject}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">Memuat data guru...</option>
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
                    required
                  >
                    {subjects.length > 0 ? (
                      subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    ) : (
                      <option value="">Memuat mata pelajaran...</option>
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
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting || formSchedule.selectedClassIds.length === 0}>
                  {isSubmitting ? 'Menyimpan...' : '💾 Simpan & Hubungkan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
