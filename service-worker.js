// // import
// // import icon as "./assets/favicon"


// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open("static-v1").then((cache) => {
//       return cache.addAll([
//         "/",
//         "/index.html",
//         "/style.css",
//         "/app.js", // Add other static assets like JS and CSS files you need
       
//       ]);
//     })
//   );
// });

// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((cachedResponse) => {
//       return cachedResponse || fetch(event.request);
//     })
//   );
// });

// // service-worker.js
// self.addEventListener("push", (event) => {
//   const data = event.data.json();
//   const icon = '/favicon.png' // Use the path to your favicon.png from the public folder
//   console.log("Using icon:", icon);
//   event.waitUntil(
//     self.registration.showNotification(data.title, {
//       body: data.body,
//       icon: icon,
//     })
//   );
// });




const CACHE_NAME = 'static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Don't cache API requests to prevent authentication issues
  if (event.request.url.includes('/api/')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png'
    })
  );
});