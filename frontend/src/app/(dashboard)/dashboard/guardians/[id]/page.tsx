'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './guardianDetail.module.css';

type GuardianProfile = {
  id: string;
  full_name: string;
  phone: string;
  email_contact: string;
  relationship: string;
  linked_students: Array<{ name: string; class_name: string }>;
};

const DEMO_GUARDIANS: Record<string, GuardianProfile> = {
  '1': {
    id: '1',
    full_name: 'Bpk. Bambang Fauzi',
    phone: '0812-9988-7766',
    email_contact: 'bambang.fauzi@gmail.com',
    relationship: 'Ayah Kandung',
    linked_students: [
      { name: 'Ahmad Fauzi', class_name: 'Kelas 10-A IPA' },
      { name: 'Aisyah Fauzi', class_name: 'Kelas 8-B SMP' },
    ],
  },
  '2': {
    id: '2',
    full_name: 'Ibu Siti Aminah',
    phone: '0812-9988-7767',
    email_contact: 'siti.aminah@gmail.com',
    relationship: 'Ibu Kandung',
    linked_students: [
      { name: 'Budi Santoso', class_name: 'Kelas 10-A IPA' },
    ],
  },
};

const DEFAULT_FALLBACK: GuardianProfile = {
  id: '1',
  full_name: 'Bpk. Bambang Fauzi',
  phone: '0812-9988-7766',
  email_contact: 'bambang.fauzi@gmail.com',
  relationship: 'Orang Tua / Wali',
  linked_students: [
    { name: 'Ahmad Fauzi', class_name: 'Kelas 10-A IPA' },
  ],
};

export default function GuardianDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';

  const [profile, setProfile] = useState<GuardianProfile>(DEFAULT_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoMatch = DEMO_GUARDIANS[id] || { ...DEFAULT_FALLBACK, id, full_name: `Guardian #${id}` };
    setProfile(demoMatch);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Loading guardian details...</span>
      </div>
    );
  }

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'GD';

  return (
    <div className={styles.page}>

      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarBox}>{initials}</div>
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.guardianName}>{profile.full_name}</h1>
              <span className={styles.relBadge}>{profile.relationship}</span>
            </div>
            <p className={styles.guardianSub}>
              Phone: <span className={styles.monoText}>{profile.phone}</span>
              {' · '}
              Email: <strong>{profile.email_contact}</strong>
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/guardians" className="btn btn-secondary">
            ← Back to Directory
          </Link>
          <Link href={`/dashboard/guardians/${id}/edit`} className="btn btn-primary">
            ✏️ Edit Record
          </Link>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Guardian Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>System Guardian ID</span>
              <span className={styles.infoVal}>{profile.id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Full Name</span>
              <span className={styles.infoVal}>{profile.full_name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Relationship to Student</span>
              <span className={styles.infoVal}>{profile.relationship}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Phone Number</span>
              <span className={styles.infoVal}>{profile.phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Portal Account Status</span>
              <span className={styles.textGreen}>Connected & Active ✓</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Linked Student Records</h3>
          <div className={styles.studentList}>
            {profile.linked_students.map((s: { name: string; class_name: string }, i: number) => (
              <div key={i} className={styles.studentRow}>
                <div className={styles.sInfo}>
                  <span className={styles.sName}>{s.name}</span>
                  <span className={styles.sClass}>{s.class_name}</span>
                </div>
                <span className={styles.linkBadge}>Linked Student</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
