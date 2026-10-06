/* ---------------- the world, in the same strip ----------------
   A browser cannot read a news feed from this origin, and the feed is XML,
   so a small function on the same server fetches it and hands back titles.
   A plain static host has no function behind this path, and an artifact
   frame is never the same origin as one, so /api/news on its own only
   works from the Vercel deployment itself. Everywhere else falls back to
   asking that deployment directly - it answers any origin, since the feed
   is public and read-only.

   It is fetched once on load and every fifteen minutes after, and held in
   this tab only. Nothing about the board is sent with the request.      */
var NEWS=[], newsAt=0, newsBusy=false, newsOff=false;
var NEWS_HOST = /(^|\.)vercel\.app$/.test(location.hostname) ? ""
  : "https://funny-clowns-git-app-oys-s-projects.vercel.app";
function newsItems(){ return NEWS; }
function loadNews(force){
  var me=state.me||freshMe(), want=(me.feeds||[]).slice(0,6);
  if(!want.length){ if(NEWS.length){ NEWS=[]; renderTick(); } return; }
  if(newsBusy||newsOff) return;
  if(!force && Date.now()-newsAt < 900000) return;
  if(location.protocol.indexOf("http")!==0) return;   /* no server, no news */
  newsBusy=true;
  fetch(NEWS_HOST+"/api/news?f="+encodeURIComponent(want.join(",")))
    .then(function(r){
      /* A plain static host with no function behind this path, and no
         fallback host to try either, is the one case left that can 404.
         One 404 is enough to know; stop asking. */
      if(r.status===404){ newsOff=true; return {items:[]}; }
      return r.ok ? r.json() : {items:[]};
    })
    .then(function(j){
      NEWS=(j.items||[]).map(function(x){
        return {news:true, kind:feedLabel(x.k), t:String(x.t||"").slice(0,140), w:String(x.s||"")};
      });
      newsAt=Date.now(); newsBusy=false; renderTick();
    })
    .catch(function(){ newsBusy=false; newsAt=Date.now()-840000; });   /* try again in a minute */
}
var TICK_SPEED=80; /* pixels a second */
/* The panel carries the full reason. The banner carries only what tells you
   whether to press it: how late, how loud, how far along. The subtask it
   would land on is left out, because pressing it is how you find that.  */
function tickWhy(a){
  var g=gById(a.gid); if(!g) return a.w;
  var n=daysLeft(g);
  return (n!==null?dueLabel(g):"no deadline")+" \u00b7 "+groupPct(g)+"%";
}
function tickItem(a){
  if(a.news)
    return '<span class="tick-item news"><span class="tk">'+esc(a.kind)+'</span>'+
      '<b>'+esc(a.t)+'</b>'+(a.w?'<span>'+esc(a.w)+'</span>':"")+
      '<span class="tick-sep"></span></span>';
  return '<button class="tick-item'+(a.score>=150?" crit":"")+'" data-goto-goal="'+a.gid+
    '" data-goto-sub="'+esc(a.sid)+'"><span class="tk">'+esc(a.kind)+'</span>'+
    '<b>'+esc(a.t)+'</b><span>'+esc(tickWhy(a))+'</span><span class="tick-sep"></span></button>';
}
function renderTick(){
  var bar=$("#tick"), run=$("#tick-run"); if(!bar||!run) return;
  /* It reports on the board, so it lives on the board. On Tags, Backlog,
     Archive and the Planner it would be reporting on a page you are not
     looking at.                                                          */
  if(curView!=="board"){ bar.hidden=true; run.innerHTML=""; return; }
  var al=alerts();
  if(!al.length && !newsItems().length){ bar.hidden=true; run.innerHTML=""; return; }
  bar.hidden=false;
  var hot=screaming()>0;
  bar.classList.toggle("hot",hot);
  $("#tick-tag").textContent = hot ? "Needs a look now"
    : (alerts().length ? "Needs a look" : "Live");
  var strip=al.slice(0,8).concat(newsItems()).slice(0,20).map(tickItem).join("");
  run.innerHTML=strip+strip;              /* twice, so -50% lands on the seam */
  /* the run is two copies, so one lap is half of what the browser measures */
  requestAnimationFrame(function(){
    var lap=run.scrollWidth/2;
    if(lap>0) run.style.setProperty("--tick-t",(lap/TICK_SPEED).toFixed(1)+"s");
  });
}
function renderAlerts(){
  var q=searchQ();
  var al=alerts().filter(function(a){ return hit(a.t+" "+a.w,q); });
  var box=$("#alerts"), panel=$('[data-panel="alerts"]');
  if(panel) panel.classList.toggle("siren", screaming()>0 && !q && doseNow().band!=="low");
  if(!al.length){ box.innerHTML='<p class="calm">Nothing needs attention.</p>'; return; }
  box.innerHTML=al.slice(0,8).map(function(a){
    return '<button class="alert'+(a.score>=150?" hot":"")+'" data-goto-goal="'+a.gid+'" data-goto-sub="'+esc(a.sid)+'">'+
      '<span class="sev '+a.sev+'"></span><div class="a-body"><div class="a-title">'+esc(a.t)+
      '</div><div class="a-why">'+esc(a.w)+'</div></div><span class="a-kind">'+esc(a.kind)+"</span></button>"; }).join("");
}

