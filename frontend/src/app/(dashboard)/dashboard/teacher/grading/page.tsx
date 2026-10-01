'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Teacher Workstation: Koreksi Massal & Penilaian
 * Thin route wrapper connecting to assignment mass grader
 */
export default function TeacherGradingPage() {
  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Koreksi Massal (Mass Grader)</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Workstation penelaahan lembar kerja siswa, penilaian cepat esai, dan input feedback nilai terpusat.
          </p>
        </div>
        <Link
          href="/dashboard/learning/assignments"
          style={{
            background: '#0284c7',
            color: '#ffffff',
            padding: '0.6rem 1.15rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          Lihat Semua Tugas &amp; Submission
        </Link>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.75" style={{ margin: '0 auto 1rem' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
          Workspace Koreksi Massal Siap Digunakan
        </h3>
        <p style={{ maxWidth: '540px', margin: '0 auto 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Pilih tugas siswa dari modul Tugas Pembelajaran untuk memulai koreksi split-screen cepat dengan lembar digital PKBM As-Salafiyah.
        </p>
        <Link
          href="/dashboard/learning/assignments"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0284c7',
            color: '#ffffff',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Buka Antrean Tugas Siswa
        </Link>
      </div>
    </div>
  );
}
