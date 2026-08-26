import { z } from 'zod';

export const materialFormSchema = z.object({
  subject_id: z.string().uuid('ID Mata Pelajaran tidak valid'),
  title: z.string().min(3, 'Judul materi minimal 3 karakter'),
  content: z.string().optional(),
  file_url: z.string().url('URL file tidak valid').optional().or(z.literal('')),
  material_type: z.enum(['pdf', 'video', 'document', 'link', 'audio']),
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;
