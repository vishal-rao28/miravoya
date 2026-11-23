/* ==========================================================================
   MIRAVOYA — High-Performance Offline PWA Service Worker
   Caches core application shell, styles, scripts, and static assets
   so travel itineraries, packing lists, and phrasebooks work offline.
   ========================================================================== */

const CACHE_NAME = 'miravoya-v5.3.0';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  './sitemap.xml',
  './opensearch.xml',
  './google5266a10991396c47.html',
  './assets/favicon.svg',
  './assets/miravoya-social-card.png',
  './assets/miravoya-social-card.svg',
  './styles/tokens.css',
  './styles/main.css',
  './js/guard.js',
  './js/destinations.js',
  './js/more-places.js',
  './js/photos.js',
  './js/weather.js',
  './js/innovations.js',
  './js/planner.js',
  './js/extras.js',
  './js/vault.js',
  './js/app.js'
];

// 1. Install Event — Pre-cache essential application shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[Miravoya SW] Pre-cache item failed, continuing:', err);
      });
    })
  );
});

// 2. Activate Event — Clean up stale previous cache versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event — Stale-While-Revalidate for app assets, Network-First for HTML
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET and browser-extension requests
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle same-origin assets (HTML, JS, CSS, SVG)
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      // Network-first for navigation, falling back to cached index.html
      event.respondWith(
        fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => caches.match('./index.html') || caches.match('./'))
      );
      return;
    }

    // Stale-While-Revalidate for local scripts, styles, and assets
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For external Google Fonts & Wikimedia images: Cache-first with network fallback
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('upload.wikimedia.org')) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        }).catch(() => null);
      })
    );
  }
});
