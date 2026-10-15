/* ---------------- the phone ----------------
   Built 2026-10-15 from the agreed wireframes, for the phone only. Below
   820px the board is four tabs (Now, Talk, Journal, You) on the same engine
   and the same data; the desktop is unchanged. The old long page was the
   desktop board stacked into one column: six screens and ninety buttons
   before the one decision. Here Now answers "what now" on one screen.
   Tags, Backlog, Archive and the Planner open as the old pages under a Back
   bar. "Classic view" in You turns the old phone board back on.          */
var PH_KEY="oys-classic", PH_MQ=null, PH_ON=false, PH_DRAWN="", PH_ONB=0, PH_GOAL="";
var PH_V={end:"22:30", am:"on", amAt:"07:30", pm:"on", pmAt:"15:00", goal:"", step:""};
var PH_OLD={backlog:"Backlog", tags:"Tags", archive:"Archive", planner:"Planner"};
var PH_DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var PH_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
var PH_MIC='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5"/><path d="M3 7.5a5 5 0 0 0 10 0M8 12.5V15"/></svg>';
try{ PH_MQ=window.matchMedia?matchMedia("(max-width: 820px)"):null; }catch(e){ PH_MQ=null; }
function phClassic(){ try{ return localStorage.getItem(PH_KEY)==="1"; }catch(e){ return false; } }
function phWanted(){ return !!(PH_MQ&&PH_MQ.matches) && !phClassic(); }
function phRoute(){ var m=String(location.hash||"").match(/^#\/([a-z]+)/); var r=m?m[1]:"now"; return r==="board"?"now":r; }
function phGo(r){ if(phRoute()===r && location.hash) phRender(); else location.hash="#/"+r; }
function phSet(){
  var on=phWanted(), root=document.documentElement;
  if(on!==PH_ON){
    PH_ON=on; PH_DRAWN="";
    root.classList.toggle("ph",on);
    if(!on){ root.classList.remove("ph-old","ph-talk","ph-onb"); }
  }
  phClassicBtn();
  phRender();
}
/* on a phone in classic view, one quiet button in the header leads back */
function phClassicBtn(){
  var b=$("#btn-phone");
  if(!b){
    var c=document.querySelector(".masthead .controls"); if(!c) return;
    b=document.createElement("button"); b.className="btn"; b.id="btn-phone"; b.type="button"; b.textContent="Phone view";
    b.addEventListener("click",function(){ try{ localStorage.removeItem(PH_KEY); }catch(e){} location.hash="#/now"; phSet(); });
    c.insertBefore(b,c.firstChild);
  }
  b.hidden=!(PH_MQ&&PH_MQ.matches&&phClassic());
}
function phDoseLabel(){ var b=doseNow().band; return b==="low"?"Rough day":b==="high"?"Big day":"Normal day"; }
/* what Now shows: the first open step in Today, else the board's pick */
function phCurrent(){
  var cur=null;
  state.oftad.forEach(function(c){ if(!cur && c.k==="sub" && !c.done && state.subs[c.id]) cur=c; });
  if(cur){ var s=state.subs[cur.id]; return {mode:"today", s:s, g:gById(s.gid), why:cur.why||""}; }
  var p=pickToday(); if(p) return {mode:"pick", s:p.s, g:p.g, why:p.why, v:p.v};
  return null;
}
function phCut(t,n){ t=String(t||""); return t.length>n ? t.slice(0,n-1).replace(/\s+\S*$/,"")+"…" : t; }
function phDays(){
  var seen={}, n=0, dots=[], i, d;
  evSel("completions",evWin(7),Date.now()+1).forEach(function(e){ var k=dstr(new Date(e.t)); if(!seen[k]){ seen[k]=1; n++; } });
  for(i=6;i>=0;i--){ d=new Date(); d.setDate(d.getDate()-i); dots.push(seen[dstr(d)]?1:0); }
  return {n:n, dots:dots};
}
function phTabsMark(r){
  Array.prototype.forEach.call(document.querySelectorAll("#ph-tabs [data-tab]"),function(a){
    var on=a.getAttribute("data-tab")===(r==="goals"||r==="goal"||PH_OLD[r]?"you":r);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}
function phRender(){
  if(!PH_ON) return;
  var root=document.documentElement, r=phRoute(), onb=!state.me||!state.me.done, main=$("#ph-main");
  if(!main) return;
  var old=!onb && !!PH_OLD[r], talk=!onb && r==="talk";
  root.classList.toggle("ph-onb",onb);
  root.classList.toggle("ph-old",old);
  root.classList.toggle("ph-talk",talk);
  if(talk && SHEET.hidden) botOpen(true);
  if(!talk && !SHEET.hidden) botOpen(false);
  phTabsMark(r);
  var back=$("#ph-back-t"); if(back) back.textContent=PH_OLD[r]||"";
  /* the onboarding keeps what is typed: it is drawn again only when its step changes */
  var key=onb?"onb"+PH_ONB:r;
  if(onb && PH_DRAWN===key) return;
  PH_DRAWN=key;
  main.innerHTML = onb ? phOnbHtml()
    : r==="journal" ? phJournal()
    : r==="you" ? phYou()
    : r==="goals" ? phGoals()
    : r==="goal" ? phGoalPage()
    : (talk||old) ? ""
    : phNow();
}

/* ---- Now ---- */
function phNow(){
  var d=new Date(), h=[], c=jrCardOn(), cur=phCurrent(), dy=phDays();
  h.push('<div class="ph-head"><div><div class="ph-k">'+PH_DAYS[d.getDay()]+'</div><h1 class="ph-h1">'+d.getDate()+' '+PH_MONTHS[d.getMonth()]+'</h1></div>'+
    '<button type="button" class="ph-chip" data-ph="dose">'+esc(phDoseLabel())+'</button></div>');
  if(c){
    var e=c.e, K=JR_KINDS[e.kind]||JR_KINDS.end, ago=Math.round((new Date(c.today)-new Date(c.d))/864e5);
    h.push('<a class="ph-strip" href="#/journal"><span class="ph-k">'+(ago===1?"Yesterday":ago+" days ago")+'</span>'+
      '<span class="ph-strip-t">'+esc(e.b?K.b+": "+e.b:K.a+": "+e.a)+'</span><span class="ph-strip-go">Open</span></a>');
  }
  if(cur){
    h.push('<section class="ph-card" aria-label="Do this now"><div class="ph-k ph-hot">'+(cur.mode==="today"?"Now, from Today":"Do this now")+'</div>'+
      '<h2 class="ph-task">'+esc(cur.s.name)+'</h2>'+
      '<p class="ph-why">'+esc(cur.g?cur.g.name:"")+(cur.why?" · "+esc(phCut(cur.why,150)):"")+
      (cur.why&&cur.why.length>150?' <button type="button" class="ph-link" data-ph="why">Why this one</button>':"")+'</p>'+
      '<div class="ph-acts">'+
      (cur.mode==="today"
        ? '<button type="button" class="ph-btn ph-pri" data-ph="done" data-id="'+esc(cur.s.id)+'">Done</button><button type="button" class="ph-btn" data-ph="later" data-id="'+esc(cur.s.id)+'">Not now</button>'
        : '<button type="button" class="ph-btn ph-pri" data-ph="take" data-id="'+esc(cur.s.id)+'">Start it</button><button type="button" class="ph-btn" data-ph="else" data-id="'+esc(cur.s.id)+'">Something else</button>')+
      '</div></section>');
  } else {
    var v=verdict(), not=v&&v.none?(v.blocked||[]).map(function(b){ return b.g.name+" waits: "+b.why+"."; }):[];
    h.push('<section class="ph-card" aria-label="Do this now"><div class="ph-k">Nothing fits this hour</div>'+
      '<p class="ph-why">'+esc(not.length?not.join(" "):"Everything that can be done now is done, waiting or in Today.")+'</p>'+
      '<div class="ph-acts"><a class="ph-btn" href="#/talk">Add something</a></div></section>');
  }
  var items=state.oftad.concat(state.done), nd=state.done.length;
  h.push('<section aria-label="Today"><div class="ph-row-h"><h2 class="ph-h2">Today</h2><span class="ph-k">'+nd+' of '+items.length+' done</span></div>');
  if(!items.length) h.push('<p class="ph-empty">Nothing in Today yet. Start the step above, or say what you want to do in Talk.</p>');
  else {
    h.push('<ul class="ph-list">');
    items.forEach(function(it){
      var isDone=state.done.indexOf(it)>=0, nm=cardName(it), sub=it.k==="sub"&&state.subs[it.id];
      h.push('<li class="ph-item'+(isDone?" is-done":"")+'">'+
        (sub&&!isDone ? '<button type="button" class="ph-ring" data-ph="done" data-id="'+esc(it.id)+'" aria-label="Mark '+esc(nm)+' done"></button>'
                      : '<span class="ph-ring'+(isDone?" on":"")+'" aria-hidden="true"></span>')+
        (sub ? '<button type="button" class="ph-item-t ph-item-b" data-ph="step" data-id="'+esc(it.id)+'">'+esc(nm)+'</button>'
             : '<span class="ph-item-t">'+esc(nm)+'</span>')+'</li>');
    });
    h.push('</ul>');
  }
  if(state.plan.length) h.push('<p class="ph-note">'+state.plan.length+' waiting for another day.</p>');
  h.push('</section>');
  h.push('<div class="ph-days"><span>Days you finished something: '+dy.n+' of the last 7</span><span class="ph-dots" aria-hidden="true">'+
    dy.dots.map(function(x){ return '<span class="ph-dot'+(x?" on":"")+'"></span>'; }).join("")+'</span></div>');
  return h.join("");
}
function phDone(id){
  var s=state.subs[id]; if(!s) return;
  try{ toolRun("set_status",{subtask:s.name,status:"done"}); toolRun("mark_done_today",{subtask:s.name}); }catch(e){ toast("Done",e.message); }
  save(); renderAll();
}
function phDose(){
  askUser({title:"How big is today?", body:"The board sizes the day from your recent days. Change it if it guessed wrong.",
    more:[["low","Rough day: make it smaller"],["high","Big day: give me more"],["auto","Let the board decide"]], noOk:true, cancel:"Keep it"})
  .then(function(v){ if(v==="low"||v==="high"||v==="auto") setDose(v); });
}
function phElse(id){
  var p=pickToday(); if(!p) return;
  askUser({title:"Why this one", body:[p.why].concat(verdictNot(p.v)),
    more:[["next","Show me the next one"],["rough","Make today a rough day"]], noOk:true, cancel:"Keep this one"})
  .then(function(v){ if(v==="next") skipPick(id); else if(v==="rough") setDose("low"); });
}
function phWhy(){
  var c=phCurrent(); if(!c) return;
  askUser({title:"Why this one", body:[c.why||"You put it in Today."].concat(c.v?verdictNot(c.v):[]), noOk:true, cancel:"Close"});
}

/* ---- Journal ---- */
function phJournal(){
  var h=[], c=jrCheckpoint();
  h.push('<div class="ph-head"><div><h1 class="ph-h1">Journal</h1><p class="ph-sub">Your checkpoint between days. Kept on this phone only.</p></div></div>');
  if(c){
    var s=jrSays(c);
    h.push('<section class="ph-card" aria-label="Where you left off"><div class="ph-k">Where you left off · '+esc(s.head)+'</div>'+
      s.lines.map(function(t){ return '<p class="ph-line">'+esc(t)+'</p>'; }).join("")+'</section>');
  }
  h.push('<div class="ph-two"><button type="button" class="ph-tile" data-ph="jr" data-kind="start"><span class="ph-k">Morning</span><span>Start of day</span></button>'+
    '<button type="button" class="ph-tile" data-ph="jr" data-kind="end"><span class="ph-k">Evening</span><span>End of day</span></button></div>'+
    '<p class="ph-note">Each has Speak under its boxes: say it, check it, save it.</p>');
  h.push('<section aria-label="Earlier"><div class="ph-row-h"><h2 class="ph-h2">Earlier</h2><span class="ph-k">Newest first</span></div>'+jrListHtml()+'</section>');
  return h.join("");
}

/* ---- You ---- */
function phYou(){
  var h=[], me=state.me||freshMe(), c=remCfg(), who=(typeof acct!=="undefined"&&acct&&(acct.email||acct.uid))||"";
  var tags=allTags().length, rem=$("#btn-remind"), remOn=rem&&rem.getAttribute("aria-pressed")==="true";
  var th=(function(){ try{ return localStorage.getItem(THEME_KEY)||"system"; }catch(e){ return "system"; } })();
  h.push('<div class="ph-head ph-me"><span class="ph-av" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5"/></svg></span>'+
    '<div class="ph-me-t"><h1 class="ph-h1">You</h1><p class="ph-sub">'+(who?esc(who):"On this phone only")+'</p></div>'+
    '<button type="button" class="ph-chip" data-ph="account">'+(who?"Account":"Sign in")+'</button></div>');
  h.push('<h2 class="ph-k ph-gk">Your work</h2><div class="ph-grid">'+
    phTile("#/goals","Goals",state.groups.length+" active")+phTile("#/backlog","Backlog",state.backlog.length+" ideas")+
    phTile("#/tags","Tags",tags+" in use")+phTile("#/archive","Archive",state.archive.length+" finished")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your day</h2><div class="ph-grp">'+
    phRow("dayend","Day ends",clockLabel(me.wind))+
    phRow("remind","Reminders",remOn?((c.am?clockLabel(c.amAt):"")+(c.am&&c.pm?" and ":"")+(c.pm?clockLabel(c.pmAt):"")||"Both off"):"Off")+
    phRow("planner","Work hours, days and more",clockLabel(me.work[0])+" to "+clockLabel(me.work[1]))+'</div>');
  h.push('<h2 class="ph-k ph-gk">Private</h2><div class="ph-grp">'+
    phRow("week","Weekly check-in",weekDue()?"Due":"Done")+phRow("planner","What the board learned, and hints","")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Data and look</h2><div class="ph-grp">'+
    phRow("backup","Backup, restore and reset","")+phRow("theme","Theme",th.charAt(0).toUpperCase()+th.slice(1))+
    phRow("classic","Classic view","The old board")+'</div>');
  return h.join("");
}
function phTile(href,t,s){ return '<a class="ph-tile" href="'+href+'"><span>'+esc(t)+'</span><span class="ph-k">'+esc(s)+'</span></a>'; }
function phRow(k,t,v){ return '<button type="button" class="ph-rowb" data-ph="'+k+'"><span>'+esc(t)+'</span>'+(v?'<span class="ph-v">'+esc(v)+'</span>':"")+'</button>'; }
function phDayEnd(){
  var me=state.me||freshMe();
  askUser({title:"When does your day end?", body:"Nothing reaches you after this time, and the board goes quiet.",
    fields:[{k:"t",label:"Day ends at",kind:"time",value:me.wind}], ok:"Save", cancel:"Not now",
    check:function(v){ return pTime(v.t)?"":"Set a time."; }}).then(function(v){
    if(!v) return;
    try{ applySetting("day_end",v.t); }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}

/* ---- Goals ---- */
function phGoals(){
  var h=[];
  h.push('<div class="ph-head"><div><a class="ph-backl" href="#/you">Back to You</a><h1 class="ph-h1">Goals</h1></div>'+
    '<button type="button" class="ph-chip ph-pri" data-ph="newgoal">New goal</button></div>');
  h.push('<nav class="ph-seg" aria-label="Show"><a href="#/goals" aria-current="page">Active</a><a href="#/backlog">Backlog</a><a href="#/archive">Archive</a></nav>');
  if(!state.groups.length) h.push('<p class="ph-empty">No goals yet. Press New goal, or say one in Talk.</p>');
  else {
    h.push('<ul class="ph-list ph-goals">');
    state.groups.forEach(function(g){
      var p=groupPct(g), nx=null;
      g.subs.forEach(function(id){ var s=state.subs[id]; if(!nx && s && s.status!=="done" && s.pct<100) nx=s; });
      h.push('<li><button type="button" class="ph-goal" data-ph="goal" data-id="'+esc(g.id)+'">'+
        '<span class="ph-goal-top"><span class="ph-goal-n">'+esc(g.name)+'</span><span class="ph-k">'+p+'%</span></span>'+
        '<span class="ph-bar"><span style="width:'+p+'%"></span></span>'+
        '<span class="ph-goal-x">'+(nx?"Next: "+esc(nx.name):"All steps done")+'</span></button></li>');
    });
    h.push('</ul>');
  }
  return h.join("");
}
function phGoal(id){ PH_GOAL=id; phGo("goal"); }
/* one goal: its steps, each one tap from editing, and a box to add the next */
function phGoalPage(){
  var g=gById(PH_GOAL); if(!g) return phGoals();
  var p=groupPct(g), n=daysLeft(g), h=[], open=[], fin=[];
  g.subs.forEach(function(id){ var s=state.subs[id]; if(!s) return; (s.pct>=100||s.status==="done"?fin:open).push(s); });
  h.push('<div class="ph-head"><div style="min-width:0"><a class="ph-backl" href="#/goals">Back to Goals</a><h1 class="ph-h1" style="overflow-wrap:anywhere">'+esc(g.name)+'</h1></div>'+
    '<button type="button" class="ph-chip" data-ph="gedit">Edit</button></div>');
  h.push('<div><div class="ph-row-h" style="padding-bottom:4px"><span class="ph-k">'+p+'% done</span><span class="ph-k">'+
    (n!==null?esc(dueLabel(g)):"no deadline")+(g.prio==="high"?" \u00b7 high":g.prio==="low"?" \u00b7 low":"")+'</span></div>'+
    '<span class="ph-bar"><span style="width:'+p+'%"></span></span></div>');
  h.push('<section aria-label="Steps"><div class="ph-row-h"><h2 class="ph-h2">Steps</h2><span class="ph-k">'+fin.length+' of '+(open.length+fin.length)+' done</span></div>');
  if(!open.length&&!fin.length) h.push('<p class="ph-empty">No steps yet. Add the first one below.</p>');
  else {
    h.push('<ul class="ph-list ph-goals">');
    open.concat(fin).forEach(function(s){
      var dn=s.pct>=100||s.status==="done";
      h.push('<li><button type="button" class="ph-goal'+(dn?" is-done":"")+'" data-ph="step" data-id="'+esc(s.id)+'">'+
        '<span class="ph-goal-top"><span class="ph-goal-n">'+esc(s.name)+'</span><span class="ph-k">'+(dn?"Done":s.pct+"%")+'</span></span>'+
        (dn?'':'<span class="ph-bar"><span style="width:'+s.pct+'%"></span></span>')+
        (s.status==="blocked"?'<span class="ph-goal-x">Stuck</span>':'')+'</button></li>');
    });
    h.push('</ul>');
  }
  h.push('</section>');
  h.push('<section aria-label="Add a step" class="ph-add"><label class="ph-lab" for="ph-newstep">Add a step</label>'+
    '<input class="ph-in" id="ph-newstep" placeholder="Say it or type it" enterkeyhint="done">'+
    '<div class="ph-acts" style="margin-top:8px"><button type="button" class="ph-mic" data-ph="mic" data-for="ph-newstep" aria-pressed="false">'+PH_MIC+'<span>Speak</span></button>'+
    '<button type="button" class="ph-btn ph-pri" data-ph="addstep">Add</button></div>'+
    '<p class="ph-note" id="ph-onb-hint" aria-live="polite"></p></section>');
  return h.join("");
}
function phAddStep(){
  var g=gById(PH_GOAL), el=$("#ph-newstep"), v=el?String(el.value||"").trim():"";
  if(!g) return;
  if(!v){ var n=$("#ph-onb-hint"); if(n) n.textContent="Type or say the step first."; if(el) el.focus(); return; }
  try{ toolRun("add_subtask",{main_task:g.name,name:v}); }catch(e){ toast("",e.message); return; }
  PH_DRAWN=""; save(); renderAll();
  var again=$("#ph-newstep"); if(again) again.focus();
}
/* one step: rename it, set how far along it is, put it in Today, finish or remove it */
function phStep(id){
  var s=state.subs[id]; if(!s) return;
  askUser({title:"Step", body:gById(s.gid)?["In "+gById(s.gid).name+"."]:[],
    fields:[{k:"n",label:"Name",kind:"text",value:s.name},{k:"p",label:"How far along, in percent",kind:"number",min:0,max:100,value:s.pct}],
    ok:"Save", cancel:"Close",
    more:[["today","Put it in Today"],["done","Mark it done"],["remove","Remove this step"]],
    check:function(v){
      var n=Number(v.p); if(!String(v.n||"").trim()) return "Give the step a name.";
      return (isNaN(n)||n<0||n>100)?"Use a number from 0 to 100.":"";
    }}).then(function(v){
    if(!v) return;
    try{
      if(v==="today") toolRun("focus_today",{subtask:s.name});
      else if(v==="done") return phDone(id);
      else if(v==="remove") return phRemoveStep(id);
      else if(typeof v==="object"){
        var nn=String(v.n).trim(), pp=Math.round(Number(v.p));
        if(pp!==s.pct) toolRun("set_progress",{subtask:s.name,percent:pp});
        if(nn!==s.name) toolRun("rename_subtask",{subtask:s.name,new_name:nn});
      }
    }catch(e){ toast("",e.message); }
    PH_DRAWN=""; save(); renderAll();
  });
}
function phRemoveStep(id){
  var s=state.subs[id]; if(!s) return;
  askUser({title:"Remove this step?", body:["\u201c"+s.name+"\u201d goes for good."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
    if(!yes) return;
    try{ toolRun("remove_subtask",{subtask:s.name}); }catch(e){ toast("",e.message); }
    PH_DRAWN=""; save(); renderAll();
  });
}
function phGoalEdit(){
  var g=gById(PH_GOAL); if(!g) return;
  askUser({title:"Goal", fields:[{k:"n",label:"Name",kind:"text",value:g.name},
      {k:"p",label:"Priority",kind:"pick",row:true,opts:[["high","High"],["mid","Middle"],["low","Low"]],value:g.prio||"mid"},
      {k:"d",label:"Deadline (leave empty for none)",kind:"date",value:g.due||""}],
    ok:"Save", cancel:"Close", more:[["archive","Archive this goal"],["remove","Remove this goal"]],
    check:function(v){ return String(v.n||"").trim()?"":"Give the goal a name."; }}).then(function(v){
    if(!v) return;
    try{
      if(v==="archive"){ toolRun("archive_goal",{main_task:g.name}); PH_DRAWN=""; save(); renderAll(); return phGo("goals"); }
      if(v==="remove") return askUser({title:"Remove this goal?", body:["\u201c"+g.name+"\u201d and its "+g.subs.length+" steps go for good."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
        if(!yes) return; try{ toolRun("remove_main_task",{main_task:g.name}); }catch(e){ toast("",e.message); } save(); renderAll(); phGo("goals"); });
      var name=g.name;
      if((v.p||"mid")!==(g.prio||"mid")) toolRun("set_goal_field",{main_task:name,field:"priority",value:v.p});
      if((v.d||"")!==(g.due||"")) toolRun("set_goal_field",{main_task:name,field:"deadline",value:v.d||""});
      if(String(v.n).trim()!==name) toolRun("set_goal_field",{main_task:name,field:"name",value:String(v.n).trim()});
    }catch(e){ toast("",e.message); }
    PH_DRAWN=""; save(); renderAll();
  });
}
function phNewGoal(){
  askUser({title:"New goal", fields:[{k:"g",label:"The goal",kind:"text",ph:"For example: Finish the SAP migration"},{k:"s",label:"Its next step (optional)",kind:"text"}],
    ok:"Add it", cancel:"Not now", check:function(v){ return String(v.g||"").trim()?"":"Give the goal a name."; }}).then(function(v){
    if(!v) return;
    try{
      var gn=String(v.g).trim(); toolRun("add_main_task",{name:gn});
      if(String(v.s||"").trim()) toolRun("add_subtask",{main_task:gn,name:String(v.s).trim()});
    }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}

/* ---- onboarding: three screens ---- */
function phDotsHtml(i){
  var o=[]; for(var k=0;k<3;k++) o.push('<span class="ph-step'+(k===i?" on":"")+'"></span>');
  return '<div class="ph-steps" aria-label="Step '+(i+1)+' of 3">'+o.join("")+'</div>';
}
function phOnbHtml(){
  var v=PH_V;
  if(PH_ONB===0) return '<div class="ph-onb"><div class="ph-k">Minimum Deliveries</div>'+
    '<h1 class="ph-big">One next step, every day.</h1>'+
    '<p class="ph-lede">The board picks today’s one task and tells you why. On a rough day it gets smaller. You always decide.</p>'+
    '<div class="ph-fill"></div>'+phDotsHtml(0)+
    '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Start</button>'+
    '<button type="button" class="ph-link ph-center" data-ph="restore">I have a board already: restore it</button></div>';
  if(PH_ONB===1){
    var tg=function(k){ return '<span class="ph-sw" role="group" aria-label="'+(k==="am"?"Morning brief":"Afternoon check")+'">'+
      '<button type="button" data-ph="tog" data-k="'+k+'" data-v="on" aria-pressed="'+(v[k]==="on")+'">On</button>'+
      '<button type="button" data-ph="tog" data-k="'+k+'" data-v="off" aria-pressed="'+(v[k]==="off")+'">Off</button></span>'; };
    return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
      '<h1 class="ph-h1 ph-mt">Your day</h1><p class="ph-lede">Two questions. Everything else the board asks later, when it matters.</p>'+
      '<div class="ph-grp"><label class="ph-rowf"><span>My day ends at</span><input class="ph-time" type="time" id="ph-end" value="'+esc(v.end)+'"></label></div>'+
      '<p class="ph-note">Nothing reaches you after this time.</p>'+
      '<h2 class="ph-k ph-gk">Reminders, at most 2 a day</h2><div class="ph-grp">'+
      '<div class="ph-rowf"><span>Morning brief</span>'+tg("am")+'</div>'+
      '<label class="ph-rowf"><span class="ph-sub">at</span><input class="ph-time" type="time" id="ph-am" value="'+esc(v.amAt)+'"></label>'+
      '<div class="ph-rowf"><span>Afternoon check</span>'+tg("pm")+'</div>'+
      '<label class="ph-rowf"><span class="ph-sub">at</span><input class="ph-time" type="time" id="ph-pm" value="'+esc(v.pmAt)+'"></label></div>'+
      '<p class="ph-note" id="ph-onb-err" role="alert">Your phone asks for permission next. Change any of this later in You.</p>'+
      '<div class="ph-fill"></div>'+phDotsHtml(1)+
      '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Next</button></div>';
  }
  return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
    '<h1 class="ph-h1 ph-mt">What are you working on?</h1><p class="ph-lede">Name one goal and its next step. Say it or type it. You can add more later.</p>'+
    '<label class="ph-lab" for="ph-goal">A goal</label><input class="ph-in" id="ph-goal" value="'+esc(v.goal)+'" placeholder="For example: Finish the SAP migration">'+
    '<button type="button" class="ph-mic" data-ph="mic" data-for="ph-goal" aria-pressed="false">'+PH_MIC+'<span>Speak</span></button>'+
    '<label class="ph-lab" for="ph-step">Its next step</label><input class="ph-in" id="ph-step" value="'+esc(v.step)+'" placeholder="For example: Map the old reports">'+
    '<button type="button" class="ph-mic" data-ph="mic" data-for="ph-step" aria-pressed="false">'+PH_MIC+'<span>Speak</span></button>'+
    '<p class="ph-note" id="ph-onb-hint" aria-live="polite">Your board stays on this phone. An account to carry it to a second device is optional, in You.</p>'+
    '<div class="ph-fill"></div>'+phDotsHtml(2)+
    '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-done">Show me today</button>'+
    '<button type="button" class="ph-link ph-center" data-ph="onb-skip">Skip for now</button></div>';
}
function phOnbRead(){
  var g=function(id){ var e=document.getElementById(id); return e?e.value:null; }, x;
  if((x=g("ph-end"))!==null) PH_V.end=x;
  if((x=g("ph-am"))!==null) PH_V.amAt=x;
  if((x=g("ph-pm"))!==null) PH_V.pmAt=x;
  if((x=g("ph-goal"))!==null) PH_V.goal=x;
  if((x=g("ph-step"))!==null) PH_V.step=x;
}
function phOnbStep(i){ phOnbRead(); PH_ONB=Math.max(0,Math.min(2,i)); PH_DRAWN=""; phRender(); scrollTo(0,0); }
function phOnbDay(){
  phOnbRead();
  var me=state.me||(state.me=freshMe()), v=PH_V, err=$("#ph-onb-err");
  if(!pTime(v.end)){ if(err) err.textContent="Set the time your day ends."; return; }
  me.wind=pTime(v.end);
  var bad=remCheck({am:v.am,amAt:v.amAt,pm:v.pm,pmAt:v.pmAt});
  if(bad){ if(err) err.textContent=bad; return; }
  remApply({am:v.am,amAt:v.amAt,pm:v.pm,pmAt:v.pmAt});
  if((v.am==="on"||v.pm==="on") && ("Notification" in window) && Notification.permission!=="denied"){
    var go=function(r){ if(r==="granted"){ remindSet(true); remindState(); pushStart(); } };
    if(Notification.permission==="granted") go("granted");
    else { try{ var q=Notification.requestPermission(); if(q&&q.then) q.then(go); }catch(e){} }
  }
  phOnbStep(2);
}
function phOnbFinish(add){
  phOnbRead();
  var me=state.me||(state.me=freshMe());
  if(add){
    var gn=String(PH_V.goal||"").trim(), sn=String(PH_V.step||"").trim();
    if(gn){ try{ toolRun("add_main_task",{name:gn}); if(sn) toolRun("add_subtask",{main_task:gn,name:sn}); }catch(e){} }
  }
  me.done=true; PH_ONB=0; PH_DRAWN="";
  save(); renderAll(); phGo("now");
}

/* ---- one listener for every press in the phone ---- */
(function(){
  var root=$("#ph"); if(!root) return;
  root.addEventListener("click",function(e){
    var b=e.target.closest("[data-ph]"); if(!b) return;
    var k=b.getAttribute("data-ph"), id=b.getAttribute("data-id");
    if(k==="dose") phDose();
    else if(k==="done") phDone(id);
    else if(k==="later"){ try{ toolRun("plan_today",{subtask:state.subs[id].name}); }catch(er){ toast("",er.message); } save(); renderAll(); }
    else if(k==="take") takePick(id);
    else if(k==="else") phElse(id);
    else if(k==="why") phWhy();
    else if(k==="jr") jrAsk(b.getAttribute("data-kind"));
    else if(k==="account") $("#btn-account").click();
    else if(k==="dayend") phDayEnd();
    else if(k==="remind") $("#btn-remind").click();
    else if(k==="planner") phGo("planner");
    else if(k==="week") weekAsk();
    else if(k==="backup") $("#btn-backup").click();
    else if(k==="theme"){ $("#btn-theme").click(); PH_DRAWN=""; phRender(); }
    else if(k==="classic"){ try{ localStorage.setItem(PH_KEY,"1"); }catch(er){} location.hash="#/board"; phSet(); }
    else if(k==="goal") phGoal(id);
    else if(k==="step") phStep(id);
    else if(k==="addstep") phAddStep();
    else if(k==="gedit") phGoalEdit();
    else if(k==="newgoal") phNewGoal();
    else if(k==="restore") $("#btn-backup").click();
    else if(k==="onb-next"){ if(PH_ONB===1) phOnbDay(); else phOnbStep(PH_ONB+1); }
    else if(k==="onb-back") phOnbStep(PH_ONB-1);
    else if(k==="onb-done") phOnbFinish(true);
    else if(k==="onb-skip") phOnbFinish(false);
    else if(k==="tog"){ phOnbRead(); PH_V[b.getAttribute("data-k")]=b.getAttribute("data-v"); PH_DRAWN=""; phRender(); }
    else if(k==="mic"){ var el=document.getElementById(b.getAttribute("data-for")); if(el) micInto(el,b,function(t){ var n=$("#ph-onb-hint"); if(n) n.textContent=t; }); }
  });
  root.addEventListener("keydown",function(e){ if(e.key==="Enter" && e.target && e.target.id==="ph-newstep"){ e.preventDefault(); phAddStep(); } });
  addEventListener("hashchange",function(){ if(PH_ON){ PH_DRAWN=""; phRender(); scrollTo(0,0); } });
  if(PH_MQ){ if(PH_MQ.addEventListener) PH_MQ.addEventListener("change",phSet); else if(PH_MQ.addListener) PH_MQ.addListener(phSet); }
  phSet();
})();
