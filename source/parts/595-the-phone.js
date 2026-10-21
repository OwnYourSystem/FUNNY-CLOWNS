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
  if(r==="goals"||PH_OLD[r]||r==="backlog"||r==="archive"||r==="tags"||r==="planner"||r==="learned") return "#/you";
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
function phWanted(){ return !!(PH_MQ&&PH_MQ.matches) && !phClassic(); }
function phRoute(){ var m=String(location.hash||"").match(/^#\/([a-z]+)/); var r=m?m[1]:"now"; return r==="board"?"now":r; }
function phGo(r){ if(phRoute()===r && location.hash) phRender(); else location.hash="#/"+r; }
function phSet(){
  var on=phWanted(), root=document.documentElement;
  if(on!==PH_ON){
    PH_ON=on; PH_DRAWN="";
    root.classList.toggle("ph",on);
    if(!on){ root.classList.remove("ph-old","ph-talk","ph-onb"); }
  }
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
    var on=a.getAttribute("data-tab")===(r==="goals"||r==="goal"||r==="step"||r==="backlog"||r==="archive"||r==="tags"||r==="planner"||r==="learned"||PH_OLD[r]?"you":r==="jday"?"journal":r);
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

/* ---- Backlog, Archive, Tags (2026-10-18) ----
   The phone's own pages for what the board shows as its Backlog, Archive and
   Tags pages. Rows open a sheet with what can be done to them; anything that
   can be taken back has Undo. Both views call the same functions. */
function phSeg(cur){
  function a(r,t){ return '<a href="#/'+r+'"'+(cur===r?' aria-current="page"':'')+'>'+t+'</a>'; }
  return '<nav class="ph-seg" aria-label="Show">'+a("goals","Active")+a("backlog","Backlog")+a("archive","Archive")+'</nav>';
}
function phSearchBox(r,ph){
  return '<input class="ph-in ph-search" id="ph-q" data-r="'+r+'" type="search" placeholder="'+esc(ph)+'" aria-label="'+esc(ph)+'" value="'+esc(PH_Q[r]||"")+'" enterkeyhint="search" autocomplete="off">';
}
function phHit(r,t){ var q=String(PH_Q[r]||"").trim().toLowerCase(); return !q || String(t||"").toLowerCase().indexOf(q)>=0; }
function phShortDate(d){ var p=String(d||"").split("-"); return p.length===3 ? (+p[2])+" "+PH_MONTHS[+p[1]-1].slice(0,3)+" "+p[0] : ""; }
function phBacklog(){
  var h=[];
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Backlog</h1><p class="ph-sub">Ideas worth doing that are not goals yet. Put one here so it stops taking room in your head.</p></div>');
  h.push(phSeg("backlog"));
  if(state.backlog.length>4) h.push(phSearchBox("backlog","Search the backlog"));
  h.push('<div id="ph-list-body">'+phBacklogList()+'</div>');
  h.push('<div class="ph-dock"><button type="button" class="ph-btn ph-pri ph-wide" data-ph="bladd">Add an idea</button></div>');
  return h.join("");
}
function phBacklogList(){
  var l=state.backlog.filter(function(b){ return phHit("backlog",b.t); });
  if(!l.length) return '<p class="ph-empty">'+(state.backlog.length?"Nothing matches.":"Nothing waiting. Add the next idea with the button below.")+'</p>';
  return '<div class="ph-grp">'+l.map(function(b){
    var i=state.backlog.indexOf(b), g=b.goal;
    return '<button type="button" class="ph-rowb" data-ph="blitem" data-i="'+i+'"><span>'+esc(b.t)+'</span><span class="ph-rv"><span class="ph-v">'+
      esc(g?g.subs.length+(g.subs.length===1?" step":" steps")+" · "+groupPct(g)+"%":"Added "+phShortDate(b.d))+'</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>';
}
function phBlItem(i){
  var b=state.backlog[i]; if(!b) return;
  var g=b.goal;
  askUser({title:b.t, body:[g?"A goal with "+g.subs.length+(g.subs.length===1?" step":" steps")+", "+groupPct(g)+"% done, waiting here. Added "+phShortDate(b.d)+".":"An idea, added "+phShortDate(b.d)+"."],
    more:[["go",g?"Make it active":"Make it a goal"],["del","Remove it"]], noOk:true, cancel:"Close"}).then(function(v){
    if(v==="go"){
      var res=null; phUndoable((g?"Active again: ":"Now a goal: ")+phCut(b.t,36),function(){ res=backlogActivate(i); });
      if(res) phGoal(res.g.id);
    } else if(v==="del"){
      askUser({title:"Remove it?", body:[g?"“"+b.t+"” and its "+g.subs.length+" steps go.":"“"+b.t+"” goes."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
        if(yes) phUndoable("Removed: "+phCut(b.t,40),function(){ backlogRemove(i); });
      });
    }
  });
}
function phBlAdd(last){
  askUser({title:"Add an idea", body:[last?"Added “"+last+"”. Add the next, or press Done.":"Something for a free hour. It can become a goal later."],
    fields:[{k:"t",label:"The idea",kind:"text",mic:true,ph:"Say it or type it"}], ok:"Add", cancel:last?"Done":"Close",
    check:function(v){ return String(v.t||"").trim()?"":"Type or say the idea first."; }}).then(function(v){
    if(!v) return;
    var it=backlogAdd(v.t); save(); renderAll(); PH_DRAWN=""; phRender();
    if(it) phBlAdd(it.t);
  });
}
function phArchive(){
  var h=[];
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Archive</h1><p class="ph-sub">Finished goals, kept with their steps. Any of them can go back on the board.</p></div>');
  h.push(phSeg("archive"));
  if(state.archive.length>4) h.push(phSearchBox("archive","Search finished goals"));
  h.push('<div id="ph-list-body">'+phArchiveList()+'</div>');
  return h.join("");
}
function phArchiveList(){
  var l=state.archive.filter(function(g){ return phHit("archive",g.name); });
  if(!l.length) return '<p class="ph-empty">'+(state.archive.length?"Nothing matches.":"Nothing archived yet. Archive a finished goal from its Goal details.")+'</p>';
  return '<div class="ph-grp">'+l.map(function(g){
    return '<button type="button" class="ph-rowb" data-ph="aritem" data-id="'+esc(g.id)+'"><span>'+esc(g.name)+'</span><span class="ph-rv"><span class="ph-v">'+
      esc((g.archivedAt?phShortDate(g.archivedAt)+" · ":"")+groupPct(g)+"%")+'</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>';
}
function phArItem(id){
  var g=null; state.archive.forEach(function(x){ if(x.id===id) g=x; }); if(!g) return;
  askUser({title:g.name, body:[g.subs.length+(g.subs.length===1?" step, ":" steps, ")+groupPct(g)+"% done."+(g.archivedAt?" Archived "+phShortDate(g.archivedAt)+".":"")],
    more:[["back","Put it back on the board"]], noOk:true, cancel:"Close"}).then(function(v){
    if(v!=="back") return;
    phUndoable("Back on the board: "+phCut(g.name,32),function(){ unarchiveGoal(g.id); });
    phGoal(g.id);
  });
}
/* Tags: pick one or more; the goals that carry all of them show below. The
   pick is the phone page's own, so it never filters the board on a computer. */
function phTags(){
  var h=[], tags=allTags();
  PH_TAGS=PH_TAGS.filter(function(t){ return tags.some(function(x){ return x.t===t; }); });
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Tags</h1><p class="ph-sub">Pick tags to see the goals that carry all of them. A goal gets its tags in its Goal details.</p></div>');
  if(!tags.length){ h.push('<p class="ph-empty">No tags yet. Add up to five to any goal in its Goal details.</p>'); return h.join(""); }
  h.push('<div class="ph-chips" role="group" aria-label="Tags">'+tags.map(function(x){
    var gs=state.groups.filter(function(g){ return g.tags.indexOf(x.t)>=0; }), pct=gs.length?Math.round(gs.reduce(function(t,g){ return t+groupPct(g); },0)/gs.length):0;
    return '<button type="button" class="ph-tchip" data-ph="tagpick" data-t="'+esc(x.t)+'" aria-pressed="'+(PH_TAGS.indexOf(x.t)>=0)+'"><span>#'+esc(x.t)+'</span><span class="ph-tchip-n">'+x.n+' · '+pct+'%</span></button>';
  }).join("")+'</div>');
  var picked=PH_TAGS.length?state.groups.filter(function(g){ return PH_TAGS.every(function(t){ return g.tags.indexOf(t)>=0; }); }):[];
  h.push('<section aria-label="Goals with these tags"><div class="ph-row-h"><h2 class="ph-h2">'+(PH_TAGS.length?"Goals with "+(PH_TAGS.length===1?"this tag":"all of these"):"Goals")+'</h2></div>');
  if(!PH_TAGS.length) h.push('<p class="ph-empty">Pick a tag above.</p>');
  else if(!picked.length) h.push('<p class="ph-empty">No goal carries all of those tags.</p>');
  else h.push('<div class="ph-grp">'+picked.map(function(g){
    return '<button type="button" class="ph-rowb" data-ph="goal" data-id="'+esc(g.id)+'"><span>'+esc(g.name)+'</span><span class="ph-rv"><span class="ph-v">'+groupPct(g)+'%</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>');
  h.push('</section>');
  return h.join("");
}

/* ---- the Planner (2026-10-18) ----
   What the board may assume about an ordinary week, saved the moment it is
   changed, as on the board's Planner (same meSet and meDay). Then where each
   goal can be done, what is held back right now and why, and the interview. */
function phPlanner(){
  var me=state.me||freshMe(), h=[];
  function tm(k,lab,v){ return '<label class="ph-lab" for="ph-p-'+k+'">'+lab+'</label><input class="ph-in" type="time" id="ph-p-'+k+'" data-pme="'+k+'" value="'+esc(v||"")+'">'; }
  function sel(k,lab,list,v){ return '<label class="ph-lab" for="ph-p-'+k+'">'+lab+'</label><select class="ph-sel" id="ph-p-'+k+'" data-pme="'+k+'">'+phOpts(list,v)+'</select>'; }
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Planner</h1><p class="ph-sub">What the board may assume about an ordinary week. Changes are saved as you make them.</p></div>');
  h.push('<section class="ph-form" aria-label="Your week"><h2 class="ph-h2">Your week</h2>'+
    '<span class="ph-lab">Working days</span><div class="ph-segb" role="group" aria-label="Working days">'+
      DAYS_SHORT.map(function(n,i){ return '<button type="button" data-ph="pday" data-day="'+i+'" aria-pressed="'+(me.days.indexOf(i)>=0)+'" aria-label="'+esc(PH_DAYS[i])+'">'+esc(n.slice(0,2))+'</button>'; }).join("")+'</div>'+
    '<div class="ph-two"><div>'+tm("w0","Work starts",me.work[0])+'</div><div>'+tm("w1","Work ends",me.work[1])+'</div></div>'+
    '<div class="ph-two"><div>'+tm("rise","Your day starts at",me.rise||"07:00")+'</div><div>'+tm("wind","Your day ends at",me.wind)+'</div></div>'+
    tm("brief","Morning brief at",me.brief||"07:30")+'</section>');
  h.push('<section class="ph-form" aria-label="What matters"><h2 class="ph-h2">What matters</h2>'+
    '<label class="ph-lab" for="ph-p-north">The one thing that matters most right now</label><input class="ph-in" id="ph-p-north" data-pme="north" value="'+esc(me.north||"")+'" placeholder="Ship the tracker before the audit" enterkeyhint="done"></section>');
  h.push('<section aria-label="Which goals are work"><div class="ph-row-h"><h2 class="ph-h2">Which goals are work</h2></div>'+
    '<p class="ph-note">Work goals are suggested only in work hours, the others only outside them.</p>'+
    (state.groups.length?'<div class="ph-grp ph-wheres">'+state.groups.map(function(g){
      return '<label class="ph-where"><span>'+esc(g.name)+'</span><select class="ph-sel ph-sel-s" data-pwhere="'+esc(g.id)+'" aria-label="Is '+esc(g.name)+' work?">'+phOpts(WHERES.map(function(x){ return [x[0],x[1]]; }),g.where||"any")+'</select></label>';
    }).join("")+'</div>':'<p class="ph-empty">No goals yet.</p>')+'</section>');
  h.push('<section aria-label="Held back right now"><div class="ph-row-h"><h2 class="ph-h2">Held back right now</h2></div><div id="ph-held">'+phHeld()+'</div></section>');
  h.push('<div class="ph-grp">'+phRow("interview","Interview me again","")+'</div>');
  return h.join("");
}
function phHeld(){
  var c=nowCtx(), rows=[];
  state.groups.forEach(function(g){ if(groupPct(g)>=100) return; var f=feasible(g,c); if(!f.ok) rows.push([g.name,whereLabel(g.where)+" · "+f.why]); });
  return rows.length ? '<div class="ph-grp">'+rows.map(function(x){ return '<div class="ph-rowf ph-held"><span>'+esc(x[0])+'</span><span class="ph-v">'+esc(x[1])+'</span></div>'; }).join("")+'</div>'
    : '<p class="ph-empty">Nothing is held back. Everything can be worked on in this hour.</p>';
}
function phPlannerEdit(el){
  if(el.getAttribute("data-pwhere")){ var g=gById(el.getAttribute("data-pwhere")); if(g){ editGoal(g,"where",el.value); save(); renderAll(); } }
  else { meSet(el.getAttribute("data-pme"),el.value); save(); renderAll(); }
  var hd=$("#ph-held"); if(hd) hd.innerHTML=phHeld();
}

/* ---- Weekly check-in history (was "What the board learned", 2026-10-20) ----
   Only the check-ins are left on this page: kept on this phone, never read
   by the board's suggestions. */
function phLearned(){
  var h=[], wl=weekData().log;
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Weekly check-in</h1></div>');
  h.push('<section aria-label="Weekly check-in"><div class="ph-row-h"><h2 class="ph-h2">Your check-ins</h2><span class="ph-k">'+(wl.length?wl.length+" kept":"")+'</span></div>'+
    '<p class="ph-note">Five taps, 1 to 5, once a week if you like. Kept on this phone only. It is not a test and not advice.</p>'+
    '<div class="ph-grp">'+phRow("week","Check in",weekDue()?"Due":"Done this week")+
    wl.slice(-4).reverse().map(function(x){ var t=0; WEEK_ITEMS.forEach(function(it){ t+=+x[it[0]]||0; });
      return '<div class="ph-rowf"><span>Week '+esc(String(x.k).split("-W")[1]||x.k)+' · '+esc(phShortDate(x.d))+'</span><span class="ph-v">Average '+(Math.round(t/WEEK_ITEMS.length*10)/10)+' of 5</span></div>'; }).join("")+'</div>'+
    (wl.length?'<div class="ph-grp" style="margin-top:10px"><button type="button" class="ph-rowb ph-danger" data-ph="weekerase"><span>Delete my check-ins</span></button></div>':'')+'</section>');
  return h.join("");
}
/* press one of the board's own buttons, then draw this page again */
function phPress(sel){ var b=$(sel); if(b) b.click(); PH_DRAWN=""; phRender(); }
function phPressAsk(sel){ var b=$(sel); if(b) b.click(); var t=setInterval(function(){ if(!document.querySelector("dialog.ask[open]")){ clearInterval(t); PH_DRAWN=""; phRender(); } },150); }

/* ---- Journal ----
   Private and quiet on purpose (2026-10-18): the page shows that there are
   notes, never what they say. Yesterday's note is one closed card; Show opens
   it. Earlier days are rows; a day opens on its own page, where each entry can
   be edited or removed. Leaving the page closes everything again. */
function phJournal(){
  var h=[], c=jrCheckpoint();
  h.push('<div class="ph-head"><div><h1 class="ph-h1">Journal</h1><p class="ph-sub">Your checkpoint between days. Kept on this phone only.</p></div></div>');
  if(c){
    var s=jrSays(c);
    h.push('<section class="ph-card" aria-label="Where you left off"><div class="ph-row-h" style="padding:0"><div class="ph-k">Where you left off · '+esc(s.head)+'</div></div>'+
      (PH_JR_OPEN ? s.lines.map(function(t){ return '<p class="ph-line">'+esc(t)+'</p>'; }).join("")+
          '<button type="button" class="ph-link" data-ph="jrpeek" aria-expanded="true">Hide it</button>'
        : '<button type="button" class="ph-link" data-ph="jrpeek" aria-expanded="false">Show it</button>')+'</section>');
  }
  h.push('<div class="ph-two"><button type="button" class="ph-tile" data-ph="jr" data-kind="start"><span class="ph-k">Morning</span><span>Start of day</span></button>'+
    '<button type="button" class="ph-tile" data-ph="jr" data-kind="end"><span class="ph-k">Evening</span><span>End of day</span></button></div>');
  var days=jrDayList();
  h.push('<section aria-label="Earlier"><div class="ph-row-h"><h2 class="ph-h2">Earlier</h2><span class="ph-k">'+(days.length?days.length+(days.length===1?" day":" days"):"")+'</span></div>');
  if(!days.length) h.push('<p class="ph-empty">No entries yet. Start of day and End of day are above.</p>');
  else h.push('<div class="ph-grp">'+days.map(function(x){
    return '<button type="button" class="ph-rowb" data-ph="jday" data-d="'+esc(x.d)+'"><span>'+esc(jrDateLabel(x.d))+'</span><span class="ph-rv"><span class="ph-v">'+esc(jrDaySays(x))+'</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>');
  h.push('</section>');
  return h.join("");
}
/* one day: its entries, each with Edit and Remove */
function phJDay(){
  var d=phArg(), l=d?jrDayEntries(d):[], h=[];
  if(!l.length) return phJournal();
  h.push('<div style="min-width:0">'+phNav("#/journal","Journal")+'<h1 class="ph-h1">'+esc(jrDateLabel(d))+'</h1></div>');
  l.forEach(function(e){
    var K=JR_KINDS[e.kind]||JR_KINDS.end, ed=jrEdited(e);
    h.push('<section class="ph-card ph-jr-e" aria-label="'+esc(K.name+", "+e.tm)+'"><div class="ph-k">'+esc(e.tm+" · "+K.name+(ed?" · "+ed:""))+'</div>'+
      (e.a?'<p class="ph-line"><b>'+esc(K.a)+'</b> '+esc(e.a)+'</p>':'')+(e.b?'<p class="ph-line"><b>'+esc(K.b)+'</b> '+esc(e.b)+'</p>':'')+
      '<div class="ph-acts"><button type="button" class="ph-btn" data-ph="jredit" data-id="'+esc(e.id)+'">Edit</button>'+
      '<button type="button" class="ph-btn ph-danger" data-ph="jrdel" data-id="'+esc(e.id)+'">Remove</button></div></section>');
  });
  return h.join("");
}

/* ---- You ---- */
function phYou(){
  var h=[], me=state.me||freshMe(), c=remCfg(), who=(typeof acct!=="undefined"&&acct&&(acct.email||acct.uid))||"";
  var tags=allTags().length, rem=$("#btn-remind"), remOn=rem&&rem.getAttribute("aria-pressed")==="true";
  var th=(function(){ try{ return localStorage.getItem(THEME_KEY)||"system"; }catch(e){ return "system"; } })();
  var ph=phPhoto();
  /* the photo is a label for the file box: one tap opens the phone's picker */
  /* the picture is a second tap target for the same file box; a screen reader uses the Your photo row (2026-10-21) */
  h.push('<div class="ph-head ph-me"><label class="ph-av ph-av-b" for="ph-photo-in" aria-hidden="true">'+
    (ph?'<img src="'+esc(ph.src)+'" alt="">':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>'+
      '<span class="ph-av-plus" aria-hidden="true">+</span>')+
    '</label>'+
    '<input type="file" accept="image/*" id="ph-photo-in" class="ph-sr" aria-label="'+(ph?"Change your photo":"Add a photo of you")+'">'+
    '<div class="ph-me-t"><h1 class="ph-h1">You</h1><p class="ph-sub">'+(who?esc(who):"On this phone only")+'</p></div></div>');
  /* sign-in first: it is what carries the board to a second device (owner, 2026-10-19) */
  h.push('<div class="ph-grp">'+phRow("account",who?"Account":"Sign in",who?"":"Use the board on all your devices")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your photo</h2><div class="ph-grp">'+
    (ph ? '<label class="ph-rowb" for="ph-photo-in"><span>Change photo</span><span class="ph-rv">'+PH_CHEV+'</span></label>'+
          phRow("phshow","Show it on every page",ph.show?"On":"Off",true)+
          '<button type="button" class="ph-rowb ph-danger" data-ph="phdel"><span>Remove photo</span></button>'
        : '<label class="ph-rowb" for="ph-photo-in"><span>Add a photo</span><span class="ph-rv"><span class="ph-v">Kept on this phone only</span>'+PH_CHEV+'</span></label>')+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your work</h2><div class="ph-grid">'+
    phTile("#/goals","Goals",state.groups.length+" active")+phTile("#/backlog","Backlog",state.backlog.length+" ideas")+
    phTile("#/tags","Tags",tags+" in use")+phTile("#/archive","Archive",state.archive.length+" finished")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Your day</h2><div class="ph-grp">'+
    phRow("daystart","Day starts",clockLabel(me.rise||"07:00"))+
    phRow("dayend","Day ends",clockLabel(me.wind))+
    phRow("goodn","Steps on a good day",String(doseN("normal")))+
    phRow("aiok","Order suggestions by AI",me.aiOrderOk?"On":"Off",true)+
    phRow("learn","Learn from what I do",memLearnOn()?"On":"Off",true)+
    (TTS?phRow("readaloud","Read answers aloud",sayOn()?"On":"Off",true):"")+
    phRow("easyedit","My easy things",floorState().items.length?String(floorState().items.length):"Add")+
    phRow("remind","Reminders",remOn?((c.am?clockLabel(c.amAt):"")+(c.am&&c.pm?" and ":"")+(c.pm?clockLabel(c.pmAt):"")||"Both off"):"Off")+
    (remOn&&"Notification" in window&&Notification.permission==="granted"?phRow("remtest","Send a test reminder","",true):"")+
    phRow("planner","Work hours, days and more",clockLabel(me.work[0])+" to "+clockLabel(me.work[1]))+'</div>');
  h.push('<h2 class="ph-k ph-gk">Private</h2><div class="ph-grp">'+
    phRow("learned","Weekly check-in",weekDue()?"Due":"Done")+'</div>');
  h.push('<h2 class="ph-k ph-gk">Data and look</h2><div class="ph-grp">'+
    phRow("backup","Backup, restore and reset","")+phRow("theme","Theme",th.charAt(0).toUpperCase()+th.slice(1),true)+'</div>');
  return h.join("");
}
function phTile(href,t,s){ return '<a class="ph-tile" href="'+href+'"><span>'+esc(t)+'</span><span class="ph-k">'+esc(s)+'</span>'+PH_CHEV+'</a>'; }
/* a row that opens something has a chevron; one that switches at once (noChev) has not */
function phRow(k,t,v,noChev){
  /* a row that turns something on or off is a switch, the iOS way (HIG review 2, 2026-10-19) */
  if(noChev && (v==="On"||v==="Off"))
    return '<button type="button" class="ph-rowb" role="switch" aria-checked="'+(v==="On")+'" data-ph="'+k+'"><span>'+esc(t)+'</span><span class="ph-rv"><span class="ph-sr">'+v+'</span><span class="ph-switch" aria-hidden="true"></span></span></button>';
  return '<button type="button" class="ph-rowb" data-ph="'+k+'"><span>'+esc(t)+'</span><span class="ph-rv">'+(v?'<span class="ph-v">'+esc(v)+'</span>':"")+(noChev?"":PH_CHEV)+'</span></button>';
}
/* a reminder now, so the person sees how one looks on this phone: the same
   icon, badge and wording as the morning brief, sent from this page */
function phTestNote(){
  var t="A test from Qordel", o={body:"Reminders come like this, at most 2 a day.", tag:"oys-test", icon:"icon-192.png", badge:"badge-96.png"};
  var sent=function(){ toast("","Sent. Look at the top of the screen."); };
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.controller){
      navigator.serviceWorker.ready.then(function(reg){ return reg.showNotification(t,o); }).then(sent,function(){ toast("","This phone did not show it."); });
      return;
    }
    new Notification(t,o); sent();
  }catch(e){ toast("","This phone did not show it."); }
}
function phDayStart(){
  var me=state.me||freshMe();
  askUser({title:"When does your day start?", body:"Nothing reaches you before this time, and the board stays quiet until then.",
    fields:[{k:"t",label:"Day starts at",kind:"time",value:me.rise||"07:00"}], ok:"Save", cancel:"Not now",
    check:function(v){ var t=pTime(v.t); return !t?"Set a time.":phDayOrder(t,me.wind); }}).then(function(v){
    if(!v) return;
    try{ applySetting("day_start",v.t); }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}
/* a day starts before it ends; an end after midnight (00:30) is always later */
function phDayOrder(start,end){
  var a=hm(start), b=hm(end);
  return b>=4*60 && a>=b ? "Your day has to start before it ends at "+clockLabel(end)+"." : "";
}
function phDayEnd(){
  var me=state.me||freshMe();
  askUser({title:"When does your day end?", body:"Nothing reaches you after this time, and the board goes quiet.",
    fields:[{k:"t",label:"Day ends at",kind:"time",value:me.wind}], ok:"Save", cancel:"Not now",
    check:function(v){ var t=pTime(v.t); return !t?"Set a time.":phDayOrder(me.rise||"07:00",t); }}).then(function(v){
    if(!v) return;
    try{ applySetting("day_end",v.t); }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}

/* ---- Goals ---- */
function phGoals(){
  var h=[];
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Goals</h1></div>');
  h.push(phSeg("goals"));
  if(!state.groups.length) h.push('<p class="ph-empty">No goals yet. Press New goal, or say one in Talk.</p>');
  else {
    h.push('<ul class="ph-list ph-goals">');
    state.groups.forEach(function(g){
      var p=groupPct(g), nx=null;
      g.subs.forEach(function(id){ var s=state.subs[id]; if(!nx && s && s.status!=="done" && s.pct<100) nx=s; });
      h.push('<li><button type="button" class="ph-goal" data-ph="goal" data-id="'+esc(g.id)+'">'+
        '<span class="ph-goal-top"><span class="ph-goal-n">'+esc(g.name)+'</span><span class="ph-k">'+p+'%</span>'+PH_CHEV+'</span>'+
        '<span class="ph-bar"><span style="width:'+p+'%"></span></span>'+
        '<span class="ph-goal-x">'+(nx?"Next: "+esc(nx.name):"All steps done")+'</span></button></li>');
    });
    h.push('</ul>');
  }
  /* the one thing you come here to do sits at the bottom, under your thumb */
  h.push('<div class="ph-dock"><button type="button" class="ph-btn ph-pri ph-wide" data-ph="newgoal">New goal</button></div>');
  return h.join("");
}
function phGoal(id){ PH_GOAL=id; location.hash="#/goal/"+encodeURIComponent(id); }
function phStepGo(id){ var x=state.subs[id]; if(!x) return; PH_GOAL=x.gid; location.hash="#/step/"+encodeURIComponent(id); }
/* the id after the route, as in #/step/s12, so a reload or Back lands on the same thing */
function phArg(){ var m=String(location.hash||"").match(/^#\/[a-z]+\/(.+)$/); try{ return m?decodeURIComponent(m[1]):""; }catch(e){ return ""; } }
/* the small facts the classic row shows as pills, as one quiet line */
function phStepFacts(s){
  var b=[], st=statusOf(s);
  if(st.k!=="done") b.push(st.label);
  if(s.rep) b.push(repLabel(s.rep)+(s.streak?" · "+s.streak+"×":""));
  if(s.tag) b.push(s.tag);
  return b.join(" · ");
}
function phOpts(list,cur){
  return list.map(function(o){ return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(cur)?" selected":"")+'>'+esc(o[1])+'</option>'; }).join("");
}
function phSegb(k,list,cur,label){
  return '<div class="ph-segb" role="group" aria-label="'+esc(label)+'">'+
    list.map(function(o){ return '<button type="button" data-ph="sset" data-k="'+k+'" data-v="'+esc(o[0])+'" aria-pressed="'+(String(o[0])===String(cur))+'">'+esc(o[1])+'</button>'; }).join("")+'</div>';
}
/* one goal: its steps, each one tap from its own page, and a box to add the next */
function phGoalPage(){
  var g=gById(PH_GOAL); if(!g) return phGoals();
  var p=groupPct(g), n=daysLeft(g), h=[], open=[], fin=[], meta=[];
  g.subs.forEach(function(id){ var s=state.subs[id]; if(!s) return; (s.pct>=100||s.status==="done"?fin:open).push(s); });
  meta.push(n===null?"No delivery day":n<0?"Delivery day passed":"Delivery "+deliveryLabel(g));
  if(g.where==="work") meta.push("Work");
  h.push('<div style="min-width:0">'+phNav("#/goals","Goals")+'<h1 class="ph-h1" style="overflow-wrap:anywhere">'+esc(g.name)+'</h1></div>');
  h.push('<div><div class="ph-row-h" style="padding-bottom:4px"><span class="ph-k">'+p+'% done</span><span class="ph-k">'+esc(meta.join(" · "))+'</span></div>'+
    '<span class="ph-bar"><span style="width:'+p+'%"></span></span>'+
    ((g.tags||[]).length?'<p class="ph-note" style="margin-top:8px">'+esc(g.tags.map(function(t){ return "#"+t; }).join(" "))+'</p>':'')+'</div>');
  h.push('<section aria-label="Steps"><div class="ph-row-h"><h2 class="ph-h2">Steps</h2>'+
    (open.length>1?'<button type="button" class="ph-link" data-ph="aiorder" data-id="'+esc(g.id)+'">Suggest an order</button>':'')+'</div>'+
    (open.length>1?'<p class="ph-note ph-seqnote">Done from top to bottom. Drag the handle to change the order.</p>':''));
  if(!open.length&&!fin.length) h.push('<p class="ph-empty">No steps yet. Press Add a step.</p>');
  else {
    h.push('<ul class="ph-list ph-goals">');
    open.concat(fin).forEach(function(s,i){
      var dn=s.pct>=100||s.status==="done", fx=phStepFacts(s);
      var drag=!dn&&open.length>1;
      h.push('<li'+(drag?' class="ph-dli" data-sid="'+esc(s.id)+'"':'')+'><button type="button" class="ph-goal'+(dn?" is-done":"")+'" data-ph="step" data-id="'+esc(s.id)+'">'+
        '<span class="ph-goal-top"><span class="ph-goal-n">'+(dn?'':'<span class="ph-ord">'+(i+1)+'</span>')+esc(s.name)+'</span><span class="ph-k">'+(dn?"Done":s.pct+"%")+'</span>'+PH_CHEV+'</span>'+
        (dn?'':'<span class="ph-bar"><span style="width:'+s.pct+'%"></span></span>')+
        (fx?'<span class="ph-goal-x">'+esc(fx)+'</span>':'')+'</button>'+
        (drag?'<span class="ph-grip" aria-hidden="true">'+PH_GRIP+'</span>':'')+'</li>');
    });
    h.push('</ul>');
  }
  h.push('</section>');
  h.push('<div class="ph-grp">'+phRow("gedit","Goal details","")+'</div>');
  h.push('<div class="ph-dock"><button type="button" class="ph-btn ph-pri ph-wide" data-ph="addstep">Add a step</button></div>');
  return h.join("");
}
/* Add a step: a sheet from the bottom, with Speak, that comes back for the
   next one until you close it, so a list goes in quickly. */
function phAddStep(last){
  var g=gById(PH_GOAL); if(!g) return;
  askUser({title:"Add a step", body:[last?"Added \u201c"+last+"\u201d. Add the next, or press Done.":"In "+g.name+"."],
    fields:[{k:"n",label:"The step",kind:"text",mic:true,ph:"Say it or type it"},{k:"r",label:"Repeats",kind:"select",opts:REPEATS,value:""}],
    ok:"Add", cancel:last?"Done":"Close",
    check:function(v){ return String(v.n||"").trim()?"":"Type or say the step first."; }}).then(function(v){
    if(!v) return;
    var sb=addSub(g,v.n,v.r||""); PH_DRAWN=""; save(); renderAll();
    if(sb) phAddStep(sb.name);
  });
}
/* One step on its own page, with every field the classic editor has. Each
   change is saved the moment it is made, as on the board. The page is drawn
   once and then kept, so a background redraw never eats what is being typed;
   phStepRedraw draws it again after a change that moves other fields.    */
function phStepRedraw(){ PH_DRAWN=""; phRender(); }
function phStepPage(){
  var s=state.subs[phArg()]; if(!s) return PH_GOAL&&gById(PH_GOAL)?phGoalPage():phGoals();
  var g=gById(s.gid), h=[], w=whenMap()[s.id], e=estState().items[s.id], inT=state.oftad.some(function(c){ return c.id===s.id; });
  var opn=g?g.subs.filter(function(id){ var x=state.subs[id]; return x&&x.pct<100&&x.status!=="done"; }):[], oi=opn.indexOf(s.id);
  PH_GOAL=s.gid;
  h.push('<div style="min-width:0">'+phNav("#/goal/"+esc(encodeURIComponent(s.gid)),g?phCut(g.name,28):"Goal")+
    '<h1 class="ph-h1" id="ph-s-h" style="overflow-wrap:anywhere">'+esc(s.name)+'</h1></div>');
  h.push('<section class="ph-form" aria-label="This step">'+
    '<label class="ph-lab" for="ph-s-name">Name</label><input class="ph-in" id="ph-s-name" data-phed="name" value="'+esc(s.name)+'" enterkeyhint="done">'+
    '<span class="ph-lab">Status</span>'+phSegb("status",STATUSES,s.status==="done"||s.pct>=100?"done":s.status,"Status")+
    '<label class="ph-lab" for="ph-s-pct">Done: <output id="ph-s-pv" for="ph-s-pct">'+s.pct+'%</output></label>'+
    '<input class="ph-range" type="range" id="ph-s-pct" data-phed="pct" min="0" max="100" step="5" value="'+s.pct+'">'+
    (opn.length>1&&oi>=0?'<span class="ph-lab" id="ph-s-ordl">Order: step '+(oi+1)+' of '+opn.length+'</span>'+
      '<div class="ph-acts ph-ordb" role="group" aria-labelledby="ph-s-ordl"><button type="button" class="ph-btn" data-ph="sorder" data-d="-1"'+(oi===0?' disabled':'')+'>Earlier</button>'+
      '<button type="button" class="ph-btn" data-ph="sorder" data-d="1"'+(oi===opn.length-1?' disabled':'')+'>Later</button></div>':'')+
    '<label class="ph-lab" for="ph-s-rep">Repeats</label><select class="ph-sel" id="ph-s-rep" data-phed="rep">'+phOpts(REPEATS,s.rep||"")+'</select>'+
    '<label class="ph-lab" for="ph-s-tag">Tag</label><input class="ph-in" id="ph-s-tag" data-phed="tag" value="'+esc(s.tag||"")+'" placeholder="Planning" enterkeyhint="done">'+
    (state.groups.length>1?'<label class="ph-lab" for="ph-s-goal">Goal</label><select class="ph-sel" id="ph-s-goal" data-phmove="1">'+
      phOpts(state.groups.map(function(x){ return [x.id,x.name]; }),s.gid)+'</select>':'')+
    '<p class="ph-note" id="ph-s-msg" aria-live="polite">Changes are saved as you make them.</p></section>');
  h.push('<section class="ph-grp" aria-label="More for this step">'+
    phRow("seasy","Easy, good for a low-energy day",s.easy?"On":"Off",true)+
    '<button type="button" class="ph-rowb" data-ph="stoday"'+(inT?' disabled':'')+'><span>'+(inT?"In Today":"Put it in Today")+'</span></button>'+
    '<button type="button" class="ph-rowb" data-ph="swhen"><span>'+(w?"When":"When will you do it?")+'</span><span class="ph-v">'+(w?esc(phCut(w.t,24)):"")+'</span></button>'+
    '<button type="button" class="ph-rowb" data-ph="sest"><span>'+(e?"About how long":"How long will it take?")+'</span><span class="ph-v">'+(e?e.m+" min":"")+'</span></button>'+
    (s.status==="done"||s.pct>=100?'':'<button type="button" class="ph-rowb" data-ph="sdone"><span>Mark it done</span></button>')+
    '<button type="button" class="ph-rowb ph-danger" data-ph="sdel"><span>Remove this step</span></button></section>');
  return h.join("");
}
/* a field on the step page changed */
function phStepEdit(el){
  var s=state.subs[phArg()]; if(!s) return;
  if(el.getAttribute("data-phmove")){
    var to=gById(el.value);
    if(to && s.gid!==to.id){ phUndoable("Moved to "+phCut(to.name,36),function(){ moveSub(s.id,to.id); }); phStepRedraw(); var m=$("#ph-s-msg"); if(m) m.textContent="Moved to "+to.name+"."; }
    return;
  }
  var k=el.getAttribute("data-phed");
  if(!editSub(s,k,el.value)){ el.value=s[k]||""; var m2=$("#ph-s-msg"); if(m2) m2.textContent="A step needs a name."; return; }
  save(); renderAll();
  /* typing stays where it is; anything that moves other fields redraws the page */
  if(k==="name"){ var hd=$("#ph-s-h"); if(hd) hd.textContent=s.name; }
  else if(k!=="tag") phStepRedraw();
}
function phStepSet(k,v){
  var s=state.subs[phArg()]; if(!s) return;
  if(editSub(s,k,v)){ save(); renderAll(); phStepRedraw(); var b=document.querySelector('#ph-main [data-ph="sset"][data-k="'+k+'"][data-v="'+v+'"]'); if(b) b.focus(); }
}
function phRemoveStep(id){
  var s=state.subs[id]; if(!s) return;
  askUser({title:"Remove this step?", body:["“"+s.name+"” goes for good."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
    if(!yes) return;
    var gid=s.gid; phUndoable("Removed: "+phCut(s.name,40),function(){ removeSub(id); });
    if(phRoute()==="step") phGoal(gid);
  });
}
/* the goal: every field the classic goal editor has, and where it can go */
function phGoalEdit(){
  var g=gById(PH_GOAL); if(!g) return;
  askUser({title:"Goal", fields:[{k:"n",label:"Name",kind:"text",value:g.name},
      {k:"d",label:"Delivery day (leave empty for none)",kind:"date",value:g.due||""},
      {k:"w",label:"Is it work?",kind:"select",opts:WHERES.map(function(x){ return [x[0],x[1]]; }),value:g.where||"any"},
      {k:"t",label:"Tags, with commas between (up to 5)",kind:"text",value:(g.tags||[]).join(", ")}],
    ok:"Save", cancel:"Close", more:[["backlog","Move it to the Backlog"],["archive","Archive this goal"],["remove","Remove this goal"]],
    check:function(v){ return String(v.n||"").trim()?"":"Give the goal a name."; }}).then(function(v){
    if(!v) return;
    if(v==="archive"){ phUndoable("Archived: "+phCut(g.name,40),function(){ archiveGoal(g.id); }); return phGo("goals"); }
    if(v==="backlog"){ phUndoable("Moved to the Backlog: "+phCut(g.name,30),function(){ backlogGoal(g.id); }); return phGo("goals"); }
    if(v==="remove") return askUser({title:"Remove this goal?", body:["“"+g.name+"” and its "+g.subs.length+" steps go for good."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
      if(!yes) return; phUndoable("Removed: "+phCut(g.name,40),function(){ toolRun("remove_main_task",{main_task:g.name}); }); phGo("goals"); });
    if((v.d||"")!==(g.due||"")) editGoal(g,"due",v.d);
    if((v.w||"any")!==(g.where||"any")) editGoal(g,"where",v.w);
    if(v.t!==(g.tags||[]).join(", ")) editGoal(g,"tags",v.t);
    if(String(v.n).trim()!==g.name) editGoal(g,"name",v.n);
    PH_DRAWN=""; save(); renderAll();
  });
}
function phNewGoal(){
  askUser({title:"New goal", fields:[{k:"g",label:"The goal",kind:"text",ph:"For example: Finish the SAP migration"},{k:"s",label:"Its next step (optional)",kind:"text"}],
    ok:"Add it", cancel:"Not now", check:function(v){ return String(v.g||"").trim()?"":"Give the goal a name."; }}).then(function(v){
    if(!v) return;
    try{
      var gn=String(v.g).trim(); toolRun("add_main_task",{name:gn});
      if(String(v.s||"").trim()) toolRun("add_subtask",{main_task:gn,name:String(v.s).trim()});
    }catch(e){ toast("",e.message); }
    save(); renderAll();
  });
}

/* ---- onboarding: three screens ---- */
/* Value first (owner, 2026-10-19, from the Apple principles check): a first
   open is 2 screens, the welcome and the first goal, then Now with a real
   next step. The guide (the web interview's questions as phone screens:
   Your day with reminders, Your work, How you work, What matters most,
   Where each goal belongs) opens from a "Set up your week" card on Now,
   which stays until it is done so it is never overlooked. */
var PH_ONB_LAST=5;
function phDotsHtml(i){
  var n=PH_GUIDE?PH_ONB_LAST:2, at=PH_GUIDE?i-1:(i===0?0:1), o=[];
  for(var k=0;k<n;k++) o.push('<span class="ph-step'+(k===at?" on":"")+'"></span>');
  return '<div class="ph-steps" role="img" aria-label="Step '+(at+1)+' of '+n+'">'+o.join("")+'</div>';
}
/* one choice from a short list, as rows with a tick: the iOS way */
function phChoice(k,list,v,label){
  return '<div class="ph-grp" role="radiogroup" aria-label="'+esc(label)+'">'+list.map(function(o){
    return '<button type="button" class="ph-rowb ph-choice" role="radio" aria-checked="'+(v===o[0])+'" data-ph="onb-pick" data-k="'+k+'" data-v="'+esc(o[0])+'">'+
      '<span>'+esc(o[1])+(o[2]?'<span class="ph-choice-s">'+esc(o[2])+'</span>':'')+'</span><span class="ph-tick" aria-hidden="true"></span></button>';
  }).join("")+'</div>';
}
/* examples to tap (2026-10-21): a first goal without writing or speaking. A tap fills the goal, its
   first step and Is it work?; the words stay editable. Small, kind first steps, never a deadline. */
var PH_EX=[["Tidy the home","Clear one shelf","any"],["Get a bit fitter","A 10-minute walk","any"],
  ["Finish a work project","Write down what is left","work"],["Learn something new","Pick a short course","any"],
  ["Sort out my paperwork","Find last month\u2019s bills","any"],["Plan a trip","Pick a place to go","any"]];
function phExamples(v){
  return '<h2 class="ph-k ph-gk">Pick one to start</h2><div class="ph-exs" role="group" aria-label="Example goals">'+PH_EX.map(function(x,i){
    return '<button type="button" class="ph-ex" data-ph="onb-ex" data-i="'+i+'" aria-pressed="'+(v.goal===x[0]&&v.step===x[1])+'">'+
      '<span class="ph-ex-g">'+esc(x[0])+'</span><span class="ph-ex-s">'+esc(x[1])+'</span></button>';
  }).join("")+'</div>';
}
function phOnbHtml(){
  var v=PH_V;
  if(PH_ONB===0) return '<div class="ph-onb"><div class="ph-bt"><div class="ph-word">Qordel</div><div class="ph-by">Powered by OwnYourSystem</div></div>'+
    '<h1 class="ph-big">One step. In the right order.</h1>'+
    '<p class="ph-lede">A planner that adjusts to your day and shows what matters next. On a rough day it gets smaller. You always decide.</p>'+
    '<div class="ph-fill"></div>'+phDotsHtml(0)+
    '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Start</button>'+
    '<button type="button" class="ph-link ph-center" data-ph="restore">I have a board already: restore it</button></div>';
  if(PH_ONB===1){
    var tg=function(k){ return '<span class="ph-sw" role="group" aria-label="'+(k==="am"?"Morning brief":"Afternoon check")+'">'+
      '<button type="button" data-ph="tog" data-k="'+k+'" data-v="on" aria-pressed="'+(v[k]==="on")+'">On</button>'+
      '<button type="button" data-ph="tog" data-k="'+k+'" data-v="off" aria-pressed="'+(v[k]==="off")+'">Off</button></span>'; };
    return '<div class="ph-onb">'+(PH_GUIDE?'<button type="button" class="ph-link" data-ph="guide-later">Later</button>':'<button type="button" class="ph-link" data-ph="onb-back">Back</button>')+
      '<h1 class="ph-h1 ph-mt">Your day</h1><p class="ph-lede">When it starts and ends, and how it may remind you. The next screens fill in the rest.</p>'+
      '<div class="ph-grp"><label class="ph-rowf"><span>My day starts at</span><input class="ph-time" type="time" id="ph-start" value="'+esc(v.start)+'"></label>'+
      '<label class="ph-rowf"><span>My day ends at</span><input class="ph-time" type="time" id="ph-end" value="'+esc(v.end)+'"></label></div>'+
      '<p class="ph-note">Nothing reaches you before the start or after the end.</p>'+
      '<h2 class="ph-k ph-gk">Reminders, at most 2 a day</h2><div class="ph-grp">'+
      '<div class="ph-rowf"><span>Morning brief</span>'+tg("am")+'</div>'+
      '<label class="ph-rowf"><span class="ph-sub">at</span><input class="ph-time" type="time" id="ph-am" value="'+esc(v.amAt)+'"></label>'+
      '<div class="ph-rowf"><span>Afternoon check</span>'+tg("pm")+'</div>'+
      '<label class="ph-rowf"><span class="ph-sub">at</span><input class="ph-time" type="time" id="ph-pm" value="'+esc(v.pmAt)+'"></label></div>'+
      '<p class="ph-note" id="ph-onb-err" role="alert">Your phone asks for permission next. Change any of this later in You.</p>'+
      '<div class="ph-fill"></div>'+phDotsHtml(1)+
      '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Next</button></div>';
  }
  if(PH_ONB===2){
    return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
      '<h1 class="ph-h1 ph-mt">Your work</h1><p class="ph-lede">Roughly is fine. In work hours the board suggests only work goals; outside them, only the others.</p>'+
      '<span class="ph-lab">Working days</span><div class="ph-segb" role="group" aria-label="Working days">'+
        DAYS_SHORT.map(function(n,i){ return '<button type="button" data-ph="onb-day" data-day="'+i+'" aria-pressed="'+(v.days.indexOf(i)>=0)+'" aria-label="'+esc(PH_DAYS[i])+'">'+esc(n.slice(0,2))+'</button>'; }).join("")+'</div>'+
      '<div class="ph-grp"><label class="ph-rowf"><span>Work starts</span><input class="ph-time" type="time" id="ph-w0" value="'+esc(v.w0)+'"></label>'+
      '<label class="ph-rowf"><span>Work ends</span><input class="ph-time" type="time" id="ph-w1" value="'+esc(v.w1)+'"></label></div>'+
      '<p class="ph-note" id="ph-onb-err" role="alert">No fixed work? Turn every day off.</p>'+
      '<div class="ph-fill"></div>'+phDotsHtml(2)+
      '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Next</button></div>';
  }
  if(PH_ONB===3){
    var ez=[0,1,2].map(function(i){ return '<label class="ph-lab" for="ph-easy'+i+'">Easy thing '+(i+1)+'</label><input class="ph-in" id="ph-easy'+i+'" maxlength="60" value="'+esc((v.easy||[])[i]||"")+'" placeholder="'+["Listen to an audiobook","Read before sleep","A short walk"][i]+'">'; }).join("");
    return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
      '<h1 class="ph-h1 ph-mt">When your energy is low</h1><p class="ph-lede">What do you do then? On a very low day, or at the end of your day, the board shows these instead of a task. One of them counts the day.</p>'+
      ez+'<p class="ph-note">You can leave them empty and add them later on You.</p>'+
      '<div class="ph-fill"></div>'+phDotsHtml(3)+
      '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Next</button></div>';
  }
  if(PH_ONB===4){
    return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
      '<h1 class="ph-h1 ph-mt">What matters most</h1><p class="ph-lede">One line about the thing that matters most right now. When you and the board disagree, this is what it shows you.</p>'+
      '<label class="ph-lab" for="ph-north">The one thing</label><input class="ph-in" id="ph-north" maxlength="120" value="'+esc(v.north)+'" placeholder="For example: Ship the tracker before the audit" enterkeyhint="next">'+
      '<button type="button" class="ph-mic" data-ph="mic" data-for="ph-north" aria-pressed="false">'+PH_MIC+'<span>Speak</span></button>'+
      '<p class="ph-note" id="ph-onb-hint" aria-live="polite">You can leave it empty and add it later in Planner.</p>'+
      '<div class="ph-fill"></div>'+phDotsHtml(4)+
      '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-next">Next</button></div>';
  }
  if(PH_GUIDE){
    return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
      '<h1 class="ph-h1 ph-mt">Which goals are work</h1><p class="ph-lede">Work goals are suggested only in work hours, the others only outside them. The board guessed; correct it.</p>'+
      (state.groups.length?'<div class="ph-grp">'+state.groups.map(function(g){
        var w=v.wh[g.id]||g.where||"any";
        return '<label class="ph-rowf ph-where"><span>'+esc(g.name)+'</span><select class="ph-sel" data-onb-where="'+esc(g.id)+'" aria-label="Is '+esc(g.name)+' work?">'+
          WHERES.map(function(o){ return '<option value="'+o[0]+'"'+(w===o[0]?" selected":"")+'>'+esc(o[1])+'</option>'; }).join("")+'</select></label>';
      }).join("")+'</div>':'<p class="ph-empty">No goals yet. Add them on Goals.</p>')+
      '<div class="ph-fill"></div>'+phDotsHtml(5)+
      '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="guide-done">Done</button></div>';
  }
  return '<div class="ph-onb"><button type="button" class="ph-link" data-ph="onb-back">Back</button>'+
    '<h1 class="ph-h1 ph-mt">What are you working on?</h1><p class="ph-lede">One goal and its next step. Pick an example, say it or type it. You can change it later.</p>'+
    phExamples(v)+
    '<label class="ph-lab" for="ph-goal">Or your own goal</label><input class="ph-in" id="ph-goal" value="'+esc(v.goal)+'" placeholder="For example: Finish the SAP migration">'+
    '<button type="button" class="ph-mic" data-ph="mic" data-for="ph-goal" aria-pressed="false">'+PH_MIC+'<span>Speak</span></button>'+
    '<label class="ph-lab" for="ph-step">Its next step</label><input class="ph-in" id="ph-step" value="'+esc(v.step)+'" placeholder="For example: Map the old reports">'+
    '<button type="button" class="ph-mic" data-ph="mic" data-for="ph-step" aria-pressed="false">'+PH_MIC+'<span>Speak</span></button>'+
    '<h2 class="ph-h2 ph-mt">Is it work?</h2>'+phChoice("where",WHERES,v.where,"Is it work?")+
    '<p class="ph-note" id="ph-onb-hint" aria-live="polite">Your board stays on this phone. An account to carry it to a second device is optional, in You.</p>'+
    '<div class="ph-fill"></div>'+phDotsHtml(5)+
    '<button type="button" class="ph-btn ph-pri ph-wide" data-ph="onb-done">Show me today</button>'+
    '<button type="button" class="ph-link ph-center" data-ph="onb-skip">Skip for now</button></div>';
}
function phOnbRead(){
  var g=function(id){ var e=document.getElementById(id); return e?e.value:null; }, x;
  if((x=g("ph-start"))!==null) PH_V.start=x;
  if((x=g("ph-end"))!==null) PH_V.end=x;
  if((x=g("ph-am"))!==null) PH_V.amAt=x;
  if((x=g("ph-pm"))!==null) PH_V.pmAt=x;
  if((x=g("ph-w0"))!==null) PH_V.w0=x;
  if((x=g("ph-w1"))!==null) PH_V.w1=x;
  if(document.getElementById("ph-easy0")) PH_V.easy=[0,1,2].map(function(i){ return g("ph-easy"+i)||""; });
  if((x=g("ph-north"))!==null) PH_V.north=x;
  Array.prototype.forEach.call(document.querySelectorAll("[data-onb-where]"),function(s){ PH_V.wh[s.getAttribute("data-onb-where")]=s.value; });
  if((x=g("ph-goal"))!==null) PH_V.goal=x;
  if((x=g("ph-step"))!==null) PH_V.step=x;
}
function phOnbStep(i){ phOnbRead(); PH_ONB=Math.max(PH_GUIDE?1:0,Math.min(PH_ONB_LAST,i)); PH_DRAWN=""; phRender(); scrollTo(0,0); }
/* Your work is checked before it moves on: hours in order */
function phOnbWork(){
  phOnbRead();
  var v=PH_V, err=$("#ph-onb-err"), a=pTime(v.w0), b=pTime(v.w1);
  if(v.days.length && (!a||!b)){ if(err) err.textContent="Set when work starts and ends."; return; }
  if(v.days.length && hm(a)>=hm(b)){ if(err) err.textContent="Work has to start before it ends."; return; }
  phOnbStep(3);
}
/* what the guide learned goes into the profile, in one place */
function phOnbApply(me){
  var v=PH_V;
  me.days=v.days.slice().sort(); if(pTime(v.w0)&&pTime(v.w1)) me.work=[pTime(v.w0),pTime(v.w1)];
  me.north=String(v.north||"").trim().slice(0,120); me.guided=true;
  if(v.easy && v.easy.some(function(x){ return String(x).trim(); })){
    var keep=floorState().items.slice(3).map(function(x){ return x.t; });
    try{ floorSet(v.easy.concat(keep)); }catch(er){}
  }
}
/* the guide for someone who set up before it existed: their own answers to start from */
function phGuideOpen(){
  var me=state.me||freshMe(), c=remCfg();
  PH_V.days=me.days.slice(); PH_V.w0=me.work[0]; PH_V.w1=me.work[1];
  PH_V.north=me.north||""; PH_V.wh={}; PH_V.easy=floorState().items.slice(0,3).map(function(x){ return x.t; });
  PH_V.start=me.rise||"07:00"; PH_V.end=me.wind; PH_V.am=c.am?"on":"off"; PH_V.pm=c.pm?"on":"off"; PH_V.amAt=c.amAt; PH_V.pmAt=c.pmAt;
  PH_GUIDE=true; PH_ONB=1; PH_DRAWN=""; phRender(); scrollTo(0,0);
}
function phGuideDone(){
  phOnbRead();
  var me=state.me||(state.me=freshMe());
  phOnbApply(me);
  state.groups.forEach(function(g){ if(PH_V.wh[g.id]) g.where=PH_V.wh[g.id]; });
  PH_GUIDE=false; PH_ONB=0; PH_DRAWN="";
  save(); renderAll(); phGo("now");
  toast("","That is enough to go on. The board will plan around it.");
}
function phOnbDay(){
  phOnbRead();
  var me=state.me||(state.me=freshMe()), v=PH_V, err=$("#ph-onb-err");
  if(!pTime(v.start)){ if(err) err.textContent="Set the time your day starts."; return; }
  if(!pTime(v.end)){ if(err) err.textContent="Set the time your day ends."; return; }
  var ord=phDayOrder(pTime(v.start),pTime(v.end)); if(ord){ if(err) err.textContent=ord; return; }
  me.rise=pTime(v.start); me.wind=pTime(v.end);
  var bad=remCheck({am:v.am,amAt:v.amAt,pm:v.pm,pmAt:v.pmAt});
  if(bad){ if(err) err.textContent=bad; return; }
  remApply({am:v.am,amAt:v.amAt,pm:v.pm,pmAt:v.pmAt});
  if((v.am==="on"||v.pm==="on") && ("Notification" in window) && Notification.permission!=="denied"){
    var go=function(r){ if(r==="granted"){ remindSet(true); remindState(); pushStart(); } };
    if(Notification.permission==="granted") go("granted");
    else { try{ var q=Notification.requestPermission(); if(q&&q.then) q.then(go); }catch(e){} }
  }
  /* the guide saves Your day as it goes, so Later keeps it */
  if(PH_GUIDE) save();
  phOnbStep(2);
}
function phOnbFinish(add){
  phOnbRead();
  var me=state.me||(state.me=freshMe());
  if(add){
    var gn=String(PH_V.goal||"").trim(), sn=String(PH_V.step||"").trim();
    if(gn){ try{ toolRun("add_main_task",{name:gn}); if(sn) toolRun("add_subtask",{main_task:gn,name:sn});
      var ng=state.groups.filter(function(g){ return g.name===gn; }).pop(); if(ng) ng.where=PH_V.where; }catch(e){} }
  }
  /* the guide comes next, from the card on Now */
  me.done=true; PH_ONB=0; PH_DRAWN="";
  save(); renderAll(); phGo("now");
}

/* ---- one listener for every press in the phone ---- */
(function(){
  var root=$("#ph"); if(!root) return;
  root.addEventListener("click",function(e){
    var b=e.target.closest("[data-ph]"); if(!b) return;
    var k=b.getAttribute("data-ph"), id=b.getAttribute("data-id");
    if(k==="energy") phEnergyAsk();
    else if(k==="seasy"){ var es=state.subs[phArg()]; if(es){ editSub(es,"easy",es.easy?"":"1"); save(); renderAll(); phStepRedraw(); var sb=document.querySelector("[data-ph=seasy]"); if(sb) sb.focus(); } }
    else if(k==="done") phDone(id);
    else if(k==="later"){ var ls=state.subs[id]; if(ls) phUndoable("Another day: "+phCut(ls.name,40),function(){ toolRun("plan_today",{subtask:ls.name}); }); }
    else if(k==="take"){ var ts=state.subs[id]; phUndoable("Started: "+phCut(ts?ts.name:"",40),function(){ takePick(id); }); }
    else if(k==="reopen") phReopen(id);
    else if(k==="jropen") PH_JR_OPEN=true;
    else if(k==="bladd") phBlAdd("");
    else if(k==="blitem") phBlItem(+b.getAttribute("data-i"));
    else if(k==="aritem") phArItem(id);
    else if(k==="tagpick"){ var tg=b.getAttribute("data-t"), ti=PH_TAGS.indexOf(tg); if(ti>=0) PH_TAGS.splice(ti,1); else PH_TAGS.push(tg); PH_DRAWN=""; phRender(); var tb=document.querySelector('[data-ph=tagpick][data-t="'+(window.CSS&&CSS.escape?CSS.escape(tg):tg)+'"]'); if(tb) tb.focus(); }
    else if(k==="pday"){ var on=meDay(+b.getAttribute("data-day")); save(); renderAll(); b.setAttribute("aria-pressed",on?"true":"false"); var hd=$("#ph-held"); if(hd) hd.innerHTML=phHeld(); }
    else if(k==="interview") $("#pl-interview").click();
    else if(k==="learned") phGo("learned");
    else if(k==="weekerase") phPressAsk("#week-erase");
    else if(k==="phshow"){ var pp=phPhoto(); if(pp){ pp.show=!pp.show; phPhotoSave(pp); PH_DRAWN=""; phRender(); var sb=$("[data-ph=phshow]"); if(sb) sb.focus(); } }
    else if(k==="phdel") askUser({title:"Remove your photo?", body:["It goes from this phone. You can add one again at any time."], ok:"Remove it", cancel:"Keep it", danger:true})
      .then(function(yes){ if(yes){ phPhotoSave(null); PH_DRAWN=""; phRender(); } });
    else if(k==="jrpeek"){ PH_JR_OPEN=!PH_JR_OPEN; PH_DRAWN=""; phRender(); var pk=$("[data-ph=jrpeek]"); if(pk) pk.focus(); }
    else if(k==="jday") location.hash="#/jday/"+encodeURIComponent(b.getAttribute("data-d"));
    else if(k==="jredit") jrEditAsk(id).then(function(){ PH_DRAWN=""; phRender(); });
    else if(k==="jrdel") jrRemoveAsk(id).then(function(gone){ if(gone && phRoute()==="jday" && !jrDayEntries(phArg()).length) location.hash="#/journal"; else { PH_DRAWN=""; phRender(); } });
    else if(k==="col"){ var rd=$("#ph-cols-read"); if(rd) rd.textContent=b.getAttribute("data-say"); }
    else if(k==="skip"){ var sk=state.subs[id]; if(sk) phUndoable("Skipped for today: "+phCut(sk.name,36),function(){ skipPick(id); }); }
    else if(k==="easytick"){ try{ floorToggle(id); }catch(er){ toast("",er.message); } save(); renderAll(); PH_DRAWN=""; phRender(); var et=document.querySelector('[data-ph="easytick"][data-id="'+id+'"]'); if(et) et.focus(); }
    else if(k==="easyedit") floorAsk();
    else if(k==="jr") jrAsk(b.getAttribute("data-kind"));
    else if(k==="account") $("#btn-account").click();
    else if(k==="daystart") phDayStart();
    else if(k==="dayend") phDayEnd();
    else if(k==="goodn") phGoodN();
    else if(k==="aiorder") phAiOrder(id);
    else if(k==="learnkeep"||k==="learnno"){ try{ if(k==="learnkeep") memKeep(id); else memDrop(id,true); }catch(er){ memDrop(id,false); toast("",er.message); }
      save(); renderAll(); PH_DRAWN=""; phRender(); }
    else if(k==="wnok") wnDone();
    else if(k==="readaloud"){ var rme=state.me||(state.me=freshMe()); if(sayOn()){ delete rme.readAloud; sayStop(); } else rme.readAloud=true;
      save(); renderAll(); PH_DRAWN=""; phRender(); var rb=document.querySelector("[data-ph=readaloud]"); if(rb) rb.focus(); }
    else if(k==="learn"){ var lme=state.me||(state.me=freshMe()); lme.learn=!memLearnOn(); if(lme.learn) delete lme.learn;
      save(); renderAll(); PH_DRAWN=""; phRender(); var lb=document.querySelector("[data-ph=learn]"); if(lb) lb.focus(); }
    else if(k==="aiok"){ var am=state.me||(state.me=freshMe());
      if(am.aiOrderOk){ delete am.aiOrderOk; save(); renderAll(); PH_DRAWN=""; phRender(); var ab=document.querySelector("[data-ph=aiok]"); if(ab) ab.focus(); }
      else phAiConsent().then(function(){ renderAll(); PH_DRAWN=""; phRender(); var ab2=document.querySelector("[data-ph=aiok]"); if(ab2) ab2.focus(); }); }
    else if(k==="missnew") phMissNew(id);
    else if(k==="missoff"){ var mo=gById(id); if(mo) phUndoable("No date for "+phCut(mo.name,36),function(){ editGoal(mo,"due",""); }); }
    else if(k==="misskeep"){ var mk=gById(id); if(mk){ mk.missAsk=mk.due; save(); renderAll(); PH_DRAWN=""; phRender(); } }
    else if(k==="remind") $("#btn-remind").click();
    else if(k==="remtest") phTestNote();
    else if(k==="planner") phGo("planner");
    else if(k==="week"){ var wp=weekAsk(); if(wp && wp.then) wp.then(function(){ if(phRoute()==="learned"){ PH_DRAWN=""; phRender(); } }); }
    else if(k==="backup") $("#btn-backup").click();
    else if(k==="bknow"){ $("#btn-backup").click(); var sv=$("#io-save"); if(sv) try{ sv.focus(); }catch(er){} }
    else if(k==="bklater"){ bkLater(); PH_DRAWN=""; phRender(); }
    else if(k==="theme"){ $("#btn-theme").click(); PH_DRAWN=""; phRender(); phBarColour(); }
    else if(k==="goal") phGoal(id);
    else if(k==="step") phStepGo(id);
    else if(k==="sset") phStepSet(b.getAttribute("data-k"),b.getAttribute("data-v"));
    else if(k==="sorder"){ var os=state.subs[phArg()], od=+b.getAttribute("data-d"); if(os&&phUndoable("Moved "+(od<0?"earlier":"later")+": "+phCut(os.name,32),function(){ return moveSubOrder(os.id,od); })){ phStepRedraw(); var ob=document.querySelector('#ph-main [data-ph="sorder"][data-d="'+od+'"]'); if(ob&&!ob.disabled) ob.focus(); else { ob=document.querySelector('#ph-main [data-ph="sorder"]:not([disabled])'); if(ob) ob.focus(); } var om=$("#ph-s-msg"); if(om) om.textContent="Moved "+(od<0?"earlier":"later")+"."; } }
    else if(k==="stoday"||k==="swhen"||k==="sest"||k==="sdone"||k==="sdel"){
      var cs=state.subs[phArg()]; if(!cs) return;
      if(k==="stoday"){ try{ toolRun("focus_today",{subtask:cs.name}); }catch(er){ toast("",er.message); } save(); renderAll(); phStepRedraw(); }
      else if(k==="swhen") whenAsk(cs.id).then(phStepRedraw);
      else if(k==="sest") estAsk(cs.id).then(phStepRedraw);
      else if(k==="sdone"){ phDone(cs.id); phStepRedraw(); }
      else phRemoveStep(cs.id);
    }
    else if(k==="addstep") phAddStep("");
    else if(k==="gedit") phGoalEdit();
    else if(k==="newgoal") phNewGoal();
    else if(k==="restore") $("#btn-backup").click();
    else if(k==="onb-next"){ if(PH_ONB===0) phOnbStep(PH_GUIDE?1:PH_ONB_LAST); else if(PH_ONB===1) phOnbDay(); else if(PH_ONB===2) phOnbWork(); else phOnbStep(PH_ONB+1); }
    else if(k==="onb-day"){ var dd=+b.getAttribute("data-day"), di=PH_V.days.indexOf(dd); if(di>=0) PH_V.days.splice(di,1); else PH_V.days.push(dd); b.setAttribute("aria-pressed",di<0?"true":"false"); }
    else if(k==="onb-pick"){ var pk=b.getAttribute("data-k"); PH_V[pk]=b.getAttribute("data-v");
      Array.prototype.forEach.call(document.querySelectorAll('[data-ph=onb-pick][data-k="'+pk+'"]'),function(x){ x.setAttribute("aria-checked",x===b?"true":"false"); }); }
    else if(k==="guide") phGuideOpen();
    else if(k==="guide-done") phGuideDone();
    else if(k==="guide-later"){ phOnbRead(); var gm=state.me||freshMe(); gm.guideLater=todayStr(); PH_GUIDE=false; PH_ONB=0; PH_DRAWN=""; save(); phGo("now"); }
    else if(k==="onb-back") phOnbStep(!PH_GUIDE&&PH_ONB===PH_ONB_LAST?0:PH_ONB-1);
    else if(k==="onb-done") phOnbFinish(true);
    else if(k==="onb-ex"){ var xi=+b.getAttribute("data-i"), ex=PH_EX[xi];
      if(ex){ phOnbRead(); PH_V.goal=ex[0]; PH_V.step=ex[1]; PH_V.where=ex[2]; PH_DRAWN=""; phRender();
        var nb=document.querySelector('[data-ph="onb-ex"][data-i="'+xi+'"]'); if(nb) nb.focus();
        var hn=$("#ph-onb-hint"); if(hn) hn.textContent="Filled in: "+ex[0]+", and first "+ex[1].charAt(0).toLowerCase()+ex[1].slice(1)+". Change the words if you like."; } }
    else if(k==="onb-skip") phOnbFinish(false);
    else if(k==="tog"){ phOnbRead(); PH_V[b.getAttribute("data-k")]=b.getAttribute("data-v"); PH_DRAWN=""; phRender(); }
    else if(k==="mic"){ var el=document.getElementById(b.getAttribute("data-for")); if(el) micInto(el,b,function(t){ var n=$("#ph-onb-hint"); if(n) n.textContent=t; }); }
  });
  root.addEventListener("keydown",function(e){
    if(e.key!=="Enter" || !e.target) return;
    if(e.target.getAttribute && (e.target.getAttribute("data-phed")||e.target.getAttribute("data-pme"))){ e.preventDefault(); e.target.blur(); }
  });
  root.addEventListener("change",function(e){ var t=e.target;
    if(t && t.id==="ph-photo-in"){ phPhotoFile(t.files&&t.files[0]); t.value=""; return; }
    if(t && t.getAttribute && (t.getAttribute("data-pme")||t.getAttribute("data-pwhere"))){ phPlannerEdit(t); return; } if(t && t.getAttribute && (t.getAttribute("data-phed")||t.getAttribute("data-phmove"))) phStepEdit(t); });
  root.addEventListener("input",function(e){
    if(e.target && e.target.id==="ph-q"){ var qr=e.target.getAttribute("data-r"); PH_Q[qr]=e.target.value; var lb=$("#ph-list-body"); if(lb) lb.innerHTML=qr==="archive"?phArchiveList():phBacklogList(); return; } if(e.target && e.target.id==="ph-s-pct"){ var o=$("#ph-s-pv"); if(o) o.textContent=e.target.value+"%"; } });
  addEventListener("hashchange",function(){ if(PH_ON){ if(phRoute()!=="journal") PH_JR_OPEN=false; PH_DRAWN=""; phRender(); scrollTo(0,0); } });
  setInterval(function(){ var c=document.getElementById("ph-clock"); if(c && PH_ON) c.textContent=phClock(new Date()); },1000);
  var ub=$("#ph-undo-b"); if(ub) ub.addEventListener("click",phUndo);
  var db=$("#dk-undo-b"); if(db) db.addEventListener("click",phUndo);
  /* A swipe in from the left edge goes Back, as in every iPhone app. Only
     the app opened from the home screen needs this: in a browser tab, Safari
     and Chrome have their own edge swipe, and two Backs would fight. It only
     starts within 24px of the edge, follows the finger, and needs 80px to
     count; a mostly vertical move is a scroll and lets go. Back stays a
     visible link at the top, so the swipe is a shortcut, never the only way. */
  var sw=null;
  function phStandalone(){ return navigator.standalone===true || !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches); }
  function swEl(){ return PH_OLD[phRoute()] ? document.querySelector(".wrap") : $("#ph-main"); }
  function swReset(){ var el=swEl(); if(el){ el.style.transform=""; el.style.transition=""; } sw=null; }
  document.addEventListener("touchstart",function(e){
    sw=null;
    if(!PH_ON || !phStandalone() || e.touches.length!==1 || document.querySelector("dialog.ask[open]") || !phParent()) return;
    var t=e.touches[0]; if(t.clientX>24) return;
    sw={x:t.clientX, y:t.clientY, dx:0, live:false};
  },{passive:true});
  document.addEventListener("touchmove",function(e){
    if(!sw) return;
    var t=e.touches[0], dx=t.clientX-sw.x, dy=t.clientY-sw.y;
    if(!sw.live){ if(Math.abs(dy)>Math.abs(dx)){ swReset(); return; } if(dx<8) return; sw.live=true; }
    sw.dx=Math.max(0,dx);
    var el=swEl(), still=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(el && !still){ el.style.transition="none"; el.style.transform="translateX("+Math.round(sw.dx*0.6)+"px)"; }
  },{passive:true});
  document.addEventListener("touchend",function(){
    if(!sw) return;
    var go=sw.live && sw.dx>80 ? phParent() : "";
    swReset(); if(go) location.hash=go;
  },{passive:true});
  document.addEventListener("touchcancel",swReset,{passive:true});
  if(PH_MQ){ if(PH_MQ.addEventListener) PH_MQ.addEventListener("change",phSet); else if(PH_MQ.addListener) PH_MQ.addListener(phSet); }
  phSet();
})();
