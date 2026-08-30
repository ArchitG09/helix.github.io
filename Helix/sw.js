const CACHE = "helix-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./css/helix.css",
  "./js/app.js",
  "./js/views.js",
  "./js/store.js",
  "./js/data.js",
  "./js/coach.js",
  "./js/geo.js",
  "./js/graphics.js",
  "./js/maps.js",
  "./manifest.webmanifest",
  "./icons/helix.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
