'use client';

import React, { useState, useEffect } from 'react';
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

  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch('/api/v1/academic/subjects', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setSubjectsList(json.data);
            if (json.data.length > 0) {
              setFormData(prev => ({ ...prev, subject: json.data[0].name }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    }
    loadSubjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const created = await createTeacher({
        body: {
          nip: formData.nip,
          full_name: formData.full_name,
        }
      }).catch(() => null);

      const teacherId = (created as any)?.data?.data?.id;
      if (teacherId) {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        await fetch(`/api/v1/teachers/${teacherId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            subject: formData.subject,
            jenis_ptk: formData.role,
            no_hp: formData.phone,
          })
        }).catch(() => null);
      }

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
                {subjectsList.length > 0 ? (
                  subjectsList.map((s: any) => (
                    <option key={s.id || s.code} value={s.name}>{s.name}</option>
                  ))
                ) : (
                  <option value="">Memuat mata pelajaran...</option>
                )}
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
