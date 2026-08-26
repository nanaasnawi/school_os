'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';

type MaterialItem = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  author: string;
  format: 'PDF' | 'VIDEO' | 'TEXT';
  size: string;
  downloads: number;
  date: string;
  youtubeUrl?: string;
  pdfFileName?: string;
  imagePreviewUrl?: string;
  description?: string;
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

  // Modal Input State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    subject: 'Matematika (Umum)',
    grade: 'PAKET B8',
    author: 'EHA MEIDA KARTIKA',
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
            setNewMaterial(prev => ({ ...prev, author: list[0].full_name }));
          }
        }

        if (classRes?.data?.data) {
          const activeRombels = classRes.data.data.filter((c: any) => c.name.startsWith('PAKET'));
          setClassesList(activeRombels);
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) {
            setNewMaterial(prev => ({ ...prev, subject: subjectRes.data[0].name }));
          }
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
      setNewMaterial(prev => ({ ...prev, pdfFileName: file.name }));
      showToast(`📄 File PDF "${file.name}" terpilih dari perangkat!`);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setNewMaterial(prev => ({ ...prev, imagePreviewUrl: imageUrl }));
      showToast(`🖼️ Gambar penjelas "${file.name}" terpilih dari perangkat!`);
    }
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    if (newMaterial.format === 'VIDEO' && !newMaterial.youtubeUrl) {
      showToast('⚠️ Mohon masukkan link URL YouTube video pembelajaran!');
      return;
    }
    if (newMaterial.format === 'PDF' && !newMaterial.pdfFileName) {
      showToast('⚠️ Mohon pilih file PDF dari perangkat!');
      return;
    }

    const item: MaterialItem = {
      id: `mat-${Date.now()}`,
      title: newMaterial.title,
      subject: newMaterial.subject,
      grade: newMaterial.grade,
      author: newMaterial.author,
      format: newMaterial.format,
      size: newMaterial.format === 'VIDEO' ? '32.0 MB' : '2.1 MB',
      downloads: 0,
      date: 'Hari ini',
      youtubeUrl: newMaterial.youtubeUrl,
      pdfFileName: newMaterial.pdfFileName,
      imagePreviewUrl: newMaterial.imagePreviewUrl,
      description: newMaterial.description,
    };

    setMaterials([item, ...materials]);
    setShowAddModal(false);
    showToast(`✓ Modul "${newMaterial.title}" berhasil di-publish ke Android App Siswa!`);
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/dashboard/learning" className="btn btn-secondary btn-sm">
            ← Kembali ke Workspace
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
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
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>{m.author}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${m.format === 'PDF' ? 'badge-info' : m.format === 'VIDEO' ? 'badge-warning' : 'badge-active'}`}>
                        {m.format === 'VIDEO' ? '🎥 YouTube' : m.format === 'PDF' ? '📄 PDF' : '📝 Teks'}
                      </span>
                      {m.pdfFileName && <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>{m.pdfFileName}</div>}
                      {m.youtubeUrl && <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>Link YouTube</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.date}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMaterial(m)}>
                        👁️ Pratinjau
                      </button>
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
                + Unggah Modul Ajar Digital Baru
              </h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

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
                        <>
                          <option value="PAKET B8">PAKET B8</option>
                          <option value="PAKET C11a">PAKET C11a</option>
                        </>
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
                        <option value="Matematika (Umum)">Matematika (Umum)</option>
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
                      teachers.map((t: any) => <option key={t.id} value={t.full_name}>{t.full_name}</option>)
                    ) : (
                      <>
                        <option value="EHA MEIDA KARTIKA">EHA MEIDA KARTIKA</option>
                        <option value="ESI ROKESI">ESI ROKESI</option>
                      </>
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
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{previewMaterial.title}</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setPreviewMaterial(null)}>×</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{previewMaterial.description}</p>
              {previewMaterial.youtubeUrl && <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>▶️ YouTube: {previewMaterial.youtubeUrl}</div>}
              {previewMaterial.pdfFileName && <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>📄 PDF: {previewMaterial.pdfFileName}</div>}
            </div>
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setPreviewMaterial(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
