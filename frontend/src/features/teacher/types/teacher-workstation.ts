/**
 * Teacher Workstation Domain Types
 * School OS Enterprise Platform
 */

export interface TeacherProfile {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  nip?: string | null;
  nuptk?: string | null;
  full_name: string;
  email?: string | null;
  no_hp?: string | null;
  subject?: string | null;
  status_kepegawaian?: string | null;
  is_active: boolean;
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  grade_level_id?: string | null;
  grade_level_name?: string | null;
  academic_year_id: string;
  academic_year_name?: string | null;
  student_count: number;
  subject_name?: string | null;
}

export interface TodayScheduleItem {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  start_time: string; // e.g. "08:00"
  end_time: string;   // e.g. "09:30"
  room?: string | null;
  is_current: boolean;
  is_upcoming: boolean;
}

export interface TeacherWorkstationStats {
  total_assigned_classes: number;
  total_students: number;
  pending_essay_submissions: number;
  active_quizzes_count: number;
  unread_inquiries_count: number;
  average_class_reading_progress: number; // 0 - 100 percentage
}

export interface ClassStudentDto {
  id: string;
  full_name: string;
  nisn: string;
  gender?: string | null;
  status: string;
  no_hp?: string | null;
  email?: string | null;
  class_id: string;
  class_name: string;
}

export interface ClassStudentStats {
  total: number;
  activeCount: number;
  maleCount: number;
  femaleCount: number;
  hasPhoneCount: number;
}
