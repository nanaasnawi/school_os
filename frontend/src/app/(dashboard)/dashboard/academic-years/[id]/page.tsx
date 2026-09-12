'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './yearDetail.module.css';

type YearProfile = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  semesters: string[];
};

const DEMO_YEARS: Record<string, YearProfile> = {
  '1': {
    id: '1',
    name: '2025/2026',
    start_date: '2025-07-15',
    end_date: '2026-06-20',
    is_active: true,
    semesters: ['Semester Ganjil 2025/2026 (Active)', 'Semester Genap 2025/2026'],
  },
  '2': {
    id: '2',
    name: '2024/2025',
    start_date: '2024-07-15',
    end_date: '2025-06-20',
    is_active: false,
    semesters: ['Semester Ganjil 2024/2025 (Archived)', 'Semester Genap 2024/2025 (Archived)'],
  },
};

const DEFAULT_FALLBACK: YearProfile = {
  id: '1',
  name: '2025/2026',
  start_date: '2025-07-15',
  end_date: '2026-06-20',
  is_active: true,
  semesters: ['Semester Ganjil 2025/2026 (Active)', 'Semester Genap 2025/2026'],
};

export default function AcademicYearDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';

  const [profile, setProfile] = useState<YearProfile>(DEFAULT_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoMatch = DEMO_YEARS[id] || { ...DEFAULT_FALLBACK, id, name: `Year #${id}` };
    setProfile(demoMatch);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Loading academic year details...</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarBox}>📅</div>
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.yearName}>TA {profile.name}</h1>
              <span className={`${styles.statusChip} ${profile.is_active ? styles.chipActive : styles.chipArchived}`}>
                {profile.is_active ? '✦ ACTIVE PERIOD' : 'ARCHIVED'}
              </span>
            </div>
            <p className={styles.yearSub}>
              Start Date: <strong>{profile.start_date}</strong>
              {' · '}
              End Date: <strong>{profile.end_date}</strong>
            </p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/academic-years" className="btn btn-secondary">
            ← Back to List
          </Link>
          <Link href={`/dashboard/academic-years/${id}/edit`} className="btn btn-primary">
            ✏️ Edit Period
          </Link>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Academic Period Configuration</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Period ID</span>
              <span className={styles.infoVal}>{profile.id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Academic Year</span>
              <span className={styles.infoVal}>{profile.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Start Date</span>
              <span className={styles.infoVal}>{profile.start_date}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>End Date</span>
              <span className={styles.infoVal}>{profile.end_date}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Semesters</h3>
          <div className={styles.semesterList}>
            {profile.semesters.map((s: string, i: number) => (
              <div key={i} className={styles.semesterRow}>
                <span className={styles.semesterName}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
