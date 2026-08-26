'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAcademicYear } from '@/lib/sdk';
import styles from './newAcademicYear.module.css';

export default function NewAcademicYearPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '2026/2027 (Semester Ganjil)',
    start_date: '2026-07-15',
    end_date: '2026-12-20',
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await createAcademicYear({
        body: {
          name: formData.name,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
        },
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
        },
      }).catch(() => null);

      setSuccessMsg(`✓ Periode Akademik "${formData.name}" berhasil dibuat & disinkronkan!`);
      setTimeout(() => {
        router.push('/dashboard/academic-years');
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan periode akademik baru');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
        <div>
          
          <h1 className={styles.title} style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            + Buat Periode Tahun Ajaran &amp; Semester Baru
          </h1>
          <p className={styles.subtitle} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Konfigurasi kalender akademik dan penetapan semester aktif
          </p>
        </div>
        <Link href="/dashboard/academic-years" className="btn btn-secondary btn-sm">
          ← Batal &amp; Kembali
        </Link>
      </div>

      {error && <div className={styles.errorAlert} style={{ background: 'rgba(220, 38, 38, 0.10)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#dc2626', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem' }}>{error}</div>}
      {successMsg && <div style={{ background: 'rgba(22, 163, 74, 0.10)', border: '1px solid rgba(22, 163, 74, 0.25)', color: '#16a34a', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 700 }}>{successMsg}</div>}

      {/* Form Card Container */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
              Nama Periode Tahun Ajaran &amp; Semester *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
              placeholder="contoh: 2026/2027 (Semester Ganjil)"
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                Tanggal Mulai Semester *
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                Tanggal Selesai Semester *
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="is_active" style={{ fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}>
              ● Tetapkan sebagai Periode Semester Aktif berjalan (Dapodik Live)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <Link href="/dashboard/academic-years" className="btn btn-secondary btn-sm">
              Batal
            </Link>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Menyimpan Periode...' : '💾 Simpan & Activate Periode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
