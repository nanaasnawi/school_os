'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './mass-grader.module.css';
import { useMassGrader } from '../../hooks';
import { StudentSubmissionsSidebar } from './StudentSubmissionsSidebar';
import { DigitalWorksheetViewer } from './DigitalWorksheetViewer';

export function MassGraderWorkspace() {
  const searchParams = useSearchParams();
  const initialAssignmentId = searchParams.get('assignment_id') || searchParams.get('id') || undefined;

  const {
    assignmentList,
    selectedAssignmentId,
    setSelectedAssignmentId,
    assignment,
    submissions,
    totalCount,
    activeSubmissionIndex,
    activeSubmission,
    isLoading,
    isSaving,
    saveSuccessNotice,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    score,
    setScore,
    feedback,
    setFeedback,
    questionScores,
    questionFeedbacks,
    setScorePreset,
    handleUpdateQuestionScore,
    handleUpdateQuestionFeedback,
    selectSubmission,
    prevSubmission,
    nextSubmission,
    saveCurrentGrade,
    stats,
  } = useMassGrader(initialAssignmentId);

  return (
    <div className={styles.workspace}>
      {/* ── Top Header with Assignment Switcher & Progress ── */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderLeft}>
          <div className={styles.assignmentTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <select
                className={styles.selectAssignment}
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
              >
                {assignmentList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} {a.class_name ? `(${a.class_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.assignmentMeta}>
              <span>{assignment?.class_name || 'Rombel Belajar'}</span>
              <span>&bull;</span>
              <span>{assignment?.subject_name || 'Mata Pelajaran'}</span>
              {assignment?.due_at && (
                <>
                  <span>&bull;</span>
                  <span>Tenggat: {new Date(assignment.due_at).toLocaleDateString('id-ID')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={styles.progressGroup}>
          <div className={styles.progressText}>
            <span className={styles.progressCount}>
              {stats.graded} / {stats.total} Dinilai
            </span>
            <span className={styles.progressPercent}>
              {stats.percent}% Selesai {stats.pending > 0 ? `• ${stats.pending} Perlu Dinilai` : ''}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
      </div>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className={styles.successNotice}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* ── Main Split Workstation ── */}
      {isLoading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
          <span style={{ fontWeight: 600 }}>Memuat Lembar Koreksi Siswa...</span>
        </div>
      ) : (
        <div className={styles.splitLayout}>
          {/* Left Column: Submissions Sidebar */}
          <StudentSubmissionsSidebar
            submissions={submissions}
            activeIndex={activeSubmissionIndex}
            onSelect={selectSubmission}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            stats={stats}
          />

          {/* Right Column: Digital Worksheet & Grading Actions */}
          <DigitalWorksheetViewer
            submission={activeSubmission}
            assignment={assignment}
            currentIndex={activeSubmissionIndex}
            totalCount={totalCount}
            onPrev={prevSubmission}
            onNext={nextSubmission}
            score={score}
            onScoreChange={setScore}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            questionScores={questionScores}
            onQuestionScoreChange={handleUpdateQuestionScore}
            questionFeedbacks={questionFeedbacks}
            onQuestionFeedbackChange={handleUpdateQuestionFeedback}
            onScorePreset={setScorePreset}
            onSave={saveCurrentGrade}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}
