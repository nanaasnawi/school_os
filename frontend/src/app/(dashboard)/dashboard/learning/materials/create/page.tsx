'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLibraryBooks, useSubjects, LibraryBook } from '@/features/material';
import {
  FileText,
  Video,
  Layers,
  BookOpen,
  UploadCloud,
  Search,
  Check,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  Clipboard,
  Sparkles,
  Play,
  ExternalLink,
  Send,
  AlertCircle,
  Plus,
  Book,
  Sliders,
  Eye,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import styles from './create.module.css';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

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
  const { data: subjectsList = [] } = useSubjects();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [, setLoadingInitial] = useState(true);

  // SIBI Catalog State
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [bookStartPage, setBookStartPage] = useState<number>(1);
  const [bookEndPage, setBookEndPage] = useState<number>(15);

  // Manual PDF Upload State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [, setUploadProgress] = useState(false);

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
  const [publishedPrompt, setPublishedPrompt] = useState<{
    title: string;
    subjectName: string;
    format: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePublishSuccess = (finalTitle: string, finalSubjectName: string, format: string) => {
    showToast('Materi pembelajaran berhasil diterbitkan & disinkronkan ke mobile!', 'success');
    setPublishedPrompt({
      title: finalTitle,
      subjectName: finalSubjectName || subject || 'Umum',
      format,
    });
  };

  useEffect(() => {
    async function loadSdkData() {
      setLoadingInitial(true);
      try {
        const [teacherRes, classRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100, all: true } as any }).catch(() => null),
        ]);

        const tList = Array.isArray(teacherRes?.data?.data)
          ? teacherRes.data.data
          : Array.isArray(teacherRes?.data)
            ? teacherRes.data
            : [];
        if (tList.length > 0) {
          setTeachers(tList);
          if (isTeacher && user?.full_name) {
            setAuthor(user.full_name);
          } else {
            setAuthor(tList[0].full_name);
          }
        }

        const cList = Array.isArray(classRes?.data?.data)
          ? classRes.data.data
          : Array.isArray(classRes?.data)
            ? classRes.data
            : [];
        if (cList.length > 0) {
          setClassesList(cList);
          setTargetGrade(prev => prev || cList[0].name);
        }
      } catch (err) {
        console.error('Error loading SDK master data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadSdkData();
  }, [isTeacher, user?.full_name]);

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
      showToast(`Berkas "${file.name}" siap diunggah`, 'success');
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
    showToast(`Video "${video.title.substring(0, 35)}..." berhasil dipilih`, 'success');
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
        showToast('Berhasil menempelkan konten dari papan klip', 'success');
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
        showToast('Berhasil menempelkan teks artikel dari papan klip', 'success');
      }
    } catch {
      showToast('Gunakan Ctrl+V untuk menempelkan teks ke editor artikel', 'warning');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
    const effectiveAuthor = (isTeacher && user?.full_name) ? user.full_name : author;
    const targetClassObj = classesList.find(c => c.name === targetGrade || c.id === targetGrade) || classesList[0];
    const targetTeacherObj = teachers.find(t => t.full_name === effectiveAuthor || (isTeacher && (t.user_id === user?.id || t.id === user?.id))) || (isTeacher ? null : teachers[0]);
    const targetSubjectObj = subjectsList.find(s => s.name === currentSubject || s.id === currentSubject) || subjectsList[0];

    // Form Validations
    if (!title.trim()) {
      showToast('Judul materi wajib diisi', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. SIBI PDF MODE
      if (materialFormat === 'PDF' && pdfSourceMode === 'SIBI') {
        if (!currentBook) {
          showToast('Silakan pilih salah satu buku dari katalog kurikulum SIBI', 'warning');
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
          handlePublishSuccess(finalTitle, targetSubjectObj?.name || currentSubject, 'SIBI Buku Kurikulum');
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || 'Gagal menugaskan buku perpustakaan', 'error');
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
          description: `${targetSubjectObj?.name || subject || 'Umum'} • ${targetClassObj?.name || targetGrade || 'Semua Rombel'} • ${effectiveAuthor || 'Guru Pengampu'} • ${description || 'Modul PDF Mandiri'}`,
          storage_key: storageKey || 'Modul Digital',
          external_url: externalUrl,
          order_index: 0,
          visibility: 'published',
          class_id: targetClassObj?.id || null,
          subject_id: targetSubjectObj?.id || null,
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
          handlePublishSuccess(title.trim(), targetSubjectObj?.name || subject, 'Modul PDF');
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || 'Gagal menerbitkan modul PDF', 'error');
        }
      }
      // 3. YOUTUBE VIDEO MODE
      else if (materialFormat === 'VIDEO') {
        if (!youtubeUrl.trim()) {
          showToast('Silakan cari dan pilih video YouTube terlebih dahulu', 'warning');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          material_type: 'video',
          title: title.trim(),
          description: `${targetSubjectObj?.name || subject || 'Umum'} • ${targetClassObj?.name || targetGrade || 'Semua Rombel'} • ${effectiveAuthor || 'Guru Pengampu'} • ${description || 'Video Pembelajaran YouTube'}`,
          storage_key: 'YouTube',
          external_url: youtubeUrl.trim(),
          order_index: 0,
          visibility: 'published',
          class_id: targetClassObj?.id || null,
          subject_id: targetSubjectObj?.id || null,
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
          handlePublishSuccess(title.trim(), targetSubjectObj?.name || subject, 'Video YouTube');
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || 'Gagal menerbitkan modul video', 'error');
        }
      }
      // 4. INFOGRAPHIC MODE
      else if (materialFormat === 'INFOGRAPHIC') {
        const validBlocks = infographicBlocks.filter(b => b.content.trim().length > 0);
        if (validBlocks.length === 0) {
          showToast('Tambahkan minimal 1 gambar atau teks pada infografis', 'warning');
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
          subject_id: targetSubjectObj?.id || null,
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
          handlePublishSuccess(title.trim(), targetSubjectObj?.name || subject, 'Infografis');
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || 'Gagal menerbitkan infografis', 'error');
        }
      }
      // 5. ARTICLE MODE
      else if (materialFormat === 'ARTICLE') {
        if (!articleContent.trim()) {
          showToast('Isi naskah materi artikel wajib ditulis', 'warning');
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
          subject_id: targetSubjectObj?.id || null,
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
          handlePublishSuccess(title.trim(), targetSubjectObj?.name || subject, 'Artikel Teks');
        } else {
          const errData = await res.json().catch(() => null);
          showToast(errData?.error?.message || 'Gagal menerbitkan artikel', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`${styles.toast} ${toastMessage.type === 'error' ? styles.toastError : toastMessage.type === 'warning' ? styles.toastWarning : styles.toastSuccess}`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* YouTube Preview Modal */}
      {previewYtVideo && (
        <div className={styles.modalOverlay} onClick={() => setPreviewYtVideo(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Video size={16} color="#ef4444" />
                <span>Pratinjau Video YouTube</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewYtVideo(null)}
                className={styles.modalCloseBtn}
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${previewYtVideo.id}?autoplay=1`}
                title={previewYtVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <div className={styles.modalBody}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {previewYtVideo.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Channel: <strong>{previewYtVideo.channelTitle}</strong>
              </div>
              {previewYtVideo.description && (
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', maxHeight: '70px', overflowY: 'auto', lineHeight: 1.45 }}>
                  {previewYtVideo.description}
                </p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setPreviewYtVideo(null)}
                className={styles.btnSecondary}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleSelectYouTubeVideo(previewYtVideo)}
                className={styles.btnPrimary}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                <Check size={13} />
                <span>Gunakan Video Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/learning">Pembelajaran</Link>
        <span>/</span>
        <Link href="/dashboard/learning/materials">Modul Ajar</Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>Tambah Baru</span>
      </div>

      {/* Header Card */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <BookOpen size={18} />
          </div>
          <div className={styles.headerTextGroup}>
            <h1 className={styles.headerTitle}>Pusat Penerbitan Modul &amp; Materi Pembelajaran</h1>
            <p className={styles.headerSubtitle}>
              Katalog resmi SIBI Kemdikdasmen, Video YouTube terintegrasi, Infografis interaktif, dan Artikel naskah untuk siswa.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link href="/dashboard/learning/materials" className={styles.btnSecondary}>
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={styles.btnPrimary}
          >
            {isSubmitting ? (
              <>
                <span style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Publikasikan Modul</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── FORMAT SELECTION BAR (4 CORE LMS FORMATS) ── */}
      <div className={styles.formatBar}>
        <button
          type="button"
          onClick={() => setMaterialFormat('PDF')}
          className={`${styles.formatBtn} ${materialFormat === 'PDF' ? styles.formatBtnPdfActive : ''}`}
        >
          <FileText size={15} />
          <span>Modul Dokumen / PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setMaterialFormat('VIDEO')}
          className={`${styles.formatBtn} ${materialFormat === 'VIDEO' ? styles.formatBtnVideoActive : ''}`}
        >
          <Video size={15} />
          <span>Video YouTube</span>
        </button>

        <button
          type="button"
          onClick={() => setMaterialFormat('INFOGRAPHIC')}
          className={`${styles.formatBtn} ${materialFormat === 'INFOGRAPHIC' ? styles.formatBtnInfographicActive : ''}`}
        >
          <Layers size={15} />
          <span>Infografis Interaktif</span>
        </button>

        <button
          type="button"
          onClick={() => setMaterialFormat('ARTICLE')}
          className={`${styles.formatBtn} ${materialFormat === 'ARTICLE' ? styles.formatBtnArticleActive : ''}`}
        >
          <BookOpen size={15} />
          <span>Artikel &amp; Bacaan</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className={styles.workspaceGrid}>
        
        {/* LEFT COLUMN: Dedicated Workspace per Selected Format */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* FORMAT 1: MODUL DOKUMEN / PDF */}
          {materialFormat === 'PDF' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <h2 className={styles.cardTitle}>
                    <FileText size={16} color="#0284c7" />
                    <span>Sumber Materi Dokumen PDF</span>
                  </h2>
                  <p className={styles.cardSubtitle}>
                    Pilih apakah materi bersumber dari katalog buku resmi SIBI Kemdikdasmen atau berkas PDF yang Anda unggah mandiri.
                  </p>
                </div>
              </div>

              {/* Sub-source Toggle */}
              <div className={styles.subToggleBar}>
                <button
                  type="button"
                  onClick={() => setPdfSourceMode('SIBI')}
                  className={`${styles.subToggleBtn} ${pdfSourceMode === 'SIBI' ? styles.subToggleBtnActive : ''}`}
                >
                  <BookOpen size={14} />
                  <span>Katalog Buku SIBI ({libraryBooks.length} Buku Resmi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPdfSourceMode('UPLOAD')}
                  className={`${styles.subToggleBtn} ${pdfSourceMode === 'UPLOAD' ? styles.subToggleBtnActive : ''}`}
                >
                  <UploadCloud size={14} />
                  <span>Upload Berkas PDF Mandiri</span>
                </button>
              </div>

              {/* SUB-FLOW A: KATALOG BUKU SIBI */}
              {pdfSourceMode === 'SIBI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className={styles.infoBanner}>
                    <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    <span><strong>Buku SIBI Resmi Terpilih:</strong> Pengunggahan berkas tidak diperlukan. Judul &amp; deskripsi terisi otomatis dari metadata buku resmi.</span>
                  </div>

                  {/* Filters */}
                  <div className={styles.filterRow}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Cari judul buku, mapel, atau pengarang..."
                        value={bookSearchQuery}
                        onChange={e => setBookSearchQuery(e.target.value)}
                        className={styles.inputField}
                        style={{ paddingLeft: '2rem' }}
                      />
                      <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>

                    <select
                      value={selectedSubjectFilter}
                      onChange={e => setSelectedSubjectFilter(e.target.value)}
                      className={styles.inputField}
                    >
                      <option value="ALL">Semua Mapel</option>
                      {bookSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <select
                      value={selectedGradeFilter}
                      onChange={e => setSelectedGradeFilter(e.target.value)}
                      className={styles.inputField}
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
                  <div className={styles.bookGrid}>
                    {filteredBooks.length > 0 ? (
                      filteredBooks.map((book: LibraryBook) => {
                        const isSelected = currentBook?.id === book.id;
                        return (
                          <div
                            key={book.id}
                            onClick={() => handleSelectBook(book)}
                            className={`${styles.bookCard} ${isSelected ? styles.bookCardSelected : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <Book size={16} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                              <span className={`${styles.bookGradeBadge} ${isSelected ? styles.bookGradeBadgeActive : ''}`}>
                                {book.grade_level_name || 'Buku Teks'}
                              </span>
                            </div>

                            <div className={styles.bookTitle}>
                              {book.title}
                            </div>

                            <div className={styles.bookMeta}>
                              <div>{book.subject_name || 'Mata Pelajaran Umum'}</div>
                              <div>{book.publisher || 'Kemendikbudristek'} • {book.total_pages || 100} Hal.</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-light)' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isSelected ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {isSelected ? (
                                  <>
                                    <Check size={12} />
                                    <span>Terpilih</span>
                                  </>
                                ) : (
                                  <span>Pilih Buku</span>
                                )}
                              </span>
                              {book.file_url && (
                                <a
                                  href={book.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                                >
                                  <span>Buka</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ gridColumn: '1 / -1', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Tidak ada buku yang cocok dengan kata kunci &quot;{bookSearchQuery}&quot;.
                      </div>
                    )}
                  </div>

                  {/* Selected Book Confirmation & Page Range Config */}
                  {currentBook && (
                    <div className={styles.selectedBookBanner}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <BookOpen size={18} color="#0284c7" />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0369a1' }}>
                              Buku Terpilih: {currentBook.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>
                              {currentBook.publisher || 'Kemendikbudristek'} • Total {currentBook.total_pages || 100} Halaman
                            </div>
                          </div>
                        </div>
                        {currentBook.file_url && (
                          <a
                            href={currentBook.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.btnSecondary} ${styles.btnSm}`}
                          >
                            <span>Baca Isi Buku</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      <div className={styles.pageRangeRow}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1' }}>
                          Rentang Halaman Materi Wajib:
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>Dari Hal.</span>
                          <input
                            type="number"
                            min={1}
                            max={currentBook.total_pages || 500}
                            value={bookStartPage}
                            onChange={e => handlePageChange(Math.max(1, parseInt(e.target.value) || 1), bookEndPage)}
                            className={styles.inputField}
                            style={{ width: '65px', height: '28px', fontSize: '0.76rem', fontWeight: 800, textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>Sampai Hal.</span>
                          <input
                            type="number"
                            min={bookStartPage}
                            max={currentBook.total_pages || 500}
                            value={bookEndPage}
                            onChange={e => handlePageChange(bookStartPage, Math.max(bookStartPage, parseInt(e.target.value) || 1))}
                            className={styles.inputField}
                            style={{ width: '65px', height: '28px', fontSize: '0.76rem', fontWeight: 800, textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.7rem', color: '#0284c7' }}>
                            (Total {Math.max(1, bookEndPage - bookStartPage + 1)} Halaman)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-FLOW B: UPLOAD BERKAS PDF MANDIRI */}
              {pdfSourceMode === 'UPLOAD' && (
                <div className={styles.uploadDropzone}>
                  <UploadCloud size={32} color="var(--accent)" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {selectedPdfFile ? selectedPdfFile.name : 'Pilih Berkas PDF Dokumen Pembelajaran'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Mendukung handout materi, slide presentasi, atau ringkasan guru (Maks. 25 MB).
                    </div>
                  </div>

                  <label className={styles.btnPrimary} style={{ cursor: 'pointer' }}>
                    <span>{selectedPdfFile ? 'Ganti Berkas PDF' : 'Pilih Berkas PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {selectedPdfFile && (
                    <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>Berkas siap diunggah saat formulir diterbitkan.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FORMAT 2: VIDEO YOUTUBE */}
          {materialFormat === 'VIDEO' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <h2 className={styles.cardTitle}>
                    <Video size={16} color="#dc2626" />
                    <span>Integrasi YouTube Data API v3</span>
                  </h2>
                  <p className={styles.cardSubtitle}>
                    Cari video pembelajaran langsung tanpa keluar aplikasi. Pratinjau langsung untuk mengisi judul &amp; deskripsi secara otomatis.
                  </p>
                </div>
              </div>

              {/* YouTube Search Bar */}
              <form onSubmit={handleSearchYouTube} style={{ display: 'flex', gap: '0.45rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Ketik topik materi (contoh: Hukum Newton Fisika Kelas 10)..."
                    value={ytSearchQuery}
                    onChange={e => setYtSearchQuery(e.target.value)}
                    className={styles.inputField}
                    style={{ paddingLeft: '2rem' }}
                  />
                  <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingYt}
                  className={styles.btnPrimary}
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                >
                  {isSearchingYt ? (
                    <>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <Search size={13} />
                      <span>Cari Video</span>
                    </>
                  )}
                </button>
              </form>

              {/* Selected Video Pill */}
              {selectedYtVideo && (
                <div style={{
                  background: 'rgba(220, 38, 38, 0.05)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '9px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '220px' }}>
                    {selectedYtVideo.thumbnailUrl && (
                      <img
                        src={selectedYtVideo.thumbnailUrl}
                        alt=""
                        style={{ width: '70px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(220, 38, 38, 0.2)' }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} />
                        <span>Video Terpilih Untuk Materi Siswa</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {selectedYtVideo.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Channel: {selectedYtVideo.channelTitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewYtVideo(selectedYtVideo)}
                      className={`${styles.btnSecondary} ${styles.btnSm}`}
                    >
                      <Play size={11} />
                      <span>Putar Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedYtVideo(null)}
                      className={`${styles.btnSecondary} ${styles.btnSm}`}
                      style={{ color: '#dc2626' }}
                    >
                      Ganti Video
                    </button>
                  </div>
                </div>
              )}

              {/* Search Results Grid */}
              {ytSearchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Hasil Pencarian YouTube Data API ({ytSearchResults.length} Video):
                  </div>

                  <div className={styles.videoGrid}>
                    {ytSearchResults.map(video => (
                      <div key={video.id} className={styles.videoCard}>
                        <div
                          onClick={() => setPreviewYtVideo(video)}
                          className={styles.videoThumbnailBox}
                        >
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className={styles.videoThumbnailImg}
                          />
                          <div className={styles.videoPlayOverlay}>
                            <span style={{
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Play size={14} fill="#fff" />
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.76rem', color: 'var(--text-primary)', lineHeight: 1.3, minHeight: '2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {video.title}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Channel: {video.channelTitle}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.45rem', borderTop: '1px solid var(--border-light)' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewYtVideo(video)}
                              className={`${styles.btnSecondary} ${styles.btnSm}`}
                              style={{ justifyContent: 'center' }}
                            >
                              Pratinjau
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectYouTubeVideo(video)}
                              className={`${styles.btnPrimary} ${styles.btnSm}`}
                              style={{ background: '#dc2626', borderColor: '#dc2626', justifyContent: 'center' }}
                            >
                              Pilih Video
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual URL fallback */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem' }}>
                <details style={{ fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Opsi Manual: Masukkan Tautan YouTube URL langsung
                  </summary>
                  <div style={{ marginTop: '0.45rem' }}>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* FORMAT 3: INFOGRAFIS INTERAKTIF */}
          {materialFormat === 'INFOGRAPHIC' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <h2 className={styles.cardTitle}>
                    <Layers size={16} color="#7c3aed" />
                    <span>Penyusun Lembar Infografis &amp; Visual</span>
                  </h2>
                  <p className={styles.cardSubtitle}>
                    Susun materi berupa rangkaian gambar dan paragraf penjelasan layaknya kanvas visual ringkas.
                  </p>
                </div>

                {/* Edit vs Preview Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => setInfographicTab('EDIT')}
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    style={{
                      border: 'none',
                      background: infographicTab === 'EDIT' ? '#7c3aed' : 'transparent',
                      color: infographicTab === 'EDIT' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    <Edit3 size={12} />
                    <span>Editor Blok</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfographicTab('PREVIEW')}
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    style={{
                      border: 'none',
                      background: infographicTab === 'PREVIEW' ? '#7c3aed' : 'transparent',
                      color: infographicTab === 'PREVIEW' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    <Eye size={12} />
                    <span>Pratinjau Kanvas</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: BLOCK EDITOR */}
              {infographicTab === 'EDIT' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {infographicBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '9px',
                        padding: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: block.type === 'IMAGE' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                          color: block.type === 'IMAGE' ? '#7c3aed' : '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {block.type === 'IMAGE' ? <ImageIcon size={12} /> : <FileText size={12} />}
                          <span>{block.type === 'IMAGE' ? `Gambar Visual #${index + 1}` : `Teks Penjelasan #${index + 1}`}</span>
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => moveInfographicBlock(index, 'UP')}
                            disabled={index === 0}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '5px',
                              width: '24px',
                              height: '24px',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            aria-label="Geser ke atas"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveInfographicBlock(index, 'DOWN')}
                            disabled={index === infographicBlocks.length - 1}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '5px',
                              width: '24px',
                              height: '24px',
                              cursor: index === infographicBlocks.length - 1 ? 'not-allowed' : 'pointer',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            aria-label="Geser ke bawah"
                          >
                            <ChevronDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeInfographicBlock(block.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '5px',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            aria-label="Hapus blok"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {block.type === 'IMAGE' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            <input
                              type="url"
                              placeholder="Tempelkan URL Gambar Infografis (https://...)..."
                              value={block.content}
                              onChange={e => updateInfographicBlock(block.id, e.target.value)}
                              className={styles.inputField}
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => handlePasteClipboardToBlock(block.id)}
                              className={`${styles.btnSecondary} ${styles.btnSm}`}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <Clipboard size={11} />
                              <span>Tempel URL</span>
                            </button>
                          </div>

                          {block.content && (
                            <div style={{
                              maxHeight: '180px',
                              overflow: 'hidden',
                              borderRadius: '8px',
                              border: '1px solid var(--border-light)',
                              background: '#000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img
                                src={block.content}
                                alt="Preview Infografis"
                                style={{ maxHeight: '180px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                                onError={(e) => { (e.target as any).style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <textarea
                            rows={3}
                            placeholder="Tuliskan keterangan bagan atau penjelasan materi..."
                            value={block.content}
                            onChange={e => updateInfographicBlock(block.id, e.target.value)}
                            className={styles.textareaField}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handlePasteClipboardToBlock(block.id)}
                              className={`${styles.btnSecondary} ${styles.btnSm}`}
                            >
                              <Clipboard size={11} />
                              <span>Tempel dari Papan Klip</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Block Action Bar */}
                  <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', paddingTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => addInfographicBlock('IMAGE')}
                      className={`${styles.btnSecondary} ${styles.btnSm}`}
                    >
                      <Plus size={13} />
                      <span>Tambah Gambar Visual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addInfographicBlock('TEXT')}
                      className={`${styles.btnSecondary} ${styles.btnSm}`}
                    >
                      <Plus size={13} />
                      <span>Tambah Paragraf Teks</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB 2: LIVE CANVAS PREVIEW */
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '9px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.55rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>
                      Pratinjau Lembar Interaktif Siswa
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {title || 'Judul Modul Infografis'}
                    </h3>
                  </div>

                  {infographicBlocks.map((block) => (
                    <div key={block.id}>
                      {block.type === 'IMAGE' && block.content && (
                        <div style={{
                          borderRadius: '8px',
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
                            style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      {block.type === 'TEXT' && block.content && (
                        <div style={{
                          background: 'var(--bg-card)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          border: '1px solid var(--border-light)',
                          fontSize: '0.8rem',
                          lineHeight: 1.55,
                          color: 'var(--text-primary)',
                          marginTop: '0.35rem'
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

          {/* FORMAT 4: ARTIKEL & BACAAN TEKS */}
          {materialFormat === 'ARTICLE' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <h2 className={styles.cardTitle}>
                    <BookOpen size={16} color="#059669" />
                    <span>Penyusun Artikel &amp; Ringkasan Materi</span>
                  </h2>
                  <p className={styles.cardSubtitle}>
                    Tuliskan naskah materi lengkap untuk dibaca siswa dengan tipografi nyaman di perangkat mobile.
                  </p>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => setArticleTab('EDIT')}
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    style={{
                      border: 'none',
                      background: articleTab === 'EDIT' ? '#059669' : 'transparent',
                      color: articleTab === 'EDIT' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    <Edit3 size={12} />
                    <span>Tulis Artikel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleTab('PREVIEW')}
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    style={{
                      border: 'none',
                      background: articleTab === 'PREVIEW' ? '#059669' : 'transparent',
                      color: articleTab === 'PREVIEW' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    <Eye size={12} />
                    <span>Pratinjau Bacaan</span>
                  </button>
                </div>
              </div>

              {articleTab === 'EDIT' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {articleContent.split(/\s+/).filter(Boolean).length} kata • ± {Math.max(1, Math.round(articleContent.split(/\s+/).filter(Boolean).length / 120))} menit baca
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteClipboardToArticle}
                      className={`${styles.btnSecondary} ${styles.btnSm}`}
                    >
                      <Clipboard size={11} />
                      <span>Tempel Naskah</span>
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    placeholder="Tuliskan naskah materi lengkap di sini, gunakan baris baru ganda untuk memisahkan antar paragraf pembahasan..."
                    value={articleContent}
                    onChange={e => setArticleContent(e.target.value)}
                    className={styles.textareaField}
                    style={{ fontSize: '0.8rem', lineHeight: 1.55 }}
                  />
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '9px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.55rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                      Pratinjau Mode Bacaan Siswa
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {title || 'Judul Artikel Pembelajaran'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {articleContent.split('\n\n').filter(Boolean).map((p, idx) => (
                      <p key={idx} style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-primary)', textAlign: 'justify' }}>
                        {p}
                      </p>
                    ))}
                    {!articleContent && (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem', fontSize: '0.76rem' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Sliders size={16} color="var(--accent)" />
                <span>Target Penugasan Siswa</span>
              </h3>
            </div>

            {/* Judul Modul */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Judul Modul Pembelajaran *</span>
                {((materialFormat === 'VIDEO' && selectedYtVideo) || (materialFormat === 'PDF' && pdfSourceMode === 'SIBI' && currentBook)) && (
                  <span className={styles.autoBadge}>Terisi Otomatis</span>
                )}
              </label>
              <input
                type="text"
                placeholder="Contoh: Modul Fisika Besaran dan Satuan"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={styles.inputField}
                style={{ fontWeight: 700 }}
              />
            </div>

            {/* Mata Pelajaran */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mata Pelajaran *</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className={styles.inputField}
              >
                {subjectsList.map(s => (
                  <option key={s.id || s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Target Rombel / Kelas */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rombel / Kelas Target *</label>
              <select
                value={targetGrade}
                onChange={e => setTargetGrade(e.target.value)}
                className={styles.inputField}
              >
                {classesList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Guru Pengampu */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Guru Pengampu *</label>
              {isTeacher && user?.full_name ? (
                <input
                  type="text"
                  disabled
                  value={user.full_name}
                  className={styles.inputField}
                  style={{ background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 700 }}
                />
              ) : (
                <select
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className={styles.inputField}
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.full_name}>{t.full_name} ({t.nip || 'Guru'})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Petunjuk / Instruksi Pembelajaran */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Petunjuk / Instruksi Pembelajaran</span>
                {((materialFormat === 'VIDEO' && selectedYtVideo) || (materialFormat === 'PDF' && pdfSourceMode === 'SIBI' && currentBook)) && (
                  <span className={styles.autoBadge}>Terisi Otomatis</span>
                )}
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Silakan pelajari bab ini sebelum mengikuti kuis mingguan."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={styles.textareaField}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={styles.btnPrimary}
                style={{ width: '100%', height: '38px', justifyContent: 'center' }}
              >
                {isSubmitting ? (
                  <span>Menerbitkan...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Terbitkan Modul Sekarang</span>
                  </>
                )}
              </button>

              <Link
                href="/dashboard/learning/materials"
                className={styles.btnSecondary}
                style={{ width: '100%', height: '34px', justifyContent: 'center' }}
              >
                Batal &amp; Kembali
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Post-Publish Prompt Modal: Automated Assignment & Quiz Option */}
      {publishedPrompt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '480px', textAlign: 'center', padding: '1.25rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(5, 150, 105, 0.12)',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem'
            }}>
              <CheckCircle2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
              Materi Berhasil Diterbitkan
            </h3>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Materi <strong>&quot;{publishedPrompt.title}&quot;</strong> ({publishedPrompt.subjectName}) telah aktif dan dapat dibaca oleh siswa. Ingin langsung membuatkan tugas atau kuis otomatis dari materi ini?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/learning/assignments/create?autoGenerate=true&sourceSubject=${encodeURIComponent(
                      publishedPrompt.subjectName
                    )}&sourceTitle=${encodeURIComponent(publishedPrompt.title)}`
                  )
                }
                className={styles.btnPrimary}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  borderColor: '#2563eb',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={14} />
                <span>Buat Tugas Otomatis (PG &amp; Essay)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/learning/quizzes/create?autoGenerate=true&sourceSubject=${encodeURIComponent(
                      publishedPrompt.subjectName
                    )}&sourceTitle=${encodeURIComponent(publishedPrompt.title)}`
                  )
                }
                className={styles.btnPrimary}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #d97706, #ea580c)',
                  borderColor: '#d97706',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={14} />
                <span>Buat Kuis / Ujian CBT Otomatis</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard/learning/materials')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Nanti Saja (Kembali ke Daftar Materi)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
