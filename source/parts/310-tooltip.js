/* ---------------- tooltip ---------------- */
var TIP=null;
function hideTip(){ if(TIP){ TIP.remove(); TIP=null; } }
document.addEventListener("pointermove",function(e){
  if(e.pointerType!=="mouse"||pend||scrub) return;
  var el=e.target.closest("[data-tip]");
  if(!el){ hideTip(); return; }
  var b=el.dataset.tip.split("|");
  if(!TIP){ TIP=document.createElement("div"); TIP.className="tip"; document.body.appendChild(TIP); }
  TIP.innerHTML="<b>"+esc(b[0])+'</b><span class="m">'+esc(b[1])+"</span>";
  TIP.style.left=Math.min(e.clientX+14,window.innerWidth-TIP.offsetWidth-8)+"px";
  TIP.style.top=Math.max(8,e.clientY-TIP.offsetHeight-12)+"px";
});
window.addEventListener("scroll",hideTip,{passive:true});

