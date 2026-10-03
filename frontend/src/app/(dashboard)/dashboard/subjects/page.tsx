'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './subjects.module.css';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';
import ScheduleImportModal from './ScheduleImportModal';
import { downloadScheduleExcelTemplate } from '@/lib/scheduleImport';

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
  const [activeTab, setActiveTab] = useState<'schedules' | 'subjects'>('schedules');
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('table');

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  // Search & Filters
  const [search, setSearch] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');

  // New Schedule Modal State (Supports Multi-Rombel)
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

  // Excel & PDF Import Modal State
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

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
      const matchDay = selectedDayFilter === 'ALL' || s.day === selectedDayFilter;
      const matchTeacher = selectedTeacherFilter === 'ALL' || s.teacherName === selectedTeacherFilter;
      const matchSearch = !search.trim() ||
        s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(search.toLowerCase()) ||
        s.className.toLowerCase().includes(search.toLowerCase()) ||
        s.room.toLowerCase().includes(search.toLowerCase());

      return matchClass && matchDay && matchTeacher && matchSearch;
    });
  }, [schedules, selectedClassFilter, selectedDayFilter, selectedTeacherFilter, search]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      return !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase());
    });
  }, [subjects, search]);

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

      {/* Header (Aligned with SchoolOS Enterprise Standard) */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            Mata Pelajaran &amp; Penjadwalan Rombel
          </h1>
          <p className={styles.subtitle}>
            Alokasi kurikulum mata pelajaran, plotting jam mengajar guru, dan pemetaan jadwal rombel terpadu
          </p>
        </div>
      </div>

      {/* Top Action Pills (Reference Design System) */}
      <div className="tableActionRow">
        <button
          type="button"
          className="tableActionBtn"
          onClick={() => setShowAddForm(true)}
          style={{ background: 'var(--accent, #0284c7)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah Jadwal Pelajaran</span>
        </button>

        <button
          type="button"
          className="tableActionBtn"
          onClick={() => setShowImportModal(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Import Jadwal (Excel / PDF)</span>
        </button>

        <button
          type="button"
          className="tableActionBtn"
          onClick={handleExportSchedule}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Ekspor Jadwal Excel (.xlsx)</span>
        </button>

        <button
          type="button"
          className="tableActionBtn"
          onClick={() => downloadScheduleExcelTemplate(teachers, classesList, subjects)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Unduh Template Excel</span>
        </button>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light, #e2e8f0)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'schedules' ? '#eff6ff' : 'transparent',
            color: activeTab === 'schedules' ? '#1d4ed8' : '#64748b',
            fontWeight: activeTab === 'schedules' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>📅 Matriks Jadwal Pelajaran</span>
          <span style={{
            background: activeTab === 'schedules' ? '#2563eb' : '#cbd5e1',
            color: '#ffffff',
            padding: '1px 6px',
            borderRadius: '10px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            {schedules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'subjects' ? '#eff6ff' : 'transparent',
            color: activeTab === 'subjects' ? '#1d4ed8' : '#64748b',
            fontWeight: activeTab === 'subjects' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>📚 Direktori Mata Pelajaran</span>
          <span style={{
            background: activeTab === 'subjects' ? '#2563eb' : '#cbd5e1',
            color: '#ffffff',
            padding: '1px 6px',
            borderRadius: '10px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            {subjects.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: SCHEDULES MANAGEMENT ── */}
      {activeTab === 'schedules' && (
        <div className="tableCard">
          {/* Top Toolbar (Unified Filter System) */}
          <div className="tableToolbar">
            <div className="tableInfoText">
              Menampilkan <strong>{filteredSchedules.length}</strong> jadwal pelajaran {filteredSchedules.length !== schedules.length ? `(difilter dari ${schedules.length} total)` : ''}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Filter Rombel */}
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="entriesSelect"
                style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              >
                <option value="ALL">Semua Rombel</option>
                {classesList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {/* Filter Hari */}
              <select
                value={selectedDayFilter}
                onChange={e => setSelectedDayFilter(e.target.value)}
                className="entriesSelect"
                style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              >
                <option value="ALL">Semua Hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
              </select>

              {/* Filter Guru */}
              <select
                value={selectedTeacherFilter}
                onChange={e => setSelectedTeacherFilter(e.target.value)}
                className="entriesSelect"
                style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', maxWidth: '180px' }}
              >
                <option value="ALL">Semua Guru</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.full_name}>{t.full_name}</option>
                ))}
              </select>

              {/* Search Box */}
              <div className="tableSearchBox">
                <input
                  type="text"
                  placeholder="Cari matpel, guru, ruang..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="tableSearchInput"
                />
                <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* View Switcher: Table vs Cards */}
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setViewStyle('table')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: viewStyle === 'table' ? '#ffffff' : 'transparent',
                    color: viewStyle === 'table' ? '#0f172a' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: viewStyle === 'table' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Tabel
                </button>
                <button
                  type="button"
                  onClick={() => setViewStyle('cards')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: viewStyle === 'cards' ? '#ffffff' : 'transparent',
                    color: viewStyle === 'cards' ? '#0f172a' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: viewStyle === 'cards' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Kartu
                </button>
              </div>
            </div>
          </div>

          {/* VIEW: TABLE */}
          {viewStyle === 'table' ? (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>HARI &amp; WAKTU</th>
                    <th>ROMBEL / KELAS</th>
                    <th>MATA PELAJARAN</th>
                    <th>GURU PENGAMPU</th>
                    <th>RUANGAN</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map(sched => (
                      <tr key={sched.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{sched.day}</span>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {sched.timeStart} - {sched.timeEnd}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                            {sched.className}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{sched.subjectName}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {sched.teacherName.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{sched.teacherName}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#64748b' }}>{sched.room || 'Ruang Kelas'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sched)}
                              style={{
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#1d4ed8',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Edit Jadwal"
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(sched.id, `${sched.subjectName} - ${sched.className}`)}
                              style={{
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Hapus Jadwal"
                            >
                              <span>🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                        Tidak ada jadwal yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW: CARDS */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              {filteredSchedules.map(sched => (
                <div
                  key={sched.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    borderLeft: '4px solid #0284c7',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                        {sched.day} • {sched.timeStart} - {sched.timeEnd}
                      </span>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {sched.className}
                      </span>
                    </div>

                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {sched.subjectName}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>👤</span>
                      <span>Guru: <strong>{sched.teacherName}</strong></span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      📍 Ruang: {sched.room || 'Ruang Kelas'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sched)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#1d4ed8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(sched.id, `${sched.subjectName} - ${sched.className}`)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span>🗑️</span> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SUBJECTS DIRECTORY ── */}
      {activeTab === 'subjects' && (
        <div className="tableCard">
          <div className="tableToolbar">
            <div className="tableInfoText">
              Total <strong>{filteredSubjects.length}</strong> mata pelajaran terdaftar
            </div>

            <div className="tableSearchBox">
              <input
                type="text"
                placeholder="Cari mata pelajaran / kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="tableSearchInput"
              />
              <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>KODE</th>
                  <th>MATA PELAJARAN</th>
                  <th>KATEGORI</th>
                  <th>BEBAN BELAJAR</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(s => (
                  <tr key={s.id}>
                    <td><code>{s.code}</code></td>
                    <td><strong>{s.name}</strong></td>
                    <td>
                      <span className="badge badge-purple">{s.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{s.totalHours} JP / Minggu</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* ── MODAL: EDIT JADWAL ── */}
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
