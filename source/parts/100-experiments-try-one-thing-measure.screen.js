function renderExp(){
  var box=$("#exp-card"); if(!box) return;
  expTick();
  var st=expStatus();
  if(st.state==="none" || (st.state==="finished" && !st.unseen)){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  if(st.state==="running"){
    box.innerHTML='<div class="p-head"><div><div class="p-title">Experiment &mdash; day '+st.day+' of '+st.days+'</div></div>'+
      '<div class="p-tools"><button class="mini" data-exp-stop>Stop</button></div></div>'+
      '<p class="exp-do">'+esc(st.do)+'</p>'+
      '<p class="exp-w">Measuring '+esc(st.measures)+', against the '+st.days+' days before. Nothing to read until it ends on '+esc(st.ends)+
      '. Source: ['+esc(st.id)+'], practitioner opinion.</p>';
  } else {
    box.innerHTML='<div class="p-head"><div><div class="p-title">Experiment finished &mdash; '+esc(st.id)+'</div></div>'+
      '<div class="p-tools"><button class="mini" data-exp-read>Read the result</button><button class="mini" data-exp-ack>Got it</button></div></div>'+
      '<p class="exp-do">'+esc((libEntry(st.id)||{tryit:{do:""}}).tryit.do)+'</p>'+
      '<p class="exp-w">'+esc(expShort(st.result))+' The numbers are under Read the result.</p>';
  }
}
