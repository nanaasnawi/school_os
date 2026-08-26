'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../new/newEnrollment.module.css';

export default function EditEnrollmentPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    student_id: '0081234567',
    class_id: 'Kelas 10-A IPA',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(`Enrollment record updated successfully! Redirecting...`);
    setTimeout(() => {
      router.push(`/dashboard/enrollments/${id}`);
    }, 1000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title}>Edit Enrollment Record</h1>
          <p className={styles.subtitle}>Update student class assignment</p>
        </div>
        <Link href={`/dashboard/enrollments/${id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="student_id" className={styles.label}>Student NISN</label>
                <input
                  id="student_id"
                  name="student_id"
                  type="text"
                  value={formData.student_id}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="class_id" className={styles.label}>Target Class Room</label>
                <select
                  id="class_id"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="Kelas 10-A IPA">Kelas 10-A IPA</option>
                  <option value="Kelas 10-B IPS">Kelas 10-B IPS</option>
                  <option value="Kelas 11-A IPA">Kelas 11-A IPA</option>
                  <option value="Kelas 11-B IPS">Kelas 11-B IPS</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href={`/dashboard/enrollments/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Enrollment Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
