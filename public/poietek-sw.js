const CACHE = "poietek-shell-v2";
const SHELL = ["/", "/index.html", "/poietek.webmanifest", "/poietek-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (request.headers.has("range")) return;

  const destination = request.destination;
  const cacheableStatic = ["script", "style", "font", "image", "manifest"].includes(destination);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/index.html")) ?? Response.error()),
    );
    return;
  }

  // User media, API responses and arbitrary downloads are deliberately excluded.
  // OPFS/IndexedDB remain the durable stores for private project assets.
  if (!cacheableStatic) return;

  event.respondWith(
    caches.match(request).then(async (cached) => {
      const update = fetch(request).then(async (response) => {
        const cacheControl = response.headers.get("cache-control") ?? "";
        if (response.ok && !/no-store|private/i.test(cacheControl)) {
          await (await caches.open(CACHE)).put(request, response.clone());
        }
        return response;
      });

      return cached ?? update;
    }),
  );
});
