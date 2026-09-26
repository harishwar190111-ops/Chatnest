/* ChatNest service worker — v5.
   Strategy: the app itself (index.html and same-origin files) is always fetched
   from the network first when online, so every deploy takes effect immediately;
   the cache is only a fallback for offline use. CDN libraries are cached for
   offline use. Supabase API and websocket traffic is never cached or blocked. */
const CACHE = 'chatnest-v5';
const CORE = [
  './',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.allSettled(CORE.map(function (u) { return c.add(u); }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === self.location.origin) {
    /* same-origin (the app shell): network first, cache only as offline fallback */
    e.respondWith(
      fetch(e.request).then(function (r) {
        try {
          const copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        } catch (err) {}
        return r;
      }).catch(function () {
        return caches.match(e.request).then(function (m) { return m || caches.match('./'); });
      })
    );
    return;
  }

  if (CORE.indexOf(e.request.url) >= 0) {
    /* CDN library: cache first (offline use), refresh in the background */
    e.respondWith(
      caches.match(e.request).then(function (m) {
        fetch(e.request).then(function (r) {
          try {
            const copy = r.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
          } catch (err) {}
        }).catch(function () {});
        return m || fetch(e.request);
      })
    );
    return;
  }

  /* everything else (Supabase API, websockets, avatars): straight to the network */
});
