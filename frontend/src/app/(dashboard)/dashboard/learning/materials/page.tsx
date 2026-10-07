'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useMaterials, useLibraryBooks, useSubjects, LibraryBook } from '@/features/material';
import { useAuth } from '@/contexts/AuthContext';

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

  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return libraryBooks;
    const q = bookSearchQuery.toLowerCase();
    return libraryBooks.filter((b) => 
      (b.title && b.title.toLowerCase().includes(q)) || 
      (b.subject_name && b.subject_name.toLowerCase().includes(q)) ||
      (b.grade_level_name && b.grade_level_name.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q))
    );
  }, [libraryBooks, bookSearchQuery]);

  const materials = useMemo<MaterialItem[]>(() => {
    const dataList = isTeacher && user?.full_name
      ? materialsData.filter(m => {
          const tName = (m.teacher_name || '').toLowerCase();
          const uName = (user.full_name || '').toLowerCase();
          return tName === uName || (m as any).created_by === user.id || (m as any).teacher_id === user.id;
        })
      : materialsData;

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
  }, [materialsData, isTeacher, user?.full_name, user?.id]);

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
  }, []);

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
      showToast('✓ File PDF dipilih: ' + file.name);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setNewMaterial(prev => ({ ...prev, imagePreviewUrl: imageUrl }));
      showToast('✓ Gambar dipilih');
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    if (newMaterial.format === 'VIDEO' && !newMaterial.youtubeUrl) {
      showToast('⚠️ Masukkan link YouTube');
      return;
    }
    if (newMaterial.format === 'PDF' && !newMaterial.pdfFileName && !selectedFile) {
      showToast('⚠️ Pilih file PDF');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const matchedClass = classesList.find((c: any) => c.name === newMaterial.grade);
      const classId = matchedClass?.id || newMaterial.grade;

      let storageKey = newMaterial.format === 'PDF' ? newMaterial.pdfFileName : null;
      let externalUrl = newMaterial.format === 'VIDEO' ? newMaterial.youtubeUrl : null;

      // If a real PDF file was selected, upload it to the server upload endpoint
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
        showToast('✓ Materi berhasil dipublish');
      } else {
        showToast('⚠️ Gagal mempublish materi');
      }
    } catch {
      showToast('⚠️ Terjadi kendala koneksi');
    }
  };

  const handleAssignLibraryBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      showToast('⚠️ Silakan pilih buku dari katalog perpustakaan');
      return;
    }
    const targetClass = classesList.find(c => c.name === newMaterial.grade) || classesList[0];
    if (!targetClass) {
      showToast('⚠️ Silakan pilih rombel target');
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
        showToast('✓ Tugas materi bacaan buku perpustakaan berhasil diterbitkan');
      } else {
        showToast('⚠️ Gagal menugaskan materi buku');
      }
    } catch {
      showToast('⚠️ Terjadi kendala koneksi');
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
        showToast('✓ Materi berhasil dihapus');
      } else {
        showToast('⚠️ Gagal menghapus materi');
      }
    } catch {
      showToast('⚠️ Gagal menghapus materi');
    }
  };

  const handleDownloadPdf = (fileName: string, title: string, subject: string, teacher: string, description: string) => {
    const safeTitle = (title || 'Modul Pembelajaran').replace(/[()\\]/g, '');
    const safeSubject = (subject || 'Umum').replace(/[()\\]/g, '');
    const safeTeacher = (teacher || 'Guru').replace(/[()\\]/g, '');
    const safeDesc = (description || 'Modul Ajar').replace(/[()\\]/g, '').slice(0, 150);

    const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 250 >>
stream
BT
/F1 18 Tf
50 720 Td
(${safeTitle}) Tj
/F1 12 Tf
0 -32 Td
(Mata Pelajaran: ${safeSubject}) Tj
0 -22 Td
(Guru Pengampu: ${safeTeacher}) Tj
0 -30 Td
(Ringkasan Modul:) Tj
0 -22 Td
(${safeDesc}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000535 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
610
%%EOF`;

    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ Berkas PDF berhasil diunduh ke perangkat');
  };

  const filtered = materials.filter(m => 
    (selectedSubject === 'ALL' || m.subject === selectedSubject) &&
    (m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  type MaterialSortField = 'title' | 'subject' | 'author' | 'format' | 'completedCount' | 'date';
  const [sortField, setSortField] = useState<MaterialSortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
        comparison = (a.date || '').localeCompare(b.date || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [sortedMaterials.length]);

  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage) || 1;
  const paginated = sortedMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  // ------------------------------

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toastContainer">
          <div className="toast toastSuccess">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '1.25rem 1.75rem', borderRadius: '18px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-dim)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>📚</div>
          <div>
            
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Materi Pembelajaran &amp; Modul Digital</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/learning" className="btn btn-secondary btn-sm">
            ← Kembali ke Workspace
          </Link>
          <Link
            href="/dashboard/learning/materials/create"
            className="btn btn-secondary btn-sm"
            style={{ background: 'var(--accent-dim)', color: '#2563eb', fontWeight: 800, border: '1px solid rgba(37,99,235,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            📚 Katalog Buku Perpustakaan ({libraryBooks.length})
          </Link>
          <Link
            href="/dashboard/learning/materials/create"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            + Unggah Modul Ajar Baru
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Modul Dipublish</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{materials.length} Modul</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status Android Sync</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>100% Synced</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Tipe Format</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>PDF / Video / Teks</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="🔍 Cari judul modul atau nama guru..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input" 
            style={{ maxWidth: '380px' }}
          />
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input" style={{ width: '220px' }}>
            <option value="ALL">Semua Mata Pelajaran</option>
            {subjectsList.map((s: any) => (
              <option key={s.id || s.code} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border-light)' }}>
                <th className="thSortable" onClick={() => handleSetSort('title')}>
                  <div className="thSortContent">
                    <span>Judul Modul</span>
                    <span className="sortArrows">{sortField === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('subject')}>
                  <div className="thSortContent">
                    <span>Mapel &amp; Rombel</span>
                    <span className="sortArrows">{sortField === 'subject' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('author')}>
                  <div className="thSortContent">
                    <span>Guru Pengampu</span>
                    <span className="sortArrows">{sortField === 'author' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('format')}>
                  <div className="thSortContent">
                    <span>Format &amp; Media</span>
                    <span className="sortArrows">{sortField === 'format' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('completedCount')}>
                  <div className="thSortContent">
                    <span>Penyelesaian Siswa</span>
                    <span className="sortArrows">{sortField === 'completedCount' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th className="thSortable" onClick={() => handleSetSort('date')}>
                  <div className="thSortContent">
                    <span>Tanggal Tayang</span>
                    <span className="sortArrows">{sortField === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-muted)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.title}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-info" style={{ fontWeight: 800 }}>{m.subject}</span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>{m.grade}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.author}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${m.format === 'PDF' ? 'badge-info' : m.format === 'VIDEO' ? 'badge-warning' : 'badge-active'}`}>
                        {m.format === 'VIDEO' ? '🎥 Video' : m.format === 'PDF' ? '📄 Buku / PDF' : '📝 Teks'}
                      </span>
                      {m.format === 'PDF' && (m.startPage ? (
                        <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>Hal. {m.startPage} — {m.endPage}</div>
                      ) : m.pdfFileName ? (
                        <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>{m.pdfFileName}</div>
                      ) : null)}
                      {m.format === 'VIDEO' && m.youtubeUrl && (
                        <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>Link Video</div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenCompletions(m)}
                        title="Klik untuk melihat rincian nama-nama siswa yang telah membaca"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: m.completedCount > 0 ? '#dcfce7' : 'var(--bg-elevated)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '8px',
                          border: `1px solid ${m.completedCount > 0 ? '#86efac' : 'var(--border-light)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem' }}>{m.completedCount > 0 ? '✅' : '⏳'}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: m.completedCount > 0 ? '#15803d' : 'var(--text-muted)' }}>
                          {m.completedCount} Siswa
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 800, marginLeft: '2px', background: '#eff6ff', padding: '1px 5px', borderRadius: '4px' }}>
                          👥 Roster
                        </span>
                      </button>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.date}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Lihat Keterbacaan Nama-Nama Siswa"
                          onClick={() => handleOpenCompletions(m)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          👥 Siswa
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMaterial(m)}>
                          👁️ Pratinjau
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.25rem 0.5rem' }}
                          title="Hapus Modul"
                          onClick={() => handleDeleteMaterial(m.id, m.title)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    📚 Belum ada modul pembelajaran yang diunggah. Klik tombol <strong>+ Unggah Modul Ajar Baru</strong> untuk mempublish materi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Input Modul Baru ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '540px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creationMode === 'LIBRARY' ? '📚 Pilih Buku dari Katalog Perpustakaan' : '✍️ Unggah Modul Ajar Mandiri'}
              </h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setCreationMode('LIBRARY')}
                style={{
                  padding: '0.75rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  background: creationMode === 'LIBRARY' ? 'var(--bg-card)' : 'transparent',
                  color: creationMode === 'LIBRARY' ? '#2563eb' : 'var(--text-muted)',
                  borderBottom: creationMode === 'LIBRARY' ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>📚</span> Katalog Buku ({libraryBooks.length})
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('MANUAL')}
                style={{
                  padding: '0.75rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  background: creationMode === 'MANUAL' ? 'var(--bg-card)' : 'transparent',
                  color: creationMode === 'MANUAL' ? '#2563eb' : 'var(--text-muted)',
                  borderBottom: creationMode === 'MANUAL' ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>✍️</span> Input Modul Manual
              </button>
            </div>

            {creationMode === 'LIBRARY' ? (
              <form onSubmit={handleAssignLibraryBook} style={{ overflowY: 'auto' }}>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '12px', padding: '0.85rem', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    💡 <strong>Perpustakaan Guru:</strong> Pilih buku teks resmi Kemendikbudristek yang tersedia dan tentukan halaman yang wajib dipelajari siswa.
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0 }}>Pilih Buku Teks Kurikulum *</label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {filteredBooks.length} dari {libraryBooks.length} buku tersedia
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="🔍 Cari buku atau mapel (contoh: Matematika, Fisika, Kelas 10, dsb)..."
                      value={bookSearchQuery}
                      onChange={e => setBookSearchQuery(e.target.value)}
                      className="input"
                      style={{ marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
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
                      className="input"
                      style={{ fontWeight: 800 }}
                    >
                      {filteredBooks.length > 0 ? (
                        filteredBooks.map((b: LibraryBook) => (
                          <option key={b.id} value={b.id}>
                            {b.title} {b.grade_level_name ? `[${b.grade_level_name}]` : ''} — {b.publisher || 'Kemendikbudristek'} ({b.total_pages} Hal.)
                          </option>
                        ))
                      ) : (
                        <option value="">Tidak ada buku yang cocok dengan pencarian "{bookSearchQuery}"</option>
                      )}
                    </select>
                  </div>

                  {selectedBook && (
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '2rem' }}>📕</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{selectedBook.title}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {selectedBook.author || 'Tim Penulis'} • {selectedBook.publisher || 'Kemendikbudristek'}
                          {selectedBook.grade_level_name ? ` • ${selectedBook.grade_level_name}` : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>Total {selectedBook.total_pages} Halaman</div>
                      </div>
                      {selectedBook.file_url && (
                        <a
                          href={selectedBook.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', whiteSpace: 'nowrap' }}
                        >
                          👁️ Pratinjau PDF
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Dari Halaman *</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedBook?.total_pages || 999}
                        required
                        value={bookStartPage}
                        onChange={e => setBookStartPage(Number(e.target.value))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Sampai Halaman *</label>
                      <input
                        type="number"
                        min={bookStartPage}
                        max={selectedBook?.total_pages || 999}
                        required
                        value={bookEndPage}
                        onChange={e => setBookEndPage(Number(e.target.value))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Rombel Target *</label>
                      <select
                        value={newMaterial.grade}
                        onChange={e => setNewMaterial({ ...newMaterial, grade: e.target.value })}
                        className="input"
                      >
                        {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Mata Pelajaran</label>
                      <select
                        value={newMaterial.subject}
                        onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                        className="input"
                      >
                        {subjectsList.map((s: any) => (
                          <option key={s.id || s.code} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Guru Pengampu *</label>
                    {isTeacher && user?.full_name ? (
                      <input
                        type="text"
                        disabled
                        value={user.full_name}
                        className="input"
                        style={{ background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 700 }}
                      />
                    ) : (
                      <select
                        value={newMaterial.author}
                        onChange={e => setNewMaterial({ ...newMaterial, author: e.target.value })}
                        className="input"
                        style={{ fontWeight: 600 }}
                      >
                        {teachers.length > 0 ? (
                          teachers.map((t: any) => (
                            <option key={t.id} value={t.full_name}>
                              {t.full_name} {t.nip ? `(NIP: ${t.nip})` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="">Belum ada data guru pengampu</option>
                        )}
                      </select>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Instruksi / Catatan Siswa (Opsional)</label>
                    <textarea
                      placeholder="contoh: Silakan baca dan pelajari bab ini sebelum pertemuan tatap muka berikutnya..."
                      value={newMaterial.description}
                      onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      className="input"
                      rows={3}
                    />
                  </div>
                </div>

                <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: 'var(--bg-elevated)' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm">📖 Terbitkan Tugas Bacaan Buku</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateMaterial} style={{ overflowY: 'auto' }}>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Rombel Target *</label>
                    <select
                      value={newMaterial.grade}
                      onChange={e => setNewMaterial({ ...newMaterial, grade: e.target.value })}
                      className="input"
                    >
                      {classesList.length > 0 ? (
                        classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                      ) : (
                        <option value="">Belum ada rombel</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Mata Pelajaran *</label>
                    <select
                      value={newMaterial.subject}
                      onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                      className="input"
                    >
                      {subjectsList.length > 0 ? (
                        subjectsList.map((s: any) => (
                          <option key={s.id || s.code} value={s.name}>{s.name}</option>
                        ))
                      ) : (
                        <option value="">Belum ada mata pelajaran</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Guru Pengampu *</label>
                  {isTeacher && user?.full_name ? (
                    <input
                      type="text"
                      disabled
                      value={user.full_name}
                      className="input"
                      style={{ background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 700 }}
                    />
                  ) : (
                    <select
                      value={newMaterial.author}
                      onChange={e => setNewMaterial({ ...newMaterial, author: e.target.value })}
                      className="input"
                    >
                      {teachers.length > 0 ? (
                        teachers.map((t: any) => (
                          <option key={t.id} value={t.full_name}>
                            {t.full_name} {t.nip ? `(NIP: ${t.nip})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="">Belum ada guru</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Judul Modul Pembelajaran *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Modul Matematika Persamaan Linear"
                    value={newMaterial.title}
                    onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Tipe Format Materi *</label>
                  <select
                    value={newMaterial.format}
                    onChange={e => setNewMaterial({ ...newMaterial, format: e.target.value as any })}
                    className="input"
                    style={{ fontWeight: 800 }}
                  >
                    <option value="VIDEO">🎥 Video Pembelajaran YouTube (Form Link URL)</option>
                    <option value="PDF">📄 Dokumen Modul PDF (Tombol Upload File)</option>
                    <option value="TEXT">📝 Teks &amp; Gambar (Deskripsi + Upload Gambar Komputer)</option>
                  </select>
                </div>

                {/* Dynamic Inputs */}
                {newMaterial.format === 'VIDEO' && (
                  <div style={{ background: 'rgba(220, 38, 38, 0.10)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626' }}>Link URL YouTube Pembelajaran *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newMaterial.youtubeUrl}
                      onChange={e => setNewMaterial({ ...newMaterial, youtubeUrl: e.target.value })}
                      className="input"
                    />
                  </div>
                )}

                {newMaterial.format === 'PDF' && (
                  <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8' }}>Pilih File PDF dari Komputer *</label>
                    <input
                      type="file"
                      accept=".pdf,.doc"
                      onChange={handlePdfFileSelect}
                      className="input"
                      style={{ background: 'var(--bg-card)' }}
                    />
                    {newMaterial.pdfFileName && <div style={{ fontSize: '0.74rem', color: 'var(--success)', fontWeight: 700 }}>✓ File: {newMaterial.pdfFileName}</div>}
                  </div>
                )}

                {newMaterial.format === 'TEXT' && (
                  <div style={{ background: 'rgba(22, 163, 74, 0.10)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--success)' }}>Upload Gambar Penjelas dari Komputer (Opsional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="input"
                      style={{ background: 'var(--bg-card)' }}
                    />
                    {newMaterial.imagePreviewUrl && (
                      <div style={{ width: '100%', height: '90px', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={newMaterial.imagePreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Deskripsi Materi *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Uraian instruksi belajar..."
                    value={newMaterial.description}
                    onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">🚀 Publish ke Android App</button>
              </div>
            </form>
          )}
          </div>
        </div>
      )}

      {/* ── Modal Pratinjau ── */}
      {previewMaterial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setPreviewMaterial(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className={`badge ${previewMaterial.format === 'PDF' ? 'badge-info' : previewMaterial.format === 'VIDEO' ? 'badge-warning' : 'badge-active'}`} style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
                  {previewMaterial.format === 'PDF' ? '📕 Buku / Modul PDF' : previewMaterial.format === 'VIDEO' ? '🎥 Video Pembelajaran' : '📝 Teks Artikel'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{previewMaterial.title}</h3>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setPreviewMaterial(null)}>×</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.76rem' }}>
                <span style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                  📚 {previewMaterial.subject}
                </span>
                <span style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                  🏫 {previewMaterial.grade}
                </span>
                <span style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                  👨‍🏫 {previewMaterial.author}
                </span>
                {previewMaterial.startPage && previewMaterial.endPage && (
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                    📖 Halaman {previewMaterial.startPage} — {previewMaterial.endPage}
                  </span>
                )}
              </div>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>Instruksi Belajar:</strong>
                <p style={{ margin: '4px 0 0 0', lineHeight: 1.5 }}>{previewMaterial.description}</p>
              </div>

              {previewMaterial.format === 'VIDEO' && previewMaterial.youtubeUrl && (
                <div style={{ background: '#0f172a', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={getEmbedUrl(previewMaterial.youtubeUrl)}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  </div>
                  <div style={{ padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>▶️ Video Pembelajaran</span>
                    <a href={previewMaterial.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>
                      Buka di YouTube ↗
                    </a>
                  </div>
                </div>
              )}

              {previewMaterial.format === 'PDF' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e40af' }}>📄 Berkas Buku / Dokumen PDF Resmi</div>
                    <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: '2px' }}>
                      {previewMaterial.startPage ? `Fokus Halaman ${previewMaterial.startPage} sampai ${previewMaterial.endPage}` : (previewMaterial.pdfFileName || 'Buku Teks Kurikulum SIBI')}
                    </div>
                  </div>
                  {previewMaterial.externalUrl ? (
                    <a
                      href={previewMaterial.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    >
                      📖 Buka PDF Buku ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#dc2626', background: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                      ⚠️ Dalam Revisi Kemendikdasmen
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMaterial(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Laporan Keterbacaan & Daftar Nama Siswa ── */}
      {completionModalMaterial && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setCompletionModalMaterial(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '840px',
              width: '100%',
              overflow: 'hidden',
              border: '1px solid var(--border-light)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.1rem 1.4rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📖</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Keterbacaan Siswa — {completionModalMaterial.title}
                  </h3>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '0.75rem' }}>
                  <span>🏫 {completionModalMaterial.grade}</span>
                  <span>•</span>
                  <span>📚 {completionModalMaterial.subject}</span>
                  <span>•</span>
                  <span>👨‍🏫 {completionModalMaterial.author}</span>
                </div>
              </div>
              <button
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
                onClick={() => setCompletionModalMaterial(null)}
              >
                ×
              </button>
            </div>

            {/* Quick Stats Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                padding: '1rem 1.4rem',
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Siswa Terdata</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>{completionsList.length} Siswa</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>✅ Selesai Membaca</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#15803d' }}>
                  {completedTotal} Siswa
                  <span style={{ fontSize: '0.72rem', marginLeft: '4px', fontWeight: 700, color: '#166534' }}>
                    ({completionsList.length > 0 ? Math.round((completedTotal / completionsList.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div style={{ background: '#fefce8', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ fontSize: '0.72rem', color: '#854d0e', fontWeight: 700 }}>📖 Sedang Membaca</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#a16207' }}>{readingTotal} Siswa</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>⏳ Belum Membaca</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#64748b' }}>{unreadTotal} Siswa</div>
              </div>
            </div>

            {/* Filter Controls */}
            <div
              style={{
                padding: '0.75rem 1.4rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Filter Tabs */}
              <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
                {(['ALL', 'COMPLETED', 'READING', 'UNREAD'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCompletionFilterTab(tab)}
                    style={{
                      border: 'none',
                      background: completionFilterTab === tab ? '#2563eb' : 'transparent',
                      color: completionFilterTab === tab ? '#ffffff' : 'var(--text-secondary)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab === 'ALL' && `Semua (${completionsList.length})`}
                    {tab === 'COMPLETED' && `✓ Selesai (${completedTotal})`}
                    {tab === 'READING' && `📖 Sedang Baca (${readingTotal})`}
                    {tab === 'UNREAD' && `⏳ Belum (${unreadTotal})`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {/* Rombel Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>Rombel:</span>
                  <select
                    value={completionClassFilter}
                    onChange={e => {
                      const newCid = e.target.value;
                      setCompletionClassFilter(newCid);
                      if (completionModalMaterial) {
                        handleOpenCompletions(completionModalMaterial, newCid);
                      }
                    }}
                    className="input"
                    style={{
                      height: '34px',
                      fontSize: '0.78rem',
                      padding: '0 0.6rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      minWidth: '130px'
                    }}
                  >
                    <option value="ALL">Rombel Terkait ({completionModalMaterial.grade})</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Search Box */}
                <div style={{ minWidth: '180px', maxWidth: '280px', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Cari nama siswa / NISN..."
                    value={completionSearch}
                    onChange={e => setCompletionSearch(e.target.value)}
                    className="input"
                    style={{ width: '100%', height: '34px', fontSize: '0.78rem', padding: '0 0.75rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Student Table / List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              {loadingCompletions ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Memuat data keterbacaan siswa...</div>
                </div>
              ) : filteredCompletions.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {completionsList.length === 0
                      ? 'Belum ada data siswa terdaftar untuk rombel materi ini atau belum ada aktivitas membaca.'
                      : 'Tidak ada data siswa yang cocok dengan filter pencarian.'}
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '0.65rem 1rem', width: '40px', color: 'var(--text-muted)', fontWeight: 800 }}>#</th>
                      <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 800 }}>Nama Siswa</th>
                      <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 800 }}>NISN</th>
                      <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 800 }}>Status Keterbacaan</th>
                      <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 800 }}>Progres / Halaman</th>
                      <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 800, textAlign: 'right' }}>Waktu Selesai / Terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompletions.map((st, idx) => (
                      <tr key={st.student_id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          <div>{st.student_name}</div>
                          {st.class_name && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{st.class_name}</div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {st.nisn || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {st.is_completed ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                              }}
                            >
                              ✅ Selesai Membaca
                            </span>
                          ) : st.current_page || st.last_read_at ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fef9c3',
                                color: '#a16207',
                                border: '1px solid #fde047',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                              }}
                            >
                              📖 Sedang Membaca
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-light)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                              }}
                            >
                              ⏳ Belum Membaca
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                          {st.is_completed ? (
                            <span style={{ color: '#15803d' }}>100% Selesai</span>
                          ) : st.current_page ? (
                            <span>Halaman {st.current_page}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>0%</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {st.completed_at ? (
                            <span style={{ color: '#15803d', fontWeight: 700 }}>
                              {new Date(st.completed_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : st.last_read_at ? (
                            <span>
                              {new Date(st.last_read_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Belum dibuka</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '0.85rem 1.4rem',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sinkronisasi data langsung dengan progres membaca siswa di SchoolOS Android App.
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCompletionModalMaterial(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
