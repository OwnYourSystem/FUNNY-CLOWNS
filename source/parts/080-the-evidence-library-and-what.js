/* ---------------- the evidence library, and what may be said from it ----------------
   A recommendation is only as good as where it came from, so the tutor does
   not get to make one up. It may offer what is in EVIDENCE, by id, labelled
   for what it is. Today every entry is practitioner opinion taken word for
   word from the two sets of advice the owner was given: each carries the
   sentence it rests on, and a test checks that sentence against the saved
   notes. A peer-reviewed entry may only be added as "checked", with its
   abstract in the entry and a person's name and date on the check. Papers
   that have not been checked wait in notes/evidence-candidates.md and are
   not in this file at all, so nothing here can be retrieved before it is
   confirmed.                                                           */
var LIB_USE={practitioner:1,checked:1};
var LIB_STOP={the:1,and:1,for:1,why:1,how:1,what:1,does:1,did:1,that:1,this:1,with:1,about:1,when:1,you:1,are:1,was:1,have:1,has:1,can:1,should:1,not:1,but:1,say:1,says:1,tell:1,give:1,any:1,from:1,they:1,them:1,get:1,make:1,more:1,less:1,much:1,just:1,into:1,out:1,off:1,over:1,than:1,then:1,there:1,here:1,been:1,will:1,would:1,could:1};
function libStems(text){
  return String(text||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").split(/\s+/)
    .filter(function(w){ return w.length>2 && !LIB_STOP[w]; })
    .map(function(w){ return w.slice(0,5); });
}
function libUsable(id){
  for(var i=0;i<EVIDENCE.length;i++) if(EVIDENCE[i].id===id) return !!LIB_USE[EVIDENCE[i].status];
  return false;
}
function libLabel(e){ return e.status==="checked" ? e.strength+", abstract checked" : "practitioner opinion"; }
/* by tag first, by the claim's own words second; nothing scores zero and returns */
function libFind(query,limit){
  var q=libStems(query), out=[];
  if(!q.length) return out;
  EVIDENCE.forEach(function(e){
    if(!LIB_USE[e.status]) return;
    var tags=libStems(e.tags.join(" ")), words=libStems(e.claim), sc=0;
    q.forEach(function(w){
      if(tags.indexOf(w)>=0) sc+=3;
      else if(words.indexOf(w)>=0) sc+=1;
    });
    if(sc>0) out.push({e:e,sc:sc});
  });
  out.sort(function(a,b){ return b.sc-a.sc || (a.e.id<b.e.id?-1:1); });
  /* a word that only turns up inside a claim is a weak match: once something matched on a tag, keep only tag matches */
  if(out.length && out[0].sc>=3) out=out.filter(function(x){ return x.sc>=3; });
  return out.slice(0,clamp(Math.round(+limit||3),1,5)).map(function(x){ return x.e; });
}
function libView(e){
  return {id:e.id, claim:e.claim, strength:libLabel(e), from:e.from, limits:e.limits,
    try_it:e.tryit.do, experiment:libRunHint(e)};
}
function libRunnable(e){ return !!(e.tryit && e.tryit.outcome); }
function libRunHint(e){
  return libRunnable(e)
    ? "Type try "+e.id+" to run it for "+e.tryit.days+" days. The board measures "+EXP_METRICS[e.tryit.outcome.metric].label+" against the "+e.tryit.days+" days before."
    : "The board cannot measure this one. Just try it.";
}
function libAnyChecked(list){ return list.some(function(e){ return e.status==="checked"; }); }
/* what to look up when nobody names a topic: the thing the board can see */
function libContextQuery(){
  var dz=doseNow();
  if(dz.band==="low") return "capacity floor small";
  var sk=evStats("skips",30,"reason");
  if(sk.enough && sk.rows.length){
    var k=sk.rows[0].key;
    return k==="too big" ? "stretch shrink big" : k==="wrong time" ? "capacity energy" :
           k==="wrong place" ? "environment friction" : k==="doesn't want to" ? "choice meaning pressure" : "barrier skip";
  }
  return "progress evidence record";
}
function libSay(topic){
  var q=String(topic||"").trim(), ctx=!q;
  var hits=libFind(ctx?libContextQuery():q,2);
  if(!hits.length) return "The library has nothing on that yet. I would rather say so than guess.";
  var out=hits.map(function(e,i){
    return "["+e.id+"] "+e.claim+" Try: "+e.tryit.do+(i===0?" Limit: "+e.limits:"");
  }).join(" ")+(libRunnable(hits[0])?" Type try "+hits[0].id+" to run it for "+hits[0].tryit.days+" days and I will measure it.":"");
  return (libAnyChecked(hits)?"From the library: ":"From the library, practitioner opinion and not a trial; no peer-reviewed entry is in it yet. ")+out;
}
/* The check that stands between a model and the person. It reads a finished
   reply and refuses it if it cites an id that is not in the library, says
   what research shows without citing one, uses a clinical word, or (when it
   answered from history or the library) quotes a number no tool returned.
   It cannot tell whether a true sentence is wise. It can tell whether a
   claim came from somewhere.                                           */
var CHK_BAN=/\b(diagnos\w*|disorders?|depress(?:ed|ion|ive)|adhd|bipolar|ptsd|medication\w*|prescri\w*|psychiatr\w*|mental illness)\b/i;
var CHK_SAYS=/\b(studies|research|science|scientists|meta-?analys\w*|clinical\w*|proven|evidence)\b[^.!?]*\b(show|shows|showed|found|find|prove|proves|proved|suggest|suggests|indicate|indicates|confirm\w*)\b|\baccording to\b/i;
function chkNums(text){
  return (String(text||"").replace(/\[?E-[A-Z0-9]+-\d\d\]?/g," ").match(/\d+(?:[.,]\d+)?/g)||[]).map(function(n){ return n.replace(",","."); });
}
