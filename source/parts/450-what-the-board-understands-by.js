/* ---------------- what the board understands by itself ----------------
   The assistant has to work with nothing behind it: no model, no network, no
   key. So the board parses its own commands and runs the same tools the
   assistant would have called. Claude is asked only for a sentence that
   is not one of them, and only where Claude is reachable at all.      */
var NUMWORD={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,forty:40,fourty:40,fifty:50,
  sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,half:50,quarter:25};
var FILLER=/^(ok(ay)?|hey|hi|so|well|um+|uh+|please|now|just|can you|could you|would you|i want to|i'd like to|i would like to|let's|lets|board|tutor)\b[,\s]*/;

/* A few spellings put in one shape before anything reads the words. */
var SLIPS=[
  [/\bsub\s+task\b/gi,"subtask"],
  [/\bpercentage?\b/gi,"percent"],
  [/\bhundred\s+percent\b/gi,"100 percent"]
];
function spoken(s){
  var d=String(s||"").replace(/’/g,"'");
  d=d.replace(/per\s*cent/gi,"percent").replace(/percentage/gi,"percent");
  d=d.replace(/[.!?]+\s*$/,"").replace(/\s+/g," ").trim();
  SLIPS.forEach(function(r){ d=d.replace(r[0],r[1]); });
  d=d.replace(/\s+/g," ");
  for(var k=0;k<3;k++) d=d.replace(new RegExp(FILLER.source,"i"),"");
  d=d.trim();
  return {q:d.toLowerCase(), d:d};
}
/* a name the person has just invented keeps the capitals they said it with */
var SPOKE={q:"",d:""};
function asTyped(frag){
  var i=SPOKE.q.indexOf(frag);
  return (i<0?frag:SPOKE.d.substr(i,frag.length)).trim();
}
function numOf(w){
  if(w==null) return NaN;
  w=String(w).trim().toLowerCase();
  if(/^\d+$/.test(w)) return parseInt(w,10);
  if(w in NUMWORD) return NUMWORD[w];
  var m=w.match(/^(twenty|thirty|forty|fourty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)$/);
  if(m) return NUMWORD[m[1]]+NUMWORD[m[2]];
  return NaN;
}
/* a name is rarely typed exactly, so fall back to word overlap */
var GLUE={the:1,and:1,for:1,with:1,from:1,that:1,this:1,into:1,onto:1,you:1,are:1,was:1,
  its:1,our:1,new:1,all:1,any:1,one:1,two:1,get:1,set:1,put:1,task:1,subtask:1};
function overlap(q,name){
  var w=q.toLowerCase().split(/[^a-z0-9]+/).filter(function(x){ return x.length>2&&!GLUE[x]; });
  if(!w.length) return 0;
  var n=name.toLowerCase(), hit=0;
  w.forEach(function(x){ if(n.indexOf(x)>=0) hit++; });
  return hit/w.length;
}
function loose(q,list,get){
  var best=null, bs=0;
  list.forEach(function(it){
    var s=overlap(q,get(it));
    if(s>bs){ bs=s; best=it; }
  });
  return bs>=0.6?best:null;
}
/* "done with it" has to mean the task you just named */
var LASTSUB="";
function fuzSub(q){
  q=String(q||"").trim();
  if(/^(it|that|this|the same|the task|them|those)$/i.test(q)){
    if(LASTSUB){ try{ return botFindSub(LASTSUB); }catch(e){} }
    throw new Error("Name the task. I do not know yet which one you mean.");
  }
  var hit=null;
  try{ hit=botFindSub(q); }
  catch(e){
    hit=loose(q,allSubs(),function(x){ return x.name; });
    if(!hit) throw e;
  }
  LASTSUB=hit.name;
  return hit;
}
function fuzGroup(q){
  try{ return botFindGroup(q); }
  catch(e){
    var f=loose(q,state.groups,function(g){ return g.name; });
    if(f) return f;
    throw e;
  }
}
function toolRun(name,args){
  var all=botTools();
  for(var i=0;i<all.length;i++) if(all[i].name===name) return all[i].execute(args||{});
  throw new Error("No such command.");
}
function nameList(cards){
  return cards.length ? cards.map(function(c){ return cardName(c); }).join(", ") : "";
}
var EVERY={"day":"daily","daily":"daily","every day":"daily","weekday":"weekdays","weekdays":"weekdays",
  "every weekday":"weekdays","week":"weekly","weekly":"weekly","every week":"weekly",
  "two weeks":"biweekly","biweekly":"biweekly","fortnight":"biweekly","every two weeks":"biweekly",
  "month":"monthly","monthly":"monthly","every month":"monthly","never":"none","none":"none"};

