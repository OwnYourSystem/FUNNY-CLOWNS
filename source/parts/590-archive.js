/* ---------------- archive ---------------- */
function renderArchive(){
  var box=$("#archive-list"); if(!box) return;
  var q=searchQ();
  var items=state.archive.filter(function(g){ return hit(g.name,q); });
  box.innerHTML = items.length ? items.map(function(g){
    var p=groupPct(g);
    return '<div class="gcard"><span class="gmeta">'+esc(g.archivedAt||"")+'</span>'+
      '<span class="gname">'+esc(g.name)+'</span>'+
      '<span class="gmeta">'+g.subs.length+' subtasks</span>'+
      '<span class="gmeta '+band(p)+'" style="color:var(--'+band(p)+')">'+p+'%</span>'+
      '<span class="gacts"><button class="btn" data-unarch="'+g.id+'">Put it back</button></span></div>';
  }).join("") : '<p class="calm">'+(state.archive.length?"Nothing matches.":"Nothing archived yet. Finish a goal and archive it from its pen.")+'</p>';
}

$("#bl-add").addEventListener("click",function(){
  var v=$("#bl-name").value.trim(); if(!v){ $("#bl-name").focus(); return; }
  backlogAdd(v);
  $("#bl-name").value="";
  save(); renderAll();
});
$("#bl-name").addEventListener("keydown",function(e){ if(e.key==="Enter") $("#bl-add").click(); });

