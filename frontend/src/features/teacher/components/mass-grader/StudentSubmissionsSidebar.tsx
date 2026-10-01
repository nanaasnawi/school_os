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
  filterStatus: 'ALL' | 'PENDING' | 'GRADED';
  onFilterChange: (status: 'ALL' | 'PENDING' | 'GRADED') => void;
}

export function StudentSubmissionsSidebar({
  submissions,
  activeIndex,
  onSelect,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
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
          >
            Semua
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${filterStatus === 'PENDING' ? styles.filterTabActive : ''}`}
            onClick={() => onFilterChange('PENDING')}
          >
            Belum Dinilai
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${filterStatus === 'GRADED' ? styles.filterTabActive : ''}`}
            onClick={() => onFilterChange('GRADED')}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className={styles.studentList}>
        {submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Tidak ada pengumpulan yang sesuai filter.
          </div>
        ) : (
          submissions.map((item, idx) => {
            const isActive = idx === activeIndex;
            const initial = item.student_name.trim().charAt(0).toUpperCase() || 'S';
            const isGraded = item.status === 'graded' && item.score !== null;

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
                    <span className={styles.statusGradedBadge}>{item.score}</span>
                  ) : (
                    <span className={styles.statusPendingBadge}>Belum</span>
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
