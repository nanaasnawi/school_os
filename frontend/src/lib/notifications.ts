import { apiClient, getApiUrl } from '@/lib/api';

export interface RealNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  channel: string;
  reference_type?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationVisual {
  icon: string;
  bg: string;
  link: string;
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || apiClient.getToken() || '')
    : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch paginated notifications from backend API /api/v1/notifications
 */
export async function fetchNotifications(page = 1, perPage = 10): Promise<{
  items: RealNotification[];
  total: number;
  page: number;
  perPage: number;
}> {
  try {
    const url = getApiUrl(`/api/v1/notifications?page=${page}&per_page=${perPage}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      return { items: [], total: 0, page, perPage };
    }

    const json = await res.json();
    const data = json?.data;
    const items: RealNotification[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    const total = typeof data?.total_items === 'number'
      ? data.total_items
      : typeof data?.total === 'number'
      ? data.total
      : items.length;

    return {
      items,
      total,
      page: data?.page || page,
      perPage: data?.page_size || perPage,
    };
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    return { items: [], total: 0, page, perPage };
  }
}

/**
 * Fetch unread notifications count from /api/v1/notifications/unread-count
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const url = getApiUrl('/api/v1/notifications/unread-count');
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) return 0;
    const json = await res.json();
    const count = json?.data?.count ?? json?.data?.unread_count ?? 0;
    return typeof count === 'number' ? count : Number(count) || 0;
  } catch {
    return 0;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const url = getApiUrl(`/api/v1/notifications/${id}/read`);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schoolos_notification_updated'));
    }
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const url = getApiUrl('/api/v1/notifications/read-all');
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schoolos_notification_updated'));
    }
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Format timestamp into Indonesian human relative time
 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Baru saja';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return 'Baru saja';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Baru saja';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return 'Baru saja';
  }
}

/**
 * Resolve visual icon, badge background, and target link
 */
export function getNotificationVisual(type: string, title = '', body = ''): NotificationVisual {
  const t = (type || '').toUpperCase();
  const lower = `${title} ${body}`.toLowerCase();

  if (t.includes('DAPODIK') || lower.includes('dapodik') || lower.includes('sinkron')) {
    return {
      icon: '🔄',
      bg: 'rgba(14, 165, 233, 0.12)',
      link: '/dashboard/dapodik',
    };
  }

  if (t.includes('ATTENDANCE') || t.includes('PRESENSI') || lower.includes('presensi') || lower.includes('scan') || lower.includes('qr')) {
    return {
      icon: '📱',
      bg: 'rgba(22, 163, 74, 0.12)',
      link: '/dashboard/students/qr-scan',
    };
  }

  if (t.includes('QUIZ') || t.includes('CBT') || lower.includes('kuis') || lower.includes('cbt') || lower.includes('ujian')) {
    return {
      icon: '📝',
      bg: 'rgba(124, 58, 237, 0.12)',
      link: '/dashboard/learning/quizzes',
    };
  }

  if (t.includes('WARNING') || lower.includes('peringatan') || lower.includes('remedial') || lower.includes('tunggakan')) {
    return {
      icon: '⚠️',
      bg: 'rgba(245, 158, 11, 0.12)',
      link: '/dashboard/grading/final-grades',
    };
  }

  if (t.includes('ANNOUNCEMENT') || lower.includes('pengumuman') || lower.includes('broadcast')) {
    return {
      icon: '📢',
      bg: 'rgba(59, 130, 246, 0.12)',
      link: '/dashboard/announcements',
    };
  }

  if (t.includes('GRADE') || t.includes('RAPOR') || lower.includes('nilai') || lower.includes('rapor')) {
    return {
      icon: '🎓',
      bg: 'rgba(16, 185, 129, 0.12)',
      link: '/dashboard/reports/cards',
    };
  }

  return {
    icon: '🔔',
    bg: 'rgba(100, 116, 139, 0.12)',
    link: '/dashboard/notifications',
  };
}
