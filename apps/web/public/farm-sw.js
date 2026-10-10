/* Public shell only. API responses and authenticated HTML are never cached. */
const CACHE = "aquapulse-farm-shell-v1";
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch("/field-offline", { credentials: "omit" });
      if (!response.ok) throw new Error("Offline shell unavailable");
      await cache.put("/field-offline", response.clone());
      const html = await response.text();
      const urls = [...html.matchAll(/(?:src|href)="([^"<>]+)"/g)]
        .map((match) => match[1].replace(/&amp;/g, "&"))
        .filter((url) => url.startsWith("/_next/static/"));
      await cache.addAll([...new Set(urls)]);
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("aquapulse-farm-shell-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      })(),
    );
  } else if (
    event.request.mode === "navigate" &&
    ["/farming", "/field-offline"].includes(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          return await fetch(event.request, { signal: controller.signal });
        } catch {
          return (await caches.match("/field-offline")) || Response.error();
        } finally {
          clearTimeout(timeout);
        }
      })(),
    );
  }
});
