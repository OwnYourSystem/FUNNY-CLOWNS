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
  /* a board set up before 2026-10-21 still holds the old settings; it is told once what changed (592) */
  if(s.wn===undefined) s.wn=(s.me && s.me.done && ("commute" in s.me || "sharp" in s.me)) ? "show" : "none";
  state=s; toGoals(); sync(); unseedHere(); toGoals();
  if(!state.hist.length) seedHist();
  if(!state.sel || !gById(state.sel)) state.sel=state.groups.length?state.groups[0].id:"";
  rollRecurring();          /* bring every habit into today before the first draw */
  evPrev=evSnap();          /* what changes from here on is what the person did */
  if(!state.exp) state.exp={active:null,done:[],unseen:false};
  return state;
}
/* The owner's own signed-in board keeps the goals that used to ship with
   the app; every other board loses them, once (flaw 13, 2026-10-21). Only the
   account's id is here, never its address. The board loads before the account
   code runs, so the sign-in is read straight from this browser's store. */
function seedKept(){
  var a=(typeof acct!=="undefined" && acct) || null;
  if(!a){ try{ a=JSON.parse(localStorage.getItem(KEY+".account")||"null"); }catch(e){ a=null; } }
  return !!(a && a.uid==="5b461774-5e32-4ea1-ab09-9760fb3429c8");
}
function unseedHere(){
  if(seedKept()) return 0;
  var n=unseedBoard(state);
  /* the copy kept for Restore gets the same clean-up */
  try{
    var raw=localStorage.getItem(KEY+".before-sync"), b=raw&&JSON.parse(raw);
    if(b && unseedBoard(b)) localStorage.setItem(KEY+".before-sync",JSON.stringify(b));
  }catch(e){}
  if(n) save();
  return n;
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
