'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';

export default function CreateMaterialPage() {
  const router = useRouter();

  // Mode: LIBRARY (600+ Buku Kemendikbudristek) vs MANUAL (Upload File / Video / Teks)
  const [creationMode, setCreationMode] = useState<'LIBRARY' | 'MANUAL'>('LIBRARY');

  // Master Data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Library Mode State
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [bookStartPage, setBookStartPage] = useState<number>(1);
  const [bookEndPage, setBookEndPage] = useState<number>(15);

  // Manual Mode State
  const [manualFormat, setManualFormat] = useState<'PDF' | 'VIDEO' | 'TEXT'>('PDF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Common Form Fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetGrade, setTargetGrade] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadMasterData() {
      setLoadingInitial(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [teacherRes, classRes, subjectRes, libraryRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          fetch(getApiUrl('/api/v1/academic/subjects'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(getApiUrl('/api/v1/learning/library/books'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (list.length > 0) setAuthor(list[0].full_name);
        }
        if (classRes?.data?.data) {
          const list = classRes.data.data;
          setClassesList(list);
          if (list.length > 0) setTargetGrade(list[0].name);
        }
        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) setSubject(subjectRes.data[0].name);
        }
        if (libraryRes?.data && Array.isArray(libraryRes.data)) {
          setLibraryBooks(libraryRes.data);
          if (libraryRes.data.length > 0) {
            setSelectedBook(libraryRes.data[0]);
            setTitle(`Materi Bacaan: ${libraryRes.data[0].title} (Hal. 1–15)`);
          }
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadMasterData();
  }, []);

  // Filtered Books for Library Catalog
  const filteredBooks = useMemo(() => {
    return libraryBooks.filter((b: any) => {
      const q = bookSearchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.subject_name && b.subject_name.toLowerCase().includes(q)) ||
        (b.grade_level_name && b.grade_level_name.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.publisher && b.publisher.toLowerCase().includes(q))
      );

      const matchSubject = selectedSubjectFilter === 'ALL' || (
        b.subject_name && b.subject_name.toLowerCase() === selectedSubjectFilter.toLowerCase()
      );

      const matchGrade = selectedGradeFilter === 'ALL' || (
        b.grade_level_name && b.grade_level_name.toLowerCase().includes(selectedGradeFilter.toLowerCase())
      );

      return matchSearch && matchSubject && matchGrade;
    });
  }, [libraryBooks, bookSearchQuery, selectedSubjectFilter, selectedGradeFilter]);

  // Distinct subjects from books
  const bookSubjects = useMemo(() => {
    const set = new Set<string>();
    libraryBooks.forEach((b: any) => {
      if (b.subject_name) set.add(b.subject_name);
    });
    return Array.from(set).sort();
  }, [libraryBooks]);

  const handleSelectBook = (book: any) => {
    setSelectedBook(book);
    const startP = Math.max(1, bookStartPage || 1);
    const endP = Math.min(book.total_pages || 100, Math.max(startP, bookEndPage || 15));
    setTitle(`Materi Bacaan: ${book.title} (Hal. ${startP}–${endP})`);
    if (book.subject_name) {
      const matched = subjectsList.find(s => s.name.toLowerCase() === book.subject_name.toLowerCase());
      if (matched) setSubject(matched.name);
    }
  };

  const handlePageChange = (start: number, end: number) => {
    setBookStartPage(start);
    setBookEndPage(end);
    if (selectedBook) {
      setTitle(`Materi Bacaan: ${selectedBook.title} (Hal. ${start}–${end})`);
    }
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      showToast(`✓ Berkas "${file.name}" siap diunggah`, 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('⚠️ Silakan masukkan judul modul pembelajaran', 'warning');
      return;
    }

    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
    const targetClassObj = classesList.find(c => c.name === targetGrade) || classesList[0];
    const targetTeacherObj = teachers.find(t => t.full_name === author) || teachers[0];
    const targetSubjectObj = subjectsList.find(s => s.name === subject);

    setIsSubmitting(true);

    try {
      if (creationMode === 'LIBRARY') {
        if (!selectedBook) {
          showToast('⚠️ Silakan pilih salah satu buku dari katalog perpustakaan', 'warning');
          setIsSubmitting(false);
          return;
        }

        const startP = Math.max(1, Number(bookStartPage) || 1);
        const endP = Math.min(selectedBook.total_pages || 300, Math.max(startP, Number(bookEndPage) || 10));

        const payload = {
          book_id: selectedBook.id,
          title: title.trim(),
          instructions: description.trim() || `Silakan baca dan pelajari buku "${selectedBook.title}" halaman ${startP} sampai ${endP}.`,
          class_id: targetClassObj?.id || null,
          subject_id: targetSubjectObj?.id || null,
          teacher_id: targetTeacherObj?.id || null,
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
          showToast('✓ Modul buku kurikulum berhasil diterbitkan & disinkronkan ke Android!', 'success');
          setTimeout(() => {
            router.push('/dashboard/learning/materials');
          }, 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menugaskan buku perpustakaan', 'error');
        }
      } else {
        // MANUAL MODE
        let storageKey: string | null = null;
        let externalUrl: string | null = manualFormat === 'VIDEO' ? youtubeUrl.trim() : null;

        if (manualFormat === 'PDF' && selectedFile) {
          setUploadProgress(true);
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
              if (uploadJson.data?.key) storageKey = uploadJson.data.key;
              if (uploadJson.data?.url) externalUrl = uploadJson.data.url;
            }
          } catch (uploadErr) {
            console.warn('Upload fallback warning:', uploadErr);
          } finally {
            setUploadProgress(false);
          }
        }

        const payload = {
          material_type: manualFormat.toLowerCase(),
          title: title.trim(),
          description: `${subject || 'Umum'} • ${targetGrade || 'Semua Rombel'} • ${author || 'Guru Pengampu'} • ${description || 'Modul Pembelajaran Mandiri'}`,
          storage_key: storageKey,
          external_url: externalUrl,
          order_index: 0,
          visibility: 'published',
          class_id: targetClassObj?.id || null,
          teacher_id: targetTeacherObj?.id || null,
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
          showToast('✓ Modul pembelajaran mandiri berhasil diterbitkan!', 'success');
          setTimeout(() => {
            router.push('/dashboard/learning/materials');
          }, 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menerbitkan modul', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || '⚠️ Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'warning' ? '#f59e0b' : '#10b981',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/learning" style={{ color: 'var(--text-muted)' }}>Pembelajaran</Link>
          <span>/</span>
          <Link href="/dashboard/learning/materials" style={{ color: 'var(--text-muted)' }}>Modul Ajar</Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Tambah Baru</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                href="/dashboard/learning/materials"
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '10px', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>←</span> Kembali
              </Link>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Tambah Modul &amp; Materi Pembelajaran
              </h1>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Pilih dari katalog 600+ buku teks resmi Kemendikbudristek atau unggah dokumen mandiri &amp; video materi untuk siswa.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <Link href="/dashboard/learning/materials" className="btn btn-secondary">
              Batal
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Publikasikan Modul</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Selection Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '0.35rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.35rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          type="button"
          onClick={() => setCreationMode('LIBRARY')}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            background: creationMode === 'LIBRARY' ? 'var(--accent-gradient)' : 'transparent',
            color: creationMode === 'LIBRARY' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'all 0.2s ease',
            boxShadow: creationMode === 'LIBRARY' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📚</span>
          <span>Katalog Buku Teks Nasional ({libraryBooks.length} Buku Kurikulum)</span>
        </button>

        <button
          type="button"
          onClick={() => setCreationMode('MANUAL')}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            background: creationMode === 'MANUAL' ? 'var(--accent-gradient)' : 'transparent',
            color: creationMode === 'MANUAL' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'all 0.2s ease',
            boxShadow: creationMode === 'MANUAL' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>✍️</span>
          <span>Unggah Berkas Mandiri (PDF, Video YouTube, Ringkasan Teks)</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Content Picker or File Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {creationMode === 'LIBRARY' ? (
            /* ── LIBRARY CATALOG PICKER ── */
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Pilih Buku dari Katalog Resmi ({filteredBooks.length} Tersedia)
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Buku digital resmi Kemendikbudristek RI siap dibaca siswa di aplikasi mobile dengan fitur penandaan halaman tugas.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <input
                    type="text"
                    placeholder="🔍 Cari judul buku, mapel, atau pengarang..."
                    value={bookSearchQuery}
                    onChange={e => setBookSearchQuery(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <select
                    value={selectedSubjectFilter}
                    onChange={e => setSelectedSubjectFilter(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="ALL">Semua Mapel</option>
                    {bookSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={selectedGradeFilter}
                    onChange={e => setSelectedGradeFilter(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="ALL">Semua Kelas</option>
                    <option value="Kelas 7">Kelas 7 (Fase D)</option>
                    <option value="Kelas 8">Kelas 8 (Fase D)</option>
                    <option value="Kelas 9">Kelas 9 (Fase D)</option>
                    <option value="Kelas 10">Kelas 10 (Fase E)</option>
                    <option value="Kelas 11">Kelas 11 (Fase F)</option>
                    <option value="Kelas 12">Kelas 12 (Fase F)</option>
                  </select>
                </div>
              </div>

              {/* Book Grid Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '0.85rem',
                maxHeight: '440px',
                overflowY: 'auto',
                padding: '0.25rem',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                background: 'var(--bg-elevated)'
              }}>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book: any) => {
                    const isSelected = selectedBook?.id === book.id;
                    return (
                      <div
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        style={{
                          background: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          position: 'relative',
                          boxShadow: isSelected ? '0 0 0 3px rgba(14, 165, 233, 0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.6rem' }}>📕</span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: isSelected ? '#fff' : 'var(--text-muted)'
                          }}>
                            {book.grade_level_name || 'Buku Teks'}
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.35, minHeight: '2.4rem' }}>
                          {book.title}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          <div>{book.subject_name || 'Mata Pelajaran Umum'}</div>
                          <div>{book.publisher || 'Kemendikbudristek'} • {book.total_pages || 100} Hal.</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {isSelected ? '✓ Terpilih' : 'Pilih Buku'}
                          </span>
                          {book.file_url && (
                            <a
                              href={book.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}
                            >
                              Buka PDF ↗
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    🔍 Tidak ada buku yang cocok dengan kata kunci "{bookSearchQuery}".
                  </div>
                )}
              </div>

              {/* Selected Book Confirmation & Page Range Config */}
              {selectedBook && (
                <div style={{
                  background: 'var(--accent-light)',
                  border: '1.5px solid var(--accent)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>📖</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0369a1' }}>
                          Buku Terpilih: {selectedBook.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                          {selectedBook.publisher || 'Kemendikbudristek'} • Total {selectedBook.total_pages || 100} Halaman
                        </div>
                      </div>
                    </div>
                    {selectedBook.file_url && (
                      <a
                        href={selectedBook.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ borderRadius: '8px', fontSize: '0.74rem' }}
                      >
                        Buka &amp; Baca Isi Buku ↗
                      </a>
                    )}
                  </div>

                  <div style={{ borderTop: '1px dashed rgba(14, 165, 233, 0.3)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1' }}>
                      Tentukan Rentang Halaman Materi Wajib Dibaca:
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>Dari Hal.</span>
                      <input
                        type="number"
                        min={1}
                        max={selectedBook.total_pages || 500}
                        value={bookStartPage}
                        onChange={e => handlePageChange(Math.max(1, parseInt(e.target.value) || 1), bookEndPage)}
                        className="input"
                        style={{ width: '80px', height: '34px', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>Sampai Hal.</span>
                      <input
                        type="number"
                        min={bookStartPage}
                        max={selectedBook.total_pages || 500}
                        value={bookEndPage}
                        onChange={e => handlePageChange(bookStartPage, Math.max(bookStartPage, parseInt(e.target.value) || 1))}
                        className="input"
                        style={{ width: '80px', height: '34px', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#0284c7', fontStyle: 'italic' }}>
                        (Total {Math.max(1, bookEndPage - bookStartPage + 1)} Halaman Materi)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── MANUAL MATERIAL UPLOADER ── */
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Format Berkas Materi Ajar
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Pilih bentuk penyampaian materi: Berkas PDF (slide/handout), Video Pembelajaran (YouTube), atau Teks Artikel.
                </p>
              </div>

              {/* Format Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setManualFormat('PDF')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: manualFormat === 'PDF' ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                    background: manualFormat === 'PDF' ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: manualFormat === 'PDF' ? 'var(--accent-dark)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <span>Dokumen / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualFormat('VIDEO')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: manualFormat === 'VIDEO' ? '2px solid #ef4444' : '1px solid var(--border-light)',
                    background: manualFormat === 'VIDEO' ? '#fee2e2' : 'var(--bg-surface)',
                    color: manualFormat === 'VIDEO' ? '#b91c1c' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🎥</span>
                  <span>Video YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualFormat('TEXT')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: manualFormat === 'TEXT' ? '2px solid #10b981' : '1px solid var(--border-light)',
                    background: manualFormat === 'TEXT' ? '#d1fae5' : 'var(--bg-surface)',
                    color: manualFormat === 'TEXT' ? '#047857' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📝</span>
                  <span>Catatan Teks Mandiri</span>
                </button>
              </div>

              {/* Dynamic Uploader View */}
              {manualFormat === 'PDF' && (
                <div style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '14px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>📤</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {selectedFile ? selectedFile.name : 'Pilih atau Tarik Berkas PDF Modul Ajar'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Format PDF didukung, ukuran maksimal 25 MB per dokumen.
                    </div>
                  </div>
                  <label
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', fontWeight: 800, borderRadius: '10px', padding: '0.45rem 1.25rem' }}
                  >
                    <span>Pilih Berkas PDF</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}

              {manualFormat === 'VIDEO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Tautan Video Pembelajaran (YouTube URL) *
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.85rem' }}
                  />
                  {youtubeUrl && (
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      💡 Video ini akan langsung dapat diputar oleh siswa melalui video player bawaan aplikasi mobile SchoolOS.
                    </div>
                  )}
                </div>
              )}

              {manualFormat === 'TEXT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Isi Materi &amp; Ringkasan Pelajaran *
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Tuliskan materi atau rangkuman pokok bahasan yang perlu dipelajari siswa..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="input"
                    style={{ height: 'auto', padding: '0.75rem', fontSize: '0.84rem', lineHeight: 1.6 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Metadata & Publishing Target */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🎯 Target Penugasan Siswa
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Judul Modul Pembelajaran *
              </label>
              <input
                type="text"
                placeholder="Contoh: Modul Fisika Besaran dan Satuan"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
                style={{ fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Mata Pelajaran *
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="input"
              >
                {subjectsList.map(s => (
                  <option key={s.id || s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Rombel / Kelas Target *
              </label>
              <select
                value={targetGrade}
                onChange={e => setTargetGrade(e.target.value)}
                className="input"
              >
                {classesList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Guru Pengampu *
              </label>
              <select
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="input"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.full_name}>{t.full_name} ({t.nip || 'Guru'})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Petunjuk / Instruksi Pembelajaran
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Silakan pelajari bab ini sebelum mengikuti kuis mingguan."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input"
                style={{ height: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.8rem', lineHeight: 1.5 }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isSubmitting ? 'Menerbitkan...' : '🚀 Terbitkan Modul Sekarang'}
              </button>

              <Link
                href="/dashboard/learning/materials"
                className="btn btn-secondary"
                style={{ width: '100%', height: '38px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.84rem' }}
              >
                Batal &amp; Kembali
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
