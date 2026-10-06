function renderFollow(){
  var box=$("#est-follow"); if(!box) return;
  var x=estState(), id=x.ask, it=id&&x.items[id], sb=id&&state.subs[id];
  if(!it||!sb){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML='You finished &ldquo;'+esc(sb.name)+'&rdquo;. About how long did it take? You guessed '+it.m+' min.'+
    '<div class="row-btns"><button class="btn take" data-est-log>Tell the board</button><button class="btn" data-est-skip>Skip</button></div>';
}
