/* ---- the two calls that move a board ---- */
function pullBoard(){
  return withToken(function(){
    return sbFetch("/rest/v1/boards?select=data,updated_at&user_id=eq."+encodeURIComponent(acct.uid));
  }).then(function(rows){ return (rows&&rows[0])||null; });
}
function acctPush(){
  if(!acct||!acct.uid) return Promise.resolve(null);
  return withToken(function(){
    return sbFetch("/rest/v1/boards?on_conflict=user_id",{
      method:"POST",
      headers:{prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify([{user_id:acct.uid,data:state}])
    });
  }).then(function(r){
    lastPush=Date.now();
    /* the account's clock, not this device's, so two devices compare the
       same numbers however far apart their own clocks have drifted */
    var stamp=(r&&r[0]&&r[0].updated_at) ? new Date(r[0].updated_at).getTime() : lastPush;
    state.syncedAt=stamp;
    try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){}
    paintAccount(); paintWhere(); return r;
  });
}
/* every save nudges this; the write itself waits until you stop typing */
function syncSoon(){
  if(!ACCOUNT_ON||!acct||!acct.uid) return;
  clearTimeout(pushT);
  pushT=setTimeout(function(){ acctPush().catch(function(e){ acctMsg("Not saved to your account: "+e.message); }); },1500);
}

