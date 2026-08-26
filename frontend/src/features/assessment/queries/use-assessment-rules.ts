import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export function useAssessmentRules() {
  return useQuery({
    queryKey: ['assessment-rules'],
    queryFn: async () => {
      const response = await client.get({
        url: '/api/v1/learning/assessments/rules',
      });
      if (response.error) {
        throw new Error('Gagal mengambil data aturan penilaian');
      }
      return (response.data as { data: Record<string, unknown> })?.data || {
        components: [
          { type: 'Assignment', weight: 25 },
          { type: 'Quiz', weight: 25 },
          { type: 'MidtermExam', weight: 20 },
          { type: 'FinalExam', weight: 30 },
        ],
        minimum_passing_grade: 75,
      };
    },
  });
}
