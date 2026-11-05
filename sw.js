// Service Worker - عقاراتي (offline support)
const CACHE = "aqarati-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // precache the app shell; ignore failures so install never breaks
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
  if (url.origin !== self.location.origin) return; // never touch external requests

  // Network first (so updates arrive), fall back to cache when offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(
          (hit) =>
            hit ||
            caches.match("./index.html") ||
            caches.match("./%D8%B9%D9%82%D8%A7%D8%B1%D8%A7%D8%AA%D9%8A.html")
        )
      )
  );
});
