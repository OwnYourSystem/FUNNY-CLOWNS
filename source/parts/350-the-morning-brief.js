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
  /* a reminder stays until the person closes it; the morning brief and the afternoon
     check also hold the board still (see "a reminder waits until you close it") */
  if(NOTICE_TAGS[tag]) noticeWrite({d:todayStr(),t:title,b:body,tag:tag,at:Date.now()}).then(noticePoll);
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.ready && navigator.serviceWorker.controller){
      navigator.serviceWorker.ready.then(function(reg){
        reg.showNotification(title,{body:body,tag:tag,icon:"icon-192.png",badge:"icon-192.png",requireInteraction:true});
      }).catch(function(){ new Notification(title,{body:body,tag:tag,requireInteraction:true}); });
      return;
    }
    new Notification(title,{body:body,tag:tag,requireInteraction:true});
  }catch(e){}
}
function checkRemind(at){
  if(!("Notification" in window)||Notification.permission!=="granted") return;
  var me=state.me||freshMe(), now=at instanceof Date ? at : new Date(), mins=now.getHours()*60+now.getMinutes();
  /* Nothing is sent after the day is meant to be over. The board says the day
     has an end, so its notifications respect it too. */
  if(pastDayEnd(me, mins)) return;
  var today=todayStr();
  if(!state.told||state.told.d!==today) state.told={d:today, am:false, pm:false, hint:false};

  /* the morning one, any time from the set time onwards, once */
  if(!state.told.am && me.done && mins>=hm(me.brief||"07:30")){
    state.told.am=true; save();
    var br=briefText();
    fire("Today: "+br.t, br.b, "oys-brief");
    return;
  }
  /* then the hint, on the next tick, so it does not replace the brief. Only if the card has not already been answered. */
  if(!state.told.hint && state.told.am && me.done && hintOn() && me.hintNote!==false){
    state.told.hint=true; hintTick(); save();
    var h=state.hint;
    if(h && h.d===today && !hintDone(h)) fire("Today\u2019s hint", hintPlain(h.t), "oys-hint");
    return;
  }
  /* and the afternoon check on what was actually taken on */
  var open=state.oftad;                              /* Today only: Waiting is not today's job */
  if(!state.told.pm && now.getHours()>=15 && open.length){
    state.told.pm=true; save();
    fire("Still open", open.length+" still open: "+open.slice(0,3).map(cardName).join(", "), "oys-today");
  }
}
RB.addEventListener("click",function(){
  if(!("Notification" in window)){ saysFlash("This browser will not show reminders for a local file. Open the board from its web link instead."); return; }
  if(Notification.permission==="granted"){
    if(remindPref()){
      remindSet(false);
      state.told={d:todayStr(), am:true, pm:true, hint:true}; save(); remindState();
      pushDisable().then(function(ok){
        if(!ok) saysFlash("Reminders are off here. I could not reach the server to remove this device, so it will drop it on its next try.");
      });
      return;
    }
    remindSet(true); remindState(); pushStart(); return;
  }
  if(Notification.permission==="denied"){
    askUser({title:"Reminders are blocked", body:"This browser is blocking notifications for the board. Allow them in the site settings for this page, then press the button again.", noOk:true, cancel:"Close"});
    return;
  }
  var me=state.me||freshMe();
  askUser({title:"Turn on reminders?",
    body:["At most 2 a day: a morning brief at "+clockLabel(me.brief||"07:30")+" and a check on what is still open at 15:00. Nothing is sent after your day ends at "+clockLabel(me.wind)+".",
      "Your browser will ask you to allow notifications next. Where it can, they also arrive when the board is closed. For that, a server keeps this device's address, your time zone, your brief time and your day end. It never gets a task, a goal or a note."],
    ok:"Continue", cancel:"Not now"}).then(function(yes){
    if(yes) Notification.requestPermission().then(function(r){ if(r==="granted"){ remindSet(true); pushStart(); } remindState(); });
  });
});
remindState();
pushSync();

