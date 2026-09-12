import { z } from 'zod';

export const quizFormSchema = z.object({
  lesson_id: z.string().uuid('ID Lesson tidak valid'),
  title: z.string().min(3, 'Judul kuis minimal 3 karakter'),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, 'Durasi minimal 1 menit'),
  passing_grade: z.number().min(0, 'Nilai kelulusan minimal 0').max(100, 'Nilai kelulusan maksimal 100'),
});

export type QuizFormValues = z.infer<typeof quizFormSchema>;
