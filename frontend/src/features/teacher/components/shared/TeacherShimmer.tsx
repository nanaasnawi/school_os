'use client';

import React from 'react';
import styles from './shimmer.module.css';

/**
 * High-fidelity Action Center Shimmer Skeleton
 * Matches the exact card & 2-column grid proportions of /dashboard/teacher
 */
export function ActionCenterSkeleton() {
  return (
    <div className={styles.pageContainer} aria-busy="true" aria-label="Memuat Teacher Workstation">
      {/* 1. Header Card Skeleton */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={`${styles.shimmer} ${styles.avatarSkeleton}`} />
          <div className={styles.headerTextGroup}>
            <div className={`${styles.shimmer} ${styles.badgeSkeleton}`} />
            <div className={`${styles.shimmer} ${styles.titleSkeleton}`} />
            <div className={`${styles.shimmer} ${styles.subtitleSkeleton}`} />
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={`${styles.shimmer} ${styles.btnSkeleton}`} />
          <div className={`${styles.shimmer} ${styles.btnSkeleton}`} />
          <div className={`${styles.shimmer} ${styles.btnSkeletonPrimary}`} />
        </div>
      </div>

      {/* 2. Metric Grid Skeleton (4 cards) */}
      <div className={styles.metricGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.metricCard}>
            <div className={styles.metricCardBody}>
              <div className={styles.metricCardTop}>
                <div className={`${styles.shimmer} ${styles.metricTitleSkeleton}`} />
                <div className={`${styles.shimmer} ${styles.metricIconSkeleton}`} />
              </div>
              <div className={`${styles.shimmer} ${styles.metricValueSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.metricSubtitleSkeleton}`} />
            </div>
            <div className={`${styles.shimmer} ${styles.metricFooterSkeleton}`} />
          </div>
        ))}
      </div>

      {/* 3. Main Grid Skeleton */}
      <div className={styles.actionCenterGrid}>
        {/* Left Column: At Risk Students & Pending Grading */}
        <div className={styles.leftCol}>
          {/* At Risk Widget Skeleton */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={`${styles.shimmer} ${styles.widgetTitleSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.widgetBadgeSkeleton}`} />
            </div>
            <div className={styles.widgetBody}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.riskItemSkeleton}>
                  <div className={`${styles.shimmer} ${styles.riskIconSkeleton}`} />
                  <div className={styles.riskContentSkeleton}>
                    <div className={`${styles.shimmer} ${styles.riskNameSkeleton}`} />
                    <div className={`${styles.shimmer} ${styles.riskDescSkeleton}`} />
                  </div>
                  <div className={`${styles.shimmer} ${styles.riskBtnSkeleton}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Pending Grading Widget Skeleton */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={`${styles.shimmer} ${styles.widgetTitleSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.widgetBadgeSkeleton}`} />
            </div>
            <div className={styles.widgetBody}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.gradingItemSkeleton}>
                  <div className={styles.gradingItemTop}>
                    <div className={`${styles.shimmer} ${styles.gradingTitleSkeleton}`} />
                    <div className={`${styles.shimmer} ${styles.gradingTagSkeleton}`} />
                  </div>
                  <div className={`${styles.shimmer} ${styles.gradingBarSkeleton}`} />
                  <div className={styles.gradingItemBottom}>
                    <div className={`${styles.shimmer} ${styles.gradingCountSkeleton}`} />
                    <div className={`${styles.shimmer} ${styles.gradingBtnSkeleton}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Schedule */}
        <div className={styles.rightCol}>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={`${styles.shimmer} ${styles.widgetTitleSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.widgetBadgeSkeleton}`} />
            </div>
            <div className={styles.widgetBody}>
              <div className={`${styles.shimmer} ${styles.scheduleDropdownSkeleton}`} />
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.scheduleItemSkeleton}>
                  <div className={`${styles.shimmer} ${styles.scheduleTimeSkeleton}`} />
                  <div className={styles.scheduleInfoSkeleton}>
                    <div className={`${styles.shimmer} ${styles.scheduleSubjectSkeleton}`} />
                    <div className={`${styles.shimmer} ${styles.scheduleRoomSkeleton}`} />
                  </div>
                  <div className={`${styles.shimmer} ${styles.scheduleBtnSkeleton}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Class Cards Shimmer Skeleton for /dashboard/teacher/classes
 */
export function ClassCardsSkeleton() {
  return (
    <div className={styles.classCardsGrid} aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.classCardSkeleton}>
          <div className={styles.classCardTop}>
            <div className={`${styles.shimmer} ${styles.classBadgeSkeleton}`} />
            <div className={`${styles.shimmer} ${styles.classIconSkeleton}`} />
          </div>
          <div className={`${styles.shimmer} ${styles.classNameSkeleton}`} />
          <div className={styles.classStatsSkeleton}>
            <div className={styles.classStatItem}>
              <div className={`${styles.shimmer} ${styles.classStatLabel}`} />
              <div className={`${styles.shimmer} ${styles.classStatValue}`} />
            </div>
            <div className={styles.classStatItem}>
              <div className={`${styles.shimmer} ${styles.classStatLabel}`} />
              <div className={`${styles.shimmer} ${styles.classStatValue}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Mass Grader Split Workspace Shimmer Skeleton
 */
export function MassGraderSkeleton() {
  return (
    <div className={styles.splitLayout} aria-busy="true">
      {/* Left Sidebar Skeleton */}
      <div className={styles.graderSidebarSkeleton}>
        <div className={styles.graderSidebarHeader}>
          <div className={`${styles.shimmer} ${styles.graderSidebarTitle}`} />
          <div className={`${styles.shimmer} ${styles.graderSidebarCount}`} />
        </div>
        <div className={`${styles.shimmer} ${styles.graderSearchInput}`} />
        <div className={styles.graderFilterPills}>
          <div className={`${styles.shimmer} ${styles.graderFilterPill}`} />
          <div className={`${styles.shimmer} ${styles.graderFilterPill}`} />
          <div className={`${styles.shimmer} ${styles.graderFilterPill}`} />
        </div>
        <div className={styles.graderStudentList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.graderStudentCard}>
              <div className={`${styles.shimmer} ${styles.graderStudentName}`} />
              <div className={styles.graderStudentMeta}>
                <div className={`${styles.shimmer} ${styles.graderStudentClass}`} />
                <div className={`${styles.shimmer} ${styles.graderStudentBadge}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Worksheet Viewer Skeleton */}
      <div className={styles.graderViewerSkeleton}>
        <div className={styles.graderViewerHeader}>
          <div className={`${styles.shimmer} ${styles.graderViewerTitle}`} />
          <div className={`${styles.shimmer} ${styles.graderViewerMeta}`} />
        </div>
        <div className={styles.graderViewerBody}>
          <div className={`${styles.shimmer} ${styles.graderQuestionBox}`} />
          <div className={`${styles.shimmer} ${styles.graderAnswerBox}`} />
          <div className={`${styles.shimmer} ${styles.graderRubricBox}`} />
        </div>
      </div>
    </div>
  );
}
