/* ---------------- derived ---------------- */
function allSubs(){ var a=[]; state.groups.forEach(function(g){ g.subs.forEach(function(id){ if(state.subs[id]) a.push(state.subs[id]); }); }); return a; }
function overall(){ var a=allSubs(); if(!a.length) return 0; var t=0; a.forEach(function(s){ t+=s.pct; }); return Math.round(t/a.length*10)/10; }
function groupPct(g){ if(!g.subs.length) return 0; var t=0; g.subs.forEach(function(id){ t+=(state.subs[id]?state.subs[id].pct:0); }); return Math.round(t/g.subs.length); }
function groupDone(g){ var n=0; g.subs.forEach(function(id){ if(state.subs[id]&&state.subs[id].pct>=100) n++; }); return n; }
function statusOf(s){
  if(s.status==="done"||s.pct>=100) return {k:"done",label:"Done"};
  if(s.status==="blocked") return {k:"block",label:"Blocked"};
  var a=ageOf(s.upd);
  if(s.pct>0 && a>=14) return {k:"risk",label:"Stalled "+a+"d"};
  if(s.status==="doing"||s.pct>0) return {k:"run",label:"Doing"};
  return {k:"idle",label:"Todo"};
}
/* The alarm. Not a list of everything imperfect: the goals whose deadline
   is closest and whose priority is highest, at the same time. Urgency is
   how near the date is; weight is what you said the goal was worth. One
   times the other, highest first.

   Each alarm carries the one subtask inside it that most wants doing, so
   pressing it lands you on the work rather than on the goal.          */
function urgency(g){
  var n=daysLeft(g);
  if(n===null) return 2;
  if(n<0) return 100;
  if(n<=3) return 50;
  if(n<=7) return 25;
  if(n<=14) return 12;
  if(n<=30) return 6;
  return 3;
}
/* which step of this goal the alarm should land you on. A blocked one is
   named first, because that is the thing stopping the goal; otherwise it is
   the same within-goal ranking the planner uses, so the alarm and the
   verdict never point at different steps of the same goal.             */
function worstIn(g){
  var stuck=null;
  g.subs.forEach(function(id){
    var x=state.subs[id];
    if(!x||x.pct>=100||x.status==="done") return;
    if(x.status==="blocked"){
      var sc=SUB_W[x.prio||"mid"]+ageOf(x.upd);
      if(!stuck||sc>stuck.sc) stuck={sc:sc,s:x};
    }
  });
  if(stuck) return stuck.s;
  return bestSub(g,null,null);
}
function alerts(){
  var out=[];
  state.groups.forEach(function(g){
    var p=groupPct(g);
    if(p>=100) return;
    var u=urgency(g), w=PRIO_W[g.prio]||2, score=u*w, n=daysLeft(g);
    var sev = score>=150 ? "crit" : (score>=50 ? "serious" : "warn");
    var sub=worstIn(g);
    out.push({
      score:score, sev:sev, gid:g.id, sid:sub?sub.id:"",
      kind:(n!==null&&n<0)?"Overdue":(g.prio==="high"?"High":"Goal"),
      t:g.name,
      w:(n!==null?dueLabel(g):"no deadline set")+" \u00b7 "+(g.prio==="high"?"high":g.prio==="low"?"low":"middle")+
        " priority \u00b7 "+p+"%"+(sub?" \u00b7 next: "+sub.name:"")
    });
  });
  out.sort(function(x,y){ return y.score-x.score; });
  return out;
}
