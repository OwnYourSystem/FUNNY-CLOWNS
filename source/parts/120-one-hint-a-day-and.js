/* ---------------- one hint a day, and learning which kind helps you ----------------
   Not advice generated from nowhere: each hint is built from something the
   board can see in your own numbers (days you finished something, a goal
   that stopped moving, today's size) or from a library entry, and says where
   it came from. At most one a day. Under it, three answers: helpful, not for
   me, later. The board tries each kind once, then leans toward the kind you
   mark helpful (or act on, by starting the experiment it suggests). A kind you
   refuse is only retried when nothing better has a new hint, and a kind you
   answer "not for me" three times without ever marking one helpful is not shown
   again until you reset it.
   Every hint passes the same check as the tutor's replies before you see it.
   It reaches you as a card on the board, and as a reminder only if reminders
   are on and the board is open at the time: a browser cannot wake a closed
   page, and sending to a closed one needs a server this does not have.   */
var HINT_TYPES=["progress","stalled","library"], HINT_REPEAT=14, HINT_KEEP=60;
var HINT_NAMES={progress:"Evidence of your progress", stalled:"A goal that stopped moving", library:"An idea from the library"};
function hintOn(){ return !(state.me && state.me.hints===false); }
function hintLog(){ if(!state.hintLog) state.hintLog=[]; return state.hintLog; }
function hintCands(){
  var out=[], today=todayStr(), x, e;
  /* 1. days you finished something */
  var dd=expDays({metric:"completion_days"},addDays(today,-14),today);
  x=dd.filter(function(d){ return d.v===1; }).length;
  if(x>=3) out.push({type:"progress", key:"progress", cite:"E-EVID-01",
    t:"You finished something on "+x+" of the last 14 days. Writing that down is the point: evidence of progress is more convincing than telling yourself you are strong [E-EVID-01].",
    evid:x+" of the last 14 days had at least one finished item.", facts:x+" 14"});
  /* 2. a goal that is part way and has not moved */
  var worst=null;
  state.groups.forEach(function(g){
    var pc=groupPct(g); if(pc<=0||pc>=100) return;
    var last=""; g.subs.forEach(function(id){ var sb=state.subs[id]; if(sb&&sb.upd&&sb.upd>last) last=sb.upd; });
    if(!last) return;
    var age=ageOf(last);
    if(age>=14 && (!worst||age>worst.age)) worst={g:g,age:age,pc:pc,last:last};
  });
  if(worst){
    var run=!(state.exp&&state.exp.active);
    out.push({type:"stalled", key:"stalled-"+worst.g.id, cite:"E-BARRIER-01", suggest:run?"E-STRETCH-01":undefined,
      t:worst.g.name+" has not moved in "+worst.age+" days and sits at "+worst.pc+"%. A stall usually has a cause: wrong place, wrong time, too big, or you do not want it [E-BARRIER-01]."+
        (run?" Type try E-STRETCH-01 to test halving the next step.":""),
      evid:"Last change "+worst.last+".", facts:worst.age+" "+worst.pc+" "+worst.last});
  }
  /* 3. an entry that fits today */
  var q=libContextQuery(), hits=libFind(q,4), why=doseNow().band==="low"?"today is a low day":"it matches what your recent days show";
  for(x=0;x<hits.length;x++){
    e=hits[x];
    out.push({type:"library", key:"lib-"+e.id, cite:e.id, suggest:(libRunnable(e)&&!(state.exp&&state.exp.active))?e.id:undefined,
      t:"["+e.id+"] "+e.claim+" Try: "+e.tryit.do,
      evid:"Chosen because "+why+". Practitioner opinion, not a trial.", facts:e.claim+" "+e.tryit.do});
  }
  return out;
}
function hintStats(log){
  var st={}, N=0;
  HINT_TYPES.forEach(function(t){ st[t]={h:0,no:0,n:0}; });
  log.forEach(function(l){
    var r=st[l.type]; if(!r) return;
    if(l.ans==="no"){ r.no++; r.n++; N++; }
    else if(l.ans==="helpful" || (l.acted && l.ans!=="no")){ r.h++; r.n++; N++; }
  });
  st._N=N; return st;
}
/* try every kind once, in order; after that favour the kind with the best record */
function hintChoose(cands,log,today){
  var st=hintStats(log), shown={};
  log.forEach(function(l){ if(l.d>addDays(today,-HINT_REPEAT)) shown[l.key]=1; });
  var best=null, bi=-1;
  HINT_TYPES.forEach(function(t,i){
    var r=st[t]; if(r.no>=3 && r.h===0) return;
    var c=cands.filter(function(x){ return x.type===t && !shown[x.key]; })[0]; if(!c) return;
    var score=r.n ? (r.h+1)/(r.n+2)+0.3*Math.sqrt(1/(r.n+1)) : Infinity;
    if(best===null || score>best.score){ best={score:score,c:c}; bi=i; }
  });
  return best?best.c:null;
}
function hintDone(h){ return !h || h.ans!==null || h.acted; }
function hintActed(id){
  var h=state.hint, floor=addDays(todayStr(),-3);
  if(h && h.suggest===id && h.d>=floor) h.acted=true;
  hintLog().forEach(function(l){ if(l.suggest===id && l.d>=floor) l.acted=true; });
}
function hintAnswer(ans){
  var h=state.hint; if(!h||h.d!==todayStr()) return false;
  h.ans=ans; evAdd({t:Date.now(),k:"hint",type:h.type,ans:ans}); save(); return true;
}
function hintSay(){
  if(!hintOn()) return "Hints are off. Type start hints to turn them on.";
  hintTick();
  var h=state.hint;
  if(!h) return "No hint today: nothing in your numbers is worth your attention yet.";
  return h.t+" ("+h.evid+")";
}
function hintPlain(t){ return String(t).replace(/\[E-[A-Z0-9-]+\]/g,"").replace(/\s+/g," ").replace(/ \./g,".").trim(); }


