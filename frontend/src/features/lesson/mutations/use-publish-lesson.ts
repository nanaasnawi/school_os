import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function usePublishLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await client.post({
        url: `/api/v1/learning/lessons/${lessonId}/publish`,
      });

      if (response.error) {
        throw new Error('Gagal mempublikasikan modul pembelajaran. Pastikan minimal 1 materi sudah terpasang.');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-lessons'] });
    },
  });
}
