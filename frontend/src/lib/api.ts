import { client } from './sdk/client.gen';

const DEFAULT_PRODUCTION_API_URL = 'https://schoolosbackend-production.up.railway.app';

export function getApiBaseUrl(): string {
  let envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    envUrl = envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }

  // If env URL is explicitly set and points to an external domain or non-localhost, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    const isClientLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLanIp = hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');

    // If browser is accessing via a private LAN IP (e.g. 192.168.1.11:3000)
    if (isLanIp) {
      return `${window.location.protocol}//${hostname}:8000`;
    }

    // If on localhost
    if (isClientLocalhost) {
      return envUrl || 'http://127.0.0.1:8000';
    }

    // Cloud deployment (e.g. Vercel, Railway)
    return envUrl || DEFAULT_PRODUCTION_API_URL;
  }

  return envUrl || DEFAULT_PRODUCTION_API_URL;
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
