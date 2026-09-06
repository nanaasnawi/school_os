import { client } from './sdk/client.gen';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const isClientLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const envUrl = process.env.NEXT_PUBLIC_API_URL;

    // If env URL is explicitly set and points to an external domain or non-localhost, use it
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }

    // If browser is accessing via LAN IP or hostname (e.g. 192.168.1.11:3000),
    // point API requests to the same host on port 8000 so mobile / LAN devices work seamlessly
    if (!isClientLocalhost) {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }

    if (envUrl) {
      return envUrl;
    }
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
}

export function getApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

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
  baseUrl: getApiBaseUrl(),
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
