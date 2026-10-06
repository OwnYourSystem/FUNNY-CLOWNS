/* ---- the panel ---- */
function acctMsg(t){ var n=$("#acct-msg"); if(n){ n.textContent=t||""; n.hidden=!t; } }
function whereText(){
  var m=syncMode();
  if(m==="account") return "Kept in your account. Every device you sign in on holds this board.";
  if(m==="artifact") return "Kept in this claude.ai board, which follows you between devices. Sign in to keep it in your own account instead.";
  if(netOk===false) return "Kept in this browser only. This page cannot reach the account service, so signing in will not work here.";
  return "Kept in this browser only. Sign in and it follows you between devices.";
}
function paintWhere(){
  var n=$("#acct-where"); if(n) n.textContent=whereText();
  var f=$("#where-note"); if(f) f.textContent=whereText();
  var g=$("#acct-in");
  if(g && netOk===false){
    var b=$("#acct-signin"), u=$("#acct-signup"), go=$("#acct-google");
    [b,u,go].forEach(function(x){ if(x) x.disabled=true; });
  }
}
/* plain words for a moment in time, because a raw clock reading tells you
   nothing about whether you are looking at something stale */
function ago(ms){
  var d=Math.max(0, Date.now()-ms), m=Math.round(d/60000);
  if(d<45000) return "a moment ago";
  if(m<60) return m+(m===1?" minute ago":" minutes ago");
  var h=Math.round(m/60);
  if(h<24) return h+(h===1?" hour ago":" hours ago");
  var dd=Math.round(h/24);
  return dd+(dd===1?" day ago":" days ago");
}
function paintAccount(){
  var btn=$("#btn-account"); if(!btn) return;
  btn.textContent = acct&&acct.email ? acct.email.split("@")[0] : "Sign in";
  btn.setAttribute("aria-label", acct ? "Your account, "+acct.email : "Sign in");
  var inn=$("#acct-in"), out=$("#acct-out");
  if(inn) inn.hidden=!!acct;
  if(out) out.hidden=!acct;
  var who=$("#acct-who");
  if(who&&acct) who.textContent=acct.email||"signed in";
  /* "Is it synced?" should be readable, not a guess. This says what is on
     this screen and what the account last took, so a mismatch is visible
     rather than something to wonder about.                              */
  var last=$("#acct-last");
  if(last){
    if(!acct) last.textContent="";
    else {
      var t=[];
      t.push("On this screen: "+boardSummary(state)+".");
      if(state.syncedAt) t.push("Your account took it "+ago(state.syncedAt)+".");
      else t.push("Nothing sent to your account from this device yet.");
      last.textContent=t.join(" ");
    }
  }
  var back=$("#acct-restore");
  if(back) back.hidden=!localStorage.getItem(KEY+".before-sync");
}
function acctOpen(on){
  var p=$("#account"); if(!p) return;
  p.hidden=!on;
  if(on){
    pageLockOn(p);
    netProbe();
    paintAccount(); paintWhere();
    var f=$("#acct-email"); if(f&&!acct) f.focus(); else { var c=$("#acct-close"); if(c) c.focus(); }
  } else pageLockOff();
}
function signIn(mode){
  var em=$("#acct-email").value.trim(), pw=$("#acct-pass").value;
  if(!em||!pw){ acctMsg("Both boxes, please."); return; }
  if(pw.length<8){ acctMsg("The password needs 8 characters or more."); return; }
  acctMsg(mode==="up"?"Creating your account…":"Signing you in…");
  var path=mode==="up" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
  sbFetch(path,{method:"POST",body:JSON.stringify({email:em,password:pw})})
    .then(function(d){
      if(!d||!d.access_token){
        acctMsg("Account made. Open the mail we sent and press the link, then sign in.");
        return;
      }
      acctSave(shapeSession(d));
      $("#acct-pass").value="";
      paintWhere();
      return firstSync();
    })
    .catch(function(e){ acctMsg(e.message); });
}
function signOut(){
  var t=acct&&acct.access_token;
  acctSave(null);
  acctMsg("Signed out. The board stays on this device.");
  if(t) fetch(SB_URL+"/auth/v1/logout",{method:"POST",headers:{apikey:SB_KEY,authorization:"Bearer "+t}}).catch(function(){});
}
function signInGoogle(){
  var back=location.origin+location.pathname;
  location.href=SB_URL+"/auth/v1/authorize?provider=google&redirect_to="+encodeURIComponent(back);
}
/* Google sends you back with the tokens in the address; take them and tidy up */
function catchRedirect(){
  var h=String(location.hash||"");
  if(h.indexOf("access_token=")<0) return false;
  var q={}; h.replace(/^#\/?/,"").split("&").forEach(function(p){
    var i=p.indexOf("="); if(i>0) q[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1));
  });
  if(!q.access_token) return false;
  acctSave({access_token:q.access_token,refresh_token:q.refresh_token||"",at:Date.now(),email:"",uid:""});
  try{ history.replaceState(null,"",location.pathname+location.search+"#/board"); }catch(e){ location.hash="#/board"; }
  sbFetch("/auth/v1/user").then(function(u){
    acctSave({access_token:q.access_token,refresh_token:q.refresh_token||"",at:Date.now(),
      email:(u&&u.email)||"",uid:(u&&u.id)||""});
    return firstSync();
  }).catch(function(e){ acctMsg("Signed in, but your account did not answer: "+e.message); });
  return true;
}

