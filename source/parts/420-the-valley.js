/* ---------------- the valley ----------------
   A drone view down a river running between two ridges. Every subtask
   is one light on the water: it enters at the horizon and drifts toward
   you, faster the further along the work is. Red while in flight, white
   once finished, dim and slow when stalled or blocked.               */
var RIV=$("#river"), rctx=RIV?RIV.getContext("2d"):null;
var flow=[], riverRAF=null, W=0, H=0, DPR=1, tNow=0;
var cam={tx:0,ty:0,x:0,y:0,hold:0};
var ink={};

function readInk(){
  var cs=getComputedStyle(document.body);
  function v(n,f){ var c=cs.getPropertyValue(n).trim(); return c||f; }
  ink={ accent:v("--accent","#FF3B30"), fg:v("--ink","#ECECEF"),
        muted:v("--muted","#61616C"), ground:v("--ground","#08080A"),
        panel:v("--panel","#0F0F12") };
}
function sizeRiver(){
  if(!RIV) return;
  DPR=Math.min(2,window.devicePixelRatio||1);
  W=window.innerWidth; H=window.innerHeight;
  RIV.width=Math.round(W*DPR); RIV.height=Math.round(H*DPR);
  rctx.setTransform(DPR,0,0,DPR,0,0);
}
/* one light per subtask, lane and phase fixed per id so it stays itself */
function buildFlow(){
  var subs=allSubs();
  var seen={};
  flow=flow.filter(function(f){ return state.subs[f.id]; });
  flow.forEach(function(f){ seen[f.id]=f; });
  flow=subs.map(function(sb,i){
    var f=seen[sb.id]||{id:sb.id, t:(i*0.137)%1, lane:0};
    var h=0; for(var k=0;k<sb.id.length;k++) h=(h*31+sb.id.charCodeAt(k))%1000;
    f.lane=((h/1000)*1.7)-0.85;
    var st=statusOf(sb);
    f.state=st.k;
    f.speed = st.k==="done" ? 0.00062
            : st.k==="block" ? 0.00006
            : st.k==="risk"  ? 0.00009
            : 0.00013 + (sb.pct/100)*0.00052;
    f.pct=sb.pct;
    return f;
  });
}
function riverFrame(ts){
  if(!rctx){ riverRAF=null; return; }
  var dt=Math.min(64, ts-tNow||16); tNow=ts;
  driftCam(ts);
  var ck=0.055;
  cam.x+=(cam.tx-cam.x)*ck; cam.y+=(cam.ty-cam.y)*ck;
  var cx=W*0.5 + cam.x*W*0.16;
  var hz=H*(0.30 + cam.y*0.10);
  rctx.clearRect(0,0,W,H);

  /* two ridges falling away to the vanishing point */
  function ridge(dir,depth,shade){
    var px=cx + dir*cam.x*W*0.05*depth;
    rctx.beginPath();
    rctx.moveTo(px, hz);
    var steps=9, prev=hz;
    for(var i=1;i<=steps;i++){
      var f=i/steps;
      var x=px + dir*(f*W*0.78*depth);
      var jag=Math.sin(i*2.7+depth*5.1)*0.5+Math.cos(i*1.9+depth*3.3)*0.5;
      var y=hz - (f*H*0.30*depth) - jag*H*0.045*depth;
      rctx.lineTo(x,(prev=y));
    }
    rctx.lineTo(px + dir*W*0.9, -H); rctx.lineTo(px, -H); rctx.closePath();
    rctx.fillStyle=shade; rctx.fill();
  }
  rctx.save();
  rctx.globalAlpha=.5; ridge(-1,1,ink.panel); ridge(1,0.92,ink.panel);
  rctx.globalAlpha=.32; ridge(-1,0.62,ink.ground); ridge(1,0.7,ink.ground);
  rctx.restore();

  /* the water: a band widening out of the horizon toward you */
  function halfWidth(t){ return W*(0.012 + Math.pow(t,1.7)*0.46); }
  function yAt(t){ return hz + (H-hz)*Math.pow(t,1.55); }
  var g=rctx.createLinearGradient(0,hz,0,H);
  g.addColorStop(0,"rgba(255,255,255,0)");
  g.addColorStop(1,"rgba(255,255,255,0.035)");
  rctx.beginPath();
  rctx.moveTo(cx-halfWidth(0),yAt(0));
  for(var t=0;t<=1.001;t+=0.05) rctx.lineTo(cx-halfWidth(t),yAt(t));
  for(var t2=1;t2>=-0.001;t2-=0.05) rctx.lineTo(cx+halfWidth(t2),yAt(t2));
  rctx.closePath(); rctx.fillStyle=g; rctx.fill();

  /* a soft glow at the source */
  var gl=rctx.createRadialGradient(cx,hz,0,cx,hz,W*0.3);
  gl.addColorStop(0,"rgba(255,59,48,0.15)"); gl.addColorStop(1,"rgba(255,59,48,0)");
  rctx.fillStyle=gl; rctx.fillRect(0,hz-W*0.3,W,W*0.6);

  /* the lights */
  for(var i=0;i<flow.length;i++){
    var f=flow[i];
    f.t+=f.speed*dt;
    if(f.t>1.08) f.t-=1.12;
    if(f.t<0) continue;
    var tt=f.t, y=yAt(tt), hw=halfWidth(tt);
    var drift=Math.sin(tt*5.2+f.lane*6.1)*0.14;
    var x=cx + (f.lane+drift)*hw;
    var r=0.7+Math.pow(tt,1.8)*5.4;
    var a=Math.min(1,tt*5)*(1-Math.pow(Math.max(0,tt-0.86)/0.22,2));
    var col = f.state==="done" ? ink.fg : (f.state==="idle" ? ink.muted : ink.accent);
    rctx.globalAlpha=Math.max(0,a)*(f.state==="idle"?0.34:0.72);
    rctx.beginPath(); rctx.arc(x,y,r,0,6.284); rctx.fillStyle=col; rctx.fill();
    if(f.state!=="idle" && tt>0.45){
      rctx.globalAlpha=Math.max(0,a)*0.18;
      rctx.beginPath(); rctx.ellipse(x,y,r*1.1,r*3.4,0,0,6.284); rctx.fill();
    }
  }
  rctx.globalAlpha=1;
  riverRAF=requestAnimationFrame(riverFrame);
}

