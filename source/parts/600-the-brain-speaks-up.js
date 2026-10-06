/* ---------------- the brain speaks up ----------------
   It already knows what is on fire and what to do next. This is it saying so
   without being asked, once when you arrive and then only when the answer
   changes.                                                             */
var saidWhat="";
function nudge(){
  var hot=alerts().filter(function(a){ return a.score>=150; });
  var msg="", key="";
  if(hot.length){
    key="hot:"+hot[0].gid;
    msg=hot.length===1
      ? hot[0].t+" needs you: "+hot[0].w.split(" \\u00b7 ").slice(0,2).join(", ")+"."
      : hot.length+" goals are past or nearly past their deadline. "+hot[0].t+" is the worst.";
  } else if(!state.oftad.length){
    var pk=pickToday();
    if(pk){ key="pick:"+pk.s.id; msg="Today: "+pk.s.name+". "+pk.why; }
  }
  if(!msg||key===saidWhat) return;
  saidWhat=key;
  if(typeof toast==="function") toast("",msg);
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
