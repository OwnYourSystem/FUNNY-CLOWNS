/* ---------------- what the planner is allowed to know ----------------
   A board that does not know where you are cannot tell you what to do. At
   one o'clock on a Monday the loudest thing on the board might be an hour
   on an airbike, and saying so is worse than saying nothing, because you
   are at a desk in an office and you will learn to ignore it.

   So the planner keeps a short profile. Not a calendar, not a life story:
   the six or seven facts that decide whether a thing is possible in the
   next hour. It is filled in by an interview, changed on the Planner page,
   and it never leaves this browser.                                     */
function freshMe(){
  return {done:false, days:[1,2,3,4,5], work:["08:00","16:30"], commute:30,
          sharp:"morning", gym:"evening", wind:"22:30", north:"", never:"",
          feeds:[], brief:"07:30", icon:""};
}
function toGoals(){
  if(!state.archive) state.archive=[];
  if(!state.backlog) state.backlog=[];
  if(!state.tagFilter) state.tagFilter=[];
  if(!state.me) state.me=freshMe();
  var me=state.me, d=freshMe();
  /* a profile saved by an older build is filled in, never replaced */
  for(var k in d) if(me[k]===undefined) me[k]=d[k];
  if(!Array.isArray(me.days)) me.days=d.days;
  if(!Array.isArray(me.work)||me.work.length!==2) me.work=d.work;
  if(!Array.isArray(me.feeds)) me.feeds=[];
  me.feeds=me.feeds.filter(function(k){ return FEEDS.some(function(f){ return f[0]===k; }); });
  state.groups.concat(state.archive, state.backlog.filter(function(b){ return b.goal; }).map(function(b){ return b.goal; })).forEach(function(g){
    if(g.due===undefined) g.due="";
    if(!g.prio) g.prio="mid";
    if(!Array.isArray(g.tags)) g.tags=[];
    if(g.tags.length>5) g.tags=g.tags.slice(0,5);
    if(!g.where) g.where=guessWhere(g.name);
    g.subs.forEach(function(id){
      var x=state.subs[id];
      if(!x) return;
      if(!SUB_W[x.prio]) x.prio="mid";
      if(x.due===undefined) x.due="";
    });
  });
}
/* how many days until it is wanted. Null when no date is set. */
function daysLeft(g){
  if(!g||!g.due) return null;
  var d=new Date(g.due+"T00:00:00"), t=new Date(todayStr()+"T00:00:00");
  if(isNaN(d.getTime())) return null;
  return Math.round((d-t)/864e5);
}
function dueLabel(g){
  var n=daysLeft(g);
  if(n===null) return "";
  if(n<0) return Math.abs(n)+" days over";
  if(n===0) return "due today";
  if(n===1) return "due tomorrow";
  return n+" days left";
}
/* Five bands, so the eye does the reading: nothing, a quarter, half,
   most, all.                                                          */
function band(p){
  if(p>=100) return "b100";
  if(p>75)   return "b75";
  if(p>50)   return "b50";
  if(p>0)    return "b25";
  return "b0";
}
function migrate1(old){
  var s=blankState();
  state=s; sync();
  Object.keys(old.prog||{}).forEach(function(id){
    var sub=s.subs[id]; if(!sub) return;
    sub.pct=old.prog[id];
    if(old.upd&&old.upd[id]) sub.upd=old.upd[id];
    if(old.blocked&&old.blocked[id]) sub.status="blocked";
    else if(sub.pct>=100) sub.status="done";
    else if(sub.pct>0) sub.status="doing";
  });
  (old.today||[]).forEach(function(c){ s.plan.push({k:c.k,id:c.id,carried:!!c.carried}); });
  s.hist=old.hist||[]; s.log=old.log||[]; s.sel=old.sel||"";
  s.seedRev=0;
  return s;
}
/* Where the board is kept, decided in one place so the two stores can
   never both think they are in charge.
     account  signed in. The account holds it, on every device.
     artifact no account, but the claude.ai store is there. It holds it.
     local    neither. This browser holds it, and only this browser.    */
function syncMode(){
  if(ACCOUNT_ON && typeof acct!=="undefined" && acct && acct.uid) return "account";
  if(typeof boardDb!=="undefined" && boardDb) return "artifact";
  return "local";
}

/* Search: every word you typed has to appear somewhere in the thing, in
   any order. Two words narrow it, they do not have to sit together.   */
