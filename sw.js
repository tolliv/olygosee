const VersionSW = "2611.24c";
const CACHE_NAME = 'OlyGo'+ VersionSW;
const ASSETS = [
  'adrServerSee.js',
  'aide.css',
  'aide.js',
  'apple-touch-icon.png',
  'driverSupabaseGo.js',
  'driverSupabaseSee.js',
  'edit.css',
  'edit.js',
  'emplacements.css',
  'emplacements.js',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'geolocalisation.js',
  'go.html',
  'home.css',
  'home.js',
  'icon-192.png',
  'icon-512.png',
  'imgAGrand.png',
  'imgAide.png',
  'imgAnnuler.png',
  'imgAPetit.png',
  'imgBas.png',
  'imgBivouac.png',
  'imgEditer.png',
  'imgEmplacements.png',
  'imgGauche.png',
  'imgHaut.png',
  'imgMeteo.png',
  'imgMsg.png',
  'imgNewGPSBulletin.png',
  'imgOlySee.png',
  'imgParam.png',
  'imgRequetes.png',
  'imgRoute.png',
  'imgValider.png',
  'main.css',
  'main.js',
  'map.css',
  'map.js',
  'manifest.json',
  'meteo.css',
  'meteo.js',
  'param.css',
  'param.js',
  'requetes.css',
  'requetes.js',
  'see.html',
  'texte.css',
  'texte.js',
  'traitements.css',
  'traitements.js',
  'version.js',
];

// Installation : Mise en cache des fichiers si changement du sw.js
self.addEventListener('install', (event) =>
{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
      {
        console.log('Installation nouvelle version :', CACHE_NAME);
        return cache.addAll(ASSETS);
      })
  );
  self.skipWaiting();
});


// Stratégie : Répondre avec le cache si hors-ligne
self.addEventListener('fetch', (e) =>
{
  const url = event.request.url;

  // Détecter s'il s'agit d'une requête de tuile (ex: OpenStreetMap ou Mapbox)
  // On vérifie si l'URL contient "tile" ou provient d'un domaine de cartographie
  const isTileRequest = url.includes('tile.openstreetmap.org') || url.includes('/tiles/');

  event.respondWith(
    caches.match(event.request, { ignoreSearch: isTileRequest }).then((response) => {
      // Si la ressource est dans le cache, on la retourne
      if (response)
      {
        return response;
      }

      // Sinon, on va la chercher sur le réseau
      return fetch(event.request).then((networkResponse) =>
      {
        // Si c'est une tuile ou une ressource que l'on veut mettre en cache dynamiquement
        if (isTileRequest && networkResponse && networkResponse.status === 200)
        {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() =>
    {
      // Optionnel : retourner une image par défaut si hors-ligne et tuile non cachée
    })
  );
});


// Activation nouveau Service Worker : nettoyage des anciens caches
self.addEventListener('activate', (event) =>
{
  event.waitUntil(
    caches.keys().then((cacheNames) =>
    {
      return Promise.all([
        ...cacheNames.map((cacheName) =>
        {
          if (cacheName !== CACHE_NAME)
          {
            console.log('Suppression ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        }),
        self.clients.claim()
      ]);
    })
  );
  console.log('Activation du nouveau SW et prise de contrôle des clients');
});
