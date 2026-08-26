import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useMaterials() {
  return useQuery({
    queryKey: ['learning-materials'],
    queryFn: async () => {
      const response = await client.get({
        url: '/api/v1/learning/materials',
      });
      if (response.error) {
        throw new Error('Gagal mengambil daftar materi pembelajaran');
      }
      return (response.data as { data: Record<string, unknown>[] })?.data || [];
    },
  });
}
