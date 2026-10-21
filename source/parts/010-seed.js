(function(){
"use strict";

/* ===============================================================
   SEED  —  what a new board starts with: nothing.
   Up to revision 6 this list held the owner's own goals, and every new
   board got them (flaw 13, 2026-10-21). A new board now starts empty and
   the first-goal screen offers examples instead. Bump SEED_REV whenever
   this list changes. On load the board adds what is new and NEVER
   overwrites progress, status or anything you have edited yourself.
================================================================*/
var SEED_REV = 7;
var RETIRED = ["tch","enb"];   /* withdrawn; a group goes only if it ends up empty */
var SEED=[];

/* The ids those old goals and steps had. Ids only: the names are gone from
   the app. Every id the app makes itself is 7 characters or more, so these
   2 to 4 character ids can only ever be the old seed. */
var OLD_SEED=[
 "svc","svc1","vgd","vg1","vg2","vg3","vg4","vg5","vg6","vg7","vg8","vg9","tc1","llm","ll7","ll1",
 "ll2","ll3","ll4","ll5","ll6","ll8","sap","sp1","sp2","sp3","sp4","sp5","sp6","sp7","en1","en3",
 "ofm","of1","of2","grs","gs1","gs2","gs3","gs4","alc","al5","al1","al3","al4","al2","aut","au1",
 "au4","au2","au3","au5","svc2","au7","ppm","pp1","anb","an1","en2","apd","ap1","ap2","ap3","ap4",
 "ap5","ap6","oys","oy1","oy2","oy3","oy4","tcs","tc9","tc8","shr","sh1","sh2","sh3","sh4","bks",
 "bk1","bk2","bk3","tch","enb"];
/* Takes the old seed out of one board, once. A goal or step the person
   renamed is theirs and stays. A seed goal that holds steps of their own
   stays too, under a plain name, so their steps keep a home. Notes the board
   learned about an old step go with it. Returns how many things went. */
function unseedBoard(st){
  if(!st || st.unseeded) return 0;
  var ids={}, ue=st.ue||{}, gone=0;
  OLD_SEED.forEach(function(id){ ids[id]=1; });
  function own(id){ return !!ue[id+"|name"]; }
  var subs=st.subs||{};
  Object.keys(subs).forEach(function(id){ if(ids[id] && !own(id)){ delete subs[id]; gone++; } });
  function keepGoal(g){
    if(!g || !ids[g.id]) return true;
    g.subs=(g.subs||[]).filter(function(s){ return !!subs[s]; });
    if(own(g.id)) return true;
    if(g.subs.length){ g.name="My goal"; return true; }
    gone++; return false;
  }
  function trim(g){ if(g && g.subs) g.subs=g.subs.filter(function(s){ return !!subs[s]; }); return g; }
  st.groups=(st.groups||[]).filter(keepGoal).map(trim);
  st.archive=(st.archive||[]).filter(keepGoal).map(trim);
  st.backlog=(st.backlog||[]).filter(function(b){
    if(!b.goal) return true;
    var k=keepGoal(b.goal); trim(b.goal);
    if(k && ids[b.goal.id] && !own(b.goal.id)) b.t=b.goal.name;
    return k;
  });
  ["oftad","plan","done"].forEach(function(z){
    st[z]=(st[z]||[]).filter(function(c){ return !ids[c.id] || !!subs[c.id]; });
  });
  if(st.mem) st.mem=st.mem.filter(function(m){ return !(m.key && /^skip-/.test(m.key) && ids[m.key.slice(5)] && !subs[m.key.slice(5)]); });
  if(st.memNo) Object.keys(st.memNo).forEach(function(k){ if(/^skip-/.test(k) && ids[k.slice(5)] && !subs[k.slice(5)]) delete st.memNo[k]; });
  if(st.sel && ids[st.sel] && !st.groups.some(function(g){ return g.id===st.sel; })) st.sel=st.groups.length?st.groups[0].id:"";
  /* a device that had pushed to an account forgets when, so signing in again
     weighs both copies instead of pushing this cleaned one over the account */
  if(gone) st.syncedAt=0;
  st.unseeded=1;
  return gone;
}

var KEY="oys-min-deliveries-v1";
var STATUSES=[["todo","Todo"],["doing","Doing"],["blocked","Blocked"],["done","Done"]];
var REPEATS=[["","Once"],["daily","Daily"],["weekdays","Weekdays"],["weekly","Weekly"],
             ["biweekly","Every 2 weeks"],["monthly","Monthly"]];
function repLabel(r){
  for(var i=0;i<REPEATS.length;i++) if(REPEATS[i][0]===r) return REPEATS[i][1];
  return "Once";
}
/* The period a recurring subtask is currently in. "" means it is not due
   today at all, which is how weekdays skips the weekend. */
function periodKey(r,d){
  d=d||new Date();
  if(r==="daily") return dstr(d);
  if(r==="weekdays"){ var w=d.getDay(); return (w===0||w===6)?"":dstr(d); }
  if(r==="weekly") return d.getFullYear()+"-W"+pad2(weekNo(d));
  if(r==="biweekly") return d.getFullYear()+"-B"+pad2(Math.floor(weekNo(d)/2));
  if(r==="monthly") return d.getFullYear()+"-"+pad2(d.getMonth()+1);
  return "";
}
/* Opening a new period closes the last one: a period finished lengthens the
   streak, a period missed ends it, and either way the task comes back clean. */
function rollRecurring(){
  var due=[];
  allSubs().forEach(function(sb){
    if(!sb.rep) return;
    var key=periodKey(sb.rep);
    if(!key || sb.period===key) return;
    if(sb.period){
      if(sb.pct>=100||sb.status==="done"){
        sb.streak=(sb.streak||0)+1;
        sb.best=Math.max(sb.best||0,sb.streak);
      } else sb.streak=0;
    }
    sb.period=key; sb.pct=0; sb.status="todo"; sb.upd=todayStr();
    due.push(sb);
  });
  if(due.length){
    due.forEach(function(sb){
      if(!state.plan.some(function(c){ return c.id===sb.id; }) &&
         !state.oftad.some(function(c){ return c.id===sb.id; }))
        state.plan.push({k:"sub",id:sb.id,done:false});
    });
    save();
  }
  return due;
}

