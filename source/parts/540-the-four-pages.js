/* ---------------- the four pages ----------------
   One board, four ways in. The rail is a pill row on a desktop and a tab bar
   along the bottom of a phone, which is where a thumb already is.        */
var I_BOARD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 19V9M10 19V5M16 19v-6M21 19H3"/></svg>';
var I_TAGS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11V4h7l10 10-7 7L3 11z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>';
var I_BACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h9"/></svg>';
var I_ARCH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18v4H3zM5 11v9h14v-9M10 15h4"/></svg>';
var I_PLAN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
var PAGES=[["board","Board",I_BOARD],["planner","Planner",I_PLAN],["tags","Tags",I_TAGS],["backlog","Backlog",I_BACK],["archive","Archive",I_ARCH]];

(function(){
  var rail=$("#rail");
  PAGES.forEach(function(v){
    var b=document.createElement("button");
    b.type="button"; b.dataset.view=v[0];
    b.innerHTML=v[2]+'<span>'+v[1]+'</span>'+(v[0]==="board"?'<span class="bell" id="rail-bell" hidden></span>':"");
    b.addEventListener("click",function(){ location.hash="#/"+v[0]; });
    rail.appendChild(b);
  });
})();
function showView(v){
  if(!PAGES.some(function(x){ return x[0]===v; })) v="board";
  curView=v;
  PAGES.forEach(function(x){
    var el=$("#v-"+x[0]); if(el) el.classList.toggle("is-on",x[0]===v);
  });
  Array.prototype.forEach.call($("#rail").children,function(b){
    if(b.dataset.view===v) b.setAttribute("aria-current","page");
    else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("on-board",v==="board");
  renderAll();
  scrollTo(0,0);
}
function readHash(){
  var m=String(location.hash||"").match(/^#\/([a-z]+)/);
  showView(m?m[1]:"board");
}

