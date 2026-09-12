import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/sdk/client.gen';

export interface GradeSubmissionParams {
  assignmentId: string;
  submissionId: string;
  score: number;
  feedback?: string;
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, submissionId, score, feedback }: GradeSubmissionParams) => {
      const response = await client.post({
        url: `/api/v1/learning/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        body: {
          score,
          feedback: feedback || null,
        },
      });

      if (response.error) {
        throw new Error('Gagal menyimpan nilai submission');
      }

      return (response.data as { data: Record<string, unknown> })?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['learning-assignments'] });
    },
  });
}
