/* ---------------- what happened, and the questions you can put to it ----------------
   Every change to the board passes through save(), so that is where it is
   noticed: the percent that moved, the card that went into a dock or into
   Done Today. Skips and dose taps are not visible in the state, so they are
   written where they happen. Names are never stored. An event holds ids and
   a time; the name is looked up when somebody asks, so a rename or a delete
   cannot leave a stale name behind, and the log carries nothing a person
   would mind leaving the device if it ever did.

   Everything below is read-only and does its own arithmetic. The tutor is
   handed exact numbers and a sample size and is told to say "not enough"
   when there is not enough. It is never asked to estimate.             */
var EV_MAX=800, EV_MIN=8;
var evPrev;   /* boot() has already set it by the time this line runs; do not initialise it here */
function evG(id){
  var s=state.subs[id]; if(s) return s.gid;
  return gById(id) ? id : "";
}
function evAdd(e){
  if(!state.ev) state.ev=[];
  var u=(typeof acct!=="undefined" && acct && acct.uid) || "";
  if(u) e.u=u;
  state.ev.push(e);
  if(state.ev.length>EV_MAX) state.ev.splice(0,state.ev.length-EV_MAX);
}
function evSnap(){
  var sn={ref:state, day:state.day, pct:{}, dock:{oftad:{},plan:{},done:{}}};
  Object.keys(state.subs).forEach(function(id){ sn.pct[id]=state.subs[id].pct||0; });
  ["oftad","plan","done"].forEach(function(z){
    (state[z]||[]).forEach(function(c){ sn.dock[z][c.id]=1; });
  });
  return sn;
}
function evCapture(){
  if(!state||!state.subs) return;
  var now=evSnap(), p=evPrev; evPrev=now;
  /* a new day, or a whole board swapped in, is a reset and not a thing you did */
  if(!p||p.ref!==state||p.day!==state.day) return;
  var t=Date.now();
  Object.keys(now.pct).forEach(function(id){
    if(p.pct[id]===undefined || now.pct[id]===p.pct[id]) return;
    evAdd({t:t,k:"pct",id:id,g:evG(id),a:p.pct[id],b:now.pct[id]});
  });
  ["oftad","plan"].forEach(function(z){
    Object.keys(now.dock[z]).forEach(function(id){
      if(!p.dock[z][id]) evAdd({t:t,k:"take",id:id,g:evG(id),z:z});
    });
  });
  Object.keys(now.dock.done).forEach(function(id){
    if(!p.dock.done[id]){ evAdd({t:t,k:"done",id:id,g:evG(id)}); estOnDone(id); }
  });
  Object.keys(p.dock.done).forEach(function(id){
    if(!now.dock.done[id]) evAdd({t:t,k:"undo",id:id,g:evG(id)});
  });
}
function evSlot(t){ var h=new Date(t).getHours(); return h<12?"morning":(h<17?"afternoon":"evening"); }
function evWin(days){ var d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(days-1)); return d.getTime(); }
var EV_METRICS=["completions","finished","skips","takes","progress_moves"];
/* completions: cards that reached Done Today, once per item per day.
   finished: subtasks that crossed to 100%. */
