import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { LearningMaterial } from '../types/material';

async function fetchMaterials(): Promise<LearningMaterial[]> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
  const res = await fetch(getApiUrl('/api/v1/learning/materials'), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Gagal memuat materi pembelajaran');
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export function useMaterials() {
  return useQuery({
    queryKey: ['learning-materials'],
    queryFn: fetchMaterials,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}
