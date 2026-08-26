'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../staff.module.css';

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    role_title: 'Kepala Tata Usaha',
    department: 'Administrasi',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(formData),
      }).catch(() => null);

      router.push('/dashboard/staff');
    } catch {
      router.push('/dashboard/staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Tambah Staf Baru</h1>
          <p className={styles.subtitle}>Input data pegawai tata usaha dan tenaga kependidikan</p>
        </div>
        <Link href="/dashboard/staff" className="btn btn-secondary btn-sm">
          ← Batal &amp; Kembali
        </Link>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.tableCard} style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nama Lengkap Pegawai *</label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="contoh: Ibu Dewi Susanti"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Jabatan / Peran Operasional</label>
              <select
                name="role_title"
                value={formData.role_title}
                onChange={handleChange}
                className="input"
              >
                <option value="Kepala Tata Usaha">Kepala Tata Usaha</option>
                <option value="Staf IT &amp; Infrastruktur">Staf IT &amp; Infrastruktur</option>
                <option value="Staf Keuangan">Staf Keuangan</option>
                <option value="Staf Perpustakaan">Staf Perpustakaan</option>
                <option value="Petugas Kebersihan &amp; Keamanan">Petugas Kebersihan &amp; Keamanan</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Departemen Unit Kerja</label>
              <input
                name="department"
                type="text"
                placeholder="contoh: Administrasi / IT Support"
                value={formData.department}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>No. WhatsApp / HP Kontak</label>
              <input
                name="phone"
                type="text"
                placeholder="contoh: 0812-5566-7788"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-dim)' }}>
            <Link href="/dashboard/staff" className="btn btn-secondary btn-sm">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Menyimpan Data Staf...' : '💾 Simpan Data Staf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
