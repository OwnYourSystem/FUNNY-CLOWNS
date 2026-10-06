function renderFloor(){
  var box=$("#floor"); if(!box) return;
  var f=floorState();
  if(!state.me || !state.me.done){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  if(!f.items.length){
    box.innerHTML='<button class="floor-set" data-floor-edit>Set a minimum day: the few things that count even when nothing else moves</button>';
    return;
  }
  var on=floorToday(), days=floorDays(14), low=doseNow().band==="low";
  box.innerHTML='<div class="floor-k">Minimum day <span class="floor-n">'+on.length+' of '+f.items.length+'</span></div>'+
    '<div class="floor-chips">'+f.items.map(function(x){
      return '<button type="button" class="floor-chip" data-floor="'+esc(x.id)+'" aria-pressed="'+(on.indexOf(x.id)>=0)+'">'+esc(x.t)+'</button>';
    }).join("")+'</div>'+
    '<div class="floor-foot">'+
      (floorMet() ? '<span>Done. That counts as a day, whatever else happened.</span>' : low ? '<span>A low day: these are enough.</span>' : '')+
      (days.seen ? '<span>Met on '+days.met+' of the last 14 days.</span>' : '')+
      '<button class="mini" data-floor-edit>Edit</button></div>';
}
