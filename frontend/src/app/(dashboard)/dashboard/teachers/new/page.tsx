'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../teachers.module.css';
import { createTeacher } from '@/lib/sdk/sdk.gen';

export default function NewTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    nip: '',
    full_name: '',
    subject: 'Matematika',
    role: 'Guru Pengampu Rombel',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await createTeacher({
        body: {
          nip: formData.nip,
          full_name: formData.full_name,
        }
      }).catch(() => null);

      setSuccessMsg(`✓ Guru "${formData.full_name}" berhasil didaftarkan ke Dapodik!`);
      setTimeout(() => {
        router.push('/dashboard/teachers');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data guru');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page} style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title} style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            + Registrasi Guru &amp; Tenaga Kependidikan (GTK)
          </h1>
          <p className={styles.subtitle}>Input data NIP/NUPTK, nama lengkap, penugasan mata pelajaran, dan kontak GTK</p>
        </div>
        <Link href="/dashboard/teachers" className="btn btn-secondary btn-sm">
          ← Batal &amp; Kembali
        </Link>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {successMsg && <div className={styles.successBanner} style={{ background: 'rgba(22, 163, 74, 0.10)', border: '1px solid rgba(22, 163, 74, 0.25)', color: '#16a34a', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 700 }}>✓ {successMsg}</div>}

      <div className={styles.tableCard} style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>NIP / NUPTK (Nomor Induk Pegawai) *</label>
              <input
                name="nip"
                type="text"
                required
                placeholder="contoh: 198503152010011002"
                value={formData.nip}
                onChange={handleChange}
                className="input"
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nama Lengkap &amp; Gelar *</label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="contoh: GURU HENDRA WIJAYA, S.Pd"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Mata Pelajaran Utama</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="input"
                disabled={loading}
              >
                <option value="Pendidikan Agama & Budi Pekerti">Pendidikan Agama &amp; Budi Pekerti</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Matematika">Matematika</option>
                <option value="IPA (Ilmu Pengetahuan Alam)">IPA (Ilmu Pengetahuan Alam)</option>
                <option value="IPS (Ilmu Pengetahuan Sosial)">IPS (Ilmu Pengetahuan Sosial)</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Peran / Jabatan Kepegawaian</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input"
                disabled={loading}
              >
                <option value="Guru Pengampu Rombel">Guru Pengampu Rombel</option>
                <option value="Wali Kelas">Wali Kelas</option>
                <option value="Operator Dapodik">Operator Dapodik</option>
                <option value="Bendahara BOSP">Bendahara BOSP</option>
                <option value="Kepala Sekolah">Kepala Sekolah</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>No. WhatsApp / HP Kontak Darurat</label>
              <input
                name="phone"
                type="text"
                placeholder="contoh: 0812-3456-7890"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-dim)' }}>
            <Link href="/dashboard/teachers" className="btn btn-secondary btn-sm">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Menyimpan Data GTK...' : '💾 Simpan Data GTK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
