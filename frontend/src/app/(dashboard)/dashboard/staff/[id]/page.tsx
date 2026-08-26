'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './staffDetail.module.css';

type StaffProfile = {
  id: string;
  full_name: string;
  role_title: string;
  department: string;
  phone: string;
  email_contact: string;
  status: string;
};

const DEMO_STAFF: Record<string, StaffProfile> = {
  '1': {
    id: '1',
    full_name: 'Ibu Dewi Susanti',
    role_title: 'Kepala Tata Usaha',
    department: 'Administration',
    phone: '0812-5566-7788',
    email_contact: 'dewi.susanti@school.os',
    status: 'ACTIVE',
  },
  '2': {
    id: '2',
    full_name: 'Bpk. Agus Setiawan',
    role_title: 'Staf IT & Infrastruktur',
    department: 'IT Support',
    phone: '0812-5566-7789',
    email_contact: 'agus.setiawan@school.os',
    status: 'ACTIVE',
  },
};

const DEFAULT_FALLBACK: StaffProfile = {
  id: '1',
  full_name: 'Ibu Dewi Susanti',
  role_title: 'Staf Administrasi',
  department: 'Administration',
  phone: '0812-5566-7788',
  email_contact: 'dewi.susanti@school.os',
  status: 'ACTIVE',
};

export default function StaffDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';

  const [profile, setProfile] = useState<StaffProfile>(DEFAULT_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoMatch = DEMO_STAFF[id] || { ...DEFAULT_FALLBACK, id, full_name: `Staff #${id}` };
    setProfile(demoMatch);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Loading staff details...</span>
      </div>
    );
  }

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'ST';

  return (
    <div className={styles.page}>

      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarBox}>{initials}</div>
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.staffName}>{profile.full_name}</h1>
              <span className={styles.roleBadge}>{profile.role_title}</span>
            </div>
            <p className={styles.staffSub}>
              Department: <strong>{profile.department}</strong>
              {' · '}
              Email: <strong>{profile.email_contact}</strong>
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/staff" className="btn btn-secondary">
            ← Back to Staff List
          </Link>
          <Link href={`/dashboard/staff/${id}/edit`} className="btn btn-primary">
            ✏️ Edit Profile
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Staff Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>System Staff ID</span>
            <span className={styles.infoVal}>{profile.id}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Full Name</span>
            <span className={styles.infoVal}>{profile.full_name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Position / Role</span>
            <span className={styles.infoVal}>{profile.role_title}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Department</span>
            <span className={styles.infoVal}>{profile.department}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phone Number</span>
            <span className={styles.infoVal}>{profile.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
