import { getApiUrl, apiClient } from '@/lib/api';
import type {
  InquiryThread,
  InquiryDetail,
  InquiryMessage,
} from '../types';

function getAuthHeaders(): HeadersInit {
  const token = apiClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all inquiry threads for the teacher
 */
export async function fetchInquiryThreads(
  status?: string,
  search?: string
): Promise<InquiryThread[]> {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(getApiUrl(`/api/v1/learning/inquiries${queryString}`), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch (err) {
    console.error('Failed to fetch inquiry threads:', err);
    return [];
  }
}

/**
 * Fetch detail and message thread for an inquiry
 */
export async function fetchInquiryDetail(threadId: string): Promise<InquiryDetail | null> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/inquiries/${threadId}`), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.error(`Failed to fetch inquiry detail for ${threadId}:`, err);
    return null;
  }
}

/**
 * Send teacher's reply in an inquiry thread
 */
export async function sendInquiryReply(
  threadId: string,
  content: string,
  senderName: string = 'Bapak/Ibu Guru'
): Promise<InquiryMessage | null> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/inquiries/${threadId}/messages`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        sender_role: 'TEACHER',
        sender_name: senderName,
        content: content.trim(),
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.error(`Failed to send inquiry reply to ${threadId}:`, err);
    return null;
  }
}

/**
 * Mark inquiry thread as read by teacher
 */
export async function markInquiryRead(threadId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/inquiries/${threadId}/read`), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error(`Failed to mark inquiry ${threadId} as read:`, err);
    return false;
  }
}

/**
 * Mark inquiry thread as RESOLVED / selesai
 */
export async function resolveInquiry(threadId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/api/v1/learning/inquiries/${threadId}/resolve`), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error(`Failed to resolve inquiry ${threadId}:`, err);
    return false;
  }
}
