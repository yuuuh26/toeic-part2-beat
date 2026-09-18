const CACHE_NAME = "toeic-part2-beat-v1.6.1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./enhancements.js",
  "./questions.js",
  "./questions-extra.js",
  "./questions-extra-1.js",
  "./questions-extra-2.js",
  "./questions-extra-3.js",
  "./questions-extra-4.js",
  "./questions-extra-5.js",
  "./bgm-tracks.js",
  "./bgm-track-after-hours.js",
  "./bgm-track-ready-set-goal.js",
  "./bgm-track-step-into-focus.js",
  "./bgm-track-victory-loop.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
      return cached || network.catch(() => caches.match("./index.html"));
    })
  );
});
