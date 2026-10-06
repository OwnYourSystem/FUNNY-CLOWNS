/* ---------------- the board follows you ----------------
   Opened from the claude.ai link, the whole board is kept in this
   artifact's own store, which is yours and reaches every device you open
   it on. No account, no password: claude.ai already knows who you are.
   Opened from the saved file or the app's own address there is no store,
   so the board stays in that browser and nothing here runs.           */
var boardPushT=null, boardJoined=false;
function pushBoard(){
  if(!boardDb) return;
  clearTimeout(boardPushT);
  boardPushT=setTimeout(function(){
    try{
      boardDb.doc("board/state").set({
        savedAt: state.savedAt||Date.now(),
        day: state.day,
        rev: SEED_REV,
        data: state
      }).catch(function(){});
    }catch(e){}
  },1200);
}
function joinBoard(){
  if(!boardDb||boardJoined) return;
  if(syncMode()==="account") return;   /* the account is in charge, not this */
  boardJoined=true;
  try{
    boardDb.doc("board/state").get().then(function(row){
      if(!row||!row.data||!row.data.groups){ pushBoard(); return; }
      var mine=state.savedAt||0, theirs=row.savedAt||0;
      /* 3 seconds of slack, so a clock that is a little out does not win */
      if(theirs>mine+3000){
        try{ localStorage.setItem(KEY+".before-sync", JSON.stringify(state)); }catch(e){}
        state=row.data;
        boot2();
        ioMsg("This board came from another device, saved "+
          new Date(theirs).toLocaleString()+". The copy that was here is kept.");
      } else {
        pushBoard();
      }
    }).catch(function(){});
  }catch(e){}
}
function mirrorToday(){
  if(!boardDb) return;
  clearTimeout(syncT);
  syncT=setTimeout(function(){
    try{
      boardDb.doc("board/today").set({
        day: state.day,
        updatedAt: new Date().toISOString(),
        overall: overall(),
        focus: state.oftad.map(cardLine),
        suggested: (function(){
          if(state.oftad.length) return null;
          var p=pickToday();
          return p ? {name:p.s.name, task:p.g.name, percent:p.s.pct, why:p.why} : null;
        })(),
        plan: state.plan.map(cardLine),
        done: state.done.map(cardLine),
        attention: alerts().slice(0,6).map(function(a){ return a.kind+" — "+a.t+" ("+a.w+")"; }),
        recurringDue: allSubs().filter(function(x){ return x.rep && periodKey(x.rep) && x.pct<100 && x.status!=="done"; })
          .map(function(x){ return {name:x.name, every:repLabel(x.rep), streak:x.streak||0}; }),
        recentDays: state.dayLog.slice(0,7)
      }).catch(function(){});
    }catch(e){}
  },900);
}

