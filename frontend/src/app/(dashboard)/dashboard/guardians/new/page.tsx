'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../guardians.module.css';

export default function NewGuardianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    student_name: '',
    relationship: 'Ayah Kandung',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/guardians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(formData),
      }).catch(() => null);

      router.push('/dashboard/guardians');
    } catch {
      router.push('/dashboard/guardians');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Tambah Rekord Wali</h1>
          <p className={styles.subtitle}>Input data orang tua / wali murid dan kontak darurat terhubung</p>
        </div>
        <Link href="/dashboard/guardians" className="btn btn-secondary btn-sm">
          ← Batal &amp; Kembali
        </Link>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.tableCard} style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nama Lengkap Wali / Orang Tua *</label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="contoh: Bpk. Bambang Sutrisno"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>No. WhatsApp / HP Kontak *</label>
              <input
                name="phone"
                type="text"
                required
                placeholder="contoh: 0813-1122-3344"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nama Siswa Terhubung</label>
              <input
                name="student_name"
                type="text"
                placeholder="contoh: Ahmad Fauzi"
                value={formData.student_name}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Hubungan Keluarga</label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="input"
              >
                <option value="Ayah Kandung">Ayah Kandung</option>
                <option value="Ibu Kandung">Ibu Kandung</option>
                <option value="Wali Murid">Wali Murid</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-dim)' }}>
            <Link href="/dashboard/guardians" className="btn btn-secondary btn-sm">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Menyimpan Data Wali...' : '💾 Simpan Rekord Wali'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
