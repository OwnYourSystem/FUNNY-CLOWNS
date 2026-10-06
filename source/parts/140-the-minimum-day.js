/* ---------------- the minimum day ----------------
   A few things, in the person's own words, that count even when nothing else
   moves: the floor under a low day. Up to four, because the note that asked for
   it names four kinds (looking after the body, one thing you owe someone, a small
   step on something you are growing, one way you recover) and the person decides
   which, if any. Each is a tap for today. A day is "met" when every one is
   ticked. The board never decides what they are, never ticks one for the person,
   and never counts a day it was not opened as a failure: it only says how many of
   the last 14 days were met. The event log records a tick by anchor id, never
   the words.                                                               */
var FLOOR_MAX=4, FLOOR_LEN=60, FLOOR_KEEP=60;
function floorState(){
  if(!state.floor) state.floor={items:[],log:{}};
  if(!state.floor.items) state.floor.items=[];
  if(!state.floor.log) state.floor.log={};
  return state.floor;
}
function floorToday(){
  var f=floorState(), d=f.log[todayStr()], ids=f.items.map(function(x){ return x.id; });
  return (d&&d.d||[]).filter(function(id){ return ids.indexOf(id)>=0; });
}
function floorMet(){ var f=floorState(); return f.items.length>0 && floorToday().length===f.items.length; }
function floorSet(texts){
  var f=floorState(), seen={}, out=[];
  texts.forEach(function(raw){
    var t=String(raw||"").replace(/\s+/g," ").trim();
    if(!t) return;
    if(t.length>FLOOR_LEN) throw new Error("Keep each one under "+FLOOR_LEN+" characters.");
    var k=t.toLowerCase(); if(seen[k]) return; seen[k]=1;
    var old=f.items.filter(function(x){ return x.t.toLowerCase()===k; })[0];
    out.push(old?{id:old.id,t:t}:{id:uid("f"),t:t});
  });
  if(out.length>FLOOR_MAX) throw new Error("Up to "+FLOOR_MAX+" is enough for a floor.");
  f.items=out;
  evAdd({t:Date.now(),k:"floor",act:"set"});
  floorTouch();
  return out.length;
}
/* keep today's record in step with the list, and drop old days */
function floorTouch(){
  var f=floorState(), t=todayStr(), e=f.log[t];
  if(e){ e.n=f.items.length; e.d=e.d.filter(function(id){ return f.items.some(function(x){ return x.id===id; }); }); }
  var keep=addDays(t,-FLOOR_KEEP); Object.keys(f.log).forEach(function(d){ if(d<keep) delete f.log[d]; });
}
function floorToggle(id){
  var f=floorState(), t=todayStr();
  if(!f.items.some(function(x){ return x.id===id; })) throw new Error("That is not on your minimum day.");
  var e=f.log[t]; if(!e) e=f.log[t]={d:[],n:f.items.length};
  var at=e.d.indexOf(id), on=at<0;
  if(on) e.d.push(id); else e.d.splice(at,1);
  e.n=f.items.length;
  evAdd({t:Date.now(),k:"floor",id:id,act:on?"on":"off"});
  floorTouch();
  return on;
}
/* days in the last N (today included) on which every anchor was ticked */
function floorDays(n){
  var f=floorState(), t=todayStr(), met=0, seen=0, i, e;
  for(i=0;i<n;i++){
    e=f.log[addDays(t,-i)];
    if(!e) continue;
    seen++;
    if(e.n>0 && e.d.length>=e.n) met++;
  }
  return {met:met, seen:seen};
}
function floorAsk(){
  var f=floorState(), fields=[], i, ph=["Something for my body (a meal, water, a walk)","One thing I owe someone","Five minutes on something I am growing","One way I recover"];
  for(i=0;i<FLOOR_MAX;i++) fields.push({k:"a"+i,label:"Anchor "+(i+1),kind:"text",value:f.items[i]?f.items[i].t:"",ph:ph[i]});
  askUser({title:"Your minimum day",
    body:["The few things that count even when nothing else moves. On a low day, these are enough.",
      "Use your own words. Up to "+FLOOR_MAX+", each one small enough to do on your worst day. Leave a box empty to drop it, or leave all empty to switch this off."],
    fields:fields, ok:"Save", cancel:"Not now",
    check:function(v){
      var long_=Object.keys(v).filter(function(k){ return v[k].trim().length>FLOOR_LEN; }).length;
      return long_ ? "Keep each one under "+FLOOR_LEN+" characters." : "";
    }}).then(function(v){
    if(!v) return;
    try{ floorSet(Object.keys(v).sort().map(function(k){ return v[k]; })); }catch(er){ toast("Minimum day",er.message); }
    save(); renderAll();
  });
}

