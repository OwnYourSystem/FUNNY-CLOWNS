function renderJournal(){
  var card=$("#jr-check"), body=$("#jr-body");
  if(card){
    var c=(state.me&&state.me.done)?jrCardOn():null;
    if(!c){ card.hidden=true; card.innerHTML=""; }
    else {
      var s=jrSays(c);
      card.hidden=false;
      card.innerHTML='<div class="jr-k">Where you left off &middot; '+esc(s.head)+'</div>'+
        '<details class="jr-peek"><summary>Show the note</summary>'+s.lines.map(function(t){ return '<p>'+esc(t)+'</p>'; }).join("")+'</details>'+
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

document.addEventListener("click",function(e){
  var ed=e.target.closest&&e.target.closest("[data-jr-edit]");
  if(ed){ e.stopPropagation(); jrEditAsk(ed.getAttribute("data-jr-edit")); return; }
  var dl=e.target.closest&&e.target.closest("[data-jr-del]");
  if(dl){ e.stopPropagation(); jrRemoveAsk(dl.getAttribute("data-jr-del")); }
});
