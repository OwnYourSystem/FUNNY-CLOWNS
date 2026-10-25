/* ---- You ---- */
function phYou(){
  var h=[], me=state.me||freshMe(), c=remCfg(), who=(typeof acct!=="undefined"&&acct&&(acct.email||acct.uid))||"";
  var tags=allTags().length, rem=$("#btn-remind"), remOn=rem&&rem.getAttribute("aria-pressed")==="true";
  var th=(function(){ try{ return localStorage.getItem(THEME_KEY)||"system"; }catch(e){ return "system"; } })();
  var ph=phPhoto();
  /* the photo is a label for the file box: one tap opens the phone's picker */
  /* the picture is a second tap target for the same file box; a screen reader uses the Your photo row (2026-10-21) */
  h.push('<div class="ph-head ph-me"><label class="ph-av ph-av-b" for="ph-photo-in" aria-hidden="true">'+
    (ph?'<img src="'+esc(ph.src)+'" alt="">':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>'+
      '<span class="ph-av-plus" aria-hidden="true">+</span>')+
    '</label>'+
    '<input type="file" accept="image/*" id="ph-photo-in" class="ph-sr" aria-label="'+(ph?"Change your photo":"Add a photo of you")+'">'+
    '<div class="ph-me-t"><h1 class="ph-h1">You</h1><p class="ph-sub">'+(who?esc(who):"On "+phHere()+" only")+'</p></div></div>');
  /* sign-in first: it is what carries the board to a second device (owner, 2026-10-19) */
  h.push('<div class="ph-grp">'+phRow("account",who?"Account":"Sign in",who?"":"Use the board on all your devices")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your photo</h2><div class="ph-grp">'+
    (ph ? '<label class="ph-rowb" for="ph-photo-in"><span>Change photo</span><span class="ph-rv">'+PH_CHEV+'</span></label>'+
          phRow("phshow","Show it on every page",ph.show?"On":"Off",true)+
          '<button type="button" class="ph-rowb ph-danger" data-ph="phdel"><span>Remove photo</span></button>'
        : '<label class="ph-rowb" for="ph-photo-in"><span>Add a photo</span><span class="ph-rv"><span class="ph-v">Kept on '+phHere()+' only</span>'+PH_CHEV+'</span></label>')+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your work</h2><div class="ph-grid">'+
    phTile("#/goals","Goals",state.groups.length+" active")+phTile("#/backlog","Backlog",state.backlog.length+" ideas")+
    phTile("#/tags","Tags",tags+" in use")+phTile("#/archive","Archive",state.archive.length+" finished")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your day</h2><div class="ph-grp">'+
    phRow("daystart","Day starts",clockLabel(me.rise||"07:00"))+
    phRow("dayend","Day ends",clockLabel(me.wind))+
    phRow("goodn","Steps on a good day",String(doseN("normal")))+
    phRow("aiok","Order suggestions by AI",me.aiOrderOk?"On":"Off",true)+
    phRow("learn","Learn from what I do",memLearnOn()?"On":"Off",true)+
    (TTS?phRow("readaloud","Read answers aloud",sayOn()?"On":"Off",true):"")+
    phRow("easyedit","My easy things",floorState().items.length?String(floorState().items.length):"Add")+
    phRow("remind","Reminders",remOn?((c.am?clockLabel(c.amAt):"")+(c.am&&c.pm?" and ":"")+(c.pm?clockLabel(c.pmAt):"")||"Both off"):"Off")+
    (remOn&&"Notification" in window&&Notification.permission==="granted"?phRow("remtest","Send a test reminder","",true):"")+
    phRow("planner","Work hours, days and more",clockLabel(me.work[0])+" to "+clockLabel(me.work[1]))+
    phRow("calendar","Google Calendar",!calSetUp()?"Coming soon":calOn()?"Connected":"Connect")+'</div>');
  /* the tour, always here (2026-10-22) */
  var tn=tourNewCount();
  h.push('<h2 class="ph-k ph-gk">Learn</h2><div class="ph-grp">'+phRow("tour","How Qordel works",tn?tn+" new":"1 minute")+'</div>');
  if(phIsWeb()) h.push('<h2 class="ph-k ph-gk">On this computer</h2><div class="ph-grp">'+phRow("classic","Classic board","The old board with panels")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Private</h2><div class="ph-grp">'+
    phRow("learned","Weekly check-in",weekDue()?"Due":"Done")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Data and look</h2><div class="ph-grp">'+
    phRow("backup","Backup, restore and reset","")+phRow("theme","Theme",th.charAt(0).toUpperCase()+th.slice(1),true)+'</div>');
  return h.join("");
}
/* Google Calendar, its own page (owner, 2026-10-21); part 415 draws the body for the phone and the desktop */
function phCalendar(){
  if(calOn()) calGis().catch(function(){});
  return '<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Calendar</h1><p class="ph-sub">Your Google Calendar for the next 7 days.</p></div>'+calBody(true);
}
function phTile(href,t,s){ return '<a class="ph-tile" href="'+href+'"><span>'+esc(t)+'</span><span class="ph-k">'+esc(s)+'</span>'+PH_CHEV+'</a>'; }
/* a row that opens something has a chevron; one that switches at once (noChev) has not */
function phRow(k,t,v,noChev){
  /* a row that turns something on or off is a switch, the iOS way (HIG review 2, 2026-10-19) */
  if(noChev && (v==="On"||v==="Off"))
    return '<button type="button" class="ph-rowb" role="switch" aria-checked="'+(v==="On")+'" data-ph="'+k+'"><span>'+esc(t)+'</span><span class="ph-rv"><span class="ph-sr">'+v+'</span><span class="ph-switch" aria-hidden="true"></span></span></button>';
  return '<button type="button" class="ph-rowb" data-ph="'+k+'"><span>'+esc(t)+'</span><span class="ph-rv">'+(v?'<span class="ph-v">'+esc(v)+'</span>':"")+(noChev?"":PH_CHEV)+'</span></button>';
}
/* a reminder now, so the person sees how one looks on this phone: the same
   icon, badge and wording as the morning brief, sent from this page */
