/* ---------------- account, and the board that follows you ----------------
   Sign in and the board stops being one browser's secret. It is kept as one
   JSON document per person, and the database only ever lets a person reach
   their own row. Signed out, nothing changes: the board still lives here.  */
/* An account is the only thing that keeps a year of this. Nothing is behind
   it: the board works signed out exactly as it does now, and signing in is
   an upgrade rather than a door.                                        */
var ACCOUNT_ON=true;
var SB_URL="https://phicqgnzqnuwugzbgxxw.supabase.co";
var SB_KEY="sb_publishable_qfXQ61CVW7cS-Qe_U6Dztg_o0MhKNPm";
var AUTH_KEY=KEY+".account";
var acct=null, pushT=null, lastPush=0;

/* An artifact runs in a frame that is allowed less than a normal page. It
   is refused the microphone outright. Whether it may reach the account is
   a separate question, and guessing at it is how you ship something that
   fails only for the person using it. So the page asks, once, and says.  */
var netOk=null;
function netProbe(){
  if(netOk!==null) return Promise.resolve(netOk);
  return fetch(SB_URL+"/auth/v1/settings",{headers:{apikey:SB_KEY}})
    .then(function(r){ netOk=r.ok; return netOk; })
    .catch(function(){ netOk=false; return false; })
    .then(function(v){
      paintWhere();
      /* leave the answer where it can be read back later */
      try{
        if(typeof boardDb!=="undefined" && boardDb)
          boardDb.doc("board/probe").set({at:new Date().toISOString(), reach:v,
            framed:(function(){ try{ return window.top!==window.self; }catch(e){ return true; } })(),
            ua:navigator.userAgent}).catch(function(){});
      }catch(e){}
      return v;
    });
}
function acctLoad(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||"null"); }catch(e){ return null; } }
function acctSave(a){
  acct=a;
  try{ a ? localStorage.setItem(AUTH_KEY,JSON.stringify(a)) : localStorage.removeItem(AUTH_KEY); }catch(e){}
  paintAccount();
}
function sbFetch(path,opts){
  opts=opts||{};
  var h=opts.headers||{};
  h.apikey=SB_KEY;
  h["content-type"]="application/json";
  h.authorization="Bearer "+((acct&&acct.access_token)||SB_KEY);
  opts.headers=h;
  return fetch(SB_URL+path,opts).then(function(r){
    return r.text().then(function(t){
      var body=null; try{ body=t?JSON.parse(t):null; }catch(e){ body=t; }
      if(!r.ok){
        var msg=(body&&(body.msg||body.error_description||body.message||body.error))||("http "+r.status);
        var err=new Error(msg); err.status=r.status; throw err;
      }
      return body;
    });
  });
}
/* an access token lasts an hour; the refresh token brings back a new one */
function acctRefresh(){
  if(!acct||!acct.refresh_token) return Promise.reject(new Error("not signed in"));
  return sbFetch("/auth/v1/token?grant_type=refresh_token",
    {method:"POST",body:JSON.stringify({refresh_token:acct.refresh_token})})
    .then(function(d){ acctSave(shapeSession(d)); return acct; });
}
function shapeSession(d){
  return {access_token:d.access_token, refresh_token:d.refresh_token,
    at:Date.now(), email:(d.user&&d.user.email)||(acct&&acct.email)||"",
    uid:(d.user&&d.user.id)||(acct&&acct.uid)||""};
}
function withToken(run){
  return run().catch(function(e){
    if(e.status!==401 && e.status!==403) throw e;
    return acctRefresh().then(run);
  });
}

