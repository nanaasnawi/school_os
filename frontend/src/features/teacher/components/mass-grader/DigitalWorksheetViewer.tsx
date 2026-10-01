'use client';

import React from 'react';
import styles from './mass-grader.module.css';
import type { DetailedSubmission, AssignmentWithQuestions } from '../../api';

interface DigitalWorksheetViewerProps {
  submission: DetailedSubmission | null;
  assignment: AssignmentWithQuestions | null;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  score: number | '';
  onScoreChange: (val: number | '') => void;
  feedback: string;
  onFeedbackChange: (val: string) => void;
  questionScores: Record<string, number>;
  onQuestionScoreChange: (questionId: string, val: number) => void;
  questionFeedbacks: Record<string, string>;
  onQuestionFeedbackChange: (questionId: string, text: string) => void;
  onScorePreset: (val: number) => void;
  onSave: (goToNext: boolean) => void;
  isSaving: boolean;
}

export function DigitalWorksheetViewer({
  submission,
  assignment,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  score,
  onScoreChange,
  feedback,
  onFeedbackChange,
  questionScores,
  onQuestionScoreChange,
  questionFeedbacks,
  onQuestionFeedbackChange,
  onScorePreset,
  onSave,
  isSaving,
}: DigitalWorksheetViewerProps) {
  if (!submission) {
    return (
      <div className={styles.worksheetCard} style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Pilih Lembar Kerja Siswa</h4>
        <p style={{ fontSize: '0.88rem', margin: '0.5rem 0 0' }}>
          Klik nama siswa di daftar sebelah kiri untuk mulai menelaah dan memberikan skor.
        </p>
      </div>
    );
  }

  const initial = submission.student_name.trim().charAt(0).toUpperCase() || 'S';
  const submittedDate = new Date(submission.submitted_at).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const answers = submission.answers || [];

  return (
    <div className={styles.worksheetCard}>
      {/* ── Header ── */}
      <div className={styles.worksheetHeader}>
        <div className={styles.studentHeaderInfo}>
          <div className={styles.studentHeaderAvatar}>{initial}</div>
          <div>
            <h3 className={styles.studentHeaderTitle}>{submission.student_name}</h3>
            <div className={styles.studentHeaderSub}>
              NISN: {submission.student_nisn || '-'} &bull; Dikumpulkan: {submittedDate}
            </div>
          </div>
        </div>

        {/* Prev / Next controls */}
        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={onPrev}
            disabled={currentIndex <= 0}
            title="Siswa Sebelumnya (Alt + 🠔)"
          >
            &larr; Prev
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={onNext}
            disabled={currentIndex >= totalCount - 1}
            title="Siswa Berikutnya (Alt + 🠖)"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* ── Worksheet Body ── */}
      <div className={styles.worksheetBody}>
        {/* If questions exist, render each question & answer */}
        {answers.length > 0 ? (
          answers.map((ans, idx) => {
            const currentPoints = questionScores[ans.question_id] ?? (ans.points_earned || 0);
            const currentNote = questionFeedbacks[ans.question_id] ?? (ans.teacher_notes || '');

            return (
              <div key={ans.question_id || idx} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.questionNumberBadge}>Soal {ans.question_number}</span>
                    <span className={styles.questionTypeBadge}>
                      {ans.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Esai Mandiri'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                    Maks: {ans.max_points} poin
                  </span>
                </div>

                <p className={styles.questionPrompt}>{ans.prompt}</p>

                {/* Multiple Choice answer */}
                {ans.question_type === 'MULTIPLE_CHOICE' && (
                  <div className={styles.answerBlock}>
                    <div className={styles.answerLabel}>Jawaban Siswa:</div>
                    <div className={styles.answerText}>
                      {ans.selected_choice_text ? (
                        <span>
                          {ans.is_choice_correct ? '✅' : '❌'} {ans.selected_choice_text}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Tidak memilih opsi</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Essay answer */}
                {ans.question_type !== 'MULTIPLE_CHOICE' && (
                  <div className={styles.answerBlock}>
                    <div className={styles.answerLabel}>Teks Jawaban Esai Siswa:</div>
                    <div className={styles.answerText}>
                      {ans.essay_answer_text || (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          Tidak ada teks jawaban tertulis.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Points input row for this question */}
                <div className={styles.questionScoreRow}>
                  <div className={styles.pointInputGroup}>
                    <span>Skor Soal Ini:</span>
                    <input
                      type="number"
                      min={0}
                      max={ans.max_points}
                      value={currentPoints}
                      onChange={(e) => onQuestionScoreChange(ans.question_id, Number(e.target.value))}
                      className={styles.pointInput}
                    />
                    <span style={{ color: '#94a3b8' }}>/ {ans.max_points}</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Catatan koreksi soal (opsional)..."
                    value={currentNote}
                    onChange={(e) => onQuestionFeedbackChange(ans.question_id, e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          /* General text submission fallback */
          <div className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumberBadge}>Lembar Pengumpulan Tugas</span>
              <span className={styles.questionTypeBadge}>Teks Mandiri</span>
            </div>
            <p className={styles.questionPrompt}>
              {assignment?.instructions || assignment?.description || 'Tugas Siswa'}
            </p>
            <div className={styles.answerBlock}>
              <div className={styles.answerLabel}>Teks Pengumpulan Siswa:</div>
              <div className={styles.answerText}>
                {submission.answers_count === 0 && (
                  <span>
                    Teks laporan hasil observasi dan analisis materi tugas Bahasa Indonesia mengenai struktur teks dan
                    kaidah kebahasaan.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Grading Bar ── */}
      <div className={styles.gradingBar}>
        <div className={styles.gradingBarTop}>
          <div className={styles.scoreGroup}>
            <div className={styles.scoreInputWrapper}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>Nilai Akhir:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => onScoreChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className={styles.totalScoreInput}
              />
              <span className={styles.maxScoreLabel}>/ 100</span>
            </div>

            {/* Presets */}
            <div className={styles.presetsList}>
              <button type="button" className={styles.presetBtn} onClick={() => onScorePreset(70)}>
                KKM 70
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => onScorePreset(80)}>
                80
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => onScorePreset(90)}>
                90
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => onScorePreset(100)}>
                100 🌟
              </button>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.btnSaveOnly}
              onClick={() => onSave(false)}
              disabled={isSaving}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              className={styles.btnSaveAndNext}
              onClick={() => onSave(true)}
              disabled={isSaving}
              title="Simpan nilai dan langsung buka siswa berikutnya (Ctrl + Enter)"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan & Lanjut ➔'}
            </button>
          </div>
        </div>

        {/* Constructive feedback */}
        <textarea
          rows={2}
          placeholder="Tuliskan catatan apresiasi atau evaluasi untuk siswa ini (akan dibaca siswa di aplikasi mobile)..."
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          className={styles.feedbackInput}
        />

        {/* Keyboard hints */}
        <div className={styles.actionRow}>
          <div className={styles.keyboardHint}>
            <span>Shortcut:</span>
            <kbd className={styles.kbd}>Alt + 🠔</kbd>
            <span>Prev</span>
            <span>&bull;</span>
            <kbd className={styles.kbd}>Alt + 🠖</kbd>
            <span>Next</span>
            <span>&bull;</span>
            <kbd className={styles.kbd}>Ctrl + Enter</kbd>
            <span>Simpan &amp; Lanjut</span>
          </div>
        </div>
      </div>
    </div>
  );
}
