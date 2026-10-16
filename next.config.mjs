export default function nextConfig() {
  return {
    // Exact trusted tunnel hostnames only; this does not change API/payment origins.
    allowedDevOrigins: [
      'exclusion-feminine-untitled.ngrok-free.dev',
      ...(process.env.NEXT_DEV_ALLOWED_ORIGINS || '').split(',').map(host => host.trim()).filter(Boolean),
    ],
    async headers() {
      return [{ source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
    },
    async rewrites() {
      return [
        { source: '/index.html', destination: '/' },
        { source: '/order.html', destination: '/order' },
      ];
    },
  };
}
