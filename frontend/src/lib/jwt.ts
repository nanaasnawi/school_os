/**
 * Safely decodes a JWT payload in browser and client environments.
 * Correctly handles:
 * - Base64URL encoding (with '-' and '_' instead of '+' and '/')
 * - Missing Base64 padding (unpadded Base64 strings)
 * - Multi-byte UTF-8 percent-encoded strings (special characters, accents)
 * - Returns null instead of throwing on invalid tokens
 */
export function decodeJwtPayload<T = Record<string, any>>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64.length % 4)) % 4;
    base64 = base64.padEnd(base64.length + pad, '=');

    const binaryStr = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const jsonStr = decodeURIComponent(
      binaryStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr) as T;
  } catch {
    try {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = (4 - (base64.length % 4)) % 4;
      base64 = base64.padEnd(base64.length + pad, '=');
      const raw = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
