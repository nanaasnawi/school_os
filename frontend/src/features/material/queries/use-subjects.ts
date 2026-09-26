import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { AcademicSubject } from '../types/material';

export function useSubjects() {
  return useQuery<AcademicSubject[]>({
    queryKey: ['academic-subjects'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl('/api/v1/academic/subjects'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('Gagal mengambil daftar mata pelajaran');
      }
      const json = await res.json();
      return (json.data && Array.isArray(json.data)) ? json.data : [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
