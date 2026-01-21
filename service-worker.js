var CACHE_NAME = "tomi-canina-v1";
var ASSETS = [
  "./",
  "index.html",
  "catalogo.html",
  "servicios.html",
  "como-reservar.html",
  "asistente.html",
  "sugerencias.html",
  "offline.html",
  "css/styles.css",
  "js/main.js",
  "js/ui.js",
  "js/sheets.js",
  "js/assistant.js",
  "js/sugerencias.js",
  "data/productos.json",
  "data/servicios.json",
  "data/estaticos.json",
  "data/galeria.json",
  "data/horario.json",
  "data/sobre_tomi.json",
  "data/venta.json",
  "data/faq.json",
  "data/animacion.json",
  "data/asistente.json",
  "data/promos.json",
  "assets/img/logo.svg",
  "assets/img/og-cover.jpg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request).catch(function () {
        return caches.match("offline.html");
      });
    })
  );
});
