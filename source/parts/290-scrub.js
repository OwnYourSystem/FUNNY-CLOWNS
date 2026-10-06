/* ---------------- scrub ---------------- */
var scrub=null;
function scrubTo(track,x){
  var r=track.getBoundingClientRect(), v=clamp(Math.round(((x-r.left)/r.width)*100/5)*5,0,100);
  track.querySelector(".fill").style.width=v+"%";
  track.closest(".row").querySelector(".rval").textContent=v+"%";
  return v;
}
$("#sub-bars").addEventListener("pointerdown",function(e){
  var t=e.target.closest("[data-scrub]"); if(!t) return;
  if(e.button!==undefined&&e.button>0) return;
  try{ t.setPointerCapture(e.pointerId); }catch(err){}
  scrub={el:t,pid:e.pointerId,val:scrubTo(t,e.clientX)}; hideTip();
});
$("#sub-bars").addEventListener("pointermove",function(e){
  if(!scrub||e.pointerId!==scrub.pid) return;
  e.preventDefault(); scrub.val=scrubTo(scrub.el,e.clientX);
});
$("#sub-bars").addEventListener("pointerup",function(){
  if(!scrub) return;
  var s=state.subs[scrub.el.dataset.scrub], v=scrub.val; scrub=null;
  if(s && s.pct!==v){
    state.log.push({t:Date.now(),id:s.id,from:s.pct,to:v}); if(state.log.length>500) state.log.shift();
    s.pct=v; s.upd=todayStr();
    if(v>=100) s.status="done"; else if(s.status==="done") s.status="doing";
    else if(v>0&&s.status==="todo") s.status="doing";
    touchHist(); save(); renderAll();
  } else renderSubs();
});
$("#sub-bars").addEventListener("pointercancel",function(){ scrub=null; renderSubs(); });
$("#sub-bars").addEventListener("keydown",function(e){
  var t=e.target.closest("[data-scrub]"); if(!t) return;
  var s=state.subs[t.dataset.scrub]; if(!s) return;
  var step=0;
  if(e.key==="ArrowRight"||e.key==="ArrowUp") step=5;
  else if(e.key==="ArrowLeft"||e.key==="ArrowDown") step=-5;
  else if(e.key==="Home") step=-s.pct; else if(e.key==="End") step=100-s.pct; else return;
  e.preventDefault();
  s.pct=clamp(s.pct+step,0,100); s.upd=todayStr();
  if(s.pct>=100) s.status="done"; else if(s.status==="done") s.status="doing";
  touchHist(); save(); renderAll();
});

