/* ---------------- table views ---------------- */
function toggleView(btn,bars,ax,tb){
  var on=btn.getAttribute("aria-pressed")==="true";
  btn.setAttribute("aria-pressed",on?"false":"true");
  btn.textContent=on?"Table":"Chart";
  $(bars).hidden=!on; $(ax).hidden=!on; $(tb).hidden=on;
}
$("#tv-main").addEventListener("click",function(){ toggleView(this,"#main-bars","#axis-main","#main-table"); });
$("#tv-sub").addEventListener("click",function(){ toggleView(this,"#sub-bars","#axis-sub","#sub-table"); });

