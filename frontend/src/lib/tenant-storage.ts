export function getTenantPrefix(): string {
  if (typeof window === 'undefined') return 'default_';
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (!token) return 'default_';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.tenant_id || payload.sub || 'default') + '_';
  } catch {
    return 'default_';
  }
}

export function getTenantItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getTenantPrefix() + key);
}

export function setTenantItem(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getTenantPrefix() + key, value);
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export function removeTenantItem(key: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getTenantPrefix() + key);
}
