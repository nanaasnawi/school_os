import { getApiUrl, apiClient } from '@/lib/api';
import type {
  TeacherProfile,
  TeacherClassSummary,
  TodayScheduleItem,
  TeacherWorkstationStats,
  ClassStudentDto,
} from '../types';

function getAuthHeaders(): HeadersInit {
  const token =
    apiClient.getToken() ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || localStorage.getItem('token')
      : null);

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch current teacher's profile dynamically from backend
 */
export async function fetchCurrentTeacherProfile(): Promise<TeacherProfile | null> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(getApiUrl('/api/v1/auth/me'), { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data) return null;

    // Look up teacher record by user_id or name/email to obtain the specific teacher ID and assignment details
    let teacherRecord: any = null;
    try {
      const teachersRes = await fetch(getApiUrl('/api/v1/teachers?page_size=200'), { headers });
      if (teachersRes.ok) {
        const teachersJson = await teachersRes.json();
        const items: any[] = teachersJson?.data?.items || teachersJson?.data || [];
        teacherRecord = items.find(
          (t: any) =>
            t.user_id === data.id ||
            (data.email && t.email && t.email.toLowerCase() === data.email.toLowerCase()) ||
            (t.full_name && data.full_name && t.full_name.trim().toLowerCase() === data.full_name.trim().toLowerCase())
        );
      }
    } catch {
      // non-critical
    }

    return {
      id: teacherRecord?.id || data.id,
      tenant_id: data.tenant_id,
      user_id: data.id,
      full_name: teacherRecord?.full_name || data.full_name || 'Bapak/Ibu Guru',
      email: teacherRecord?.email || data.email || null,
      nip: teacherRecord?.nip || data.identifier || null,
      nuptk: teacherRecord?.nuptk || null,
      subject: teacherRecord?.subject || 'Tenaga Pendidik',
      status_kepegawaian: teacherRecord?.status_kepegawaian || 'Aktif',
      is_active: data.is_active ?? true,
    };
  } catch (err) {
    console.error('Failed to fetch teacher profile:', err);
    return null;
  }
}

/**
 * Fetch list of classes taught or assigned to the current teacher dynamically
 */
