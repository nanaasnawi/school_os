/**
 * Teacher Inquiry & Consultation Domain Types
 * Two-way communication between students (Android) and teachers (Web Workstation)
 * School OS Enterprise Platform
 */

export interface InquiryThread {
  id: string;
  student_id: string;
  student_name: string;
  student_class: string;
  teacher_id?: string | null;
  teacher_name: string;
  subject_name: string;
  inquiry_type: 'MATERIAL' | 'ASSIGNMENT' | 'GENERAL' | string;
  reference_title: string;
  reference_id?: string | null;
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | string;
  last_message_content?: string | null;
  last_message_at: string;
  created_at: string;
  message_count: number;
  student_last_read_at?: string | null;
  teacher_last_read_at?: string | null;
  is_read?: boolean;
  read_status_label?: string | null;
}

export interface InquiryMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'TEACHER' | 'STUDENT' | string;
  content: string;
  is_from_teacher: boolean;
  created_at: string;
  is_read?: boolean;
  read_at?: string | null;
}

export interface InquiryDetail {
  thread: InquiryThread;
  messages: InquiryMessage[];
}

export interface InquiryMetrics {
  total_inquiries: number;
  open_inquiries: number;
  answered_inquiries: number;
  resolved_inquiries: number;
}
