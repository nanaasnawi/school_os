'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './subjects.module.css';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';
import ScheduleImportModal from './ScheduleImportModal';

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

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [subjectSortField, setSubjectSortField] = useState<'code' | 'name' | 'totalHours'>('name');
  const [subjectSortOrder, setSubjectSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSetSubjectSort = (field: 'code' | 'name' | 'totalHours') => {
    if (subjectSortField === field) {
      setSubjectSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSubjectSortField(field);
      setSubjectSortOrder('asc');
    }
  };

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => {
      let comparison = 0;
      if (subjectSortField === 'code') {
        comparison = (a.code || '').localeCompare(b.code || '');
      } else if (subjectSortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (subjectSortField === 'totalHours') {
        comparison = (a.totalHours || 0) - (b.totalHours || 0);
      }
      return subjectSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [subjects, subjectSortField, subjectSortOrder]);

  // View Mode: 'class' (Per Rombel) atau 'teacher' (Per Guru Pengampu)
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // Add Schedule Modal State (Supports Multi-Rombel)
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

  // Edit Schedule Modal State
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [editForm, setEditForm] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    day: 'Senin' as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    timeStart: '08:00',
    timeEnd: '09:30',
    room: 'Ruang Kelas',
  });

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper toggle & quick select rombel in Add Modal
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

  const refreshSchedules = async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch('/api/v1/academic/schedules', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data)) {
          const dbSchedules: ScheduleItem[] = json.data.map((item: any) => ({
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
        }
      }
    } catch (err) {
      console.error('Error refreshing schedules:', err);
    }
  };

  const handleExportSchedule = () => {
    if (schedules.length === 0) {
      showToast('⚠️ Belum ada jadwal pelajaran untuk diekspor');
      return;
    }
    const exportData = schedules.map(s => ({
      'Hari': s.day,
      'Jam Mulai': s.timeStart,
      'Jam Selesai': s.timeEnd,
      'Mata Pelajaran': s.subjectName,
      'Guru Pengampu': s.teacherName,
      'Rombel / Kelas': s.className,
      'Ruangan': s.room
    }));
    exportToExcel(exportData, 'Jadwal_Pelajaran_SchoolOS');
    showToast('✓ Berkas Excel jadwal pelajaran berhasil diunduh');
  };

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

  const handleOpenEdit = (sched: ScheduleItem) => {
    setEditingSchedule(sched);
    const matchedClass = classesList.find(c => c.name === sched.className);
    const matchedSubj = subjects.find(s => s.name === sched.subjectName);
    const matchedTeach = teachers.find(t => t.full_name === sched.teacherName);

    setEditForm({
      classId: sched.classId || matchedClass?.id || (classesList[0]?.id || ''),
      subjectId: sched.subjectId || matchedSubj?.id || (subjects[0]?.id || ''),
      teacherId: sched.teacherId || matchedTeach?.id || (teachers[0]?.id || ''),
      day: sched.day,
      timeStart: sched.timeStart,
      timeEnd: sched.timeEnd,
      room: sched.room || 'Ruang Kelas',
    });
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(`/api/v1/academic/schedules/${editingSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          class_id: editForm.classId || undefined,
          subject_id: editForm.subjectId || undefined,
          teacher_id: editForm.teacherId || undefined,
          day_of_week: editForm.day,
          start_time: editForm.timeStart,
          end_time: editForm.timeEnd,
          room: editForm.room,
        })
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data;
        setSchedules(prev => prev.map(s => {
          if (s.id === editingSchedule.id) {
            return {
              ...s,
              classId: updated.class_id,
              className: updated.class_name,
              subjectId: updated.subject_id,
              subjectName: updated.subject_name,
              teacherId: updated.teacher_id,
              teacherName: updated.teacher_name,
              day: updated.day_of_week,
              timeStart: updated.start_time,
              timeEnd: updated.end_time,
              room: updated.room,
            };
          }
          return s;
        }));
        setEditingSchedule(null);
        showToast('✓ Perubahan jadwal pelajaran berhasil disimpan!');
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.error?.message || '⚠️ Gagal memperbarui jadwal');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
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

  // Filtered schedules for the active view
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

      {/* Header & Action Buttons */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
            Mata Pelajaran &amp; Penjadwalan Rombel
          </h1>
          <p className={styles.subtitle}>
            Pengelolaan kurikulum mata pelajaran, alokasi jam mengajar guru, dan struktur jadwal rombel
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportSchedule}
            title="Ekspor Jadwal ke Excel"
          >
            📊 Ekspor Jadwal (.xlsx)
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowImportModal(true)}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            📥 Import Jadwal (Excel / PDF)
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            + Tambah Jadwal Manual
          </button>
        </div>
      </div>

      {/* ── Visual Flow Diagram Integrasi Sistem (Clean & Adaptive to Light/Dark) ── */}
      <div className={styles.flowCard}>
        <div className={styles.flowHeader}>
          <span className={styles.flowTitle}>
            🔄 Alur Integrasi Otomatis Pembelajaran (Admin ➔ Guru ➔ Siswa)
          </span>
          <span className={styles.flowBadge}>
            ● Real-time Connected
          </span>
        </div>

        <div className={styles.flowStepsGrid}>
          <div className={styles.flowStepItem}>
            <span className={styles.flowStepTag}>Langkah 1: Sekolah / Admin</span>
            <div className={styles.flowStepHeading}>1. Input Jadwal Pelajaran</div>
            <p className={styles.flowStepDesc}>Admin memetakan Rombel, Matpel, &amp; Guru Pengampu.</p>
          </div>

          <div className={styles.flowStepItem}>
            <span className={styles.flowStepTag}>Langkah 2: Guru Pengampu</span>
            <div className={styles.flowStepHeading}>2. Guru Upload Materi</div>
            <p className={styles.flowStepDesc}>Guru login ➔ Membuat Bab, Modul PDF, Video &amp; Kuis untuk Rombelnya.</p>
          </div>

          <div className={styles.flowStepItem}>
            <span className={styles.flowStepTag}>Langkah 3: Siswa Rombel</span>
            <div className={styles.flowStepHeading}>3. Siswa Belajar &amp; Latihan</div>
            <p className={styles.flowStepDesc}>Siswa di kelas tersebut membaca materi &amp; tugas di Android/Web.</p>
          </div>
        </div>
      </div>


      {/* Main Grid: Master Subjects & Class Schedule */}
      <div className={styles.gridTwo}>
        {/* Left Column: Master Subjects List */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className={styles.cardTitle}>📚 Daftar Mata Pelajaran</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Total: {subjects.length} Matpel
            </span>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="thSortable" onClick={() => handleSetSubjectSort('code')}>
                    <div className="thSortContent">
                      <span>Kode</span>
                      <span className="sortArrows">{subjectSortField === 'code' ? (subjectSortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </div>
                  </th>
                  <th className="thSortable" onClick={() => handleSetSubjectSort('name')}>
                    <div className="thSortContent">
                      <span>Mata Pelajaran</span>
                      <span className="sortArrows">{subjectSortField === 'name' ? (subjectSortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </div>
                  </th>
                  <th className="thSortable" onClick={() => handleSetSubjectSort('totalHours')}>
                    <div className="thSortContent">
                      <span>Beban Jam</span>
                      <span className="sortArrows">{subjectSortField === 'totalHours' ? (subjectSortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSubjects.map(s => (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
                    background: viewMode === 'class' ? 'var(--accent, #0284c7)' : 'transparent',
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
                    background: viewMode === 'teacher' ? 'var(--accent, #0284c7)' : 'transparent',
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
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', flex: 1, fontWeight: 700 }}
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
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', flex: 1, fontWeight: 700 }}
                  >
                    {teachers.length > 0 ? (
                      teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)
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
                  {/* Top Bar: Day & Time + Action Buttons (Edit & Hapus) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <div className={styles.scheduleDay}>
                      🗓️ {sch.day} · {sch.timeStart} - {sch.timeEnd}
                    </div>

                    <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                      {/* Tombol Edit Baru */}
                      <button
                        type="button"
                        title="Edit Jadwal Ini"
                        onClick={() => handleOpenEdit(sch)}
                        style={{
                          background: 'rgba(37, 99, 235, 0.08)',
                          border: '1px solid rgba(37, 99, 235, 0.25)',
                          color: '#2563eb',
                          cursor: 'pointer',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        ✏️ Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        title="Hapus Jadwal Ini"
                        onClick={() => handleDeleteSchedule(sch.id, sch.subjectName)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
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
                    <span className={styles.scheduleTime}>📍 {sch.room || 'Ruang Kelas'}</span>
                    <Link
                      href={`/dashboard/learning?class=${encodeURIComponent(sch.className)}&subject=${encodeURIComponent(sch.subjectName)}`}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.72rem', color: '#2563eb', padding: '0.2rem 0.4rem' }}
                    >
                      Buka Materi →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {viewMode === 'class' ? (
                  <>Belum ada jadwal pelajaran untuk <strong>{selectedClass || 'rombel ini'}</strong>.</>
                ) : (
                  <>Belum ada jadwal mengajar untuk <strong>{selectedTeacher || 'guru ini'}</strong>.</>
                )}
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.85rem' }}
                onClick={() => setShowAddForm(true)}
              >
                + Tambah Jadwal Sekarang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: TAMBAH JADWAL (MULTI-ROMBEL) ── */}
      {showAddForm && (
        <div className="globalModalOverlay">
          <div className="globalModalCard" style={{ maxWidth: '640px' }}>
            <div className="globalModalHeader">
              <h3 className="globalModalTitle">
                <span>➕</span> Plotting Jadwal Pelajaran (Multi-Rombel)
              </h3>
              <button type="button" className="globalModalClose" onClick={() => setShowAddForm(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="globalModalBody">
                {/* Rombel Selector */}
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className={styles.label} style={{ margin: 0 }}>
                      Pilih Rombel Target * ({formSchedule.selectedClassIds.length} Dipilih)
                    </label>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button type="button" onClick={() => selectClassesByPackage('Paket A')} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+ Paket A</button>
                      <button type="button" onClick={() => selectClassesByPackage('Paket B')} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+ Paket B</button>
                      <button type="button" onClick={() => selectClassesByPackage('Paket C')} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+ Paket C</button>
                      <button type="button" onClick={selectAllClasses} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Semua</button>
                      <button type="button" onClick={clearAllClasses} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#ef4444' }}>Reset</button>
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
                          }}
                        >
                          <span>{c.name}</span>
                          <span>{isSelected ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
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
                    {teachers.map((t: any) => (
                      <option key={t.id} value={t.full_name}>
                        {t.full_name} {t.subject ? `• ${t.subject}` : ''}
                      </option>
                    ))}
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
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Hari & Jam */}
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

                {/* Ruang */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ruangan</label>
                  <input
                    type="text"
                    value={formSchedule.room}
                    onChange={e => setFormSchedule({ ...formSchedule, room: e.target.value })}
                    className="input"
                    placeholder="Contoh: Ruang Kelas 1 / Lab IPA"
                  />
                </div>
              </div>

              <div className="globalModalFooter">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting || formSchedule.selectedClassIds.length === 0}>
                  {isSubmitting ? 'Menyimpan...' : '💾 Simpan Plotting Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT JADWAL (FITUR BARU) ── */}
      {editingSchedule && (
        <div className="globalModalOverlay">
          <div className="globalModalCard" style={{ maxWidth: '580px' }}>
            <div className="globalModalHeader">
              <h3 className="globalModalTitle">
                <span>✏️</span> Edit Jadwal Pelajaran
              </h3>
              <button type="button" className="globalModalClose" onClick={() => setEditingSchedule(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateSchedule} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="globalModalBody">
                {/* Rombel */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rombel / Kelas *</label>
                  <select
                    value={editForm.classId}
                    onChange={e => setEditForm({ ...editForm, classId: e.target.value })}
                    className="input"
                    required
                  >
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Guru Pengampu */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Guru Pengampu *</label>
                  <select
                    value={editForm.teacherId}
                    onChange={e => setEditForm({ ...editForm, teacherId: e.target.value })}
                    className="input"
                    required
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mata Pelajaran *</label>
                  <select
                    value={editForm.subjectId}
                    onChange={e => setEditForm({ ...editForm, subjectId: e.target.value })}
                    className="input"
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Hari & Jam */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Hari *</label>
                    <select
                      value={editForm.day}
                      onChange={e => setEditForm({ ...editForm, day: e.target.value as any })}
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
                      value={editForm.timeStart}
                      onChange={e => setEditForm({ ...editForm, timeStart: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Jam Selesai *</label>
                    <input
                      type="time"
                      value={editForm.timeEnd}
                      onChange={e => setEditForm({ ...editForm, timeEnd: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                {/* Ruang */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ruangan</label>
                  <input
                    type="text"
                    value={editForm.room}
                    onChange={e => setEditForm({ ...editForm, room: e.target.value })}
                    className="input"
                    placeholder="Ruang Kelas / Lab"
                  />
                </div>
              </div>

              <div className="globalModalFooter">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingSchedule(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: IMPORT JADWAL (EXCEL / PDF) ── */}
      <ScheduleImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        teachers={teachers}
        classes={classesList}
        subjects={subjects}
        onImportSuccess={() => {
          refreshSchedules();
        }}
        showToast={showToast}
      />
    </div>
  );
}
