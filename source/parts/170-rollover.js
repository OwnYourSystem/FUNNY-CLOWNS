/* ---------------- rollover ---------------- */
var rollNote="";
(function(){
  var t=todayStr(); if(state.day===t) return;
  /* "planned" is what you committed to for the day (Today and what you finished),
     never the Waiting pile: a pile that only grows would make every day look like a failure */
  if(state.done.length||state.oftad.length){
    state.dayLog.unshift({d:state.day,done:state.done.length,
      planned:state.done.length+state.oftad.length,
      items:state.done.map(function(c){ return cardName(c); }).slice(0,6)});
    if(state.dayLog.length>30) state.dayLog.pop();
  }
  /* what was not finished goes to Waiting, not into the new day's Today */
  var prevDay=state.day, wasToday=state.oftad.length;
  state.plan.forEach(function(c){ c.carried=true; if(!c.from) c.from=prevDay; delete c.why; });
  state.oftad.forEach(function(c){ c.carried=true; c.from=prevDay; delete c.why; delete c.src; });
  var seen={}, merged=[];
  state.oftad.concat(state.plan).forEach(function(c){
    var k=c.k+":"+c.id; if(seen[k]) return; seen[k]=1; merged.push(c);
  });
  var carried=merged.length;
  state.plan=merged; state.oftad=[];
  state.done=[];
  rollNote = carried ? carried+" waiting from earlier days" : "";
  state.day=t; state.notified=""; state.told=null;
  keepSnapshot(state.day);
  touchHist(); save();
})();
/* One scorer, one answer. This used to rank on its own, which meant the
   dock, the assistant and the card at the top of the board could each name
   a different task at the same moment. It now asks the planner and keeps
   only its own shape.                                                   */
function pickToday(){
  var v=verdict();
  if(v.none||!v.s) return null;
  return {sc:0, s:v.s, g:v.g, why:verdictWhy(v), v:v};
}
