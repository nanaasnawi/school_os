'use client';

import React from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import { useTeacherActionCenter } from '../../hooks';
import { TeacherWorkspaceHeader, TeacherMetricGrid, ActionCenterSkeleton } from '../shared';
import { AtRiskStudentsWidget } from './AtRiskStudentsWidget';
import { PendingGradingWidget } from './PendingGradingWidget';
import { TodayScheduleWidget } from './TodayScheduleWidget';
import { RecentMaterialsWidget } from './RecentMaterialsWidget';
import { TeacherCalendarWidget } from './TeacherCalendarWidget';

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

      {/* 2. Top Metric Grid (4 Core Key Performance Cards) */}
      <TeacherMetricGrid stats={stats} />

      {/* 3. Unified Workstation Scope & Attendance Control Toolbar */}
      <div className={styles.workstationToolbar}>
        {/* Left: Class / Rombel Scope Switcher */}
        <div className={styles.toolbarFilterGroup}>
          <div className={styles.filterIconPill}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div className={styles.toolbarFilterText}>
            <label htmlFor="teacher-rombel-select" className={styles.filterTitle}>
              Lingkup Rombel:
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="teacher-rombel-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className={styles.toolbarSelect}
              >
                <option value="ALL">Semua Rombel Diampu ({classes.length} Rombel)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.student_count} Siswa)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className={styles.rombelTotalBadge}>
            {classes.length} Rombel Diampu
          </span>
        </div>

        {/* Right: Quick Attendance Banner Action */}
        <div className={styles.toolbarAttendanceGroup}>
          <div className={styles.attendanceTextInfo}>
            <div className={styles.attendanceBadgeRow}>
              <span className={styles.attendanceLiveDot} />
              <span className={styles.attendanceBadgeText}>Presensi Hari Ini</span>
            </div>
            <span className={styles.attendanceHintText}>
              Catat absensi rombel dan pantau rekapitulasi kehadiran.
            </span>
          </div>
          <Link href="/dashboard/attendance" className={styles.toolbarAttendanceBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Buka Lembar Presensi</span>
            <span className={styles.arrowIcon}>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* 4. Balanced 2-Column Dashboard Grid */}
      <div className={styles.actionCenterGrid}>
        {/* Left Column: Teaching Sessions & Student Risk Early Warning System */}
        <div className={styles.leftCol}>
          <TodayScheduleWidget schedules={todaySchedule} />
          <TeacherCalendarWidget />
          <AtRiskStudentsWidget
            students={atRiskStudents}
            onResolve={handleResolveRisk}
          />
        </div>

        {/* Right Column: Grading Queue & Active Learning Materials */}
        <div className={styles.rightCol}>
          <PendingGradingWidget tasks={pendingGrading} />
          <RecentMaterialsWidget materials={materials} />
        </div>
      </div>
    </div>
  );
}
