var CACHE = 'dhurba-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll([
        '/',
        'index.html',
        'about.html',
        'repairs.html',
        'settings.html',
        '404.html',
        'css/style.css',
        'js/user-app.js',
        'sheets-api.js',
        'manifest.json',
        'assets/logo.png',
        'favicon/favicon-16x16.png',
        'favicon/favicon-32x32.png',
        'favicon/apple-touch-icon.png',
        'favicon/android-chrome-192x192.png',
        'favicon/android-chrome-512x512.png',
        'assets/slider0.png',
        'assets/slider1.png',
        'assets/slider2.jpg'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
});

self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        return caches.open(CACHE).then(function (c) {
          if (e.request.method === 'GET') c.put(e.request, res.clone());
          return res;
        });
      }).catch(function () {
        return caches.match('404.html');
      });
    })
  );
});
