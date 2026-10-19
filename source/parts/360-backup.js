/* ---------------- backup ---------------- */
(function(){
  var d=$("#backup"), b=$("#btn-backup"), downOn=false, opener=null;
  if(!d||!b) return;
  trapTab(d);
  b.addEventListener("click",function(){ opener=b; if(d.showModal) d.showModal(); else d.setAttribute("open",""); $("#backup-close").focus(); });
  $("#backup-close").addEventListener("click",function(){ d.close(); });
  d.addEventListener("pointerdown",function(e){ downOn=(e.target===d); });
  d.addEventListener("click",function(e){ if(e.target===d && downOn) d.close(); });
  d.addEventListener("close",function(){
    try{ if(opener) opener.focus(); }catch(er){}
    /* on the phone, Now redraws so a backup just saved takes the reminder away */
    if(typeof PH_ON!=="undefined" && PH_ON){ PH_DRAWN=""; phRender(); }
  });
})();
var IO=$("#io");
/* ---- the private parts in the backup (owner, 2026-10-19: "go ahead with the backup") ----
   The journal, the weekly check-ins and the photo live in their own keys,
   never in the board's state, so account sync and the tutor never see them.
   They used to be left out of the backup too, which meant a cleared browser
   or a lost phone lost them for good (the Apple principles check: reliability
   failed). Now the backup file carries them while "Include my journal, weekly
   check-ins and photo" is on (it is, unless the person turns it off). Loading
   a backup adds back what is missing and never overwrites: an entry already
   on this phone is kept, nothing is doubled, the photo returns only if there
   is none. Anything that does not look like what this app writes is dropped. */
var BK_PHOTO_RE=/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
function bkPrivate(){
  var ph=null;
  try{ var x=JSON.parse(localStorage.getItem(KEY+".photo")||"null"); if(x && BK_PHOTO_RE.test(String(x.src))) ph={src:x.src, show:x.show!==false}; }catch(e){}
  return {journal:jrData().log.slice(), week:weekData().log.slice(), photo:ph};
}
/* ---- a quiet monthly reminder to back up (owner, 2026-10-19) ----
   A backup only helps if one exists. When there is something to lose (a
   finished step, a journal entry or a check-in), the board has been in use
   for a week, and no file was saved in 30 days, Now shows one card. Saving
   a file resets the clock; Later hides it for 7 days. No notification.  */
