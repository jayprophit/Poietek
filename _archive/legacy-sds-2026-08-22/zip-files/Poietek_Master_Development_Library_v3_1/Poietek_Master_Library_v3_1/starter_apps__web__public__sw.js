const CACHE_NAME = "poietek-shell-v1";
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never treat API or OAuth callbacks as app-shell cache material.
  if (url.pathname.startsWith("/api/") || url.pathname.includes("oauth")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response.ok &&
          url.origin === self.location.origin &&
          (request.destination === "document" ||
           request.destination === "script" ||
           request.destination === "style")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === "navigate") {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
        }

        return new Response("Offline", { status: 503 });
      }),
  );
});
