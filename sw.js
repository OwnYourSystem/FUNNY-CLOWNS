/* The board is one file, so the cache is one file plus its icons. It opens
   offline from the home screen, and picks up a new build in the background. */
var CACHE = "board-v6";
var DIGEST = "board-digest";   /* the page leaves a short summary here for the push handler; it is never cleaned away */
var SHELL = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return (k===CACHE || k===DIGEST) ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
function keep(req,res){
  if(res && res.ok) caches.open(CACHE).then(function(c){ c.put(req, res.clone()); });
  return res;
}
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  /* The news call carries what it wants in the query string, and the cache
     lookup below ignores query strings, so a cached answer for one set of
     topics would be served for every other set. It is live or nothing. */
  if(new URL(req.url).pathname.indexOf("/api/") === 0) return;
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

/* ---------------- push ----------------
   The server sends one word, "am" or "pm", at the person's times. It does not
   know a single task. The words of the notification are written here, from the
   summary the page keeps in the cache on this device. If the summary is not
   from today, the notification says so plainly and quotes no old numbers.   */
function clip(s, n){ s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+$/, "") + "\u2026" : s; }
function localDay(){
  var d = new Date(), p = function(n){ return (n < 10 ? "0" : "") + n; };
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function readDigest(){
  return caches.open(DIGEST)
    .then(function(c){ return c.match(new URL("digest.json", self.registration.scope).href); })
    .then(function(r){ return r ? r.json() : null; })
    .catch(function(){ return null; });
}
function compose(kind, dg){
  var fresh = dg && dg.d === localDay();
  if(kind === "am"){
    if(fresh && dg.am) return {tag:"oys-brief", t:clip("Today: " + dg.am.t, 40), b:clip(dg.am.b, 120)};
    return {tag:"oys-brief", t:"A new day", b:"Open the board to see what fits it."};
  }
  if(kind === "pm"){
    if(fresh) return dg.nOpen > 0
      ? {tag:"oys-today", t:"Still open", b:clip(dg.nOpen + " still open: " + (dg.open || []).join(", "), 120)}
      : {tag:"oys-today", t:"Today is clear", b:"Nothing is open in Today."};
    return {tag:"oys-today", t:"Check in", b:"Open the board to see what is left today."};
  }
  return {tag:"oys-brief", t:"Reminder", b:"Open the board to see today."};
}
/* A reminder stays until the person closes it (requireInteraction). The two scheduled ones are also written
   to the cache as a notice, so the page can hold itself still until the person says Got it, even if they
   open the board by its icon rather than by pressing the notification.                                      */
var NOTICE_TAGS = {"oys-brief": 1, "oys-today": 1};
function noticeUrl(){ return new URL("notice.json", self.registration.scope).href; }
function writeNotice(m){
  return caches.open(DIGEST).then(function(c){
    return c.put(noticeUrl(), new Response(JSON.stringify({d: localDay(), t: m.t, b: m.b, tag: m.tag, at: Date.now()}), {headers: {"content-type": "application/json"}}));
  }).catch(function(){});
}
function tellPages(){
  return self.clients.matchAll({type: "window", includeUncontrolled: true}).then(function(list){
    list.forEach(function(c){ try{ c.postMessage({type: "oys-notice"}); }catch(_e){} });
  }).catch(function(){});
}
self.addEventListener("push", function(e){
  var kind = "x";
  try{ var j = e.data && e.data.json(); if(j && (j.k === "am" || j.k === "pm")) kind = j.k; }catch(_e){}
  e.waitUntil(readDigest().then(function(dg){
    var m = compose(kind, dg);
    var kept = NOTICE_TAGS[m.tag] && kind !== "x" ? writeNotice(m) : Promise.resolve();
    return kept.then(function(){
      return self.registration.showNotification(m.t, {body:m.b, tag:m.tag, icon:"icon-192.png", badge:"icon-192.png", requireInteraction:true, data:{url:"./"}});
    }).then(tellPages);
  }));
});
/* Swiping a reminder away is closing it: the board does not hold the person to it afterwards. */
self.addEventListener("notificationclose", function(e){
  var tag = e.notification && e.notification.tag;
  if(!NOTICE_TAGS[tag]) return;
  e.waitUntil(caches.open(DIGEST).then(function(c){
    return c.match(noticeUrl()).then(function(r){ return r ? r.json() : null; }).then(function(n){ if(n && n.tag === tag) return c.delete(noticeUrl()); });
  }).catch(function(){}));
});
self.addEventListener("notificationclick", function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({type:"window", includeUncontrolled:true}).then(function(list){
    for(var i = 0; i < list.length; i++) if("focus" in list[i]) return list[i].focus();
    return self.clients.openWindow(url);
  }));
});
