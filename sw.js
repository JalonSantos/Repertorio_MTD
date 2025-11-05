self.addEventListener("fetch", event => {
  // Ignora requisições que não sejam GET (ex: POST, PUT, DELETE)
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        console.log("[SW] Recurso vindo do cache:", event.request.url);
        return cached;
      }

      return fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            console.log("[SW] Fallback para index.html offline");
            return caches.match("/index.html");
          }
        });
    })
  );
});
