function renderJournal(){
  var card=$("#jr-check"), body=$("#jr-body");
  if(card){
    var c=(state.me&&state.me.done)?jrCardOn():null;
    if(!c){ card.hidden=true; card.innerHTML=""; }
    else {
      var s=jrSays(c);
      card.hidden=false;
      card.innerHTML='<div class="jr-k">Where you left off &middot; '+esc(s.head)+'</div>'+
        s.lines.map(function(t){ return '<p>'+esc(t)+'</p>'; }).join("")+
        '<div class="jr-acts"><button class="mini" data-jr-write="start">Write today&rsquo;s start</button><button class="mini" data-jr-hide>Hide</button></div>';
    }
  }
  if(body) body.innerHTML=jrListHtml();
}
document.addEventListener("click",function(e){
  var w=e.target.closest&&e.target.closest("[data-jr-write]");
  if(w){ e.stopPropagation(); jrAsk(w.getAttribute("data-jr-write")||""); return; }
  if(e.target.closest&&e.target.closest("[data-jr-hide]")){ jrHide(); renderAll(); }
});
