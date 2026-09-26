import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { LibraryBook } from '../types/material';

export function useLibraryBooks() {
  return useQuery<LibraryBook[]>({
    queryKey: ['learning-library-books'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl('/api/v1/learning/library/books'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('Gagal mengambil katalog buku perpustakaan nasional');
      }
      const json = await res.json();
      return (json.data && Array.isArray(json.data)) ? json.data : [];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (static library catalog)
  });
}
