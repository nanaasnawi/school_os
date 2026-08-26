import { z } from 'zod';

export const lessonFormSchema = z.object({
  syllabus_id: z.string().uuid('ID Silabus tidak valid'),
  title: z.string().min(3, 'Judul pembelajaran minimal 3 karakter'),
  summary: z.string().optional(),
  order_index: z.number().min(1, 'Urutan modul minimal 1'),
  material_ids: z.array(z.string().uuid()).min(1, 'Pilih minimal 1 Materi Pembelajaran'),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;
