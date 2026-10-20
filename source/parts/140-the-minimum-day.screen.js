function renderFloor(){
  var box=$("#floor"); if(!box) return;
  var f=floorState();
  if(!state.me || !state.me.done){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  if(!f.items.length){
    box.innerHTML='<button class="floor-set" data-floor-edit>Add your easy things: what you do when your energy is low</button>';
    return;
  }
  var on=floorToday(), days=floorDays(14), low=doseNow().band==="low";
  box.innerHTML='<div class="floor-k">My easy things <span class="floor-n">'+on.length+' of '+f.items.length+'</span></div>'+
    '<div class="floor-chips">'+f.items.map(function(x){
      return '<button type="button" class="floor-chip" data-floor="'+esc(x.id)+'" aria-pressed="'+(on.indexOf(x.id)>=0)+'">'+esc(x.t)+'</button>';
    }).join("")+'</div>'+
    '<div class="floor-foot">'+
      (floorMet() ? '<span>That counts as a day, whatever else happened.</span>' : low ? '<span>Low energy: one of these is enough.</span>' : '')+
      (days.seen ? '<span>Met on '+days.met+' of the last 14 days.</span>' : '')+
      '<button class="mini" data-floor-edit>Edit</button></div>';
}
