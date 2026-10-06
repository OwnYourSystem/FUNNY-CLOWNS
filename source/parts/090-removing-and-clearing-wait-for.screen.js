function pendRender(){
  var box=$("#bot-pend"); if(!box) return;
  if(PEND && Date.now()-PEND.at>PEND_MS) PEND=null;
  if(!PEND){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML="<span>"+esc(PEND.label)+"?</span>"+
    '<button class="btn danger" data-pend-yes>'+esc(PEND.verb)+'</button><button class="btn" data-pend-no>Keep it</button>';
}
