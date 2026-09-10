import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const DEFAULT_PRODUCTION_API_URL = 'https://schoolosbackend-production.up.railway.app';
    let backendUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_PRODUCTION_API_URL).trim();
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
