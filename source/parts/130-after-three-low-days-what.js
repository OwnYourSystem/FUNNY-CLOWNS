/* ---------------- after three low days: what is in the way? ----------------
   A low day is allowed, and the board makes room for it. But a low day that
   repeats can be rest, or it can be a way of not looking at something, and the
   board cannot tell which. Shrinking the dose again would make both worse.
   So after three low days in a row it asks once, in plain words, and the
   answer decides what it offers: tiredness and overload want protecting,
   fear wants a smaller first step, not knowing how wants the step broken
   down, and not wanting it wants a hard look at whether it is still yours.
   It never diagnoses, it asks again no sooner than two weeks, and if the
   pattern is long or keeps coming back it says plainly that talking to
   someone is worth it. The question can be turned off.                  */
var BAR_WHY={
  cant:{label:"I can’t (too tired, or too much)", ids:["E-CAP-01","E-CYCLE-01"], lead:"That is a capacity problem, so protect capacity before anything else."},
  afraid:{label:"I’m afraid of it", ids:["E-STRETCH-01","E-START-01"], lead:"Fear usually wants a smaller first step, not a push."},
  how:{label:"I don’t know how", ids:["E-STRETCH-01","E-ONE-01"], lead:"Not knowing how wants the step broken into things you can actually do."},
  want:{label:"I don’t want to", ids:["E-CHOICE-01"], lead:"If you do not want it, pushing harder will not work, and it is worth asking whether it is still yours. You can move a goal to the Backlog: open it and press Move to backlog."},
  patch:{label:"Just a rough patch", ids:["E-GUILT-01"], lead:"Fine. Nothing needs fixing."}
};
var BAR_ORDER=["cant","afraid","how","want","patch"];
function barOn(){ return !(state.me && state.me.barrier===false); }
function barState(){ if(!state.barrier) state.barrier={asked:[],next:"",show:null,force:false}; return state.barrier; }
function barDaysBetween(a,b){ return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/864e5); }
/* the band the board showed each day you opened it, as it stood at the end of the day */
function barTouch(){
  var t=todayStr(), b=doseNow().band;
  if(!state.bandLog) state.bandLog={};
  var changed=state.bandLog[t]!==b;
  state.bandLog[t]=b;
  var keep=addDays(t,-30);
  Object.keys(state.bandLog).forEach(function(d){ if(d<keep){ delete state.bandLog[d]; changed=true; } });
  return changed;
}
/* consecutive opened days that were low, ending today; a gap of up to 3 days without opening does not break it */
function barStreak(){
  var t=todayStr(), log=state.bandLog||{}, days=Object.keys(log).sort().reverse(), n=0, prev=null, i;
  if(log[t]!=="low") return 0;
  for(i=0;i<days.length;i++){
    var d=days[i]; if(d>t) continue;
    if(log[d]!=="low") break;
    if(prev && barDaysBetween(d,prev)>3) break;
    n++; prev=d;
  }
  return n;
}
function barPending(){
  var b=barState();
  if(b.show) return false;
  if(b.force) return true;
  return barOn() && b.next<=todayStr() && barStreak()>=3;
}
function barRecent(days){ var from=addDays(todayStr(),-days); return barState().asked.filter(function(x){ return x.d>=from; }); }
function barReply(why){
  var W=BAR_WHY[why], hits=W.ids.map(libEntry).filter(function(e){ return e && LIB_USE[e.status]; });
  var long=barStreak()>=5, again=barRecent(28).length>=2;
  var text=W.lead+" "+hits.map(function(e,i){
    return "["+e.id+"] "+e.claim+" Try: "+e.tryit.do+(i===0?" Limit: "+e.limits:"");
  }).join(" ");
  if(long||again)
    text+=" If this has gone on for a while or keeps coming back, it is worth talking to someone you trust or a professional. I cannot tell you why it is happening.";
  var tryId=null;
  hits.forEach(function(e){ if(!tryId && libRunnable(e) && !(state.exp&&state.exp.active)) tryId=e.id; });
  return {text:text, tryId:tryId};
}
function barAnswer(why){
  if(!BAR_WHY[why]) throw new Error("No such answer.");
  var b=barState(), st=barStreak();
  var r=barReply(why);
  b.asked.push({d:todayStr(), why:why, streak:st});
  if(b.asked.length>30) b.asked.splice(0,b.asked.length-30);
  b.next=addDays(todayStr(),14); b.force=false;
  b.show={d:todayStr(), why:why, text:r.text, tryId:r.tryId};
  evAdd({t:Date.now(),k:"barrier",why:why,streak:st});
  save();
  return b.show;
}
function barSnooze(){ var b=barState(); b.next=addDays(todayStr(),7); b.force=false; save(); }
function barShow(){ return barState().show; }
function barVisible(){ return barPending() || !!barShow(); }
function barStatus(){
  var b=barState();
  return {pending:barPending(), low_days_in_a_row:barStreak(), asked_recently:barRecent(28).map(function(x){ return {date:x.d, answer:x.why}; }),
    next_check:b.next||null, on:barOn()};
}

