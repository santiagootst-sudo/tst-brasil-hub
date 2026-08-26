const SHELL_CACHE = "tst-library-shell-v2";
const SHELL_FALLBACK = "/";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.add(SHELL_FALLBACK))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;

  // Módulos de desenvolvimento são mutáveis e não devem entrar no cache offline.
  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/node_modules/")
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches
            .open(SHELL_CACHE)
            .then(cache => cache.put(SHELL_FALLBACK, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_FALLBACK))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
