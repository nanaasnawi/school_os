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

      {/* 3. Action Center Main Grid */}
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
