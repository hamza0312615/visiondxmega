const CACHE_NAME = 'visiondx-offline-v1';
const ASSETS = [
  '/offline-agent/',
  '/offline-agent/index.html',
  '/offline-agent/health-data.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() =>
      caches.match('/offline-agent/index.html')
    ))
  );
});
