'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../new/newAcademicYear.module.css';

export default function EditAcademicYearPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '2025/2026',
    start_date: '2025-07-15',
    end_date: '2026-06-20',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(`Academic year configuration updated! Redirecting...`);
    setTimeout(() => {
      router.push(`/dashboard/academic-years/${id}`);
    }, 1000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title}>Edit Academic Year</h1>
          <p className={styles.subtitle}>Update start date, end date, and period title</p>
        </div>
        <Link href={`/dashboard/academic-years/${id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Academic Year Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="start_date" className={styles.label}>Start Date</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="end_date" className={styles.label}>End Date</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href={`/dashboard/academic-years/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
