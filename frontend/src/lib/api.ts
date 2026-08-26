import { client } from './sdk/client.gen';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public traceId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Configure the hey-api SDK client with base URL and an auth callback.
// The auth callback is called on EVERY request, always reading the latest
// token from localStorage — this fixes the 401 issue after page refresh.
client.setConfig({
  baseUrl: BASE_URL,
  auth: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') ?? undefined;
    }
    return undefined;
  },
});

// ── Single persistent 401 response interceptor ───────────────────────────────
// If the backend returns 401, clear the token and redirect to login.
// Guard against redirecting when we're already on auth pages.
client.interceptors.response.use((response) => {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/auth')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
  }
  return response;
});

export const apiClient = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    // No interceptor manipulation needed — the auth callback in setConfig
    // always reads the latest token from localStorage on every request.
  },

  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  // Kept for backwards compatibility — no longer needed.
  hydrate: () => {
    // No-op: the auth callback in client.setConfig handles this automatically.
  },
};
