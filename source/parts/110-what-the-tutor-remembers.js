/* ---------------- what the tutor remembers, and only what you kept ----------------
   Restored 2026-10-21 (owner: "AI is the personal tutor and the
   coordinator"). The tutor keeps short notes about how the person works, so
   it knows them in the next conversation. A note comes from two places: the
   person types "remember ...", or the tutor proposes one and the person says
   Keep. Nothing is kept without that yes. Kept notes stay until the person
   removes them ("forget 2", "forget everything"). Behaviour only: no moods,
   no health, nothing about who they are. There is no side panel: the notes
   are read and removed in Talk. The board no longer proposes notes from
   patterns; that belonged to the settings removed on 2026-10-20.        */
var MEM_MAX=20;
var MEM_SENSITIVE=/\b(moods?|feel(?:ing|s)?|sad|angry|cry\w*|suicid\w*|self[- ]harm|pregnan\w*|religio\w*|politic\w*|salary|password|passcode|address|phone number|email)\b/i;
function memList(){ if(!state.mem) state.mem=[]; return state.mem; }
function memKept(){ return memList().filter(function(m){ return m.st==="kept"; }); }
function memProposed(){ return memList().filter(function(m){ return m.st==="proposed"; })[0]||null; }
function memOk(text,src){
  var t=String(text||"").replace(/\s+/g," ").trim();
  if(t.length<3) throw new Error("That is too short to keep.");
  if(t.length>140) throw new Error("Keep it to one short sentence, under 140 characters.");
  if(src!=="you" && (CHK_BAN.test(t) || MEM_SENSITIVE.test(t)))
    throw new Error("I only keep notes about how you work, not about moods, health or personal details.");
  return t;
}
function memAdd(text,src){
  var t=memOk(text,src), list=memList();
  var dup=list.filter(function(m){ return m.t.toLowerCase()===t.toLowerCase(); })[0];
  if(dup) return dup;
  if(memKept().length>=MEM_MAX) throw new Error(MEM_MAX+" notes is the limit. Forget one first.");
  var m={id:uid("m"), t:t, src:src, st:src==="you"?"kept":"proposed", d:todayStr()};
  list.push(m);
  if(m.st==="kept") evAdd({t:Date.now(),k:"mem",act:"keep",src:src});
  return m;
}
function memKeep(id){
  var m=memList().filter(function(x){ return x.id===id; })[0]; if(!m) return null;
  if(m.st!=="kept" && memKept().length>=MEM_MAX) throw new Error(MEM_MAX+" notes is the limit. Forget one first.");
  m.st="kept"; m.d=todayStr();
  evAdd({t:Date.now(),k:"mem",act:"keep",src:m.src});
  return m;
}
function memDrop(id){
  var list=memList(), i;
  for(i=0;i<list.length;i++) if(list[i].id===id){
    var m=list.splice(i,1)[0]; if(m.st==="kept") evAdd({t:Date.now(),k:"mem",act:"drop",src:m.src}); return m;
  }
  return null;
}
function memErase(){ state.mem=[]; evAdd({t:Date.now(),k:"mem",act:"erase"}); }
function memLine(m,i){ return (i+1)+". "+m.t+" ("+(m.src==="you"?"you told me":"the tutor suggested, you kept it")+")"; }
function memSay(){
  var k=memKept();
  if(!k.length) return "Nothing yet. Type remember and a short note, for example: remember I do my best work before lunch.";
  return "What I know, all of it kept by you: "+k.map(memLine).join(" ")+" Type forget and a number to remove one.";
}
