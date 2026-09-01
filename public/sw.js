/**
 * NO MALBOROS — service worker
 *
 * This app gets opened at someone's worst moment, sometimes on a train, in a
 * basement, or on a dead connection. It has no backend and no network calls,
 * so there is no reason it should ever fail to open. Everything is precached
 * and served from cache first.
 *
 * Bump CACHE when any shell file changes — old caches are cleared on activate.
 */

const CACHE = 'nomalboros-v2';

const SHELL = [
  './',
  './index.html',
  './icon.svg',
  './manifest.webmanifest',
  './styles/tokens.css',
  './styles/app.css',
  './js/main.js',
  './js/store.js',
  './js/ui.js',
  './js/icons.js',
  './js/breathe.js',
  './js/delay.js',
  './js/learn.js',
  './js/rewards.js',
];

self.addEventListener('install', (e) => {
  // Precache everything, then take over immediately rather than waiting for
  // every tab to close — a stale shell helps nobody.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // never touch outbound links

  e.respondWith(
    caches.match(request).then((hit) => {
      if (hit) {
        // Serve instantly, then quietly refresh the copy for next time.
        e.waitUntil(
          fetch(request)
            .then((res) => res.ok && caches.open(CACHE).then((c) => c.put(request, res.clone())))
            .catch(() => {})
        );
        return hit;
      }
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        // Offline and uncached: a navigation still gets the app shell, so the
        // app opens rather than showing the browser's error page.
        .catch(() => (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
