/* ---------------- reminders that reach a closed page ----------------
   A page cannot wake itself, so a small server sends a push at the person's
   brief time and in the afternoon. It holds a device address, a time zone and
   two clock times, never a task or the words of a notification: what it sends
   is the single word am or pm, and the service worker writes the text from a
   short summary this page leaves in the device's cache. The button says what
   is true: "(push)" only after the server has confirmed this device, and
   "(while open)" otherwise. Requirements: notes/push-nfr.md.              */
var PUSH={on:false,h:"",at:0}, PUSH_REFRESH_MS=7*864e5, pushT=0;
try{ var pj=JSON.parse(localStorage.getItem("oys-push")||"null"); if(pj&&pj.on) PUSH=pj; }catch(e){}
function pushSave(){ try{ localStorage.setItem("oys-push",JSON.stringify(PUSH)); }catch(e){} }
function remindPref(){ try{ return localStorage.getItem("oys-remind")!=="off"; }catch(e){ return true; } }
function remindSet(on){ try{ localStorage.setItem("oys-remind",on?"on":"off"); }catch(e){} }
function pushUrl(){ return SB_URL+"/functions/v1/push"; }
function pushCan(){
  return ("serviceWorker" in navigator)&&("PushManager" in window)&&("Notification" in window)&&
    (location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1");
}
function pushZone(){ try{ return Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC"; }catch(e){ return "UTC"; } }
function pushBody(sub){
  var me=state.me||freshMe(), j=sub.toJSON();
  return {sub:{endpoint:j.endpoint,keys:j.keys},tz:pushZone(),brief:me.brief||"07:30",wind:me.wind||"22:30",am:true,pm:true};
}
function pushHash(b){ return [b.tz,b.brief,b.wind,b.sub.endpoint].join("|"); }
function pushCall(path,body){
  return fetch(pushUrl()+"/"+path,{method:body?"POST":"GET",headers:body?{"content-type":"application/json"}:{},body:body?JSON.stringify(body):undefined})
    .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error((j&&j.error)||("http "+r.status)); return j; }); });
}
function b64u8(s){
  while(s.length%4) s+="=";
  var raw=atob(s.replace(/-/g,"+").replace(/_/g,"/")), u=new Uint8Array(raw.length), i;
  for(i=0;i<raw.length;i++) u[i]=raw.charCodeAt(i);
  return u;
}
/* a short summary for the service worker to write the notification from; nothing leaves the device */
function digestWrite(){
  if(!("caches" in window)) return;
  try{
    var br=briefText(), o=state.oftad;
    var d={d:todayStr(),t:Date.now(),am:{t:br.t,b:br.b},nOpen:o.length,open:o.slice(0,3).map(cardName)};
    caches.open("board-digest").then(function(c){
      return c.put(new URL("digest.json",document.baseURI).href,new Response(JSON.stringify(d),{headers:{"content-type":"application/json"}}));
    }).catch(function(){});
  }catch(e){}
}
function pushEnable(){
  return navigator.serviceWorker.ready.then(function(reg){
    return pushCall("config").then(function(c){
      return reg.pushManager.getSubscription().then(function(old){
        return old||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u8(c.key)});
      });
    }).then(function(sub){
      var b=pushBody(sub);
      return pushCall("subscribe",b).then(function(r){
        PUSH={on:true,h:r.same?"":pushHash(b),at:Date.now()}; pushSave(); digestWrite(); remindState();
      });
    });
  });
}
function pushDisable(){
  PUSH={on:false,h:"",at:0}; pushSave();
  if(!pushCan()) return Promise.resolve(true);
  return navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){
    if(!sub) return true;
    var j=sub.toJSON();
    return pushCall("unsubscribe",{endpoint:j.endpoint,auth:j.keys.auth}).then(function(){ return true; },function(){ return false; })
      .then(function(ok){ return sub.unsubscribe().then(function(){ return ok; },function(){ return ok; }); });
  }).catch(function(){ return false; });
}
/* keep the server in step: when the brief time or day end changes, or once a week */
function pushSync(){
  if(!PUSH.on||!pushCan()||Notification.permission!=="granted"||!remindPref()) return;
  navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){
    if(!sub){ PUSH={on:false,h:"",at:0}; pushSave(); remindState(); return; }
    var b=pushBody(sub), h=pushHash(b);
    if(h===PUSH.h&&Date.now()-PUSH.at<PUSH_REFRESH_MS) return;
    return pushCall("subscribe",b).then(function(r){ if(!r.same){ PUSH.h=h; PUSH.at=Date.now(); pushSave(); } });
  }).catch(function(){});
}
function pushSoon(){
  if(!PUSH||!PUSH.on) return;               /* save() runs at boot, before this block has set PUSH */
  clearTimeout(pushT); pushT=setTimeout(function(){ digestWrite(); pushSync(); },3000);
}
function pushStart(){
  if(!pushCan()){
    if(/iPhone|iPad|iPod/.test(navigator.userAgent)) saysFlash("On an iPhone or iPad, add the board to your Home Screen to get reminders when it is closed. Until then they arrive while it is open.");
    return;
  }
  pushEnable().catch(function(){ saysFlash("Reminders on a closed page are not available right now. They will arrive while the board is open."); });
}
function remindState(){
  var ok=("Notification" in window)&&Notification.permission==="granted"&&remindPref();
  RB.setAttribute("aria-pressed",ok?"true":"false");
  RB.lastChild.textContent=ok?(PUSH.on?"Reminders on (push)":"Reminders on (while open)"):"Reminders off";
  if(ok&&!timer){ timer=setInterval(checkRemind,60000); checkRemind(); }
  if(!ok&&timer){ clearInterval(timer); timer=null; }
}
