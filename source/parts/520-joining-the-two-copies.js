/* ---- joining the two copies ---- */
function adoptRemote(row){
  var keep=JSON.stringify(state);
  try{ localStorage.setItem(KEY+".before-sync",keep); }catch(e){}
  state=row.data;
  state.syncedAt=new Date(row.updated_at).getTime()||Date.now();
  boot2();
  acctMsg("Board loaded from your account. The copy that was on this device is kept; press Restore to bring it back.");
}
/* a board that arrives from elsewhere gets the same filling in that a board
   read from this browser gets, or the first draw finds a hole              */
function boot2(){
  if(!state.ue) state.ue={}; if(!state.killed) state.killed=[];
  if(!state.oftad) state.oftad=[]; if(!state.plan) state.plan=[];
  if(!state.done) state.done=[]; if(!state.dayLog) state.dayLog=[];
  if(!state.hist) state.hist=[]; if(!state.log) state.log=[];
  if(!state.groups) state.groups=[]; if(!state.subs) state.subs={};
  toGoals();
  if(!state.sel||!gById(state.sel)) state.sel=state.groups.length?state.groups[0].id:"";
  sync();
  if(!state.hist.length) seedHist();
  rollRecurring(); save(); renderAll();
}
/* Which copy wins, on a device that has just opened.

   This used to compare the account's updated_at against state.savedAt, and
   that was wrong in a way that destroyed boards. savedAt is when THIS
   browser last wrote to its own localStorage, which happens on almost every
   interaction, so a device that had just booted always looked newer than
   the account. Signing in on a phone therefore pushed the phone's empty
   starter board over the real one and called it a save.

   What matters is not when this browser last wrote, but whether the account
   has moved since this device last wrote to IT. That is syncedAt: the stamp
   the account gave back on this device's last successful push.

     no row in the account        this board is the first, push it
     this device never pushed     the account's copy is the real one, take it
     account moved since my push  somebody else changed it, take it
     otherwise                    mine is the newest, push it

   Whenever the account's copy is taken, the copy that was on this device is
   kept and Restore brings it back, so a wrong guess is never final.     */
/* How much of a board is this person's own work, rather than the starter
   set every board begins with. Timestamps cannot tell those apart, and the
   difference is the whole question when two copies meet: a device carrying
   real work must never be flattened by an account holding a fresh one.  */
function substance(st){
  if(!st) return 0;
  var n=0;
  n += Object.keys(st.ue||{}).length * 6;        /* renamed or retyped by hand */
  n += (st.killed||[]).length * 4;               /* threw something away */
  n += (st.archive||[]).length * 6;
  n += (st.backlog||[]).length * 3;
  n += (st.log||[]).length;                      /* things actually finished */
  n += (st.dayLog||[]).length * 2;
  n += (st.oftad||[]).length + (st.plan||[]).length + (st.done||[]).length;
  if(st.me && st.me.done) n += 10;               /* sat through the interview */
  var seeded={}, seedPct={};
  SEED.forEach(function(g){
    seeded[g.id]=1;
    g.subs.forEach(function(x){ seedPct[x.id]=x.pct||0; });
  });
  (st.groups||[]).forEach(function(g){ if(!seeded[g.id]) n+=6; });   /* their own goal */
  Object.keys(st.subs||{}).forEach(function(k){
    var x=st.subs[k]; if(!x) return;
    if(seedPct[k]===undefined) n+=2;                                  /* their own step */
    else if((x.pct||0)!==seedPct[k]) n+=1;                            /* progress they moved */
  });
  return n;
}
function boardSummary(st){
  var g=(st.groups||[]).length, done=0;
  Object.keys(st.subs||{}).forEach(function(k){
    var x=st.subs[k]; if(x&&(x.pct>=100||x.status==="done")) done++;
  });
  return g+" goals, "+done+" finished, "+substance(st)+" marks of your own";
}
/* Both copies carry real work and this device has never pushed. There is no
   honest way to pick, so it does not: it shows both and waits.          */
var pendingRemote=null;
function offerChoice(row){
  pendingRemote=row;
  var box=$("#acct-choose");
  if(!box){ adoptRemote(row); return; }
  box.hidden=false;
  $("#choose-mine").textContent="This device: "+boardSummary(state);
  $("#choose-theirs").textContent="Your account: "+boardSummary(row.data||{});
  acctMsg("Two boards, both with work in them. Nothing is changed until you pick.");
}
function takeChoice(which){
  var box=$("#acct-choose"); if(box) box.hidden=true;
  if(which==="theirs" && pendingRemote) adoptRemote(pendingRemote);
  else {
    acctPush().then(function(){ acctMsg("Kept this device\u2019s board, and your account now holds it."); });
  }
  pendingRemote=null;
}
function firstSync(){
  if(!acct||!acct.uid) return Promise.resolve();
  acctMsg("Checking your account…");
  return pullBoard().then(function(row){
    if(!row){ return acctPush().then(function(){ acctMsg("This board is now saved to your account."); }); }
    var theirs=new Date(row.updated_at).getTime()||0;
    var lastPushed=state.syncedAt||0;
    if(lastPushed){
      /* this device has pushed before, so the clock is meaningful */
      if(theirs>lastPushed+1000){ adoptRemote(row); return; }
      return acctPush().then(function(){ acctMsg("Your account has this board."); });
    }
    /* first time on this device: the clock says nothing, so weigh the work */
    var mine=substance(state), yours=substance(row.data||{});
    if(mine>0 && yours===0)
      return acctPush().then(function(){ acctMsg("Your account was empty, so it now holds this board."); });
    if(mine>0 && yours>0){ offerChoice(row); return; }
    adoptRemote(row);
  }).catch(function(e){ acctMsg("Your account did not answer: "+e.message); });
}

