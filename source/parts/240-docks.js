/* ---------------- docks ---------------- */
function cardSub(c){ return c.k==="sub"?state.subs[c.id]:null; }
function cardName(c){ var s=cardSub(c); if(s) return s.name; var g=gById(c.id); return g?g.name:"(removed)"; }
function cardGid(c){ var s=cardSub(c); return s?s.gid:c.id; }
function cardFrom(c){ var g=gById(cardGid(c)); return c.k==="sub"?(g?g.name:"") : "Main task"; }
function cardPct(c){ var s=cardSub(c); if(s) return s.pct; var g=gById(c.id); return g?groupPct(g):0; }
function cardValid(c){ return c.k==="sub" ? !!state.subs[c.id] : !!gById(c.id); }
/* why a card is in this list, in plain words: the board's reason when it
   suggested it and you took it, where it came from when it was carried, or
   that you put it there. Done cards need none. */
function chipWhy(c,zone){
  if(zone==="done") return "";
  if(c.carried) return "Carried over"+(c.from?" from "+c.from.slice(5):"");
  if(c.why) return "Why: "+c.why;
  return zone==="oftad" ? "You chose this for today" : "You queued this";
}
function chipHTML(c,i,zone){
  var w=chipWhy(c,zone);
  return '<div class="chip'+(c.carried?" carried":"")+'" data-card="'+zone+":"+i+'">'+
    '<span class="c-from">'+esc(cardFrom(c))+(c.carried?" · carried":"")+'</span>'+
    '<span class="c-name">'+esc(cardName(c))+'</span>'+
    (w?'<span class="c-why">'+esc(w)+'</span>':"")+
    '<span class="c-prog">'+cardPct(c)+"% complete</span></div>";
}
function prune(){
  ["oftad","plan","done"].forEach(function(z){ state[z]=state[z].filter(cardValid); });
}
function renderSnaps(){
  var row=$("#snap-row"); if(!row) return;
  var all=readSnaps();
  if(!all.length){
    row.innerHTML='<span style="font-size:12px;color:var(--muted)">'+
      'No earlier days kept yet. The board keeps one copy a day, for 7 days, from tomorrow.</span>';
    return;
  }
  row.innerHTML='<span style="font-size:12px;color:var(--muted)">Go back to the board as it was on</span>'+
    all.map(function(x){
      return '<button class="btn" data-snap="'+esc(x.d)+'">'+esc(x.d)+'</button>'; }).join("");
}
function renderDocks(){
  prune();
  $("#plan-date").textContent=new Date().toLocaleDateString(undefined,{day:"numeric",month:"short"});
  var covered={}; state.oftad.forEach(function(c){ covered[cardGid(c)]=1; });
  $("#oftad").innerHTML = state.oftad.length
    ? state.oftad.map(function(c,i){ return chipHTML(c,i,"oftad"); }).join("")
    : '<p class="hint">Empty</p>';
  /* Waiting can be long; show the first few and let the rest be asked for */
  var WAIT_SHOW=4, waitMore=state.plan.length>WAIT_SHOW;
  $("#plan").innerHTML = state.plan.length
    ? state.plan.map(function(c,i){ return (waitAll||i<WAIT_SHOW) ? chipHTML(c,i,"plan") : ""; }).join("")
    : '<p class="hint">Empty</p>';
  var wm=$("#plan-more");
  if(wm){ wm.hidden=!waitMore; wm.textContent=waitAll?"Show fewer":"Show all "+state.plan.length; }
  $("#done").innerHTML = state.done.length
    ? state.done.map(function(c,i){ return chipHTML(c,i,"done"); }).join("")
    : '<p class="hint">Empty</p>';
  renderPick();
  var dz0=doseNow(), todayN=state.oftad.length+state.done.length;
  $("#oftad-count").textContent=todayN+" of today\u2019s dose of "+dz0.n+(dz0.band==="low"?" (low day)":"")+
    (todayN>dz0.n?" \u00b7 over the dose, your call":"");
  $("#oftad-flash").textContent=(Date.now()<flashT?flash:"");
  var pc=state.plan.length?state.plan.length+" waiting":"Nothing waiting";
  $("#plan-count").textContent=pc;
  $("#plan-roll").textContent=rollNote;
  $("#done-count").textContent=state.done.length?state.done.length+" finished today":"Nothing finished yet today";
  if(typeof mirrorToday==="function") mirrorToday();
  if(typeof buildFlow==="function" && typeof flow!=="undefined") buildFlow();
  $("#daylog").innerHTML=state.dayLog.length
    ? "Earlier days: "+state.dayLog.slice(0,5).map(function(d){
        return "<b>"+d.d.slice(5)+"</b> "+d.done+"/"+d.planned; }).join(" · ")
    : "No earlier days recorded yet.";
}
var waitAll=false;
$("#plan-more").addEventListener("click",function(e){ e.stopPropagation(); waitAll=!waitAll; renderDocks(); });
function saysFlash(msg){ flash=msg; flashT=Date.now()+4600; setTimeout(renderDocks,4700); }
/* The artifact frame silently refuses native modal dialogs, so every
   destructive action arms on its own button and fires on a second click. */
var armed="", armedT=null;
function armGate(key,btn,label){
  if(armed===key){
    armed=""; clearTimeout(armedT); btn.classList.remove("armed");
    if(btn.dataset.lbl) btn.textContent=btn.dataset.lbl;
    return true;
  }
  var prev=document.querySelector(".armed");
  if(prev){ prev.classList.remove("armed"); if(prev.dataset.lbl) prev.textContent=prev.dataset.lbl; }
  clearTimeout(armedT);
  armed=key; btn.dataset.lbl=btn.dataset.lbl||btn.textContent;
  btn.textContent=label; btn.classList.add("armed");
  armedT=setTimeout(function(){
    armed=""; btn.classList.remove("armed");
    if(btn.dataset.lbl) btn.textContent=btn.dataset.lbl;
  },4000);
  return false;
}
