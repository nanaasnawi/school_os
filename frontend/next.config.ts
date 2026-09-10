import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    let backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim();
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `https://${backendUrl}`;
    }
    backendUrl = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
