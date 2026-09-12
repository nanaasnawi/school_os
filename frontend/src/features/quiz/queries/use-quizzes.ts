import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useQuizzes() {
  return useQuery({
    queryKey: ['learning-quizzes'],
    queryFn: async () => {
      const response = await client.get({
        url: '/api/v1/learning/quizzes',
      });
      if (response.error) {
        throw new Error('Gagal mengambil daftar kuis');
      }
      return (response.data as { data: Record<string, unknown>[] })?.data || [];
    },
  });
}
