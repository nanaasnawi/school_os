import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useGradebook() {
  return useQuery({
    queryKey: ['assessment-gradebook'],
    queryFn: async () => {
      const response = await client.get({
        url: '/api/v1/learning/assessments/gradebook',
      });
      if (response.error) {
        throw new Error('Gagal mengambil data GradeBook');
      }
      return (response.data as { data: Record<string, unknown>[] })?.data || [];
    },
  });
}
