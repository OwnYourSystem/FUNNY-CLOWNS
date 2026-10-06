function renderBarrier(){
  var box=$("#barrier-card"); if(!box) return;
  if(barTouch()) save();
  var show=barShow(), q=barPending();
  var xs=state.exp&&state.exp.done&&state.exp.done.length&&state.exp.unseen;
  if((!show && !q) || memProposed() || xs){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  if(show){
    box.innerHTML='<div class="p-head"><div><div class="p-title">Thank you for saying</div></div></div>'+
      '<p class="exp-do">'+esc(show.text)+'</p>'+
      '<div class="now-acts">'+(show.tryId?'<button class="btn take" data-bar-try="'+esc(show.tryId)+'">Try '+esc(show.tryId)+'</button>':"")+
      '<button class="btn'+(show.tryId?"":" take")+'" data-bar-ok>Got it</button></div>';
    return;
  }
  box.innerHTML='<div class="p-head"><div><div class="p-title">Three low days in a row</div></div></div>'+
    '<p class="exp-do">That is information, not a failure. What is closest to what is in the way?</p>'+
    '<div class="now-acts">'+BAR_ORDER.map(function(k){
      return '<button class="btn" data-bar="'+k+'">'+BAR_WHY[k].label+'</button>'; }).join("")+
    '<button class="btn" data-bar-later>Not now</button></div>';
}
function barRoute(e){
  var x=e.target.closest("[data-bar]");
  if(x){ barAnswer(x.dataset.bar); renderAll(); return true; }
  if(e.target.closest("[data-bar-later]")){ barSnooze(); renderAll(); return true; }
  x=e.target.closest("[data-bar-try]");
  if(x){ var bid=x.dataset.barTry;
    expAsk(bid).then(function(yes){ if(!yes) return; try{ expStart(bid); }catch(er){ toast("Experiment",er.message); } barState().show=null; save(); renderAll(); });
    return true; }
  if(e.target.closest("[data-bar-ok]")){ barState().show=null; save(); renderAll(); return true; }
  return false;
}
