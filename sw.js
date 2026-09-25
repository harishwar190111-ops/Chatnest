/* ChatNest 33 offline service worker.
   v16 fix: pages are now NETWORK-FIRST so every update you upload shows
   immediately when online; the cache is only a fallback for offline use. */
const CACHE = 'chatnest-v33';
const CORE = [
  './',
  './admin.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'
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

/* ---------- v33: push notifications (works with the Supabase push function) ---------- */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(self.registration.showNotification(d.title || 'ChatNest', {
    body: d.body || 'You have a new message',
    tag: d.conv || 'chatnest',
    data: { conv: d.conv || '' },
    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#008069"/><path d="M12 15h24v14H20l-8 6V15z" fill="#fff"/></svg>'),
    badge: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#008069"/></svg>')
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var conv = (e.notification.data && e.notification.data.conv) || '';
  var url = self.registration.scope + '#c=' + encodeURIComponent(conv);
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var cl = list[i];
      if (cl.url.indexOf(self.registration.scope) === 0) {
        if ('navigate' in cl) { try { cl.navigate(url); } catch (err) {} }
        return cl.focus();
      }
    }
    return clients.openWindow(url);
  }));
});