var BK_LAST=KEY+".lastBackup", BK_LATER=KEY+".backupLater", BK_DAY=864e5;
function bkMark(){ try{ localStorage.setItem(BK_LAST,new Date().toISOString()); localStorage.removeItem(BK_LATER); }catch(e){} }
function bkGet(k){ try{ var t=Date.parse(localStorage.getItem(k)||""); return isNaN(t)?0:t; }catch(e){ return 0; } }
function bkDue(now){
  var t=(now||new Date()).getTime(), first=Infinity, lose=false;
  (state.ev||[]).forEach(function(e){ if(e&&e.t){ if(e.t<first) first=e.t; if(e.k==="done") lose=true; } });
  jrData().log.forEach(function(e){ var a=Date.parse(e.at); lose=true; if(a<first) first=a; });
  weekData().log.forEach(function(e){ var a=Date.parse(e.d); lose=true; if(a<first) first=a; });
  if(!lose || !(t-first>=7*BK_DAY)) return null;
  var last=bkGet(BK_LAST), later=bkGet(BK_LATER);
  if(last && t-last<30*BK_DAY) return null;
  if(later && t-later<7*BK_DAY) return null;
  return {days: last ? Math.floor((t-last)/BK_DAY) : null};
}
function bkLater(){ try{ localStorage.setItem(BK_LATER,new Date().toISOString()); }catch(e){} }
function bkText(){
  var o=JSON.parse(JSON.stringify(state)), inc=$("#io-private");
  delete o.private;
  if(!inc||inc.checked) o.private=bkPrivate();
  return JSON.stringify(o);
}
function bkJrOk(e){
  return e && typeof e.id==="string" && e.id.length<=40 && typeof e.at==="string" && !isNaN(Date.parse(e.at)) &&
    /^\d{4}-\d\d-\d\d$/.test(e.d) && /^\d\d:\d\d$/.test(e.tm) && !!JR_KINDS[e.kind] &&
    typeof e.a==="string" && typeof e.b==="string" && (e.a||e.b);
}
function bkWkOk(e){
  return e && /^\d{4}-W\d\d$/.test(e.k) && /^\d{4}-\d\d-\d\d$/.test(e.d) &&
    WEEK_ITEMS.every(function(it){ var v=e[it[0]]; return v===Math.round(v) && v>=1 && v<=5; });
}
/* add back what is missing; returns how many of each came back */
function bkMerge(p){
  var got={journal:0, week:0, photo:false};
  if(!p||typeof p!=="object") return got;
  if(Array.isArray(p.journal)){
    var J=jrData(), have={}; J.log.forEach(function(e){ have[e.id]=1; });
    p.journal.forEach(function(e){
      if(!bkJrOk(e)||have[e.id]) return;
      var c={id:e.id, at:e.at, d:e.d, tm:e.tm, kind:e.kind, a:jrClip(e.a), b:jrClip(e.b)};
      if(typeof e.ed==="string" && !isNaN(Date.parse(e.ed))) c.ed=e.ed;
      J.log.push(c); have[e.id]=1; got.journal++;
    });
    J.log.sort(function(a,b){ return a.at<b.at?-1:a.at>b.at?1:0; });
    if(J.log.length>JR_KEEP) J.log.splice(0,J.log.length-JR_KEEP);
    jrSave();
  }
  if(Array.isArray(p.week)){
    var W=weekData(), hk={}; W.log.forEach(function(e){ hk[e.k]=1; });
    p.week.forEach(function(e){
      if(!bkWkOk(e)||hk[e.k]) return;
      var c={k:e.k, d:e.d}; WEEK_ITEMS.forEach(function(it){ c[it[0]]=e[it[0]]; });
      if(e.n===Math.round(e.n) && e.n>=0) c.n=e.n;
      W.log.push(c); hk[e.k]=1; got.week++;
    });
    W.log.sort(function(a,b){ return a.d<b.d?-1:a.d>b.d?1:0; });
    if(W.log.length>WEEK_KEEP) W.log.splice(0,W.log.length-WEEK_KEEP);
    weekSave();
  }
  if(p.photo && BK_PHOTO_RE.test(String(p.photo.src))){
    var mine=null; try{ mine=JSON.parse(localStorage.getItem(KEY+".photo")||"null"); }catch(e){}
    if(!mine){ try{ localStorage.setItem(KEY+".photo",JSON.stringify({src:p.photo.src, show:p.photo.show!==false})); got.photo=true; }catch(e){} }
  }
  return got;
}
var sandboxed=(function(){ try{ return window.self!==window.top; }catch(e){ return true; } })();
if(sandboxed) $("#io-save").textContent="Copy backup text";
$("#io-dump").addEventListener("click",function(){ IO.value=bkText(); IO.focus(); IO.select(); });
$("#io-load").addEventListener("click",function(){
  try{
    var s=JSON.parse(IO.value);
    if(!s||!(s.v===1||s.v===2)) throw new Error("bad");
    var priv=s.private; delete s.private;
    localStorage.setItem(KEY,JSON.stringify(s));
    bkMerge(priv);
    location.reload();
  }catch(e){ ioMsg("That is not a board backup. Paste the whole line, first brace to last."); }
});
$("#io-save").addEventListener("click",function(){
  if(sandboxed){
    IO.value=bkText(); IO.focus(); IO.select();
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(IO.value).then(bkMark).catch(function(){});
    return;
  }
  try{
    var a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([bkText()],{type:"application/json"}));
    a.download="qordel-backup-"+todayStr()+".json";
    document.body.appendChild(a); a.click(); a.remove(); bkMark();
  }catch(e){ IO.value=bkText(); IO.focus(); IO.select(); ioMsg("This browser will not save a file. The backup text is selected instead, copy it."); }
});
$("#io-file").addEventListener("change",function(e){
  var f=e.target.files[0]; if(!f) return;
  var r=new FileReader(); r.onload=function(){ IO.value=r.result; $("#io-load").click(); }; r.readAsText(f);
});
$("#io-reset").addEventListener("click",function(){
  askUser({title:"Reset the board?", body:["This puts the shipped list back and throws away your goals, steps, history, notes, weekly check-ins and settings in this browser.","A backup file you saved earlier is not touched, and your journal is kept (delete it from the Journal panel). This cannot be undone."],
    ok:"Reset everything", cancel:"Keep my board", danger:true}).then(function(yes){
    if(!yes) return;
    try{ localStorage.removeItem(KEY); localStorage.removeItem(WEEK_KEY); }catch(e){}
    location.reload();
  });
});

