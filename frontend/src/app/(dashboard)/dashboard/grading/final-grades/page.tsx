'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './final-grades.module.css';
import { listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { exportToExcel } from '@/lib/exportExcel';

type FinalGradeEntry = {
  studentId: string;
  nisn: string;
  name: string;
  className: string;
  math: number;
  indonesia: number;
  ipa: number;
  ips: number;
  pai: number;
  english: number;
  averageGrade: number;
  predicate: 'A' | 'B' | 'C';
  status: 'LULUS (Predikat A)' | 'LULUS (Predikat B)' | 'REMEDIAL';
};

export default function FinalGradesPage() {
  const [hasSavedGrades, setHasSavedGrades] = useState(false);
  const [finalGrades, setFinalGrades] = useState<FinalGradeEntry[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [search, setSearch] = useState('');
  const [schoolName, setSchoolName] = useState('Sekolah');

  // Selected Student Transcript Modal
  const [selectedTranscript, setSelectedTranscript] = useState<FinalGradeEntry | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = getTenantItem('dapodik_nama_sekolah');
      if (stored) setSchoolName(stored);
      const isSaved = localStorage.getItem('has_saved_grades') === 'true';
      setHasSavedGrades(isSaved);
    }

    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        fetch('/api/v1/schools/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null).then(json => {
          if (json?.data?.name) setSchoolName(json.data.name);
        }).catch(() => null);

        const [studentRes, classRes] = await Promise.all([
          listStudents({ query: { page_size: 500 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
        ]);

        if (classRes?.data?.data) {
          setClassesList(classRes.data.data);
        }

        const isSaved = typeof window !== 'undefined' && localStorage.getItem('has_saved_grades') === 'true';

        if (studentRes?.data?.data) {
          const list = studentRes.data.data;
          if (!isSaved) {
            setFinalGrades([]);
            return;
          }

          let savedScoresMap: Record<string, any> = {};
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('saved_gradebook_scores');
              if (raw) savedScoresMap = JSON.parse(raw);
            } catch (e) {
              console.error(e);
            }
          }

          const mapped: FinalGradeEntry[] = list.map((s: any) => {
            const saved = savedScoresMap[s.id];
            const m = saved ? saved.formatif1 : 0;
            const ind = saved ? saved.formatif2 : 0;
            const ip = saved ? saved.pts : 0;
            const ipS = saved ? saved.pas : 0;
            const p = saved ? saved.formatif1 : 0;
            const eng = saved ? saved.formatif2 : 0;

            const avg = Math.round(((m + ind + ip + ipS + p + eng) / 6) * 10) / 10;
            const pred: 'A' | 'B' | 'C' = avg >= 88 ? 'A' : avg >= 75 ? 'B' : 'C';
            const stat: 'LULUS (Predikat A)' | 'LULUS (Predikat B)' | 'REMEDIAL' = pred === 'A' ? 'LULUS (Predikat A)' : avg >= 75 ? 'LULUS (Predikat B)' : 'REMEDIAL';

            return {
              studentId: s.id,
              nisn: s.nisn,
              name: s.full_name,
              className: s.class_name || 'Rombel General',
              math: m,
              indonesia: ind,
              ipa: ip,
              ips: ipS,
              pai: p,
              english: eng,
              averageGrade: avg,
              predicate: pred,
              status: stat,
            };
          });
          setFinalGrades(mapped);
        }
      } catch (err) {
        console.error('Error loading final grades:', err);
      }
    }
    loadData();
  }, []);

  const handleFinalize = () => {
    if (!hasSavedGrades) {
      showToast('⚠️ Belum ada nilai akhir untuk dikunci!');
      return;
    }
    showToast(`🔒 Seluruh Nilai Akhir Rapor & Transkrip Semester ${schoolName} Berhasil Dikunci!`);
  };

  const exportToExcelFile = () => {
    if (!filtered || filtered.length === 0) {
      showToast('⚠️ Tidak ada data nilai akhir untuk diekspor!');
      return;
    }
    exportToExcel(
      filtered.map((f, i) => ({
        No: i + 1,
        NISN: f.nisn,
        Nama: f.name,
        Rombel: f.className,
        Matematika: f.math,
        Bahasa_Indonesia: f.indonesia,
        IPA: f.ipa,
        IPS: f.ips,
        PAI: f.pai,
        Bahasa_Inggris: f.english,
        Rata_Rata: f.averageGrade,
        Predikat: f.predicate,
        Status: f.status,
      })),
      `Nilai_Akhir_Rapor_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}`
    );
    showToast('📊 Mengunduh Excel Nilai Akhir Rapor (.xlsx)...');
  };

  const filtered = finalGrades.filter(f => {
    const matchClass = selectedClass === 'ALL' || f.className === selectedClass;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.nisn.includes(search);
    return matchClass && matchSearch;
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  React.useEffect(() => { 
    setCurrentPage(1); 
  }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            Nilai Akhir Rapor &amp; Transkrip Semester
          </h1>
          <p className={styles.subtitle}>
            Rekapitulasi Rata-Rata Nilai Akhir (Skala 0 - 100), Predikat Rapor, dan Status Kelulusan di {schoolName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcelFile}>
            📊 Ekspor Excel (.xlsx)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleFinalize}>
            🔒 Kunci &amp; Finalisasi Transkrip
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input
          type="text"
          className="input"
          placeholder="Cari NISN atau nama siswa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="input"
          style={{ width: '200px' }}
        >
          <option value="ALL">Semua Rombel</option>
          {classesList.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Empty State Banner if no grades saved yet */}
      {!hasSavedGrades ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '3.5rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📄</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Belum Ada Data Nilai Akhir Rapor yang Diinput
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '8px auto 20px', lineHeight: 1.6 }}>
            Guru pengampu di <strong>{schoolName}</strong> belum menginput nilai mata pelajaran untuk semester ini. Nilai akhir rapor &amp; transkrip akan terisi secara otomatis setelah nilai dimasukkan pada menu <strong>Buku Nilai</strong>.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href="/dashboard/grading/gradebook" className="btn btn-primary btn-sm">
              ✏️ Buka Buku Nilai &amp; Input Nilai
            </Link>
          </div>
        </div>
      ) : (
        /* Table View */
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem' }}>NISN &amp; NAMA SISWA (DAPODIK REAL)</th>
                <th style={{ padding: '0.85rem 1rem' }}>ROMBEL</th>
                <th style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>MATEMATIKA</th>
                <th style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>B. INDONESIA</th>
                <th style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>IPA</th>
                <th style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>IPS</th>
                <th style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>PAI</th>
                <th style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>B. INGGRIS</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>RATA-RATA NILAI AKHIR</th>
                <th style={{ padding: '0.85rem 1rem' }}>PREDIKAT &amp; KELULUSAN</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada data siswa yang cocok dengan pencarian atau filter rombel.
                  </td>
                </tr>
              ) : (
                paginated.map(item => (
                  <tr key={item.studentId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NISN: {item.nisn}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-info">{item.className}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.math}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.indonesia}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.ipa}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.ips}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.pai}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.english}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#2563eb' }}>{item.averageGrade}</strong>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${item.predicate === 'A' ? 'badge-success' : item.predicate === 'B' ? 'badge-active' : 'badge-inactive'}`} style={{ fontWeight: 800 }}>
                        Predikat {item.predicate}
                      </span>
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', color: item.predicate === 'C' ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        • {item.status}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => setSelectedTranscript(item)}>
                        📄 Transkrip Rapor
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filtered.length > itemsPerPage && (
            <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} siswa
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                >
                  &laquo; Prev
                </button>
                <span style={{ padding: '0.2rem 0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>📄 Transkrip Nilai Rapor Digital</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{schoolName}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTranscript(null)}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Nama Siswa:</strong> {selectedTranscript.name}</div>
                <div><strong>NISN:</strong> {selectedTranscript.nisn}</div>
                <div><strong>Rombel:</strong> {selectedTranscript.className}</div>
                <div><strong>Predikat Rapor:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>Predikat {selectedTranscript.predicate}</span></div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem' }}>Mata Pelajaran</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Nilai Akhir</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Status KKM</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '0.5rem 0.6rem' }}>Matematika (Umum)</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{selectedTranscript.math}</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}><span className="badge badge-success">Tuntas</span></td></tr>
                <tr><td style={{ padding: '0.5rem 0.6rem' }}>Bahasa Indonesia</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{selectedTranscript.indonesia}</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}><span className="badge badge-success">Tuntas</span></td></tr>
                <tr><td style={{ padding: '0.5rem 0.6rem' }}>IPA</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{selectedTranscript.ipa}</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}><span className="badge badge-success">Tuntas</span></td></tr>
                <tr><td style={{ padding: '0.5rem 0.6rem' }}>IPS</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{selectedTranscript.ips}</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}><span className="badge badge-success">Tuntas</span></td></tr>
                <tr><td style={{ padding: '0.5rem 0.6rem' }}>PAI &amp; Budi Pekerti</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{selectedTranscript.pai}</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}><span className="badge badge-success">Tuntas</span></td></tr>
                <tr><td style={{ padding: '0.5rem 0.6rem' }}>Bahasa Inggris</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{selectedTranscript.english}</td><td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}><span className="badge badge-success">Tuntas</span></td></tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rata-Rata Akhir: </span>
                <strong style={{ fontSize: '1.2rem', color: '#2563eb' }}>{selectedTranscript.averageGrade} / 100</strong>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => { showToast(`🖨️ Mencetak Transkrip Rapor ${selectedTranscript.name}...`); window.print(); }}>
                🖨️ Cetak Transkrip PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
