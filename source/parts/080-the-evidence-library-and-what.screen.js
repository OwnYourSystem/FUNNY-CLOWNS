function replyCheck(text,ctx){
  var t=String(text||""), why=[];
  if(CHK_BAN.test(t)) why.push("it used a clinical word, and I do not diagnose");
  var tags=t.match(/\[E-[A-Z0-9-]+\]/g)||[];
  tags.forEach(function(g){ if(!libUsable(g.slice(1,-1))) why.push("it cited "+g+", which is not in the library"); });
  if(CHK_SAYS.test(t) && !tags.length) why.push("it said what research shows without a library citation");
  if(ctx && ctx.history){
    var have={}, src=String(ctx.src||"");
    (src.match(/\d+(?:[.,]\d+)?/g)||[]).forEach(function(n){
      n=n.replace(",","."); have[n]=1;
      var f=parseFloat(n); if(f>0 && f<=1) have[String(Math.round(f*100))]=1;   /* a share of 0.72 may be said as 72% */
    });
    chkNums(t).forEach(function(n){ if(!have[n] && !have[String(parseFloat(n))]) why.push("it quoted "+n+", which no tool returned"); });
  }
  return {ok:!why.length, why:why.join("; ")};
}
