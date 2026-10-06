function hintTick(){
  var today=todayStr();
  if(state.hintAt===today) return;
  state.hintAt=today;
  var prev=state.hint, log=hintLog();
  if(prev && prev.d!==today){
    log.push({d:prev.d,type:prev.type,key:prev.key,ans:prev.ans||null,acted:!!prev.acted,suggest:prev.suggest});
    if(log.length>HINT_KEEP) log.splice(0,log.length-HINT_KEEP);
  }
  state.hint=null;
  if(hintOn()){
    var cands=hintCands().filter(function(c){
      /* the same check a tutor reply passes, on numbers the board computed itself */
      return replyCheck(c.t,{history:true,src:c.facts}).ok;
    });
    var c=hintChoose(cands,log,today);
    if(c) state.hint={d:today,type:c.type,key:c.key,t:c.t,evid:c.evid,cite:c.cite,suggest:c.suggest,ans:null,acted:false};
  }
  save();
}
function renderHint(){
  var box=$("#hint-card"); if(!box) return;
  hintTick();
  var h=state.hint, xs=state.exp&&state.exp.done&&state.exp.done.length&&state.exp.unseen;
  if(!h || h.d!==todayStr() || hintDone(h) || memProposed() || xs || !hintOn() || barVisible()){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML='<div class="p-head"><div><div class="p-title">Today’s hint &mdash; '+esc(HINT_NAMES[h.type])+'</div></div></div>'+
    '<p class="exp-do">'+esc(h.t)+'</p><p class="exp-w">'+esc(h.evid)+'</p>'+
    '<div class="now-acts">'+
      (h.suggest?'<button class="btn take" data-hint-try="'+esc(h.suggest)+'">Try it</button>':"")+
      '<button class="btn'+(h.suggest?"":" take")+'" data-hint-a="helpful">Helpful</button>'+
      '<button class="btn" data-hint-a="no">Not for me</button>'+
      '<button class="btn" data-hint-a="later">Later</button>'+
    '</div>';
}
function renderHintPanel(){
  var box=$("#hint-stats"); if(!box) return;
  var st=hintStats(hintLog().concat(state.hint&&state.hint.ans?[state.hint]:[]));
  box.innerHTML=HINT_TYPES.map(function(t){
    var r=st[t], mute=r.no>=3&&r.h===0;
    return '<div class="heldrow"><span class="hn">'+esc(HINT_NAMES[t])+'</span><span class="hw">'+
      (r.n?r.h+" helpful, "+r.no+" not for me":"not tried yet")+(mute?" · not shown again until you reset":"")+'</span></div>';
  }).join("");
  var a=$("#hint-on"), b=$("#hint-note"), c=$("#bar-on");
  if(c){ c.setAttribute("aria-pressed",barOn()?"true":"false"); c.textContent=barOn()?"Low-day check-in on":"Low-day check-in off"; }
  if(a){ a.setAttribute("aria-pressed",hintOn()?"true":"false"); a.textContent=hintOn()?"Hints on":"Hints off"; }
  if(b){ var nn=!(state.me&&state.me.hintNote===false); b.setAttribute("aria-pressed",nn?"true":"false"); b.textContent=nn?"Also as a reminder":"Card only"; }
}
function hintRoute(e){
  var x=e.target.closest("[data-hint-a]");
  if(x){ hintAnswer(x.dataset.hintA); renderAll(); return true; }
  x=e.target.closest("[data-hint-try]");
  if(x){ var hid=x.dataset.hintTry;
    expAsk(hid).then(function(yes){ if(!yes) return; try{ expStart(hid); }catch(er){ toast("Experiment",er.message); } save(); renderAll(); });
    return true; }
  return false;
}
