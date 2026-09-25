/* ChatNest 30 offline service worker.
   v16 fix: pages are now NETWORK-FIRST so every update you upload shows
   immediately when online; the cache is only a fallback for offline use. */
const CACHE = 'chatnest-v30';
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
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' || (url.origin === self.location.origin && (url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')));
  e.respondWith((async () => {
    if (isPage) {
      /* network first for pages: you always get the newest version */
      try {
        const r = await fetch(e.request);
        if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      } catch (err) {
        const hit = await caches.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        throw err;
      }
    }
    /* assets: cache first (fast) */
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(e.request);
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    } catch (err) {
      const fb = await caches.match('./');
      if (fb) return fb;
      throw err;
    }
  })());
});
