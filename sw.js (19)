/* ChatNest service worker — v37.
   Strategy: the app itself (index.html and same-origin files) is always fetched
   from the network first when online, so every deploy takes effect immediately;
   the cache is only a fallback for offline use. CDN libraries are cached for
   offline use. Supabase API and websocket traffic is never cached or blocked.

   v37 changes: cache name bumped so every user discards ALL old caches on the
   next visit (no stale versions mixed), plus a skipWaiting message handler for
   controlled same-version updates. No refresh loops: the page is never reloaded
   by the worker; users simply get the new files on their next navigation. */
const CACHE = 'chatnest-v37';
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
      /* every cache that is not this exact version is deleted — old app
         versions never linger */
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
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

/* notifications created by the page (local notifications): tapping focuses
   ChatNest. Real push delivery while the browser is fully killed requires a
   push server + VAPID setup — ChatNest states this honestly instead of faking it. */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) { try { list[i].focus(); return; } catch (err) {} }
      return self.clients.openWindow('./');
    })
  );
});
