/* The board is one file, so the cache is one file plus its icons. It opens
   offline from the home screen, and picks up a new build in the background. */
var CACHE = "board-v2";
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
function keep(req,res){
  if(res && res.ok) caches.open(CACHE).then(function(c){ c.put(req, res.clone()); });
  return res;
}
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  /* The board itself comes from the network whenever there is one, so a new
     build shows on the first open rather than the second. The cache is what
     answers when there is no network. Everything else is served from the
     cache at once and refreshed behind it.                                */
  if(req.mode === "navigate" || (req.headers.get("accept")||"").indexOf("text/html") >= 0){
    e.respondWith(fetch(req).then(function(res){ return keep(req,res); })
      .catch(function(){ return caches.match(req,{ignoreSearch:true})
        .then(function(hit){ return hit || caches.match("./index.html"); }); }));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch:true}).then(function(hit){
    var live = fetch(req).then(function(res){ return keep(req,res); }).catch(function(){ return hit; });
    return hit || live;
  }));
});
