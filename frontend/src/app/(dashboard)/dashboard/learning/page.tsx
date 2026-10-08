'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './learning.module.css';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { Calendar, School, X, Eye, BookOpen, Settings, FileText, Video, UploadCloud, CheckCircle2, AlertCircle, Image as ImageIcon, Send } from 'lucide-react';

type MaterialItem = {
  id: string;
  className: string;
  subjectName: string;
  teacherName: string;
  chapterTitle: string;
  contentType: 'PDF' | 'VIDEO' | 'TEXT';
  description: string;
  topics: string;
  youtubeUrl?: string;
  pdfFileName?: string;
  imagePreviewUrl?: string;
  publishedAt: string;
  androidSynced: boolean;
};

interface TeacherItem {
  id: string;
  full_name: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id?: string;
  code?: string;
  name: string;
}

const INITIAL_MATERIALS: MaterialItem[] = [];

export default function LearningPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Memuat Portal Modul & Silabus...</div>}>
      <LearningPageContent />
    </Suspense>
  );
}

function LearningPageContent() {
  const searchParams = useSearchParams();
  const classParam = searchParams.get('class');
  const subjectParam = searchParams.get('subject');

  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [viewRole, setViewRole] = useState<'teacher' | 'admin'>('teacher');
  const [userClassFilter, setUserClassFilter] = useState<string | null>(null);
  const [userSubjectFilter, setUserSubjectFilter] = useState<string | null>(null);

  const selectedClassFilter = userClassFilter ?? classParam ?? 'ALL';
  const selectedSubjectFilter = userSubjectFilter ?? subjectParam ?? 'ALL';
  
  // Teachers, Classes, and Subjects for dropdowns
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);

  // Modal Input Materi State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    className: classParam || '',
    subjectName: subjectParam || '',
    teacherName: '',
    chapterTitle: '',
    contentType: 'PDF' as 'PDF' | 'VIDEO' | 'TEXT',
    description: '',
    topics: '',
    youtubeUrl: '',
    pdfFileName: '',
    imagePreviewUrl: '',
  });

  // Selected Material Preview Modal
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
        const [teacherRes, classRes, subjectRes, materialsRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } }).catch(() => null),
          listClasses({ query: { page_size: 100 } }).catch(() => null),
          fetch('/api/v1/academic/subjects', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/v1/learning/materials', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (list.length > 0) {
            setNewMaterial(prev => ({ ...prev, teacherName: list[0].full_name }));
          }
        }

        if (classRes?.data?.data) {
          const allRombels = classRes.data.data;
          setClassesList(allRombels);
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
        }

        if (materialsRes?.data && Array.isArray(materialsRes.data)) {
          const mapped: MaterialItem[] = materialsRes.data.map((m: Record<string, unknown>) => {
            const desc = String(m.description || '');
            const title = String(m.title || '');
            const hasBullet = desc.includes(' • ');
            const descParts = hasBullet ? desc.split(' • ') : [];

            // Detect format cleanly
            const externalUrl = m.external_url ? String(m.external_url) : '';
            const storageKey = m.storage_key ? String(m.storage_key) : '';
            const rawType = String(m.material_type || '').toLowerCase();
            const isVideo = rawType === 'video' || externalUrl.includes('youtube.com') || externalUrl.includes('youtu.be');
            const isPdf = rawType === 'pdf' || rawType === 'document' || externalUrl.toLowerCase().endsWith('.pdf') || externalUrl.includes('static-sc.cloudapp') || Boolean(storageKey);
            const contentType: 'PDF' | 'VIDEO' | 'TEXT' = isVideo ? 'VIDEO' : isPdf ? 'PDF' : 'TEXT';

            // Clean subject name (never let it be a 200-char paragraph)
            let subjectName = String(m.subject_name || (hasBullet ? descParts[0] : ''));
            if (!subjectName || subjectName.length > 35) {
              const textLower = `${title} ${desc}`.toLowerCase();
              if (textLower.includes('bahasa indonesia')) subjectName = 'Bahasa Indonesia';
              else if (textLower.includes('bahasa inggris')) subjectName = 'Bahasa Inggris';
              else if (textLower.includes('matematika')) subjectName = 'Matematika';
              else if (textLower.includes('agama islam') || textLower.includes('pai')) subjectName = 'Pendidikan Agama Islam';
              else if (textLower.includes('ipas') || textLower.includes('ipa')) subjectName = 'IPAS';
              else if (textLower.includes('ips')) subjectName = 'IPS';
              else if (textLower.includes('ppkn') || textLower.includes('pancasila')) subjectName = 'Pendidikan Pancasila';
              else if (textLower.includes('pjok') || textLower.includes('jasmani')) subjectName = 'PJOK';
              else if (textLower.includes('seni')) subjectName = 'Seni Budaya';
              else subjectName = 'Pelajaran Umum';
            }

            // Clean class name
            let className = String(m.class_name || (hasBullet && descParts.length > 1 ? descParts[1] : ''));
            if (!className || className.length > 25) {
              const textLower = `${title} ${desc}`.toLowerCase();
              const classMatch = textLower.match(/kelas\s+([0-9ivx]+)/i);
              if (classMatch) {
                className = `Kelas ${classMatch[1].toUpperCase()}`;
              } else if (textLower.includes('paket a')) {
                className = 'Paket A';
              } else if (textLower.includes('paket b')) {
                className = 'Paket B';
              } else if (textLower.includes('paket c')) {
                className = 'Paket C';
              } else {
                className = 'Semua Rombel';
              }
            }

            // Clean teacher / author name
            let teacherName = String(m.teacher_name || (hasBullet && descParts.length > 2 ? descParts[2] : ''));
            if (!teacherName || teacherName.toLowerCase() === 'guru pengampu' || teacherName.length > 40) {
              const authorMatch = desc.match(/oleh\s+([^.]+)/i);
              if (authorMatch && authorMatch[1].trim().length < 40) {
                teacherName = authorMatch[1].trim();
              } else {
                teacherName = 'Tim Guru Terpadu';
              }
            }

            // Clean description
            let cleanDesc = hasBullet && descParts.length > 3 ? descParts.slice(3).join(' • ') : desc;
            if (cleanDesc.length > 160) {
              cleanDesc = cleanDesc.slice(0, 155) + '...';
            }

            return {
              id: String(m.id),
              className,
              subjectName,
              teacherName,
              chapterTitle: title,
              contentType,
              description: cleanDesc || 'Modul & materi pembelajaran digital siswa.',
              topics: 'Pembelajaran Rombel',
              youtubeUrl: isVideo ? externalUrl : undefined,
              pdfFileName: isPdf ? (storageKey || (externalUrl ? externalUrl.split('/').pop()?.split('?')[0] : 'Buku_Kurikulum.pdf')) : undefined,
              imagePreviewUrl: '',
              publishedAt: m.created_at ? new Date(String(m.created_at)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari ini',
              androidSynced: true,
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

  // PDF File Upload Handler
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMaterial(prev => ({ ...prev, pdfFileName: file.name }));
      showToast(`File PDF "${file.name}" terpilih dari perangkat!`);
    }
  };

  // Image File Upload Handler
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setNewMaterial(prev => ({ ...prev, imagePreviewUrl: imageUrl }));
      showToast(`Gambar penjelas "${file.name}" terpilih dari perangkat!`);
    }
  };

  const handlePublishMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.chapterTitle) return;

    if (newMaterial.contentType === 'VIDEO' && !newMaterial.youtubeUrl) {
      showToast('Mohon masukkan link URL YouTube video pembelajaran!');
      return;
    }
    if (newMaterial.contentType === 'PDF' && !newMaterial.pdfFileName) {
      showToast('Mohon pilih file PDF dari perangkat!');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const payload = {
        material_type: newMaterial.contentType.toLowerCase(),
        title: newMaterial.chapterTitle,
        description: `${newMaterial.subjectName} • ${newMaterial.className} • ${newMaterial.teacherName} • ${newMaterial.description || 'Modul Pelajaran'}`,
        storage_key: newMaterial.contentType === 'PDF' ? newMaterial.pdfFileName : null,
        external_url: newMaterial.contentType === 'VIDEO' ? newMaterial.youtubeUrl : null,
        order_index: 0,
        visibility: 'published',
      };

      const res = await fetch('/api/v1/learning/materials', {
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
          className: newMaterial.className,
          subjectName: newMaterial.subjectName,
          teacherName: newMaterial.teacherName,
          chapterTitle: newMaterial.chapterTitle,
          contentType: newMaterial.contentType,
          description: newMaterial.description || 'Modul & materi pembelajaran digital siswa.',
          topics: newMaterial.topics || 'Pembelajaran Rombel',
          youtubeUrl: newMaterial.youtubeUrl,
          pdfFileName: newMaterial.pdfFileName,
          imagePreviewUrl: newMaterial.imagePreviewUrl,
          publishedAt: 'Hari ini',
          androidSynced: true,
        };

        setMaterials(prev => [item, ...prev]);
        setShowAddModal(false);
        showToast(`Materi "${newMaterial.chapterTitle}" dipublish ke Android App Siswa Rombel ${newMaterial.className}!`);
      } else {
        showToast('Gagal mempublish materi');
      }
    } catch {
      showToast('Terjadi kendala koneksi');
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
    showToast('Berkas PDF berhasil diunduh ke perangkat');
  };

  const filteredMaterials = materials.filter(m => {
    const matchClass = selectedClassFilter === 'ALL' || m.className === selectedClassFilter;
    const matchSubject = selectedSubjectFilter === 'ALL' || m.subjectName === selectedSubjectFilter;
    return matchClass && matchSubject;
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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Manajemen Modul & Silabus Guru</h1>
          <p className={styles.subtitle}>Portal penginputan materi oleh guru & pemantauan kurikulum digital sekolah</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/subjects" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            <span>Plotting Jadwal Rombel</span>
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (selectedClassFilter !== 'ALL') setNewMaterial(prev => ({ ...prev, className: selectedClassFilter }));
            if (selectedSubjectFilter !== 'ALL') setNewMaterial(prev => ({ ...prev, subjectName: selectedSubjectFilter }));
            setShowAddModal(true);
          }}>
            + Buat & Upload Materi Baru
          </button>
        </div>
      </div>

      {/* Filter Active Notification Banner */}
      {(selectedClassFilter !== 'ALL' || selectedSubjectFilter !== 'ALL') && (
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          border: '1px solid #6366f1',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><School size={14} /> Filter Aktif Rombel: <strong>{selectedClassFilter}</strong></span>
            {selectedSubjectFilter !== 'ALL' && <span>| Mapel: <strong>{selectedSubjectFilter}</strong></span>}
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ color: '#a5b4fc', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            onClick={() => { setUserClassFilter('ALL'); setUserSubjectFilter('ALL'); }}
          >
            <X size={12} />
            <span>Reset Filter</span>
          </button>
        </div>
      )}

      {/* View Switcher (Guru Workspace vs Admin Monitor) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-dim)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={13} /> Mode Pandang:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: '8px' }}>
            <button
              className={`btn btn-sm ${viewRole === 'teacher' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setViewRole('teacher')}
            >
              Guru Workspace (Upload Materi)
            </button>
            <button
              className={`btn btn-sm ${viewRole === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setViewRole('admin')}
            >
              Admin &amp; Kepsek (Pantau Materi Rombel)
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Rombel:</span>
            <select
              value={selectedClassFilter}
              onChange={e => setUserClassFilter(e.target.value)}
              className="input"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: '140px' }}
            >
              <option value="ALL">Semua Rombel</option>
              {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mata Pelajaran:</span>
            <select
              value={selectedSubjectFilter}
              onChange={e => setUserSubjectFilter(e.target.value)}
              className="input"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: '180px' }}
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {subjectsList.map(s => <option key={s.id || s.code} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      {filteredMaterials.length > 0 ? (
        <div className={styles.gridThree}>
          {filteredMaterials.map(m => (
            <div key={m.id} className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span className={styles.cardBadge} title={`${m.className} · ${m.subjectName}`}>
                  {m.className} · {m.subjectName}
                </span>
                <span className={`badge ${m.contentType === 'PDF' ? 'badge-info' : m.contentType === 'VIDEO' ? 'badge-warning' : 'badge-active'}`}>
                  {m.contentType === 'VIDEO' ? 'Video' : m.contentType === 'PDF' ? 'Buku / PDF' : 'Modul Ajar'}
                </span>
              </div>

              {m.imagePreviewUrl && (
                <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', marginTop: '0.25rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.imagePreviewUrl} alt="Illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <h2 className={styles.cardTitle} title={m.chapterTitle}>
                  {m.chapterTitle}
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Guru: <strong style={{ color: 'var(--text-primary)' }}>{m.teacherName}</strong></span>
                </div>

                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.45,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  lineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {m.description}
                </p>

                {m.youtubeUrl && (
                  <div style={{
                    marginTop: '0.2rem',
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: '#dc2626',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Tonton Video YouTube</span>
                  </div>
                )}

                {m.pdfFileName && (
                  <div style={{
                    marginTop: '0.2rem',
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: '#2563eb',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Berkas Modul PDF ({m.pdfFileName})</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Tersinkron Mobile App</span>
                </span>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 700 }}
                  onClick={() => setPreviewMaterial(m)}
                >
                  Pratinjau Modul →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px dashed var(--border-dim)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <BookOpen size={36} color="var(--accent)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              Belum Ada Modul Materi untuk {selectedClassFilter !== 'ALL' ? selectedClassFilter : 'Rombel Ini'}
            </h3>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selectedSubjectFilter !== 'ALL' 
                ? `Mata Pelajaran: ${selectedSubjectFilter}`
                : 'Belum ada materi pembelajaran yang di-upload oleh guru untuk rombel ini.'}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setNewMaterial(prev => ({
                ...prev,
                className: selectedClassFilter !== 'ALL' ? selectedClassFilter : prev.className,
                subjectName: selectedSubjectFilter !== 'ALL' ? selectedSubjectFilter : prev.subjectName,
              }));
              setShowAddModal(true);
            }}
          >
            + Upload & Publish Materi Pertama
          </button>
        </div>
      )}

      {/* ── Modal In-Page: Form Input Materi Pembelajaran Baru ── */}
      {showAddModal && (
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
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Publish Materi Pembelajaran ke Android App Siswa
              </h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handlePublishMaterial} style={{ overflowY: 'auto' }}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Select Rombel & Subject */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Rombel Target *</label>
                    <select
                      value={newMaterial.className}
                      onChange={e => setNewMaterial({ ...newMaterial, className: e.target.value })}
                      className="input"
                    >
                      {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Mata Pelajaran *</label>
                    <select
                      value={newMaterial.subjectName}
                      onChange={e => setNewMaterial({ ...newMaterial, subjectName: e.target.value })}
                      className="input"
                    >
                      {subjectsList.map(s => <option key={s.id || s.code} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Teacher Name */}
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Guru Pengampu *</label>
                  <select
                    value={newMaterial.teacherName}
                    onChange={e => setNewMaterial({ ...newMaterial, teacherName: e.target.value })}
                    className="input"
                  >
                    {teachers.map((t: TeacherItem) => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
                  </select>
                </div>

                {/* Chapter Title */}
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Judul Bab / Topik Materi *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: BAB 1: Al-Qur'an & Hadis Pilihan"
                    value={newMaterial.chapterTitle}
                    onChange={e => setNewMaterial({ ...newMaterial, chapterTitle: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Content Type Selection */}
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Tipe Format Materi *</label>
                  <select
                    value={newMaterial.contentType}
                    onChange={e => setNewMaterial({ ...newMaterial, contentType: e.target.value as MaterialItem['contentType'] })}
                    className="input"
                  >
                    <option value="PDF">Dokumen Modul PDF (Tombol Upload File)</option>
                    <option value="VIDEO">Video YouTube Pembelajaran (Link Embed URL)</option>
                    <option value="TEXT">Teks &amp; Gambar Penjelas (Modul Digital Direct)</option>
                  </select>
                </div>

                {/* Dynamic Content Inputs */}
                {newMaterial.contentType === 'PDF' && (
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px dashed #3b82f6' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563eb', display: 'block', marginBottom: '0.4rem' }}>
                      Form Upload Dokumen PDF / Modul:
                    </label>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                      Pilih File PDF dari Komputer / Perangkat *
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileSelect}
                      className="input"
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    />
                    {newMaterial.pdfFileName && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: '#16a34a', fontWeight: 700 }}>
                        File Siap: {newMaterial.pdfFileName}
                      </div>
                    )}
                  </div>
                )}

                {newMaterial.contentType === 'VIDEO' && (
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px dashed #eab308' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ca8a04', display: 'block', marginBottom: '0.4rem' }}>
                      Form Embed Video YouTube Pembelajaran:
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newMaterial.youtubeUrl}
                      onChange={e => setNewMaterial({ ...newMaterial, youtubeUrl: e.target.value })}
                      className="input"
                    />
                  </div>
                )}

                {newMaterial.contentType === 'TEXT' && (
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px dashed #22c55e' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#16a34a', display: 'block', marginBottom: '0.4rem' }}>
                      Upload Gambar Penjelas Modul (Opsional):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="input"
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    />
                  </div>
                )}

                {/* Description */}
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Deskripsi / Ringkasan Instruksi Materi *</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan ulasan ringkas materi dan petunjuk belajar untuk siswa di rombel ini..."
                    value={newMaterial.description}
                    onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="input"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Send size={13} />
                  <span>Publish ke Android App Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Pratinjau Modul Materi ── */}
      {previewMaterial && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setPreviewMaterial(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            border: '1px solid var(--border-light)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-info">{previewMaterial.className} · {previewMaterial.subjectName}</span>
                <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.1rem', fontWeight: 800 }}>{previewMaterial.chapterTitle}</h3>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setPreviewMaterial(null)}>×</button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Guru Pengampu:</strong> {previewMaterial.teacherName}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                {previewMaterial.description}
              </p>

              {previewMaterial.pdfFileName && (
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '10px', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="#2563eb" />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{previewMaterial.pdfFileName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dokumen Modul PDF Digital</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDownloadPdf(
                      previewMaterial.pdfFileName || 'Modul.pdf',
                      previewMaterial.chapterTitle,
                      previewMaterial.subjectName,
                      previewMaterial.teacherName,
                      previewMaterial.description
                    )}
                  >
                    Unduh PDF
                  </button>
                </div>
              )}

              {previewMaterial.youtubeUrl && (
                <div style={{ background: '#000000', borderRadius: '10px', overflow: 'hidden', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', gap: '6px' }}>
                  <Video size={16} />
                  <span>YouTube Video Player ({previewMaterial.youtubeUrl})</span>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-elevated)', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setPreviewMaterial(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
