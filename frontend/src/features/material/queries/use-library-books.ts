import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { LibraryBook } from '../types/material';

export interface UseLibraryBooksOptions {
  classId?: string;
  subjectId?: string;
  gradeLevelId?: string;
  search?: string;
  recommendations?: boolean;
}

export function useLibraryBooks(options?: UseLibraryBooksOptions) {
  const { classId, subjectId, gradeLevelId, search, recommendations } = options || {};

  return useQuery<LibraryBook[]>({
    queryKey: ['learning-library-books', { classId, subjectId, gradeLevelId, search, recommendations }],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const params = new URLSearchParams();
      if (classId) params.append('class_id', classId);
      if (subjectId) params.append('subject_id', subjectId);
      if (gradeLevelId) params.append('grade_level_id', gradeLevelId);
      if (search) params.append('search', search);
      if (recommendations) params.append('recommendations', 'true');

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(getApiUrl(`/api/v1/learning/library/books${queryStr}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('Gagal mengambil katalog buku perpustakaan nasional');
      }
      const json = await res.json();
      return (json.data && Array.isArray(json.data)) ? json.data : [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
