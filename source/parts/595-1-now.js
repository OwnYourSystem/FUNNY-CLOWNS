/* ---------------- the phone ----------------
   Built 2026-10-15 from the agreed wireframes, for the phone only. Below
   820px the board is four tabs (Now, Talk, Journal, You) on the same engine
   and the same data; the desktop is unchanged. The old long page was the
   desktop board stacked into one column: six screens and ninety buttons
   before the one decision. Here Now answers "what now" on one screen.
   Tags, Backlog, Archive and the Planner open as the old pages under a Back
   bar. "Classic view" in You turns the old phone board back on.          */
var PH_KEY="oys-classic", PH_MQ=null, PH_ON=false, PH_DRAWN="", PH_ONB=0, PH_GOAL="";
var PH_GUIDE=false;
var PH_V={days:[1,2,3,4,5], w0:"08:00", w1:"16:30", easy:[], north:"", where:"any", wh:{}, start:"07:00", end:"22:30", am:"on", amAt:"07:30", pm:"on", pmAt:"15:00", goal:"", step:""};
/* The board's own pages a phone still shows under a Back bar. Since
   2026-10-18 Backlog, Tags, Archive and the Planner have phone pages of
   their own, so none is left; the mechanism stays for any page added later. */
var PH_OLD={};
/* the phone pages drawn once per visit, because they hold a box being typed in;
   their own actions draw them again */
var PH_LOCK={step:1, planner:1, learned:1, backlog:1, archive:1, tags:1};
var PH_Q={}, PH_TAGS=[];
var PH_DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var PH_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
var PH_CHEV='<svg class="ph-chev" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5l4.5 4.5L6 12.5"/></svg>';
var PH_BACKI='<svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5L4.5 8l5.5 5.5"/></svg>';
var PH_MIC='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5"/><path d="M3 7.5a5 5 0 0 0 10 0M8 12.5V15"/></svg>';
/* A phone on its side is about 844 wide, past the 820 cut. It is still a
   phone: a touch screen with little height. Turning it must not swap the app. */
var PH_QUERY="(max-width: 820px), (pointer: coarse) and (max-height: 500px)";
try{ PH_MQ=window.matchMedia?matchMedia(PH_QUERY):null; }catch(e){ PH_MQ=null; }
/* Back is one thing everywhere: a chevron and the name of the page it goes
   back to, top left, in the accent colour, as on iOS. */
function phNav(href,label){ return '<a class="ph-nav" href="'+href+'" aria-label="Back to '+esc(label)+'">'+PH_BACKI+'<span>'+esc(label)+'</span></a>'; }
/* where Back (and a swipe in from the left edge) goes from here */
function phParent(){
  var r=phRoute();
  if(r==="goals"||PH_OLD[r]||r==="backlog"||r==="archive"||r==="tags"||r==="planner"||r==="learned"||r==="calendar"||r==="tour") return "#/you";
  if(r==="goal") return "#/goals";
  if(r==="jday") return "#/journal";
  if(r==="step"){ var x=state.subs[phArg()]; return x?"#/goal/"+encodeURIComponent(x.gid):"#/goals"; }
  return "";
}
/* Undo. An action that can be taken back keeps a copy of the board from just
   before it, and a bar above the tabs offers Undo for 6 seconds. Undo puts
   the board back in place (the same object, so the event log sees a done
   and then an undo, as on the board) but keeps the event log itself. If
   anything else changed in between, Undo says so and does nothing, so it
   can never throw away a later change.                                */
var PH_UNDO=null, PH_JR_OPEN=false;
function phFp(){ return JSON.stringify(state,function(k,v){ return (k==="ev"||k==="savedAt")?undefined:v; }); }
/* the phone shows Undo above its tabs, the board at the bottom of the screen */
function phUndoShow(label){
  var p=PH_ON?"#ph-undo":"#dk-undo", b=$(p), t=$(p+"-t"); if(t) t.textContent=label; if(b) b.hidden=false;
}
function phUndoable(label,fn){
  var snap=JSON.stringify(state), r;
  try{ r=fn(); }catch(e){ toast("",e.message); return; }
  save(); renderAll(); PH_DRAWN=""; phRender();
  if(PH_UNDO) clearTimeout(PH_UNDO.t);
  PH_UNDO={snap:snap, fp:phFp(), t:setTimeout(phUndoHide,6000)};
  phUndoShow(label);
  return r;
}
function phUndoHide(){ if(PH_UNDO) clearTimeout(PH_UNDO.t); PH_UNDO=null; ["#ph-undo","#dk-undo"].forEach(function(x){ var b=$(x); if(b) b.hidden=true; }); }
/* Undo for something that is not the board's state (a cleared conversation) */
function phUndoFn(label,restore){
  if(PH_UNDO) clearTimeout(PH_UNDO.t);
  PH_UNDO={fn:restore, t:setTimeout(phUndoHide,6000)};
  phUndoShow(label);
}
function phUndo(){
  var u=PH_UNDO; if(!u) return; phUndoHide();
  if(u.fn){ u.fn(); return; }
  if(phFp()!==u.fp){ toast("","Something else changed since then, so that cannot be undone here."); return; }
  var o=JSON.parse(u.snap), ev=state.ev;
  Object.keys(state).forEach(function(k){ if(!(k in o)) delete state[k]; });
  Object.keys(o).forEach(function(k){ state[k]=o[k]; });
  state.ev=ev; save(); renderAll(); PH_DRAWN=""; phRender();
}
/* ---- your photo (2026-10-18) ----
   Chosen with the phone's own picker (camera or library), cut to a square
   and made small (256px, about 20 KB) before it is kept. It stays on this
   phone in its own storage key, like the journal: no sync, never sent to the
   tutor; the backup file carries it while the person keeps that switched on. Once set it shows small at the top right of
   every page and leads to You, where it shows large. A switch in You hides
   it from the other pages. Only a picture this code made is ever shown. */
