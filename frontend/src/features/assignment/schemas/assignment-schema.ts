import { z } from 'zod';

export const assignmentFormSchema = z.object({
  lesson_id: z.string().uuid('ID Lesson tidak valid'),
  title: z.string().min(3, 'Judul tugas minimal 3 karakter'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Tanggal pengumpulan wajib diisi'),
  max_score: z.number().min(1, 'Nilai maksimum minimal 1').max(100, 'Nilai maksimum maksimal 100'),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export const gradeSubmissionSchema = z.object({
  score: z.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
  feedback: z.string().optional(),
});

export type GradeSubmissionFormValues = z.infer<typeof gradeSubmissionSchema>;
