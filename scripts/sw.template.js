// Generado por scripts/generate-sw.mjs a partir de scripts/sw.template.js. No editar public/sw.js.
const CACHE = "film-impostor-__VERSION__";
const URLS = "__URLS__";
const PRECACHED = new Set(URLS);
const WALL = "__WALL__";
const WALL_SET = new Set(WALL);

// Todo o nada: si falla un archivo, esta versión no se instala y sigue la anterior.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(URLS.map((url) => new Request(url, { cache: "reload" }))).then(() =>
          // Los carteles de la pared se intentan aparte: sin alguno, el inicio enseña su color medio y la app funciona igual.
          Promise.allSettled(WALL.map((url) => cache.add(new Request(url, { mode: "cors" })))),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("film-impostor-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// La app se sirve siempre de la caché, con o sin red: abre al instante y la página y sus archivos son
// de la misma versión. Una versión nueva se descarga aparte y se ve la siguiente vez que se abre.
// Lo demás (la API y los carteles de cada partida) no pasa por aquí: sin red falla y la app ya sabe qué hacer.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (WALL_SET.has(request.url)) {
    event.respondWith(
      caches.match(request.url, { cacheName: CACHE, ignoreVary: true }).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !PRECACHED.has(url.pathname)) return;

  event.respondWith(
    caches
      .match(url.pathname, { cacheName: CACHE, ignoreSearch: true, ignoreVary: true })
      .then((cached) => cached ?? fetch(request)),
  );
});
