export interface LibraryBook {
  id: string;
  title: string;
  subject_name?: string;
  grade_level_name?: string;
  author?: string;
  publisher?: string;
  cover_url?: string;
  file_url?: string;
  total_pages?: number;
  description?: string;
  created_at?: string;
}

export interface AcademicSubject {
  id: string;
  name: string;
  code?: string;
  grade_level?: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
  material_type?: string;
  storage_key?: string;
  external_url?: string;
  completed_count?: number;
  created_at?: string;
  description?: string;
  start_page?: number;
  end_page?: number;
  source_type?: string;
}
