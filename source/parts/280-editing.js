/* ---------------- editing ---------------- */
function mark(id,field){ state.ue[id+"|"+field]=1; }
/* One change to a subtask or a goal. The classic editor and the phone both
   come through here, so the two can never drift apart. false means the value
   was refused (an empty name) and nothing changed.                       */
function editSub(s,k,v){
  v=v==null?"":String(v);
  if(k==="name"){ if(!v.trim()) return false; s.name=v.trim(); mark(s.id,"name"); }
  else if(k==="status"){ s.status=v; if(v==="done") s.pct=100; else if(s.pct>=100) s.pct=95; s.upd=todayStr(); }
  else if(k==="pct"){ s.pct=clamp(Math.round(+v/5)*5,0,100); s.upd=todayStr();
    s.status = s.pct>=100?"done":(s.pct>0&&s.status==="todo"?"doing":s.status); }
  else if(k==="rep"){
    s.rep=v; s.period=v?periodKey(v):""; s.streak=s.streak||0;
    if(v){ s.pct=0; s.status="todo"; s.upd=todayStr(); }
  }
  else if(k==="tag") s.tag=v.trim();
  else if(k==="prio") s.prio=SUB_W[v]?v:"mid";
  else if(k==="due"){ s.due=v||""; mark(s.id,"due"); }
  else if(k==="easy"){ if(v==="1"||v==="true") s.easy=true; else delete s.easy; mark(s.id,"easy"); }
  else return false;
  touchHist(); return true;
}
function editGoal(g,k,v){
  v=v==null?"":String(v);
  if(k==="name"){ if(!v.trim()) return false; g.name=v.trim(); mark(g.id,"name"); }
  else if(k==="due"){ g.due=v||""; mark(g.id,"due"); }
  else if(k==="prio"){ g.prio=v||"mid"; mark(g.id,"prio"); }
  else if(k==="where"){ g.where=v||"any"; mark(g.id,"where"); }
  else if(k==="tags"){
    g.tags=v.split(",").map(function(t){ return t.trim().toLowerCase(); })
      .filter(function(t,i,a){ return t && a.indexOf(t)===i; }).slice(0,5);
    mark(g.id,"tags");
  }
  else return false;
  return true;
}
/* the backlog: add an idea, make one a goal, remove one. Both views call these. */
function backlogAdd(t){ var v=String(t||"").trim(); if(!v) return null; var it={t:v,d:todayStr()}; state.backlog.unshift(it); return it; }
function backlogActivate(i){
  var it=state.backlog.splice(i,1)[0]; if(!it) return null;
  var g=it.goal||newGoal(it.t);
  state.groups.push(g); state.sel=g.id; touchHist();
  return {g:g, wasGoal:!!it.goal};
}
function backlogRemove(i){
  var it=state.backlog[i]; if(!it) return false;
  if(it.goal){ it.goal.subs.forEach(function(id){ delete state.subs[id]; state.killed.push(id); }); state.killed.push(it.goal.id); }
  state.backlog.splice(i,1); touchHist();
  return true;
}
/* a new subtask, and removing one for good: the same from both views */
function addSub(g,name,rep){
  var n=String(name||"").trim(); if(!g||!n) return null;
  var id=uid("s"), rp=rep||"";
  state.subs[id]={id:id,name:n,pct:0,status:"todo",tag:"",upd:todayStr(),gid:g.id,
                  rep:rp,period:rp?periodKey(rp):"",streak:0,best:0,prio:"mid"};
  g.subs.push(id); touchHist();
  return state.subs[id];
}
function removeSub(id){
  if(!state.subs[id]) return false;
  detach(id); delete state.subs[id]; state.killed.push(id); touchHist();
  return true;
}
/* a subtask goes under another goal: the drag on the board, the Goal box on the phone */
/* the order of the steps is the sequence they are done in (2026-10-20) */
function moveSubOrder(sid,dir){
  var sb=state.subs[sid], g=sb&&gById(sb.gid); if(!g) return false;
  var i=g.subs.indexOf(sid), j=i+(dir<0?-1:1);
  if(i<0||j<0||j>=g.subs.length) return false;
  g.subs[i]=g.subs[j]; g.subs[j]=sid; mark(g.id,"order"); touchHist();
  return true;
}
/* a new order for the open steps of a goal: they take the places the open
   steps held, so finished steps stay where they were. false if the ids are
   not exactly the open steps. */
