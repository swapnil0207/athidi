/* Only the offline screen is cached. Orders, payments and dashboards stay network-only. */
const CACHE = 'athidi-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE, { cache: 'reload' }))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('athidi-offline-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname === '/api' || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(OFFLINE)) || new Response('You are offline. Please reconnect and reload.', { status: 503, headers: { 'Content-Type': 'text/plain' } })));
});

function safeDestination(value) {
  try {
    const url = new URL(value || '/', self.location.origin);
    if (url.origin === self.location.origin && !url.username && !url.password && !url.pathname.startsWith('/api/')) return url.href;
  } catch { /* Fall back to the store for malformed destinations. */ }
  return self.location.origin + '/';
}

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { /* Always display a useful notification. */ }
  event.waitUntil(self.registration.showNotification(typeof payload.title === 'string' ? payload.title.slice(0, 100) : 'Athidi Foods', {
    body: typeof payload.body === 'string' ? payload.body.slice(0, 240) : 'You have an update from Athidi Foods.',
    icon: '/assets/favicon/athidi-pwa-192.png',
    badge: '/assets/favicon/athidi-icon-192.png?v=2',
    tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 80) : undefined,
    data: { url: safeDestination(payload.url) },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = safeDestination(event.notification.data?.url);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => client.url === url);
    if (existing) return existing.focus();
    // Open a new window instead of navigating away from an active checkout.
    return self.clients.openWindow(url);
  })());
});
