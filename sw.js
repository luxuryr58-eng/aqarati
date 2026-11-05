// Service Worker - عقاراتي (fast start + offline)
// Strategy: serve from cache instantly, refresh the cache in the background.
const CACHE = "aqarati-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        ["./", "./index.html", "./%D8%B9%D9%82%D8%A7%D8%B1%D8%A7%D8%AA%D9%8A.html"].map((u) =>
          cache.add(u).catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });

      // refresh in the background (never blocks opening the app)
      const refresh = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(refresh);
        return cached; // instant
      }
      const fresh = await refresh;
      return fresh || (await cache.match("./index.html")) || Response.error();
    })
  );
});