function setOpenOrder(g,order){
  var pos=[], open=[];
  g.subs.forEach(function(id,i){ var x=state.subs[id]; if(x&&x.pct<100&&x.status!=="done"){ pos.push(i); open.push(id); } });
  var a=open.slice().sort(), b=order.slice().sort();
  if(a.length!==b.length||a.some(function(x,i){ return x!==b[i]; })) return false;
  pos.forEach(function(p,k){ g.subs[p]=order[k]; }); mark(g.id,"order"); touchHist();
  return true;
}
function moveSub(sid,gid){
  var sb=state.subs[sid], g=gById(gid);
  if(!sb||!g||sb.gid===g.id) return false;
  detach(sb.id); g.subs.push(sb.id); sb.gid=g.id; mark(sb.id,"group");
  return true;
}
$("#main-bars").addEventListener("click",function(e){
  if(e.target.closest("[data-grip]")) return;
  var pen=e.target.closest("[data-gedit]");
  if(pen){
    e.stopPropagation();
    var gid=pen.dataset.gedit;
    openGroupEd = (state.sel===gid) ? !openGroupEd : true;
    state.sel=gid; openEd=""; save(); renderAll(); showPicked();
    var box=$(".mains .editor input");
    if(box) box.focus();
    return;
  }
  var r=e.target.closest("[data-group]"); if(!r) return;
  if(state.sel!==r.dataset.group){
    state.sel=r.dataset.group; openEd=""; openGroupEd=false; save();
    renderMain(); renderSubs(); flashIn($("#sub-bars"));
    showPicked();
  }
});
$("#edit-group").addEventListener("click",function(){ openGroupEd=!openGroupEd; renderSubs(); });

