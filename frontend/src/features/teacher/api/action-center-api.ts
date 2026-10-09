import { getApiUrl, apiClient } from '@/lib/api';
import type { AtRiskStudent, PendingGradingTask, ActiveCbtSummary, TeacherRecentMaterial } from '../types';
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
    const headers = getAuthHeaders();
    const isFilteredClass = classId && classId !== 'ALL';

    // 1. Fetch classes list to build accurate id-to-name and name-to-id maps
    const [classesRes, assignmentsRes, materialsRes] = await Promise.all([
      fetch(getApiUrl('/api/v1/academic/classes?page_size=200'), { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(getApiUrl('/api/v1/learning/assignments'), { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(getApiUrl('/api/v1/learning/materials'), { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const rawClasses: any[] = classesRes?.data?.items || classesRes?.data || [];
    const classNameToId = new Map<string, string>();
    const classIdToName = new Map<string, string>();
    for (const c of rawClasses) {
      if (c.id && c.name) {
        classNameToId.set(c.name.trim().toLowerCase(), c.id);
        classIdToName.set(c.id, c.name.trim());
      }
    }

    const targetClass = isFilteredClass ? rawClasses.find((c) => c.id === classId) : null;
    const targetClassNameLower = targetClass?.name?.trim().toLowerCase();

    const profile = existingProfile || await fetchCurrentTeacherProfile().catch(() => null);
    const currentTeacherId = profile?.id;
    const currentUserId = profile?.user_id;

    const rawAssignments: any[] = assignmentsRes?.data?.items || assignmentsRes?.data || [];
    let teacherAssignments = rawAssignments.filter((a) => {
      if (!currentTeacherId && !currentUserId && !profile?.full_name) return true;
      return (
        a.teacher_id === currentTeacherId ||
        a.created_by === currentTeacherId ||
        (currentUserId && (a.teacher_id === currentUserId || a.created_by === currentUserId)) ||
        (profile?.full_name && a.teacher_name && a.teacher_name.trim().toLowerCase() === profile.full_name.trim().toLowerCase())
      );
    });

    if (teacherAssignments.length === 0 && rawAssignments.length > 0) {
      teacherAssignments = rawAssignments;
    }

    if (isFilteredClass) {
      teacherAssignments = teacherAssignments.filter((a) => {
        if (a.class_id && a.class_id === classId) return true;
        if (targetClassNameLower && a.class_name && a.class_name.trim().toLowerCase() === targetClassNameLower) return true;
        return false;
      });
    }

    const atRisk: AtRiskStudent[] = [];
    const seenRiskKeys = new Set<string>();

    // Check recent assignments for low scores (< 70)
    await Promise.all(
      teacherAssignments.slice(0, 5).map(async (a) => {
        try {
          const subRes = await fetch(getApiUrl(`/api/v1/learning/assignments/${a.id}/submissions`), {
            headers,
          });
          if (subRes.ok) {
            const subJson = await subRes.json();
            const subs: any[] = subJson?.data || [];

            for (const s of subs) {
              const studentClassId = a.class_id || (a.class_name ? classNameToId.get(a.class_name.trim().toLowerCase()) : '') || '';
              const studentClassName = a.class_name || (studentClassId ? classIdToName.get(studentClassId) : '') || 'Rombel';

              if (isFilteredClass) {
                if (studentClassId && studentClassId !== classId) continue;
                if (targetClassNameLower && studentClassName.trim().toLowerCase() !== targetClassNameLower) continue;
              }

              // Flag: Low score (< 70)
              if (s.score !== null && s.score !== undefined && Number(s.score) < 70) {
                const riskKey = `${s.student_id}_LOW_SCORE_${a.id}`;
                if (!seenRiskKeys.has(riskKey)) {
                  seenRiskKeys.add(riskKey);
                  atRisk.push({
                    student_id: s.student_id,
                    student_name: s.student_name || 'Peserta Didik',
                    class_id: studentClassId,
                    class_name: studentClassName,
                    nisn: s.student_nisn || null,
                    risk_level: Number(s.score) < 60 ? 'HIGH' : 'MEDIUM',
                    category: 'LOW_SCORE',
                    title: `Nilai ${a.title} di bawah KKM (${s.score}/100)`,
                    description: `Siswa memperoleh skor ${s.score}. Perlu diberikan bimbingan atau tugas remedial.`,
                    action_label: 'Beri Remedial',
                    action_type: 'ASSIGN_REMEDIAL',
                    assignment_id: a.id,
                    target_url: `/dashboard/learning/assignments?id=${a.id}`,
                    updated_at: s.submitted_at || new Date().toISOString(),
                  });
                }
              }
            }
          }
        } catch {
          // non-critical
        }
      })
    );

    // Check reading progress for learning materials
    const rawMaterials: any[] = materialsRes?.data?.items || materialsRes?.data || [];
    let relevantMaterials = rawMaterials;

    if (isFilteredClass) {
      relevantMaterials = rawMaterials.filter((m) => {
        if (m.class_id && m.class_id === classId) return true;
        if (targetClassNameLower && m.class_name && m.class_name.trim().toLowerCase() === targetClassNameLower) return true;
        return false;
      });
    }

    // Inspect up to 4 relevant materials in parallel
    await Promise.all(
      relevantMaterials.slice(0, 4).map(async (mat) => {
        try {
          const compRes = await fetch(getApiUrl(`/api/v1/learning/materials/${mat.id}/completions`), {
            headers,
          });
          if (compRes.ok) {
            const compJson = await compRes.json();
            const completions: any[] = compJson?.data || [];

            for (const c of completions) {
              const studentClassId =
                mat.class_id ||
                (c.class_name ? classNameToId.get(c.class_name.trim().toLowerCase()) : '') ||
                '';
              const studentClassName =
                c.class_name ||
                mat.class_name ||
                (studentClassId ? classIdToName.get(studentClassId) : '') ||
                'Rombel';

              if (isFilteredClass) {
                if (studentClassId && studentClassId !== classId) continue;
                if (targetClassNameLower && studentClassName.trim().toLowerCase() !== targetClassNameLower) continue;
              }

              // Flag: unread or reading progress lagging (< page 3)
              if (!c.is_completed && Number(c.current_page || 0) < 3) {
                const riskKey = `${c.student_id}_UNREAD_${mat.id}`;
                if (!seenRiskKeys.has(riskKey)) {
                  seenRiskKeys.add(riskKey);
                  atRisk.push({
                    student_id: c.student_id,
                    student_name: c.student_name || 'Peserta Didik',
                    class_id: studentClassId,
                    class_name: studentClassName,
                    nisn: c.nisn || null,
                    risk_level: 'MEDIUM',
                    category: 'UNREAD_MATERIAL',
                    title: `Belum Membaca Materi ${mat.title}`,
                    description: `Siswa baru membaca sampai halaman ${c.current_page || 1}. Diperlukan pengingat literasi.`,
                    action_label: 'Kirim Pengingat',
                    action_type: 'REMIND_STUDENT',
                    material_id: mat.id,
                    updated_at: c.last_read_at || new Date().toISOString(),
                  });
                }
              }
            }
          }
        } catch {
          // non-critical
        }
      })
    );

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

/**
 * Fetch recent learning materials, sorted by newest first
 */
export async function fetchRecentMaterials(classId?: string, existingProfile?: any): Promise<TeacherRecentMaterial[]> {
  try {
    const res = await fetch(getApiUrl('/api/v1/learning/materials'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];

    const json = await res.json();
    const raw: any[] = json?.data?.items || json?.data || [];

    const profile = existingProfile || await fetchCurrentTeacherProfile().catch(() => null);
    const currentTeacherId = profile?.id;
    const currentUserId = profile?.user_id;

    let teacherMaterials = raw.filter((m) => {
      if (!currentTeacherId && !currentUserId && !profile?.full_name) return true;
      return (
        m.teacher_id === currentTeacherId ||
        m.created_by === currentTeacherId ||
        (currentUserId && (m.teacher_id === currentUserId || m.created_by === currentUserId)) ||
        (profile?.full_name && m.teacher_name && m.teacher_name.trim().toLowerCase() === profile.full_name.trim().toLowerCase())
      );
    });

    if (teacherMaterials.length === 0 && raw.length > 0) {
      teacherMaterials = raw;
    }

    if (classId && classId !== 'ALL') {
      teacherMaterials = teacherMaterials.filter((m) => !m.class_id || m.class_id === classId);
    }

    teacherMaterials.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || '').localeCompare(a.id || '');
    });

    return teacherMaterials.map((m) => {
      const start = m.start_page ?? 1;
      const end = m.end_page ?? 15;
      const totalPages = Math.max(1, (end - start) + 1);
      const completed = Number(m.completed_count || 0);
      const assigned = Number(m.total_students || m.student_count || 0) || (completed > 0 ? completed : 0);
      const avgProgress = assigned > 0 ? Math.min(100, Math.round((completed / assigned) * 100)) : (completed > 0 ? 100 : 0);

      return {
        id: m.id,
        title: m.title || 'Materi Pembelajaran',
        subject_name: m.subject_name || 'Umum',
        class_name: m.class_name || 'Semua Rombel',
        class_id: m.class_id || undefined,
        material_type: m.material_type || 'document',
        created_at: m.created_at || new Date().toISOString(),
        description: m.description || '',
        start_page: start,
        end_page: end,
        total_pages: totalPages,
        completed_count: completed,
        total_students: assigned,
        reading_progress: avgProgress,
      };
    });
  } catch (err) {
    console.error('Failed to fetch recent materials:', err);
    return [];
  }
}

