import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useLessons() {
  return useQuery({
    queryKey: ['learning-lessons'],
    queryFn: async () => {
      const response = await client.get({
        url: '/api/v1/learning/lessons',
      });
      if (response.error) {
        throw new Error('Gagal mengambil daftar modul pembelajaran');
      }
      return (response.data as { data: Record<string, unknown>[] })?.data || [];
    },
  });
}
