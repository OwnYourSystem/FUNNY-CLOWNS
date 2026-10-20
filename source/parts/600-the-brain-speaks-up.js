/* ---------------- the brain speaks up ----------------
   It already knows what is on fire and what to do next. It used to say so in
   a note that floated over the board a moment after it opened. That note
   covered the buttons of the very card that said the same thing, and the owner
   wants only the reminders they set to come to them (2026-10-15), so now only
   the bell count changes. The words stay in the cards on the board.       */
var saidWhat="";
function nudge(){
  /* the bell counts delivery days that have passed and still wait for an answer */
  var hot=state.groups.filter(function(g){ return missedDelivery(g) && g.missAsk!==g.due; });
  var msg="", key="";
  if(hot.length){
    key="hot:"+hot[0].id;
    msg=hot.length===1 ? hot[0].name+": its delivery day has passed. Pick a new day when you are ready."
      : hot.length+" goals passed their delivery day. Pick new days when you are ready.";
  } else if(!state.oftad.length){
    var pk=pickToday();
    if(pk){ key="pick:"+pk.s.id; msg="Today: "+pk.s.name+". "+pk.why; }
  }
  if(!msg||key===saidWhat) return;
  saidWhat=key;
  var bell=$("#rail-bell");
  if(bell){ bell.hidden=!hot.length; bell.textContent=hot.length||""; }
}

addEventListener("hashchange",readHash);
readHash();
bindSeek();
setTimeout(nudge,1600);
setInterval(nudge,1800000);

/* the banner fills with the board at once and the world a moment later */
loadNews();
setInterval(function(){ loadNews(); }, 300000);
addEventListener("visibilitychange",function(){ if(!document.hidden) loadNews(); });

})();
