/* ---------------- tags ---------------- */
function renderTags(){
  var grid=$("#tag-grid"); if(!grid) return;
  var q=searchQ(), tags=allTags().filter(function(x){ return hit(x.t,q)||!q; });
  grid.innerHTML = tags.length ? tags.map(function(x){
    var gs=state.groups.filter(function(g){ return g.tags.indexOf(x.t)>=0; });
    var pct=gs.length?Math.round(gs.reduce(function(t,g){ return t+groupPct(g); },0)/gs.length):0;
    var on=state.tagFilter.indexOf(x.t)>=0;
    return '<button class="tcard" data-tagpick="'+esc(x.t)+'" aria-pressed="'+on+'">'+
      '<div class="tn">'+esc(x.t)+'</div>'+
      '<div class="tbig '+band(pct)+'" style="color:var(--'+band(pct)+')">'+pct+'%</div>'+
      '<div class="tsub">'+x.n+' goal'+(x.n>1?"s":"")+'</div>'+
      '<div class="track">'+GRID+'<div class="fill '+band(pct)+'" style="width:'+pct+'%"></div></div>'+
      '</button>';
  }).join("") : '<p class="calm">No tags yet. Add up to five to any goal from its pen.</p>';

  var list=$("#tag-goals");
  var picked=state.tagFilter.length?goalsShown():[];
  list.innerHTML = picked.length ? picked.map(gcard).join("")
    : '<p class="calm">'+(state.tagFilter.length?"Nothing carries all of those tags.":"Press a tag to see its goals.")+'</p>';
}
function gcard(g){
  var p=groupPct(g), n=daysLeft(g);
  return '<div class="gcard"><span class="pill pr-'+g.prio+'"><i></i>'+g.prio.toUpperCase()+'</span>'+
    '<button class="gname" style="background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer" '+
      'data-goto-goal="'+g.id+'" data-goto-sub="">'+esc(g.name)+'</button>'+
    (n!==null?'<span class="gmeta">'+esc(dueLabel(g))+'</span>':"")+
    '<span class="gmeta '+band(p)+'" style="color:var(--'+band(p)+')">'+p+'%</span></div>';
}

