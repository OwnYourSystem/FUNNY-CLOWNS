function renderWeek(){
  var box=$("#week-body"), nudge=$("#week-nudge"), l=weekData().log;
  if(nudge){
    if(state.me && state.me.done && weekDue()){
      nudge.hidden=false; nudge.className="floor";
      nudge.innerHTML='<button class="floor-set" data-week-open>Weekly check-in: five taps, kept on this device only</button>';
    } else { nudge.hidden=true; nudge.innerHTML=""; }
  }
  if(!box) return;
  if(!l.length){ box.innerHTML='<p class="wk-note">No check-ins yet.</p>'; return; }
  var rows=l.slice(-8).reverse();
  box.innerHTML='<div class="wk-scroll"><table class="wk-table"><thead><tr><th>Week</th>'+
    WEEK_ITEMS.map(function(it){ return "<th>"+esc(it[1].replace("Something that mattered to me","Mattered").replace("Getting through the day","Got through"))+"</th>"; }).join("")+
    '<th>Finished</th></tr></thead><tbody>'+
    rows.map(function(x){
      return "<tr><td>"+esc(x.k.slice(5))+" &middot; "+esc(x.d.slice(5))+"</td>"+WEEK_ITEMS.map(function(it){ return "<td>"+x[it[0]]+"</td>"; }).join("")+"<td>"+x.n+"</td></tr>";
    }).join("")+'</tbody></table></div>'+
    (weekNote()?'<p class="wk-note">'+esc(weekNote())+'</p>':"");
}
