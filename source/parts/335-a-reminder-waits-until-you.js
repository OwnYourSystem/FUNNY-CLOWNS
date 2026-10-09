/* ---------------- a reminder waits until you close it ----------------
   Added 2026-10-09 at the owner's request. Two rules:
   1. A reminder stays on the screen until the person closes it. It does not
      fade after a few seconds.
   2. On a phone, the morning brief and the afternoon check hold the board
      still until the person presses Got it or closes them.
   The honest limit: a web page can hold its own page and nothing else. It
   cannot block the phone, the lock screen or another app, and iOS ignores the
   "stay" flag on a notification (the text stays in the notification list
   instead). This is the one place a dialog opens without the person pressing
   something first, so it is narrow: only the two reminders the person turned
   on, at most 2 a day, never after the day end, never for a hint, and never
   on a computer. Swiping the notification away counts as closing it.
   The notice lives in the device cache beside the summary, so it survives a
   closed page and holds nothing the notification does not already say.
   This part comes before the reminders part on purpose: that part checks for
   a reminder as soon as it loads, and the check needs NOTICE_TAGS by then. */
var NOTICE_TAGS={"oys-brief":1, "oys-today":1}, noticeUp=false;
function noticeUrl(){ return new URL("notice.json",document.baseURI).href; }
function noticeBlocks(){
  try{
    return !!((window.matchMedia && (matchMedia("(pointer: coarse)").matches || matchMedia("(display-mode: standalone)").matches)) || navigator.standalone);
  }catch(e){ return false; }
}
function noticeWrite(n){
  if(!("caches" in window)) return Promise.resolve();
  return caches.open("board-digest").then(function(c){
    return c.put(noticeUrl(),new Response(JSON.stringify(n),{headers:{"content-type":"application/json"}}));
  }).catch(function(){});
}
function noticeRead(){
  if(!("caches" in window)) return Promise.resolve(null);
  return caches.open("board-digest").then(function(c){ return c.match(noticeUrl()); })
    .then(function(r){ return r ? r.json() : null; }).catch(function(){ return null; });
}
/* forget the notice and take the matching notification off the phone */
function noticeClear(tag){
  var gone=("caches" in window) ? caches.open("board-digest").then(function(c){ return c.delete(noticeUrl()); }).catch(function(){}) : Promise.resolve();
  var shut=("serviceWorker" in navigator) ? navigator.serviceWorker.ready.then(function(reg){ return reg.getNotifications({tag:tag}); })
    .then(function(list){ list.forEach(function(n){ n.close(); }); }).catch(function(){}) : Promise.resolve();
  return Promise.all([gone,shut]);
}
function noticePoll(){
  if(noticeUp || document.hidden) return Promise.resolve();
  return noticeRead().then(function(n){
    if(!n || !NOTICE_TAGS[n.tag] || noticeUp) return;
    var me=state.me||freshMe(), now=new Date();
    if(n.d!==todayStr() || pastDayEnd(me,now.getHours()*60+now.getMinutes())) return noticeClear(n.tag);
    if(!me.done || !noticeBlocks()) return;
    noticeUp=true;
    askUser({title:n.t, body:n.b, ok:"Got it", cancel:"Close"}).then(function(){ noticeUp=false; noticeClear(n.tag); });
  });
}
addEventListener("visibilitychange",function(){ if(!document.hidden) noticePoll(); });
if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message",function(e){ if(e.data && e.data.type==="oys-notice") noticePoll(); });
noticePoll();
