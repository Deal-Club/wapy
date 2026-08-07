// Service worker minimal : coquille en cache (installable + démarrage rapide).
const CACHE = "wapy-v1";
const SHELL = ["/dashboard", "/login", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Ne jamais mettre en cache l'API / l'auth / le webhook / le média (données vivantes).
  if (/^\/(api|auth|webhook|media)\b/.test(url.pathname)) return;
  // Navigation : réseau d'abord, repli cache (offline).
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/dashboard"))));
    return;
  }
  // Statiques : cache d'abord, sinon réseau (et on met en cache).
  e.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        if (res.ok && (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/"))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
