/* ---------------- the interview ----------------
   Eight questions, one screen each. Nothing is written to the board until
   the last one is answered, so leaving halfway changes nothing.         */
var IV=null;
var IVQ=[
  {k:"days", q:"Which days do you work?",
   n:"Everything else follows from this. On the days you leave off, the planner stops holding anything back for the office.",
   kind:"days"},
  {k:"work", q:"What hours, on one of those days?",
   n:"Roughly is fine. It is used to work out whether you are at a desk or free, not to time you.",
   kind:"hours"},
  {k:"commute", q:"How long is the journey, each way?",
   n:"This is the difference between being home at five and being home at six. It decides whether an evening thing is really possible.",
   kind:"num", ph:"30"},
  {k:"sharp", q:"When is your head at its best?",
   n:"The hardest thing on the board gets pushed into this window, and the easy ones get pushed out of it.",
   kind:"pick", opts:SHARP},
  {k:"gym", q:"When can you train?",
   n:"This is the one that stops it telling you to get on an airbike at one o\u2019clock on a Monday.",
   kind:"pick", opts:GYMWIN},
  {k:"wind", q:"When does your day end?",
   n:"After this, it will only offer you something quiet, and it will say so.",
   kind:"time", ph:"22:30"},
  {k:"north", q:"What is the one thing that matters most right now?",
   n:"One line. It does not score anything on its own; it is what you are shown when the board argues with you.",
   kind:"text", ph:"Ship the tracker before the audit"},
  {k:"feeds", q:"Should the banner carry the news as well?",
   n:"The strip across the top already runs. Pick nothing and it carries only your own board. Pick a few and they ride along between your alarms.",
   kind:"multi", opts:FEEDS},
  {k:"where", q:"Last one. Where does each goal belong?",
   n:"The planner guessed. Correct anything it got wrong, because this is the fact it leans on hardest.",
   kind:"where"}
];
function ivOpen(){
  var me=state.me||freshMe();
  IV={i:0, a:{days:me.days.slice(), work:me.work.slice(), commute:me.commute,
              sharp:me.sharp, gym:me.gym, wind:me.wind, north:me.north||"",
              feeds:(me.feeds||[]).slice(), where:{}}};
  state.groups.forEach(function(g){ IV.a.where[g.id]=g.where||"any"; });
  $("#interview").hidden=false;
  pageLockOn($("#interview"));
  ivPaint();
  var f=$("#iv-next"); if(f) f.focus();
}
function ivClose(){ $("#interview").hidden=true; IV=null; pageLockOff(); }
function ivPaint(){
  if(!IV) return;
  var q=IVQ[IV.i], a=IV.a;
  $("#iv-step").textContent=(IV.i+1)+" of "+IVQ.length;
  $("#iv-dots").innerHTML=IVQ.map(function(x,i){
    return '<i class="'+(i<=IV.i?"on":"")+'"></i>'; }).join("");
  $("#iv-q").textContent=q.q;
  $("#iv-note").textContent=q.n;
  $("#iv-back").disabled=IV.i===0;
  $("#iv-next").textContent = IV.i===IVQ.length-1 ? "That is me" : "Next";
  var b=$("#iv-body"), h="";
  if(q.kind==="days")
    h='<span class="dayrow" id="iv-days">'+DAYS_SHORT.map(function(n,i){
      return '<button type="button" data-ivday="'+i+'" aria-pressed="'+(a.days.indexOf(i)>=0)+'">'+
        n.slice(0,2)+"</button>"; }).join("")+"</span>";
  else if(q.kind==="hours")
    h='<div class="two"><label>Starts<input class="f" type="time" data-iv="w0" value="'+esc(a.work[0])+'"></label>'+
      '<label>Ends<input class="f" type="time" data-iv="w1" value="'+esc(a.work[1])+'"></label></div>';
  else if(q.kind==="num")
    h='<label>Minutes<input class="f" type="number" min="0" max="240" data-iv="commute" value="'+
      (+a.commute||0)+'" placeholder="'+esc(q.ph||"")+'"></label>';
  else if(q.kind==="time")
    h='<label>Time<input class="f" type="time" data-iv="wind" value="'+esc(a.wind)+'"></label>';
  else if(q.kind==="text")
    h='<label>In one line<input class="f" data-iv="north" value="'+esc(a.north)+'" placeholder="'+
      esc(q.ph||"")+'"></label>';
  else if(q.kind==="multi")
    h='<div class="ivpick multi">'+q.opts.map(function(o){
      return '<button type="button" data-ivmulti="'+q.k+":"+o[0]+'" aria-pressed="'+
        (a[q.k].indexOf(o[0])>=0)+'">'+esc(o[1])+"</button>"; }).join("")+"</div>";
  else if(q.kind==="pick")
    h='<div class="ivpick">'+q.opts.map(function(o){
      return '<button type="button" data-ivpick="'+q.k+":"+o[0]+'" aria-pressed="'+
        (a[q.k]===o[0])+'">'+esc(o[1])+"</button>"; }).join("")+"</div>";
  else if(q.kind==="where")
    h = state.groups.length ? '<div class="wherelist">'+state.groups.map(function(g){
      return '<div class="whererow"><span class="wn">'+esc(g.name)+'</span>'+
        '<select class="f" data-ivwhere="'+g.id+'">'+WHERES.map(function(o){
          return '<option value="'+o[0]+'"'+(a.where[g.id]===o[0]?" selected":"")+">"+o[1]+"</option>";
        }).join("")+"</select></div>"; }).join("")+"</div>"
      : '<p class="calm">No goals yet. Add some and come back.</p>';
  b.innerHTML=h;
  if(typeof enhanceSelects==="function") enhanceSelects(b);
}
function ivSave(){
  var a=IV.a, me=state.me;
  me.days=a.days.slice().sort(); if(!me.days.length) me.days=[];
  me.work=[a.work[0]||"08:00", a.work[1]||"16:30"];
  me.commute=Math.max(0,Math.min(240,+a.commute||0));
  me.sharp=a.sharp; me.gym=a.gym; me.wind=a.wind||"22:30"; me.north=a.north||"";
  me.feeds=(a.feeds||[]).slice(0,6);
  me.done=true;
  state.groups.forEach(function(g){ if(a.where[g.id]) g.where=a.where[g.id]; });
  save(); ivClose(); renderAll(); loadNews(true);
  if(typeof toast==="function") toast("That is enough to go on. The board will tell you what to do now.");
}
(function(){
  var iv=$("#interview"); if(!iv) return;
  iv.addEventListener("click",function(e){
    if(e.target===iv) return;                       /* the sheet stays put */
    var d=e.target.closest("[data-ivday]");
    if(d){ var i=+d.dataset.ivday, at=IV.a.days.indexOf(i);
      if(at>=0) IV.a.days.splice(at,1); else IV.a.days.push(i);
      d.setAttribute("aria-pressed", IV.a.days.indexOf(i)>=0?"true":"false"); return; }
    var pk=e.target.closest("[data-ivpick]");
    if(pk){ var parts=pk.dataset.ivpick.split(":"); IV.a[parts[0]]=parts[1]; ivPaint(); return; }
    var mu=e.target.closest("[data-ivmulti]");
    if(mu){
      var q2=mu.dataset.ivmulti.split(":"), arr=IV.a[q2[0]], at2=arr.indexOf(q2[1]);
      if(at2>=0) arr.splice(at2,1); else arr.push(q2[1]);
      mu.setAttribute("aria-pressed", arr.indexOf(q2[1])>=0 ? "true":"false"); return;
    }
  });
  iv.addEventListener("input",function(e){
    var k=e.target.dataset.iv;
    if(k==="w0") IV.a.work[0]=e.target.value;
    else if(k==="w1") IV.a.work[1]=e.target.value;
    else if(k) IV.a[k]=e.target.value;
  });
  iv.addEventListener("change",function(e){
    var id=e.target.dataset.ivwhere;
    if(id) IV.a.where[id]=e.target.value;
  });
  $("#iv-back").addEventListener("click",function(){ if(IV.i>0){ IV.i--; ivPaint(); } });
  $("#iv-next").addEventListener("click",function(){
    if(IV.i<IVQ.length-1){ IV.i++; ivPaint(); } else ivSave();
  });
  $("#iv-quit").addEventListener("click",ivClose);
  addEventListener("keydown",function(e){ if(e.key==="Escape"&&IV) ivClose(); });
  $("#pl-interview").addEventListener("click",ivOpen);
})();
document.addEventListener("click",function(e){
  if(e.target.closest("#now-interview")){ ivOpen(); return; }
  var gv=e.target.closest("[data-goto-view]");
  if(gv){ location.hash="#/"+gv.dataset.gotoView; }
});

