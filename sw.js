/* ChatNest offline service worker. Upload next to index.html. */
const CACHE = 'chatnest-v12';
const CORE = [
  './',
  './admin.html',
  'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
  'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(e.request);
      if (r && (r.ok || r.type === 'opaque')) {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return r;
    } catch (err) {
      const fallback = await caches.match('./');
      if (fallback) return fallback;
      throw err;
    }
  })());
});
