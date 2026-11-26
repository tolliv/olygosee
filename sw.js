const VersionSW = "2611.26e";
const APP_CACHE_NAME = "OlyGoApp"+ VersionSW;
const TILE_CACHE_NAME = "OlyGoTiles";
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

//--------------------------------------------------------------------------------------------------
// Fonction de limite de taille du cache TILE_CACHE_NAME
//--------------------------------------------------------------------------------------------------
async function limitCacheSize(cacheName, maxItems)
{
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems)
  {
    // Supprime la plus ancienne (la première de la liste)
    await cache.delete(keys[0]);
    // Récursivité pour s'assurer qu'on repasse sous la limite
    limitCacheSize(cacheName, maxItems);
  }
}

//--------------------------------------------------------------------------------------------------
// Installation : Mise en cache des fichiers si changement du sw.js
//--------------------------------------------------------------------------------------------------
self.addEventListener('install', (event) =>
{
  event.waitUntil(
    caches.open(APP_CACHE_NAME)
      .then((cache) =>
      {
        console.log('Installation nouvelle version :', APP_CACHE_NAME);
        cache.addAll(ASSETS);
      })
  );
  self.skipWaiting();
});

//--------------------------------------------------------------------------------------------------
// Stratégie : Répondre avec le cache si hors-ligne
//--------------------------------------------------------------------------------------------------
self.addEventListener('fetch', (event) =>
{
  const url = new URL(event.request.url);

  // Les requêtes supabase ne sont pas gérées par le SW
  if (url.hostname.includes('supabase.co'))
  {
    return;
  }

  // Ne pas mettre en cache les requêtes non-GET (Supabase utilise souvent POST/PATCH)
  if (event.request.method !== 'GET')
  {
    return;
  }

  const isTileRequest = url.hostname.includes('tile.openstreetmap.org') || url.pathname.includes('/tiles/');

  event.respondWith(
    caches.match(event.request, { ignoreSearch: isTileRequest }).then((response) =>
    {
      // Si la ressource est dans le cache, on la retourne
      if (response)
        return (response);

      // Sinon, on va la chercher sur le réseau
      return fetch(event.request).then((networkResponse) =>
      {
        // Si c'est une tuile ou une ressource que l'on veut mettre en cache dynamiquement
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0))
        {
          const responseToCache = networkResponse.clone();

          // On choisit le cache de destination
          const targetCache = isTileRequest ? TILE_CACHE_NAME : APP_CACHE_NAME;

          caches.open(targetCache).then((cache) =>
          {
            cache.put(event.request, responseToCache);
            // console.log("Put cache ", event.request.url);

            // Limiter la taille du cache des tuiles uniquement
            if (isTileRequest)
            {
               limitCacheSize(TILE_CACHE_NAME, 1000);
            }
          });
        }
        return (networkResponse);
      });
    }).catch(() =>
    {
      // Retourner une image par défaut si hors-ligne et tuile non cachée
    })
  );
});

//--------------------------------------------------------------------------------------------------
// Activation nouveau Service Worker : nettoyage des anciens caches
//--------------------------------------------------------------------------------------------------
self.addEventListener('activate', (event) =>
{
  event.waitUntil(
    caches.keys().then((cacheNames) =>
    {
      return Promise.all([
        cacheNames.map((cacheName) =>
        {
          if (cacheName.startsWith("OlygoApp") && (cacheName !== APP_CACHE_NAME))
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
