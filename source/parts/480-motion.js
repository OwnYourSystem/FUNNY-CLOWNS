/* ---------------- motion ---------------- */
function flashIn(el){
  if(REDUCE||!el||!el.animate) return;
  try{ el.animate([{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"none"}],
        {duration:380,easing:"cubic-bezier(.22,.61,.36,1)"}); }catch(e){}
}
/* figures ease to their new value instead of snapping */
function ease(el,to,dec,suffix){
  if(!el) return;
  var from=parseFloat(el.textContent)||0;
  if(REDUCE||!el.animate||Math.abs(to-from)<0.05){ el.textContent=to.toFixed(dec)+suffix; return; }
  var t0=performance.now(), ms=620;
  (function step(t){
    var k=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-k,3);
    el.textContent=(from+(to-from)*e).toFixed(dec)+suffix;
    if(k<1) requestAnimationFrame(step);
  })(t0);
}
/* a ring that trails the cursor, and a slow bloom that follows it across the page */
(function(){
  if(REDUCE||!window.matchMedia("(pointer: fine)").matches) return;
  var ring=document.createElement("div"); ring.className="cursor-ring";
  var glow=document.createElement("div"); glow.className="spotlight";
  document.body.appendChild(glow); document.body.appendChild(ring);
  var cx=innerWidth/2, cy=innerHeight/2, rx=cx, ry=cy, gx=cx, gy=cy, sc=1, ts=1;
  var HOT="[data-grip],[data-card],.btn,.mini,.pen,.track,.rname,summary";
  addEventListener("pointermove",function(e){
    if(e.pointerType!=="mouse") return;
    cx=e.clientX; cy=e.clientY;
    var hot=e.target.closest&&e.target.closest(HOT);
    ts=hot?2.05:1; ring.classList.toggle("on",!!hot);
  },{passive:true});
  (function loop(){
    rx+=(cx-rx)*.18; ry+=(cy-ry)*.18;
    gx+=(cx-gx)*.035; gy+=(cy-gy)*.035;
    sc+=(ts-sc)*.15;
    ring.style.transform="translate3d("+rx.toFixed(1)+"px,"+ry.toFixed(1)+"px,0) translate(-50%,-50%) scale("+sc.toFixed(3)+")";
    glow.style.transform="translate3d("+(gx-330).toFixed(1)+"px,"+(gy-330).toFixed(1)+"px,0)";
    requestAnimationFrame(loop);
  })();
})();


