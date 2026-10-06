/* ---------------- two rankings, kept apart ----------------
   Goals are compared with goals and subtasks with their own siblings. A
   subtask marked high inside a quiet goal must not drag that goal past one
   that is overdue, so nothing below the goalScore line is ever read when
   two goals are being weighed, and nothing above it when two subtasks are.
                                                                        */
function goalAge(g){
  var best=null;
  g.subs.forEach(function(id){
    var x=state.subs[id]; if(!x) return;
    var a=ageOf(x.upd); if(best===null||a<best) best=a;
  });
  return best===null?0:best;
}
/* cross-goal only: the deadline, the flag on the goal, how far behind it is
   and how long since anything in it moved at all */
/* The dose. How much today can carry, worked out from what the board
   already knows, so nobody has to report a mood each morning. It reads the
   last three days that had a plan, done over planned: under 40% is a low
   day. Two "rough day" taps in the last three days say the same, and two
   "more" taps lift it. One tap today overrides the guess, and the tap is
   kept beside what the board guessed, because that gap is what there is to
   learn from. With no history it says nothing, and the board behaves
   exactly as it did before. A low day shrinks the dose, never the list:
   an overdue goal stays on the board, it just stops shouting.          */
var DOSE_N={low:1,normal:3,high:5};
/* a normal day is 3 until the person keeps a finding that says otherwise */
function doseN(band){
  var n=Math.round(+(state.me&&state.me.normalN))||DOSE_N.normal;
  return band==="low" ? DOSE_N.low : band==="high" ? n+2 : n;
}
function doseEstimate(){
  var t=todayStr();
  var days=(state.dayLog||[]).filter(function(d){ return d.planned>0 && ageOf(d.d)<=7; }).slice(0,3);
  var lows=0, highs=0;
  (state.capLog||[]).forEach(function(x){
    if(x.d===t || ageOf(x.d)>3) return;
    if(x.you==="low") lows++; else if(x.you==="high") highs++;
  });
  if(lows>=2) return {band:"low", n:doseN("low"), src:"auto",
    why:"You called "+lows+" of the last 3 days rough, so today starts light."};
  if(days.length>=2){
    var dn=0, pl=0; days.forEach(function(d){ dn+=d.done; pl+=d.planned; });
    if(pl && dn/pl<0.4) return {band:"low", n:doseN("low"), src:"auto",
      why:"The last "+days.length+" days landed "+dn+" of "+pl+", so today is sized to one thing."};
  }
  if(highs>=2) return {band:"high", n:doseN("high"), src:"auto",
    why:"You asked for more on "+highs+" of the last 3 days."};
  var dow=new Date().getDay(), lt=state.me&&state.me.lightDays;
  if(lt && lt.indexOf(dow)>=0) return {band:"low", n:doseN("low"), src:"auto",
    why:DAYNAME[dow]+"s have been your lightest day, so today starts light."};
  return {band:"normal", n:doseN("normal"), src:"auto", why:""};
}
function doseNow(){
  var cap=state.cap;
  if(cap && cap.d===todayStr() && DOSE_N[cap.mode]){
    return {band:cap.mode, n:doseN(cap.mode), src:"you",
      why: cap.mode==="low" ? "You called today a rough one."
         : cap.mode==="high" ? "You asked for more today." : ""};
  }
  return doseEstimate();
}
function setDoseState(mode){
  var t=todayStr();
  if(!state.capLog) state.capLog=[];
  state.capLog=state.capLog.filter(function(x){ return x.d!==t; });
  if(mode==="auto" || !DOSE_N[mode]){ state.cap=null; evAdd({t:Date.now(),k:"dose",you:"auto"}); return; }
  state.capLog.unshift({d:t, est:doseEstimate().band, you:mode});
  evAdd({t:Date.now(),k:"dose",you:mode,est:doseEstimate().band});
  if(state.capLog.length>60) state.capLog.pop();
  state.cap={d:t, mode:mode};
}
function setDose(mode){ setDoseState(mode); save(); renderAll(); }
function doseMet(dz){ return dz.band==="low" && state.done.length>=dz.n; }
/* which of the quiet overrides to offer. The board asks nothing; these
   only exist for when it guessed wrong.                              */
