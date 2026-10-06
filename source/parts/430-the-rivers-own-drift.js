/* ---------------- the river's own drift ----------------
   The panels used to bank with a device tilt too: a 3D rotateX/rotateY on
   the whole canvas. That read as depth on a screen sitting on a desk and
   as motion sickness on one held in the hand, and "held in the hand" was
   never only the phone: a tablet is wide enough to pass as a desktop by
   width alone, so it got the tilt too and floated the same way, on a
   screen even less likely to be sitting still on a desk. The panels no
   longer move for tilt or for scroll, on any device. What is left is the
   river behind them: it answers a real device tilt if one arrives and
   drifts gently on its own otherwise, because a background is allowed to
   breathe in a way the goals you are reading are not.                    */
var tiltSource="";
function onTilt(e){
  if(e.gamma==null&&e.beta==null) return;
  tiltSource="device";
  cam.tx=Math.max(-1,Math.min(1,(e.gamma||0)/34));
  cam.ty=Math.max(-1,Math.min(1,((e.beta||0)-48)/40));
}
var motionOn=false, tiltBound=false;
function driftCam(ts){
  if(tiltSource==="device") return;
  cam.tx=Math.sin(ts/9000)*0.55;
  cam.ty=Math.cos(ts/13000)*0.35;
}
function startMotion(){
  motionOn=true; document.body.classList.remove("flat");
  readInk(); sizeRiver(); buildFlow();
  if(!riverRAF) riverRAF=requestAnimationFrame(riverFrame);
  if(!tiltBound){
    tiltBound=true;
    window.addEventListener("deviceorientation",onTilt);
  }
  state.motion=true; save(); paintMotionBtn();
}
function stopMotion(){
  motionOn=false; document.body.classList.add("flat");
  if(riverRAF){ cancelAnimationFrame(riverRAF); riverRAF=null; }
  if(rctx) rctx.clearRect(0,0,W,H);
  cam.tx=cam.ty=cam.x=cam.y=0;
  state.motion=false; save(); paintMotionBtn();
}
function paintMotionBtn(){
  var b=$("#btn-motion");
  b.setAttribute("aria-pressed",motionOn?"true":"false");
  b.lastChild.textContent=motionOn?"Flight on":"Flight off";
}
$("#btn-motion").addEventListener("click",function(){
  if(motionOn){ stopMotion(); return; }
  var D=window.DeviceOrientationEvent;
  if(D&&typeof D.requestPermission==="function"){
    D.requestPermission().then(function(r){ startMotion(); }).catch(function(){ startMotion(); });
  } else startMotion();
});
addEventListener("resize",function(){ sizeRiver(); });
addEventListener("visibilitychange",function(){
  if(document.hidden){ if(riverRAF){ cancelAnimationFrame(riverRAF); riverRAF=null; } }
  else if(motionOn&&!riverRAF) riverRAF=requestAnimationFrame(riverFrame);
});
if(window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener
  && window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",readInk);
document.body.classList.add("flat");
sizeRiver(); readInk();
/* on unless turned off, or unless the viewer asked for less motion */
if(state.motion!==false && !REDUCE) startMotion(); else paintMotionBtn();

