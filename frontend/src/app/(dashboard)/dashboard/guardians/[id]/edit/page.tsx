'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './editGuardian.module.css';

export default function EditGuardianPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: 'Bpk. Bambang Fauzi',
    phone: '0812-9988-7766',
    email_contact: 'bambang.fauzi@gmail.com',
    relationship: 'Ayah Kandung',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(`Guardian profile updated successfully! Redirecting...`);
    setTimeout(() => {
      router.push(`/dashboard/guardians/${id}`);
    }, 1000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title}>Edit Guardian Record</h1>
          <p className={styles.subtitle}>Update guardian contact details and student relationship</p>
        </div>
        <Link href={`/dashboard/guardians/${id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <div className={styles.inputGridTwo}>
              <div className={styles.formGroup}>
                <label htmlFor="full_name" className={styles.label}>Guardian Full Name</label>
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
                <label htmlFor="relationship" className={styles.label}>Relationship</label>
                <input
                  id="relationship"
                  name="relationship"
                  type="text"
                  value={formData.relationship}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email_contact" className={styles.label}>Email Address</label>
                <input
                  id="email_contact"
                  name="email_contact"
                  type="email"
                  value={formData.email_contact}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href={`/dashboard/guardians/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Guardian Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
