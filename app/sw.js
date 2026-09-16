/* The board is one file, so the cache is one file plus its icons. It opens
   offline from the home screen, and picks up a new build in the background. */
var CACHE = "board-v1";
var SHELL = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req, {ignoreSearch:true}).then(function(hit){
    var live = fetch(req).then(function(res){
      if(res && res.ok) caches.open(CACHE).then(function(c){ c.put(req, res.clone()); });
      return res;
    }).catch(function(){ return hit; });
    return hit || live;
  }));
});