function doseBtns(dz){
  var b=[];
  if(dz.band==="normal" && dz.src==="auto") return [["low","Rough day"]];
  if(dz.band!=="low") b.push(["low","Rough day"]);
  if(dz.band==="low") b.push(["high","More"]);
  if(dz.src==="you") b.push(["auto","Back to auto"]);
  else if(dz.band==="low") b.push(["normal","Not a rough day"]);
  return b;
}
function doseBtnHTML(dz){
  return doseBtns(dz).map(function(x){
    return '<button class="btn" data-dose="'+x[0]+'">'+x[1]+'</button>'; }).join("");
}
function goalScore(g,c,me){
  var low=doseNow().band==="low";
  var u=urgency(g), w=PRIO_W[g.prio]||2;
  if(low && u>25) u=25;                     /* a low day shrinks the dose, not the list */
  var sc = u*w*0.55 + (100-groupPct(g))*0.30 + Math.min(goalAge(g),30)*0.8;
  var started=false;
  g.subs.forEach(function(id){ var x=state.subs[id]; if(x&&x.pct>0&&x.pct<100) started=true; });
  if(started) sc+=low?30:12;                /* finishing beats starting */
  if(me.sharp===c.slot && (g.prio==="high"||u>=50)) sc+=30;
  if(g.where==="body" && c.free) sc+=38;
  if(g.where==="work" && c.atWork) sc+=30;
  if(g.where==="home" && c.free && !c.wound) sc+=14;
  return sc;
}
/* within-goal only: which step of this goal, now */
function subScore(s,g,moving){
  var sc = SUB_W[s.prio||"mid"] + Math.min(ageOf(s.upd),30)*0.8;
  var low=doseNow().band==="low";
  sc += (low?Math.min(urgency(s),25):urgency(s))*0.5;   /* its own deadline, not the goal's */
  if(s.rep && periodKey(s.rep)) sc+=55;     /* a habit due today still wins */
  if(s.pct>0&&s.pct<100) sc+=low?40:22;
  if(moving===1&&s.pct>0) sc+=18;
  return sc;
}
function subsOpen(g,taken,skip){
  var out=[], moving=0;
  g.subs.forEach(function(id){ var x=state.subs[id]; if(x&&x.pct>0&&x.pct<100) moving++; });
  g.subs.forEach(function(id){
    var s=state.subs[id];
    if(!s||s.pct>=100||s.status==="done"||s.status==="blocked") return;
    if(taken&&taken[s.id]) return;
    if(skip&&skip.indexOf(s.id)>=0) return;
    out.push({s:s, sc:subScore(s,g,moving)});
  });
  out.sort(function(a,b){ return b.sc-a.sc; });
  return out;
}
function bestSub(g,taken,skip){ var o=subsOpen(g,taken,skip); return o.length?o[0].s:null; }
function verdict(){
  var c=nowCtx(), me=state.me||freshMe();
  var taken={}, skip=(state.skip&&state.skip.d===todayStr())?state.skip.ids:[];
  var covered={};
  state.oftad.forEach(function(x){ taken[x.id]=1; covered[cardGid(x)]=1; });
  var best=null, blocked=[], soft=null;
  state.groups.forEach(function(g){
    if(!g.subs.length||groupPct(g)>=100) return;
    if(covered[g.id]) return;               /* Today holds one step per goal, so suggest from another goal */
    var s2=bestSub(g,taken,skip);
    if(!s2) return;                          /* nothing left in it to do */
    var f=feasible(g,c), sc=goalScore(g,c,me);
    if(!f.ok){
      if(!blocked.length||sc>blocked[0].sc) blocked.unshift({sc:sc,g:g,s:s2,why:f.why});
      return;
    }
    if(f.soft) sc*=0.55;
    /* The one line the person typed as what matters most is an override,
       not a nudge. A flat bonus lost to anything already at 45%, which is
       the board arguing with a decision that was already made. It still
       cannot beat a veto: what is impossible this hour stays impossible. */
    if(northHit(g,me,s2)) sc=sc*1.5+70;
    if(!best||sc>best.sc){ if(best) soft=best; best={sc:sc,g:g,s:s2,soft:f.soft,sw:f.why}; }
    else if(!soft||sc>soft.sc) soft={sc:sc,g:g,s:s2};
  });
  if(!best) return {c:c, none:true, blocked:blocked};
  return {c:c, g:best.g, s:best.s, soft:best.soft, sw:best.sw, next:soft,
          blocked:blocked.filter(function(b,i){ return i<2; })};
}
/* The sentence that has to earn the interruption. Concrete: the hour, the
   day, the number of days, the percentage. No encouragement.           */
function verdictWhy(v){
  var g=v.g, s=v.s, c=v.c, n=daysLeft(g), a=ageOf(s.upd), out=[];
  out.push("It is "+pad2(c.d.getHours())+":"+pad2(c.d.getMinutes())+" on a "+c.day+
    (c.away ? " and you are out until about "+c.home
            : c.wound ? " and your day is meant to be over"
                      : " and your time is your own")+".");
  if(s.rep && periodKey(s.rep))
    out.push(repLabel(s.rep)+", and today is not done"+(s.streak?". You are "+s.streak+" in a row":"")+".");
  else if(n!==null&&n<0)
    out.push(g.name+" is "+Math.abs(n)+" days past its deadline at "+groupPct(g)+"%.");
  else if(n!==null&&n<=7)
    out.push(g.name+" is "+dueLabel(g)+" at "+groupPct(g)+"%"+
      (g.prio==="high"?", and you called it high priority":"")+".");
  else if(a>=14&&s.pct>0)
    out.push("Nothing in "+g.name+" has moved in "+a+" days, and this part is already at "+s.pct+"%.");
  else if(s.pct>0)
    out.push("It sits at "+s.pct+"% in "+g.name+". Finishing beats starting.");
  else
    out.push(g.name+" is at "+groupPct(g)+"% and this is its first step.");
  if(northHit(g,state.me,s)) out.push("It is also the thing you said matters most.");
  var dz=doseNow();
  if(dz.band==="low") out.push(dz.why+" Do the smallest version of it, five minutes, then stop.");
  else if(dz.band==="high") out.push(dz.why+" Do not borrow from tomorrow.");
  if(v.soft&&v.sw) out.push("Mind that "+v.sw+". Keep it short.");
  return out.join(" ");
}
function verdictNot(v){
  var out=[];
  (v.blocked||[]).forEach(function(b){
    out.push(b.g.name+" is louder, and it waits: "+b.why+".");
  });
  if(!out.length && v.next && v.next.g && v.next.g.id!==v.g.id)
    out.push("Next after it is "+v.next.s.name+", in "+v.next.g.name+". Not now.");
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

