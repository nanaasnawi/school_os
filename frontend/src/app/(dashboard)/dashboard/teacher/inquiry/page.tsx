'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Teacher Workstation: Tanya Guru (Inquiry)
 * Thin route wrapper
 */
export default function TeacherInquiryPage() {
  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Tanya Guru &amp; Diskusi Materi</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Pertanyaan dan diskusi dari peserta didik terkait materi pembelajaran dan tugas.
          </p>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.75" style={{ margin: '0 auto 1rem' }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
          Pusat Diskusi Materi Terhubung
        </h3>
        <p style={{ maxWidth: '540px', margin: '0 auto 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Semua pertanyaan siswa dari aplikasi Android akan masuk ke thread ini dan dapat Anda tanggapi secara mendalam langsung dari workstation.
        </p>
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
          Kembali ke Dashboard Guru
        </Link>
      </div>
    </div>
  );
}
