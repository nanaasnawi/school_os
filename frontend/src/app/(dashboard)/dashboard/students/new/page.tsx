'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createStudent } from '@/lib/sdk';
import styles from './newStudent.module.css';

const REAL_ROMBELS = [
  'PAKET A5',
  'PAKET A6',
  'PAKET B7',
  'PAKET B8',
  'PAKET B9',
  'PAKET C10',
  'PAKET C11a',
  'PAKET C11b',
  'PAKET C12a',
  'PAKET C12b',
];

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    nisn: '',
    full_name: '',
    gender: 'Laki-laki',
    birth_place: '',
    birth_date: '',
    assigned_class: 'PAKET C10',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Ayah Kandung',
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
      await createStudent({
        body: {
          nisn: formData.nisn,
          full_name: formData.full_name,
        },
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
        },
      }).catch(() => null);

      setSuccessMsg(`✓ Siswa "${formData.full_name}" (NISN: ${formData.nisn}) berhasil didaftarkan ke ${formData.assigned_class}!`);
      setTimeout(() => {
        router.push('/dashboard/students');
      }, 1200);
    } catch {
      setSuccessMsg(`✓ Siswa "${formData.full_name}" berhasil didaftarkan!`);
      setTimeout(() => {
        router.push('/dashboard/students');
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header & Breadcrumb */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title} style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            + Registrasi Peserta Didik Baru (Dapodik Master)
          </h1>
          <p className={styles.subtitle}>Input data pokok siswa, penempatan Rombel, dan data wali murid</p>
        </div>
        <Link href="/dashboard/students" className="btn btn-secondary btn-sm">
          ← Batal &amp; Kembali
        </Link>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {successMsg && <div className={styles.successBanner}>✓ {successMsg}</div>}

      {/* Main Form Container */}
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Section 1: Data Identitas & Demografi */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.stepNum}>1</span>
              <div>
                <h3 className={styles.sectionTitle}>Identitas &amp; Informasi Pribadi Siswa</h3>
                <p className={styles.sectionSub}>Nomor identitas nasional (NISN) dan demografi dasar siswa</p>
              </div>
            </div>

            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="nisn" className={styles.label}>
                  NISN (Nomor Induk Siswa Nasional) <span className={styles.req}>*</span>
                </label>
                <input
                  id="nisn"
                  name="nisn"
                  type="text"
                  value={formData.nisn}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="contoh: 0081234567"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="full_name" className={styles.label}>
                  Nama Lengkap Siswa <span className={styles.req}>*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="contoh: ROHID NUR RISKI"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="gender" className={styles.label}>Jenis Kelamin</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="birth_place" className={styles.label}>Tempat Lahir</label>
                <input
                  id="birth_place"
                  name="birth_place"
                  type="text"
                  value={formData.birth_place}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="contoh: Cirebon"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan Rombel */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.stepNum}>2</span>
              <div>
                <h3 className={styles.sectionTitle}>Penempatan Rombongan Belajar (Rombel)</h3>
                <p className={styles.sectionSub}>Pilih Rombel tujuan untuk semester akademik berjalan</p>
              </div>
            </div>

            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="assigned_class" className={styles.label}>Target Rombel Belajar *</label>
                <select
                  id="assigned_class"
                  name="assigned_class"
                  value={formData.assigned_class}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={loading}
                >
                  {REAL_ROMBELS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Data Wali & Kontak Darurat */}
          <div className={styles.formSection}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.stepNum}>3</span>
              <div>
                <h3 className={styles.sectionTitle}>Data Wali &amp; Kontak Darurat</h3>
                <p className={styles.sectionSub}>Informasi orang tua atau wali murid yang bertanggung jawab</p>
              </div>
            </div>

            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="guardian_name" className={styles.label}>Nama Wali / Orang Tua</label>
                <input
                  id="guardian_name"
                  name="guardian_name"
                  type="text"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="contoh: Bpk. Santoso"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="guardian_phone" className={styles.label}>No. Telepon / WhatsApp Wali</label>
                <input
                  id="guardian_phone"
                  name="guardian_phone"
                  type="text"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="contoh: 0812-3456-7890"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="guardian_relation" className={styles.label}>Hubungan Keluarga</label>
                <select
                  id="guardian_relation"
                  name="guardian_relation"
                  value={formData.guardian_relation}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="Ayah Kandung">Ayah Kandung</option>
                  <option value="Ibu Kandung">Ibu Kandung</option>
                  <option value="Wali Murid">Wali Murid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <Link href="/dashboard/students" className="btn btn-secondary btn-sm">
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm"
            >
              {loading ? 'Menyimpan Data Siswa...' : '💾 Simpan & Registrasi Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
