/**
 * Teacher Reading Analytics Domain Types
 * Reading progress and material completion tracking
 */

export interface StudentReadingProgressRow {
  student_id: string;
  student_name: string;
  class_name: string;
  material_id: string;
  material_title: string;
  current_page: number;
  total_pages: number;
  completion_percentage: number;
  is_completed: boolean;
  last_read_at?: string | null;
  reading_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface MaterialAnalyticsOverview {
  material_id: string;
  title: string;
  class_name: string;
  total_assigned_students: number;
  completed_students_count: number;
  average_progress_percentage: number;
  median_pages_read: number;
}
