// SCP Card Battle - Service Worker
const CACHE_NAME = 'scp-cb-v0.1.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './i18n.js',
  './data/scps.js',
  './data/silhouettes.js',
  './data/presets.js',
  './favicon.svg',
  './manifest.json',
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and external requests (API proxy, Firebase, fonts)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Cache successful responses
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