function evSel(metric,from,to){
  var out=[], seen={};
  (state.ev||[]).forEach(function(e){
    if(e.t<from||e.t>=to) return;
    if(metric==="completions"){
      if(e.k!=="done") return;
      var key=dstr(new Date(e.t))+"|"+e.id; if(seen[key]) return; seen[key]=1;
    }
    else if(metric==="finished"){ if(e.k!=="pct"||e.b<100||e.a>=100) return; }
    else if(metric==="skips"){ if(e.k!=="skip") return; }
    else if(metric==="takes"){ if(e.k!=="take") return; }
    else if(metric==="progress_moves"){ if(e.k!=="pct") return; }
    else return;
    out.push(e);
  });
  return out;
}
function evActive(from,to){
  var d={};
  (state.ev||[]).forEach(function(e){ if(e.t>=from&&e.t<to) d[dstr(new Date(e.t))]=1; });
  return Object.keys(d).length;
}
function evKey(e,by){
  if(by==="hour_slot") return evSlot(e.t);
  if(by==="weekday") return DAYNAME[new Date(e.t).getDay()];
  if(by==="goal"){ var g=gById(e.g); return g?g.name:"(removed goal)"; }
  if(by==="day") return dstr(new Date(e.t));
  if(by==="reason") return e.why||"no reason given";
  return "all";
}
function evRound(x){ return Math.round(x*100)/100; }
function evStats(metric,days,by){
  if(EV_METRICS.indexOf(metric)<0) throw new Error("Metric must be one of: "+EV_METRICS.join(", ")+".");
  days=clamp(Math.round(+days||14),1,90); by=by||"none";
  var from=evWin(days), to=Date.now()+1;
  var sel=evSel(metric,from,to), rows={}, n=sel.length;
  sel.forEach(function(e){ var k=evKey(e,by); rows[k]=(rows[k]||0)+1; });
  var list=Object.keys(rows).map(function(k){ return {key:k, count:rows[k], share:n?evRound(rows[k]/n):0}; });
  list.sort(by==="day"?function(a,b){ return a.key<b.key?-1:1; }:function(a,b){ return b.count-a.count || (a.key<b.key?-1:1); });
  return {metric:metric, days:days, group_by:by, n:n, active_days:evActive(from,to),
    enough:n>=EV_MIN, min_n:EV_MIN, rows:list,
    note:"Counts show when things happened, not when you work best. They depend on when you are free and when you open the board."};
}
function evCompare(metric,days){
  if(EV_METRICS.indexOf(metric)<0) throw new Error("Metric must be one of: "+EV_METRICS.join(", ")+".");
  days=clamp(Math.round(+days||7),1,45);
  var t1=Date.now()+1, f1=evWin(days), f0=evWin(days*2);
  function win(from,to){
    var n=evSel(metric,from,to).length, a=evActive(from,to);
    return {n:n, active_days:a, per_active_day:a?evRound(n/a):null};
  }
  var A=win(f1,t1), B=win(f0,f1);
  return {metric:metric, days:days, this_period:A, previous_period:B, delta:A.n-B.n,
    enough:(A.active_days>=3 && B.active_days>=3 && A.n+B.n>=EV_MIN), min_n:EV_MIN,
    note:"Active days are days with any event. A day you did not open the board is not counted as a bad day."};
}
function evTrend(metric,days){
  days=clamp(Math.round(+days||14),3,90);
  var rows=[], i;
  if(metric==="overall_pct"){
    var from=dstr(new Date(evWin(days)));
    (state.hist||[]).forEach(function(h){ if(h.d>=from) rows.push({day:h.d,value:evRound(h.v)}); });
  } else {
    if(EV_METRICS.indexOf(metric)<0) throw new Error("Metric must be overall_pct or one of: "+EV_METRICS.join(", ")+".");
    var f=evWin(days), cnt={}, act={};
    (state.ev||[]).forEach(function(e){ if(e.t>=f) act[dstr(new Date(e.t))]=1; });
    evSel(metric,f,Date.now()+1).forEach(function(e){ var d=dstr(new Date(e.t)); cnt[d]=(cnt[d]||0)+1; });
    Object.keys(act).sort().forEach(function(d){ rows.push({day:d,value:cnt[d]||0}); });
  }
  var k=rows.length, slope=null;
  if(k>=2){
    var sx=0, sy=0, sxy=0, sxx=0;
    rows.forEach(function(r,j){ sx+=j; sy+=r.value; sxy+=j*r.value; sxx+=j*j; });
    var den=k*sxx-sx*sx; if(den) slope=evRound((k*sxy-sx*sy)/den);
  }
  return {metric:metric, days:days, points:k, slope_per_point:slope, enough:k>=7, min_points:7, rows:rows.slice(-30),
    note:"Slope is the average change per recorded day, from a straight line through the points. Seven or more points are needed before it means anything."};
}
function evRecent(kind,days,limit){
  days=clamp(Math.round(+days||7),1,90); limit=clamp(Math.round(+limit||15),1,30);
  var from=evWin(days), out=[];
  for(var i=(state.ev||[]).length-1;i>=0 && out.length<limit;i--){
    var e=state.ev[i];
    if(e.t<from) break;
    if(kind && kind!=="all" && e.k!==kind) continue;
    var s=state.subs[e.id], g=gById(e.g);
    var d=new Date(e.t);
    out.push({when:DAYNAME[d.getDay()].slice(0,3)+" "+dstr(d)+" "+pad2(d.getHours())+":"+pad2(d.getMinutes()),
      kind:e.k, item:s?s.name:(gById(e.id)?gById(e.id).name:"(removed)"), goal:g?g.name:"",
      from:e.a, to:e.b, dock:e.z, reason:e.why, you:e.you, guessed:e.est});
  }
  return out;
}
/* plain-language answers the board can give with no model at all */
function evPctTxt(x){ return Math.round(x*100)+"%"; }
function evSayWhen(){
  var r=evStats("completions",30,"hour_slot");
  if(!r.enough) return "Not enough yet. "+r.n+" finished "+(r.n===1?"item":"items")+" logged in the last 30 days, and I want at least "+
    r.min_n+" before I say anything about when. Keep using the board and ask again.";
  return "Last 30 days, "+r.n+" items finished: "+r.rows.map(function(x){ return x.key+" "+x.count+" ("+evPctTxt(x.share)+")"; }).join(", ")+
    ". That shows when things got done, not necessarily when you work best.";
}
function evSaySkips(){
  var r=evStats("skips",30,"reason"), g=evStats("skips",30,"goal");
  if(!r.enough) return "Not enough yet. "+r.n+" "+(r.n===1?"skip":"skips")+" logged in the last 30 days, and I want at least "+r.min_n+" before I read a pattern.";
  return "Last 30 days, "+r.n+" skips. Reasons: "+r.rows.map(function(x){ return x.key+" "+x.count; }).join(", ")+
    ". Most skipped goal: "+g.rows[0].key+" ("+g.rows[0].count+").";
}
function evSayWeek(){
  var c=evCompare("completions",7);
  if(!c.enough) return "Not enough yet to compare this week with last: "+c.this_period.n+" finished now, "+c.previous_period.n+
    " the week before, over "+c.this_period.active_days+" and "+c.previous_period.active_days+" active days. I want at least "+c.min_n+" in total and 3 active days in each week.";
  return "Finished "+c.this_period.n+" this week against "+c.previous_period.n+" the week before ("+(c.delta>=0?"+":"")+c.delta+
    "), over "+c.this_period.active_days+" and "+c.previous_period.active_days+" active days. A small sample, so read it as a hint.";
}
/* "Not this", and then why. One tap, once, and only if you want to. */
var SKIP_WHY=[["wrong place","Wrong place"],["wrong time","Wrong time"],["too big","Too big"],["doesn't want to","Don't want to"]];
function skipWhyHTML(){
  var ls=state.lastSkip; if(!ls||ls.why||Date.now()-ls.t>120000) return "";
  var s=state.subs[ls.id]; if(!s) return "";
  return '<div class="skipwhy"><span>You skipped '+esc(s.name)+'. Why?</span>'+
    SKIP_WHY.map(function(w){ return '<button class="mini" data-skipwhy="'+esc(w[0])+'">'+w[1]+'</button>'; }).join("")+'</div>';
}
function setSkipWhy(code){
  var ls=state.lastSkip; if(!ls) return;
  ls.why=code;
  for(var i=(state.ev||[]).length-1;i>=0;i--){
    var e=state.ev[i];
    if(e.k==="skip" && e.t===ls.t){ e.why=code; break; }
  }
  save(); renderAll();
}

