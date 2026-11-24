const CACHE_NAME = 'lencre-cache-v16';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './studio-catalog.min.js',
  './manifest.json',
  './preview.png',
  './icon-192.png',
  './icon-512.png',
  './images/sketch-peony.jpg',
  './images/sketch-snake.jpg',
  './images/sketch-swallow.jpg',
  './images/sketch-geometry.jpg',
  './images/sketch-botany.jpg',
  './images/sketch-ginkgo.jpg',
  './images/sketch-moth.jpg',
  './images/sketch-olive.jpg',
  './images/sketch-crane.jpg',
  './images/sketch-celestial.jpg',
  './images/sketch-arch.jpg',
  './images/sketch-fox.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isCodeAsset =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('/');

  // Network-First для HTML, CSS и JS (чтобы обновления подхватывались сразу при наличии сети)
  if (isCodeAsset && url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Cache-First для изображений и внешних библиотек
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
