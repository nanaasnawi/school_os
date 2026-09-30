import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { LearningAssignment } from '../types/assignment';

async function fetchAssignments(): Promise<LearningAssignment[]> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
  const res = await fetch(getApiUrl('/api/v1/learning/assignments'), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Gagal memuat daftar tugas');
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export function useAssignments() {
  return useQuery({
    queryKey: ['learning-assignments'],
    queryFn: fetchAssignments,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

async function fetchAssignmentById(id: string): Promise<LearningAssignment | null> {
  if (!id) return null;
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
  const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${id}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Gagal memuat rincian tugas');
  }
  const json = await res.json();
  return json?.data || null;
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ['learning-assignment', id],
    queryFn: () => fetchAssignmentById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}
