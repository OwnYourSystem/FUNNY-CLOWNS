/* ---------------- backlog ----------------
   Things worth doing that are not a goal yet. Somewhere to put an idea so it
   stops taking up room in your head.                                    */
function renderBacklog(){
  var box=$("#backlog-list"); if(!box) return;
  var q=searchQ();
  var items=state.backlog.filter(function(b){ return hit(b.t,q); });
  box.innerHTML = items.length ? items.map(function(b){
    var i=state.backlog.indexOf(b), g=b.goal, p=g?groupPct(g):0, n=g?daysLeft(g):null;
    return '<div class="gcard"><span class="gmeta">'+esc(b.d)+'</span>'+
      '<span class="gname">'+esc(b.t)+'</span>'+
      (g?'<span class="gmeta">'+g.subs.length+' subtasks</span>'+
         (n!==null?'<span class="gmeta">'+esc(dueLabel(g))+'</span>':"")+
         '<span class="gmeta '+band(p)+'" style="color:var(--'+band(p)+')">'+p+'%</span>':"")+
      '<button class="btn" data-bl-goal="'+i+'">'+(g?"Make it active":"Make it a goal")+'</button>'+
      '<button class="btn danger" data-bl-del="'+i+'">Remove</button></div>';
  }).join("") : '<p class="calm">'+(state.backlog.length?"Nothing matches.":"Nothing waiting. Add the next idea above.")+'</p>';
}

