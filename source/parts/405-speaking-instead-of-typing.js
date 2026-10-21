/* ---------------- speaking instead of typing ----------------
   Put back on 2026-10-15 at the owner's request: saying is faster than typing,
   above all for the journal. Press Speak, talk, and the words land in the box.
   Nothing is sent or saved until the person presses Send (or Save), so a
   misheard word is seen and fixed first, and nothing is ever changed by voice
   alone. The browser turns the voice into text with its own speech service
   (Google in Chrome, Apple in Safari); the board gets only the text and keeps
   no sound. Where the browser has no speech service, the button says to use
   the keyboard's own microphone instead.                                   */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition||null, REC=null, MIC_TOLD="oys-mic-told";
function micLang(){ var l=navigator.language||"en-US"; return /^en(?:-|$)/i.test(l)?l:"en-US"; }
function micStop(){ if(REC){ try{ REC.stop(); }catch(e){} } }
function micOff(btn){ btn.setAttribute("aria-pressed","false"); btn.classList.remove("on"); }
function micInto(el,btn,say){
  if(!SR){ say("This browser cannot turn speech into text. Use the microphone on your keyboard instead."); return; }
  if(REC){ var same=REC._btn===btn; micStop(); if(same) return; }
  var r=new SR(), base=String(el.value||"").replace(/\s+$/,""), got="";
  r.lang=micLang(); r.interimResults=true; r.continuous=false; r.maxAlternatives=1; r._btn=btn;
  r.onresult=function(e){
    got=""; for(var i=0;i<e.results.length;i++) got+=e.results[i][0].transcript;
    el.value=(base?base+" ":"")+got.trim();
  };
  r.onerror=function(e){
    var k=e&&e.error;
    if(k==="not-allowed"||k==="service-not-allowed") say("The microphone is blocked for this page. Allow it in the site settings, or use the microphone on your keyboard.");
    else if(k==="no-speech") say("I heard nothing. Press Speak and talk.");
    else if(k==="network") say("Turning speech into text needs a connection here. You can type instead.");
    else if(k!=="aborted") say("Listening stopped. You can type instead.");
  };
  r.onend=function(){
    if(REC===r) REC=null; micOff(btn);
    if(got) say("Check the words, then press "+(el.id==="bot-input"?"Send":"Save")+".");
    try{ el.focus(); }catch(e){}
  };
  REC=r; btn.setAttribute("aria-pressed","true"); btn.classList.add("on");
  var told=false; try{ told=localStorage.getItem(MIC_TOLD)==="1"; localStorage.setItem(MIC_TOLD,"1"); }catch(e){}
  /* say who hears the voice (2026-10-21, flaw 7 of the agent review): the browser's speech service, which may send the sound to its servers */
  say(told?"Listening. Press Speak again to stop.":"Listening. Your browser's speech service (Google in Chrome, Apple in Safari) turns your voice into text and may send the sound to its servers. Qordel keeps only the text. Press Speak again to stop.");
  try{ r.start(); }catch(e){ if(REC===r) REC=null; micOff(btn); say("Listening could not start. You can type instead."); }
}
(function(){
  var b=$("#bot-mic"); if(!b) return;
  b.addEventListener("click",function(e){ e.stopPropagation(); micInto($("#bot-input"),b,note); });
})();
