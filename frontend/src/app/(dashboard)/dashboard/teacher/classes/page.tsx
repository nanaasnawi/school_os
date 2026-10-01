'use client';

import React from 'react';
import Link from 'next/link';
import { useTeacherClasses } from '@/features/teacher';

/**
 * Teacher Workstation: Kelas Saya
 * Thin route wrapper
 */
export default function TeacherClassesPage() {
  const { classes, isLoading } = useTeacherClasses();

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Memuat daftar kelas...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Kelas Saya</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Daftar rombongan belajar dan siswa yang Anda ampu pada tahun ajaran ini.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {classes.map((c) => (
          <div
            key={c.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.35rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, background: '#f0f9ff', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', marginBottom: '0.5rem' }}>
                {c.grade_level_name || 'Rombel Aktif'}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{c.name}</h3>
              <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                {c.student_count} Peserta Didik Terdaftar
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href={`/dashboard/classes`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                }}
              >
                Detail Siswa &amp; Presensi
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
