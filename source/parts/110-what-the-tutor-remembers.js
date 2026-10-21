/* ---------------- what the board and the tutor learn, and only what you kept ----------------
   Restored 2026-10-21. Owner: "AI is the personal tutor and the
   coordinator", and "the AI agent should learn from user behavior in order
   to give customized recommendations. It was one of the principles from the
   very beginning of this project."
   Notes come from three places: the person types "remember ...", the tutor
   proposes one, or the board finds a pattern in what the person did (once a
   day, one at a time, with the numbers). Nothing is kept without the
   person's Keep, and Not now silences that question for 30 days. Kept notes
   go to the tutor with every conversation, so its suggestions fit this
   person. What the person typed stays until they remove it; what the board
   or the tutor learned lapses after 60 days unless the pattern shows up
   again. Only one finding changes a setting (steps on a good day), and
   removing it puts the old number back. The 5 rules still choose the next
   step; learning shapes the suggestions around them. Behaviour only: no
   moods, no health, nothing about who they are. Learning can be switched
   off.                                                                   */
var MEM_MAX=20, MEM_LAPSE=60, MEM_SNOOZE=30;
/* its own list, with the tutor check's clinical words: the board asks at load, before that check exists */
var MEM_SENSITIVE=/\b(moods?|feel(?:ing|s)?|sad|angry|cry\w*|suicid\w*|self[- ]harm|pregnan\w*|religio\w*|politic\w*|salary|password|passcode|address|phone number|email|diagnos\w*|disorders?|depress(?:ed|ion|ive)|adhd|bipolar|ptsd|medication\w*|prescri\w*|psychiatr\w*|mental illness)\b/i;
function memList(){ if(!state.mem) state.mem=[]; if(!state.memNo) state.memNo={}; return state.mem; }
function memLearnOn(){ return !(state.me && state.me.learn===false); }
function memKept(){ return memList().filter(function(m){ return m.st==="kept"; }); }
function memProposed(){ return memList().filter(function(m){ return m.st==="proposed" && m.src==="tutor"; })[0]||null; }
function memOk(text,src){
  var t=String(text||"").replace(/\s+/g," ").trim();
  if(t.length<3) throw new Error("That is too short to keep.");
  if(t.length>140) throw new Error("Keep it to one short sentence, under 140 characters.");
  if(src!=="you" && MEM_SENSITIVE.test(t))
    throw new Error("I only keep notes about how you work, not about moods, health or personal details.");
  return t;
}
/* a kept finding may change one setting, and only that; removing it puts the old value back */
function memApply(m){
  var a=m.apply; if(!a) return;
  var me=state.me||(state.me=freshMe());
  if(a.normalN){ a.prev=me.normalN||0; me.normalN=a.normalN; }
}
function memUnapply(m){
  var a=m.apply, me=state.me; if(!a||!me) return;
  if(a.normalN && me.normalN===a.normalN){ if(a.prev) me.normalN=a.prev; else delete me.normalN; }
}
function memAdd(text,src,extra){
  var t=memOk(text,src), list=memList(), k;
  var dup=list.filter(function(m){ return m.t.toLowerCase()===t.toLowerCase(); })[0];
  if(dup){ dup.seen=todayStr(); return dup; }
  if(memKept().length>=MEM_MAX) throw new Error(MEM_MAX+" notes is the limit. Forget one first.");
  var m={id:uid("m"), t:t, src:src, st:src==="you"?"kept":"proposed", d:todayStr(), seen:todayStr()};
  if(extra) for(k in extra) m[k]=extra[k];
  list.push(m);
  if(m.st==="kept") evAdd({t:Date.now(),k:"mem",act:"keep",src:src});
  return m;
}
function memKeep(id){
  var m=memList().filter(function(x){ return x.id===id; })[0]; if(!m) return null;
  if(m.st!=="kept" && memKept().length>=MEM_MAX) throw new Error(MEM_MAX+" notes is the limit. Forget one first.");
  m.st="kept"; m.d=todayStr(); m.seen=todayStr(); memApply(m);
  evAdd({t:Date.now(),k:"mem",act:"keep",src:m.src});
  return m;
}
/* snooze: Not now on a finding silences that question for 30 days */
function memDrop(id,snooze){
  var list=memList(), i;
  for(i=0;i<list.length;i++) if(list[i].id===id){
    var m=list.splice(i,1)[0];
    if(m.st==="kept"){ memUnapply(m); evAdd({t:Date.now(),k:"mem",act:"drop",src:m.src}); }
    if(snooze && m.key) state.memNo[m.key]=addDays(todayStr(),MEM_SNOOZE);
    return m;
  }
  return null;
}
function memErase(){ memList().forEach(function(m){ if(m.st==="kept") memUnapply(m); }); state.mem=[]; state.memNo={}; evAdd({t:Date.now(),k:"mem",act:"erase"}); }

/* ---- what the last weeks say. Each finding needs real numbers and a clear
   pattern, and comes with the numbers in words. Counts show when things
   happened, not when the person works best, and the notes say so. ---- */
