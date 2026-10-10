import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/api/v1')) {
    // Bypass proxy rewriting for local Next.js App Router API routes
    if (
      pathname.startsWith('/api/v1/academic/calendar') ||
      pathname.startsWith('/api/v1/ai/generate-content') ||
      pathname.startsWith('/api/v1/learning/auto-generate') ||
      pathname.startsWith('/api/v1/dapodik') ||
      pathname.startsWith('/api/v1/gamification') ||
      pathname.startsWith('/api/v1/teacher/remind')
    ) {
      return NextResponse.next();
    }

    const defaultBackend = 'https://schoolosbackend-production.up.railway.app';
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || defaultBackend).trim();
    const cleanBackendUrl = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    const targetUrl = `${cleanBackendUrl}${pathname}${search}`;

    const requestHeaders = new Headers(request.headers);
    // Explicitly pass authorization and tenant identification
    const auth = request.headers.get('authorization');
    if (auth) {
      requestHeaders.set('authorization', auth);
    }
    const tenantId = request.headers.get('x-tenant-id');
    if (tenantId) {
      requestHeaders.set('x-tenant-id', tenantId);
    }
    // Set Host header for backend
    try {
      requestHeaders.set('host', new URL(cleanBackendUrl).host);
    } catch {}

    return NextResponse.rewrite(new URL(targetUrl), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
