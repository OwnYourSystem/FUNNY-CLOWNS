/* ---------------- experiments: try one thing, measure it, say what it showed ----------------
   An entry in the library can be run. The person starts it; the board never
   does. One at a time, so that whatever changes can be put down to it. The
   outcome it will be judged on is fixed in the library before it starts, so
   nobody can go looking afterwards for something that moved. When the days
   are up the board compares them with the same number of days just before,
   on active days only (a day the board was not opened is not a bad day), and
   says what it found, with a range and the size of the sample, including when
   the answer is "not enough". It is two stretches of one life, not a
   controlled trial, and the result says so every time.                    */
var EXP_MIN=5, EXP_DRAWS=4000, EXP_KEEP=20;
var EXP_METRICS={
  completion_days:{label:"days with at least one thing finished", share:true},
  completions_per_day:{label:"things finished per active day"},
  moves_per_day:{label:"progress moves per active day"},
  skips_per_day:{label:"skips per active day"}
};
function libEntry(id){
  for(var i=0;i<EVIDENCE.length;i++) if(EVIDENCE[i].id===id) return EVIDENCE[i];
  return null;
}
function addDays(str,n){ var p=str.split("-"); return dstr(new Date(+p[0],+p[1]-1,+p[2]+n)); }
function expState(){
  if(!state.exp) state.exp={active:null,done:[],unseen:false};
  return state.exp;
}
/* a seeded generator, so the same days always give the same answer */
function expSeed(str){ var h=2166136261, i; for(i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function expRng(seed){
  var a=seed>>>0;
  return function(){
    a=(a+0x6D2B79F5)>>>0; var t=a;
    t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function expMean(a){ var s=0, i; for(i=0;i<a.length;i++) s+=a[i]; return a.length?s/a.length:0; }
/* one number per active day in [from, to), for the outcome the entry named */
function expSeries(o,from,to){ return expDays(o,from,to).map(function(x){ return x.v; }); }
function expDays(o,from,to){
  var day={};
  (state.ev||[]).forEach(function(e){
    var d=dstr(new Date(e.t)); if(d<from||d>=to) return;
    var x=day[d]||(day[d]={done:{},moves:0,skips:0});
    if(e.k==="done") x.done[e.id]=1;
    else if(e.k==="pct") x.moves++;
    else if(e.k==="skip" && (!o.why || e.why===o.why)) x.skips++;
  });
  return Object.keys(day).sort().map(function(d){
    var x=day[d], n=Object.keys(x.done).length;
    return {d:d, v:o.metric==="completion_days" ? (n>0?1:0) : o.metric==="completions_per_day" ? n :
           o.metric==="moves_per_day" ? x.moves : x.skips};
  });
}
/* the log keeps the last 800 events; a baseline that starts before them is not a baseline */
function expCovered(fromDay){
  var ev=state.ev||[];
  return !(ev.length>=EV_MAX && dstr(new Date(ev[0].t))>fromDay);
}
/* difference in means, a permutation test and a bootstrap range, on the days given */
function expTest(A,B,seedStr){
  var rnd=expRng(expSeed(seedStr)), diff=expMean(B)-expMean(A), pool=A.concat(B), nb=B.length, extreme=0, d, i, j, t;
  for(d=0;d<EXP_DRAWS;d++){
    for(i=pool.length-1;i>0;i--){ j=Math.floor(rnd()*(i+1)); t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
    var sb=0, sa=0;
    for(i=0;i<pool.length;i++){ if(i<nb) sb+=pool[i]; else sa+=pool[i]; }
    var md=sb/nb-sa/(pool.length-nb);
    if(Math.abs(md)>=Math.abs(diff)-1e-12) extreme++;
  }
  var diffs=[];
  function pick(a){ var s=0, k; for(k=0;k<a.length;k++) s+=a[Math.floor(rnd()*a.length)]; return s/a.length; }
  for(d=0;d<EXP_DRAWS;d++) diffs.push(pick(B)-pick(A));
  diffs.sort(function(x,y){ return x-y; });
  return {before:expMean(A), during:expMean(B), diff:diff,
    lo:diffs[Math.floor(0.05*EXP_DRAWS)], hi:diffs[Math.floor(0.95*EXP_DRAWS)-1],
    p:(extreme+1)/(EXP_DRAWS+1)};
}
function expResult(x){
  var o=x.outcome, M=EXP_METRICS[o.metric], endDay=addDays(x.start,x.days), fromB=addDays(x.start,-x.days);
  var r={ev:x.ev, start:x.start, days:x.days, outcome:o, label:M.label};
  if(!expCovered(fromB)){ r.verdict="not_enough"; r.why="the event log does not reach back far enough"; return r; }
  var A=expSeries(o,fromB,x.start), B=expSeries(o,x.start,endDay);
  r.nBefore=A.length; r.nDuring=B.length;
  if(A.length<EXP_MIN || B.length<EXP_MIN){ r.verdict="not_enough"; return r; }
  var t=expTest(A,B,x.id+x.ev+x.start), k;
  for(k in t) r[k]=t[k];
  var better=o.direction==="down" ? t.diff<0 : t.diff>0;
  r.verdict=((t.lo>0||t.hi<0) && t.p<0.10) ? (better?"better":"worse") : "unclear";
  return r;
}
function expFmt(metric,v){
  if(EXP_METRICS[metric].share) return Math.round(v*100)+"%";
  return String(Math.round(v*100)/100);
}
function expSay(r){
  if(r.verdict==="not_enough")
    return "Not enough to say. "+(r.why?"The reason: "+r.why+". ":"")+"You were active on "+(r.nBefore||0)+" days before and "+(r.nDuring||0)+
      " during, and I need at least "+EXP_MIN+" of each.";
  var f=function(v){ return expFmt(r.outcome.metric,v); };
  return r.label.charAt(0).toUpperCase()+r.label.slice(1)+": "+f(r.during)+" during, "+f(r.before)+" before (difference "+(r.diff>=0?"+":"")+f(r.diff)+
    ", 90% range "+f(r.lo)+" to "+f(r.hi)+"), over "+r.nDuring+" and "+r.nBefore+" active days. "+
    (r.verdict==="better"?"That looks better than before. ":r.verdict==="worse"?"That looks worse than before. ":"No clear difference. ")+
    "This compares two stretches of your own life, not a controlled trial, so anything else that changed is mixed in. Treat it as a hint.";
}
/* A button that starts an experiment asks first, in plain words. The tutor and the
   typed command are the person's own words, so they do not ask again. */
function expAsk(id){
  var e=libEntry(id), M;
  if(!e || !LIB_USE[e.status] || !libRunnable(e) || expState().active) return Promise.resolve(true);   /* expStart will say why not */
  M=EXP_METRICS[e.tryit.outcome.metric];
  return askUser({title:"Start this experiment?",
    body:[e.tryit.do,
      "It runs "+e.tryit.days+" days from today. At the end I compare "+M.label+" over those days with the "+e.tryit.days+
      " days before, and tell you what I find, including if it is not enough.",
      "Only one runs at a time. You can stop it whenever you like, and nothing is measured from a stopped one. Source: ["+id+
      "], practitioner opinion."],
    ok:"Start for "+e.tryit.days+" days", cancel:"Not now"});
}
function expShort(r){
  return !r ? "" : r.verdict==="better" ? "It looks better than before." : r.verdict==="worse" ? "It looks worse than before." :
    r.verdict==="unclear" ? "No clear difference." : "Not enough to say.";
}
function expRead(){
  var st=expStatus(); if(st.state!=="finished") return;
  var e=libEntry(st.id);
  askUser({title:"Experiment finished: "+st.id, body:[e?e.tryit.do:"", st.says], ok:"Got it", cancel:"Keep it on the board"}).then(function(yes){
    if(yes){ expState().unseen=false; save(); renderAll(); }
  });
}
function expStart(id){
  var e=libEntry(id);
  if(!e || !LIB_USE[e.status]) throw new Error("The library has no entry "+id+".");
  if(!libRunnable(e)) throw new Error(id+" cannot be measured on this board, so I would not call it an experiment. Just try it.");
  var x=expState();
  if(x.active) throw new Error("One experiment at a time: "+x.active.ev+" is running. Type stop experiment first.");
  x.active={id:uid("x"), ev:id, start:todayStr(), days:e.tryit.days, outcome:e.tryit.outcome, do:e.tryit.do};
  x.unseen=false;
  hintActed(id);
  evAdd({t:Date.now(),k:"exp",ev:id,act:"start"});
  touchHist(); save(); renderAll();
  return "Started "+id+" for "+e.tryit.days+" days from today: "+e.tryit.do+" I will compare "+EXP_METRICS[e.tryit.outcome.metric].label+
    " over these days with the "+e.tryit.days+" days before, and tell you what I find, including if it is not enough. Type stop experiment to end it.";
}
function expStopMsg(){
  var x=expState();
  if(!x.active) return "No experiment is running.";
  var id=x.active.ev; x.active=null;
  evAdd({t:Date.now(),k:"exp",ev:id,act:"stop"});
  touchHist(); save(); renderAll();
  return "Stopped "+id+". Nothing is measured from a stopped experiment.";
}
/* when its last day has passed, the result is worked out once and kept */
function expTick(){
  var x=state.exp; if(!x||!x.active) return false;
  var a=x.active; if(todayStr()<addDays(a.start,a.days)) return false;
  x.done.unshift({ev:a.ev, start:a.start, days:a.days, outcome:a.outcome, do:a.do, finished:todayStr(), result:expResult(a)});
  if(x.done.length>EXP_KEEP) x.done.length=EXP_KEEP;
  x.active=null; x.unseen=true;
  evAdd({t:Date.now(),k:"exp",ev:a.ev,act:"end"});
  save();
  return true;
}
function expStatus(){
  var x=expState();
  if(x.active){
    var a=x.active;
    return {state:"running", id:a.ev, do:a.do, day:Math.min(a.days,ageOf(a.start)+1), days:a.days,
      measures:EXP_METRICS[a.outcome.metric].label, ends:addDays(a.start,a.days)};
  }
  if(x.done.length){
    var d=x.done[0];
    return {state:"finished", unseen:!!x.unseen, id:d.ev, start:d.start, days:d.days, result:d.result, says:expSay(d.result)};
  }
  return {state:"none"};
}
function expStatusMsg(){
  var st=expStatus();
  if(st.state==="none") return "No experiment is running. Ask what to try, then say try and its id.";
  if(st.state==="running") return "Day "+st.day+" of "+st.days+" of "+st.id+": "+st.do+" I am measuring "+st.measures+" and will tell you on "+st.ends+".";
  return st.id+" finished. "+st.says;
}


