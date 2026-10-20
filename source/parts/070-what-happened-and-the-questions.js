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



