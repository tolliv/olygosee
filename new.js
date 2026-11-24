// ... (Gardez vos constantes VersionSW, CACHE_NAME et ASSETS inchangées)

// Installation : identique
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Stratégie modifiée : Cache First avec mise en cache dynamique pour les tuiles
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Détecter s'il s'agit d'une requête de tuile (ex: OpenStreetMap ou Mapbox)
  // On vérifie si l'URL contient "tile" ou provient d'un domaine de cartographie
  const isTileRequest = url.includes('tile.openstreetmap.org') || url.includes('/tiles/');

  event.respondWith(
    caches.match(event.request, { ignoreSearch: isTileRequest }).then((response) => {
      // 1. Si la ressource est dans le cache, on la retourne
      if (response) {
        return response;
      }

      // 2. Sinon, on va la chercher sur le réseau
      return fetch(event.request).then((networkResponse) => {
        // Si c'est une tuile ou une ressource que l'on veut mettre en cache dynamiquement
        if (isTileRequest && networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Optionnel : retourner une image par défaut si hors-ligne et tuile non cachée
    })
  );
});

// Activation : identique
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});