function phTestNote(){
  var t="A test from Qordel", o={body:"Reminders come like this, at most 2 a day.", tag:"oys-test", icon:"icon-192.png", badge:"badge-96.png"};
  var sent=function(){ toast("","Sent. Look at the top of the screen."); };
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.controller){
      navigator.serviceWorker.ready.then(function(reg){ return reg.showNotification(t,o); }).then(sent,function(){ toast("","This phone did not show it."); });
      return;
    }
    new Notification(t,o); sent();
  }catch(e){ toast("","This phone did not show it."); }
}
function phDayStart(){
  var me=state.me||freshMe();
  askUser({title:"When does your day start?", body:"Nothing reaches you before this time, and the board stays quiet until then.",
    fields:[{k:"t",label:"Day starts at",kind:"time",value:me.rise||"07:00"}], ok:"Save", cancel:"Not now",
    check:function(v){ var t=pTime(v.t); return !t?"Set a time.":phDayOrder(t,me.wind); }}).then(function(v){
    if(!v) return;
    try{ applySetting("day_start",v.t); }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}
/* a day starts before it ends; an end after midnight (00:30) is always later */
function phDayOrder(start,end){
  var a=hm(start), b=hm(end);
  return b>=4*60 && a>=b ? "Your day has to start before it ends at "+clockLabel(end)+"." : "";
}
function phDayEnd(){
  var me=state.me||freshMe();
  askUser({title:"When does your day end?", body:"Nothing reaches you after this time, and the board goes quiet.",
    fields:[{k:"t",label:"Day ends at",kind:"time",value:me.wind}], ok:"Save", cancel:"Not now",
    check:function(v){ var t=pTime(v.t); return !t?"Set a time.":phDayOrder(me.rise||"07:00",t); }}).then(function(v){
    if(!v) return;
    try{ applySetting("day_end",v.t); }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}

/* ---- Goals ---- */
function phGoals(){
  var h=[];
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Goals</h1></div>');
  h.push(phSeg("goals"));
  if(!state.groups.length) h.push('<p class="ph-empty">No goals yet. Press New goal, or say one in Talk.</p>');
  else {
    h.push('<ul class="ph-list ph-goals">');
    state.groups.forEach(function(g){
      var p=groupPct(g), nx=null;
      g.subs.forEach(function(id){ var s=state.subs[id]; if(!nx && s && s.status!=="done" && s.pct<100) nx=s; });
      h.push('<li><button type="button" class="ph-goal" data-ph="goal" data-id="'+esc(g.id)+'">'+
        '<span class="ph-goal-top"><span class="ph-goal-n">'+esc(g.name)+'</span><span class="ph-k">'+p+'%</span>'+PH_CHEV+'</span>'+
        '<span class="ph-bar"><span style="width:'+p+'%"></span></span>'+
        '<span class="ph-goal-x">'+(nx?"Next: "+esc(nx.name):"All steps done")+'</span></button></li>');
    });
    h.push('</ul>');
  }
  /* the one thing you come here to do sits at the bottom, under your thumb */
  h.push('<div class="ph-dock"><button type="button" class="ph-btn ph-pri ph-wide" data-ph="newgoal">New goal</button></div>');
  return h.join("");
}
function phGoal(id){ PH_GOAL=id; location.hash="#/goal/"+encodeURIComponent(id); }
function phStepGo(id){ var x=state.subs[id]; if(!x) return; PH_GOAL=x.gid; location.hash="#/step/"+encodeURIComponent(id); }
/* the id after the route, as in #/step/s12, so a reload or Back lands on the same thing */
function phArg(){ var m=String(location.hash||"").match(/^#\/[a-z]+\/(.+)$/); try{ return m?decodeURIComponent(m[1]):""; }catch(e){ return ""; } }
/* the small facts the classic row shows as pills, as one quiet line */
function phStepFacts(s){
  var b=[], st=statusOf(s);
  if(st.k!=="done") b.push(st.label);
  if(s.rep) b.push(repLabel(s.rep)+(s.streak?" · "+s.streak+"×":""));
  if(s.tag) b.push(s.tag);
  return b.join(" · ");
}
function phOpts(list,cur){
  return list.map(function(o){ return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(cur)?" selected":"")+'>'+esc(o[1])+'</option>'; }).join("");
}
function phSegb(k,list,cur,label){
  return '<div class="ph-segb" role="group" aria-label="'+esc(label)+'">'+
    list.map(function(o){ return '<button type="button" data-ph="sset" data-k="'+k+'" data-v="'+esc(o[0])+'" aria-pressed="'+(String(o[0])===String(cur))+'">'+esc(o[1])+'</button>'; }).join("")+'</div>';
}
/* one goal: its steps, each one tap from its own page, and a box to add the next */
function phGoalPage(){
  var g=gById(PH_GOAL); if(!g) return phGoals();
  var p=groupPct(g), n=daysLeft(g), h=[], open=[], fin=[], meta=[];
  g.subs.forEach(function(id){ var s=state.subs[id]; if(!s) return; (s.pct>=100||s.status==="done"?fin:open).push(s); });
  meta.push(n===null?"No delivery day":n<0?"Delivery day passed":"Delivery "+deliveryLabel(g));
  if(g.where==="work") meta.push("Work");
  h.push('<div style="min-width:0">'+phNav("#/goals","Goals")+'<h1 class="ph-h1" style="overflow-wrap:anywhere">'+esc(g.name)+'</h1></div>');
  h.push('<div><div class="ph-row-h" style="padding-bottom:4px"><span class="ph-k">'+p+'% done</span><span class="ph-k">'+esc(meta.join(" · "))+'</span></div>'+
    '<span class="ph-bar"><span style="width:'+p+'%"></span></span>'+
    ((g.tags||[]).length?'<p class="ph-note" style="margin-top:8px">'+esc(g.tags.map(function(t){ return "#"+t; }).join(" "))+'</p>':'')+'</div>');
  h.push('<section aria-label="Steps"><div class="ph-row-h"><h2 class="ph-h2">Steps</h2>'+
    (open.length>1?'<button type="button" class="ph-link" data-ph="aiorder" data-id="'+esc(g.id)+'">Suggest an order</button>':'')+'</div>'+
    (open.length>1?'<p class="ph-note ph-seqnote">Done from top to bottom. Drag the handle to change the order.</p>':''));
  if(!open.length&&!fin.length) h.push('<p class="ph-empty">No steps yet. Press Add a step.</p>');
  else {
    h.push('<ul class="ph-list ph-goals">');
    open.concat(fin).forEach(function(s,i){
      var dn=s.pct>=100||s.status==="done", fx=phStepFacts(s);
      var drag=!dn&&open.length>1;
      h.push('<li'+(drag?' class="ph-dli" data-sid="'+esc(s.id)+'"':'')+'><button type="button" class="ph-goal'+(dn?" is-done":"")+'" data-ph="step" data-id="'+esc(s.id)+'">'+
        '<span class="ph-goal-top"><span class="ph-goal-n">'+(dn?'':'<span class="ph-ord">'+(i+1)+'</span>')+esc(s.name)+'</span><span class="ph-k">'+(dn?"Done":s.pct+"%")+'</span>'+PH_CHEV+'</span>'+
        (dn?'':'<span class="ph-bar"><span style="width:'+s.pct+'%"></span></span>')+
        (fx?'<span class="ph-goal-x">'+esc(fx)+'</span>':'')+'</button>'+
        (drag?'<span class="ph-grip" aria-hidden="true">'+PH_GRIP+'</span>':'')+'</li>');
    });
    h.push('</ul>');
  }
  h.push('</section>');
  h.push('<div class="ph-grp">'+phRow("gedit","Goal details","")+'</div>');
  h.push('<div class="ph-dock"><button type="button" class="ph-btn ph-pri ph-wide" data-ph="addstep">Add a step</button></div>');
  return h.join("");
}
/* Add a step: a sheet from the bottom, with Speak, that comes back for the
   next one until you close it, so a list goes in quickly. */
function phAddStep(last){
  var g=gById(PH_GOAL); if(!g) return;
  askUser({title:"Add a step", body:[last?"Added \u201c"+last+"\u201d. Add the next, or press Done.":"In "+g.name+"."],
    fields:[{k:"n",label:"The step",kind:"text",mic:true,ph:"Say it or type it"},{k:"r",label:"Repeats",kind:"select",opts:REPEATS,value:""}],
    ok:"Add", cancel:last?"Done":"Close",
    check:function(v){ return String(v.n||"").trim()?"":"Type or say the step first."; }}).then(function(v){
    if(!v) return;
    var sb=addSub(g,v.n,v.r||""); PH_DRAWN=""; save(); renderAll();
    if(sb) phAddStep(sb.name);
  });
}
/* One step on its own page, with every field the classic editor has. Each
   change is saved the moment it is made, as on the board. The page is drawn
   once and then kept, so a background redraw never eats what is being typed;
   phStepRedraw draws it again after a change that moves other fields.    */
function phStepRedraw(){ PH_DRAWN=""; phRender(); }
function phStepPage(){
  var s=state.subs[phArg()]; if(!s) return PH_GOAL&&gById(PH_GOAL)?phGoalPage():phGoals();
  var g=gById(s.gid), h=[], w=whenMap()[s.id], e=estState().items[s.id], inT=state.oftad.some(function(c){ return c.id===s.id; });
  var opn=g?g.subs.filter(function(id){ var x=state.subs[id]; return x&&x.pct<100&&x.status!=="done"; }):[], oi=opn.indexOf(s.id);
  PH_GOAL=s.gid;
  h.push('<div style="min-width:0">'+phNav("#/goal/"+esc(encodeURIComponent(s.gid)),g?phCut(g.name,28):"Goal")+
    '<h1 class="ph-h1" id="ph-s-h" style="overflow-wrap:anywhere">'+esc(s.name)+'</h1></div>');
  h.push('<section class="ph-form" aria-label="This step">'+
    '<label class="ph-lab" for="ph-s-name">Name</label><input class="ph-in" id="ph-s-name" data-phed="name" value="'+esc(s.name)+'" enterkeyhint="done">'+
    '<span class="ph-lab">Status</span>'+phSegb("status",STATUSES,s.status==="done"||s.pct>=100?"done":s.status,"Status")+
    '<label class="ph-lab" for="ph-s-pct">Done: <output id="ph-s-pv" for="ph-s-pct">'+s.pct+'%</output></label>'+
    '<input class="ph-range" type="range" id="ph-s-pct" data-phed="pct" min="0" max="100" step="5" value="'+s.pct+'">'+
    (opn.length>1&&oi>=0?'<span class="ph-lab" id="ph-s-ordl">Order: step '+(oi+1)+' of '+opn.length+'</span>'+
      '<div class="ph-acts ph-ordb" role="group" aria-labelledby="ph-s-ordl"><button type="button" class="ph-btn" data-ph="sorder" data-d="-1"'+(oi===0?' disabled':'')+'>Earlier</button>'+
      '<button type="button" class="ph-btn" data-ph="sorder" data-d="1"'+(oi===opn.length-1?' disabled':'')+'>Later</button></div>':'')+
    '<label class="ph-lab" for="ph-s-rep">Repeats</label><select class="ph-sel" id="ph-s-rep" data-phed="rep">'+phOpts(REPEATS,s.rep||"")+'</select>'+
    '<label class="ph-lab" for="ph-s-tag">Tag</label><input class="ph-in" id="ph-s-tag" data-phed="tag" value="'+esc(s.tag||"")+'" placeholder="Planning" enterkeyhint="done">'+
    (state.groups.length>1?'<label class="ph-lab" for="ph-s-goal">Goal</label><select class="ph-sel" id="ph-s-goal" data-phmove="1">'+
      phOpts(state.groups.map(function(x){ return [x.id,x.name]; }),s.gid)+'</select>':'')+
    '<p class="ph-note" id="ph-s-msg" aria-live="polite">Changes are saved as you make them.</p></section>');
  h.push('<section class="ph-grp" aria-label="More for this step">'+
    phRow("seasy","Easy, good for a low-energy day",s.easy?"On":"Off",true)+
    '<button type="button" class="ph-rowb" data-ph="stoday"'+(inT?' disabled':'')+'><span>'+(inT?"In Today":"Put it in Today")+'</span></button>'+
    '<button type="button" class="ph-rowb" data-ph="swhen"><span>'+(w?"When":"When will you do it?")+'</span><span class="ph-v">'+(w?esc(phCut(w.t,24)):"")+'</span></button>'+
    '<button type="button" class="ph-rowb" data-ph="sest"><span>'+(e?"About how long":"How long will it take?")+'</span><span class="ph-v">'+(e?e.m+" min":"")+'</span></button>'+
    (s.status==="done"||s.pct>=100?'':'<button type="button" class="ph-rowb" data-ph="sdone"><span>Mark it done</span></button>')+
    '<button type="button" class="ph-rowb ph-danger" data-ph="sdel"><span>Remove this step</span></button></section>');
  return h.join("");
}
/* a field on the step page changed */
function phStepEdit(el){
  var s=state.subs[phArg()]; if(!s) return;
  if(el.getAttribute("data-phmove")){
    var to=gById(el.value);
    if(to && s.gid!==to.id){ phUndoable("Moved to "+phCut(to.name,36),function(){ moveSub(s.id,to.id); }); phStepRedraw(); var m=$("#ph-s-msg"); if(m) m.textContent="Moved to "+to.name+"."; }
    return;
  }
  var k=el.getAttribute("data-phed");
  if(!editSub(s,k,el.value)){ el.value=s[k]||""; var m2=$("#ph-s-msg"); if(m2) m2.textContent="A step needs a name."; return; }
  save(); renderAll();
  /* typing stays where it is; anything that moves other fields redraws the page */
  if(k==="name"){ var hd=$("#ph-s-h"); if(hd) hd.textContent=s.name; }
  else if(k!=="tag") phStepRedraw();
}
function phStepSet(k,v){
  var s=state.subs[phArg()]; if(!s) return;
  if(editSub(s,k,v)){ save(); renderAll(); phStepRedraw(); var b=document.querySelector('#ph-main [data-ph="sset"][data-k="'+k+'"][data-v="'+v+'"]'); if(b) b.focus(); }
}
function phRemoveStep(id){
  var s=state.subs[id]; if(!s) return;
  askUser({title:"Remove this step?", body:["“"+s.name+"” goes for good."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
    if(!yes) return;
    var gid=s.gid; phUndoable("Removed: "+phCut(s.name,40),function(){ removeSub(id); });
    if(phRoute()==="step") phGoal(gid);
  });
}
/* the goal: every field the classic goal editor has, and where it can go */
function phGoalEdit(){
  var g=gById(PH_GOAL); if(!g) return;
  askUser({title:"Goal", fields:[{k:"n",label:"Name",kind:"text",value:g.name},
      {k:"d",label:"Delivery day (leave empty for none)",kind:"date",value:g.due||""},
      {k:"w",label:"Is it work?",kind:"select",opts:WHERES.map(function(x){ return [x[0],x[1]]; }),value:g.where||"any"},
      {k:"t",label:"Tags, with commas between (up to 5)",kind:"text",value:(g.tags||[]).join(", ")}],
    ok:"Save", cancel:"Close", more:[["backlog","Move it to the Backlog"],["archive","Archive this goal"],["remove","Remove this goal"]],
    check:function(v){ return String(v.n||"").trim()?"":"Give the goal a name."; }}).then(function(v){
    if(!v) return;
    if(v==="archive"){ phUndoable("Archived: "+phCut(g.name,40),function(){ archiveGoal(g.id); }); return phGo("goals"); }
    if(v==="backlog"){ phUndoable("Moved to the Backlog: "+phCut(g.name,30),function(){ backlogGoal(g.id); }); return phGo("goals"); }
    if(v==="remove") return askUser({title:"Remove this goal?", body:["“"+g.name+"” and its "+g.subs.length+" steps go for good."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
      if(!yes) return; phUndoable("Removed: "+phCut(g.name,40),function(){ toolRun("remove_main_task",{main_task:g.name}); }); phGo("goals"); });
    if((v.d||"")!==(g.due||"")) editGoal(g,"due",v.d);
    if((v.w||"any")!==(g.where||"any")) editGoal(g,"where",v.w);
    if(v.t!==(g.tags||[]).join(", ")) editGoal(g,"tags",v.t);
    if(String(v.n).trim()!==g.name) editGoal(g,"name",v.n);
    PH_DRAWN=""; save(); renderAll();
  });
}
function phNewGoal(){
  askUser({title:"New goal", fields:[{k:"g",label:"The goal",kind:"text",ph:"For example: Finish the quarterly report"},{k:"s",label:"Its next step (optional)",kind:"text"}],
    ok:"Add it", cancel:"Not now", check:function(v){ return String(v.g||"").trim()?"":"Give the goal a name."; }}).then(function(v){
    if(!v) return;
    try{
      var gn=String(v.g).trim(); toolRun("add_main_task",{name:gn});
      if(String(v.s||"").trim()) toolRun("add_subtask",{main_task:gn,name:String(v.s).trim()});
    }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}

