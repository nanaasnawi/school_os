'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../new/newClass.module.css';

export default function EditClassPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: 'Kelas 10-A IPA',
    grade_level: '10',
    homeroom_teacher: 'Bpk. Hendra Wijaya',
    room: 'R. 101',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(`Class details updated successfully! Redirecting...`);
    setTimeout(() => {
      router.push(`/dashboard/classes/${id}`);
    }, 1000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title}>Edit Class Details</h1>
          <p className={styles.subtitle}>Update class room name, homeroom teacher, and location</p>
        </div>
        <Link href={`/dashboard/classes/${id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Class Name</label>
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
                <label htmlFor="grade_level" className={styles.label}>Grade Level</label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="homeroom_teacher" className={styles.label}>Homeroom Teacher</label>
                <input
                  id="homeroom_teacher"
                  name="homeroom_teacher"
                  type="text"
                  value={formData.homeroom_teacher}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="room" className={styles.label}>Room Location</label>
                <input
                  id="room"
                  name="room"
                  type="text"
                  value={formData.room}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href={`/dashboard/classes/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Class Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
