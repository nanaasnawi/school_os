'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { enrollStudent } from '@/lib/sdk';
import styles from './newEnrollment.module.css';

export default function NewEnrollmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: apiError } = await enrollStudent({
        body: {
          student_id: formData.student_id,
          class_id: formData.class_id,
        },
        headers: {
          'Idempotency-Key': crypto.randomUUID()
        }
      });

      if (apiError) {
        throw new Error('Failed to enroll student');
      }

      if (data && data.data) {
        router.push('/dashboard/enrollments');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Enroll Student</h1>
          <p className={styles.subtitle}>Enroll a student into a class for a specific academic year.</p>
        </div>
        <Link href="/dashboard/enrollments" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={`glass-panel ${styles.formCard}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="student_id" className={styles.label}>Student ID</label>
            <input
              id="student_id"
              name="student_id"
              type="text"
              value={formData.student_id}
              onChange={handleChange}
              className={styles.input}
              required
              placeholder="UUID of the student"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="class_id" className={styles.label}>Class ID</label>
            <input
              id="class_id"
              name="class_id"
              type="text"
              value={formData.class_id}
              onChange={handleChange}
              className={styles.input}
              required
              placeholder="UUID of the class"
              disabled={loading}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