var searchText="";
function searchQ(){ return searchText.trim().toLowerCase(); }
function hit(text,q){
  if(!q) return true;
  var t=String(text||"").toLowerCase();
  return q.split(/\s+/).every(function(w){ return t.indexOf(w)>=0; });
}
function gById(id){ for(var i=0;i<state.groups.length;i++) if(state.groups[i].id===id) return state.groups[i]; return null; }
function detach(sid){
  state.groups.forEach(function(g){ var i=g.subs.indexOf(sid); if(i>=0) g.subs.splice(i,1); });
}
function killed(id){ return state.killed.indexOf(id)>=0; }
/* A finished goal leaves the board rather than sitting there at 100%. Its
   subtasks stay where they are, so putting it back is one press.      */
function archiveGoal(id){
  var g=gById(id); if(!g) return false;
  g.archivedAt=todayStr();
  state.archive.unshift(g);
  state.groups.splice(state.groups.indexOf(g),1);
  ["oftad","plan","done"].forEach(function(z){
    state[z]=state[z].filter(function(c){ return g.subs.indexOf(c.id)<0; });
  });
  if(state.sel===id) state.sel=state.groups.length?state.groups[0].id:"";
  touchHist(); save(); renderAll();
  return true;
}
/* A goal can wait in the Backlog instead of sitting on the board. It leaves
   the same way an archived one does, with its subtasks kept, so it counts for
   nothing in Overall, the alarms or the verdict until it is made active.  */
function backlogGoal(id){
  var g=gById(id); if(!g) return false;
  state.backlog.unshift({t:g.name, d:todayStr(), goal:g});
  state.groups.splice(state.groups.indexOf(g),1);
  ["oftad","plan","done"].forEach(function(z){
    state[z]=state[z].filter(function(c){ return c.id!==g.id && g.subs.indexOf(c.id)<0; });
  });
  if(state.sel===id) state.sel=state.groups.length?state.groups[0].id:"";
  openGroupEd=false;
  touchHist(); save(); renderAll();
  return true;
}
/* true when a goal with this id is already waiting in the backlog or archive */
function waiting(id){
  return state.archive.some(function(g){ return g.id===id; }) ||
         state.backlog.some(function(b){ return b.goal && b.goal.id===id; });
}
function unarchiveGoal(id){
  var i=-1;
  state.archive.forEach(function(g,n){ if(g.id===id) i=n; });
  if(i<0) return false;
  var g=state.archive.splice(i,1)[0];
  delete g.archivedAt;
  state.groups.push(g);
  state.sel=g.id;
  touchHist(); save(); renderAll();
  return true;
}

function sync(){
  if(state.seedRev>=SEED_REV) return false;
  var ue=state.ue;
  SEED.forEach(function(sg){
    var g=gById(sg.id);
    if(!g){
      if(killed(sg.id)||waiting(sg.id)) return;
      g={id:sg.id,name:sg.name,subs:[],due:"",prio:"mid",tags:[]};
      state.groups.push(g);
    } else {
      if(!ue[sg.id+"|name"]) g.name=sg.name;
    }
    sg.subs.forEach(function(ss){
      var s=state.subs[ss.id];
      if(!s){
        if(killed(ss.id)) return;
        state.subs[ss.id]={id:ss.id,name:ss.name,pct:ss.pct||0,
          status:ss.status||"todo",tag:ss.tag||"",upd:agoDate(ss.ago||0),gid:sg.id};
        g.subs.push(ss.id);
      } else {
        if(!ue[ss.id+"|name"]) s.name=ss.name;
        if(!ue[ss.id+"|group"] && s.gid!==sg.id){ detach(ss.id); g.subs.push(ss.id); s.gid=sg.id; }
        if(!s.tag && ss.tag) s.tag=ss.tag;
      }
    });
  });
  state.groups.forEach(function(g){ delete g.icon; delete g.mp; });
  Object.keys(state.subs).forEach(function(id){
    var sx=state.subs[id];
    delete sx.pri; delete sx.est; delete sx.spent;
  });
  RETIRED.forEach(function(id){
    if(state.subs[id]){ detach(id); delete state.subs[id]; state.killed.push(id); return; }
    var g=gById(id);
    if(g && !g.subs.length){ state.groups.splice(state.groups.indexOf(g),1); state.killed.push(id); }
  });
  state.seedRev=SEED_REV;
  save();
  return true;
}
/* This used to draw 14 days of a rising line that never happened, and a
   delta against it. A board that invents its own history is worth less
   than one with none: the number you would act on is fiction. It now
   starts at today and records one point a day, for real.               */
function seedHist(){
  state.hist=[{d:todayStr(), v:overall(), first:1}];
}

