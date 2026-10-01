'use client';

import React from 'react';
import styles from './mass-grader.module.css';
import type { DetailedSubmission } from '../../api';

interface StudentSubmissionsSidebarProps {
  submissions: DetailedSubmission[];
  activeIndex: number;
  onSelect: (index: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: 'ALL' | 'PENDING' | 'UNSUBMITTED' | 'GRADED';
  onFilterChange: (status: 'ALL' | 'PENDING' | 'UNSUBMITTED' | 'GRADED') => void;
  stats?: {
    total: number;
    graded: number;
    pending: number;
    unsubmitted: number;
  };
}

export function StudentSubmissionsSidebar({
  submissions,
  activeIndex,
  onSelect,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  stats,
}: StudentSubmissionsSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        {/* Search */}
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Cari siswa atau NISN..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${filterStatus === 'ALL' ? styles.filterTabActive : ''}`}
            onClick={() => onFilterChange('ALL')}
            title="Tampilkan semua siswa"
          >
            Semua {stats ? `(${stats.total})` : ''}
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${filterStatus === 'PENDING' ? styles.filterTabActive : ''}`}
            onClick={() => onFilterChange('PENDING')}
            title="Siswa yang sudah mengumpulkan dan belum dinilai"
          >
            Perlu Nilai {stats ? `(${stats.pending})` : ''}
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${filterStatus === 'UNSUBMITTED' ? styles.filterTabActive : ''}`}
            onClick={() => onFilterChange('UNSUBMITTED')}
            title="Siswa yang belum mengumpulkan tugas"
          >
            Belum Kumpul {stats ? `(${stats.unsubmitted})` : ''}
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${filterStatus === 'GRADED' ? styles.filterTabActive : ''}`}
            onClick={() => onFilterChange('GRADED')}
            title="Siswa yang sudah selesai dinilai"
          >
            Selesai {stats ? `(${stats.graded})` : ''}
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className={styles.studentList}>
        {submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Tidak ada peserta didik di kategori ini.
          </div>
        ) : (
          submissions.map((item, idx) => {
            const isActive = idx === activeIndex;
            const initial = item.student_name.trim().charAt(0).toUpperCase() || 'S';
            const isGraded = item.status === 'graded' && item.score !== null && item.score !== undefined;
            const isSubmitted = item.status === 'submitted' || item.status === 'late' || item.status === 'resubmitted';

            return (
              <button
                key={item.submission_id}
                type="button"
                className={`${styles.studentItem} ${isActive ? styles.studentItemActive : ''}`}
                onClick={() => onSelect(idx)}
              >
                <div className={styles.studentItemLeft}>
                  <div className={styles.studentAvatar}>{initial}</div>
                  <div className={styles.studentMeta}>
                    <span className={styles.studentName}>{item.student_name}</span>
                    <span className={styles.studentNisn}>NISN: {item.student_nisn || '-'}</span>
                  </div>
                </div>

                <div className={styles.studentItemRight}>
                  {isGraded ? (
                    <span className={styles.statusGradedBadge} title="Nilai Akhir (Skala 100)">
                      {item.score}
                    </span>
                  ) : isSubmitted ? (
                    <span className={styles.statusPendingBadge} title="Sudah mengumpulkan, perlu dinilai guru">
                      Perlu Dinilai
                    </span>
                  ) : (
                    <span className={styles.statusUnsubmittedBadge} title="Belum mengumpulkan tugas via aplikasi">
                      Belum Kumpul
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
