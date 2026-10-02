import { getApiUrl, apiClient } from '@/lib/api';
import type {
  StudentReadingProgressRow,
  MaterialAnalyticsOverview,
  TeacherReadingMetrics,
} from '../types';

function getAuthHeaders(): HeadersInit {
  const token = apiClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all materials taught by teacher with analytics metadata
 */
export async function fetchMaterialsAnalyticsList(): Promise<MaterialAnalyticsOverview[]> {
  try {
    const res = await fetch(getApiUrl('/api/v1/learning/materials'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw: any[] = json?.data?.items || json?.data || [];

    return raw.map((m) => {
      const start = m.start_page ?? 1;
      const end = m.end_page ?? 15;
      const totalPages = Math.max(1, (end - start) + 1);
      const completed = Number(m.completed_count || 0);

      const assigned = Number(m.total_students || m.student_count || 0) || (completed > 0 ? completed : 0);
      const avgProgress = assigned > 0 ? Math.min(100, Math.round((completed / assigned) * 100)) : (completed > 0 ? 100 : 0);

      return {
        material_id: m.id,
        title: m.title || 'Materi Pembelajaran',
        material_type: m.material_type || 'document',
        class_name: m.class_name || 'Semua Rombel',
        class_id: m.class_id || null,
        subject_name: m.subject_name || 'Umum',
        start_page: start,
        end_page: end,
        total_pages: totalPages,
        total_assigned_students: assigned,
        completed_students_count: completed,
        average_progress_percentage: avgProgress,
      };
    });
  } catch (err) {
    console.error('Failed to fetch materials analytics list:', err);
    return [];
  }
}

/**
 * Fetch student-level reading progress for a given material
 */
export async function fetchMaterialReadingProgress(
  materialId: string,
  materialTitle: string,
  totalPages: number = 15,
  subjectName?: string | null
): Promise<StudentReadingProgressRow[]> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/materials/${materialId}/completions`), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const completions: any[] = json?.data || [];

    return completions.map((c) => {
      const isCompleted = Boolean(c.is_completed);
      const currPage = c.current_page ?? (isCompleted ? totalPages : Math.max(1, Math.round(totalPages * 0.4)));
      const pct = isCompleted ? 100 : Math.min(99, Math.round((currPage / totalPages) * 100));

      let readingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (isCompleted) {
        readingStatus = 'COMPLETED';
      } else if (currPage > 1) {
        readingStatus = 'IN_PROGRESS';
      }

      return {
        id: `${c.student_id}-${materialId}`,
        student_id: c.student_id,
        student_name: c.student_name || 'Peserta Didik',
        nisn: c.nisn || null,
        gender: c.gender || null,
        class_name: c.class_name || 'Rombel Belajar',
        class_id: c.class_id || null,
        material_id: materialId,
        material_title: materialTitle,
        subject_name: subjectName || 'Mata Pelajaran',
        current_page: currPage,
        total_pages: totalPages,
        completion_percentage: pct,
        is_completed: isCompleted,
        last_read_at: c.last_read_at || c.completed_at || null,
        completed_at: c.completed_at || null,
        reading_status: readingStatus,
      };
    });
  } catch (err) {
    console.error(`Failed to fetch reading progress for material ${materialId}:`, err);
    return [];
  }
}

/**
 * Fetch aggregated reading progress across top materials
 */
export async function fetchAllTeacherReadingAnalytics(): Promise<{
  materials: MaterialAnalyticsOverview[];
  readingRows: StudentReadingProgressRow[];
  metrics: TeacherReadingMetrics;
}> {
  try {
    const materials = await fetchMaterialsAnalyticsList();
    if (materials.length === 0) {
      return {
        materials: [],
        readingRows: [],
        metrics: {
          total_materials: 0,
          total_readers: 0,
          completed_readers: 0,
          overall_completion_rate: 0,
          total_pages_read: 0,
        },
      };
    }

    // Fetch completions in parallel for top materials
    const progressPromises = materials.slice(0, 10).map((m) =>
      fetchMaterialReadingProgress(m.material_id, m.title, m.total_pages, m.subject_name)
    );

    const results = await Promise.all(progressPromises);
    const flattenedRows: StudentReadingProgressRow[] = results.flat();

    const totalReaders = flattenedRows.length;
    const completedReaders = flattenedRows.filter((r) => r.is_completed).length;
    const totalPagesRead = flattenedRows.reduce((acc, r) => acc + (r.current_page || 0), 0);
    const overallRate = totalReaders > 0 ? Math.round((completedReaders / totalReaders) * 100) : 0;

    return {
      materials,
      readingRows: flattenedRows,
      metrics: {
        total_materials: materials.length,
        total_readers: totalReaders,
        completed_readers: completedReaders,
        overall_completion_rate: overallRate,
        total_pages_read: totalPagesRead,
      },
    };
  } catch (err) {
    console.error('Failed to aggregate teacher reading analytics:', err);
    return {
      materials: [],
      readingRows: [],
      metrics: {
        total_materials: 0,
        total_readers: 0,
        completed_readers: 0,
        overall_completion_rate: 0,
        total_pages_read: 0,
      },
    };
  }
}
