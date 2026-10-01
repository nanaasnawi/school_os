'use client';

import React from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { AtRiskStudent } from '../../types';

interface AtRiskStudentsWidgetProps {
  students: AtRiskStudent[];
  onResolve: (studentId: string) => void;
}

export function AtRiskStudentsWidget({ students, onResolve }: AtRiskStudentsWidgetProps) {
  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h3 className={styles.widgetTitle}>
              Siswa Perlu Perhatian Hari Ini
              <span className={styles.badgeCount}>{students.length}</span>
            </h3>
            <p className={styles.widgetSub}>
              Tindak lanjuti siswa yang tertinggal membaca modul, menunggak tugas, atau nilai di bawah KKM.
            </p>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className={styles.emptyStateTitle}>Seluruh Siswa Berada di Jalur Aman!</span>
          <span>Tidak ada siswa yang mengalami keterlambatan tugas atau nilai di bawah KKM saat ini.</span>
        </div>
      ) : (
        <div className={styles.riskList}>
          {students.map((student) => {
            const isHigh = student.risk_level === 'HIGH';
            return (
              <div key={student.student_id} className={styles.riskItem}>
                <div className={styles.riskItemLeft}>
                  <div className={styles.riskItemMeta}>
                    <span className={styles.studentName}>{student.student_name}</span>
                    <span className={styles.classBadge}>{student.class_name}</span>
                    <span className={`${styles.riskCategoryPill} ${isHigh ? styles.riskHigh : styles.riskMedium}`}>
                      {student.category === 'UNREAD_MATERIAL'
                        ? 'Materi Tertinggal'
                        : student.category === 'OVERDUE_ASSIGNMENT'
                        ? 'Tugas Belum Kumpul'
                        : student.category === 'LOW_SCORE'
                        ? 'Nilai < KKM'
                        : 'Perlu Perhatian'}
                    </span>
                  </div>
                  <p className={styles.riskItemTitle}>{student.title}</p>
                  <p className={styles.riskItemDesc}>{student.description}</p>
                </div>

                <div>
                  {student.target_url ? (
                    <Link href={student.target_url} className={styles.actionBtnSmall}>
                      <span>{student.action_label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      onClick={() => onResolve(student.student_id)}
                      className={styles.actionBtnSmall}
                    >
                      <span>{student.action_label}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
