/* ---------------- the morning brief ----------------
   One notification a day, at the time you set, carrying the decision rather
   than a list: the task, why it and not the next one, and what is held back
   until later. A second one in the afternoon says what is still open.

   The honest limit: this fires while the board is running, whether that is
   a tab or the app on a home screen. Nothing here can wake a phone that has
   the app fully closed, because that needs a push server holding a key for
   every device, and this board keeps everything in your own browser. Opening
   it in the morning is what triggers it, and it still fires if it was left
   open overnight.                                                        */
function briefText(){
  var v=verdict();
  if(v.none||!v.s) return {t:"Nothing this morning", b:"Everything that can be done in this hour is done, blocked or already picked up."};
  var held=(v.blocked||[])[0];
  return {
    t: v.s.name,
    b: verdictWhy(v) + (held ? "\n\nHeld back: " + held.g.name + ", " + held.why + "." : "")
  };
}
function fire(title,body,tag){
  /* a reminder stays until the person closes it, and never holds the board */
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.ready && navigator.serviceWorker.controller){
      navigator.serviceWorker.ready.then(function(reg){
        reg.showNotification(title,{body:body,tag:tag,icon:"icon-192.png",badge:"badge-96.png",requireInteraction:true});
      }).catch(function(){ new Notification(title,{body:body,tag:tag,requireInteraction:true}); });
      return;
    }
    new Notification(title,{body:body,tag:tag,requireInteraction:true});
  }catch(e){}
}
function checkRemind(at){
  if(!("Notification" in window)||Notification.permission!=="granted") return;
  var me=state.me||freshMe(), c=remCfg(), now=at instanceof Date ? at : new Date(), mins=now.getHours()*60+now.getMinutes();
  /* Nothing is sent after the day is meant to be over. The board says the day
     has an end, so its notifications respect it too. */
  if(outsideDay(me, mins)) return;
  var today=todayStr();
  if(!state.told||state.told.d!==today) state.told={d:today, am:false, pm:false, hint:false};

  /* the morning one, if the person turned it on, any time from their time onwards, once */
  if(c.am && !state.told.am && me.done && mins>=hm(c.amAt)){
    state.told.am=true; save();
    var br=briefText();
    fire("Today: "+br.t, br.b, "oys-brief");
    return;
  }
  /* and the afternoon check on what was actually taken on, at the person's time */
  var open=state.oftad;                              /* Today only: Waiting is not today's job */
  if(c.pm && !state.told.pm && mins>=hm(c.pmAt) && open.length){
    state.told.pm=true; save();
    fire("Still open", open.length+" still open: "+open.slice(0,3).map(cardName).join(", "), "oys-today");
  }
}
/* ---- the person sets the reminders ----
   Which of the two come, and when, is the person's choice (owner, 2026-10-15).
   Both start on, at 07:30 and 15:00, until the person changes them; neither
   comes before Reminders is turned on in the browser.                       */
function remCfg(){
  var me=state.me||freshMe();
  return {am:me.remAm!==false, pm:me.remPm!==false, amAt:me.brief||"07:30", pmAt:me.pmAt||"15:00"};
}
/* The push server knows when the day ends but not when it starts, so a
   reminder never waits on it: when the start moves past a reminder time,
   the reminder moves to the start, and the person is told.              */
function remFitDay(me){
  var r=me.rise||"07:00", out=[];
  if(beforeDayStart(me,hm(me.brief||"07:30"))){ me.brief=r; out.push("Your morning brief moves to "+r+", the start of your day."); }
  if(beforeDayStart(me,hm(me.pmAt||"15:00"))){ me.pmAt=r; out.push("Your afternoon check moves to "+r+"."); }
  return out.join(" ");
}
function remCheck(v){
  var me=state.me||freshMe(), a=hm(v.amAt), p=hm(v.pmAt);
  if(v.am==="on" && isNaN(a)) return "Set a time for the morning brief.";
  if(v.pm==="on" && isNaN(p)) return "Set a time for the afternoon check.";
  if(v.am==="on" && beforeDayStart(me,a)) return "The morning brief would come before your day starts at "+clockLabel(me.rise||"07:00")+". Pick a later time.";
  if(v.pm==="on" && beforeDayStart(me,p)) return "The afternoon check would come before your day starts at "+clockLabel(me.rise||"07:00")+". Pick a later time.";
  if(v.am==="on" && pastDayEnd(me,a)) return "The morning brief would come after your day ends at "+clockLabel(me.wind)+". Pick an earlier time.";
  if(v.pm==="on" && pastDayEnd(me,p)) return "The afternoon check would come after your day ends at "+clockLabel(me.wind)+". Pick an earlier time.";
  if(v.am==="on" && v.pm==="on" && p<=a) return "Set the afternoon check later than the morning brief.";
  return "";
}
function remAsk(first){
  var me=state.me||freshMe(), c=remCfg(), oo=[["on","On"],["off","Off"]];
  return askUser({title:first?"Set your reminders":"Your reminders",
    body:["You choose which reminders come and when. At most 2 a day, and nothing before your day starts at "+clockLabel(me.rise||"07:00")+" or after your day ends at "+clockLabel(me.wind)+". A reminder stays on your phone until you close it. It never covers the board.",
      "Where it can, they also arrive when the board is closed. For that, a server keeps this device's address, your time zone and the times you set here. It never gets a task, a goal or any of your words."+(first?" Your browser will ask you to allow notifications next.":" To stop them all, set both to Off.")],
    fields:[{k:"am",label:"Morning brief: today's one task and why",kind:"pick",row:true,opts:oo,value:c.am?"on":"off"},
            {k:"amAt",label:"Morning brief at",kind:"time",value:c.amAt},
            {k:"pm",label:"Afternoon check: what is still open in Today",kind:"pick",row:true,opts:oo,value:c.pm?"on":"off"},
            {k:"pmAt",label:"Afternoon check at",kind:"time",value:c.pmAt}],
    ok:first?"Continue":"Save", cancel:"Not now", check:remCheck});
}
function remApply(v){
  var me=state.me||(state.me=freshMe());
  me.remAm=v.am==="on"; me.remPm=v.pm==="on";
  if(!isNaN(hm(v.amAt))) me.brief=v.amAt;
  if(!isNaN(hm(v.pmAt))) me.pmAt=v.pmAt;
  save();
}
function remOff(){
  remindSet(false);
  state.told={d:todayStr(), am:true, pm:true, hint:true}; save(); remindState();
  return pushDisable().then(function(ok){
    if(!ok) saysFlash("Reminders are off here. I could not reach the server to remove this device, so it will drop it on its next try.");
    return ok;
  });
}
RB.addEventListener("click",function(){
  if(!("Notification" in window)){ saysFlash("This browser will not show reminders for a local file. Open the board from its web link instead."); return; }
  if(Notification.permission==="denied"){
    askUser({title:"Reminders are blocked", body:"This browser is blocking notifications for the board. Allow them in the site settings for this page, then press the button again.", noOk:true, cancel:"Close"});
    return;
  }
  var on=Notification.permission==="granted"&&remindPref();
  remAsk(!on).then(function(v){
    if(!v) return;
    remApply(v);
    if(v.am!=="on" && v.pm!=="on"){ if(on) remOff(); else remindState(); return; }
    if(Notification.permission==="granted"){
      var was=on; remindSet(true); remindState();
      if(!was||!PUSH.on) pushStart(); else pushSync();
      return;
    }
    Notification.requestPermission().then(function(r){ if(r==="granted"){ remindSet(true); pushStart(); } remindState(); });
  });
});
remindState();
pushSync();

