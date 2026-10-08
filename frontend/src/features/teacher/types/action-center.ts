/**
 * Teacher Action Center Domain Types
 * Identifies students needing follow-up actions and pending teacher obligations.
 */

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskCategory = 
  | 'UNREAD_MATERIAL'       // Reading progress lagging behind class average
  | 'OVERDUE_ASSIGNMENT'     // Missing assignment submissions
  | 'LOW_SCORE'              // Below minimum passing grade (KKM)
  | 'LOW_ATTENDANCE';        // High absence rate

export interface AtRiskStudent {
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  nisn?: string | null;
  risk_level: RiskLevel;
  category: RiskCategory;
  title: string;             // Short alert: "2 Tugas Bahasa Indonesia belum dikerjakan"
  description: string;       // Detailed explanation: "Belum mengumpulkan Analisis Teks sejak 28 Sep"
  action_label: string;      // Action button text: "Kirim Pengingat" / "Beri Remedial"
  action_type: 'REMIND_STUDENT' | 'CONTACT_GUARDIAN' | 'ASSIGN_REMEDIAL' | 'VIEW_PROGRESS';
  target_url?: string;
  updated_at: string;
}

export interface PendingGradingTask {
  assignment_id: string;
  assignment_title: string;
  class_id: string;
  class_name: string;
  subject_name: string;
  due_date: string;
  total_submissions: number;
  graded_count: number;
  pending_count: number;
  has_essay_questions: boolean;
}

export interface ActiveCbtSummary {
  quiz_id: string;
  quiz_title: string;
  class_name: string;
  start_time: string;
  end_time: string;
  total_participants: number;
  in_progress_count: number;
  completed_count: number;
}

export interface TeacherRecentMaterial {
  id: string;
  title: string;
  subject_name?: string;
  class_name?: string;
  class_id?: string;
  material_type?: string;
  created_at?: string;
  description?: string;
  start_page?: number;
  end_page?: number;
  total_pages?: number;
  completed_count?: number;
  total_students?: number;
  reading_progress?: number;
}

