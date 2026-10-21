/* the board's finding, on the desktop: one quiet card under the easy things */
function renderLearn(){
  var box=$("#learncard"); if(!box) return;
  var m=(state.me&&state.me.done)?memTick():null;
  if(!m){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML='<div class="floor-k">Something I noticed</div><p class="learn-t">'+esc(m.t)+'</p>'+
    (m.evid?'<p class="learn-e">'+esc(m.evid)+'</p>':'')+
    '<div class="floor-foot"><button class="btn take" data-learn-keep="'+esc(m.id)+'">Keep it</button>'+
    '<button class="mini" data-learn-no="'+esc(m.id)+'">Not now</button></div>';
}
