'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './editStaff.module.css';

export default function EditStaffPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: 'Ibu Dewi Susanti',
    role_title: 'Kepala Tata Usaha',
    department: 'Administration',
    phone: '0812-5566-7788',
    email_contact: 'dewi.susanti@school.os',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(`Staff profile updated successfully! Redirecting...`);
    setTimeout(() => {
      router.push(`/dashboard/staff/${id}`);
    }, 1000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <h1 className={styles.title}>Edit Staff Profile</h1>
          <p className={styles.subtitle}>Update staff member role and contact details</p>
        </div>
        <Link href={`/dashboard/staff/${id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <div className={styles.inputGridTwo}>
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
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role_title" className={styles.label}>Position / Role Title</label>
                <input
                  id="role_title"
                  name="role_title"
                  type="text"
                  value={formData.role_title}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="department" className={styles.label}>Department</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
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
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href={`/dashboard/staff/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Staff Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
