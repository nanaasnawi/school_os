import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useCloseAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await client.post({
        url: `/api/v1/learning/assignments/${assignmentId}/close`,
      });

      if (response.error) {
        throw new Error('Gagal menutup tugas');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-assignments'] });
    },
  });
}
