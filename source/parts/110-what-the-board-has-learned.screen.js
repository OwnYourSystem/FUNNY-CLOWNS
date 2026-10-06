function renderLearn(){
  var box=$("#learn-card"); if(!box) return;
  memTick(false);
  var m=memProposed();
  if(!m){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML='<div class="p-head"><div><div class="p-title">'+(m.src==="tutor"?"The tutor would like to remember":"The board noticed")+'</div></div></div>'+
    '<p class="exp-do">'+esc(m.t)+'</p>'+
    (m.evid?'<p class="exp-w">'+esc(m.evid)+'</p>':"")+
    '<div class="now-acts">'+
      (m.k==="hint"
        ? '<button class="btn take" data-mem-try="'+esc(m.id)+'">Try it</button>'
        : '<button class="btn take" data-mem-yes="'+esc(m.id)+'">'+(m.apply?"Use it":"Keep it")+'</button>')+
      '<button class="btn" data-mem-no="'+esc(m.id)+'">Not now</button>'+
    '</div>';
}
function renderMemList(){
  var box=$("#mem-list"); if(!box) return;
  var k=memKept();
  box.innerHTML=k.length ? k.map(function(m){
    var lapse=m.src==="you" ? "stays until you remove it" : "lapses "+addDays(m.seen,MEM_LAPSE)+" unless it shows up again";
    return '<div class="heldrow"><span class="hn">'+esc(m.t)+'</span><span class="hw">'+
      esc(m.src==="you"?"you told it":m.src==="tutor"?"the tutor suggested, you kept it":"learned from what you did")+
      ' · '+esc(lapse)+(m.evid?' · '+esc(m.evid):"")+
      ' <button class="mini" data-mem-del="'+esc(m.id)+'">Remove</button></span></div>';
  }).join("") : '<p class="calm">Nothing kept yet. When it notices a pattern it will ask you first.</p>';
  var b=$("#mem-learn");
  if(b){ b.setAttribute("aria-pressed",memLearnOn()?"true":"false"); b.textContent=memLearnOn()?"Learning on":"Learning off"; }
}
function memRoute(e){
  var x;
  x=e.target.closest("[data-mem-yes]");
  if(x){ try{ memKeep(x.dataset.memYes); }catch(er){ toast("Memory",er.message); } save(); renderAll(); return true; }
  x=e.target.closest("[data-mem-no]");
  if(x){ memDrop(x.dataset.memNo,true); save(); renderAll(); return true; }
  x=e.target.closest("[data-mem-try]");
  if(x){ var m=memList().filter(function(y){ return y.id===x.dataset.memTry; })[0];
    if(m){ expAsk(m.suggest).then(function(yes){ if(!yes) return; try{ expStart(m.suggest); }catch(er){ toast("Experiment",er.message); } memDrop(m.id,true); save(); renderAll(); }); } return true; }
  x=e.target.closest("[data-mem-del]");
  if(x){ memDrop(x.dataset.memDel,false); save(); renderAll(); return true; }
  return false;
}
