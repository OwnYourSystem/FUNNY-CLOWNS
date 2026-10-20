/* ---------------- my easy things (2026-10-20) ----------------
   Was "the minimum day". The person's own list of what they do when energy
   is low (reading before sleep, an audiobook, a walk). When energy is very
   low or the day is ending, the board shows these instead of a task (rule
   2), and on a low day they come first (rule 3). Ticking one counts the
   day. The board never decides what they are and never ticks one itself.
   The event log records a tick by id, never the words.                 */
var FLOOR_MAX=6, FLOOR_LEN=60, FLOOR_KEEP=60;
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
/* one easy thing is enough to count the day */
function floorMet(){ var f=floorState(); return f.items.length>0 && floorToday().length>0; }
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
  if(out.length>FLOOR_MAX) throw new Error("Up to "+FLOOR_MAX+" easy things.");
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
  if(!f.items.some(function(x){ return x.id===id; })) throw new Error("That is not one of your easy things.");
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
    if(e.n>0 && e.d.length>0) met++;
  }
  return {met:met, seen:seen};
}
function floorAsk(){
  var f=floorState(), fields=[], i, ph=["Listen to an audiobook","Read before sleep","A short walk","Call someone I like","Stretch for ten minutes","Tidy one small thing"];
  for(i=0;i<FLOOR_MAX;i++) fields.push({k:"a"+i,label:"Easy thing "+(i+1),kind:"text",value:f.items[i]?f.items[i].t:"",ph:ph[i]});
  askUser({title:"My easy things",
    body:["What do you do when your energy is low? When it is very low, or your day is ending, the board shows these instead of a task. One of them counts the day.",
      "Use your own words, up to "+FLOOR_MAX+". Leave a box empty to drop it."],
    fields:fields, ok:"Save", cancel:"Not now",
    check:function(v){
      var long_=Object.keys(v).filter(function(k){ return v[k].trim().length>FLOOR_LEN; }).length;
      return long_ ? "Keep each one under "+FLOOR_LEN+" characters." : "";
    }}).then(function(v){
    if(!v) return;
    try{ floorSet(Object.keys(v).sort().map(function(k){ return v[k]; })); }catch(er){ toast("My easy things",er.message); }
    save(); renderAll(); if(typeof PH_ON!=="undefined"&&PH_ON){ PH_DRAWN=""; phRender(); }
  });
}

