import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function usePublishAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await client.post({
        url: `/api/v1/learning/assignments/${assignmentId}/publish`,
      });

      if (response.error) {
        throw new Error('Gagal mempublikasikan tugas');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-assignments'] });
    },
  });
}
