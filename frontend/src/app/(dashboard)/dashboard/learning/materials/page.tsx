'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useMaterials, useLibraryBooks, useSubjects, LibraryBook, InfographicMagazineViewer } from '@/features/material';
import { useAuth } from '@/contexts/AuthContext';
import styles from './materials.module.css';

type MaterialItem = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  author: string;
  format: 'PDF' | 'VIDEO' | 'TEXT';
  size: string;
  downloads: number;
  completedCount: number;
  date: string;
  youtubeUrl?: string;
  pdfFileName?: string;
  externalUrl?: string;
  imagePreviewUrl?: string;
  description?: string;
  startPage?: number;
  endPage?: number;
  sourceType?: string;
  class_id?: string;
  class_name?: string;
  subject_id?: string;
  rawDate?: number;
  createdAt?: string;
};

type StudentCompletion = {
  student_id: string;
  student_name: string;
  nisn: string;
  gender?: string;
  class_name?: string;
  is_completed: boolean;
  completed_at?: string;
  current_page?: number;
  last_read_at?: string;
};

function getEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('embed/')) return url;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
  } else if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0]?.split('?')[0];
  } else if (url.includes('shorts/')) {
    videoId = url.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1` : url;
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase().includes('guru') || user?.role?.toLowerCase().includes('teacher') || user?.role?.toLowerCase().includes('pengajar');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<'ALL' | 'PDF' | 'VIDEO' | 'TEXT'>('ALL');

  // TanStack Query integration
  const { data: libraryBooks = [] } = useLibraryBooks();
  const { data: subjectsList = [] } = useSubjects();
  const { data: materialsData = [], refetch: refetchMaterials } = useMaterials();

  // Teachers and Classes for dropdowns
  const [teachers, setTeachers] = useState<Array<{ id: string; full_name: string; user_id?: string; nip?: string }>>([]);
  const [classesList, setClassesList] = useState<Array<{ id: string; name: string }>>([]);

  // Library Books State (Mode Perpustakaan Guru)
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookStartPage, setBookStartPage] = useState<number>(1);
  const [bookEndPage, setBookEndPage] = useState<number>(10);
  const [creationMode, setCreationMode] = useState<'MANUAL' | 'LIBRARY'>('MANUAL');

  useEffect(() => {
    if (libraryBooks.length > 0 && !selectedBook) {
      setSelectedBook(libraryBooks[0]);
    }
  }, [libraryBooks, selectedBook]);

  const materials = useMemo<MaterialItem[]>(() => {
    let dataList = materialsData;

    // Strict Teacher Isolation: Ensure teacher only sees their own materials
    if (isTeacher && user) {
      const currentTeacher = teachers.find(
        (t) =>
          t.user_id === user.id ||
          (t.full_name && user.full_name && t.full_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
      );
      const currentTeacherId = currentTeacher?.id;
      const currentUserName = user.full_name?.trim().toLowerCase();

      dataList = dataList.filter((m) => {
        if (currentTeacherId && m.teacher_id === currentTeacherId) return true;
        if (m.teacher_id === user.id || (m as any).created_by === user.id) return true;
        if (currentUserName && m.teacher_name && m.teacher_name.trim().toLowerCase() === currentUserName) return true;
        const desc = m.description || '';
        const descParts = desc.includes(' • ') ? desc.split(' • ') : [];
        const authorInDesc = descParts[2]?.trim().toLowerCase();
        if (currentUserName && authorInDesc && authorInDesc === currentUserName) return true;
        return false;
      });
    }

    return dataList.map((m) => {
      const desc = m.description || '';
      const descParts = desc.includes(' • ') ? desc.split(' • ') : [];
      const isVideo = m.material_type === 'video' || (m.external_url && (m.external_url.includes('youtube.com') || m.external_url.includes('youtu.be')));
      const isPdf = m.material_type === 'document' || m.material_type === 'pdf' || (m.external_url && m.external_url.toLowerCase().endsWith('.pdf')) || Boolean(m.storage_key) || m.source_type === 'LIBRARY';
      const formatType: 'PDF' | 'VIDEO' | 'TEXT' = isVideo ? 'VIDEO' : isPdf ? 'PDF' : 'TEXT';

      return {
        id: m.id,
        title: m.title,
        subject: m.subject_name || descParts[0] || 'Umum',
        grade: m.class_name || descParts[1] || 'Semua Rombel',
        author: m.teacher_name || descParts[2] || 'Guru Pengampu',
        format: formatType,
        size: m.start_page && m.end_page
          ? `Hal. ${m.start_page}–${m.end_page}`
          : m.storage_key || (isVideo ? 'Video Online' : '1.8 MB'),
        downloads: 12,
        completedCount: m.completed_count || 0,
        date: m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari ini',
        rawDate: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
        createdAt: m.created_at,
        youtubeUrl: isVideo ? m.external_url : undefined,
        externalUrl: m.external_url,
        pdfFileName: isPdf ? (m.storage_key || (m.external_url ? m.external_url.split('/').pop() : 'Buku_Kurikulum.pdf')) : undefined,
        description: descParts.length > 3 ? descParts.slice(3).join(' • ') : desc,
        startPage: m.start_page,
        endPage: m.end_page,
        sourceType: m.source_type,
        class_id: m.class_id,
        class_name: m.class_name,
        subject_id: (m as any).subject_id,
      };
    });
  }, [materialsData, isTeacher, user?.full_name, user?.id, teachers]);

  // Modal Input State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    subject: '',
    grade: '',
    author: '',
    format: 'PDF' as 'PDF' | 'VIDEO' | 'TEXT',
    description: '',
    youtubeUrl: '',
    pdfFileName: '',
    imagePreviewUrl: '',
  });

  const currentModalClassLevel = useMemo(() => {
    if (!newMaterial.grade) return null;
    const match = newMaterial.grade.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }, [newMaterial.grade]);

  const filteredBooks = useMemo(() => {
    return libraryBooks.filter((b) => {
      if (currentModalClassLevel !== null) {
        if (b.class_level !== undefined && b.class_level !== null) {
          if (b.class_level !== currentModalClassLevel) return false;
        } else if (b.grade_level_name) {
          const matchNum = b.grade_level_name.match(/\d+/);
          if (matchNum && parseInt(matchNum[0], 10) !== currentModalClassLevel) return false;
        }
      }

      if (!bookSearchQuery.trim()) return true;
      const q = bookSearchQuery.toLowerCase();
      return (
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.subject_name && b.subject_name.toLowerCase().includes(q)) ||
        (b.grade_level_name && b.grade_level_name.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q))
      );
    });
  }, [libraryBooks, currentModalClassLevel, bookSearchQuery]);

  // Selected Material Modal Preview
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);

  // Student Completions Roster Modal State
  const [completionModalMaterial, setCompletionModalMaterial] = useState<MaterialItem | null>(null);
  const [completionsList, setCompletionsList] = useState<StudentCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [completionFilterTab, setCompletionFilterTab] = useState<'ALL' | 'COMPLETED' | 'READING' | 'UNREAD'>('ALL');
  const [completionSearch, setCompletionSearch] = useState('');
  const [completionClassFilter, setCompletionClassFilter] = useState<string>('ALL');

  const handleOpenCompletions = async (m: MaterialItem, classIdFilter?: string) => {
    setCompletionModalMaterial(m);
    setLoadingCompletions(true);
    setCompletionFilterTab('ALL');
    setCompletionSearch('');
    const effectiveClassId = classIdFilter !== undefined ? classIdFilter : (m.class_id || 'ALL');
    setCompletionClassFilter(effectiveClassId);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const queryParam = effectiveClassId && effectiveClassId !== 'ALL' ? `?class_id=${effectiveClassId}` : '';
      const res = await fetch(getApiUrl(`/api/v1/learning/materials/${m.id}/completions${queryParam}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const list: StudentCompletion[] = Array.isArray(json?.data) ? json.data : [];
        setCompletionsList(list);
      } else {
        setCompletionsList([]);
      }
    } catch (err) {
      console.error('Failed to load material completions:', err);
      setCompletionsList([]);
    } finally {
      setLoadingCompletions(false);
    }
  };

  const filteredCompletions = useMemo(() => {
    let list = completionsList;
    if (completionFilterTab === 'COMPLETED') {
      list = list.filter(c => c.is_completed);
    } else if (completionFilterTab === 'READING') {
      list = list.filter(c => !c.is_completed && Boolean(c.current_page || c.last_read_at));
    } else if (completionFilterTab === 'UNREAD') {
      list = list.filter(c => !c.is_completed && !c.current_page && !c.last_read_at);
    }
    if (completionSearch.trim()) {
      const q = completionSearch.toLowerCase().trim();
      list = list.filter(c =>
        (c.student_name && c.student_name.toLowerCase().includes(q)) ||
        (c.nisn && c.nisn.toLowerCase().includes(q))
      );
    }
    return list;
  }, [completionsList, completionFilterTab, completionSearch]);

  const completedTotal = useMemo(() => completionsList.filter(c => c.is_completed).length, [completionsList]);
  const readingTotal = useMemo(() => completionsList.filter(c => !c.is_completed && Boolean(c.current_page || c.last_read_at)).length, [completionsList]);
  const unreadTotal = useMemo(() => completionsList.filter(c => !c.is_completed && !c.current_page && !c.last_read_at).length, [completionsList]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [teacherRes, classRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } }).catch(() => null),
          listClasses().catch(() => null),
        ]);

        const teacherList = Array.isArray(teacherRes?.data?.data)
          ? teacherRes.data.data
          : Array.isArray(teacherRes?.data)
            ? teacherRes.data
            : [];
        if (teacherList.length > 0) {
          const typedTeachers = teacherList as Array<{ id: string; full_name: string }>;
          setTeachers(typedTeachers);
          if (isTeacher && user?.full_name) {
            setNewMaterial(prev => ({ ...prev, author: user.full_name || '' }));
          } else {
            setNewMaterial(prev => ({ ...prev, author: prev.author || typedTeachers[0].full_name }));
          }
        }

        const cList = Array.isArray(classRes?.data?.data)
          ? classRes.data.data
          : Array.isArray(classRes?.data)
            ? classRes.data
            : [];
        if (cList.length > 0) {
          const typedClasses = cList as Array<{ id: string; name: string }>;
          setClassesList(typedClasses);
          setNewMaterial(prev => ({ ...prev, grade: prev.grade || typedClasses[0].name }));
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    }
    loadMetadata();
  }, [isTeacher, user?.full_name]);

  useEffect(() => {
    if (subjectsList.length > 0 && !newMaterial.subject) {
      setNewMaterial(prev => ({ ...prev, subject: subjectsList[0].name }));
    }
  }, [subjectsList, newMaterial.subject]);

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewMaterial(prev => ({ ...prev, pdfFileName: file.name }));
      showToast('File PDF dipilih: ' + file.name);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setNewMaterial(prev => ({ ...prev, imagePreviewUrl: imageUrl }));
      showToast('Gambar dipilih');
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    if (newMaterial.format === 'VIDEO' && !newMaterial.youtubeUrl) {
      showToast('Silakan masukkan link URL YouTube');
      return;
    }
    if (newMaterial.format === 'PDF' && !newMaterial.pdfFileName && !selectedFile) {
      showToast('Silakan pilih berkas PDF');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const matchedClass = classesList.find((c: any) => c.name === newMaterial.grade);
      const classId = matchedClass?.id || newMaterial.grade;

      let storageKey = newMaterial.format === 'PDF' ? newMaterial.pdfFileName : null;
      let externalUrl = newMaterial.format === 'VIDEO' ? newMaterial.youtubeUrl : null;

      if (newMaterial.format === 'PDF' && selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const uploadRes = await fetch(getApiUrl('/api/v1/learning/materials/upload'), {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            if (uploadJson.data?.key) {
              storageKey = uploadJson.data.key;
            }
            if (uploadJson.data?.url) {
              externalUrl = uploadJson.data.url;
            }
          }
        } catch (uploadErr) {
          console.warn('File upload fallback:', uploadErr);
        }
      }

      const effectiveAuthor = (isTeacher && user?.full_name) ? user.full_name : (newMaterial.author || user?.full_name || 'Guru');
      const targetTeacher = teachers.find((t: any) => t.full_name === effectiveAuthor) || teachers.find((t: any) => t.user_id === user?.id);
      const payload = {
        material_type: newMaterial.format.toLowerCase(),
        title: newMaterial.title,
        description: `${newMaterial.subject || 'Umum'} • ${newMaterial.grade || 'Semua Rombel'} • ${effectiveAuthor} • ${newMaterial.description || 'Modul Pelajaran'}`,
        storage_key: storageKey,
        external_url: externalUrl,
        order_index: 0,
        visibility: 'published',
        class_id: classId || null,
        teacher_id: targetTeacher?.id || null,
      };

      const res = await fetch(getApiUrl('/api/v1/learning/materials'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await refetchMaterials();
        setShowAddModal(false);
        setSelectedFile(null);
        showToast('Materi berhasil dipublish');
      } else {
        showToast('Gagal mempublish materi');
      }
    } catch {
      showToast('Terjadi kendala koneksi server');
    }
  };

  const handleAssignLibraryBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      showToast('Silakan pilih buku dari katalog perpustakaan');
      return;
    }
    const targetClass = classesList.find(c => c.name === newMaterial.grade) || classesList[0];
    if (!targetClass) {
      showToast('Silakan pilih rombel target');
      return;
    }
    const targetSubject = subjectsList.find(s => s.name === newMaterial.subject);
    const effectiveAuthor = (isTeacher && user?.full_name) ? user.full_name : (newMaterial.author || user?.full_name || 'Guru');
    const targetTeacher = teachers.find(t => t.full_name === effectiveAuthor) || teachers.find((t: any) => t.user_id === user?.id) || teachers[0];
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const startP = Math.max(1, Number(bookStartPage) || 1);
      const endP = Math.min(selectedBook.total_pages || 300, Math.max(startP, Number(bookEndPage) || 10));
      const payload = {
        book_id: selectedBook.id,
        title: `Materi Bacaan: ${selectedBook.title} (Hal. ${startP}–${endP})`,
        instructions: newMaterial.description || `Silakan baca dan pelajari buku "${selectedBook.title}" halaman ${startP} sampai ${endP}.`,
        class_id: targetClass.id,
        subject_id: targetSubject?.id || null,
        teacher_id: targetTeacher?.id || null,
        start_page: startP,
        end_page: endP
      };

      const res = await fetch(getApiUrl('/api/v1/learning/library/assign'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await refetchMaterials();
        setShowAddModal(false);
        showToast('Tugas materi bacaan buku perpustakaan berhasil diterbitkan');
      } else {
        const errJson = await res.json().catch(() => null);
        showToast(errJson?.error?.message || 'Gagal menugaskan materi buku');
      }
    } catch {
      showToast('Terjadi kendala koneksi server');
    }
  };

  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!confirm(`Hapus modul "${title}"?`)) return;
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/materials/${id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        await refetchMaterials();
        showToast('Materi berhasil dihapus');
      } else {
        showToast('Gagal menghapus materi');
      }
    } catch {
      showToast('Gagal menghapus materi');
    }
  };

  const filtered = useMemo(() => {
    return materials.filter(m => {
      if (selectedSubject !== 'ALL' && m.subject !== selectedSubject) return false;
      if (selectedFormatFilter !== 'ALL' && m.format !== selectedFormatFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesAuthor = m.author.toLowerCase().includes(q);
        const matchesGrade = m.grade.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesGrade) return false;
      }
      return true;
    });
  }, [materials, selectedSubject, selectedFormatFilter, searchTerm]);

  type MaterialSortField = 'title' | 'subject' | 'author' | 'format' | 'completedCount' | 'date';
  const [sortField, setSortField] = useState<MaterialSortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSetSort = (field: MaterialSortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedMaterials = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'subject') {
        comparison = (a.subject || '').localeCompare(b.subject || '');
      } else if (sortField === 'author') {
        comparison = (a.author || '').localeCompare(b.author || '');
      } else if (sortField === 'format') {
        comparison = (a.format || '').localeCompare(b.format || '');
      } else if (sortField === 'completedCount') {
        comparison = (a.completedCount || 0) - (b.completedCount || 0);
      } else if (sortField === 'date') {
        comparison = (a.rawDate || 0) - (b.rawDate || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  // Total student completions summary across all materials
  const totalCompletedReaders = useMemo(() => {
    return materials.reduce((acc, m) => acc + (m.completedCount || 0), 0);
  }, [materials]);

  // Client-Side Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortedMaterials.length]);

  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage) || 1;
  const paginated = sortedMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toastContainer">
          <div className="toast toastSuccess">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── 1. Page Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className={styles.headerTextGroup}>
            <h1 className={styles.headerTitle}>Materi Pembelajaran &amp; Modul Digital</h1>
            <p className={styles.headerSubtitle}>
              Pusat kelola modul ajar, buku kurikulum SIBI Kemendikbudristek, dan video edukasi.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link
            href="/dashboard/learning/materials/create"
            className={styles.btnLibrary}
            title="Buka Katalog Buku Resmi Kemendikbudristek SIBI"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Katalog Perpustakaan ({libraryBooks.length})</span>
          </Link>

          <Link
            href="/dashboard/learning/materials/create"
            className={styles.btnPrimary}
            title="Unggah atau buat modul ajar baru"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Unggah Modul Baru</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Executive KPI Cards (4 Balanced Columns) ── */}
      <div className={styles.kpiGrid}>
        {/* KPI 1: Total Modul */}
        <div className={styles.kpiCard} style={{ '--kpi-accent': '#0284c7' } as React.CSSProperties}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Total Modul Ajar</span>
            <div className={styles.kpiIconBox} style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{materials.length}</span>
            <span className={styles.kpiUnit}>modul</span>
          </div>
          <span className={styles.kpiSub}>Materi aktif terbit</span>
        </div>

        {/* KPI 2: Buku Kurikulum SIBI */}
        <div className={styles.kpiCard} style={{ '--kpi-accent': '#7c3aed' } as React.CSSProperties}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Buku Teks Kurikulum</span>
            <div className={styles.kpiIconBox} style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{libraryBooks.length}</span>
            <span className={styles.kpiUnit}>buku</span>
          </div>
          <span className={styles.kpiSub}>Katalog SIBI resmi Kemdikbud</span>
        </div>

        {/* KPI 3: Aktivitas Keterbacaan */}
        <div className={styles.kpiCard} style={{ '--kpi-accent': '#059669' } as React.CSSProperties}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Total Keterbacaan</span>
            <div className={styles.kpiIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{totalCompletedReaders}</span>
            <span className={styles.kpiUnit}>siswa tuntas</span>
          </div>
          <span className={styles.kpiSub}>Aktivitas literasi terbaca</span>
        </div>

        {/* KPI 4: Mobile App Sync */}
        <div className={styles.kpiCard} style={{ '--kpi-accent': '#10b981' } as React.CSSProperties}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Sinkronisasi Mobile</span>
            <div className={styles.kpiIconBox} style={{ background: '#ecfdf5', color: '#10b981' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>100%</span>
            <span className={styles.kpiUnit} style={{ color: '#059669' }}>Synced</span>
          </div>
          <span className={styles.kpiSub}>
            <span className={styles.liveDot} />
            <span>SchoolOS Android Aktif</span>
          </span>
        </div>
      </div>

      {/* ── 3. Main Data Card & Table ── */}
      <div className={styles.dataCard}>
        {/* Toolbar: Search, Subject, Format Switcher */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchBox}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari judul modul atau nama guru..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}
                  aria-label="Hapus pencarian"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              )}
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {subjectsList.map((s: any) => (
                <option key={s.id || s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Format filter pills */}
          <div className={styles.formatTabGroup}>
            <button
              type="button"
              onClick={() => setSelectedFormatFilter('ALL')}
              className={`${styles.formatTabBtn} ${selectedFormatFilter === 'ALL' ? styles.formatTabBtnActive : ''}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormatFilter('PDF')}
              className={`${styles.formatTabBtn} ${selectedFormatFilter === 'PDF' ? styles.formatTabBtnActive : ''}`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>PDF / Buku</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormatFilter('VIDEO')}
              className={`${styles.formatTabBtn} ${selectedFormatFilter === 'VIDEO' ? styles.formatTabBtnActive : ''}`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span>Video</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormatFilter('TEXT')}
              className={`${styles.formatTabBtn} ${selectedFormatFilter === 'TEXT' ? styles.formatTabBtnActive : ''}`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="2" x2="22" y2="6" />
                <path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z" />
              </svg>
              <span>Teks</span>
            </button>
          </div>
        </div>

        {/* Compact Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => handleSetSort('title')}>
                  <div className={styles.thSortContent}>
                    <span>Judul Modul</span>
                    <span>{sortField === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => handleSetSort('subject')}>
                  <div className={styles.thSortContent}>
                    <span>Mapel &amp; Rombel</span>
                    <span>{sortField === 'subject' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => handleSetSort('author')}>
                  <div className={styles.thSortContent}>
                    <span>Guru Pengampu</span>
                    <span>{sortField === 'author' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => handleSetSort('format')}>
                  <div className={styles.thSortContent}>
                    <span>Format &amp; Media</span>
                    <span>{sortField === 'format' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => handleSetSort('completedCount')}>
                  <div className={styles.thSortContent}>
                    <span>Keterbacaan Siswa</span>
                    <span>{sortField === 'completedCount' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => handleSetSort('date')}>
                  <div className={styles.thSortContent}>
                    <span>Tanggal Tayang</span>
                    <span>{sortField === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((m) => (
                  <tr key={m.id} className={styles.tr}>
                    {/* Judul Modul */}
                    <td className={styles.td}>
                      <div className={styles.materialTitleCell}>
                        <div
                          className={styles.materialIconMini}
                          style={{
                            background: m.format === 'PDF' ? '#eff6ff' : m.format === 'VIDEO' ? '#fff7ed' : '#f0fdf4',
                            color: m.format === 'PDF' ? '#1d4ed8' : m.format === 'VIDEO' ? '#ea580c' : '#15803d',
                          }}
                        >
                          {m.format === 'PDF' ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          ) : m.format === 'VIDEO' ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <line x1="18" y1="2" x2="22" y2="6" />
                              <path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z" />
                            </svg>
                          )}
                        </div>
                        <span className={styles.materialTitleText} title={m.title}>
                          {m.title}
                        </span>
                      </div>
                    </td>

                    {/* Mapel & Rombel */}
                    <td className={styles.td}>
                      <span className={styles.badgeSubject}>{m.subject}</span>
                      <div className={styles.classSubtitle}>{m.grade}</div>
                    </td>

                    {/* Guru Pengampu */}
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {m.author}
                    </td>

                    {/* Format & Media */}
                    <td className={styles.td}>
                      <span className={`${styles.badgeFormat} ${m.format === 'PDF' ? styles.badgeFormatPdf : m.format === 'VIDEO' ? styles.badgeFormatVideo : styles.badgeFormatText}`}>
                        {m.format === 'VIDEO' ? (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            <span>Video</span>
                          </>
                        ) : m.format === 'PDF' ? (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span>Buku / PDF</span>
                          </>
                        ) : (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <line x1="18" y1="2" x2="22" y2="6" />
                              <path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z" />
                            </svg>
                            <span>Teks</span>
                          </>
                        )}
                      </span>
                      {m.format === 'PDF' && (m.startPage ? (
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                          Hal. {m.startPage} — {m.endPage}
                        </div>
                      ) : m.pdfFileName ? (
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                          {m.pdfFileName}
                        </div>
                      ) : null)}
                      {m.format === 'VIDEO' && m.youtubeUrl && (
                        <div style={{ fontSize: '0.68rem', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
                          YouTube Link
                        </div>
                      )}
                    </td>

                    {/* Keterbacaan Siswa */}
                    <td className={styles.td}>
                      <button
                        type="button"
                        onClick={() => handleOpenCompletions(m)}
                        title="Klik untuk melihat rincian nama siswa yang telah membaca"
                        className={`${styles.rosterBtn} ${m.completedCount > 0 ? styles.rosterBtnCompleted : ''}`}
                      >
                        {m.completedCount > 0 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        )}
                        <span>{m.completedCount} Siswa</span>
                        <span style={{ fontSize: '0.64rem', color: '#0284c7', background: 'rgba(2,132,199,0.08)', padding: '1px 4px', borderRadius: '3px' }}>
                          Roster
                        </span>
                      </button>
                    </td>

                    {/* Tanggal Tayang */}
                    <td className={styles.td} style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', fontVariantNumeric: 'tabular-nums' }}>
                      {m.date}
                    </td>

                    {/* Aksi */}
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Lihat Keterbacaan Nama-Nama Siswa"
                          onClick={() => handleOpenCompletions(m)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          <span>Roster</span>
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Pratinjau Modul Ajar"
                          onClick={() => setPreviewMaterial(m)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Lihat</span>
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          title="Hapus Modul"
                          onClick={() => handleDeleteMaterial(m.id, m.title)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span className={styles.emptyStateTitle}>Belum Ada Modul Pembelajaran</span>
                    <span>Klik tombol Unggah Modul Baru atau pilih buku dari katalog perpustakaan untuk menerbitkan materi.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedMaterials.length > 0 && (
          <div className={styles.paginationFooter}>
            <div>
              Menampilkan <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>–<strong>{Math.min(currentPage * itemsPerPage, sortedMaterials.length)}</strong> dari <strong>{sortedMaterials.length}</strong> modul
            </div>
            <div className={styles.paginationNav}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &larr; Prev
              </button>
              <span style={{ padding: '0 6px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                Hal {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Input Modul Baru ── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <h3 className={styles.modalTitle}>
                  {creationMode === 'LIBRARY' ? 'Pilih Buku dari Katalog Perpustakaan' : 'Unggah Modul Ajar Mandiri'}
                </h3>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setShowAddModal(false)} aria-label="Tutup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setCreationMode('LIBRARY')}
                style={{
                  padding: '0.65rem',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: 'none',
                  background: creationMode === 'LIBRARY' ? 'var(--bg-card)' : 'transparent',
                  color: creationMode === 'LIBRARY' ? '#0284c7' : 'var(--text-secondary)',
                  borderBottom: creationMode === 'LIBRARY' ? '2px solid #0284c7' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>Katalog Buku ({libraryBooks.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('MANUAL')}
                style={{
                  padding: '0.65rem',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: 'none',
                  background: creationMode === 'MANUAL' ? 'var(--bg-card)' : 'transparent',
                  color: creationMode === 'MANUAL' ? '#0284c7' : 'var(--text-secondary)',
                  borderBottom: creationMode === 'MANUAL' ? '2px solid #0284c7' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Input Modul Manual</span>
              </button>
            </div>

            {creationMode === 'LIBRARY' ? (
              <form onSubmit={handleAssignLibraryBook} style={{ overflowY: 'auto' }}>
                <div className={styles.modalBody}>
                  <div style={{ background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(2,132,199,0.2)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.74rem', color: 'var(--text-primary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div>
                      <strong>Katalog SIBI Terfilter untuk {newMaterial.grade || 'Kelas Terpilih'} {currentModalClassLevel ? `(Tingkat ${currentModalClassLevel})` : ''}:</strong> Pilih buku teks kurikulum resmi yang sesuai dengan rombel target yang diampu untuk mencegah salah input materi buku.
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className={styles.formLabel}>Pilih Buku Teks Kurikulum *</label>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        {filteredBooks.length} dari {libraryBooks.length} buku
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Cari buku atau mapel (contoh: Matematika, Fisika)..."
                      value={bookSearchQuery}
                      onChange={e => setBookSearchQuery(e.target.value)}
                      className={styles.formInput}
                      style={{ marginBottom: '0.35rem' }}
                    />

                    <select
                      value={selectedBook?.id || ''}
                      onChange={e => {
                        const b = libraryBooks.find(item => item.id === e.target.value);
                        if (b) {
                          setSelectedBook(b);
                          if (b.subject_name && subjectsList.some(s => s.name.toLowerCase() === b.subject_name?.toLowerCase())) {
                            setNewMaterial(prev => ({ ...prev, subject: b.subject_name || prev.subject }));
                          }
                        }
                      }}
                      className={styles.formInput}
                      style={{ fontWeight: 600 }}
                    >
                      {filteredBooks.length > 0 ? (
                        filteredBooks.map((b: LibraryBook) => (
                          <option key={b.id} value={b.id}>
                            {b.title} {b.grade_level_name ? `[${b.grade_level_name}]` : ''} — {b.publisher || 'Kemendikbud'} ({b.total_pages} Hal.)
                          </option>
                        ))
                      ) : (
                        <option value="">Tidak ada buku yang cocok dengan pencarian "{bookSearchQuery}"</option>
                      )}
                    </select>
                  </div>

                  {selectedBook && (
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedBook.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                          {selectedBook.author || 'Tim Penulis'} • {selectedBook.publisher || 'Kemendikbud'}
                          {selectedBook.grade_level_name ? ` • ${selectedBook.grade_level_name}` : ''}
                        </div>
                      </div>
                      {selectedBook.file_url && (
                        <a
                          href={selectedBook.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnSecondary}
                          style={{ fontSize: '0.68rem', padding: '0.25rem 0.55rem', whiteSpace: 'nowrap' }}
                        >
                          <span>PDF</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Dari Halaman *</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedBook?.total_pages || 999}
                        required
                        value={bookStartPage}
                        onChange={e => setBookStartPage(Number(e.target.value))}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Sampai Halaman *</label>
                      <input
                        type="number"
                        min={bookStartPage}
                        max={selectedBook?.total_pages || 999}
                        required
                        value={bookEndPage}
                        onChange={e => setBookEndPage(Number(e.target.value))}
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Rombel Target *</label>
                      <select
                        value={newMaterial.grade}
                        onChange={e => setNewMaterial({ ...newMaterial, grade: e.target.value })}
                        className={styles.formInput}
                      >
                        {classesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Mata Pelajaran *</label>
                      <select
                        value={newMaterial.subject}
                        onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                        className={styles.formInput}
                      >
                        {subjectsList.map((s: any) => (
                          <option key={s.id || s.code} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Guru Pengampu *</label>
                    <select
                      value={newMaterial.author}
                      onChange={e => setNewMaterial({ ...newMaterial, author: e.target.value })}
                      disabled={Boolean(isTeacher && user?.full_name)}
                      className={styles.formInput}
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.full_name}>{t.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Petunjuk Belajar untuk Siswa</label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Baca halaman 15 sampai 28 dan catat rangkuman materi pokok..."
                      value={newMaterial.description}
                      onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnSecondary} onClick={() => setShowAddModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Terbitkan Tugas Bacaan</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateMaterial} style={{ overflowY: 'auto' }}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Judul Modul Ajar *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bab 2 - Struktur Teks Eksplanasi"
                      value={newMaterial.title}
                      onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Mata Pelajaran *</label>
                      <select
                        value={newMaterial.subject}
                        onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                        className={styles.formInput}
                      >
                        {subjectsList.map((s: any) => (
                          <option key={s.id || s.code} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Rombel Target *</label>
                      <select
                        value={newMaterial.grade}
                        onChange={e => setNewMaterial({ ...newMaterial, grade: e.target.value })}
                        className={styles.formInput}
                      >
                        {classesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Format Modul *</label>
                    <select
                      value={newMaterial.format}
                      onChange={e => setNewMaterial({ ...newMaterial, format: e.target.value as any })}
                      className={styles.formInput}
                    >
                      <option value="PDF">Dokumen Modul PDF</option>
                      <option value="VIDEO">Video Pembelajaran (YouTube URL)</option>
                      <option value="TEXT">Teks &amp; Artikel Pembelajaran</option>
                    </select>
                  </div>

                  {newMaterial.format === 'VIDEO' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>URL Video YouTube *</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={newMaterial.youtubeUrl}
                        onChange={e => setNewMaterial({ ...newMaterial, youtubeUrl: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>
                  )}

                  {newMaterial.format === 'PDF' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Berkas Dokumen PDF *</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfFileSelect}
                        className={styles.formInput}
                      />
                      {newMaterial.pdfFileName && (
                        <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                          Berkas: {newMaterial.pdfFileName}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Deskripsi &amp; Ringkasan Materi</label>
                    <textarea
                      rows={2}
                      placeholder="Tuliskan petunjuk atau rangkuman materi..."
                      value={newMaterial.description}
                      onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnSecondary} onClick={() => setShowAddModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Publish Modul</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Pratinjau Modul ── */}
      {previewMaterial && (
        <div className={styles.modalOverlay} onClick={() => setPreviewMaterial(null)}>
          <div className={styles.modalCard} style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={`${styles.badgeFormat} ${previewMaterial.format === 'PDF' ? styles.badgeFormatPdf : previewMaterial.format === 'VIDEO' ? styles.badgeFormatVideo : styles.badgeFormatText}`} style={{ marginBottom: '4px' }}>
                  {previewMaterial.format === 'PDF' ? 'Buku / Modul PDF' : previewMaterial.format === 'VIDEO' ? 'Video Pembelajaran' : 'Teks Artikel'}
                </span>
                <h3 className={styles.modalTitle}>{previewMaterial.title}</h3>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setPreviewMaterial(null)} aria-label="Tutup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                <span className={styles.badgeSubject}>{previewMaterial.subject}</span>
                <span style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  {previewMaterial.grade}
                </span>
                <span style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  {previewMaterial.author}
                </span>
                {previewMaterial.startPage && previewMaterial.endPage && (
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Halaman {previewMaterial.startPage} — {previewMaterial.endPage}
                  </span>
                )}
              </div>

              {/* Infographic Blocks or Description */}
              {(() => {
                let parsedBlocks: any[] | null = null;
                if (previewMaterial.description && previewMaterial.description.trim().startsWith('[')) {
                  try {
                    parsedBlocks = JSON.parse(previewMaterial.description);
                  } catch {}
                }

                if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
                  return (
                    <div style={{ marginTop: '0.65rem', maxHeight: '72vh', overflowY: 'auto', borderRadius: '12px' }}>
                      <InfographicMagazineViewer
                        title={previewMaterial.title}
                        subjectName={previewMaterial.subject}
                        className={previewMaterial.grade}
                        author={previewMaterial.author}
                        date={previewMaterial.date}
                        blocks={parsedBlocks}
                      />
                    </div>
                  );
                }

                return previewMaterial.description ? (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '7px', padding: '0.65rem 0.85rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Instruksi Belajar:</strong>
                    <p style={{ margin: '3px 0 0 0', lineHeight: 1.45 }}>{previewMaterial.description}</p>
                  </div>
                ) : null;
              })()}

              {previewMaterial.format === 'VIDEO' && previewMaterial.youtubeUrl && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={getEmbedUrl(previewMaterial.youtubeUrl)}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {previewMaterial.format === 'PDF' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af' }}>Berkas Buku / Modul PDF</div>
                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {previewMaterial.startPage ? `Fokus Halaman ${previewMaterial.startPage} sampai ${previewMaterial.endPage}` : (previewMaterial.pdfFileName || 'Buku Teks Kurikulum SIBI')}
                    </div>
                  </div>
                  {previewMaterial.externalUrl ? (
                    <a
                      href={previewMaterial.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnPrimary}
                      style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                    >
                      <span>Buka PDF</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      Dalam Revisi
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setPreviewMaterial(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Laporan Keterbacaan Siswa (Roster) ── */}
      {completionModalMaterial && (
        <div className={styles.modalOverlay} onClick={() => setCompletionModalMaterial(null)}>
          <div className={styles.modalCard} style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <h3 className={styles.modalTitle}>
                    Keterbacaan Siswa — {completionModalMaterial.title}
                  </h3>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>{completionModalMaterial.grade}</span>
                  <span>&bull;</span>
                  <span>{completionModalMaterial.subject}</span>
                  <span>&bull;</span>
                  <span>{completionModalMaterial.author}</span>
                </div>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setCompletionModalMaterial(null)} aria-label="Tutup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            {/* Quick Stats Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Siswa Terdata</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {completionsList.length} Siswa
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 600 }}>Selesai Membaca</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803d', fontVariantNumeric: 'tabular-nums' }}>
                  {completedTotal}
                  <span style={{ fontSize: '0.68rem', marginLeft: '4px', fontWeight: 600 }}>
                    ({completionsList.length > 0 ? Math.round((completedTotal / completionsList.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>Sedang Membaca</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#b45309', fontVariantNumeric: 'tabular-nums' }}>
                  {readingTotal} Siswa
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Belum Membaca</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {unreadTotal} Siswa
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div className={styles.formatTabGroup}>
                {(['ALL', 'COMPLETED', 'READING', 'UNREAD'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCompletionFilterTab(tab)}
                    className={`${styles.formatTabBtn} ${completionFilterTab === tab ? styles.formatTabBtnActive : ''}`}
                  >
                    {tab === 'ALL' && `Semua (${completionsList.length})`}
                    {tab === 'COMPLETED' && `Selesai (${completedTotal})`}
                    {tab === 'READING' && `Sedang Baca (${readingTotal})`}
                    {tab === 'UNREAD' && `Belum (${unreadTotal})`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <select
                  value={completionClassFilter}
                  onChange={e => {
                    const newCid = e.target.value;
                    setCompletionClassFilter(newCid);
                    if (completionModalMaterial) {
                      handleOpenCompletions(completionModalMaterial, newCid);
                    }
                  }}
                  className={styles.selectInput}
                >
                  <option value="ALL">Rombel Terkait ({completionModalMaterial.grade})</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <div className={styles.searchBox} style={{ maxWidth: '200px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari siswa / NISN..."
                    value={completionSearch}
                    onChange={e => setCompletionSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
            </div>

            {/* Student Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingCompletions ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Memuat data keterbacaan siswa...</div>
                </div>
              ) : filteredCompletions.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {completionsList.length === 0
                      ? 'Belum ada data siswa terdaftar untuk rombel materi ini atau belum ada aktivitas membaca.'
                      : 'Tidak ada data siswa yang cocok dengan filter pencarian.'}
                  </div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th} style={{ width: '36px' }}>#</th>
                      <th className={styles.th}>Nama Siswa</th>
                      <th className={styles.th}>NISN</th>
                      <th className={styles.th}>Status Keterbacaan</th>
                      <th className={styles.th}>Progres / Halaman</th>
                      <th className={styles.th} style={{ textAlign: 'right' }}>Waktu Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompletions.map((st, idx) => (
                      <tr key={st.student_id || idx} className={styles.tr}>
                        <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                        <td className={styles.td}>
                          <div style={{ fontWeight: 700 }}>{st.student_name}</div>
                          {st.class_name && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{st.class_name}</div>
                          )}
                        </td>
                        <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {st.nisn || '-'}
                        </td>
                        <td className={styles.td}>
                          {st.is_completed ? (
                            <span className={styles.badgeFormatPdf} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Selesai Membaca</span>
                            </span>
                          ) : st.current_page || st.last_read_at ? (
                            <span className={styles.badgeFormatVideo} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                              </svg>
                              <span>Sedang Membaca</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>Belum Membaca</span>
                            </span>
                          )}
                        </td>
                        <td className={styles.td} style={{ fontWeight: 600 }}>
                          {st.is_completed ? (
                            <span style={{ color: '#15803d' }}>100% Tuntas</span>
                          ) : st.current_page ? (
                            <span>Halaman {st.current_page}</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>0%</span>
                          )}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          {st.completed_at ? (
                            <span style={{ color: '#15803d', fontWeight: 600 }}>
                              {new Date(st.completed_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : st.last_read_at ? (
                            <span>
                              {new Date(st.last_read_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setCompletionModalMaterial(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
