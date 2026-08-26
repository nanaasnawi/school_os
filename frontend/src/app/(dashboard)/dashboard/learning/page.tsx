'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './learning.module.css';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';

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

const INITIAL_MATERIALS: MaterialItem[] = [];

export default function LearningPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Memuat Portal Modul &amp; Silabus...</div>}>
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
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(classParam || 'ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(subjectParam || 'ALL');
  
  // Teachers, Classes, and Subjects for dropdowns
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Sync query params when URL changes
  useEffect(() => {
    if (classParam) setSelectedClassFilter(classParam);
    if (subjectParam) setSelectedSubjectFilter(subjectParam);
  }, [classParam, subjectParam]);

  // Modal Input Materi State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    className: classParam || 'PAKET A4',
    subjectName: subjectParam || 'Pendidikan Agama Islam dan Budi Pekerti',
    teacherName: 'EHA MEIDA KARTIKA',
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
        const [teacherRes, classRes, subjectRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          fetch('/api/v1/academic/subjects', {
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
      showToast(`📄 File PDF "${file.name}" terpilih dari perangkat!`);
    }
  };

  // Image File Upload Handler
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setNewMaterial(prev => ({ ...prev, imagePreviewUrl: imageUrl }));
      showToast(`🖼️ Gambar penjelas "${file.name}" terpilih dari perangkat!`);
    }
  };

  const handlePublishMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.chapterTitle) return;

    if (newMaterial.contentType === 'VIDEO' && !newMaterial.youtubeUrl) {
      showToast('⚠️ Mohon masukkan link URL YouTube video pembelajaran!');
      return;
    }
    if (newMaterial.contentType === 'PDF' && !newMaterial.pdfFileName) {
      showToast('⚠️ Mohon pilih file PDF dari perangkat!');
      return;
    }

    const item: MaterialItem = {
      id: `mat-${Date.now()}`,
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

    setMaterials([item, ...materials]);
    setShowAddModal(false);
    showToast(`✓ Materi "${newMaterial.chapterTitle}" dipublish ke Android App Siswa Rombel ${newMaterial.className}!`);
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
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Manajemen Modul &amp; Silabus Guru</h1>
          <p className={styles.subtitle}>Portal penginputan materi oleh guru &amp; pemantauan kurikulum digital sekolah</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/subjects" className="btn btn-secondary btn-sm">
            📅 Plotting Jadwal Rombel
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (selectedClassFilter !== 'ALL') setNewMaterial(prev => ({ ...prev, className: selectedClassFilter }));
            if (selectedSubjectFilter !== 'ALL') setNewMaterial(prev => ({ ...prev, subjectName: selectedSubjectFilter }));
            setShowAddModal(true);
          }}>
            + Buat &amp; Upload Materi Baru
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
            <span>🏫 Filter Aktif Rombel: <strong>{selectedClassFilter}</strong></span>
            {selectedSubjectFilter !== 'ALL' && <span>| Mapel: <strong>{selectedSubjectFilter}</strong></span>}
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ color: '#a5b4fc', fontSize: '0.78rem' }}
            onClick={() => { setSelectedClassFilter('ALL'); setSelectedSubjectFilter('ALL'); }}
          >
            ✕ Reset Filter
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
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>👁️ Mode Pandang:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: '8px' }}>
            <button
              className={`btn btn-sm ${viewRole === 'teacher' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setViewRole('teacher')}
            >
              🏫 Guru Workspace (Upload Materi)
            </button>
            <button
              className={`btn btn-sm ${viewRole === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setViewRole('admin')}
            >
              ⚙️ Admin &amp; Kepsek (Pantau Materi Rombel)
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Rombel:</span>
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
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
              onChange={e => setSelectedSubjectFilter(e.target.value)}
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
            <div key={m.id} className={styles.card} style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={styles.cardBadge}>{m.className} · {m.subjectName}</span>
                <span className={`badge ${m.contentType === 'PDF' ? 'badge-info' : m.contentType === 'VIDEO' ? 'badge-warning' : 'badge-active'}`}>
                  {m.contentType === 'VIDEO' ? '🎥 YouTube' : m.contentType === 'PDF' ? '📄 PDF' : '📝 Teks &amp; Gambar'}
                </span>
              </div>

              {m.imagePreviewUrl && (
                <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', marginTop: '0.5rem' }}>
                  <img src={m.imagePreviewUrl} alt="Illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div>
                <h2 className={styles.cardTitle} style={{ fontSize: '0.95rem', lineHeight: 1.35, marginTop: '0.2rem' }}>{m.chapterTitle}</h2>
                <p className={styles.cardSub} style={{ marginTop: '0.25rem' }}>Guru Pengampu: <strong>{m.teacherName}</strong></p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.4 }}>
                  {m.description}
                </p>

                {m.youtubeUrl && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>▶️ YouTube Link:</span>
                    <span style={{ fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>{m.youtubeUrl}</span>
                  </div>
                )}

                {m.pdfFileName && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>📄 File PDF:</span>
                    <span style={{ fontFamily: 'monospace' }}>{m.pdfFileName}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter} style={{ paddingTop: '0.6rem', borderTop: '1px solid var(--border-dim)' }}>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                  📱 Android App Synced ✓
                </span>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', color: '#2563eb' }}
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
          gap: '1rem'
        }}>
          <div style={{ fontSize: '2.5rem' }}>📚</div>
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
            + Upload &amp; Publish Materi Pertama
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
                🏫 Publish Materi Pembelajaran ke Android App Siswa
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
                    {teachers.map((t: any) => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
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
                    onChange={e => setNewMaterial({ ...newMaterial, contentType: e.target.value as any })}
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
                      📄 Form Upload Dokumen PDF / Modul:
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
                        ✓ File Siap: {newMaterial.pdfFileName}
                      </div>
                    )}
                  </div>
                )}

                {newMaterial.contentType === 'VIDEO' && (
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px dashed #eab308' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ca8a04', display: 'block', marginBottom: '0.4rem' }}>
                      🎥 Form Embed Video YouTube Pembelajaran:
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
                      🖼️ Upload Gambar Penjelas Modul (Opsional):
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
                <button type="submit" className="btn btn-primary">🚀 Publish ke Android App Siswa</button>
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
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{previewMaterial.pdfFileName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dokumen Modul PDF Digital</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => showToast('📥 File PDF simulasi berhasil diunduh!')}>Unduh PDF</button>
                </div>
              )}

              {previewMaterial.youtubeUrl && (
                <div style={{ background: '#000000', borderRadius: '10px', overflow: 'hidden', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  🎥 YouTube Video Player ({previewMaterial.youtubeUrl})
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
