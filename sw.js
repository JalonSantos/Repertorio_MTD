const CACHE_NAME = "mtd-repertorio-v2"; // mude o número sempre que atualizar algo grande
const urlsToCache = [
  "./",               // raiz local
  "./index.html",
  "./styles.css",
  "./script.js",
  "./icon-512x512.png",
  "./icon-192x192.png"
];

// Instala e faz pré-cache dos arquivos principais
self.addEventListener("install", event => {
  console.log("[SW] Instalando e armazenando no cache...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error("[SW] Falha ao adicionar ao cache:", err))
  );
  // Ativa imediatamente após instalação
  self.skipWaiting();
});

// Ativa o novo service worker e remove versões antigas
self.addEventListener("activate", event => {
  console.log("[SW] Ativando e limpando caches antigos...");
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("[SW] Removendo cache antigo:", key);
            return caches.delete(key);
          })
      )
    )
  );
  // Faz o novo SW controlar imediatamente as abas abertas
  self.clients.claim();
});

// Intercepta requisições e aplica cache dinâmico
self.addEventListener("fetch", event => {
  // Ignora requisições que não sejam GET (POST, PUT etc.)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Se encontrou no cache, retorna direto
        return cachedResponse;
      }

      // Senão, busca online e armazena no cache
      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Fallback offline para navegação
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});

// 🔄 Atualização automática do Service Worker
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Forçando atualização imediata...");
    self.skipWaiting();
  }
});
