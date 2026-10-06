/* ---------------- the banner's hold, and the theme switch ----------------
   The banner stops under a cursor on its own. A phone has no cursor, so the
   button is what a thumb presses, and the choice sticks until it is pressed
   again.                                                                 */
(function(){
  var b=$("#tick-hold"); if(!b) return;
  b.addEventListener("click",function(e){
    e.stopPropagation();
    var on=$("#tick").classList.toggle("held");
    b.setAttribute("aria-pressed",on?"true":"false");
    b.setAttribute("aria-label",on?"Let the banner run":"Hold the banner");
  });
})();

/* Three states, in the order they are wanted: follow the system, then the
   two overrides. The choice lives in its own key, so the snippet at the top
   of the page can read it before anything paints, and it survives a board
   import that replaces everything else.                                  */
var THEME_KEY="oys-theme";
var SUN='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><circle cx="8" cy="8" r="3.1"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1"/></svg>';
var MOON='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><path d="M13.2 9.6A5.8 5.8 0 0 1 6.4 2.8a5.8 5.8 0 1 0 6.8 6.8z"/></svg>';
var AUTO='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><circle cx="8" cy="8" r="6"/><path d="M8 2v12" /><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" stroke="none"/></svg>';
var THEMES=[["system","System",AUTO],["light","Light",SUN],["dark","Dark",MOON]];
function readTheme(){
  try{ var t=localStorage.getItem(THEME_KEY); return (t==="light"||t==="dark")?t:"system"; }
  catch(e){ return "system"; }
}
function paintTheme(){
  var t=readTheme(), r=document.documentElement;
  if(t==="system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme",t);
  var row=THEMES.filter(function(x){ return x[0]===t; })[0]||THEMES[0];
  var ico=$("#theme-ico"), lab=$("#theme-label");
  if(ico) ico.innerHTML=row[2];
  if(lab) lab.textContent=row[1];
  var btn=$("#btn-theme");
  if(btn) btn.setAttribute("title","Theme: "+row[1]+". Press to change.");
  /* the bar at the top of a phone browser follows the board, not the system */
  var dark = t==="dark" || (t==="system" && window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
  var m=document.querySelector('meta[name="theme-color"]:not([media])');
  if(!m){ m=document.createElement("meta"); m.name="theme-color"; document.head.appendChild(m); }
  m.content = dark ? "#08080A" : "#EFEFEC";
  /* the canvas behind the board samples the tokens, so it has to look again */
  requestAnimationFrame(function(){ if(typeof readInk==="function") readInk(); });
}
(function(){
  var btn=$("#btn-theme"); if(!btn) return;
  btn.addEventListener("click",function(){
    var i=0, t=readTheme();
    THEMES.forEach(function(x,k){ if(x[0]===t) i=k; });
    var next=THEMES[(i+1)%THEMES.length][0];
    try{ next==="system" ? localStorage.removeItem(THEME_KEY)
                         : localStorage.setItem(THEME_KEY,next); }catch(e){}
    paintTheme();
  });
  paintTheme();
  if(window.matchMedia){
    var mq=window.matchMedia("(prefers-color-scheme: dark)");
    if(mq.addEventListener) mq.addEventListener("change",function(){
      if(readTheme()==="system") paintTheme(); });
  }
})();

function bindSeek(){
  var boxes=document.querySelectorAll(".seek-in");
  Array.prototype.forEach.call(boxes,function(b){
    b.addEventListener("input",function(){
      searchText=b.value;
      Array.prototype.forEach.call(boxes,function(o){ if(o!==b) o.value=b.value; });
      renderAll();
    });
    b.addEventListener("keydown",function(e){
      if(e.key==="Escape"){ searchText=""; b.value=""; renderAll(); }
    });
  });
}


