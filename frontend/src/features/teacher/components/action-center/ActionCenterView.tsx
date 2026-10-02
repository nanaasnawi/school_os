'use client';

import React from 'react';
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
    activeCbts,
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
      <div
        className={styles.widgetCard}
        style={{
          padding: '0.6rem 0.95rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)',
          borderColor: '#bbf7d0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.15rem' }}>📅</span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Presensi &amp; Kehadiran Sesi Belajar
            </div>
            <div style={{ fontSize: '0.72rem', color: '#15803d' }}>
              Catat absensi peserta didik hari ini dan pantau rekapitulasi kehadiran rombel secara real-time.
            </div>
          </div>
        </div>
        <div>
          <a
            href="/dashboard/attendance"
            className={styles.actionBtnSmall}
            style={{ background: '#10b981', color: '#ffffff', borderColor: '#059669', textDecoration: 'none' }}
          >
            <span>Buka Lembar Presensi &rarr;</span>
          </a>
        </div>
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

        {/* Right Column: Class filter & Today's Schedule & Active CBTs */}
        <div className={styles.rightCol}>
          <TodayScheduleWidget
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            schedules={todaySchedule}
            activeCbts={activeCbts}
          />
        </div>
      </div>
    </div>
  );
}
