const CACHE_NAME = "60-segundos-v104"; // <-- aumentei de novo pra forçar o PC

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js?v=103",   // <-- igual ao index.html
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./frente_carta_borda_azul_transparente.png",
  "./costa_carta_borda_azul_transparente.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
      )
      .then(() => self.clients.claim())
  );
});

// ✅ Network-first para JS/CSS/HTML (pra nunca “prender” versão antiga no PC)
// ✅ Cache-first para imagens (mais rápido)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isSameOrigin = url.origin === location.origin;
  const isAsset =
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".json") ||
    url.search.includes("v=");

  const isImage =
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp");

  if (isSameOrigin && isAsset) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (isSameOrigin && isImage) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // padrão
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

