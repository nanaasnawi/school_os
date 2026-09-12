import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';
import { QuizFormValues } from '../schemas/quiz-schema';

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: QuizFormValues) => {
      const response = await client.post({
        url: '/api/v1/learning/quizzes',
        body: {
          lesson_id: values.lesson_id,
          title: values.title,
          description: values.description || null,
          duration_minutes: values.duration_minutes,
          passing_grade: values.passing_grade,
        },
      });

      if (response.error) {
        throw new Error('Gagal membuat kuis baru');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-quizzes'] });
    },
  });
}
