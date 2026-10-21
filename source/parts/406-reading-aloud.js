/* ---------------- reading aloud ----------------
   Put back on 2026-10-21 (owner: "close the 3 gaps, start with read aloud"),
   for people who cannot read well, see poorly, or are too tired to read.
   The 2026-10-02 version read every reply aloud by default and listened
   again by itself; this one is calm and asked for. A speaker button on each
   tutor reply and on the cards on Now reads that one thing; pressed again it
   stops. "Read answers aloud" (off by default) reads each new reply by
   itself. The phone's own voice does the speaking (Apple's or Google's); no
   sound leaves the device and nothing is kept. Where the browser has no
   voice, no button is shown.                                              */
var TTS=!!(window.speechSynthesis && window.SpeechSynthesisUtterance), SAY_BTN=null;
var I_SPEAK='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z" fill="currentColor"/><path d="M15.2 9a4.2 4.2 0 0 1 0 6M17.8 6.6a7.6 7.6 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function sayOn(){ return !!(state.me && state.me.readAloud); }
function sayMark(btn,on){
  if(!btn) return;
  btn.setAttribute("aria-pressed",on?"true":"false");
  btn.setAttribute("aria-label",on?"Stop reading":(btn.getAttribute("data-say-label")||"Read this aloud"));
  btn.classList.toggle("on",on);
}
function sayStop(){
  if(!TTS) return;
  try{ speechSynthesis.cancel(); }catch(e){}
  sayMark(SAY_BTN,false); SAY_BTN=null;
}
/* the words as a person would say them: no list dashes, no ids in brackets, a pause at each line */
function sayClean(t){
  return String(t||"").replace(/\[[A-Z0-9-]+\]/g,"").replace(/^\s*[-•]\s*/gm,"").replace(/\s*\n+\s*/g,". ")
    .replace(/\.\s*\./g,".").replace(/\s{2,}/g," ").trim();
}
function sayText(text,btn){
  if(!TTS) return false;
  var again=btn && btn===SAY_BTN;
  sayStop();
  if(again) return false;
  var t=sayClean(text); if(!t) return false;
  var u=new SpeechSynthesisUtterance(t);
  u.lang=micLang(); u.rate=0.95;
  u.onend=u.onerror=function(){ if(SAY_BTN===btn){ sayMark(btn,false); SAY_BTN=null; } };
  SAY_BTN=btn||null; sayMark(btn,true);
  try{ speechSynthesis.speak(u); }catch(e){ sayMark(btn,false); SAY_BTN=null; return false; }
  return true;
}
/* what a card says: its own text, in order, without its buttons' words (an easy thing's name is kept) */
function sayFrom(el){
  if(!el) return "";
  var c=el.cloneNode(true);
  Array.prototype.forEach.call(c.querySelectorAll(".say-btn, .ph-say, .ph-acts, .ph-link, .nb-ico, .nb-go, .nb-dose, .ph-tick, svg, [aria-hidden=true]"),function(x){ x.remove(); });
  var parts=[];
  (function walk(n){
    Array.prototype.forEach.call(n.childNodes,function(k){
      if(k.nodeType===3){ var s=k.textContent.replace(/\s+/g," ").trim(); if(s) parts.push(s); }
      else if(k.nodeType===1) walk(k);
    });
  })(c);
  return parts.join(". ").replace(/([.!?:])\.\s/g,"$1 ");
}
function sayBtn(cls,label){
  if(!TTS) return "";
  return '<button type="button" class="say-btn '+(cls||"")+'" data-sayit="1" data-say-label="'+esc(label)+'" aria-pressed="false" aria-label="'+esc(label)+'">'+I_SPEAK+'</button>';
}
/* every reply in Talk gets a speaker button (Talk is drawn again from its turns, so this runs often) */
function sayReply(d){
  if(!TTS || !d) return;
  var w=document.createElement("div"); w.innerHTML=sayBtn("bot-say","Read this answer aloud"); d.appendChild(w.firstChild);
}
/* a reply that just arrived is read at once when the person asked for that; called once per new reply */
function sayLatest(){
  if(!TTS || !sayOn()) return;
  var all=document.querySelectorAll("#bot-log .bot-msg.bot"), d=all[all.length-1]; if(!d) return;
  sayText(d.getAttribute("data-say-text")||sayFrom(d), d.querySelector("[data-sayit]"));
}
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("[data-sayit]"); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  var box=b.closest(".bot-msg, .ph-card, #now-badge");
  var text=box && box.classList.contains("bot-msg") ? (box.getAttribute("data-say-text")||sayFrom(box)) : sayFrom(box);
  sayText(text,b);
},true);
/* leaving a page stops the voice */
window.addEventListener("hashchange",function(){ sayStop(); });
