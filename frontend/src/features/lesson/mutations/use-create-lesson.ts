import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';
import { LessonFormValues } from '../schemas/lesson-schema';

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: LessonFormValues) => {
      const response = await client.post({
        url: '/api/v1/learning/lessons',
        body: {
          syllabus_id: values.syllabus_id,
          title: values.title,
          summary: values.summary || null,
          order_index: values.order_index,
          material_ids: values.material_ids,
        },
      });

      if (response.error) {
        throw new Error('Gagal membuat modul pembelajaran');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-lessons'] });
    },
  });
}
