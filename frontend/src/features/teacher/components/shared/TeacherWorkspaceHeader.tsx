'use client';

import React from 'react';
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
    </div>
  );
}
