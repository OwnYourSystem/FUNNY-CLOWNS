/* ---------------- editing ---------------- */
function mark(id,field){ state.ue[id+"|"+field]=1; }
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
    var it=state.backlog.splice(+bg.dataset.blGoal,1)[0];
    if(it){ var g=it.goal||newGoal(it.t);
      state.groups.push(g); state.sel=g.id; openGroupEd=!it.goal;
      touchHist(); save(); location.hash="#/board"; renderAll(); }
    return;
  }
  var bd=e.target.closest("[data-bl-del]");
  if(bd){
    var bi=+bd.dataset.blDel, bit=state.backlog[bi]; if(!bit) return;
    if(bit.goal){
      if(!armGate("bldel:"+bit.goal.id,bd,"Remove it and all "+bit.goal.subs.length+"?")) return;
      bit.goal.subs.forEach(function(id){ delete state.subs[id]; state.killed.push(id); });
      state.killed.push(bit.goal.id);
    }
    state.backlog.splice(bi,1); touchHist(); save(); renderAll(); return;
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
  if(memRoute(e)) return;
  if(barRoute(e)) return;
  if(hintRoute(e)) return;
  var xs=e.target.closest("[data-exp-stop]");
  if(xs){ if(!armGate("expstop",xs,"Stop it?")) return; expStopMsg(); return; }
  var xr=e.target.closest("[data-exp-read]");
  if(xr){ expRead(); return; }
  var xa=e.target.closest("[data-exp-ack]");
  if(xa){ expState().unseen=false; save(); renderAll(); return; }
  var swb=e.target.closest("[data-skipwhy]");
  if(swb){ setSkipWhy(swb.dataset.skipwhy); return; }
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
  var o=e.target.closest("[data-ed-open]");
  if(o){ openEd = openEd===o.dataset.edOpen ? "" : o.dataset.edOpen; renderSubs(); return; }
  var d=e.target.closest("[data-del]");
  if(d){
    var s=state.subs[d.dataset.del]; if(!s) return;
    if(!armGate("del:"+s.id,d,"Remove for good?")) return;
    detach(s.id); delete state.subs[s.id]; state.killed.push(s.id);
    openEd=""; touchHist(); save(); renderAll(); return;
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
  var ed=f.closest("[data-ed-for]");
  if(ed && f.dataset.ed){
    var s=state.subs[ed.dataset.edFor]; if(!s) return;
    var k=f.dataset.ed, v=f.value;
    if(k==="name"){ if(!v.trim()) { renderSubs(); return; } s.name=v.trim(); mark(s.id,"name"); }
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
    touchHist(); save(); renderAll(); return;
  }
  if(f.dataset.ged){
    var g=gById(state.sel); if(!g) return;
    var gk=f.dataset.ged;
    if(gk==="name"){ if(!f.value.trim()){ renderAll(); return; } g.name=f.value.trim(); mark(g.id,"name"); }
    else if(gk==="due"){ g.due=f.value||""; mark(g.id,"due"); }
    else if(gk==="prio"){ g.prio=f.value||"mid"; mark(g.id,"prio"); }
    else if(gk==="where"){ g.where=f.value||"any"; mark(g.id,"where"); }
    else if(gk==="tags"){
      g.tags=f.value.split(",").map(function(t){ return t.trim().toLowerCase(); })
        .filter(function(t,i,a){ return t && a.indexOf(t)===i; }).slice(0,5);
      mark(g.id,"tags");
    }
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
  var id=uid("s");
  var rp=$("#ns-rep").value||"";
  state.subs[id]={id:id,name:n,pct:0,status:"todo",tag:"",upd:todayStr(),gid:g.id,
                  rep:rp,period:rp?periodKey(rp):"",streak:0,best:0,prio:"mid"};
  g.subs.push(id);
  $("#ns-name").value="";
  touchHist(); save(); renderAll();
});
[["#ng-name","#ng-add"],["#ns-name","#ns-add"]].forEach(function(p){
  $(p[0]).addEventListener("keydown",function(e){ if(e.key==="Enter"){ e.preventDefault(); $(p[1]).click(); } });
});

