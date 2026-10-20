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
/* Sequence, not deadlines (owner, 2026-10-20). A goal has at most one
   delivery day, and its steps are done in the order they are listed. How
   hard a goal pulls is its pace: the steps still open over the days left,
   so four steps and four days pull as much as one step due today. It never
   climbs past 50, and a delivery day that has passed does not shout: it
   pulls a little and the person is asked for a new day.               */
function stepsLeft(g){ var n=0; g.subs.forEach(function(id){ var x=state.subs[id]; if(x&&x.pct<100&&x.status!=="done") n++; }); return n; }
function urgency(g){
  var n=daysLeft(g);
  if(n===null) return 2;
  if(n<0) return 6;
  var left=g.subs?stepsLeft(g):1;
  return clamp(Math.round(left/(n+1)*25),3,50);
}
function missedDelivery(g){ var n=daysLeft(g); return n!==null && n<0 && groupPct(g)<100; }
/* the delivery day in words: "Friday" this week, "24 Oct" after it */
function deliveryLabel(g){
  var n=daysLeft(g); if(n===null) return "";
  if(n<0) return "its delivery day has passed";
  if(n===0) return "today";
  if(n===1) return "tomorrow";
  var d=new Date(g.due+"T00:00:00");
  return n<7 ? DAYNAME[d.getDay()] : d.getDate()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
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
/* Delivery days, nearest first (2026-10-20: sequence, not deadlines). Only
   goals with a delivery day are listed, each with the pace that keeps it on
   time and the step it would land on. A day that has passed is listed as a
   question for the person, never as an alarm: nothing here is ever "crit". */
function alerts(){
  var out=[];
  state.groups.forEach(function(g){
    var p=groupPct(g), n=daysLeft(g);
    if(p>=100 || n===null) return;
    var u=urgency(g), w=PRIO_W[g.prio]||2, sub=worstIn(g), left=stepsLeft(g), per=Math.ceil(left/(Math.max(n,0)+1));
    out.push({
      score:u*w, n:n, sev:n<0?"missed":(per>1?"serious":"warn"), gid:g.id, sid:sub?sub.id:"",
      kind:n<0?"Passed":"Delivery",
      t:g.name,
      w:(n<0 ? "its delivery day has passed \u00b7 pick a new day when you are ready"
             : "for "+deliveryLabel(g)+" \u00b7 "+left+(left===1?" step":" steps")+" left"+(per>1?", about "+per+" a day":", one a day keeps it on pace"))+
        " \u00b7 "+p+"%"+(sub?" \u00b7 next: "+sub.name:"")
    });
  });
  out.sort(function(x,y){ return x.n-y.n || y.score-x.score; });
  return out;
}
