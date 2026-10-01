'use client';

import React from 'react';
import Link from 'next/link';
import styles from './shared.module.css';
import type { TeacherProfile } from '../../types';

interface TeacherWorkspaceHeaderProps {
  profile: TeacherProfile | null;
  currentDateText: string;
}

export function TeacherWorkspaceHeader({ profile, currentDateText }: TeacherWorkspaceHeaderProps) {
  const initial = profile?.full_name ? profile.full_name.trim().charAt(0).toUpperCase() : 'G';

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.avatarBadge}>{initial}</div>
        <div className={styles.titleArea}>
          <div className={styles.workspaceTag}>
            <span className={styles.pulseGreen} />
            <span>Teacher Workstation</span>
          </div>
          <h1 className={styles.teacherName}>
            {profile?.full_name || 'Bapak/Ibu Pendidik'}
          </h1>
          <p className={styles.teacherSubtitle}>
            {profile?.subject ? `Guru Pengampu: ${profile.subject}` : 'Ruang Kerja Pengajar'} • {currentDateText}
          </p>
        </div>
      </div>

      <div className={styles.headerActions}>
        <Link href="/dashboard/learning/materials" className={styles.actionBtnSecondary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Materi &amp; Buku</span>
        </Link>
        <Link href="/dashboard/learning/quizzes" className={styles.actionBtnSecondary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Bank Soal CBT</span>
        </Link>
        <Link href="/dashboard/learning/assignments" className={styles.actionBtnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Buat Tugas Baru</span>
        </Link>
      </div>
    </div>
  );
}