document.addEventListener("click",function(e){
  var go=e.target.closest("[data-goto-goal]");
  if(go){
    var gid=go.dataset.gotoGoal, sid=go.dataset.gotoSub;
    state.sel=gid; openGroupEd=false; openEd=sid||""; save(); renderAll();
    showPicked();
    var want=sid?$('#sub-bars [data-sub="'+sid+'"]'):$('[data-panel="subs"]');
    if(want&&want.scrollIntoView) want.scrollIntoView({behavior:"smooth",block:"center"});
    if(want) flashIn(want);
    return;
  }
  if(e.target.closest("#fb-clear")){
    state.tagFilter=[]; searchText="";
    Array.prototype.forEach.call(document.querySelectorAll(".seek-in"),function(x){ x.value=""; });
    save(); renderAll(); return;
  }
  var tp=e.target.closest("[data-tagpick]");
  if(tp){ toggleTag(tp.dataset.tagpick); return; }
  var ar=e.target.closest("[data-arch]");
  if(ar){ archiveGoal(ar.dataset.arch); return; }
  var un=e.target.closest("[data-unarch]");
  if(un){ unarchiveGoal(un.dataset.unarch); return; }
  var gd2=e.target.closest("[data-gdone]");
  if(gd2){
    if(!armGate("arch:"+gd2.dataset.gdone, gd2, "Archive it?")) return;
    archiveGoal(gd2.dataset.gdone); return;
  }
  var gb=e.target.closest("[data-gback]");
  if(gb){ backlogGoal(gb.dataset.gback); return; }
  var bg=e.target.closest("[data-bl-goal]");
  if(bg){
    var res=backlogActivate(+bg.dataset.blGoal);
    if(res){ openGroupEd=!res.wasGoal; save(); location.hash="#/board"; renderAll(); }
    return;
  }
  var bd=e.target.closest("[data-bl-del]");
  if(bd){
    var bi=+bd.dataset.blDel, bit=state.backlog[bi]; if(!bit) return;
    if(bit.goal && !armGate("bldel:"+bit.goal.id,bd,"Remove it and all "+bit.goal.subs.length+"?")) return;
    backlogRemove(bi); save(); renderAll(); return;
  }
  var sn=e.target.closest("[data-snap]");
  if(sn){
    var sd=sn.dataset.snap;
    askUser({title:"Go back to "+sd+"?", body:["The board will be put back as it was on "+sd+".","Today's copy is kept as well, so you can come back to it."],
      ok:"Go back to "+sd, cancel:"Stay on today", danger:true}).then(function(yes){
      if(!yes) return;
      ioMsg(restoreSnapshot(sd) ? "The board is back as it was on "+sd+". Today's copy is kept as well." : "That day is no longer kept.");
    });
    return;
  }
  /* the same answers as the phone (2026-10-20): a passed delivery day, the energy, the order */
  var mn=e.target.closest("[data-miss-new]");
  if(mn){ phMissNew(mn.dataset.missNew); return; }
  var mo=e.target.closest("[data-miss-off]");
  if(mo){ var mg=gById(mo.dataset.missOff); if(mg) phUndoable("No date for "+phCut(mg.name,36),function(){ editGoal(mg,"due",""); }); return; }
  var mk=e.target.closest("[data-miss-keep]");
  if(mk){ var kg=gById(mk.dataset.missKeep); if(kg){ kg.missAsk=kg.due; save(); renderAll(); } return; }
  if(e.target.closest("[data-energy-open]")){ phEnergyAsk(); return; }
  var dzb=e.target.closest("[data-dose]");
  if(dzb){ setDose(dzb.dataset.dose); return; }
  if(e.target.closest("[data-week-open]")){ weekAsk(); return; }
  var fl=e.target.closest("[data-floor]");
  if(fl){ try{ floorToggle(fl.dataset.floor); }catch(er){ toast("Minimum day",er.message); } save(); renderAll(); return; }
  if(e.target.closest("[data-floor-edit]")){ floorAsk(); return; }
  var wh=e.target.closest("[data-when]");
  if(wh){ whenAsk(wh.dataset.when); return; }
  var es=e.target.closest("[data-est]");
  if(es){ estAsk(es.dataset.est); return; }
  if(e.target.closest("[data-est-log]")){ estLog(); return; }
  if(e.target.closest("[data-est-skip]")){ estSkipAsk(); save(); renderAll(); return; }
  var tk=e.target.closest("[data-pick-take]");
  if(tk){ takePick(tk.dataset.pickTake); return; }
  var sk=e.target.closest("[data-pick-skip]");
  if(sk){ skipPick(sk.dataset.pickSkip); return; }
  var so=e.target.closest("[data-sorder-d]");
  if(so){ var ss=state.subs[so.dataset.sid], sd=+so.dataset.sorderD;
    if(ss) phUndoable("Moved "+(sd<0?"earlier":"later")+": "+phCut(ss.name,32),function(){ if(!moveSubOrder(ss.id,sd)) throw new Error(sd<0?"It is already first.":"It is already last."); });
    var sb2=document.querySelector('[data-sorder-d="'+sd+'"][data-sid="'+so.dataset.sid+'"]'); if(sb2) sb2.focus(); return; }
  var lk=e.target.closest("[data-learn-keep],[data-learn-no]");
  if(lk){ var lid=lk.getAttribute("data-learn-keep")||lk.getAttribute("data-learn-no");
    try{ if(lk.hasAttribute("data-learn-keep")) memKeep(lid); else memDrop(lid,true); }catch(er){ memDrop(lid,false); toast("",er.message); }
    save(); renderAll(); return; }
  var ai=e.target.closest("[data-aiorder-d]");
  if(ai){ phAiOrder(ai.dataset.aiorderD,ai); return; }
  var o=e.target.closest("[data-ed-open]");
  if(o){ openEd = openEd===o.dataset.edOpen ? "" : o.dataset.edOpen; renderSubs(); return; }
  var d=e.target.closest("[data-del]");
  if(d){
    var s=state.subs[d.dataset.del]; if(!s) return;
    if(!armGate("del:"+s.id,d,"Remove for good?")) return;
    removeSub(s.id); openEd=""; save(); renderAll(); return;
  }
  var gd=e.target.closest("[data-gdel]");
  if(gd){
    var g=gById(gd.dataset.gdel); if(!g) return;
    if(!armGate("gdel:"+g.id,gd,"Remove it and all "+g.subs.length+"?")) return;
    g.subs.forEach(function(id){ delete state.subs[id]; state.killed.push(id); });
    state.groups.splice(state.groups.indexOf(g),1); state.killed.push(g.id);
    state.sel=state.groups.length?state.groups[0].id:"";
    openGroupEd=false; touchHist(); save(); renderAll(); return;
  }
});
document.addEventListener("change",function(e){
  var f=e.target;
  if(f.dataset.edEasy){ var es=state.subs[f.dataset.edEasy]; if(es){ editSub(es,"easy",f.checked?"1":""); save(); renderAll(); } return; }
  var ed=f.closest("[data-ed-for]");
  if(ed && f.dataset.ed){
    var s=state.subs[ed.dataset.edFor]; if(!s) return;
    if(!editSub(s,f.dataset.ed,f.value)){ renderSubs(); return; }
    save(); renderAll(); return;
  }
  if(f.dataset.ged){
    var g=gById(state.sel); if(!g) return;
    if(!editGoal(g,f.dataset.ged,f.value)){ renderAll(); return; }
    save(); renderAll();
  }
});
$("#ng-add").addEventListener("click",function(){
  var n=$("#ng-name").value.trim(); if(!n){ $("#ng-name").focus(); return; }
  var g=newGoal(n);
  state.groups.push(g); state.sel=g.id;
  $("#ng-name").value="";
  save(); renderAll();
});
$("#ng-back").addEventListener("click",function(){
  var n=$("#ng-name").value.trim(); if(!n){ $("#ng-name").focus(); return; }
  var g=newGoal(n);
  state.backlog.unshift({t:g.name, d:todayStr(), goal:g});
  $("#ng-name").value="";
  save(); renderAll();
});
$("#ns-add").addEventListener("click",function(){
  var g=gById(state.sel); if(!g){ return; }
  var n=$("#ns-name").value.trim(); if(!n){ $("#ns-name").focus(); return; }
  addSub(g,n,$("#ns-rep").value||"");
  $("#ns-name").value="";
  save(); renderAll();
});
[["#ng-name","#ng-add"],["#ns-name","#ns-add"]].forEach(function(p){
  $(p[0]).addEventListener("keydown",function(e){ if(e.key==="Enter"){ e.preventDefault(); $(p[1]).click(); } });
});