(function(){
  if(!ACCOUNT_ON){
    var b=$("#btn-account"), p=$("#account");
    if(b) b.hidden=true;
    if(p) p.remove();
    return;
  }
  acct=acctLoad();
  paintWhere();
  /* the probe costs a request and logs a failure when there is no network,
     so it waits until you are actually asking about the account */
  if(acct&&acct.uid) netProbe();
  var came=catchRedirect();
  /* Google signs you in by sending the browser away and back. That cannot
     work inside a frame, so in one the button says so instead of failing. */
  var framed=false; try{ framed=window.top!==window.self; }catch(e){ framed=true; }
  if(framed){
    var g=$("#acct-google");
    g.disabled=true;
    g.textContent="Google needs the app at its own address";
    g.title="Open the board at its own web address to use Google";
  }
  $("#btn-account").addEventListener("click",function(){ acctOpen($("#account").hidden); });
  $("#acct-close").addEventListener("click",function(){ acctOpen(false); });
  addEventListener("keydown",function(e){ if(e.key==="Escape" && pageLock && pageLock.el.id==="account") acctOpen(false); });
  $("#acct-google").addEventListener("click",signInGoogle);
  $("#acct-signin").addEventListener("click",function(){ signIn("in"); });
  $("#acct-signup").addEventListener("click",function(){ signIn("up"); });
  $("#acct-signout").addEventListener("click",signOut);
  $("#acct-sync").addEventListener("click",function(){
    acctMsg("Saving…");
    acctPush().then(function(){ acctMsg("Saved to your account."); })
      .catch(function(e){ acctMsg(e.message); });
  });
  $("#acct-restore").addEventListener("click",function(){
    var raw=localStorage.getItem(KEY+".before-sync"); if(!raw) return;
    try{ state=JSON.parse(raw); }catch(e){ return; }
    localStorage.removeItem(KEY+".before-sync");
    boot2(); syncSoon();
    acctMsg("The copy from this device is back, and it is what your account now holds.");
  });
  $("#acct-choose").addEventListener("click",function(e){
    var b=e.target.closest("[data-choose]"); if(b) takeChoice(b.dataset.choose);
  });
  $("#acct-pass").addEventListener("keydown",function(e){ if(e.key==="Enter") signIn("in"); });
  paintAccount();
  if(acct&&acct.uid&&!came) firstSync();
})();





