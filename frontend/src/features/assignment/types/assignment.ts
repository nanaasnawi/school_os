export interface QuestionChoice {
  choice_text: string;
  is_correct: boolean;
}

export interface AssignmentQuestion {
  id?: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY';
  points: number;
  choices: QuestionChoice[];
}

export interface LearningAssignment {
  id: string;
  tenant_id?: string;
  lesson_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  max_score?: number;
  due_at?: string;
  assignment_type?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  class_id?: string;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
  questions?: AssignmentQuestion[];
}

export interface SubmissionAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  max_points: number;
  chosen_choice_id?: string;
  chosen_choice_text?: string;
  is_correct?: boolean;
  text_answer?: string;
  points_earned: number;
  teacher_feedback?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name?: string;
  student_nisn?: string;
  content?: string;
  file_url?: string;
  status: string;
  score?: number | null;
  feedback?: string | null;
  submitted_at?: string;
  graded_at?: string;
  answers?: SubmissionAnswer[];
}
