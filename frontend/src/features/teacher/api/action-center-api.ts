import { getApiUrl, apiClient } from '@/lib/api';
import type { AtRiskStudent, PendingGradingTask, ActiveCbtSummary } from '../types';
import { fetchCurrentTeacherProfile } from './teacher-api';

function getAuthHeaders(): HeadersInit {
  const token = apiClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch students needing attention (unread materials, overdue assignments, low scores)
 */
export async function fetchAtRiskStudents(classId?: string, existingProfile?: any): Promise<AtRiskStudent[]> {
  try {
    // 1. Fetch live assignments to detect overdue or low-scoring submissions
    const res = await fetch(getApiUrl('/api/v1/learning/assignments'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];

    const json = await res.json();
    const assignments: any[] = json?.data?.items || json?.data || [];

    const profile = existingProfile || await fetchCurrentTeacherProfile().catch(() => null);
    const currentTeacherId = profile?.id;
    const currentUserId = profile?.user_id;

    const teacherAssignments = assignments.filter((a) => {
      if (!currentTeacherId && !currentUserId && !profile?.full_name) return true;
      return (
        a.teacher_id === currentTeacherId ||
        a.created_by === currentTeacherId ||
        (currentUserId && (a.teacher_id === currentUserId || a.created_by === currentUserId)) ||
        (profile?.full_name && a.teacher_name && a.teacher_name.trim().toLowerCase() === profile.full_name.trim().toLowerCase())
      );
    });

    const atRisk: AtRiskStudent[] = [];

    // Check recent assignments in parallel
    await Promise.all(
      teacherAssignments.slice(0, 5).map(async (a) => {
        if (classId && a.class_id && a.class_id !== classId) return;

        try {
          const subRes = await fetch(getApiUrl(`/api/v1/learning/assignments/${a.id}/submissions`), {
            headers: getAuthHeaders(),
          });
          if (subRes.ok) {
            const subJson = await subRes.json();
            const subs: any[] = subJson?.data || [];

            for (const s of subs) {
              // Flag 1: Low score (< 70)
              if (s.score !== null && s.score !== undefined && s.score < 70) {
                atRisk.push({
                  student_id: s.student_id,
                  student_name: s.student_name || 'Peserta Didik',
                  class_id: a.class_id || '',
                  class_name: a.class_name || 'Rombel',
                  nisn: s.student_nisn || null,
                  risk_level: s.score < 60 ? 'HIGH' : 'MEDIUM',
                  category: 'LOW_SCORE',
                  title: `Nilai ${a.title} di bawah KKM (${s.score}/100)`,
                  description: `Siswa memperoleh skor ${s.score}. Perlu diberikan bimbingan atau tugas remedial.`,
                  action_label: 'Beri Remedial',
                  action_type: 'ASSIGN_REMEDIAL',
                  target_url: `/dashboard/learning/assignments?id=${a.id}`,
                  updated_at: s.submitted_at || new Date().toISOString(),
                });
              }
            }
          }
        } catch {
          // non-critical
        }
      })
    );

    // Flag 2: Reading progress check
    try {
      const matRes = await fetch(getApiUrl('/api/v1/learning/materials'), {
        headers: getAuthHeaders(),
      });
      if (matRes.ok) {
        const matJson = await matRes.json();
        const materials: any[] = matJson?.data?.items || matJson?.data || [];
        if (materials.length > 0) {
          const recentMat = materials[0];
          const compRes = await fetch(getApiUrl(`/api/v1/learning/materials/${recentMat.id}/completions`), {
            headers: getAuthHeaders(),
          });
          if (compRes.ok) {
            const compJson = await compRes.json();
            const completions: any[] = compJson?.data || [];
            for (const c of completions) {
              if (classId && c.class_id && c.class_id !== classId) continue;
              if (!c.is_completed && (c.current_page || 0) < 3) {
                atRisk.push({
                  student_id: c.student_id,
                  student_name: c.student_name || 'Peserta Didik',
                  class_id: c.class_id || recentMat.class_id || '',
                  class_name: c.class_name || recentMat.class_name || 'Rombel',
                  nisn: c.nisn || null,
                  risk_level: 'MEDIUM',
                  category: 'UNREAD_MATERIAL',
                  title: `Belum Membaca Materi ${recentMat.title}`,
                  description: `Siswa baru membaca sampai halaman ${c.current_page || 1}. Diperlukan pengingat literasi.`,
                  action_label: 'Kirim Pengingat',
                  action_type: 'REMIND_STUDENT',
                  target_url: `/dashboard/learning/materials?id=${recentMat.id}`,
                  updated_at: c.last_read_at || new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    } catch {
      // non-critical
    }

    return atRisk;
  } catch (err) {
    console.error('Failed to fetch at-risk students:', err);
    return [];
  }
}

/**
 * Fetch pending grading tasks (assignments awaiting teacher correction)
 */
export async function fetchPendingGradingTasks(existingProfile?: any): Promise<PendingGradingTask[]> {
  try {
    const res = await fetch(getApiUrl('/api/v1/learning/assignments'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];

    const json = await res.json();
    const assignments: any[] = json?.data?.items || json?.data || [];

    const profile = existingProfile || await fetchCurrentTeacherProfile().catch(() => null);
    const currentTeacherId = profile?.id;
    const currentUserId = profile?.user_id;

    const teacherAssignments = assignments.filter((a) => {
      if (!currentTeacherId && !currentUserId && !profile?.full_name) return true;
      return (
        a.teacher_id === currentTeacherId ||
        a.created_by === currentTeacherId ||
        (currentUserId && (a.teacher_id === currentUserId || a.created_by === currentUserId)) ||
        (profile?.full_name && a.teacher_name && a.teacher_name.trim().toLowerCase() === profile.full_name.trim().toLowerCase())
      );
    });

    const pendingTasks: PendingGradingTask[] = [];

    // Check submissions in parallel
    await Promise.all(
      teacherAssignments.slice(0, 8).map(async (a) => {
        try {
          const subRes = await fetch(getApiUrl(`/api/v1/learning/assignments/${a.id}/submissions`), {
            headers: getAuthHeaders(),
          });
          if (subRes.ok) {
            const subJson = await subRes.json();
            const subs: any[] = subJson?.data || [];

            const graded = subs.filter((s) => s.status === 'graded').length;
            const pending = subs.filter((s) => s.status !== 'graded').length;

            if (pending > 0 || subs.length > 0) {
              pendingTasks.push({
                assignment_id: a.id,
                assignment_title: a.title,
                class_id: a.class_id || '',
                class_name: a.class_name || 'Rombel',
                subject_name: a.subject_name || 'Mata Pelajaran',
                due_date: a.due_date || '',
                total_submissions: subs.length,
                graded_count: graded,
                pending_count: pending,
                has_essay_questions: true,
              });
            }
          }
        } catch {
          // non-critical
        }
      })
    );

    return pendingTasks;
  } catch (err) {
    console.error('Failed to fetch pending grading tasks:', err);
    return [];
  }
}

/**
 * Fetch active CBT / Quizzes in progress
 */
export async function fetchActiveCbts(): Promise<ActiveCbtSummary[]> {
  try {
    const res = await fetch(getApiUrl('/api/v1/learning/quizzes'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];

    const json = await res.json();
    const quizzes: any[] = json?.data?.items || json?.data || [];

    return quizzes
      .filter((q) => q.is_published ?? true)
      .map((q) => ({
        quiz_id: q.id,
        quiz_title: q.title,
        class_name: q.class_name || 'Semua Rombel',
        start_time: q.starts_at || 'Hari ini',
        end_time: q.ends_at || 'Selesai',
        total_participants: q.total_participants ?? q.participant_count ?? 0,
        in_progress_count: q.in_progress_count ?? 0,
        completed_count: q.completed_count ?? 0,
      }));
  } catch (err) {
    console.error('Failed to fetch active CBTs:', err);
    return [];
  }
}