export async function fetchTeacherClasses(): Promise<TeacherClassSummary[]> {
  try {
    const headers = getAuthHeaders();

    // Fetch teacher profile, all classes, and all students in parallel
    const [profile, classesRes, studentsRes] = await Promise.all([
      fetchCurrentTeacherProfile(),
      fetch(getApiUrl('/api/v1/academic/classes?page_size=200'), { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(getApiUrl('/api/v1/students?page_size=1000'), { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const rawClasses: any[] = classesRes?.data?.items || classesRes?.data || [];
    const rawStudents: any[] = studentsRes?.data?.items || studentsRes?.data || [];

    // Compute live student count per class from real students data
    const studentCountMap = new Map<string, number>();
    rawStudents.forEach((s: any) => {
      if (s.class_id) {
        studentCountMap.set(s.class_id, (studentCountMap.get(s.class_id) || 0) + 1);
      }
      if (s.class_name) {
        studentCountMap.set(s.class_name, (studentCountMap.get(s.class_name) || 0) + 1);
      }
    });

    const currentTeacherId = profile?.id;
    const currentUserId = profile?.user_id;

    // Filter homeroom classes assigned to this specific teacher
    const homeroomClasses = rawClasses.filter((c: any) => {
      if (!currentTeacherId && !currentUserId) return false;
      return (
        (currentTeacherId && c.homeroom_teacher_id === currentTeacherId) ||
        (currentUserId && c.homeroom_teacher_id === currentUserId)
      );
    });

    // If teacher has dedicated homeroom classes, show them; otherwise show available active classes
    const activeClasses = homeroomClasses.length > 0 ? homeroomClasses : rawClasses;

    const teacherClasses: TeacherClassSummary[] = activeClasses.map((c) => {
      const className = c.name || `Kelas ${c.grade_level || ''}`;
      const count =
        studentCountMap.get(c.id) ||
        studentCountMap.get(className) ||
        Number(c.student_count || c.total_students || 0);

      const isHomeroom =
        (currentTeacherId && c.homeroom_teacher_id === currentTeacherId) ||
        (currentUserId && c.homeroom_teacher_id === currentUserId);

      const subjectName = profile?.subject && profile.subject !== 'Guru' && profile.subject !== 'Tenaga Pendidik'
        ? profile.subject
        : '';

      const roleLabel = isHomeroom
        ? (subjectName ? `Wali Kelas • ${subjectName}` : 'Wali Kelas')
        : (subjectName ? `Pengampu • ${subjectName}` : 'Guru Pengampu');

      const gradeName = c.grade_level_name || (c.grade_level ? `Tingkat ${c.grade_level}` : className);

      return {
        id: c.id,
        name: className,
        grade_level_id: c.grade_level_id || null,
        grade_level_name: gradeName,
        academic_year_id: c.academic_year_id || '',
        academic_year_name: c.academic_year_name || null,
        student_count: count,
        subject_name: roleLabel,
      };
    });

    return teacherClasses.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Failed to fetch teacher classes:', err);
    return [];
  }
}

/**
 * Fetch today's teaching schedules dynamically from learning sessions
 */
export async function fetchTodaySchedule(): Promise<TodayScheduleItem[]> {
  try {
    const res = await fetch(getApiUrl('/api/v1/learning/sessions'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    const sessions: any[] = json?.data?.items || json?.data || [];

    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return sessions.map((s, idx) => {
      const startTime = s.start_time || '08:00';
      const endTime = s.end_time || '09:30';
      return {
        id: s.id || `sched-${idx}`,
        class_id: s.class_id || '',
        class_name: s.class_name || 'Rombel Belajar',
        subject_id: s.subject_id || '',
        subject_name: s.subject_name || s.title || 'Mata Pelajaran',
        start_time: startTime,
        end_time: endTime,
        room: s.room || 'Kelas Belajar',
        is_current: currentHourMin >= startTime && currentHourMin <= endTime,
        is_upcoming: currentHourMin < startTime,
      };
    });
  } catch (err) {
    console.error('Failed to fetch today schedule:', err);
    return [];
  }
}

/**
 * Fetch overall teacher workstation stats computed dynamically
 */
export async function fetchWorkstationStats(): Promise<TeacherWorkstationStats> {
  try {
    const headers = getAuthHeaders();
    const [classes, assignmentsRes, quizzesRes, inquiriesRes] = await Promise.all([
      fetchTeacherClasses(),
      fetch(getApiUrl('/api/v1/learning/assignments'), { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(getApiUrl('/api/v1/learning/quizzes'), { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(getApiUrl('/api/v1/learning/inquiries/unread-count'), { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    const quizzes: any[] = quizzesRes?.data?.items || quizzesRes?.data || [];
    const totalStudents = classes.reduce((acc, c) => acc + (c.student_count || 0), 0);
    const unreadInquiries = Number(inquiriesRes?.data?.unread_count || 0);

    return {
      total_assigned_classes: classes.length,
      total_students: totalStudents,
      pending_essay_submissions: 0,
      active_quizzes_count: quizzes.filter((q) => q.is_published ?? true).length,
      unread_inquiries_count: unreadInquiries,
      average_class_reading_progress: 0,
    };
  } catch (err) {
    console.error('Failed to calculate workstation stats:', err);
    return {
      total_assigned_classes: 0,
      total_students: 0,
      pending_essay_submissions: 0,
      active_quizzes_count: 0,
      unread_inquiries_count: 0,
      average_class_reading_progress: 0,
    };
  }
}

/**
 * Fetch students enrolled in a specific class dynamically from database APIs
 */
export async function fetchClassStudents(classId: string): Promise<ClassStudentDto[]> {
  const headers = getAuthHeaders();

  try {
    // 1. Primary endpoint: /api/v1/academic/classes/{id}/students
    const res = await fetch(getApiUrl(`/api/v1/academic/classes/${classId}/students`), {
      headers,
    });
    if (res.ok) {
      const json = await res.json();
      const list = json?.data?.items || json?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map((s: any) => ({
          id: s.id,
          full_name: s.full_name,
          nisn: s.nisn,
          gender: s.gender || 'L',
          status: s.status || 'active',
          no_hp: s.no_hp || '',
          email: s.email || '',
          class_id: s.class_id || classId,
          class_name: s.class_name || '',
        }));
      }
    }

    // 2. Query param endpoint: /api/v1/academic/classes/students?class_id=...
    const fallbackRes = await fetch(getApiUrl(`/api/v1/academic/classes/students?class_id=${classId}`), {
      headers,
    });
    if (fallbackRes.ok) {
      const fallbackJson = await fallbackRes.json();
      const list = fallbackJson?.data?.items || fallbackJson?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map((s: any) => ({
          id: s.id,
          full_name: s.full_name,
          nisn: s.nisn,
          gender: s.gender || 'L',
          status: s.status || 'active',
          no_hp: s.no_hp || '',
          email: s.email || '',
          class_id: s.class_id || classId,
          class_name: s.class_name || '',
        }));
      }
    }

    // 3. Fallback to /api/v1/students?page_size=1000 and filter
    const studentsRes = await fetch(getApiUrl('/api/v1/students?page_size=1000'), { headers });
    if (studentsRes.ok) {
      const sJson = await studentsRes.json();
      const allStudents: any[] = sJson?.data?.items || sJson?.data || [];
      const filtered = allStudents.filter((s) => s.class_id === classId || s.class_name === classId);
      if (filtered.length > 0) {
        return filtered.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          nisn: s.nisn,
          gender: s.gender || 'L',
          status: s.status || 'active',
          no_hp: s.no_hp || '',
          email: s.email || '',
          class_id: s.class_id || classId,
          class_name: s.class_name || '',
        }));
      }
    }
  } catch (err) {
    console.error(`Error querying students for class ${classId}:`, err);
  }

  return [];
}