/* EVIDENCE:BEGIN */
var EVIDENCE=[
 {"id":"E-CAP-01","status":"practitioner","tags":["capacity","energy","tired","exhausted","flat","low","overload","sleep","dose","limit"],"claim":"Size the day to what you can reliably sustain today, not to what you should be able to do.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"2"},"quote":"What can your nervous system, body and mind reliably sustain right now?","limits":"A framing, with no number for what a day can hold. The board's dose is only a guess from your recent days.","tryit":{"do":"On a day you feel flat, plan one step only.","days":7,"outcome":{"metric":"completion_days","direction":"up"}}},
 {"id":"E-BARRIER-01","status":"practitioner","tags":["stuck","skip","skipped","avoid","procrastinate","fear","afraid","anxious","meaning","want","know","reason","barrier","blocked"],"claim":"Not doing something has different causes (can't, afraid, doesn't know how, doesn't want to), and each needs a different fix.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"1"},"quote":"These require different interventions.","limits":"A way to ask the question, not a diagnosis. Only you can say which cause it is.","tryit":{"do":"After a skip, tap the reason, and leave the plan alone until one reason repeats.","days":14,"outcome":null}},
 {"id":"E-FLOOR-01","status":"practitioner","tags":["floor","minimum","small","smallest","daily","habit","streak","consistency","recovery","rest","one"],"claim":"Aim for one action a day that keeps or builds capacity; recovery counts when it protects tomorrow.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"4"},"quote":"Recovery can therefore count as productive behavior when recovery is what increases future functioning.","limits":"Rest can also hide avoidance. The board cannot tell which one a given day was.","tryit":{"do":"Name the smallest version of each goal and count it as done.","days":14,"outcome":{"metric":"completion_days","direction":"up"}}},
 {"id":"E-STRETCH-01","status":"practitioner","tags":["stretch","challenge","comfort","growth","hard","push","big","shrink","bigger","difficult"],"claim":"Most growth happens in the stretch zone, uncomfortable but manageable. Break a big step into things you can observe yourself doing.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"5"},"quote":"uncomfortable but manageable","limits":"Where the zone starts is personal and moves day to day. Stop at warning signs, such as worsening symptoms.","tryit":{"do":"When a step is skipped as too big, cut it in half and take the half.","days":14,"outcome":{"metric":"skips_per_day","direction":"down"}}},
 {"id":"E-START-01","status":"practitioner","tags":["start","begin","ready","motivation","procrastinate","activation","confidence","feeling","motivated","getting started"],"claim":"Do not wait to feel ready. Make the first action small enough to begin, and confidence tends to follow the action.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"6"},"quote":"The action only needs to be small enough that you can begin.","limits":"Practitioner view. It describes a common order of events, not a rule.","tryit":{"do":"Start the step for five minutes with no target after that.","days":7,"outcome":{"metric":"moves_per_day","direction":"up"}}},
 {"id":"E-CHOICE-01","status":"practitioner","tags":["pressure","choice","autonomy","resistance","forced","pushed","nagging","control"],"claim":"Pressure tends to start a power struggle. Choosing between steps that fit today's capacity keeps control with you, but rest should not become a way to avoid.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"7"},"quote":"Pressure creates a power struggle.","limits":"The line between rest and avoidance is a judgement the board cannot make for you.","tryit":{"do":"Pick between two steps that fit today instead of taking the first one offered.","days":7,"outcome":{"metric":"completions_per_day","direction":"up"}}},
 {"id":"E-FAIL-01","status":"practitioner","tags":["failure","miss","missed","shame","data","expected","mistake","fail","slip","behind"],"claim":"Treat a missed plan as a measurement: what you expected, what happened, what got in the way, then one next experiment.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"9"},"quote":"A failed plan becomes a measurement of the system.","limits":"It removes shame, not responsibility. One miss is a data point, so do not draw a pattern from it.","tryit":{"do":"After a missed day, write expected against done, and the one barrier.","days":14,"outcome":null}},
 {"id":"E-GUILT-01","status":"practitioner","tags":["guilt","bad","badday","past","wasted","timeline","regret","nothing","guilty"],"claim":"A bad day is one data point. It does not change the days around it, so the next move is a small adjustment, not a verdict on you.","strength":"practitioner opinion","from":"Record 2, a practitioner's advice","source":{"kind":"notes","file":"systems-continuum-approach.md","section":"3"},"quote":"it does not corrupt the entire timeline","limits":"A perspective, offered as comfort. It is not a measured result.","tryit":{"do":"After a bad day, do the smallest version of one step and nothing more.","days":7,"outcome":{"metric":"completion_days","direction":"up"}}},
 {"id":"E-EVID-01","status":"practitioner","tags":["progress","evidence","record","log","track","notice","confidence","identity","proof","journal"],"claim":"Record what you did, what discomfort you handled and what you learned. Evidence of progress is more convincing than telling yourself you are strong.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"10"},"quote":"Every day, record three pieces of evidence:","limits":"Practitioner view. The board logs what you did, but not what you handled or learned.","tryit":{"do":"Each evening note one thing you did, one you tolerated and one you learned.","days":14,"outcome":null}},
 {"id":"E-CYCLE-01","status":"practitioner","tags":["burnout","rest","recovery","cycle","consolidate","plateau","week","rhythm","stress","overwork"],"claim":"Alternate pushing and consolidating. Development comes from stress plus recovery, not stress alone.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"12"},"quote":"not stress alone","limits":"A general principle with no schedule proven for you.","tryit":{"do":"Make every fourth week a hold week with no new load.","days":28,"outcome":null}},
 {"id":"E-MEAS-01","status":"practitioner","tags":["measure","metrics","output","productive","balance","wellbeing","sleep","mood","anxiety","numbers"],"claim":"Output alone can mislead. More done with worse sleep or mood is not progress.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"13"},"quote":"A person might become more productive while sleep, anxiety and physical symptoms deteriorate.","limits":"The board measures output only. It has no sleep, mood or energy data yet.","tryit":{"do":"Once a week, note energy, mood and stress next to your completions.","days":14,"outcome":null}},
 {"id":"E-REASSESS-01","status":"practitioner","tags":["extra","borrow","overdo","add","reassess","good","exploit","overreach","lots"],"claim":"After a step is done, reassess before adding more work, and do not spend an unusually good day by borrowing from tomorrow.","strength":"practitioner opinion","from":"Record 1, a psychologist's advice","source":{"kind":"notes","file":"adaptive-1-percent-method.md","section":"14"},"quote":"Then reassess rather than automatically adding more work.","limits":"No evidence is given that stopping early helps. Treat it as a test, not a rule.","tryit":{"do":"On one good day, stop at the dose and see how tomorrow goes.","days":7,"outcome":null}},
 {"id":"E-BODY-01","status":"practitioner","tags":["exercise","body","movement","sleep","physical","training","gym","energy","mood","bike","walk"],"claim":"A neglected physical baseline drags everything else, so regular movement is the first lever to try.","strength":"practitioner opinion","from":"Record 2, a practitioner's advice","source":{"kind":"notes","file":"systems-continuum-approach.md","section":"1"},"quote":"If the hardware is neglected, the software will lag.","limits":"Opinion, with no amount of exercise given. Not medical advice.","tryit":{"do":"Move for ten minutes before the first task on three days this week.","days":7,"outcome":{"metric":"completions_per_day","direction":"up"}}},
 {"id":"E-ONE-01","status":"practitioner","tags":["focus","single","overwhelm","list","priority","overwhelmed","long","many","anxious","everything"],"claim":"When the list is long, pick the one action that makes the rest easier and do only that today.","strength":"practitioner opinion","from":"Record 2, a practitioner's advice","source":{"kind":"notes","file":"systems-continuum-approach.md","section":"2"},"quote":"Anxiety thrives on massive, paralyzing to-do lists.","limits":"A practitioner view. Picking wrongly costs a day, so keep the pick small.","tryit":{"do":"Use One Task A Day alone for three days.","days":7,"outcome":{"metric":"completion_days","direction":"up"}}},
 {"id":"E-ENV-01","status":"practitioner","tags":["environment","friction","autopilot","habit","willpower","distraction","setup","routine","cue","automatic"],"claim":"Do not rely on motivation. Set up your surroundings so that starting the right thing takes no willpower and the wrong thing takes effort.","strength":"practitioner opinion","from":"Record 2, a practitioner's advice","source":{"kind":"notes","file":"systems-continuum-approach.md","section":"4"},"quote":"Motivation is a highly unreliable emotion; we do not rely on it.","limits":"Opinion. Which change helps most is personal.","tryit":{"do":"Remove one step of friction before a recurring task: open the file, lay out the kit.","days":14,"outcome":{"metric":"completions_per_day","direction":"up"}}}
];
/* EVIDENCE:END */

