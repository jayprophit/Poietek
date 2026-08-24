// Development fallback. Production builds replace this with a content-hashed precache.
const CACHE = 'poietek-development-shell-v3';
const SHELL = ['/', '/index.html', '/poietek.webmanifest', '/poietek-icon.svg', '/poietek-icon-192.png', '/poietek-icon-512.png', '/poietek-maskable-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE && (
      key.startsWith('poietek-app-') || key.startsWith('poietek-shell-') || key.startsWith('poietek-development-shell-')
    )).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'POIETEK_ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('authorization') || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/private-media/') || url.pathname.startsWith('/provider/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await (await caches.open(CACHE)).match('/index.html')) || Response.error()));
    return;
  }
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(request).then((cached) => cached || fetch(request))));
});
