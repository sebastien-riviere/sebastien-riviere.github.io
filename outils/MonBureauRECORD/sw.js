/* MonBureauRECORD — Service Worker
 * Cache l'app pour usage offline + installabilité PWA.
 * Ne contacte aucun serveur tiers.
 */
const CACHE_NAME = 'mbr-v1.7.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './assets/icons.svg',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './js/config.js',
  './js/utils.js',
  './js/state.js',
  './js/storage.js',
  './js/session.js',
  './js/recorder.js',
  './js/importer.js',
  './js/markdown.js',
  './js/manifest.js',
  './js/pdf.js',
  './js/scripts.js',
  './js/notebooklm.js',
  './js/zip.js',
  './js/shots-markers.js',
  './js/presets.js',
  './js/ui.js',
  './js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS).catch(err => console.warn('SW cache partial:', err))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Cache-first pour same-origin, network passthrough sinon (jsPDF/JSZip CDN)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
