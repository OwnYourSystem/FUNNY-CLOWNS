var lastMin=-1;
function tick(){
  var d=new Date();
  $("#dateline").textContent=d.toLocaleDateString(undefined, window.innerWidth<520
    ? {weekday:"short",day:"numeric",month:"short",year:"numeric"}
    : {weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("#clock").textContent=pad2(d.getHours())+":"+pad2(d.getMinutes())+":"+pad2(d.getSeconds());
  $("#wk").textContent="WEEK "+weekNo(d);
  /* The verdict is an answer about this hour, so it is re-read when the
     minute turns, not once at boot. A leave time passes and it changes. */
  if(d.getMinutes()!==lastMin){
    lastMin=d.getMinutes();
    if(typeof renderVerdict==="function"){ renderVerdict();
      if(curView==="planner"&&typeof renderPlanner2==="function") renderPlanner2(); }
  }
  if(state.day!==todayStr()) location.reload();
}
tick(); setInterval(tick,1000);
