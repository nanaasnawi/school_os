'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './mass-grader.module.css';
import { useMassGrader } from '../../hooks';
import { StudentSubmissionsSidebar } from './StudentSubmissionsSidebar';
import { DigitalWorksheetViewer } from './DigitalWorksheetViewer';
import { MassGraderSkeleton } from '../shared';

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
        <MassGraderSkeleton />
      ) : assignmentList.length === 0 ? (
        /* ── Empty State: no assignments created yet ── */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-secondary, #64748b)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            Belum Ada Tugas Aktif
          </div>
          <div style={{ fontSize: '0.8rem', maxWidth: 380 }}>
            Buat tugas terlebih dahulu di menu <strong>Tugas Siswa</strong>, lalu siswa dapat mengumpulkan dan kamu bisa mulai menilai di sini.
          </div>
          <a
            href="/dashboard/learning/assignments/create"
            style={{
              marginTop: '0.5rem',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#0284c7', color: '#fff',
              padding: '0.45rem 1rem', borderRadius: 8,
              fontWeight: 700, fontSize: '0.8rem',
              textDecoration: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Buat Tugas Baru
          </a>
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
