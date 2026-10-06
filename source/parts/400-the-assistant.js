/* ---------------- the assistant ----------------
   A plain chat panel: type, and press Send. There is no voice and no
   microphone anywhere in this board, and nothing in it asks for one. The
   assistant can change every setting and every list you can change by hand,
   and it can answer from your own numbers. It never sees your weekly
   check-ins.                                                              */
var SHEET=$("#botsheet"), ABTN=$("#btn-assistant");
function note(t){ var n=$("#bot-note"); n.textContent=t||""; n.hidden=!t; }
function botOpen(on){
  state.botOpen=!!on; save();
  SHEET.hidden=!on;
  ABTN.setAttribute("aria-expanded",on?"true":"false");
  if(on){ botRender(); try{ $("#bot-input").focus(); }catch(e){} }
}
/* a short notice, for a feature to say one small thing. Plain text, no motion. */
var NOTEEL=$("#flashnote"), noteT=null;
function toast(said,reply){
  if(!NOTEEL) return;
  var msg=(reply===undefined||reply===null||reply==="")?said:(said?said+": "+reply:reply);
  clearTimeout(noteT); NOTEEL.textContent=msg; NOTEEL.hidden=false;
  noteT=setTimeout(function(){ NOTEEL.hidden=true; },5000+Math.min(String(msg).length*40,8000));
}
function hideToast(){ if(NOTEEL) NOTEEL.hidden=true; }
ABTN.addEventListener("click",function(){ botOpen(SHEET.hidden); });
$("#bot-min").addEventListener("click",function(e){ e.stopPropagation(); botOpen(false); });
document.addEventListener("keydown",function(e){
  if(e.key==="Escape" && !SHEET.hidden && SHEET.contains(document.activeElement) && !document.querySelector("dialog[open]")){ botOpen(false); ABTN.focus(); }
});

(function(){
  if(!window.claude||typeof claude.use!=="function") return;
  try{
    claude.use("db").then(function(db){
      if(!db) return;
      boardDb=db;
      joinBoard();
      mirrorToday();
      /* the store arrives after the first paint, so say so once it has */
      if(typeof paintWhere==="function") paintWhere();
    }).catch(function(){});
  }catch(e){}
})();
function cardLine(c){ return {task:cardFrom(c), name:cardName(c), percent:cardPct(c)}; }
