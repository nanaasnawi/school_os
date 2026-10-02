'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchAssignmentSubmissions,
  fetchAssignmentDetail,
  submitGrade,
  DetailedSubmission,
  AssignmentWithQuestions,
} from '../api';
import { getApiUrl, apiClient } from '@/lib/api';

export function useMassGrader(initialAssignmentId?: string) {
  const [assignmentList, setAssignmentList] = useState<Array<{ id: string; title: string; class_name?: string }>>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId || '');
  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [submissions, setSubmissions] = useState<DetailedSubmission[]>([]);
  const [activeSubmissionIndex, setActiveSubmissionIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'UNSUBMITTED' | 'GRADED'>('ALL');

  // Active grading form draft
  const [score, setScore] = useState<number | ''>('');
  const [feedback, setFeedback] = useState<string>('');
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [questionFeedbacks, setQuestionFeedbacks] = useState<Record<string, string>>({});

  // 1. Fetch teacher assignments for switcher dropdown (run once on mount only)
  useEffect(() => {
    async function loadAssignments() {
      try {
        const token = apiClient.getToken();
        const res = await fetch(getApiUrl('/api/v1/learning/assignments'), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const json = await res.json();
          const items: any[] = json?.data?.items || json?.data || [];
          setAssignmentList(
            items.map((i) => ({
              id: i.id,
              title: i.title,
              class_name: i.class_name,
            }))
          );
          // Only auto-select first if no assignment was pre-selected via URL
          setSelectedAssignmentId((current) => {
            if (!current && items.length > 0) return items[0].id;
            return current;
          });
          // If no items exist at all, stop the loading spinner
          if (items.length === 0) {
            setIsLoading(false);
          }
        } else {
          // API error: stop loading so user sees empty state, not infinite spinner
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load assignments list:', err);
        setIsLoading(false);
      }
    }
    loadAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — selectedAssignmentId in deps caused infinite re-fetch loop

  // 2. Fetch assignment details and submissions when selectedAssignmentId changes
  const loadSubmissionsData = useCallback(async () => {
    // Guard: if no assignment is selected, stop loading immediately (don't leave spinner)
    if (!selectedAssignmentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [asg, subs] = await Promise.all([
        fetchAssignmentDetail(selectedAssignmentId),
        fetchAssignmentSubmissions(selectedAssignmentId),
      ]);
      setAssignment(asg);
      setSubmissions(subs);
      setActiveSubmissionIndex(0);
    } catch (err) {
      console.error('Failed to load submissions for mass grader:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAssignmentId]);

  useEffect(() => {
    loadSubmissionsData();
  }, [loadSubmissionsData]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // Status filter
      if (filterStatus === 'PENDING' && s.status !== 'submitted') return false;
      if (filterStatus === 'UNSUBMITTED' && s.status !== 'unsubmitted') return false;
      if (filterStatus === 'GRADED' && s.status !== 'graded') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.student_name.toLowerCase().includes(q);
        const matchesNisn = s.student_nisn?.toLowerCase().includes(q);
        return matchesName || matchesNisn;
      }
      return true;
    });
  }, [submissions, filterStatus, searchQuery]);

  const activeSubmission = filteredSubmissions[Math.min(activeSubmissionIndex, Math.max(0, filteredSubmissions.length - 1))] || null;

  // Initialize draft inputs when active submission changes
  useEffect(() => {
    if (activeSubmission) {
      const initialQScore: Record<string, number> = {};
      const initialQFeedback: Record<string, string> = {};

      if (Array.isArray(activeSubmission.answers)) {
        activeSubmission.answers.forEach((ans) => {
          initialQScore[ans.question_id] = ans.points_earned ?? (ans.is_choice_correct ? ans.max_points : 0);
          if (ans.teacher_notes) initialQFeedback[ans.question_id] = ans.teacher_notes;
        });
      }

      setQuestionScores(initialQScore);
      setQuestionFeedbacks(initialQFeedback);

      // Determine score on scale 0-100
      const totalMax = activeSubmission.answers?.reduce((acc, a) => acc + (a.max_points || 10), 0) || 100;
      const totalEarned = Object.values(initialQScore).reduce((a, b) => a + b, 0);

      if (activeSubmission.score !== null && activeSubmission.score !== undefined) {
        // If raw points were stored instead of scale 100 (e.g. 28 out of 30)
        if (totalMax > 0 && totalMax < 100 && activeSubmission.score <= totalMax) {
          setScore(Math.round((activeSubmission.score / totalMax) * 100));
        } else {
          setScore(activeSubmission.score);
        }
      } else if (activeSubmission.answers && activeSubmission.answers.length > 0) {
        if (totalMax > 0 && totalMax !== 100) {
          setScore(Math.round((totalEarned / totalMax) * 100));
        } else {
          setScore(totalEarned);
        }
      } else {
        setScore('');
      }

      setFeedback(activeSubmission.feedback || '');
    }
  }, [activeSubmission]);

  // Navigate to previous
  const prevSubmission = useCallback(() => {
    setActiveSubmissionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Navigate to next
  const nextSubmission = useCallback(() => {
    setActiveSubmissionIndex((prev) => Math.min(filteredSubmissions.length - 1, prev + 1));
  }, [filteredSubmissions.length]);

  // Set score preset
  const setScorePreset = useCallback((preset: number) => {
    setScore(preset);
  }, []);

  // Update question score and auto calculate total scaled to 100
  const handleUpdateQuestionScore = useCallback(
    (questionId: string, val: number) => {
      setQuestionScores((prev) => {
        const next = { ...prev, [questionId]: val };
        const totalEarned = Object.values(next).reduce((acc, curr) => acc + curr, 0);
        const totalMax =
          activeSubmission?.answers?.reduce((acc, a) => acc + (a.max_points || 10), 0) ||
          assignment?.questions?.reduce((acc, q) => acc + (q.points || 10), 0) ||
          100;

        if (totalMax > 0 && totalMax !== 100) {
          const scaledScore = Math.round((totalEarned / totalMax) * 100);
          setScore(Math.min(100, Math.max(0, scaledScore)));
        } else {
          setScore(Math.min(100, Math.max(0, totalEarned)));
        }
        return next;
      });
    },
    [activeSubmission, assignment]
  );

  // Update question feedback
  const handleUpdateQuestionFeedback = useCallback((questionId: string, text: string) => {
    setQuestionFeedbacks((prev) => ({ ...prev, [questionId]: text }));
  }, []);

  // Save current grade
  const saveCurrentGrade = useCallback(
    async (goToNext: boolean = true) => {
      if (!selectedAssignmentId || !activeSubmission) return;

      const numericScore = typeof score === 'number' ? score : Number(score) || 0;
      setIsSaving(true);
      try {
        const answerGrades = Object.entries(questionScores).map(([qId, pts]) => ({
          question_id: qId,
          points_earned: pts,
          teacher_feedback: questionFeedbacks[qId] || undefined,
        }));

        const success = await submitGrade(selectedAssignmentId, activeSubmission.submission_id, {
          score: numericScore,
          feedback: feedback.trim() || undefined,
          answer_grades: answerGrades.length > 0 ? answerGrades : undefined,
        });

        if (success) {
          // Update submission in state
          setSubmissions((prev) =>
            prev.map((s) =>
              s.submission_id === activeSubmission.submission_id
                ? {
                    ...s,
                    status: 'graded',
                    score: numericScore,
                    feedback: feedback.trim() || null,
                  }
                : s
            )
          );

          setSaveSuccessNotice(`Nilai ${activeSubmission.student_name} (${numericScore}/100) tersimpan!`);
          setTimeout(() => setSaveSuccessNotice(null), 3000);

          if (goToNext) {
            nextSubmission();
          }
        }
      } catch (err) {
        console.error('Failed to save grade:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedAssignmentId, activeSubmission, score, feedback, questionScores, questionFeedbacks, nextSubmission]
  );

  // Keyboard shortcut listeners (Alt + Right: Next, Alt + Left: Prev, Ctrl + Enter: Save & Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        nextSubmission();
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSubmission();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        saveCurrentGrade(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSubmission, prevSubmission, saveCurrentGrade]);

  // Statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.status === 'graded').length;
    const pending = submissions.filter((s) => s.status === 'submitted' || s.status === 'late' || s.status === 'resubmitted').length;
    const unsubmitted = submissions.filter((s) => s.status === 'unsubmitted').length;
    const percent = total > 0 ? Math.round((graded / total) * 100) : 0;
    return { total, graded, pending, unsubmitted, percent };
  }, [submissions]);

  return {
    assignmentList,
    selectedAssignmentId,
    setSelectedAssignmentId,
    assignment,
    submissions: filteredSubmissions,
    totalCount: submissions.length,
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
    selectSubmission: setActiveSubmissionIndex,
    prevSubmission,
    nextSubmission,
    saveCurrentGrade,
    stats,
    reload: loadSubmissionsData,
  };
}
