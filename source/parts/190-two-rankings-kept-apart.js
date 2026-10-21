/* ---------------- the five rules (owner, 2026-10-20) ----------------
   The board used to weigh about fifteen things at once and the weights
   collided (a heavy, stalled work step at nine in the evening on a very low
   day). It now follows five rules the person can read and check:
     1. You set your energy. If you do not, it stays at Good.
     2. Very low, or the last ninety minutes of your day (or outside it):
        no task. Only your own easy things.
     3. Low: your easy things, or at most one step you marked Easy.
     4. Good or Full: the next step, in order, of the goal with the nearest
        delivery day; otherwise of the goal that matches what you said
        matters most; otherwise of the goal at the top of your list.
     5. In work hours only work goals; outside them only the other goals.
     6. What is booked in your calendar comes first: no task during it,
        and booked hours make the day smaller (part 196).
   Nothing else is weighed: no hidden scores, no "stalled" pressure.      */
var DOSE_N={low:1,normal:3,high:5};
/* a normal day is 3 until the person keeps a finding that says otherwise */
function doseN(band,lvl){
  var n=Math.round(+(state.me&&state.me.normalN))||DOSE_N.normal;
  if(lvl===2) return clamp(n-1,1,2);         /* never more than a good day */
  return band==="low" ? DOSE_N.low : band==="high" ? n+2 : n;
}
/* The energy level (owner, 2026-10-20): four batteries the person taps, at
   the start of the day or any time in it. It is the same dose underneath:
   very low and low are a low day (1 and 2 steps), good is a normal day,
   full is a big one. A low level also changes which steps come first: a
   step marked easy (a hobby, a small job) goes ahead of a hard one.   */
