'use client';

import React from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import { useTeacherActionCenter } from '../../hooks';
import { TeacherWorkspaceHeader, TeacherMetricGrid, ActionCenterSkeleton } from '../shared';
import { AtRiskStudentsWidget } from './AtRiskStudentsWidget';
import { PendingGradingWidget } from './PendingGradingWidget';
import { TodayScheduleWidget } from './TodayScheduleWidget';

export function ActionCenterView() {
  const {
    isLoading,
    profile,
    classes,
    selectedClassId,
    setSelectedClassId,
    todaySchedule,
    stats,
    atRiskStudents,
    pendingGrading,
    materials,
    handleResolveRisk,
  } = useTeacherActionCenter();

  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const currentDateText = now.toLocaleDateString('id-ID', options);

  if (isLoading) {
    return <ActionCenterSkeleton />;
  }

  return (
    <div className={styles.pageContainer}>
      {/* 1. Header with Profile and Quick Launch Actions */}
      <TeacherWorkspaceHeader
        profile={profile}
        currentDateText={currentDateText}
      />

      {/* 2. Top Metric Grid */}
      <TeacherMetricGrid stats={stats} />

      {/* 2.5 Quick Attendance & Presensi Link */}
      <div className={styles.attendanceBanner}>
        <div className={styles.attendanceBannerLeft}>
          <div className={styles.attendanceIconBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className={styles.attendanceTextGroup}>
            <div className={styles.attendanceTitle}>
              Presensi &amp; Kehadiran Sesi Belajar
            </div>
            <div className={styles.attendanceSubtitle}>
              Catat absensi peserta didik hari ini dan pantau rekapitulasi kehadiran rombel secara real-time.
            </div>
          </div>
        </div>
        <Link href="/dashboard/attendance" className={styles.attendanceBtn}>
          <span>Buka Lembar Presensi</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
      <div className={styles.actionCenterGrid}>
        {/* Left Column: At Risk Students & Pending Grading */}
        <div className={styles.leftCol}>
          <AtRiskStudentsWidget
            students={atRiskStudents}
            onResolve={handleResolveRisk}
          />

          <PendingGradingWidget tasks={pendingGrading} />
        </div>

        {/* Right Column: Class filter & Today's Schedule & Recent Materials */}
        <div className={styles.rightCol}>
          <TodayScheduleWidget
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            schedules={todaySchedule}
            materials={materials}
          />
        </div>
      </div>
    </div>
  );
}
