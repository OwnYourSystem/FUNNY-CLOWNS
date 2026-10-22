/* ---------------- the tour ----------------
   How Qordel works, always one tap away (owner, 2026-10-22: "a static
   introduction which explores all the services ... always available ...
   animated slides"). 8 slides, one idea each: a sentence, a small moving
   demo drawn with the app's own cards, Try it (opens that page) and Ask
   about this (Talk answers it, with or without the AI). Swipe on a phone,
   arrow keys on a computer. With reduced motion the demos stand still.
   A slide added later gets a since date and shows New to whoever saw the
   tour before it. Nothing here leaves the device.                       */
var TOUR=[
  {k:"now", t:"One step, in the right order", s:"Now shows the one thing to do next, and why. Start it, or skip it for another.",
   go:"now", ask:"How does Now choose my step?",
   a:"Now follows 6 rules: your energy, the last part of your day, steps you marked Easy, the goal with the nearest delivery day, work goals only in work hours, and what is booked in your calendar. It shows one step and says why. Skip gives you another.", since:"2026-10-20"},
  {k:"energy", t:"Your energy sizes the day", s:"Tap the battery. On a low day the board asks for less, and only easy things.",
   go:"now", ask:"What does my energy change?",
   a:"Full gives a bigger day, Good a normal one, Low only easy things or a step you marked Easy, and Very low asks for nothing. Tap the battery on Now, or tell Talk how you feel.", since:"2026-10-20"},
  {k:"calendar", t:"What is booked comes first", s:"Connect Google Calendar. A doctor's visit or a school run makes the day smaller, and no task is asked during it.",
   go:"calendar", ask:"How does the calendar change my day?",
   a:"Every 2 hours booked removes one step, never below one. During a booking Now asks for nothing. Now shows what is still booked today, or in the evening tomorrow's first booking. Names stay on your device.", since:"2026-10-21"},
  {k:"talk", t:"Talk, in plain words", s:"Type or speak. Say how you feel or what to change. Signed in, the AI tutor helps with the rest.",
   go:"talk", ask:"What can Talk do?",
   a:"Talk changes goals, steps, Today and your settings, and answers what to do now. Say “I don't feel good” and the day becomes a low day. Signed in, an AI tutor (Claude, by Anthropic) answers what the board cannot, and every AI answer is marked AI.", since:"2026-10-22"},
  {k:"goals", t:"Goals and their steps", s:"Give a goal a delivery day and steps in order. Suggest an order puts them in a sensible sequence.",
   go:"goals", ask:"How do goals and steps work?",
   a:"A goal holds steps in the order you do them. A delivery day makes it come first when it is near. Suggest an order asks the AI for a sensible sequence, and you decide whether to use it.", since:"2026-10-20"},
  {k:"journal", t:"The journal", s:"Close the day in a few words, and pick up tomorrow where you left off.",
   go:"journal", ask:"What is the journal for?",
   a:"Start of day and End of day are 2 short notes: what you did and what comes next. They stay on this device. Ask Talk “where did I leave off?” to read them back.", since:"2026-10-19"},
  {k:"learn", t:"It learns, with your yes", s:"The board notices patterns, like when you finish things. A pattern becomes a note only when you press Keep.",
   go:"you", ask:"What does Qordel learn about me?",
   a:"It counts when you finish things, how much a day holds, lighter weekdays and steps you skip. It proposes a note, and only your Keep keeps it. You can switch learning off on You.", since:"2026-10-21"},
  {k:"private", t:"Yours, and private", s:"Your board, journal and calendar stay with you. The AI sees your question and the numbers it asks for, never your journal.",
   go:"you", ask:"What stays private?",
   a:"Signed out, everything stays in this browser. Signed in, your board is kept in your account so it follows you. The journal, the weekly check-in and calendar names stay on the device. The AI sees your question and the numbers its tools return.", since:"2026-10-19"}
];
var TOUR_KEY="oys-tour";
function tourSeen(){ try{ return localStorage.getItem(TOUR_KEY)||""; }catch(e){ return ""; } }
function tourMark(){ try{ localStorage.setItem(TOUR_KEY,todayStr()); }catch(e){} }
/* during a visit, New is measured against the last visit before it, so the badges stay while the person looks */
var TOUR_PREV=null;
function tourNew(x){ var s=TOUR_PREV!==null?TOUR_PREV:tourSeen(); return !!s && x.since>s; }
function tourNewCount(){ var s=tourSeen(); return TOUR.filter(function(x){ return !!s && x.since>s; }).length; }
var TOUR_I=0;
function tourArg(){ var m=String(location.hash||"").match(/^#\/tour\/(\d+)/); return m?Math.max(0,Math.min(TOUR.length-1,+m[1]-1)):0; }
/* the small moving demo of each slide, drawn with the app's own pieces; decoration only */
function tourDemo(k){
  var D={
    now:'<div class="td-card td-pulse"><span class="td-k">Do this now</span><b>Buy the timber</b><span class="td-why">Garden shed is for Friday; this is its next step.</span><span class="td-btn">Start it</span></div><div class="td-list td-in"><span class="td-k">Today</span><span class="td-row">Buy the timber</span></div>',
    energy:'<div class="td-bat"><i></i><i></i><i class="td-off"></i><i class="td-off"></i></div><div class="td-swap"><span>3 steps today</span><span>1 easy step</span></div>',
    calendar:'<div class="td-time"><span class="td-blk">10:00 Doctor</span><span class="td-blk td-b2">15:30 School run</span></div><div class="td-swap"><span>3 steps today</span><span>2 steps today</span></div>',
    talk:'<div class="td-chat"><span class="td-you">I don’t feel good today</span><span class="td-bot">I made today a low day. One easy step: a 10-minute walk.</span></div>',
    goals:'<div class="td-list td-order"><span class="td-k">Garden shed \u00b7 Suggest an order</span><span class="td-row" style="--d:0;--o:2">Build the walls</span><span class="td-row" style="--d:1;--o:0">Buy the timber</span><span class="td-row" style="--d:2;--o:1">Lay the base</span></div>',
    journal:'<div class="td-two"><span class="td-note"><span class="td-k">Morning</span>Start of day</span><span class="td-note td-in"><span class="td-k">Evening</span>Finished the base. Tomorrow: walls.</span></div>',
    learn:'<div class="td-card"><span class="td-k">I noticed</span><b>You finish most in the morning.</b><span class="td-btn td-press">Keep it</span></div>',
    "private":'<div class="td-two"><span class="td-note"><span class="td-k">On your device</span>Board, journal, calendar</span><span class="td-note"><span class="td-k">The AI sees</span>Your question, the numbers it asks for</span></div>'
  };
  return '<div class="tour-demo td-'+k+'" aria-hidden="true">'+(D[k]||"")+'</div>';
}
function tourHtml(){
  var i=TOUR_I=tourArg(), x=TOUR[i], n=TOUR.length;
  return '<div class="tour" role="region" aria-roledescription="slides" aria-label="How Qordel works">'+
    '<div class="tour-top"><a class="ph-nav" href="#/now" data-tour="close" aria-label="Close the tour">'+PH_BACKI+'<span>Close</span></a>'+
      '<span class="ph-k tour-of">'+(i+1)+' of '+n+'</span></div>'+
    tourDemo(x.k)+
    '<section class="ph-card tour-card" aria-live="polite" aria-label="'+esc(x.t)+'">'+sayBtn("ph-say","Read this slide aloud")+
      (tourNew(x)?'<span class="tour-new">New</span>':'')+
      '<h1 class="ph-h1 tour-t">'+esc(x.t)+'</h1><p class="ph-why tour-s">'+esc(x.s)+'</p>'+
      '<div class="tour-acts"><a class="ph-btn" href="#/'+x.go+'" data-tour="try">Try it</a><button type="button" class="ph-btn" data-tour="ask">Ask about this</button></div></section>'+
    '<div class="tour-dots" role="group" aria-label="Slides">'+TOUR.map(function(y,j){
      return '<button type="button" class="tour-dot'+(tourNew(y)?' tour-dnew':'')+'" data-tour="to" data-i="'+j+'" aria-label="Slide '+(j+1)+' of '+n+': '+esc(y.t)+'"'+(j===i?' aria-current="step"':'')+'></button>'; }).join("")+'</div>'+
    '<div class="tour-nav"><button type="button" class="ph-btn" data-tour="prev"'+(i===0?' disabled':'')+'>Back</button>'+
      (i<n-1?'<button type="button" class="ph-btn ph-pri" data-tour="next">Next</button>':'<a class="ph-btn ph-pri" href="#/now" data-tour="done">Done</a>')+'</div></div>';
}
function phTour(){ if(TOUR_PREV===null) TOUR_PREV=tourSeen(); tourMark(); return tourHtml(); }
function tourGo(i){ i=Math.max(0,Math.min(TOUR.length-1,i)); location.hash="#/tour/"+(i+1); }
/* Talk answers the slides' own questions, with or without the AI */
function tourAnswer(s){
  var q=String(s||"").toLowerCase().replace(/[?!.]+$/,"").trim();
  for(var i=0;i<TOUR.length;i++) if(TOUR[i].ask.toLowerCase().replace(/[?!.]+$/,"")===q) return TOUR[i].a;
  if(/^(?:how does qordel work|how does this (?:app )?work|show (?:me )?the tour|tour|introduction|intro)$/.test(q)){ setTimeout(function(){ tourGo(0); },400); return "Here is a 1-minute tour of Qordel. You can open it any time from You."; }
  return null;
}
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("[data-tour]"); if(!b) return;
  var k=b.getAttribute("data-tour");
  if(k==="next") tourGo(TOUR_I+1);
  else if(k==="prev") tourGo(TOUR_I-1);
  else if(k==="to") tourGo(+b.getAttribute("data-i"));
  else if(k==="ask"){
    var x=TOUR[TOUR_I]; location.hash="#/talk";
    setTimeout(function(){ try{ botAsk(x.ask); }catch(err){} },350);
  }
});
document.addEventListener("keydown",function(e){
  if(!/^#\/tour/.test(location.hash||"") || e.target.closest&&e.target.closest("input,textarea,select,dialog")) return;
  if(e.key==="ArrowRight"){ e.preventDefault(); tourGo(TOUR_I+1); }
  else if(e.key==="ArrowLeft"){ e.preventDefault(); tourGo(TOUR_I-1); }
  else if(e.key==="Escape"){ location.hash="#/now"; }
});
(function(){
  var x0=null, y0=0;
  document.addEventListener("touchstart",function(e){ if(!/^#\/tour/.test(location.hash||"")||!e.touches[0]) return; x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
  document.addEventListener("touchend",function(e){
    if(x0===null||!e.changedTouches[0]) return;
    var dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; x0=null;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.5) tourGo(TOUR_I+(dx<0?1:-1));
  },{passive:true});
})();