var PH_PHOTO_KEY=KEY+".photo";
function phPhoto(){
  try{ var x=JSON.parse(localStorage.getItem(PH_PHOTO_KEY)||"null");
    if(x && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(String(x.src))) return {src:x.src, show:x.show!==false}; }catch(e){}
  return null;
}
function phPhotoSave(x){
  try{ if(x) localStorage.setItem(PH_PHOTO_KEY,JSON.stringify(x)); else localStorage.removeItem(PH_PHOTO_KEY); return true; }
  catch(e){ toast("Photo","This phone has no room left to keep the photo."); return false; }
}
function phPhotoFile(f){
  if(!f) return;
  if(!/^image\//.test(f.type||"")){ toast("Photo","That file is not a picture."); return; }
  var url=URL.createObjectURL(f), im=new Image();
  im.onload=function(){
    var n=256, c=document.createElement("canvas"), w=im.naturalWidth, h=im.naturalHeight, sq=Math.min(w,h);
    c.width=n; c.height=n; c.getContext("2d").drawImage(im,(w-sq)/2,(h-sq)/2,sq,sq,0,0,n,n);
    URL.revokeObjectURL(url);
    var old=phPhoto();
    if(phPhotoSave({src:c.toDataURL("image/jpeg",0.85), show:old?old.show:true})){ PH_DRAWN=""; phRender(); }
  };
  im.onerror=function(){ URL.revokeObjectURL(url); toast("Photo","That picture could not be opened. Try another one."); };
  im.src=url;
}
/* the small photo at the top right of every page but You and the welcome */
function phMini(r,onb){
  var el=$("#ph-mini"), p=phPhoto(), on=!!(p && p.show && !onb && r!=="you");
  document.documentElement.classList.toggle("ph-has-me",on);
  if(!el) return;
  el.hidden=!on;
  if(on && el.getAttribute("data-src")!==p.src){ el.innerHTML='<img src="'+esc(p.src)+'" alt="">'; el.setAttribute("data-src",p.src); }
}
/* A phone always gets the phone app (owner, 2026-10-19: "the mobile version
   does not need the classic view"). The switch is kept for the test suites
   only, which drive the desktop board at narrow widths; nothing a person
   can press sets it. A "1" left by the old Classic view row is cleared, so
   whoever chose it gets the phone app back.                              */
function phClassic(){ try{ var v=localStorage.getItem(PH_KEY); if(v==="1"){ localStorage.removeItem(PH_KEY); v=null; } return v==="test"; }catch(e){ return false; } }
/* Qordel web (owner, 2026-10-21: the web version at the level of the phone app, in a design of its own).
   A big screen gets the same pages, rules and data in its own layout: a sidebar with Now, Talk, Journal,
   Calendar, Goals and You, and a wide, calm column. The old panel board stays, as Classic board on You,
   for whoever wants it; the choice is kept in this browser. */
var PH_WEB_KEY="oys-web";
function phWebOk(){ try{ return localStorage.getItem(PH_WEB_KEY)!=="classic"; }catch(e){ return true; } }
function phHere(){ return phIsWeb()?"this computer":"this phone"; }
function phIsWeb(){ return PH_ON && !(PH_MQ&&PH_MQ.matches); }
function phWebSet(on){ try{ if(on) localStorage.removeItem(PH_WEB_KEY); else localStorage.setItem(PH_WEB_KEY,"classic"); }catch(e){} location.hash=on?"#/now":"#/board"; phSet(); scrollTo(0,0); }
(function(){ var b=$("#btn-web"); if(b) b.addEventListener("click",function(){ phWebSet(true); }); })();
function phWanted(){ if(phClassic()) return false; return !!(PH_MQ&&PH_MQ.matches) || phWebOk(); }
function phRoute(){ var m=String(location.hash||"").match(/^#\/([a-z]+)/); var r=m?m[1]:"now"; return r==="board"?"now":r; }
function phGo(r){ if(phRoute()===r && location.hash) phRender(); else location.hash="#/"+r; }
function phSet(){
  var on=phWanted(), root=document.documentElement;
  if(on!==PH_ON){
    PH_ON=on; PH_DRAWN="";
    root.classList.toggle("ph",on);
    if(!on){ root.classList.remove("ph-old","ph-talk","ph-onb"); }
  }
  root.classList.toggle("ph-web",phIsWeb());
  var cb=$("#btn-web"); if(cb) cb.hidden=PH_ON||!!(PH_MQ&&PH_MQ.matches)||phClassic();
  phBarColour();
  phRender();
}
/* the browser bar takes the phone's ground colour, and gets its own back on the desktop */
function phBarColour(){
  var c=""; try{ c=getComputedStyle(document.documentElement).getPropertyValue("--ground").trim(); }catch(e){}
  Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'),function(m){
    if(!m.hasAttribute("data-was")) m.setAttribute("data-was",m.getAttribute("content")||"");
    m.setAttribute("content",PH_ON&&c?c:m.getAttribute("data-was"));
  });
}
/* the energy level, as four batteries (owner, 2026-10-20). The colour is never
   the only sign: each battery has its own number of bars and its own word. */
function phBattery(l){
  var bars=[], y=[33,25,17,9];
  for(var i=0;i<4;i++) bars.push('<rect x="7" y="'+y[i]+'" width="14" height="6" rx="1.2" class="'+(i<l?"on":"off")+'"/>');
  return '<svg class="ph-bat ph-bat'+l+'" viewBox="0 0 28 44" width="28" height="44" aria-hidden="true"><rect x="9.5" y="1" width="9" height="4" rx="1.5" class="cap"/>'+
    '<rect x="3" y="4.5" width="22" height="38" rx="4" class="body"/>'+bars.join("")+'</svg>';
}
/* One battery beside the date: the level the day is sized to now. Until the
   person sets one it shows the board's own sizing; a tap changes it, and the
   plan is sized again at once (owner, 2026-10-20). */
function phEnLvl(dz){ return dz.lvl || (dz.band==="low"?1:dz.band==="high"?4:3); }
function phEnergy(){
  var dz=doseNow(), l=phEnLvl(dz), mine=dz.src==="you", nm=ENERGY[l].name;
  return '<button type="button" class="ph-enb" data-ph="energy" data-l="'+l+'" aria-label="Energy: '+nm+(mine?", set by you":", not set today")+'. Change">'+
    phBattery(l)+'<span class="ph-enb-t"><span class="ph-enb-n">'+nm+'</span><span class="ph-enb-s">'+(mine?"Your energy":"Tap to set")+'</span></span></button>';
}
function phEnergyAsk(){
  var dz=doseNow(), ez=Object.keys(state.subs).some(function(id){ return easyOpen(state.subs[id]); });
  var body=["The board sizes today to your energy. Change it whenever your day changes. If you do not set it, it stays at Good."];
  if(!floorState().items.length) body.push("On a low day it shows your easy things. Add them on You.");
  else if(!ez) body.push("On a low day, steps you mark Easy can show too. Mark one on its page.");
  var gn=doseN("normal"), st=function(k){ return k+(k===1?" step":" steps"); };
  var more=[["1","Very low: nothing is needed"],["2","Low: easy things only"],["3","Good: "+st(gn)],["4","Full: "+st(doseN("high"))]];
  askUser({title:"How is your energy?", body:body, more:more, noOk:true, cancel:"Keep it"}).then(function(v){
    if(+v>=1&&+v<=4) setEnergy(+v); else return;
    PH_DRAWN=""; phRender(); var eb=document.querySelector("[data-ph=energy]"); if(eb) eb.focus();
    /* the first time someone picks Good, they say what a good day is (owner, 2026-10-20) */
    if(v==="3" && !(state.me&&state.me.goodSet)) phGoodN();
  });
}
/* A delivery day that has passed (owner, 2026-10-20): the person is asked,
   once per goal and date, in a notification and in a quiet card on Now. */
function phMissed(){ return state.groups.filter(function(g){ return missedDelivery(g) && g.missAsk!==g.due; }); }
function phMissNote(ms){
  var me=state.me||{}, d=new Date(), now=d.getHours()*60+d.getMinutes(), fresh=ms.filter(function(g){ return g.missNote!==g.due; });
  if(!fresh.length || outsideDay(me,now)) return;
  try{ if(!("Notification" in window) || Notification.permission!=="granted" || !navigator.serviceWorker) return; }catch(e){ return; }
  fresh.forEach(function(g){ g.missNote=g.due; }); save();
  var t=fresh.length===1?fresh[0].name+": its delivery day has passed":fresh.length+" goals passed their delivery day";
  navigator.serviceWorker.ready.then(function(reg){
    return reg.showNotification(t,{body:"Pick a new day? Nothing is lost.", tag:"oys-miss", icon:"icon-192.png", badge:"badge-96.png", data:{url:"./#/now"}});
  }).catch(function(){});
}
/* a tap on a notification while the app is open lands on its page */
try{ if(navigator.serviceWorker) navigator.serviceWorker.addEventListener("message",function(e){
  var m=e.data||{}; if(m.type==="oys-go" && /^#\/[a-z]+$/.test(m.hash||"")) location.hash=m.hash; }); }catch(e){}
function phMissNew(id){
  var g=gById(id); if(!g) return;
  askUser({title:"A new delivery day", body:["For "+g.name+". The steps keep their order, and the board spreads them over the days left."],
    fields:[{k:"d",label:"Delivery day",kind:"date",value:"",min:todayStr()}], ok:"Save", cancel:"Not now",
    check:function(v){ return !v.d?"Pick a day.":(v.d<todayStr()?"Pick today or a later day.":""); }}).then(function(v){
    if(!v) return; editGoal(g,"due",v.d); delete g.missAsk; delete g.missNote; save(); renderAll(); PH_DRAWN=""; phRender();
    toast("",g.name+": delivery "+deliveryLabel(g)+".");
  });
}
/* Drag the handle to reorder the open steps of a goal (2026-10-20). The rows
   move under the finger; on release the new order is saved with Undo. The
   handle is hidden from screen readers: Earlier and Later on the step page
   do the same job there. */
var PH_GRIP='<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 5h10M3 8h10M3 11h10"/></svg>';
(function(){
  var root=$("#ph"); if(!root) return;
  var d=null;
  function reset(){ if(!d) return; d.items.forEach(function(li){ li.style.transform=""; li.classList.remove("is-drag","is-shift"); }); d=null; }
  root.addEventListener("pointerdown",function(e){
    var gp=e.target.closest(".ph-grip"); if(!gp||d) return;
    var li=gp.closest(".ph-dli"), ul=li&&li.parentNode; if(!ul) return;
    var items=Array.prototype.filter.call(ul.children,function(x){ return x.classList.contains("ph-dli"); });
    d={li:li, items:items, from:items.indexOf(li), to:items.indexOf(li), y0:e.clientY, h:li.getBoundingClientRect().height,
       mids:items.map(function(x){ var r=x.getBoundingClientRect(); return r.top+r.height/2; })};
    li.classList.add("is-drag"); try{ gp.setPointerCapture(e.pointerId); }catch(er){}
    e.preventDefault();
  });
  root.addEventListener("pointermove",function(e){
    if(!d) return;
    var dy=e.clientY-d.y0, y=d.mids[d.from]+dy, to=0;
    d.mids.forEach(function(m,j){ if(j!==d.from && m<y) to++; });
    d.to=to; d.li.style.transform="translateY("+dy+"px)";
    d.items.forEach(function(x,j){
      if(j===d.from) return;
      var sh=(d.from<to&&j>d.from&&j<=to)?-d.h:(d.from>to&&j>=to&&j<d.from)?d.h:0;
      x.style.transform=sh?"translateY("+sh+"px)":""; x.classList.toggle("is-shift",!!sh);
    });
  });
  function end(){
    if(!d) return;
    var from=d.from, to=d.to, ids=d.items.map(function(x){ return x.getAttribute("data-sid"); }), s=state.subs[ids[from]];
    reset();
    if(to===from||!s) return;
    var g=gById(s.gid); if(!g) return;
    ids.splice(to,0,ids.splice(from,1)[0]);
    phUndoable("Moved: "+phCut(s.name,40),function(){ if(!setOpenOrder(g,ids)) throw new Error("The steps changed meanwhile."); });
  }
  root.addEventListener("pointerup",end);
  root.addEventListener("pointercancel",reset);
})();
/* AI proposes an order (owner, 2026-10-20). Only the goal's name and its
   open step names are sent, after the person agreed once; the answer is a
   suggestion they can use or leave, and Undo takes it back. */
function phAiConsent(){
  return askUser({title:"Suggest an order with AI",
    body:["Qordel sends this goal\u2019s name and its open step names to Anthropic, an AI company, and gets back a suggested order.",
      "Nothing else leaves this phone: not your journal, check-ins, photo or account. You decide whether to use the order. You can turn this off on You."],
    ok:"Send", cancel:"Not now"}).then(function(yes){
    if(!yes) return false;
    var me=state.me||(state.me=freshMe()); me.aiOrderOk=todayStr(); save(); return true;
  });
}
function phAiOrder(gid,from){
  var g=gById(gid); if(!g) return;
  var open=g.subs.map(function(id){ return state.subs[id]; }).filter(function(x){ return x&&x.pct<100&&x.status!=="done"; });
  if(open.length<2) return;
  /* suggestions need an account (2026-10-21): the server answers only a signed-in person */
  if(!(typeof acct!=="undefined" && acct && acct.access_token)){
    askUser({title:"Sign in to get suggestions", body:["An AI suggestion needs an account, so only you can use it. Your board stays on this device either way."],
      ok:"Sign in", cancel:"Not now"}).then(function(yes){ var ab=$("#btn-account"); if(yes && ab) ab.click(); });
    return;
  }
  ((state.me&&state.me.aiOrderOk)?Promise.resolve(true):phAiConsent()).then(function(ok){
    if(!ok) return;
    var btn=from&&document.contains(from)?from:document.querySelector('[data-ph="aiorder"]');
    if(btn){ btn.disabled=true; btn.setAttribute("aria-busy","true"); btn.textContent="Asking\u2026"; }
    var done=function(){ if(btn){ btn.disabled=false; btn.removeAttribute("aria-busy"); btn.textContent="Suggest an order"; } };
    var ctl=window.AbortController?new AbortController():null, tm=setTimeout(function(){ if(ctl) ctl.abort(); },25000);
    var body=JSON.stringify({goal:g.name.slice(0,120), steps:open.map(function(x){ return {id:x.id, name:x.name.slice(0,120)}; })});
    var post=function(){ return fetch("api/order",{method:"POST", headers:{"content-type":"application/json", authorization:"Bearer "+((acct&&acct.access_token)||"")},
        signal:ctl?ctl.signal:undefined, body:body})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return {st:r.status, j:j}; }); }); };
    /* an hour-old session is refreshed once, as the tutor does */
    post().then(function(x){ return x.st===401 && acct && acct.refresh_token ? acctRefresh().then(post,function(){ return x; }) : x; })
    .then(function(x){
      clearTimeout(tm); done();
      if(x.st===503 && x.j.error && x.j.error.code==="not_configured") return toast("","The AI suggestion is not switched on yet.");
      if(x.st===401) return toast("","Sign in again to get suggestions.");
      if(x.st===429) return toast("",(x.j.error&&x.j.error.message)||"Enough suggestions for now. Try again later.");
      if(x.st!==200 || !x.j.ok) return toast("","No suggestion this time. Your order stays.");
      var now=g.subs.filter(function(id){ return open.some(function(o){ return o.id===id; }); });
      if(x.j.order.join("|")===now.join("|")) return toast("","The AI suggests the same order you have.");
      var names=x.j.order.map(function(id,i){ var o=state.subs[id]; return (i+1)+". "+(o?o.name:"?"); });
      askUser({title:"Suggested by AI", body:names.concat([x.j.why||"", "It does not know your constraints, so check it before you use it."]).filter(Boolean),
        ok:"Use this order", cancel:"Keep mine"}).then(function(yes){
        if(!yes) return;
        var g2=gById(gid); if(!g2) return;
        phUndoable("New order for "+phCut(g2.name,36),function(){ if(!setOpenOrder(g2,x.j.order)) throw new Error("The steps changed meanwhile. Ask again."); });
      });
    })
    .catch(function(){ clearTimeout(tm); done(); toast("","No answer right now. Your order stays."); });
  });
}
/* how many steps make a good day: the person decides; Low and Full follow from it */
function phGoodN(){
  var me=state.me||(state.me=freshMe()), cur=doseN("normal");
  askUser({title:"How many steps make a good day?", body:["Today and every Good day after it is sized to this. Low and Full follow from it. You can change it on You."],
    more:[["1","1 step"],["2","2 steps"],["3","3 steps"],["4","4 steps"]].map(function(o){ return [o[0],o[1]+(+o[0]===cur?" (now)":"")]; }), noOk:true, cancel:"Keep "+cur})
  .then(function(v){
    if(+v>=1&&+v<=4) me.normalN=+v; else if(v!==false&&v!==null&&v!==undefined) return;
    me.goodSet=true; save(); renderAll(); PH_DRAWN=""; phRender();
    var r=document.querySelector("[data-ph=goodn]")||document.querySelector("[data-ph=energy]"); if(r) r.focus();
  });
}
/* what Now shows: the first open step in Today, else the board's pick */
/* what Now shows as the one thing: nothing in rule 2's rest; on a low day
   only a step marked Easy (rule 3); otherwise Today first, then the pick */
function phCurrent(){
  var v=verdict(); if(v.rest) return null;
  var cur=null, low=doseNow().band==="low";
  state.oftad.forEach(function(c){ if(!cur && c.k==="sub" && !c.done && state.subs[c.id] && (!low||easyOpen(state.subs[c.id]))) cur=c; });
  if(cur){ var s=state.subs[cur.id]; return {mode:"today", s:s, g:gById(s.gid), why:cur.why||""}; }
  if(v.none) return null;
  return {mode:"pick", s:v.s, g:v.g, why:verdictWhy(v), v:v};
}
/* rules 2 and 3 on Now: the person's own easy things, ticked here */
function phEasyCard(head,text){
  var f=floorState(), on=floorToday();
  return '<section class="ph-card ph-rest" aria-label="'+esc(head)+'">'+sayBtn("ph-say","Read this card aloud")+'<h2 class="ph-h2">'+esc(head)+'</h2><p class="ph-why">'+esc(text)+'</p>'+
    (f.items.length
      ? '<div class="ph-easy" role="group" aria-label="My easy things">'+f.items.map(function(x){
          return '<button type="button" class="ph-rowb ph-choice" role="checkbox" aria-checked="'+(on.indexOf(x.id)>=0)+'" data-ph="easytick" data-id="'+esc(x.id)+'"><span>'+esc(x.t)+'</span><span class="ph-tick" aria-hidden="true"></span></button>'; }).join("")+'</div>'+
        (floorMet()?'<p class="ph-note">That counts as a day.</p>':'')+
        '<button type="button" class="ph-link" data-ph="easyedit">Edit my easy things</button>'
      : '<div class="ph-acts"><button type="button" class="ph-btn ph-pri" data-ph="easyedit">Add my easy things</button></div>')+
    '</section>';
}
function phCut(t,n){ t=String(t||""); return t.length>n ? t.slice(0,n-1).replace(/\s+\S*$/,"")+"…" : t; }
function phDays(){
  var seen={}, n=0, dots=[], i, d;
  evSel("completions",evWin(7),Date.now()+1).forEach(function(e){ var k=dstr(new Date(e.t)); if(!seen[k]){ seen[k]=1; n++; } });
  for(i=6;i>=0;i--){ d=new Date(); d.setDate(d.getDate()-i); dots.push(seen[dstr(d)]?1:0); }
  return {n:n, dots:dots};
}
function phTabsMark(r){
  Array.prototype.forEach.call(document.querySelectorAll("#ph-tabs [data-tab]"),function(a){
    var web=phIsWeb();
    var on=a.getAttribute("data-tab")===(web&&r==="calendar"?"calendar":web&&r==="tour"?"tour":web&&(r==="goals"||r==="goal"||r==="step")?"goals"
      :r==="tour"?"you":r==="goals"||r==="goal"||r==="step"||r==="backlog"||r==="archive"||r==="tags"||r==="planner"||r==="learned"||r==="calendar"||PH_OLD[r]?"you":r==="jday"?"journal":r);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}
/* the mark, the name and who made it, at the top of every page */
var PH_BRAND_IN='<span class="ph-bt"><span class="ph-word">Qordel</span><span class="ph-by">Powered by OwnYourSystem</span></span>';
var PH_BRAND='<div class="ph-brand">'+PH_BRAND_IN+'</div>';
function phRender(){
  if(!PH_ON) return;
  var root=document.documentElement, r=phRoute(), onb=!state.me||!state.me.done||PH_GUIDE, main=$("#ph-main");
  if(!main) return;
  var old=!onb && !!PH_OLD[r], talk=!onb && r==="talk";
  root.classList.toggle("ph-onb",onb);
  root.classList.toggle("ph-old",old);
  root.classList.toggle("ph-talk",talk);
  if(talk && SHEET.hidden) botOpen(true);
  if(!talk && !SHEET.hidden) botOpen(false);
  phTabsMark(r);
  var back=$("#ph-back-t"); if(back) back.textContent=PH_OLD[r]||"";
  /* the onboarding keeps what is typed: it is drawn again only when its step changes */
  var key=onb?"onb"+PH_ONB:PH_LOCK[r]?r+":"+phArg():r;
  if((onb||PH_LOCK[r]) && PH_DRAWN===key){ phMini(r,onb); return; }
  if(r==="goal"){ var ga=phArg(); if(ga) PH_GOAL=ga; }
  PH_DRAWN=key;
  main.setAttribute("data-route",onb?"onb":r);
  main.innerHTML = (onb||talk||old ? "" : PH_BRAND) + (onb ? phOnbHtml()
    : r==="journal" ? phJournal()
    : r==="jday" ? phJDay()
    : r==="you" ? phYou()
    : r==="goals" ? phGoals()
    : r==="goal" ? phGoalPage()
    : r==="step" ? phStepPage()
    : r==="backlog" ? phBacklog()
    : r==="archive" ? phArchive()
    : r==="tags" ? phTags()
    : r==="planner" ? phPlanner()
    : r==="learned" ? phLearned()
    : r==="calendar" ? phCalendar()
    : r==="tour" ? phTour()
    : (talk||old) ? ""
    : phNow());
  phMini(r,onb);
}

/* ---- Now ---- */
function phNow(){
  var d=new Date(), h=[], c=jrCardOn(), cur=phCurrent(), dy=phDays();
  /* the date with its year, the week and a running clock, as the old board had them */
  h.push('<header class="ph-today"><div class="ph-today-k"><span class="ph-k">'+PH_DAYS[d.getDay()]+' \u00b7 Week '+weekNo(d)+'</span>'+
    '<time class="ph-clock" id="ph-clock">'+phClock(d)+'</time></div>'+
    '<div class="ph-head"><h1 class="ph-h1">'+d.getDate()+' '+PH_MONTHS[d.getMonth()]+' '+d.getFullYear()+'</h1>'+phEnergy()+'</div></header>');
  /* rule 6: what is booked today, or in the evening tomorrow's first booking; the Calendar page has the rest */
  var ah=calOn()?calAhead(CAL_LIST,d):null;
  if(ah) h.push('<a class="ph-strip ph-booked" href="#/calendar"><span class="ph-k">'+(ah.when==="Today"?"Booked today":"Tomorrow")+'</span>'+
    '<span class="ph-strip-t">'+esc(calAheadText(ah))+'</span><span class="ph-strip-go">'+PH_CHEV+'</span></a>');
  /* the tour: once for someone new, and again when slides were added since they last opened it */
  var tnew=tourNewCount(), tfirst=!tourSeen();
  if(tfirst||tnew){ var ti=0; if(!tfirst) TOUR.some(function(x,j){ if(tourNew(x)){ ti=j; return true; } return false; });
    h.push('<a class="ph-strip ph-tourstrip" href="#/tour/'+(ti+1)+'"><span class="ph-k">'+(tfirst?"New here?":"New in Qordel")+'</span>'+
      '<span class="ph-strip-t">'+(tfirst?"How Qordel works, in 1 minute":tnew+(tnew===1?" new thing to see":" new things to see"))+'</span><span class="ph-strip-go">'+PH_CHEV+'</span></a>'); }
  /* someone who set up before the guide existed gets it here, until it is done; Later hides it for today */
  var gme=state.me||{};
  if(gme.done && !gme.guided && gme.guideLater!==todayStr())
    h.push('<section class="ph-card ph-guide" aria-label="Set up your week"><h2 class="ph-h2">Set up your week</h2>'+
      '<p class="ph-why">Five short screens: your day and reminders, your work, your easy things, what matters most, and which goals are work. About 2 minutes.</p>'+
      '<div class="ph-acts"><button type="button" class="ph-btn ph-pri" data-ph="guide">Start</button><button type="button" class="ph-btn" data-ph="guide-later">Later</button></div></section>');
  if(c){
    var e=c.e, K=JR_KINDS[e.kind]||JR_KINDS.end, ago=Math.round((new Date(c.today)-new Date(c.d))/864e5);
    h.push('<a class="ph-strip" href="#/journal" data-ph="jropen"><span class="ph-k">'+(ago===1?"Yesterday":ago+" days ago")+'</span>'+
      '<span class="ph-strip-t">Your '+esc(K.name.toLowerCase())+' note is waiting</span><span class="ph-strip-go">'+PH_CHEV+'</span></a>');
  }
  h.push(wnPhone());
  if(cur){
    h.push('<section class="ph-card" aria-label="Do this now">'+sayBtn("ph-say","Read this card aloud")+'<div class="ph-k ph-hot">'+(cur.mode==="today"?"Now, from Today":"Do this now")+'</div>'+
      '<h2 class="ph-task">'+esc(cur.s.name)+'</h2>'+
      '<p class="ph-why">'+esc(cur.g?cur.g.name:"")+(cur.why?" · "+esc(cur.why):"")+'</p>'+
      '<div class="ph-acts">'+
      (cur.mode==="today"
        ? '<button type="button" class="ph-btn ph-pri" data-ph="done" data-id="'+esc(cur.s.id)+'">Done</button><button type="button" class="ph-btn" data-ph="later" data-id="'+esc(cur.s.id)+'">Not now</button>'
        : '<button type="button" class="ph-btn ph-pri" data-ph="take" data-id="'+esc(cur.s.id)+'">Start it</button><button type="button" class="ph-btn" data-ph="skip" data-id="'+esc(cur.s.id)+'">Skip</button>')+
      '</div></section>');
    if(doseNow().band==="low") h.push(phEasyCard("Or one easy thing","One of these is enough today."));
  } else {
    var v=verdict(), not=v&&v.none?(v.blocked||[]).map(function(b){ return b.g.name+" waits: "+b.why+"."; }):[];
    if(v.rest) h.push(phEasyCard("Nothing is needed now",v.why+" If you want, one easy thing:"));
    else if(v.low) h.push(phEasyCard("Your energy is low","One easy thing is enough. Or mark a step Easy on its page, and it will show here."));
    else h.push('<section class="ph-card" aria-label="Do this now">'+sayBtn("ph-say","Read this card aloud")+'<div class="ph-k">Nothing fits this hour</div>'+
      '<p class="ph-why">'+esc(not.length?not.join(" "):"Everything that can be done now is done, waiting or in Today.")+'</p>'+
      '<div class="ph-acts"><a class="ph-btn" href="#/talk">Add something</a></div></section>');
  }
  /* a delivery day that has passed: asked here as well as in a notification */
  var ms=phMissed();
  if(ms.length){ var mg=ms[0], md=new Date(mg.due+"T00:00:00");
    h.push('<section class="ph-card ph-miss" aria-label="A delivery day has passed">'+sayBtn("ph-say","Read this card aloud")+'<h2 class="ph-h2">'+esc(mg.name)+'</h2>'+
      '<p class="ph-why">Its delivery day, '+DAYNAME[md.getDay()]+' '+md.getDate()+' '+PH_MONTHS[md.getMonth()]+', has passed. Nothing is lost. Pick a new day, or take the date off.'+
      (ms.length>1?' '+(ms.length-1)+' more '+(ms.length===2?"goal asks":"goals ask")+' the same after this one.':'')+'</p>'+
      '<div class="ph-acts"><button type="button" class="ph-btn ph-pri" data-ph="missnew" data-id="'+esc(mg.id)+'">Pick a new day</button>'+
      '<button type="button" class="ph-btn" data-ph="missoff" data-id="'+esc(mg.id)+'">No date</button></div>'+
      '<button type="button" class="ph-link" data-ph="misskeep" data-id="'+esc(mg.id)+'">Keep it as it is</button></section>'); }
  phMissNote(ms);
  /* something the board learned from what the person did: asked once, kept only on Keep (2026-10-21) */
  var lm=memTick();
  if(lm) h.push('<section class="ph-card ph-learn" aria-label="Something I noticed">'+sayBtn("ph-say","Read this card aloud")+'<div class="ph-k">Something I noticed</div>'+
    '<p class="ph-task" style="font-size:1.0625rem">'+esc(lm.t)+'</p>'+(lm.evid?'<p class="ph-why">'+esc(lm.evid)+'</p>':'')+
    '<div class="ph-acts"><button type="button" class="ph-btn ph-pri" data-ph="learnkeep" data-id="'+esc(lm.id)+'">Keep it</button>'+
    '<button type="button" class="ph-btn" data-ph="learnno" data-id="'+esc(lm.id)+'">Not now</button></div></section>');
  var items=state.oftad.concat(state.done), nd=state.done.length;
  h.push('<section aria-label="Today"><div class="ph-row-h"><h2 class="ph-h2">Today</h2><span class="ph-k">'+nd+' of '+items.length+' done</span></div>');
  if(!items.length) h.push('<p class="ph-empty">'+(cur?"Nothing in Today yet. Start the step above, or say what you want to do in Talk.":"Nothing in Today, and nothing is needed.")+'</p>');
  else {
    h.push('<ul class="ph-list">');
    items.forEach(function(it){
      var isDone=state.done.indexOf(it)>=0, nm=cardName(it), sub=it.k==="sub"&&state.subs[it.id];
      h.push('<li class="ph-item'+(isDone?" is-done":"")+'">'+
        (sub&&!isDone ? '<button type="button" class="ph-ring" data-ph="done" data-id="'+esc(it.id)+'" aria-label="Mark '+esc(nm)+' done"></button>'
         : sub&&isDone ? '<button type="button" class="ph-ring on" data-ph="reopen" data-id="'+esc(it.id)+'" aria-label="'+esc(nm)+' is done. Open it again"></button>'
                       : '<span class="ph-ring'+(isDone?" on":"")+'" aria-hidden="true"></span>')+
        (sub ? '<button type="button" class="ph-item-t ph-item-b" data-ph="step" data-id="'+esc(it.id)+'"><span>'+esc(nm)+'</span>'+PH_CHEV+'</button>'
             : '<span class="ph-item-t">'+esc(nm)+'</span>')+'</li>');
    });
    h.push('</ul>');
  }
  if(state.plan.length) h.push('<p class="ph-note">'+state.plan.length+' waiting for another day.</p>');
  h.push('</section>');
  h.push(phWeekCard(dy));
  var bd=bkDue();
  if(bd) h.push('<section class="ph-card ph-bk" aria-label="Back up your board"><h2 class="ph-h2">Back up your board</h2>'+
    '<p class="ph-why">'+(bd.days===null?"You have not saved a backup yet.":"Your last backup was "+bd.days+" days ago.")+
    ' A backup file keeps your board, journal and check-ins safe if this phone is lost or its browser is cleared.</p>'+
    '<div class="ph-acts"><button type="button" class="ph-btn ph-pri" data-ph="bknow">Back up now</button><button type="button" class="ph-btn" data-ph="bklater">Later</button></div></section>');
  return h.join("");
}
function phClock(d){ return pad2(d.getHours())+":"+pad2(d.getMinutes())+":"+pad2(d.getSeconds()); }
/* Steps finished per day, last n days ending today. A Done taken back with
   Undo the same day does not count. */
function phDoneDays(n,endOffset){
  var out=[], i, d, to=evWin(1)+864e5-(endOffset||0)*864e5, from=to-n*864e5, net={}, per={};
  (state.ev||[]).forEach(function(e){
    if(e.t<from||e.t>=to||(e.k!=="done"&&e.k!=="undo")) return;
    var k=dstr(new Date(e.t))+"|"+e.id; net[k]=(net[k]||0)+(e.k==="done"?1:-1);
  });
  Object.keys(net).forEach(function(k){ if(net[k]>0){ var day=k.split("|")[0]; per[day]=(per[day]||0)+1; } });
  for(i=n-1;i>=0;i--){ d=new Date(to-864e5); d.setDate(d.getDate()-i); out.push({d:dstr(d), day:d, c:per[dstr(d)]||0}); }
  return out;
}
/* the average across every step, as overall() has it, as it stood at time t:
   each step's value is the one it had before its first change after t */
function phOverallAt(t){
  var a=allSubs(); if(!a.length) return 0;
  var first={};
  (state.ev||[]).forEach(function(e){ if(e.k==="pct" && e.t>=t && !(e.id in first)) first[e.id]=e.a; });
  var sum=0; a.forEach(function(s){ sum+=(s.id in first)?first[s.id]:s.pct; });
  return Math.round(sum/a.length*10)/10;
}
/* The week from the air: a few numbers and one small chart, nothing to dig
   into. Steps finished this week against the week before, how many days had
   one, where all the goals stand and how far they moved, and the seven days
   as columns. One colour, the accent; text stays in the text colours. */
function phWeekCard(dy){
  var wk=phDoneDays(7), prev=phDoneDays(7,7), n=0, p=0, mx=0;
  wk.forEach(function(x){ n+=x.c; if(x.c>mx) mx=x.c; }); prev.forEach(function(x){ p+=x.c; });
  var diff=n-p, ov=overall(), was=phOverallAt(evWin(7)), mv=Math.round((ov-was)*10)/10;
  var delta=diff>0?"▲ "+diff+" on the week before":diff<0?"▼ "+(-diff)+" on the week before":"Same as the week before";
  var moved=mv>0?"▲ "+mv+" points this week":mv<0?"▼ "+(-mv)+" points this week":"No change this week";
  var h=['<section class="ph-week" aria-labelledby="ph-week-h"><div class="ph-row-h"><h2 class="ph-h2" id="ph-week-h">Your week</h2><span class="ph-k">Last 7 days</span></div>'];
  h.push('<div class="ph-two"><div class="ph-stat"><span class="ph-stat-l">Steps finished</span><span class="ph-stat-v">'+n+'</span><span class="ph-stat-d">'+delta+'</span></div>'+
    '<div class="ph-stat"><span class="ph-stat-l">Days with a step done</span><span class="ph-stat-v">'+dy.n+' <small>of 7</small></span><span class="ph-stat-d">'+(dy.n>=5?"A steady week":dy.n>=3?"Keep the run going":"One step makes a day")+'</span></div></div>');
  h.push('<div class="ph-stat ph-meter-w"><span class="ph-stat-l">All goals</span><span class="ph-stat-v">'+Math.round(ov)+'%</span>'+
    '<span class="ph-meter" role="meter" aria-label="All goals" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(ov)+'"><span style="width:'+Math.max(0,Math.min(100,ov))+'%"></span></span>'+
    '<span class="ph-stat-d">'+moved+'</span></div>');
  /* the columns: each is a button, so a tap (or focus) reads its day out */
  h.push('<div class="ph-cols-w"><p class="ph-cols-read" id="ph-cols-read" aria-live="polite">'+(n?"Tap a day to see it":"Finish a step and it shows here")+'</p>'+
    '<div class="ph-cols" role="group" aria-label="Steps finished each day, last 7 days">');
  wk.forEach(function(x,i){
    var lab=PH_DAYS[x.day.getDay()]+" "+x.day.getDate()+" "+PH_MONTHS[x.day.getMonth()], ht=mx?Math.round(x.c/mx*100):0, today=i===wk.length-1;
    h.push('<button type="button" class="ph-col'+(today?" is-today":"")+'" data-ph="col" data-say="'+esc(lab+": "+x.c+(x.c===1?" step":" steps")+" finished")+'" aria-label="'+esc(lab+", "+x.c+(x.c===1?" step":" steps"))+'">'+
      '<span class="ph-col-v">'+(x.c&&x.c===mx?x.c:"")+'</span><span class="ph-col-t"><span class="ph-col-b" style="height:'+ht+'%"></span></span>'+
      '<span class="ph-col-x">'+(today?"Today":PH_DAYS[x.day.getDay()].slice(0,3))+'</span></button>');
  });
  h.push('</div></div>');
  /* no second copy as a table (2026-10-21): each column already says its day and count, so a screen reader heard them twice */
  h.push('</section>');
  return h.join("");
}
function phDone(id){
  var s=state.subs[id]; if(!s) return;
  phUndoable("Done: "+phCut(s.name,40),function(){ toolRun("set_status",{subtask:s.name,status:"done"}); toolRun("mark_done_today",{subtask:s.name}); });
}
/* a ticked step in Today goes back to open */
function phReopen(id){
  var s=state.subs[id]; if(!s) return;
  phUndoable("Back in Today: "+phCut(s.name,40),function(){
    toolRun("undo_done_today",{subtask:s.name});
    if(s.status==="done"||s.pct>=100) editSub(s,"status","doing");
  });
}

