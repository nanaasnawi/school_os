'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './editTeacher.module.css';

export default function EditTeacherPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    nuptk: '',
    nip: '',
    jk: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    status_kepegawaian: 'Guru Honor Sekolah',
    jenis_ptk: 'Guru Mapel',
    agama: 'Islam',
    alamat_jalan: '',
    no_hp: '',
    email: '',
    subject: 'Matematika',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadTeacher() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch(`http://localhost:8000/api/v1/teachers/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.data && !cancelled) {
            const d = json.data;
            setFormData({
              full_name: d.full_name || '',
              nuptk: d.nuptk || '',
              nip: d.nip || '',
              jk: d.jk === 'L' || d.jk === 'Laki-laki' ? 'Laki-laki' : (d.jk === 'P' || d.jk === 'Perempuan' ? 'Perempuan' : 'Laki-laki'),
              tempat_lahir: d.tempat_lahir || '',
              tanggal_lahir: d.tanggal_lahir || '',
              status_kepegawaian: d.status_kepegawaian || 'Guru Honor Sekolah',
              jenis_ptk: d.jenis_ptk || 'Guru Mapel',
              agama: d.agama || 'Islam',
              alamat_jalan: d.alamat_jalan || '',
              no_hp: d.no_hp || '',
              email: d.email || '',
              subject: d.subject || 'Matematika',
            });
            setFetching(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching teacher for edit:', err);
      }

      if (!cancelled) {
        setFetching(false);
      }
    }

    if (id) {
      loadTeacher();
    }
    return () => { cancelled = true; };
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(`http://localhost:8000/api/v1/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          nip: formData.nip,
          nuptk: formData.nuptk,
          subject: formData.subject,
          no_hp: formData.no_hp,
          email: formData.email,
        })
      });

      if (res.ok) {
        setSuccessMsg('✓ Data Pendidik berhasil diperbarui!');
        setTimeout(() => {
          router.push(`/dashboard/teachers/${id}`);
        }, 1000);
      } else {
        const err = await res.json().catch(() => null);
        setErrorMsg(err?.error?.message || 'Gagal menyimpan perubahan ke server.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          🔄 Memuat data pendidik...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Edit Data Pendidik</h1>
          <p className={styles.subtitle}>Perbarui identitas kepegawaian, mapel yang diampu, dan kontak guru</p>
        </div>
        <Link href={`/dashboard/teachers/${id}`} className="btn btn-secondary">
          ← Kembali
        </Link>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
      {errorMsg && <div style={{ background: '#ef4444', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{errorMsg}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--accent-hover)' }}>
              1. Identitas &amp; Kepegawaian (Dapodik)
            </h3>
            
            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="full_name" className={styles.label}>Nama Lengkap &amp; Gelar *</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>Mata Pelajaran yang Diampu *</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="nuptk" className={styles.label}>NUPTK (16 Digit)</label>
                <input
                  id="nuptk"
                  name="nuptk"
                  type="text"
                  value={formData.nuptk}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Contoh: 1938746281900012"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="nip" className={styles.label}>NIP Pegawai</label>
                <input
                  id="nip"
                  name="nip"
                  type="text"
                  value={formData.nip}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Contoh: 198503152010011002"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status_kepegawaian" className={styles.label}>Status Kepegawaian</label>
                <select
                  id="status_kepegawaian"
                  name="status_kepegawaian"
                  value={formData.status_kepegawaian}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                  <option value="PPPK">PPPK</option>
                  <option value="Guru Tetap Yayasan">Guru Tetap Yayasan (GTY)</option>
                  <option value="Guru Honor Sekolah">Guru Honor Sekolah (GTT)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="jenis_ptk" className={styles.label}>Jenis PTK</label>
                <select
                  id="jenis_ptk"
                  name="jenis_ptk"
                  value={formData.jenis_ptk}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="Guru Mapel">Guru Mapel (Mata Pelajaran)</option>
                  <option value="Guru Kelas">Guru Kelas</option>
                  <option value="Guru BK">Guru Bimbingan Konseling (BK)</option>
                  <option value="Guru Pendamping Khusus">Guru Pendamping Khusus</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-dim)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--accent-hover)' }}>
              2. Biodata Pribadi &amp; Kontak
            </h3>

            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="jk" className={styles.label}>Jenis Kelamin</label>
                <select
                  id="jk"
                  name="jk"
                  value={formData.jk}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="agama" className={styles.label}>Agama</label>
                <input
                  id="agama"
                  name="agama"
                  type="text"
                  value={formData.agama}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="no_hp" className={styles.label}>No. Handphone / WhatsApp</label>
                <input
                  id="no_hp"
                  name="no_hp"
                  type="text"
                  value={formData.no_hp}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="0812-XXXX-XXXX"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Sekolah / Pribadi</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="guru@sekolah.sch.id"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="alamat_jalan" className={styles.label}>Alamat Tempat Tinggal</label>
                <input
                  id="alamat_jalan"
                  name="alamat_jalan"
                  type="text"
                  value={formData.alamat_jalan}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Jl. Raya No. XX, Kelurahan, Kecamatan, Kota"
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href={`/dashboard/teachers/${id}`} className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan ke DB...' : '💾 Simpan Perubahan Guru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
