/**
 * Teacher Reading Analytics Domain Types
 * Reading progress and material completion tracking
 * School OS Enterprise Platform
 */

export interface StudentReadingProgressRow {
  id: string; // Unique row key
  student_id: string;
  student_name: string;
  nisn?: string | null;
  gender?: string | null;
  class_name: string;
  class_id?: string | null;
  material_id: string;
  material_title: string;
  material_type?: string;
  subject_name?: string | null;
  current_page: number;
  total_pages: number;
  completion_percentage: number;
  is_completed: boolean;
  last_read_at?: string | null;
  completed_at?: string | null;
  reading_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface MaterialAnalyticsOverview {
  material_id: string;
  title: string;
  material_type: string;
  class_name: string;
  class_id?: string | null;
  subject_name: string;
  start_page?: number | null;
  end_page?: number | null;
  total_pages: number;
  total_assigned_students: number;
  completed_students_count: number;
  average_progress_percentage: number;
  median_pages_read?: number;
}

export interface TeacherReadingMetrics {
  total_materials: number;
  total_readers: number;
  completed_readers: number;
  overall_completion_rate: number;
  total_pages_read: number;
}
