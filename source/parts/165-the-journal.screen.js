function renderJournal(){
  var card=$("#jr-check"), body=$("#jr-body");
  if(card){
    var c=(state.me&&state.me.done)?jrCardOn():null;
    if(!c){ card.hidden=true; card.innerHTML=""; }
    else {
      var s=jrSays(c);
      card.hidden=false;
      card.innerHTML='<div class="jr-k">Where you left off &middot; '+esc(s.head)+'</div>'+
        s.lines.map(function(t){ return '<p>'+esc(t)+'</p>'; }).join("")+
        '<div class="jr-acts"><button class="mini" data-jr-write="start">Write today&rsquo;s start</button><button class="mini" data-jr-hide>Hide</button></div>';
    }
  }
  if(body){
    var l=jrData().log.slice().reverse();
    if(!l.length){ body.innerHTML='<p class="wk-note">No entries yet. Press Write, or type &ldquo;journal my day&rdquo; to the assistant.</p>'; return; }
    var days=[], by={};
    l.forEach(function(e){ if(!by[e.d]){ by[e.d]=[]; days.push(e.d); } by[e.d].push(e); });
    body.innerHTML=days.map(function(d){
      return '<div class="jr-day"><div class="jr-date">'+esc(jrDateLabel(d))+'</div>'+by[d].map(function(e){
        var K=JR_KINDS[e.kind]||JR_KINDS.end;
        return '<div class="jr-e"><div class="jr-meta">'+esc(e.tm)+' &middot; '+esc(K.name)+'</div>'+
          (e.a?'<p><b>'+esc(K.a)+'</b> '+esc(e.a)+'</p>':'')+(e.b?'<p><b>'+esc(K.b)+'</b> '+esc(e.b)+'</p>':'')+'</div>';
      }).join("")+'</div>';
    }).join("");
  }
}
document.addEventListener("click",function(e){
  var w=e.target.closest&&e.target.closest("[data-jr-write]");
  if(w){ e.stopPropagation(); jrAsk(w.getAttribute("data-jr-write")||""); return; }
  if(e.target.closest&&e.target.closest("[data-jr-hide]")){ jrHide(); renderAll(); }
});
