/* ---------------- the weekly check-in ----------------
   Five taps once a week, 1 (low) to 5 (high), all worded so that higher is
   better: energy, mood, calm (the other side of anxious), getting through the
   day, and something that mattered. They sit beside what you finished that
   week, because output alone can rise while the rest falls and the scoreboard
   cannot see that.

   This is about as personal as the board gets, so it is kept apart on purpose.
   It lives under its own storage key, never in the board's state. That keeps it
   out of account sync, out of the backup text, out of the tutor's snapshot and
   tools, out of the memory, and out of the hints. Nothing infers it, nothing
   asks for it unprompted (a quiet line on the board shows when one is due, and
   it opens only when you press it), and it can be deleted whole. The board says
   what it sees in two plain cases and gives no advice beyond saying that
   telling someone you trust is worth it.                                  */
var WEEK_KEY=KEY+".week", WEEK_KEEP=26, WEEK_DATA=null;
var WEEK_ITEMS=[["e","Energy"],["m","Mood"],["c","Calm"],["f","Getting through the day"],["w","Something that mattered to me"]];
function weekKeyOf(d){
  var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())), dn=t.getUTCDay()||7;
  t.setUTCDate(t.getUTCDate()+4-dn);
  var y=t.getUTCFullYear(), w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);
  return y+"-W"+pad2(w);
}
function weekLast(){ var l=weekData().log; return l.length?l[l.length-1]:null; }
/* due when there is none, or the last one is a week old; never forced */
function weekDue(){
  var l=weekLast();
  return !l || ageOf(l.d)>=7;
}
function weekSet(vals){
  var e={k:weekKeyOf(new Date()), d:todayStr()};
  WEEK_ITEMS.forEach(function(it){
    var n=Math.round(+vals[it[0]]);
    if(!(n>=1 && n<=5)) throw new Error("Pick 1 to 5 for each.");
    e[it[0]]=n;
  });
  e.n=evSel("completions",evWin(7),Date.now()+1).length;     /* what you finished in the 7 days to now */
  var log=weekData().log.filter(function(x){ return x.k!==e.k; });
  log.push(e); log.sort(function(a,b){ return a.d<b.d?-1:a.d>b.d?1:0; });
  if(log.length>WEEK_KEEP) log.splice(0,log.length-WEEK_KEEP);
  weekData().log=log; weekSave();
  evAdd({t:Date.now(),k:"week",act:"set"});
  return e;
}
/* two plain things, said only when they are true */
function weekNote(){
  var l=weekData().log, cur=l[l.length-1], prev=l[l.length-2], out=[];
  if(!cur||!prev) return "";
  var lower=[["e","energy"],["m","mood"],["c","calm"],["f","getting through the day"]].filter(function(q){ return cur[q[0]]<prev[q[0]]; }).map(function(q){ return q[1]; });
  if(cur.n-prev.n>=2 && lower.length>=3)
    out.push("You finished more in the week to "+cur.d+" than in the week before ("+cur.n+" against "+prev.n+"), and "+lower.join(", ")+
      " are lower than at your last check-in. That can happen. It is worth noticing, and if it keeps going, worth telling someone you trust.");
  if(cur.m<=2 && cur.c<=2 && prev.m<=2 && prev.c<=2)
    out.push("Mood and calm have both been low at your last two check-ins. If it feels heavy, please talk to someone you trust or a doctor. I only handle the board, so I cannot help with that part.");
  return out.join(" ");
}
function weekAsk(){
  var last=weekLast(), cur=last&&last.k===weekKeyOf(new Date())?last:null, opts=[1,2,3,4,5].map(function(n){ return [String(n),String(n)]; });
  askUser({title:"This week",
    body:["Five taps, from 1 (low) to 5 (high). It stays on this device only: it is not synced, and the tutor never sees it.","It is not a test and not advice. It is there so you can see how your weeks compare."],
    fields:WEEK_ITEMS.map(function(it){ return {k:it[0],label:it[1],kind:"pick",row:true,opts:opts,value:cur?cur[it[0]]:""}; }),
    ok:"Save", cancel:"Not now",
    check:function(v){ return WEEK_ITEMS.some(function(it){ return !v[it[0]]; }) ? "Pick a number for each, or press Not now." : ""; }}).then(function(v){
    if(!v) return;
    try{ weekSet(v); }catch(er){ toast("Check-in",er.message); }
    renderAll();
  });
}

