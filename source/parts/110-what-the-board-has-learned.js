/* ---------------- what the board has learned, and only what you kept ----------------
   It watches what you do and, when a pattern is clear enough to bet on, it
   shows you the pattern and the numbers behind it and asks. Nothing it
   notices is used until you say yes. A yes changes one setting and is written
   down here where you can read it, with where it came from, and removing it
   puts the setting back. The tutor can propose a note in words; that waits for
   your yes too. Things the board or the tutor learned lapse after 60 days
   unless the pattern shows up again; what you typed yourself stays until you
   remove it. Behaviour only: no moods, no health, nothing about who you are. */
var MEM_MAX=20, MEM_LAPSE=60, MEM_SNOOZE=30;
var MEM_SENSITIVE=/\b(moods?|feel(?:ing|s)?|sad|angry|cry\w*|suicid\w*|self[- ]harm|pregnan\w*|religio\w*|politic\w*|salary|password|passcode|address|phone number|email)\b/i;
function memList(){ if(!state.mem) state.mem=[]; if(!state.memNo) state.memNo={}; return state.mem; }
function memKept(){ return memList().filter(function(m){ return m.st==="kept"; }); }
function memProposed(){ return memList().filter(function(m){ return m.st==="proposed"; })[0]||null; }
function memLearnOn(){ return !(state.me && state.me.learn===false); }
function memOk(text,src){
  var t=String(text||"").replace(/\s+/g," ").trim();
  if(t.length<3) throw new Error("That is too short to keep.");
  if(t.length>140) throw new Error("Keep it to one short sentence, under 140 characters.");
  if(src!=="you" && (CHK_BAN.test(t) || MEM_SENSITIVE.test(t)))
    throw new Error("I only keep notes about how you work, not about moods, health or personal details.");
  return t;
}
function memApply(m){
  var a=m.apply; if(!a) return;
  if(!state.me) state.me=freshMe();
  var me=state.me;
  if(a.sharp){ a.prev=me.sharp; me.sharp=a.sharp; }
  if(a.normalN){ a.prev=me.normalN||0; me.normalN=a.normalN; }
  if(a.light!==undefined){ me.lightDays=(me.lightDays||[]).filter(function(x){ return x!==a.light; }).concat([a.light]); }
}
function memUnapply(m){
  var a=m.apply, me=state.me; if(!a||!me) return;
  if(a.sharp && me.sharp===a.sharp && a.prev) me.sharp=a.prev;
  if(a.normalN && me.normalN===a.normalN){ if(a.prev) me.normalN=a.prev; else delete me.normalN; }
  if(a.light!==undefined) me.lightDays=(me.lightDays||[]).filter(function(x){ return x!==a.light; });
}
function memAdd(text,src,extra){
  var t=memOk(text,src), list=memList(), k;
  if(memKept().length>=MEM_MAX) throw new Error(MEM_MAX+" notes is the limit. Forget one first.");
  var dup=list.filter(function(m){ return m.t.toLowerCase()===t.toLowerCase(); })[0];
  if(dup){ dup.seen=todayStr(); return dup; }
  var m={id:uid("m"), t:t, src:src, st:src==="you"?"kept":"proposed", d:todayStr(), seen:todayStr()};
  if(extra) for(k in extra) m[k]=extra[k];
  list.push(m);
  if(m.st==="kept") evAdd({t:Date.now(),k:"mem",act:"keep",src:src});
  return m;
}
function memKeep(id){
  var m=memList().filter(function(x){ return x.id===id; })[0]; if(!m) return null;
  if(memKept().length>=MEM_MAX) throw new Error(MEM_MAX+" notes is the limit. Forget one first.");
  m.st="kept"; m.seen=todayStr(); memApply(m);
  evAdd({t:Date.now(),k:"mem",act:"keep",src:m.src});
  return m;
}
function memDrop(id,snooze){
  var list=memList(), i;
  for(i=0;i<list.length;i++) if(list[i].id===id){
    var m=list[i]; memUnapply(m);
    if(snooze && m.key) state.memNo[m.key]=addDays(todayStr(),MEM_SNOOZE);
    list.splice(i,1); evAdd({t:Date.now(),k:"mem",act:"drop",src:m.src}); return m;
  }
  return null;
}
function memErase(){
  memList().slice().forEach(function(m){ memUnapply(m); });
  state.mem=[]; state.memNo={}; evAdd({t:Date.now(),k:"mem",act:"erase"});
}
var DAYS_PL=["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"];
function memMedian(a){
  var b=a.slice().sort(function(x,y){ return x-y; }), n=b.length;
  return n%2 ? b[(n-1)/2] : (b[n/2-1]+b[n/2])/2;
}
/* what the last weeks say. Each one needs real numbers and a clear pattern, and each comes with the evidence in words. */
var MEM_SKIP_TRY={"too big":"E-STRETCH-01","wrong time":"E-CAP-01","doesn't want to":"E-CHOICE-01","wrong place":"E-ENV-01"};
function memFindings(){
  var out=[], today=todayStr(), me=state.me||freshMe(), n;
  /* 1. when the finishing happens */
  var hs=evStats("completions",30,"hour_slot");
  if(hs.enough && hs.rows.length){
    var top=hs.rows[0];
    if(top.share>=0.55 && top.key!==me.sharp) out.push({key:"hours", k:"finding",
      t:"Most of what you finish happens in the "+top.key+": "+top.count+" of "+hs.n+" in the last 30 days. Make "+top.key+" your sharpest time?",
      evid:top.count+" of "+hs.n+" finished items, last 30 days. This shows when you finish things, not when you work best.",
      apply:{sharp:top.key}});
  }
  /* 2. how much a normal day holds */
  var perDay=expSeries({metric:"completions_per_day"},addDays(today,-28),today);
  if(perDay.length>=7){
    var med=Math.round(memMedian(perDay)), cur=doseN("normal");
    if(med>=1 && med<=6 && med!==cur) out.push({key:"dose", k:"finding",
      t:"On the days you open the board you finish a median of "+med+(med===1?" thing":" things")+". Make "+med+" your normal day (it is "+cur+" now)?",
      evid:"Median over "+perDay.length+" active days in the last 4 weeks.",
      apply:{normalN:med}});
  }
  /* 3. a weekday that is reliably lighter */
  var days=expDays({metric:"completions_per_day"},addDays(today,-56),today), best=null, d;
  for(d=0;d<7;d++){
    if(me.lightDays && me.lightDays.indexOf(d)>=0) continue;
    var B=[], A=[];
    days.forEach(function(x){ var w=new Date(x.d+"T00:00:00").getDay(); (w===d?B:A).push(x.v); });
    if(B.length<4 || A.length<10) continue;
    var t=expTest(A,B,"wd"+d+today);
    if(t.hi<0 && t.p<0.10 && t.before>=1 && t.during<=0.6*t.before && (!best||t.diff<best.t.diff)) best={d:d,t:t,nb:B.length};
  }
  if(best) out.push({key:"light-"+best.d, k:"finding",
    t:DAYS_PL[best.d]+" are your lightest day: "+(Math.round(best.t.during*10)/10)+" finished on a "+DAYS_PL[best.d].slice(0,-1)+" against "+(Math.round(best.t.before*10)/10)+" on other days. Start "+DAYS_PL[best.d]+" light?",
    evid:"Over "+best.nb+" "+DAYS_PL[best.d]+" in the last 8 weeks; 90% range of the difference "+(Math.round(best.t.lo*10)/10)+" to "+(Math.round(best.t.hi*10)/10)+".",
    apply:{light:best.d}});
  /* 4. a reason that keeps coming up: a hint, with something to try */
  var sk=evStats("skips",30,"reason");
  if(sk.enough && sk.rows.length && sk.rows[0].share>=0.5 && MEM_SKIP_TRY[sk.rows[0].key] && !(state.exp&&state.exp.active)){
    var r=sk.rows[0];
    out.push({key:"skip-"+r.key, k:"hint", suggest:MEM_SKIP_TRY[r.key],
      t:"“"+r.key+"” is "+r.count+" of your "+sk.n+" skips in the last 30 days. The library has something to try for that.",
      evid:r.count+" of "+sk.n+" skips, last 30 days."});
  }
  return out;
}
/* once a day: let things lapse, and look for one thing worth asking about */
function memTick(force){
  var list=memList(), today=todayStr(), changed=false;
  list.slice().forEach(function(m){
    if(m.src==="you") return;
    if(m.st==="proposed" && ageOf(m.d)>MEM_SNOOZE){ memDrop(m.id,false); changed=true; return; }
    if(m.st==="kept" && ageOf(m.seen)>MEM_LAPSE){ memDrop(m.id,false); changed=true; }
  });
  if(!force && state.memAt===today){ if(changed) save(); return null; }
  state.memAt=today;
  var fresh=null;
  if(memLearnOn() && !memProposed() && memKept().length<MEM_MAX){
    var cands=memFindings();
    /* a kept finding that shows up again is seen again, so it does not lapse */
    cands.forEach(function(c){ memKept().forEach(function(m){ if(m.key===c.key) m.seen=today; }); });
    var c=cands.filter(function(c){
      if(state.memNo[c.key] && state.memNo[c.key]>today) return false;
      return !memList().some(function(m){ return m.key===c.key; });
    })[0];
    if(c){ try{ fresh=memAdd(c.t,"board",{key:c.key,k:c.k,evid:c.evid,apply:c.apply,suggest:c.suggest}); }catch(e){ fresh=null; } }
  }
  save();
  return fresh;
}
function memLine(m,i){
  return (i+1)+". "+m.t+" ("+(m.src==="you"?"you told me":m.src==="tutor"?"the tutor suggested, you kept it":"learned from what you did")+")";
}
function memSay(){
  var k=memKept();
  if(!k.length) return "Nothing yet. Type remember and a short note, or I will ask when I notice a pattern.";
  return "What I know, all of it kept by you: "+k.map(memLine).join(" ")+" Type forget and a number to remove one.";
}
var MEM_ARM=0;


