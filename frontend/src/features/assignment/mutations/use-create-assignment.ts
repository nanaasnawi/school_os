import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';
import { AssignmentFormValues } from '../schemas/assignment-schema';

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AssignmentFormValues) => {
      const response = await client.post({
        url: '/api/v1/learning/assignments',
        body: {
          lesson_id: values.lesson_id,
          title: values.title,
          description: values.description || null,
          due_date: new Date(values.due_date).toISOString(),
          max_score: values.max_score,
        },
      });

      if (response.error) {
        throw new Error('Gagal membuat tugas baru');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-assignments'] });
    },
  });
}
