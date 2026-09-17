'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';

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
};

const INITIAL_MATERIALS: MaterialItem[] = [];

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  
  // Teachers, Classes, and Subjects for dropdowns
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Library Books State (Mode Perpustakaan Guru)
  const [libraryBooks, setLibraryBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookStartPage, setBookStartPage] = useState<number>(1);
  const [bookEndPage, setBookEndPage] = useState<number>(10);
  const [creationMode, setCreationMode] = useState<'MANUAL' | 'LIBRARY'>('MANUAL');

  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return libraryBooks;
    const q = bookSearchQuery.toLowerCase();
    return libraryBooks.filter((b: any) => 
      (b.title && b.title.toLowerCase().includes(q)) || 
      (b.subject_name && b.subject_name.toLowerCase().includes(q)) ||
      (b.grade_level_name && b.grade_level_name.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q))
    );
  }, [libraryBooks, bookSearchQuery]);

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
        const [teacherRes, classRes, subjectRes, materialsRes, libraryRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          fetch(getApiUrl('/api/v1/academic/subjects'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(getApiUrl('/api/v1/learning/materials'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(getApiUrl('/api/v1/learning/library/books'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (libraryRes?.data && Array.isArray(libraryRes.data)) {
          setLibraryBooks(libraryRes.data);
          if (libraryRes.data.length > 0) {
            setSelectedBook(libraryRes.data[0]);
          }
        }

        const teacherList = Array.isArray((teacherRes as any)?.data?.data)
          ? (teacherRes as any).data.data
          : Array.isArray((teacherRes as any)?.data)
            ? (teacherRes as any).data
            : [];
        if (teacherList.length > 0) {
          setTeachers(teacherList);
          setNewMaterial(prev => ({ ...prev, author: prev.author || teacherList[0].full_name }));
        }

        const cList = Array.isArray((classRes as any)?.data?.data)
          ? (classRes as any).data.data
          : Array.isArray((classRes as any)?.data)
            ? (classRes as any).data
            : [];
        if (cList.length > 0) {
          setClassesList(cList);
          setNewMaterial(prev => ({ ...prev, grade: prev.grade || cList[0].name }));
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) {
            setNewMaterial(prev => ({ ...prev, subject: prev.subject || subjectRes.data[0].name }));
          }
        }

        if (materialsRes?.data && Array.isArray(materialsRes.data)) {
          const mapped: MaterialItem[] = materialsRes.data.map((m: any) => {
            const descParts = (m.description || '').includes(' • ') ? m.description.split(' • ') : [];
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
              description: descParts.length > 3 ? descParts.slice(3).join(' • ') : m.description,
              startPage: m.start_page,
              endPage: m.end_page,
              sourceType: m.source_type,
            };
          });
          setMaterials(mapped);
        }
      } catch (err) {
        console.error('Error loading learning data:', err);
      }
    }
    loadData();
  }, []);

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

      const targetTeacher = teachers.find((t: any) => t.full_name === newMaterial.author);
      const payload = {
        material_type: newMaterial.format.toLowerCase(),
        title: newMaterial.title,
        description: `${newMaterial.subject || 'Umum'} • ${newMaterial.grade || 'Semua Rombel'} • ${newMaterial.author || 'Guru'} • ${newMaterial.description || 'Modul Pelajaran'}`,
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
        const resJson = await res.json();
        const created = resJson.data;
        const item: MaterialItem = {
          id: created?.id || `mat-${Date.now()}`,
          title: newMaterial.title,
          subject: newMaterial.subject,
          grade: newMaterial.grade,
          author: newMaterial.author,
          format: newMaterial.format,
          size: newMaterial.format === 'VIDEO' ? '32.0 MB' : '2.1 MB',
          downloads: 0,
          completedCount: 0,
          date: 'Hari ini',
          youtubeUrl: externalUrl ? externalUrl : undefined,
          pdfFileName: storageKey ? storageKey : undefined,
          imagePreviewUrl: newMaterial.imagePreviewUrl,
          description: newMaterial.description,
        };
        setMaterials(prev => [item, ...prev]);
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
    const targetTeacher = teachers.find((t: any) => t.full_name === newMaterial.author) || teachers[0];
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
        const resJson = await res.json();
        const item: MaterialItem = {
          id: resJson.data || `mat-${Date.now()}`,
          title: payload.title,
          subject: newMaterial.subject || selectedBook.subject_name || 'Umum',
          grade: targetClass.name,
          author: targetTeacher?.full_name || newMaterial.author || 'Guru Pengampu',
          format: 'PDF',
          size: `Hal. ${startP}–${endP}`,
          downloads: 0,
          completedCount: 0,
          date: 'Hari ini',
          description: payload.instructions,
          externalUrl: selectedBook.file_url,
          pdfFileName: selectedBook.file_url ? selectedBook.file_url.split('/').pop() : `${selectedBook.title}.pdf`,
          startPage: startP,
          endPage: endP,
          sourceType: 'LIBRARY',
        };
        setMaterials(prev => [item, ...prev]);
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
        setMaterials(prev => prev.filter(m => m.id !== id));
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

  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
          <button
            className="btn btn-secondary btn-sm"
            style={{ background: 'var(--accent-dim)', color: '#2563eb', fontWeight: 800, border: '1px solid rgba(37,99,235,0.3)' }}
            onClick={() => { setCreationMode('LIBRARY'); setShowAddModal(true); }}
          >
            📚 Katalog Buku Perpustakaan ({libraryBooks.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setCreationMode('MANUAL'); setShowAddModal(true); }}>
            + Unggah Modul Ajar Baru
          </button>
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
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Judul Modul</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Mapel &amp; Rombel</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Guru Pengampu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Format &amp; Media</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Penyelesaian Siswa</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Tanggal Tayang</th>
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: m.completedCount > 0 ? '#dcfce7' : 'var(--bg-elevated)', padding: '0.2rem 0.55rem', borderRadius: '8px', border: `1px solid ${m.completedCount > 0 ? '#86efac' : 'var(--border-light)'}` }}>
                        <span style={{ fontSize: '0.8rem' }}>{m.completedCount > 0 ? '✅' : '⏳'}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: m.completedCount > 0 ? '#15803d' : 'var(--text-muted)' }}>
                          {m.completedCount} Siswa
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.date}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
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
                          if (b.subject_name && subjectsList.some(s => s.name.toLowerCase() === b.subject_name.toLowerCase())) {
                            setNewMaterial(prev => ({ ...prev, subject: b.subject_name }));
                          }
                        }
                      }}
                      className="input"
                      style={{ fontWeight: 800 }}
                    >
                      {filteredBooks.length > 0 ? (
                        filteredBooks.map((b: any) => (
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
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700, marginBottom: '6px' }}>▶️ Video Pembelajaran:</div>
                  <a href={previewMaterial.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {previewMaterial.youtubeUrl}
                  </a>
                </div>
              )}

              {previewMaterial.format === 'PDF' && (previewMaterial.externalUrl || previewMaterial.pdfFileName) && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e40af' }}>📄 Berkas Buku / Dokumen PDF</div>
                    <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: '2px' }}>
                      {previewMaterial.startPage ? `Fokus Halaman ${previewMaterial.startPage} sampai ${previewMaterial.endPage}` : (previewMaterial.pdfFileName || 'Buku Teks Kurikulum')}
                    </div>
                  </div>
                  {previewMaterial.externalUrl && (
                    <a
                      href={previewMaterial.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    >
                      📖 Buka PDF Buku ↗
                    </a>
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
    </div>
  );
}
