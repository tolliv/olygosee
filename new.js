self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Exclure les requêtes vers Supabase (ou toute API externe)
  // Remplacez 'supabase.co' par votre domaine API si nécessaire
  if (url.hostname.includes('supabase.co')) {
    return; // On laisse le navigateur gérer la requête normalement sans passer par le cache
  }

  // 2. Ne pas mettre en cache les requêtes non-GET (Supabase utilise souvent POST/PATCH)
  if (event.request.method !== 'GET') {
    return;
  }

  const isTileRequest = url.hostname.includes('tile.openstreetmap.org') || url.pathname.includes('/tiles/');

  event.respondWith(
    caches.match(event.request, { ignoreSearch: isTileRequest }).then((response) => {
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        // Validation stricte pour la mise en cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          const targetCache = isTileRequest ? TILE_CACHE_NAME : APP_CACHE_NAME;

          caches.open(targetCache).then((cache) => {
            cache.put(event.request, responseToCache);
            if (isTileRequest) {
              limitCacheSize(TILE_CACHE_NAME, 1000);
            }
          });
        }
        return networkResponse;
      });
    }).catch(() => {
        // Optionnel: gestion d'erreur hors-ligne
    })
  );
});