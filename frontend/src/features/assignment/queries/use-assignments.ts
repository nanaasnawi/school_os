import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useAssignments() {
  return useQuery({
    queryKey: ['learning-assignments'],
    queryFn: async () => {
      const response = await client.get({
        url: '/api/v1/learning/assignments',
      });
      if (response.error) {
        throw new Error('Gagal mengambil daftar tugas');
      }
      return (response.data as { data: Record<string, unknown>[] })?.data || [];
    },
  });
}
