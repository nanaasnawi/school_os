'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Teacher Workstation: Teacher Analytics & Progress Monitoring
 * Thin route wrapper
 */
export default function TeacherAnalyticsPage() {
  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Teacher Analytics</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Monitoring mendalam progress membaca, tingkat penyelesaian tugas, dan deteksi siswa berisiko secara analitik.
          </p>
        </div>
        <Link
          href="/dashboard/teacher"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            padding: '0.6rem 1.15rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          Kembali ke Action Center
        </Link>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.75" style={{ margin: '0 auto 1rem' }}>
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
          Monitoring Reading Progress &amp; Penyelesaian Belajar
        </h3>
        <p style={{ maxWidth: '540px', margin: '0 auto 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Modul analitik membaca buku nasional dan ketercapaian materi kelas Anda sedang dikalkulasi dari log aktivitas membaca siswa secara berkala.
        </p>
        <div style={{ display: 'inline-flex', gap: '0.75rem' }}>
          <Link
            href="/dashboard/teacher"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Buka Action Center Harian
          </Link>
        </div>
      </div>
    </div>
  );
}
