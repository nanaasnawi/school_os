import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { AssignmentSubmission } from '../types/assignment';

async function fetchSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  if (!assignmentId) return [];
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
  const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${assignmentId}/submissions`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Gagal memuat daftar pengumpulan tugas');
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['learning-assignment-submissions', assignmentId],
    queryFn: () => fetchSubmissions(assignmentId),
    enabled: Boolean(assignmentId),
    staleTime: 1000 * 30,
  });
}