var ENERGY=[null,{band:"low",name:"Very low"},{band:"low",name:"Low"},{band:"normal",name:"Good"},{band:"high",name:"Full"}];
function energyWhy(l,n){
  return l===1 ? "Your energy is very low, so nothing is needed today."
       : l===2 ? "Your energy is low, so only easy things and steps you marked Easy."
       : l===4 ? "Your energy is full, so today can carry more." : "";
}
function energyLvl(v){ v=Math.round(+v); return v>=1&&v<=4 ? v : 0; }
function doseNow(){ return calDose(doseBase(),state.me||freshMe()); }
function doseBase(){
  var cap=state.cap;
  if(cap && cap.d===todayStr() && energyLvl(cap.lvl)){
    var L=ENERGY[cap.lvl], ln=doseN(L.band,cap.lvl);
    return {band:L.band, n:ln, src:"you", lvl:cap.lvl, why:energyWhy(cap.lvl,ln)};
  }
  if(cap && cap.d===todayStr() && DOSE_N[cap.mode]){
    return {band:cap.mode, n:doseN(cap.mode), src:"you",
      why: cap.mode==="low" ? "You called today a rough one."
         : cap.mode==="high" ? "You asked for more today." : ""};
  }
  /* rule 1: not set today means Good */
  return {band:"normal", n:doseN("normal"), src:"default", lvl:3, why:""};
}
function setDoseState(mode,lvl){
  var t=todayStr();
  lvl=energyLvl(lvl); if(lvl) mode=ENERGY[lvl].band;
  if(!state.capLog) state.capLog=[];
  state.capLog=state.capLog.filter(function(x){ return x.d!==t; });
  if(mode==="auto" || !DOSE_N[mode]){ state.cap=null; evAdd({t:Date.now(),k:"dose",you:"auto"}); return; }
  var log={d:t, est:"normal", you:mode}, ev={t:Date.now(),k:"dose",you:mode,est:"normal"};
  if(lvl){ log.lvl=lvl; ev.lvl=lvl; }
  state.capLog.unshift(log);
  evAdd(ev);
  if(state.capLog.length>60) state.capLog.pop();
  state.cap=lvl?{d:t, mode:mode, lvl:lvl}:{d:t, mode:mode};
}
function setDose(mode,lvl){ setDoseState(mode,lvl); save(); renderAll(); }
function setEnergy(lvl){ setDose("",lvl); }
/* an open step the person marked easy */
function easyOpen(s){ return !!(s && s.easy && s.status!=="done" && s.pct<100); }
function doseMet(dz){ return dz.band==="low" && state.done.length>=dz.n; }
/* the open steps of a goal, in the order they are listed: that order is the sequence */
function subsOpen(g,taken,skip){
  var out=[];
  g.subs.forEach(function(id){
    var s=state.subs[id];
    if(!s||s.pct>=100||s.status==="done"||s.status==="blocked") return;
    if(taken&&taken[s.id]) return;
    if(skip&&skip.indexOf(s.id)>=0) return;
    out.push({s:s});
  });
  return out;
}
function bestSub(g,taken,skip){ var o=subsOpen(g,taken,skip); return o.length?o[0].s:null; }
/* rule 2's window: the last ninety minutes before the day ends */
function lateDay(me,mins){
  var w=hm((me||{}).wind||"22:30"), m=mins;
  if(w<4*60){ w+=1440; if(m<4*60) m+=1440; }
  return m>=w-90 && m<w;
}
/* why the board asks for nothing now, or "" when it may suggest a step */
function restWhy(c,dz,me){
  if(c.wound) return "Your day is over. Rest.";
  if(c.early) return "Your day starts at "+c.rise+".";
  if(dz.lvl===1) return "Your energy is very low, so nothing is needed today.";
  var bk=calBookedNow(CAL_LIST,new Date()); if(bk) return "Booked until "+bk.to+": "+bk.t+".";
  if(lateDay(me,c.now)) return "It is the last part of your day, so nothing more is needed.";
  return "";
}
/* rule 4's order of goals: nearest delivery day, then what matters most, then the list */
function goalOrder(me){
  return state.groups.map(function(g,i){
    var n=daysLeft(g), north=northHit(g,me,null);
    return {g:g, i:i, rule:n!==null?"date":north?"north":"top", key:n!==null?[0,n,i]:north?[1,0,i]:[2,0,i]};
  }).sort(function(a,b){ return a.key[0]-b.key[0] || a.key[1]-b.key[1] || a.key[2]-b.key[2]; });
}
function verdict(){
  var c=nowCtx(), me=state.me||freshMe(), dz=doseNow();
  var taken={}, skip=(state.skip&&state.skip.d===todayStr())?state.skip.ids:[], covered={};
  state.oftad.forEach(function(x){ taken[x.id]=1; covered[cardGid(x)]=1; });
  var rest=restWhy(c,dz,me);
  if(rest) return {c:c, none:true, rest:true, why:rest, blocked:[]};
  var low=dz.band==="low", best=null, next=null, blocked=[];
  goalOrder(me).forEach(function(o){
    var g=o.g;
    if(next||!g.subs.length||groupPct(g)>=100||covered[g.id]) return;
    var open=subsOpen(g,taken,skip); if(!open.length) return;
    var s2=low ? (open.filter(function(x){ return easyOpen(x.s); })[0]||{}).s : open[0].s;
    if(!s2) return;
    var f=feasible(g,c);
    if(!f.ok){ if(blocked.length<2) blocked.push({g:g,s:s2,why:f.why}); return; }
    var hit={g:g, s:s2, rule:o.rule};
    if(!best) best=hit; else next=hit;
  });
  if(!best) return {c:c, none:true, low:low, blocked:blocked};
  return {c:c, g:best.g, s:best.s, rule:best.rule, low:low, next:next, blocked:blocked};
}
/* one plain sentence that matches the rule that chose it */
function verdictWhy(v){
  var g=v.g, n=daysLeft(g), out=[];
  if(v.low) out.push("Your energy is low, and you marked this step Easy.");
  else if(v.rule==="date"){
    var left=stepsLeft(g), per=Math.ceil(left/(Math.max(n,0)+1));
    out.push(n<0 ? g.name+" is past its delivery day; this is its next step."
      : g.name+" is for "+deliveryLabel(g)+", with "+left+(left===1?" step":" steps")+" left"+(per>1?", about "+per+" a day":"")+"; this is its next step.");
  }
  else if(v.rule==="north") out.push("This is the next step of "+g.name+", which you said matters most.");
  else out.push("This is the next step of "+g.name+", the goal at the top of your list.");
  if(v.c&&v.c.atWork) out.push("It is work hours, so only work goals.");
  return out.join(" ");
}
function verdictNot(v){
  var out=[];
  (v.blocked||[]).forEach(function(b){ out.push(b.g.name+" waits: "+b.why+"."); });
  if(v.next && v.next.g && v.g && v.next.g.id!==v.g.id)
    out.push("Next after it is "+v.next.s.name+", in "+v.next.g.name+".");
  return out;
}
var I_PLANNER='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
var I_ARROW='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
function plannerIcon(){
  var u=(state.me&&state.me.icon)||"";
  return u ? '<img src="'+esc(u)+'" alt="">' : I_PLANNER;
}
function takePick(id){
  var s=state.subs[id]; if(!s) return;
  var gid=s.gid;
  state.oftad=state.oftad.filter(function(c){ return cardGid(c)!==gid; });
  var why="";
  try{ var v=verdict(); if(v && v.s && v.s.id===id) why=verdictWhy(v); }catch(e){}
  if(why.length>220) why=why.slice(0,217).replace(/\s+\S*$/,"")+"...";
  state.oftad.push({k:"sub",id:s.id,done:false,why:why,src:"pick"});
  touchHist(); save(); renderAll();
}
function skipPick(id){
  var t=todayStr();
  if(!state.skip||state.skip.d!==t) state.skip={d:t,ids:[]};
  if(state.skip.ids.indexOf(id)<0) state.skip.ids.push(id);
  var tk=Date.now();
  evAdd({t:tk,k:"skip",id:id,g:evG(id)});
  state.lastSkip={t:tk,id:id};
  save(); renderAll();
}
function touchHist(){
  var t=todayStr(), o=overall(), last=state.hist[state.hist.length-1];
  if(last&&last.d===t) last.v=o; else { state.hist.push({d:t,v:o}); if(state.hist.length>90) state.hist.shift(); }
}

