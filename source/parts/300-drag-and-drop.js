/* ---------------- drag and drop ---------------- */
var ZONES={oftad:$("#oftad"),plan:$("#plan"),done:$("#done")};
var pend=null, dragRAF=null;
var REDUCE=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function inRect(el,x,y){ var r=el.getBoundingClientRect(); return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; }
function zoneAt(x,y){ for(var z in ZONES) if(inRect(ZONES[z],x,y)) return z; return null; }
function clearMarks(){
  document.querySelectorAll(".drop-on,.drop-before,.drop-after").forEach(function(el){
    el.classList.remove("drop-on","drop-before","drop-after"); });
  Object.keys(ZONES).forEach(function(z){ ZONES[z].classList.remove("hot"); });
}
function rowAt(x,y){
  var el=document.elementFromPoint(x,y); if(!el||!el.closest) return null;
  return el.closest("[data-group]")||el.closest("[data-sub]");
}
function markEdge(row,y){
  var r=row.getBoundingClientRect();
  row.classList.add(y<r.top+r.height/2?"drop-before":"drop-after");
}
function paintTargets(x,y,z){
  clearMarks();
  if(z===undefined) z=zoneAt(x,y);
  if(z){ ZONES[z].classList.add("hot"); return; }
  if(!pend||pend.src!=="grip") return;
  var kind=pend.key.split(":")[0], row=rowAt(x,y);
  if(!row) return;
  if(kind==="sub" && row.dataset.group) row.classList.add("drop-on");
  else if(kind==="sub" && row.dataset.sub) markEdge(row,y);
  else if(kind==="task" && row.dataset.group) markEdge(row,y);
}
/* one loop: carries the card, scrolls the page at the edges, repaints the target */
function dragLoop(){
  if(!pend||!pend.moved||!pend.ghost){ dragRAF=null; return; }
  var x=pend.lx, y=pend.ly, H=window.innerHeight, Z=140, sp=0;
  var over=zoneAt(x,y);
  /* the edge band drives the scroll; moving onto a dock leaves the band and it stops */
  if(y<Z) sp=-(1-y/Z)*28;
  else if(y>H-Z) sp=(1-(H-y)/Z)*28;
  if(sp) window.scrollBy(0,sp);
  var tx=x-pend.ox, ty=y-pend.oy, k=REDUCE?1:.24;
  pend.gx+=(tx-pend.gx)*k; pend.gy+=(ty-pend.gy)*k;
  var tilt=REDUCE?0:Math.max(-9,Math.min(9,(tx-pend.gx)*.3));
  pend.ghost.style.transform="translate3d("+pend.gx.toFixed(1)+"px,"+pend.gy.toFixed(1)+"px,0) rotate("+tilt.toFixed(2)+"deg)";
  paintTargets(x,y,over);
  dragRAF=requestAnimationFrame(dragLoop);
}
function stopDragVisuals(){
  document.body.classList.remove("dragging");
  if(dragRAF){ cancelAnimationFrame(dragRAF); dragRAF=null; }
  clearMarks();
}
document.addEventListener("pointerdown",function(e){
  if(e.button!==undefined&&e.button>0) return;
  var el=null, src=null, key=null;
  var grip=e.target.closest("[data-grip]"), chip=e.target.closest("[data-card]");
  if(grip){ el=grip; src="grip"; key=grip.dataset.grip; }
  else if(chip){ el=chip; src="card"; key=chip.dataset.card; }
  else if(e.pointerType==="mouse"){
    /* with a mouse the whole label is a handle; touch keeps to the grip so the page still scrolls */
    var nm=e.target.closest(".rname"), row=nm&&nm.closest("[data-sub],[data-group]");
    if(row){ el=nm; src="grip"; key=row.dataset.sub?("sub:"+row.dataset.sub):("task:"+row.dataset.group); }
  }
  if(!el) return;
  e.preventDefault();
  try{ el.setPointerCapture(e.pointerId); }catch(err){}
  pend={el:el,pid:e.pointerId,x0:e.clientX,y0:e.clientY,lx:e.clientX,ly:e.clientY,
        moved:false,ghost:null,src:src,key:key,ox:80,oy:26,gx:0,gy:0};
  hideTip();
});
document.addEventListener("pointermove",function(e){
  if(!pend||e.pointerId!==pend.pid) return;
  pend.lx=e.clientX; pend.ly=e.clientY;
  if(!pend.moved){
    var dx=e.clientX-pend.x0, dy=e.clientY-pend.y0;
    if(dx*dx+dy*dy<49) return;
    pend.moved=true;
    var html;
    if(pend.src==="grip"){
      var b=pend.key.split(":");
      html=chipHTML({k:b[0]==="task"?"task":"sub",id:b[1]},-1,"x").replace(/^<div[^>]*>/,"").replace(/<\/div>$/,"");
    } else html=pend.el.innerHTML;
    pend.ghost=document.createElement("div");
    pend.ghost.className="chip ghost"; pend.ghost.innerHTML=html;
    document.body.appendChild(pend.ghost);
    pend.ox=Math.min(150,pend.ghost.offsetWidth/2); pend.oy=28;
    pend.gx=e.clientX-pend.ox; pend.gy=e.clientY-pend.oy;
    if(pend.src==="card") pend.el.style.opacity=".28";
    document.body.classList.add("dragging");
    if(!dragRAF) dragRAF=requestAnimationFrame(dragLoop);
  }
  e.preventDefault();
});
function addCard(zone,c,at){
  if(zone==="oftad"){
    if(c.k!=="sub"){ saysFlash("One subtask at a time in here. Whole main tasks go in Waiting."); return false; }
    var gid=cardGid(c), replaced=null;
    state.oftad=state.oftad.filter(function(x){
      if(cardGid(x)===gid && x.id!==c.id){ replaced=cardName(x); return false; } return true; });
    if(replaced) saysFlash("Swapped out “"+replaced+"”. One per main task.");
  }
  var arr=state[zone];
  for(var i=0;i<arr.length;i++) if(arr[i].k===c.k&&arr[i].id===c.id) return false;
  arr.splice(at===undefined?arr.length:clamp(at,0,arr.length),0,c);
  return true;
}
function insertPos(zone,x,y){
  var chips=Array.prototype.slice.call(ZONES[zone].querySelectorAll(".chip"));
  for(var i=0;i<chips.length;i++){
    var r=chips[i].getBoundingClientRect();
    if(y<r.bottom&&x<r.left+r.width/2) return i;
  }
  return chips.length;
}
function edgeIndex(list,row,y){
  var i=list.indexOf(row.dataset.sub||row.dataset.group);
  var r=row.getBoundingClientRect();
  return y<r.top+r.height/2 ? i : i+1;
}
document.addEventListener("pointerup",function(e){
  if(!pend||e.pointerId!==pend.pid) return;
  var p=pend; pend=null;
  if(p.ghost) p.ghost.remove();
  p.el.style.opacity="";
  stopDragVisuals();
  var bits=p.key.split(":");
  if(!p.moved){
    if(p.src==="grip"&&bits[0]==="task"&&state.sel!==bits[1]){
      state.sel=bits[1]; openEd=""; openGroupEd=false; save(); renderMain(); renderSubs(); flashIn($("#sub-bars"));
    }
    return;
  }
  var z=zoneAt(e.clientX,e.clientY);
  if(p.src==="card"){
    var from=bits[0], idx=+bits[1], card=state[from][idx];
    if(!card){ renderDocks(); return; }
    state[from].splice(idx,1);
    if(z){ if(!addCard(z,card,insertPos(z,e.clientX,e.clientY)) && z===from) state[from].splice(idx,0,card); }
    save(); renderKpis(); renderAlerts(); renderDocks(); return;
  }
  var c={k:bits[0]==="task"?"task":"sub",id:bits[1]};
  if(z){ addCard(z,c,insertPos(z,e.clientX,e.clientY)); save(); renderKpis(); renderAlerts(); renderDocks(); return; }
  var row=rowAt(e.clientX,e.clientY);
  if(!row) return;
  if(c.k==="sub"&&row.dataset.group){
    var sb=state.subs[c.id], g=gById(row.dataset.group);
    if(sb&&g&&sb.gid!==g.id){ detach(sb.id); g.subs.push(sb.id); sb.gid=g.id; mark(sb.id,"group"); save(); renderAll(); }
    return;
  }
  if(c.k==="task"&&row.dataset.group){
    var ids=state.groups.map(function(g){ return g.id; });
    var cur2=ids.indexOf(c.id); if(cur2<0) return;
    var at2=edgeIndex(ids,row,e.clientY);
    var moved=state.groups.splice(cur2,1)[0];
    state.groups.splice(at2>cur2?at2-1:at2,0,moved);
    save(); renderMain();
  }
});
document.addEventListener("pointercancel",function(e){
  if(!pend||e.pointerId!==pend.pid) return;
  if(pend.ghost) pend.ghost.remove();
  pend.el.style.opacity=""; pend=null; stopDragVisuals();
});
$("#oftad-clear").addEventListener("click",function(e){ e.stopPropagation(); if(state.oftad.length&&armGate("c-oftad",this,"Clear?")){ state.oftad=[]; save(); renderKpis(); renderAlerts(); renderDocks(); } });
$("#plan-clear").addEventListener("click",function(e){ e.stopPropagation(); if(state.plan.length&&armGate("c-plan",this,"Clear?")){ state.plan=[]; save(); renderKpis(); renderAlerts(); renderDocks(); } });
$("#done-clear").addEventListener("click",function(e){ e.stopPropagation(); if(state.done.length&&armGate("c-done",this,"Clear?")){ state.done=[]; save(); renderKpis(); renderAlerts(); renderDocks(); } });

