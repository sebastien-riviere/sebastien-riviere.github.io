// === MD CONVERT — SERVICE WORKER ===
// Offline complet, MAIS sans figer les mises à jour.
// - HTML/navigation : network-first (l'utilisateur reçoit toujours la dernière version)
// - autres assets (libs, modèles OCR…) : cache-first (rapidité + offline)

const VERSION = 'v2.0';
const CACHE_NAME = 'mdconvert-' + VERSION;

// Chemins relatifs au scope du SW (/outils/MD-Convert/), pas à la racine du domaine.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // addAll échoue en bloc si une ressource manque → on ajoute en best-effort.
      Promise.allSettled(ASSETS.map(a => cache.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // NETWORK-FIRST : on tente le réseau, on met à jour le cache, fallback cache si offline.
    event.respondWith(
      fetch(req).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return response;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // CACHE-FIRST pour tout le reste (libs inline n/a, modèles Tesseract distants, etc.)
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
