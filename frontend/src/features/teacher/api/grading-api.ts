import { getApiUrl, apiClient } from '@/lib/api';
import type { GraderSubmissionItem, GraderQuestionAnswer } from '../types';

function getAuthHeaders(): HeadersInit {
  const token = apiClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AssignmentWithQuestions {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  max_score: number;
  due_at?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  subject_name?: string | null;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
    points: number;
    order_index?: number;
    choices?: Array<{
      id: string;
      choice_text: string;
      is_correct?: boolean;
    }>;
  }>;
}

export interface DetailedSubmission extends GraderSubmissionItem {
  answers: GraderQuestionAnswer[];
}

/**
 * Fetch all submissions for an assignment
 */
export async function fetchAssignmentSubmissions(assignmentId: string): Promise<DetailedSubmission[]> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${assignmentId}/submissions`), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];

    const json = await res.json();
    const rawList: any[] = json?.data || [];

    return rawList.map((item) => ({
      submission_id: item.id,
      assignment_id: item.assignment_id || assignmentId,
      student_id: item.student_id,
      student_name: item.student_name || 'Peserta Didik',
      student_nisn: item.student_nisn || null,
      class_name: item.class_name || null,
      status: item.status || 'submitted',
      score: item.score ?? null,
      max_score: 100,
      submitted_at: item.submitted_at || new Date().toISOString(),
      feedback: item.feedback || null,
      answers_count: Array.isArray(item.answers) ? item.answers.length : 0,
      has_essay: Array.isArray(item.answers) ? item.answers.some((a: any) => a.question_type === 'ESSAY') : true,
      answers: Array.isArray(item.answers)
        ? item.answers.map((a: any, idx: number) => ({
            question_id: a.question_id,
            question_number: idx + 1,
            question_type: (a.question_type as any) || 'ESSAY',
            prompt: a.question_text || `Soal #${idx + 1}`,
            max_points: a.max_points || 10,
            selected_choice_id: a.chosen_choice_id || null,
            selected_choice_text: a.chosen_choice_text || null,
            is_choice_correct: a.is_correct,
            essay_answer_text: a.text_answer || item.content || null,
            points_earned: a.points_earned ?? null,
            teacher_notes: a.teacher_feedback || null,
          }))
        : [],
    }));
  } catch (err) {
    console.error('Failed to fetch assignment submissions:', err);
    return [];
  }
}

/**
 * Fetch assignment detailed definition including questions
 */
export async function fetchAssignmentDetail(assignmentId: string): Promise<AssignmentWithQuestions | null> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${assignmentId}`), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const data = json?.data;
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      max_score: data.max_score || 100,
      due_at: data.due_at,
      class_id: data.class_id,
      class_name: data.class_name,
      subject_name: data.subject_name,
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  } catch (err) {
    console.error('Failed to fetch assignment detail:', err);
    return null;
  }
}

/**
 * Submit score and feedback for a student submission
 */
export async function submitGrade(
  assignmentId: string,
  submissionId: string,
  payload: {
    score: number;
    feedback?: string;
    answer_grades?: Array<{
      question_id: string;
      points_earned: number;
      teacher_feedback?: string;
    }>;
  }
): Promise<boolean> {
  try {
    const res = await fetch(
      getApiUrl(`/api/v1/learning/assignments/${assignmentId}/submissions/${submissionId}/grade`),
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return res.ok;
  } catch (err) {
    console.error('Failed to submit grade:', err);
    return false;
  }
}
