/* ---------------- when I will do it, and about how long ----------------
   Two optional notes on a step, both the person's own words and numbers.
   "When" is a moment you will notice (after the coffee, when you sit down at
   your desk); the board shows it beside the step and does not remind you, and
   it lapses when the step is done or after 14 days. "How long" is a guess in
   minutes. When a step with a guess is finished the board asks, once and
   quietly, how long it really took. From 5 such pairs it can say how your
   guesses compare with what happened, in your own numbers, and it says nothing
   about anyone else's. No study is cited for either: they are plain features.
   The event log records that one was set, never the words or the minutes.  */
var WHEN_MAX=12, WHEN_KEEP=14, EST_PAIRS=30, EST_NEED=5;
function whenMap(){ if(!state.when) state.when={}; return state.when; }
function whenTidy(){
  var m=whenMap(), floor=addDays(todayStr(),-WHEN_KEEP), ch=false;
  Object.keys(m).forEach(function(id){
    var sb=state.subs[id];
    if(!sb || sb.pct>=100 || sb.status==="done" || m[id].d<floor){ delete m[id]; ch=true; }
  });
  return ch;
}
function whenSet(id,text){
  var sb=state.subs[id]; if(!sb) throw new Error("That step is not on the board.");
  var t=String(text||"").replace(/\s+/g," ").trim(), m=whenMap();
  if(t.length>80) throw new Error("Keep it under 80 characters.");
  if(!t){ if(m[id]){ delete m[id]; evAdd({t:Date.now(),k:"when",id:id,act:"clear"}); } return ""; }
  var ids=Object.keys(m);
  if(!m[id] && ids.length>=WHEN_MAX){
    ids.sort(function(a,b){ return m[a].d<m[b].d?-1:1; }); delete m[ids[0]];
  }
  m[id]={t:t,d:todayStr()};
  evAdd({t:Date.now(),k:"when",id:id,act:"set"});
  return t;
}
function whenAsk(id){
  var sb=state.subs[id]; if(!sb) return;
  var cur=whenMap()[id];
  askUser({title:cur?"Change when":"When will you do this step?",
    body:["Step: "+sb.name,"Pick a moment you will notice, such as after your coffee or when you sit down at your desk."+(cur?" Leave it empty to remove it.":"")],
    fields:[{k:"t",label:"When",kind:"text",value:cur?cur.t:"",ph:"After I pour my coffee"}],
    ok:"Save", cancel:"Not now",
    check:function(v){ return v.t.trim().length>80 ? "Keep it under 80 characters." : ""; }}).then(function(v){
    if(!v) return;
    try{ whenSet(id,v.t); }catch(er){ toast("When",er.message); }
    save(); renderAll();
  });
}
function estState(){
  if(!state.est) state.est={items:{},pairs:[],ask:null};
  if(!state.est.items) state.est.items={};
  if(!state.est.pairs) state.est.pairs=[];
  return state.est;
}
function estTidy(){
  var x=estState(), floor=addDays(todayStr(),-30), ch=false;
  Object.keys(x.items).forEach(function(id){
    if(!state.subs[id] || x.items[id].d<floor){ delete x.items[id]; ch=true; }
  });
  if(x.ask && !state.subs[x.ask]){ x.ask=null; ch=true; }
  return ch;
}
function estSet(id,minutes){
  var sb=state.subs[id]; if(!sb) throw new Error("That step is not on the board.");
  var n=Math.round(+minutes), x=estState();
  if(!(n>=1 && n<=600)) throw new Error("Give a whole number of minutes from 1 to 600.");
  x.items[id]={m:n,d:todayStr()};
  evAdd({t:Date.now(),k:"est",id:id,act:"set"});
  return n;
}
/* a step that has a guess was just finished: ask about it once, if nothing else is waiting */
function estOnDone(id){
  var x=estState();
  if(x.items[id] && !x.ask) x.ask=id;
}
function estAnswer(minutes){
  var x=estState(), id=x.ask, it=id&&x.items[id];
  var n=Math.round(+minutes);
  if(!it) throw new Error("There is nothing waiting for an answer.");
  if(!(n>=1 && n<=1440)) throw new Error("Give a whole number of minutes from 1 to 1440.");
  x.pairs.push({m:it.m, a:n, d:todayStr()});
  if(x.pairs.length>EST_PAIRS) x.pairs.splice(0,x.pairs.length-EST_PAIRS);
  delete x.items[id]; x.ask=null;
  evAdd({t:Date.now(),k:"est",id:id,act:"actual"});
}
function estSkipAsk(){ var x=estState(); if(x.ask){ delete x.items[x.ask]; x.ask=null; } }
/* the middle of the ratios between what happened and what you guessed */
function estRatio(){
  var p=estState().pairs, n=p.length;
  if(n<EST_NEED) return {n:n, ratio:null};
  var r=p.map(function(q){ return q.a/q.m; }).sort(function(a,b){ return a-b; });
  var mid=n%2 ? r[(n-1)/2] : (r[n/2-1]+r[n/2])/2;
  return {n:n, ratio:Math.round(mid*10)/10};
}
function estCompareLine(m){
  var r=estRatio();
  if(r.ratio===null)
    return r.n ? "So far "+r.n+" finished step"+(r.n===1?"":"s")+" with a guess. At "+EST_NEED+" the board can tell you how your guesses compare with what happened."
               : "After "+EST_NEED+" steps with a guess and a result, the board can tell you how your guesses compare with what happened.";
  var like=Math.max(1,Math.round(m*r.ratio/5)*5);
  return "Over your last "+r.n+" steps, what happened was about "+r.ratio+" times your guess"+(m?", so a guess of "+m+" minutes has meant about "+like:"")+". That is your own record, not anyone else's.";
}
function estAsk(id){
  var sb=state.subs[id]; if(!sb) return;
  var cur=estState().items[id];
  askUser({title:cur?"Change your guess":"About how long?",
    body:["Step: "+sb.name,"A guess is fine, in minutes.",estCompareLine(cur?cur.m:0)],
    fields:[{k:"m",label:"Minutes",kind:"number",value:cur?cur.m:"",min:1,max:600,ph:"25"}],
    ok:"Save", cancel:"Not now",
    check:function(v){ var n=+v.m; return (v.m!=="" && !(n>=1&&n<=600&&Math.round(n)===n)) ? "Give a whole number of minutes from 1 to 600." : (v.m===""?"Give a number of minutes, or press Not now.":""); }}).then(function(v){
    if(!v) return;
    try{ estSet(id,v.m); }catch(er){ toast("How long",er.message); }
    save(); renderAll();
  });
}
function estLog(){
  var x=estState(), id=x.ask, it=id&&x.items[id], sb=id&&state.subs[id]; if(!it||!sb) return;
  askUser({title:"How long did it take?", body:["Step: "+sb.name,"You guessed "+it.m+" minutes."],
    fields:[{k:"a",label:"Minutes",kind:"number",min:1,max:1440,ph:String(it.m)}],
    ok:"Save", cancel:"Not now",
    check:function(v){ var n=+v.a; return !(v.a!=="" && n>=1&&n<=1440&&Math.round(n)===n) ? "Give a whole number of minutes from 1 to 1440." : ""; }}).then(function(v){
    if(!v) return;
    try{ estAnswer(v.a); }catch(er){ toast("How long",er.message); }
    save(); renderAll();
  });
}
function planLineHTML(id){
  var w=whenMap()[id], e=estState().items[id], bits=[];
  if(w) bits.push("When: <i>"+esc(w.t)+"</i>");
  if(e){
    var r=estRatio(), like=r.ratio?Math.max(1,Math.round(e.m*r.ratio/5)*5):0;
    bits.push("About <i>"+e.m+" min</i>"+(r.ratio&&like!==e.m?" (yours usually run "+r.ratio+" times the guess, so nearer "+like+")":""));
  }
  return bits.length?'<div class="now-plan">'+bits.join(" &middot; ")+'</div>':"";
}

