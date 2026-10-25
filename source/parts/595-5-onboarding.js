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
    '<label class="ph-lab" for="ph-goal">Or your own goal</label><input class="ph-in" id="ph-goal" value="'+esc(v.goal)+'" placeholder="For example: Finish the quarterly report">'+
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
    else if(k==="calendar") phGo("calendar");
    else if(k==="classic") phWebSet(false);
    else if(k==="tour") location.hash="#/tour/1";
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
