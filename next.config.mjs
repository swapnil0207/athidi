export default function nextConfig() {
  return {
    // Exact trusted tunnel hostnames only; this does not change API/payment origins.
    allowedDevOrigins: [
      'exclusion-feminine-untitled.ngrok-free.dev',
      ...(process.env.NEXT_DEV_ALLOWED_ORIGINS || '').split(',').map(host => host.trim()).filter(Boolean),
    ],
    async headers() {
      return [
        { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
        { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Content-Type', value: 'application/javascript; charset=utf-8' }] },
        { source: '/assets/favicon/site.webmanifest', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Content-Type', value: 'application/manifest+json' }] },
      ];
    },
    async rewrites() {
      return [
        { source: '/index.html', destination: '/' },
        { source: '/order.html', destination: '/order' },
      ];
    },
  };
}
