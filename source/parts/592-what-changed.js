/* ---------------- what changed (2026-10-21) ----------------
   Principle 6 (owner): Qordel is updated often, and a person is never
   surprised. The release of 2026-10-21 changed how the next step is chosen
   and took some settings away, so a board that was set up before it is told
   once, in plain words, on Now (phone) and on the board (desktop). A board
   from before carries the old settings (commute, sharpest time) that nothing
   deletes; boot() turns that into wn:"show". New boards never see it.
   "Got it" puts it away for good.                                         */
/* a function, not a var: the board can draw before this part has run */
function wnItems(){ return [
  "The next step now follows 5 simple rules: your energy, the time of day, the delivery days of your goals, and the order of their steps.",
  "On a very low day, or near the end of your day, nothing is asked. Your easy things show instead.",
  "Some settings are gone: goal priority, commute, sharpest time, training and a step’s own date. All your goals and steps are still here.",
  "New: a speaker button reads a card aloud, and the board can learn from what you do. It always asks before it keeps anything."
]; }
function wnOn(){ return state.wn==="show" && !!(state.me && state.me.done); }
function wnDone(){ state.wn="seen"; save(); renderAll(); if(typeof PH_ON!=="undefined"&&PH_ON){ PH_DRAWN=""; phRender(); } }
function wnPhone(){
  if(!wnOn()) return "";
  return '<section class="ph-card ph-wn" aria-label="What changed in Qordel">'+(typeof sayBtn==="function"?sayBtn("ph-say","Read this card aloud"):"")+
    '<h2 class="ph-h2">What changed in Qordel</h2><ul class="ph-wn-l">'+wnItems().map(function(t){ return '<li>'+esc(t)+'</li>'; }).join("")+'</ul>'+
    '<div class="ph-acts"><button type="button" class="ph-btn ph-pri" data-ph="wnok">Got it</button></div></section>';
}
function renderWn(){
  var box=$("#wncard"); if(!box) return;
  if(!wnOn()){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML='<div class="floor-k">What changed in Qordel</div><ul class="wn-l">'+wnItems().map(function(t){ return '<li>'+esc(t)+'</li>'; }).join("")+'</ul>'+
    '<div class="floor-foot"><button class="btn take" data-wn-ok>Got it</button></div>';
}
document.addEventListener("click",function(e){ if(e.target.closest&&e.target.closest("[data-wn-ok]")) wnDone(); });
