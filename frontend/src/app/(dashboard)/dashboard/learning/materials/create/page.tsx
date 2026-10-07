'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLibraryBooks, useSubjects, LibraryBook, AcademicSubject } from '@/features/material';

const YOUTUBE_API_KEY = 'AIzaSyDOPhowqK1I3toqkpIhCQXUNikPqzd2IZI';

interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

interface ContentBlock {
  id: string;
  type: 'IMAGE' | 'TEXT';
  content: string;
}

function unescapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/');
}

export default function CreateMaterialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase().includes('guru') || user?.role?.toLowerCase().includes('teacher') || user?.role?.toLowerCase().includes('pengajar');

  // Primary Material Format: PDF | VIDEO | INFOGRAPHIC | ARTICLE
  const [materialFormat, setMaterialFormat] = useState<'PDF' | 'VIDEO' | 'INFOGRAPHIC' | 'ARTICLE'>('PDF');

  // PDF Source Mode: SIBI (Katalog Buku Kurikulum) vs UPLOAD (Unggah Dokumen Mandiri)
  const [pdfSourceMode, setPdfSourceMode] = useState<'SIBI' | 'UPLOAD'>('SIBI');

  // Master Data via TanStack Query & SDK
  const { data: libraryBooks = [], isLoading: isLoadingBooks } = useLibraryBooks();
  const { data: subjectsList = [], isLoading: isLoadingSubjects } = useSubjects();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // SIBI Catalog State
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [bookStartPage, setBookStartPage] = useState<number>(1);
  const [bookEndPage, setBookEndPage] = useState<number>(15);

  // Manual PDF Upload State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // YouTube Video Search & Integration State
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [ytSearchResults, setYtSearchResults] = useState<YouTubeVideoItem[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [selectedYtVideo, setSelectedYtVideo] = useState<YouTubeVideoItem | null>(null);
  const [previewYtVideo, setPreviewYtVideo] = useState<YouTubeVideoItem | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Infographic Multi-Block Composer State
  const [infographicBlocks, setInfographicBlocks] = useState<ContentBlock[]>([
    { id: 'block-1', type: 'IMAGE', content: '' },
    { id: 'block-2', type: 'TEXT', content: '' }
  ]);
  const [infographicTab, setInfographicTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');

  // Article State
  const [articleContent, setArticleContent] = useState('');
  const [articleTab, setArticleTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');

  // Common Form Fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetGrade, setTargetGrade] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadSdkData() {
      setLoadingInitial(true);
      try {
        const [teacherRes, classRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (isTeacher && user?.full_name) {
            setAuthor(user.full_name);
          } else if (list.length > 0) {
            setAuthor(list[0].full_name);
          }
        }
        if (classRes?.data?.data) {
          const list = classRes.data.data;
          setClassesList(list);
          if (list.length > 0) setTargetGrade(list[0].name);
        }
      } catch (err) {
        console.error('Error loading SDK master data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadSdkData();
  }, []);

  useEffect(() => {
    if (isTeacher && user?.full_name) {
      setAuthor(user.full_name);
    }
  }, [isTeacher, user?.full_name]);

  // Set default subject if available
  useEffect(() => {
    if (!subject && subjectsList.length > 0) {
      setSubject(subjectsList[0].name);
    }
  }, [subjectsList, subject]);

  const currentBook = selectedBook ?? (libraryBooks.length > 0 ? libraryBooks[0] : null);
  const currentSubject = subject || (subjectsList.length > 0 ? subjectsList[0].name : '');

  // Filtered Books for SIBI Catalog
  const filteredBooks = useMemo(() => {
    return libraryBooks.filter((b: LibraryBook) => {
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

  const bookSubjects = useMemo(() => {
    const set = new Set<string>();
    libraryBooks.forEach((b: LibraryBook) => {
      if (b.subject_name) set.add(b.subject_name);
    });
    return Array.from(set).sort();
  }, [libraryBooks]);

  // Handler: Select SIBI Book -> Auto-fill title & description
  const handleSelectBook = (book: LibraryBook) => {
    setSelectedBook(book);
    const startP = Math.max(1, bookStartPage || 1);
    const endP = Math.min(book.total_pages || 100, Math.max(startP, bookEndPage || 15));
    setTitle(`Materi Bacaan: ${book.title} (Hal. ${startP}–${endP})`);
    setDescription(`Silakan pelajari buku resmi "${book.title}" halaman ${startP} sampai ${endP} untuk persiapan materi tatap muka dan evaluasi.`);
    if (book.subject_name) {
      const subjectName = book.subject_name.toLowerCase();
      const matched = subjectsList.find(s => s.name && s.name.toLowerCase() === subjectName);
      if (matched) setSubject(matched.name);
    }
  };

  const handlePageChange = (start: number, end: number) => {
    setBookStartPage(start);
    setBookEndPage(end);
    if (currentBook) {
      setTitle(`Materi Bacaan: ${currentBook.title} (Hal. ${start}–${end})`);
      setDescription(`Silakan pelajari buku resmi "${currentBook.title}" halaman ${start} sampai ${end} untuk persiapan materi tatap muka dan evaluasi.`);
    }
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPdfFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      showToast(`✓ Berkas "${file.name}" siap diunggah`, 'success');
    }
  };

  // YouTube API Search Integration
  const handleSearchYouTube = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = ytSearchQuery.trim();
    if (!query) {
      showToast('Ketik kata kunci materi video terlebih dahulu', 'warning');
      return;
    }

    setIsSearchingYt(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Gagal memuat hasil pencarian YouTube API.');
      }
      const data = await res.json();
      const items: YouTubeVideoItem[] = (data.items || []).map((item: any) => ({
        id: item.id?.videoId || '',
        title: unescapeHtml(item.snippet?.title || ''),
        description: unescapeHtml(item.snippet?.description || ''),
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        channelTitle: unescapeHtml(item.snippet?.channelTitle || ''),
        publishedAt: item.snippet?.publishedAt || ''
      })).filter((v: YouTubeVideoItem) => Boolean(v.id));

      setYtSearchResults(items);
      if (items.length === 0) {
        showToast('Tidak ada video yang cocok dengan kata kunci.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mencari video di YouTube', 'error');
    } finally {
      setIsSearchingYt(false);
    }
  };

  // Handler: "Gunakan Video Ini" -> Auto-fill title & description, set video URL
  const handleSelectYouTubeVideo = (video: YouTubeVideoItem) => {
    setSelectedYtVideo(video);
    setPreviewYtVideo(null);
    setTitle(video.title);
    setDescription(video.description || `Video pembelajaran: ${video.title} oleh ${video.channelTitle}`);
    setYoutubeUrl(`https://www.youtube.com/watch?v=${video.id}`);
    showToast(`✓ Video "${video.title.substring(0, 35)}..." berhasil dipilih! Judul & deskripsi terisi otomatis.`, 'success');
  };

  // Infographic Block Helpers
  const addInfographicBlock = (type: 'IMAGE' | 'TEXT') => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: ''
    };
    setInfographicBlocks(prev => [...prev, newBlock]);
  };

  const updateInfographicBlock = (id: string, content: string) => {
    setInfographicBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeInfographicBlock = (id: string) => {
    if (infographicBlocks.length <= 1) {
      showToast('Minimal harus ada 1 blok infografis', 'warning');
      return;
    }
    setInfographicBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveInfographicBlock = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === infographicBlocks.length - 1) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    setInfographicBlocks(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handlePasteClipboardToBlock = async (id: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        updateInfographicBlock(id, text);
        showToast('✓ Berhasil menempelkan konten dari papan klip', 'success');
      }
    } catch {
      showToast('Gunakan Ctrl+V untuk menempelkan konten ke kolom ini', 'warning');
    }
  };

  const handlePasteClipboardToArticle = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setArticleContent(prev => prev ? `${prev}\n\n${text}` : text);
        showToast('✓ Berhasil menempelkan teks artikel dari papan klip', 'success');
      }
    } catch {
      showToast('Gunakan Ctrl+V untuk menempelkan teks ke editor artikel', 'warning');
    }
  };

  // Form Submit Handler (Interlocking across SIBI, Manual PDF, Video, Infographic, Article)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
    const effectiveAuthor = (isTeacher && user?.full_name) ? user.full_name : author;
    const targetClassObj = classesList.find(c => c.name === targetGrade) || classesList[0];
    const targetTeacherObj = teachers.find(t => t.full_name === effectiveAuthor || (isTeacher && (t.user_id === user?.id || t.id === user?.id))) || (isTeacher ? null : teachers[0]);
    const targetSubjectObj = subjectsList.find(s => s.name === currentSubject);

    // Form Validations
    if (!title.trim()) {
      showToast('⚠️ Judul materi wajib diisi', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. SIBI PDF MODE
      if (materialFormat === 'PDF' && pdfSourceMode === 'SIBI') {
        if (!currentBook) {
          showToast('⚠️ Silakan pilih salah satu buku dari katalog buku kurikulum SIBI', 'warning');
          setIsSubmitting(false);
          return;
        }

        const startP = Math.max(1, Number(bookStartPage) || 1);
        const endP = Math.min(currentBook.total_pages || 300, Math.max(startP, Number(bookEndPage) || 10));
        const finalTitle = title.trim() || `Materi Bacaan: ${currentBook.title} (Hal. ${startP}–${endP})`;

        const payload = {
          book_id: currentBook.id,
          title: finalTitle,
          instructions: description.trim() || `Silakan baca dan pelajari buku "${currentBook.title}" halaman ${startP} sampai ${endP}.`,
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
          showToast('✓ Modul buku kurikulum resmi berhasil diterbitkan & disinkronkan ke mobile!', 'success');
          setTimeout(() => router.push('/dashboard/learning/materials'), 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menugaskan buku perpustakaan', 'error');
        }
      } 
      // 2. MANUAL PDF MODE
      else if (materialFormat === 'PDF' && pdfSourceMode === 'UPLOAD') {
        let storageKey: string | null = null;
        let externalUrl: string | null = null;

        if (selectedPdfFile) {
          setUploadProgress(true);
          try {
            const formData = new FormData();
            formData.append('file', selectedPdfFile);
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
          material_type: 'document',
          title: title.trim(),
          description: `${subject || 'Umum'} • ${targetGrade || 'Semua Rombel'} • ${effectiveAuthor || 'Guru Pengampu'} • ${description || 'Modul PDF Mandiri'}`,
          storage_key: storageKey || 'Modul Digital',
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
          showToast('✓ Modul berkas PDF berhasil diterbitkan!', 'success');
          setTimeout(() => router.push('/dashboard/learning/materials'), 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menerbitkan modul PDF', 'error');
        }
      }
      // 3. YOUTUBE VIDEO MODE
      else if (materialFormat === 'VIDEO') {
        if (!youtubeUrl.trim()) {
          showToast('⚠️ Silakan cari dan pilih video pembelajaran YouTube terlebih dahulu', 'warning');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          material_type: 'video',
          title: title.trim(),
          description: `${subject || 'Umum'} • ${targetGrade || 'Semua Rombel'} • ${effectiveAuthor || 'Guru Pengampu'} • ${description || 'Video Pembelajaran YouTube'}`,
          storage_key: 'YouTube',
          external_url: youtubeUrl.trim(),
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
          showToast('✓ Video pembelajaran YouTube berhasil diterbitkan ke siswa!', 'success');
          setTimeout(() => router.push('/dashboard/learning/materials'), 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menerbitkan modul video', 'error');
        }
      }
      // 4. INFOGRAPHIC MODE
      else if (materialFormat === 'INFOGRAPHIC') {
        const validBlocks = infographicBlocks.filter(b => b.content.trim().length > 0);
        if (validBlocks.length === 0) {
          showToast('⚠️ Tambahkan minimal 1 gambar atau teks pada infografis', 'warning');
          setIsSubmitting(false);
          return;
        }

        const firstImage = validBlocks.find(b => b.type === 'IMAGE');
        const payload = {
          material_type: 'image',
          title: title.trim(),
          description: JSON.stringify(validBlocks),
          storage_key: 'Infografis Interaktif',
          external_url: firstImage?.content || null,
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
          showToast('✓ Modul infografis interaktif berhasil diterbitkan!', 'success');
          setTimeout(() => router.push('/dashboard/learning/materials'), 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menerbitkan infografis', 'error');
        }
      }
      // 5. ARTICLE MODE
      else if (materialFormat === 'ARTICLE') {
        if (!articleContent.trim()) {
          showToast('⚠️ Isi naskah materi artikel wajib ditulis', 'warning');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          material_type: 'article',
          title: title.trim(),
          description: articleContent.trim(),
          storage_key: 'Artikel Teks',
          external_url: null,
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
          showToast('✓ Artikel materi pembelajaran berhasil diterbitkan!', 'success');
          setTimeout(() => router.push('/dashboard/learning/materials'), 800);
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || '⚠️ Gagal menerbitkan artikel', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || '⚠️ Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

      {/* YouTube Video Preview Modal */}
      {previewYtVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '780px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎬</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>Pratinjau Video YouTube</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewYtVideo(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${previewYtVideo.id}?autoplay=1`}
                title={previewYtVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {previewYtVideo.title}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Channel: <strong>{previewYtVideo.channelTitle}</strong>
              </div>
              {previewYtVideo.description && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', maxHeight: '80px', overflowY: 'auto', lineHeight: 1.5 }}>
                  {previewYtVideo.description}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPreviewYtVideo(null)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectYouTubeVideo(previewYtVideo)}
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', fontWeight: 800, background: '#ef4444', borderColor: '#ef4444' }}
                >
                  ✓ Gunakan Video Ini Untuk Materi
                </button>
              </div>
            </div>
          </div>
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
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Pusat Penerbitan Modul &amp; Materi Pembelajaran
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Katalog resmi SIBI Kemdikdasmen, Video YouTube terintegrasi, Infografis interaktif kanvas, dan Artikel naskah untuk siswa.
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

      {/* ── TOP-LEVEL FORMAT SELECTION BAR (4 CORE LMS FORMATS) ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '0.35rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.4rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* FORMAT 1: PDF */}
        <button
          type="button"
          onClick={() => setMaterialFormat('PDF')}
          style={{
            padding: '0.85rem 0.5rem',
            borderRadius: '12px',
            border: 'none',
            background: materialFormat === 'PDF' ? 'var(--accent-gradient)' : 'transparent',
            color: materialFormat === 'PDF' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: materialFormat === 'PDF' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📄</span>
          <span>Modul Dokumen / PDF</span>
        </button>

        {/* FORMAT 2: YOUTUBE VIDEO */}
        <button
          type="button"
          onClick={() => setMaterialFormat('VIDEO')}
          style={{
            padding: '0.85rem 0.5rem',
            borderRadius: '12px',
            border: 'none',
            background: materialFormat === 'VIDEO' ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'transparent',
            color: materialFormat === 'VIDEO' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: materialFormat === 'VIDEO' ? '0 4px 12px rgba(239, 68, 68, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎥</span>
          <span>Video YouTube</span>
        </button>

        {/* FORMAT 3: INFOGRAPHIC */}
        <button
          type="button"
          onClick={() => setMaterialFormat('INFOGRAPHIC')}
          style={{
            padding: '0.85rem 0.5rem',
            borderRadius: '12px',
            border: 'none',
            background: materialFormat === 'INFOGRAPHIC' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
            color: materialFormat === 'INFOGRAPHIC' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: materialFormat === 'INFOGRAPHIC' ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎨</span>
          <span>Infografis Interaktif</span>
        </button>

        {/* FORMAT 4: ARTICLE */}
        <button
          type="button"
          onClick={() => setMaterialFormat('ARTICLE')}
          style={{
            padding: '0.85rem 0.5rem',
            borderRadius: '12px',
            border: 'none',
            background: materialFormat === 'ARTICLE' ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'transparent',
            color: materialFormat === 'ARTICLE' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: materialFormat === 'ARTICLE' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📝</span>
          <span>Artikel &amp; Bacaan</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Dedicated Workspace per Selected Format */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* ══════════════════════════════════════════════════════════════════════
              FORMAT 1: MODUL DOKUMEN / PDF
              Sub-toggle: SIBI (Katalog Kemdikdasmen) vs UPLOAD (Unggah Dokumen Mandiri)
             ══════════════════════════════════════════════════════════════════════ */}
          {materialFormat === 'PDF' && (
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
                  Sumber Materi Dokumen PDF
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Pilih apakah materi bersumber dari katalog 600+ buku resmi SIBI Kemdikdasmen atau berkas PDF yang Anda unggah mandiri.
                </p>
              </div>

              {/* PDF Sub-source Toggle */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                background: 'var(--bg-elevated)',
                padding: '0.3rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light)'
              }}>
                <button
                  type="button"
                  onClick={() => setPdfSourceMode('SIBI')}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: pdfSourceMode === 'SIBI' ? 'var(--accent)' : 'transparent',
                    color: pdfSourceMode === 'SIBI' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>📚</span>
                  <span>Katalog Buku SIBI ({libraryBooks.length} Buku Resmi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPdfSourceMode('UPLOAD')}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: pdfSourceMode === 'UPLOAD' ? 'var(--accent)' : 'transparent',
                    color: pdfSourceMode === 'UPLOAD' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>📤</span>
                  <span>Upload Berkas PDF Mandiri</span>
                </button>
              </div>

              {/* ── SUB-FLOW A: KATALOG BUKU SIBI ── */}
              {pdfSourceMode === 'SIBI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(14, 165, 233, 0.08)',
                    border: '1px solid rgba(14, 165, 233, 0.25)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.78rem',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>✨</span>
                    <span><strong>Buku SIBI Resmi Terpilih:</strong> Pengunggahan berkas tidak diperlukan. Judul &amp; deskripsi terisi otomatis dari metadata buku resmi.</span>
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="🔍 Cari judul buku, mapel, atau pengarang..."
                      value={bookSearchQuery}
                      onChange={e => setBookSearchQuery(e.target.value)}
                      className="input"
                      style={{ fontSize: '0.82rem' }}
                    />
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
                    <select
                      value={selectedGradeFilter}
                      onChange={e => setSelectedGradeFilter(e.target.value)}
                      className="input"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <option value="ALL">Semua Kelas</option>
                      <option value="Kelas 7">Kelas 7</option>
                      <option value="Kelas 8">Kelas 8</option>
                      <option value="Kelas 9">Kelas 9</option>
                      <option value="Kelas 10">Kelas 10</option>
                      <option value="Kelas 11">Kelas 11</option>
                      <option value="Kelas 12">Kelas 12</option>
                    </select>
                  </div>

                  {/* Book Grid Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: '0.75rem',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    padding: '0.25rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    background: 'var(--bg-elevated)'
                  }}>
                    {filteredBooks.length > 0 ? (
                      filteredBooks.map((book: LibraryBook) => {
                        const isSelected = currentBook?.id === book.id;
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
                              gap: '0.45rem',
                              position: 'relative',
                              boxShadow: isSelected ? '0 0 0 3px rgba(14, 165, 233, 0.2)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>📕</span>
                              <span style={{
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                                color: isSelected ? '#fff' : 'var(--text-muted)'
                              }}>
                                {book.grade_level_name || 'Buku Teks'}
                              </span>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.35, minHeight: '2.3rem' }}>
                              {book.title}
                            </div>

                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                              <div>{book.subject_name || 'Mata Pelajaran Umum'}</div>
                              <div>{book.publisher || 'Kemendikbudristek'} • {book.total_pages || 100} Hal.</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                                {isSelected ? '✓ Terpilih' : 'Pilih Buku'}
                              </span>
                              {book.file_url && (
                                <a
                                  href={book.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}
                                >
                                  Buka PDF ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ gridColumn: '1 / -1', padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        🔍 Tidak ada buku yang cocok dengan kata kunci "{bookSearchQuery}".
                      </div>
                    )}
                  </div>

                  {/* Selected Book Confirmation & Page Range Config */}
                  {currentBook && (
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
                              Buku Terpilih: {currentBook.title}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#0284c7' }}>
                              {currentBook.publisher || 'Kemendikbudristek'} • Total {currentBook.total_pages || 100} Halaman
                            </div>
                          </div>
                        </div>
                        {currentBook.file_url && (
                          <a
                            href={currentBook.file_url}
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
                            max={currentBook.total_pages || 500}
                            value={bookStartPage}
                            onChange={e => handlePageChange(Math.max(1, parseInt(e.target.value) || 1), bookEndPage)}
                            className="input"
                            style={{ width: '80px', height: '34px', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>Sampai Hal.</span>
                          <input
                            type="number"
                            min={bookStartPage}
                            max={currentBook.total_pages || 500}
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
              )}

              {/* ── SUB-FLOW B: UPLOAD BERKAS PDF MANDIRI (KATALOG BUKU TIDAK DITAMPILKAN) ── */}
              {pdfSourceMode === 'UPLOAD' && (
                <div style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <span style={{ fontSize: '2.8rem' }}>📤</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                      {selectedPdfFile ? selectedPdfFile.name : 'Pilih Berkas PDF Dokumen Pembelajaran'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Mendukung handout materi, slide presentasi, atau ringkasan guru. Maksimal 25 MB.
                    </div>
                  </div>

                  <label
                    className="btn btn-primary"
                    style={{ cursor: 'pointer', fontWeight: 800, borderRadius: '10px', padding: '0.55rem 1.4rem' }}
                  >
                    <span>{selectedPdfFile ? 'Ganti Berkas PDF' : 'Pilih Berkas PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {selectedPdfFile && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                      ✓ Berkas siap diunggah saat formulir diterbitkan.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              FORMAT 2: VIDEO YOUTUBE (TERINTEGRASI LANGSUNG YOUTUBE DATA API V3)
              KATALOG BUKU TIDAK DITAMPILKAN (TIDAK RELEVAN)
             ══════════════════════════════════════════════════════════════════════ */}
          {materialFormat === 'VIDEO' && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🎥</span>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Integrasi YouTube Data API v3
                  </h2>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Cari video pembelajaran langsung tanpa keluar aplikasi. Pratinjau langsung dan gunakan video ini untuk mengisi judul &amp; deskripsi secara otomatis.
                </p>
              </div>

              {/* YouTube Search Bar */}
              <form onSubmit={handleSearchYouTube} style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Ketik topik materi (contoh: Hukum Newton Fisika Kelas 10)..."
                  value={ytSearchQuery}
                  onChange={e => setYtSearchQuery(e.target.value)}
                  className="input"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button
                  type="submit"
                  disabled={isSearchingYt}
                  className="btn btn-primary"
                  style={{ background: '#ef4444', borderColor: '#ef4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem' }}
                >
                  {isSearchingYt ? (
                    <>
                      <span style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Cari Video</span>
                    </>
                  )}
                </button>
              </form>

              {/* Selected Video Pill */}
              {selectedYtVideo && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1.5px solid #ef4444',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                    {selectedYtVideo.thumbnailUrl && (
                      <img
                        src={selectedYtVideo.thumbnailUrl}
                        alt=""
                        style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                        ✓ Video Terpilih Untuk Materi Siswa
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {selectedYtVideo.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Channel: {selectedYtVideo.channelTitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewYtVideo(selectedYtVideo)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', borderRadius: '8px' }}
                    >
                      Putar Preview 🎬
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedYtVideo(null)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', borderRadius: '8px', color: '#ef4444' }}
                    >
                      Ganti Video
                    </button>
                  </div>
                </div>
              )}

              {/* Search Results Grid (Max 10 per request to save quota) */}
              {ytSearchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Hasil Pencarian YouTube Data API ({ytSearchResults.length} Video):
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '0.75rem',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    padding: '0.25rem',
                    borderRadius: '14px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-elevated)'
                  }}>
                    {ytSearchResults.map(video => (
                      <div
                        key={video.id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Thumbnail with quick preview badge */}
                        <div
                          onClick={() => setPreviewYtVideo(video)}
                          style={{ position: 'relative', width: '100%', paddingTop: '56.25%', cursor: 'pointer', background: '#000' }}
                        >
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '38px',
                              height: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem'
                            }}>
                              ▶
                            </span>
                          </div>
                        </div>

                        {/* Video Info & Action */}
                        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.35, minHeight: '2.4rem' }}>
                            {video.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Channel: {video.channelTitle}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewYtVideo(video)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', borderRadius: '8px', padding: '0.35rem' }}
                            >
                              Putar Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectYouTubeVideo(video)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.7rem', borderRadius: '8px', padding: '0.35rem', background: '#ef4444', borderColor: '#ef4444', fontWeight: 800 }}
                            >
                              Gunakan Video
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual URL fallback (if teacher already has specific URL) */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                <details style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Opsi Manual: Masukkan Tautan YouTube URL langsung
                  </summary>
                  <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      className="input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              FORMAT 3: INFOGRAFIS INTERAKTIF (MULTI-BLOCK CANVAS COMPOSER)
              KATALOG BUKU TIDAK DITAMPILKAN (TIDAK RELEVAN)
             ══════════════════════════════════════════════════════════════════════ */}
          {materialFormat === 'INFOGRAPHIC' && (
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎨</span>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Penyusun Lembar Infografis &amp; Visual
                    </h2>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Susun materi berupa rangkaian gambar dan paragraf penjelasan layaknya dokumen Word atau Canva.
                  </p>
                </div>

                {/* Edit vs Preview Toggle */}
                <div style={{
                  display: 'flex',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  padding: '3px',
                  border: '1px solid var(--border-light)'
                }}>
                  <button
                    type="button"
                    onClick={() => setInfographicTab('EDIT')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: infographicTab === 'EDIT' ? '#8b5cf6' : 'transparent',
                      color: infographicTab === 'EDIT' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Editor Blok
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfographicTab('PREVIEW')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: infographicTab === 'PREVIEW' ? '#8b5cf6' : 'transparent',
                      color: infographicTab === 'PREVIEW' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    👁️ Pratinjau Kanvas
                  </button>
                </div>
              </div>

              {/* TAB 1: BLOCK EDITOR */}
              {infographicTab === 'EDIT' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {infographicBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '14px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {/* Block Header Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: block.type === 'IMAGE' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: block.type === 'IMAGE' ? '#8b5cf6' : '#10b981'
                          }}>
                            {block.type === 'IMAGE' ? `🖼️ Gambar Visual #${index + 1}` : `📝 Teks Penjelasan #${index + 1}`}
                          </span>
                        </div>

                        {/* Reorder and Delete Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => moveInfographicBlock(index, 'UP')}
                            disabled={index === 0}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveInfographicBlock(index, 'DOWN')}
                            disabled={index === infographicBlocks.length - 1}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              cursor: index === infographicBlocks.length - 1 ? 'not-allowed' : 'pointer',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeInfographicBlock(block.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Block Input Content */}
                      {block.type === 'IMAGE' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="url"
                              placeholder="Tempelkan URL Gambar Infografis (https://...)..."
                              value={block.content}
                              onChange={e => updateInfographicBlock(block.id, e.target.value)}
                              className="input"
                              style={{ fontSize: '0.82rem', flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => handlePasteClipboardToBlock(block.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                            >
                              📋 Tempel URL
                            </button>
                          </div>

                          {block.content && (
                            <div style={{
                              maxHeight: '220px',
                              overflow: 'hidden',
                              borderRadius: '10px',
                              border: '1px solid var(--border-light)',
                              background: '#000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img
                                src={block.content}
                                alt="Preview Infografis"
                                style={{ maxHeight: '220px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                                onError={(e) => { (e.target as any).style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <textarea
                            rows={3}
                            placeholder="Tuliskan keterangan bagan atau penjelasan materi..."
                            value={block.content}
                            onChange={e => updateInfographicBlock(block.id, e.target.value)}
                            className="input"
                            style={{ height: 'auto', padding: '0.6rem', fontSize: '0.82rem', lineHeight: 1.5 }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handlePasteClipboardToBlock(block.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem' }}
                            >
                              📋 Tempel Teks dari Papan Klip
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Block Action Bar */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => addInfographicBlock('IMAGE')}
                      className="btn btn-secondary"
                      style={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span>➕ Tambah Gambar Visual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addInfographicBlock('TEXT')}
                      className="btn btn-secondary"
                      style={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span>➕ Tambah Paragraf Teks</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB 2: LIVE CANVAS PREVIEW (Docx / Canva style) */
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase' }}>
                      Pratinjau Lembar Interaktif Siswa
                    </span>
                    <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {title || 'Judul Modul Infografis'}
                    </h3>
                  </div>

                  {infographicBlocks.map((block, idx) => (
                    <div key={block.id}>
                      {block.type === 'IMAGE' && block.content && (
                        <div style={{
                          borderRadius: '14px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-light)',
                          background: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={block.content}
                            alt=""
                            style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      {block.type === 'TEXT' && block.content && (
                        <div style={{
                          background: 'var(--bg-card)',
                          borderRadius: '12px',
                          padding: '1rem',
                          border: '1px solid var(--border-light)',
                          fontSize: '0.86rem',
                          lineHeight: 1.6,
                          color: 'var(--text-primary)',
                          marginTop: '0.5rem'
                        }}>
                          {block.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              FORMAT 4: ARTIKEL & BACAAN TEKS
              KATALOG BUKU TIDAK DITAMPILKAN (TIDAK RELEVAN)
             ══════════════════════════════════════════════════════════════════════ */}
          {materialFormat === 'ARTICLE' && (
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>📝</span>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Penyusun Artikel &amp; Ringkasan Materi
                    </h2>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Tuliskan atau salin naskah materi lengkap untuk dibaca siswa dengan tipografi nyaman di perangkat mobile.
                  </p>
                </div>

                {/* Edit vs Preview Toggle */}
                <div style={{
                  display: 'flex',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  padding: '3px',
                  border: '1px solid var(--border-light)'
                }}>
                  <button
                    type="button"
                    onClick={() => setArticleTab('EDIT')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: articleTab === 'EDIT' ? '#10b981' : 'transparent',
                      color: articleTab === 'EDIT' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Tulis Artikel
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleTab('PREVIEW')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: articleTab === 'PREVIEW' ? '#10b981' : 'transparent',
                      color: articleTab === 'PREVIEW' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    👁️ Pratinjau Bacaan
                  </button>
                </div>
              </div>

              {articleTab === 'EDIT' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {articleContent.split(/\s+/).filter(Boolean).length} kata • ± {Math.max(1, Math.round(articleContent.split(/\s+/).filter(Boolean).length / 120))} menit estimasi baca
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteClipboardToArticle}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      📋 Tempel Naskah dari Papan Klip
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    placeholder="Tuliskan naskah materi lengkap di sini, gunakan baris baru ganda untuk memisahkan antar paragraf pembahasan..."
                    value={articleContent}
                    onChange={e => setArticleContent(e.target.value)}
                    className="input"
                    style={{ height: 'auto', padding: '1rem', fontSize: '0.88rem', lineHeight: 1.6 }}
                  />
                </div>
              ) : (
                /* Article Reader Preview */
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                      Pratinjau Mode Bacaan Siswa
                    </span>
                    <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {title || 'Judul Artikel Pembelajaran'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {articleContent.split('\n\n').filter(Boolean).map((p, idx) => (
                      <p key={idx} style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)', textAlign: 'justify' }}>
                        {p}
                      </p>
                    ))}
                    {!articleContent && (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                        Belum ada teks artikel yang ditulis.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN: TARGET PENUGASAN SISWA & METADATA ── */}
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

            {/* Judul Modul */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Judul Modul Pembelajaran *
                </label>
                {(materialFormat === 'VIDEO' && selectedYtVideo) || (materialFormat === 'PDF' && pdfSourceMode === 'SIBI' && currentBook) ? (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    ✨ Terisi Otomatis
                  </span>
                ) : null}
              </div>
              <input
                type="text"
                placeholder="Contoh: Modul Fisika Besaran dan Satuan"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
                style={{ fontWeight: 800 }}
              />
            </div>

            {/* Mata Pelajaran */}
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

            {/* Target Rombel / Kelas */}
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

            {/* Guru Pengampu */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Guru Pengampu *
              </label>
              {isTeacher && user?.full_name ? (
                <input
                  type="text"
                  disabled
                  value={user.full_name}
                  className="input"
                  style={{ width: '100%', background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 700 }}
                />
              ) : (
                <select
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="input"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.full_name}>{t.full_name} ({t.nip || 'Guru'})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Petunjuk / Instruksi Pembelajaran */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Petunjuk / Instruksi Pembelajaran
                </label>
                {(materialFormat === 'VIDEO' && selectedYtVideo) || (materialFormat === 'PDF' && pdfSourceMode === 'SIBI' && currentBook) ? (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    ✨ Terisi Otomatis
                  </span>
                ) : null}
              </div>
              <textarea
                rows={3}
                placeholder="Contoh: Silakan pelajari bab ini sebelum mengikuti kuis mingguan."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input"
                style={{ height: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.8rem', lineHeight: 1.5 }}
              />
            </div>

            {/* Action Buttons */}
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
