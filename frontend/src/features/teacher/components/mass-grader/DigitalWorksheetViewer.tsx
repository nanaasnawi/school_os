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
            title="Siswa Sebelumnya (Alt + ←)"
          >
            &larr; Prev
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', fontVariantNumeric: 'tabular-nums' }}>
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={onNext}
            disabled={currentIndex >= totalCount - 1}
            title="Siswa Berikutnya (Alt + →)"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* ── Worksheet Body ── */}
      <div className={styles.worksheetBody}>
        {/* If questions exist, render each question & answer */}
        {submission.status === 'unsubmitted' ? (
          <div className={styles.unsubmittedContainer}>
            <div className={styles.unsubmittedIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.unsubmittedTitle}>Belum Mengumpulkan Tugas</h3>
            <p className={styles.unsubmittedDesc}>
              Peserta didik <strong>{submission.student_name}</strong> belum mengirimkan lembar jawaban tugas ini via aplikasi mobile School OS.
            </p>
            <div className={styles.unsubmittedNote}>
              Anda dapat memberikan nilai manual di bawah ini (jika tugas dikumpulkan secara offline/fisik) atau melanjutkan ke siswa berikutnya.
            </div>
          </div>
        ) : answers.length > 0 ? (
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {ans.is_choice_correct ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          )}
                          <span>{ans.selected_choice_text}</span>
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
              <span className={styles.questionTypeBadge}>
                {submission.file_url ? 'Lampiran Berkas / Dokumen' : 'Teks Tugas'}
              </span>
            </div>
            <p className={styles.questionPrompt}>
              {assignment?.instructions || assignment?.description || 'Tugas Mandiri Siswa'}
            </p>

            {submission.content && (
              <div className={styles.answerBlock}>
                <div className={styles.answerLabel}>Teks Pengumpulan Siswa:</div>
                <div className={styles.answerText}>
                  {submission.content}
                </div>
              </div>
            )}

            {submission.file_url && (
              <div className={styles.fileAttachmentBlock}>
                <div className={styles.answerLabel}>Lampiran Berkas Siswa:</div>
                <div className={styles.fileCard}>
                  <div className={styles.fileIconWrapper}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>
                      {submission.file_url.split('/').pop() || 'Dokumen Tugas Siswa'}
                    </span>
                    <span className={styles.fileSub}>Berkas terunggah via aplikasi siswa</span>
                  </div>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.fileDownloadBtn}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Buka Berkas
                  </a>
                </div>
              </div>
            )}

            {!submission.content && !submission.file_url && (
              <div className={styles.answerBlock}>
                <div className={styles.answerLabel}>Keterangan Pengumpulan:</div>
                <div className={styles.answerText} style={{ color: '#64748b', fontStyle: 'italic' }}>
                  Siswa telah menandai selesai tetapi tidak melampirkan teks atau berkas tambahan.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extra file attachment if questions exist and file also submitted */}
        {answers.length > 0 && submission.file_url && (
          <div className={styles.fileAttachmentBlock} style={{ marginTop: '0.5rem' }}>
            <div className={styles.answerLabel}>Lampiran Berkas Siswa:</div>
            <div className={styles.fileCard}>
              <div className={styles.fileIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>
                  {submission.file_url.split('/').pop() || 'Dokumen Tugas Siswa'}
                </span>
                <span className={styles.fileSub}>Berkas terunggah via aplikasi siswa</span>
              </div>
              <a
                href={submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileDownloadBtn}
              >
                Buka Berkas ↗
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Grading Bar ── */}
      <div className={styles.gradingBar}>
        {submission.status === 'unsubmitted' && (
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#b45309',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Peserta didik belum mengumpulkan tugas secara digital. Penilaian dinonaktifkan untuk data ini.</span>
          </div>
        )}
        <div className={styles.gradingBarTop}>
          <div className={styles.scoreGroup}>
            <div className={styles.scoreInputWrapper}>
              <div className={styles.scoreLabelGroup}>
                <span className={styles.scoreMainLabel}>Nilai Akhir:</span>
                {answers.length > 0 && (
                  <span className={styles.scoreSubLabel}>
                    Poin: {answers.reduce((acc, a) => acc + (questionScores[a.question_id] ?? (a.points_earned || 0)), 0)} / {answers.reduce((acc, a) => acc + (a.max_points || 0), 0)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => onScoreChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={submission.status === 'unsubmitted'}
                className={styles.totalScoreInput}
              />
              <span className={styles.maxScoreLabel}>/ 100</span>
            </div>

            {/* Presets */}
            <div className={styles.presetsList}>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onScorePreset(70)}
                disabled={submission.status === 'unsubmitted'}
              >
                KKM 70
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onScorePreset(80)}
                disabled={submission.status === 'unsubmitted'}
              >
                80
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onScorePreset(90)}
                disabled={submission.status === 'unsubmitted'}
              >
                90
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onScorePreset(100)}
                disabled={submission.status === 'unsubmitted'}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>100</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.btnSaveOnly}
              onClick={() => onSave(false)}
              disabled={isSaving || submission.status === 'unsubmitted'}
              title={submission.status === 'unsubmitted' ? 'Siswa belum mengumpulkan' : 'Simpan Nilai'}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              className={styles.btnSaveAndNext}
              onClick={() => onSave(true)}
              disabled={isSaving || submission.status === 'unsubmitted'}
              title={submission.status === 'unsubmitted' ? 'Siswa belum mengumpulkan' : 'Simpan nilai dan langsung buka siswa berikutnya (Ctrl + Enter)'}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan & Lanjut →'}
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
            <kbd className={styles.kbd}>Alt + ←</kbd>
            <span>Prev</span>
            <span>&bull;</span>
            <kbd className={styles.kbd}>Alt + →</kbd>
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
