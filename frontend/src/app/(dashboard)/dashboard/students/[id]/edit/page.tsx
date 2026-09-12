'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStudentById, updateStudent } from '@/lib/sdk';
import styles from './editStudent.module.css';

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nisn: '',
    full_name: '',
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const { data, error: apiError } = await getStudentById({
          path: { id }
        });

        if (apiError) {
          throw new Error('Failed to load student details');
        }

        if (data && data.data) {
          setFormData({
            nisn: data.data.nisn || '',
            full_name: data.data.full_name || '',
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data, error: apiError } = await updateStudent({
        path: { id },
        body: {
          nisn: formData.nisn,
          full_name: formData.full_name,
        }
      });

      if (apiError) {
        throw new Error('Failed to update student profile');
      }

      if (data && data.data) {
        router.push(`/dashboard/students/${id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading student profile...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Student Profile</h1>
          <p className={styles.subtitle}>Update NISN or full name for this student.</p>
        </div>
        <Link href={`/dashboard/students/${id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={`glass-panel ${styles.formCard}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nisn" className={styles.label}>NISN (National Student ID)</label>
            <input
              id="nisn"
              name="nisn"
              type="text"
              value={formData.nisn}
              onChange={handleChange}
              className={styles.input}
              required
              placeholder="e.g. 0012345678"
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="full_name" className={styles.label}>Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              className={styles.input}
              required
              placeholder="John Doe"
              disabled={submitting}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
