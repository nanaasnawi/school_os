/**
 * Mass Essay Grader Domain Types
 * Fast-paced grading workstation interfaces
 */

export interface GraderSubmissionItem {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_nisn?: string | null;
  class_name?: string | null;
  status: 'submitted' | 'graded' | 'late' | 'resubmitted';
  score?: number | null;
  max_score: number;
  submitted_at: string;
  feedback?: string | null;
  answers_count: number;
  has_essay: boolean;
}

export interface GraderQuestionAnswer {
  question_id: string;
  question_number: number;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY' | 'FILE_UPLOAD';
  prompt: string;
  max_points: number;
  // Answer details
  selected_choice_id?: string | null;
  selected_choice_text?: string | null;
  is_choice_correct?: boolean | null;
  essay_answer_text?: string | null;
  points_earned?: number | null;
  teacher_notes?: string | null;
}

export interface SubmissionGradingPayload {
  submission_id: string;
  score: number;
  feedback?: string;
  question_scores: {
    question_id: string;
    points_earned: number;
    teacher_notes?: string;
  }[];
}
