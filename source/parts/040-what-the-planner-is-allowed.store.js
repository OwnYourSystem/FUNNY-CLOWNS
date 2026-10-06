function boot(){
  var s=null;
  try{ var raw=localStorage.getItem(KEY); if(raw) s=JSON.parse(raw); }catch(e){ s=null; }
  if(s && s.v===1) s=migrate1(s);
  if(!s || s.v!==2 || !s.groups) { s=blankState(); }
  if(!s.ue) s.ue={}; if(!s.killed) s.killed=[]; if(!s.oftad) s.oftad=[];
  if(!s.plan) s.plan=[]; if(!s.done) s.done=[]; if(!s.dayLog) s.dayLog=[];
  if(!s.capLog) s.capLog=[];
  if(!s.ev) s.ev=[];
  /* the tutor no longer speaks its replies; a flag an older build saved goes */
  delete s.speak;
  /* the grid is the only layout now; anything a older build saved goes */
  delete s.free; delete s.layout;
  /* sync adds any goal the seed grew since last time, and those arrive
     without the fields toGoals fills in, so it runs on both sides of it */
  state=s; toGoals(); sync(); toGoals();
  if(!state.hist.length) seedHist();
  if(!state.sel || !gById(state.sel)) state.sel=state.groups.length?state.groups[0].id:"";
  rollRecurring();          /* bring every habit into today before the first draw */
  evPrev=evSnap();          /* what changes from here on is what the person did */
  if(!state.exp) state.exp={active:null,done:[],unseen:false};
  return state;
}
function save(){
  try{ evCapture(); }catch(e){}
  state.savedAt=Date.now();
  try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){}
  var m=syncMode();
  if(m==="account" && typeof syncSoon==="function") syncSoon();
  else if(m==="artifact" && typeof pushBoard==="function") pushBoard();
  if(typeof paintWhere==="function") paintWhere();
  if(typeof pushSoon==="function") pushSoon();
}
