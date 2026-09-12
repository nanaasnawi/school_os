import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';
import { MaterialFormValues } from '../schemas/material-schema';

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: MaterialFormValues) => {
      const response = await client.post({
        url: '/api/v1/learning/materials',
        body: {
          subject_id: values.subject_id,
          title: values.title,
          content: values.content || null,
          file_url: values.file_url || null,
          material_type: values.material_type,
        },
      });

      if (response.error) {
        throw new Error('Gagal membuat materi pembelajaran');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-materials'] });
    },
  });
}
