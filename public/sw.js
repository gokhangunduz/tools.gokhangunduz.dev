/**
 * Offline for a site whose tools never needed the network anyway.
 *
 * Two strategies, chosen by what the request is for:
 *  - Build output under /_next/static is content-hashed, so it is cached
 *    forever and served from the cache without asking.
 *  - Pages are fetched from the network first and fall back to the cache,
 *    so a new version is picked up immediately when there is a connection
 *    and the tool still opens on a plane.
 *
 * Third-party requests — the three tools that query a public API — are left
 * alone entirely: caching a DNS answer would be actively wrong.
 */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== PAGES && name !== ASSETS)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg") {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw error;
  }
}