var DAYS_PL=["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"];
function memMedian(a){ var b=a.slice().sort(function(x,y){ return x-y; }), n=b.length; return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2; }
/* finished items per day, for the days the board was opened, from..to (YYYY-MM-DD, to excluded) */
function memPerDay(from,to){
  var opened={}, done={};
  (state.ev||[]).forEach(function(e){
    var d=dstr(new Date(e.t)); if(d<from||d>=to) return;
    opened[d]=1;
    if(e.k==="done"){ done[d]=done[d]||{}; done[d][e.id]=1; }
  });
  return Object.keys(opened).sort().map(function(d){ return {d:d, v:done[d]?Object.keys(done[d]).length:0}; });
}
function memFindings(){
  var out=[], today=todayStr();
  /* 1. when the finishing happens: a note for the tutor, no setting */
  var hs=evStats("completions",30,"hour_slot");
  if(hs.n>=8 && hs.rows.length && hs.rows[0].share>=0.55){
    var top=hs.rows[0];
    out.push({key:"hours-"+top.key, t:"Most of what I finish happens in the "+top.key+": "+top.count+" of "+hs.n+" in the last 30 days.",
      evid:top.count+" of "+hs.n+" finished items, last 30 days. It shows when you finish things, not when you work best."});
  }
  /* 2. how many steps a good day holds: the one finding that changes a setting */
  var days=memPerDay(addDays(today,-28),today);
  if(days.length>=7){
    var med=Math.round(memMedian(days.map(function(x){ return x.v; }))), cur=doseN("normal");
    if(med>=1 && med<=4 && med!==cur) out.push({key:"good-"+med,
      t:"On the days I open the board I finish a median of "+med+(med===1?" step":" steps")+". A good day is "+med+(med===1?" step":" steps")+".",
      evid:"Median over "+days.length+" days you opened the board in the last 4 weeks. Keep it, and Steps on a good day changes from "+cur+" to "+med+".",
      apply:{normalN:med}});
  }
  /* 3. a weekday that is reliably lighter: a note, so the tutor can suggest a lighter start */
  var wk=memPerDay(addDays(today,-56),today), best=null, d;
  for(d=0;d<7;d++){
    var B=[], A=[];
    wk.forEach(function(x){ (new Date(x.d+"T00:00:00").getDay()===d?B:A).push(x.v); });
    if(B.length<4 || A.length<10) continue;
    var mb=B.reduce(function(s,v){ return s+v; },0)/B.length, ma=A.reduce(function(s,v){ return s+v; },0)/A.length;
    if(ma>=1 && mb<=0.6*ma && (!best || mb/ma<best.r)) best={d:d, r:mb/ma, mb:mb, ma:ma, n:B.length};
  }
  if(best) out.push({key:"light-"+best.d,
    t:DAYS_PL[best.d]+" are my lightest day: "+(Math.round(best.mb*10)/10)+" finished, against "+(Math.round(best.ma*10)/10)+" on other days.",
    evid:"Over "+best.n+" "+DAYS_PL[best.d]+" in the last 8 weeks. On those days the tutor can suggest a lighter start."});
  /* 4. a step that keeps being skipped: the tutor can help make it smaller */
  var sk={};
  evSel("skips",evWin(21),Date.now()+1).forEach(function(e){ if(e.id) sk[e.id]=(sk[e.id]||0)+1; });
  Object.keys(sk).sort(function(a,b){ return sk[b]-sk[a]; }).slice(0,1).forEach(function(id){
    var s=state.subs[id]; if(!s || sk[id]<3 || s.pct>=100 || s.status==="done") return;
    out.push({key:"skip-"+id, t:"I often skip \u201c"+s.name.slice(0,60)+"\u201d. A smaller first step may help.",
      evid:"Skipped "+sk[id]+" times in the last 3 weeks."});
  });
  return out;
}
/* once a day: let learned notes lapse, keep the ones still true fresh, and find one thing worth asking about */
function memTick(force){
  var list=memList(), today=todayStr();
  list.slice().forEach(function(m){
    if(m.src==="you" || m.st!=="kept") return;
    if(ageOf(m.seen||m.d)>MEM_LAPSE) memDrop(m.id,false);
  });
  if(!force && state.memAt===today) return memAsked();
  state.memAt=today;
  if(!memLearnOn() || memAsked() || memKept().length>=MEM_MAX) return memAsked();
  var cands=memFindings();
  cands.forEach(function(c){ memKept().forEach(function(m){ if(m.key===c.key) m.seen=today; }); });
  var c=cands.filter(function(c){
    if(state.memNo[c.key] && state.memNo[c.key]>today) return false;
    return !list.some(function(m){ return m.key===c.key; });
  })[0];
  if(c){ try{ memAdd(c.t,"board",{key:c.key, evid:c.evid, apply:c.apply}); }catch(e){} }
  return memAsked();
}
/* the board's own finding waiting for the person's answer (a tutor proposal is asked in its own sheet) */
function memAsked(){ return memList().filter(function(m){ return m.st==="proposed" && m.src==="board"; })[0]||null; }
function memLine(m,i){ return (i+1)+". "+m.t+" ("+(m.src==="you"?"you told me":m.src==="tutor"?"the tutor suggested, you kept it":"learned from what you did, you kept it")+")"; }
function memSay(){
  var k=memKept();
  if(!k.length) return "Nothing yet. Type remember and a short note, for example: remember I do my best work before lunch.";
  return "What I know, all of it kept by you: "+k.map(memLine).join(" ")+" Type forget and a number to remove one.";
}
