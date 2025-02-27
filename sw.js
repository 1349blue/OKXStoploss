const cacheName = 'my-pwa-cache-v1';
const filesToCache = [
    '/index.html',
    '/style.css',
    '/script.js',
    '/icon-192.png',
    '/icon-512.png'
];

// Cài đặt Service Worker và lưu vào cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache);
        })
    );
});

// Lấy tài nguyên từ cache khi offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
