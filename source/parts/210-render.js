/* ---------------- render ---------------- */
var GRIP='<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true"><circle cx="2.5" cy="4" r="1.3"/><circle cx="7.5" cy="4" r="1.3"/><circle cx="2.5" cy="8" r="1.3"/><circle cx="7.5" cy="8" r="1.3"/><circle cx="2.5" cy="12" r="1.3"/><circle cx="7.5" cy="12" r="1.3"/></svg>';
var PEN='<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 2.5l2 2L6 12l-3 1 1-3z"/></svg>';
var GRID='<i class="gl" style="left:25%"></i><i class="gl" style="left:50%"></i><i class="gl" style="left:75%"></i>';
var openEd="", openGroupEd=false, flash="", flashT=0;

function axis(el){ el.innerHTML=[0,25,50,75,100].map(function(v,i){
  var st=i===0?"left:0":(i===4?"right:0":"left:"+v+"%;transform:translateX(-50%)");
  return '<span style="'+st+'">'+v+"%</span>"; }).join(""); }
axis($("#axis-main")); axis($("#axis-sub"));
$("#ns-rep").innerHTML=REPEATS.map(function(o){
  return '<option value="'+o[0]+'">'+o[1]+"</option>"; }).join("");

function goalsShown(){
  var q=searchQ(), tf=state.tagFilter||[];
  return state.groups.filter(function(g){
    if(tf.length && !tf.every(function(t){ return g.tags.indexOf(t)>=0; })) return false;
    if(!q) return true;
    if(hit(g.name,q)) return true;
    if(g.tags.some(function(t){ return hit(t,q); })) return true;
    return g.subs.some(function(id){ var x=state.subs[id]; return x&&hit(x.name,q); });
  });
}
function goalRow(g){
  var p=groupPct(g), sel=g.id===state.sel, b=band(p), n=daysLeft(g);
  var late=(n!==null&&n<0), soon=(n!==null&&n>=0&&n<=3);
  return '<div class="row pick'+(sel?" sel":"")+'" data-group="'+g.id+'" data-tip="'+esc(g.name)+"|"+p+"% · "+groupDone(g)+" of "+g.subs.length+' done">'+
    '<div class="rhead"><button class="grip" data-grip="task:'+g.id+'" aria-label="Drag '+esc(g.name)+'">'+GRIP+'</button>'+
    '<span class="rname">'+esc(g.name)+'</span>'+
    '<span class="pill pr-'+g.prio+'"><i></i>'+g.prio.toUpperCase()+'</span>'+
    (n!==null?'<span class="pill due'+(late?" late":(soon?" soon":""))+'">'+esc(dueLabel(g))+'</span>':"")+
    '<span class="rmeta">'+groupDone(g)+"/"+g.subs.length+'</span>'+
    '<span class="rval '+b+'">'+p+'%</span>'+
    '<button class="pen" data-gedit="'+g.id+'" aria-expanded="'+(sel&&openGroupEd)+
      '" aria-label="Edit '+esc(g.name)+'">'+PEN+'</button></div>'+
    (g.tags.length?'<div class="tagrow">'+g.tags.map(function(t){
      return '<button class="tag" data-tagpick="'+esc(t)+'">'+esc(t)+'</button>'; }).join("")+'</div>':"")+
    '<div class="track">'+GRID+'<div class="fill '+b+'" style="width:'+p+'%"></div></div></div>';
}
function renderFilter(){
  var bar=$("#filterbar"); if(!bar) return;
  var tf=state.tagFilter||[], q=searchQ();
  if(!tf.length && !q){ bar.hidden=true; bar.innerHTML=""; return; }
  bar.hidden=false;
  bar.innerHTML='<span class="fb-k">Showing</span>'+
    (q?'<span class="tag on">\u201c'+esc(q)+'\u201d</span>':"")+
    tf.map(function(t){ return '<button class="tag on" data-tagpick="'+esc(t)+'">'+esc(t)+' \u00d7</button>'; }).join("")+
    '<button class="btn" id="fb-clear">Clear</button>';
}
/* Wide screens stack the goals, so the editor drops in straight under the one
   it belongs to. Below 820px the goals become a sideways strip of cards and
   nothing can sit between two of them, so there the editor keeps its own slot
   under the strip. stripMode tells the two apart.                           */
function stripMode(){ return window.innerWidth<=820; }
function renderMain(){
  renderFilter();
  var shown=goalsShown(), strip=stripMode();
  $("#main-bars").innerHTML=shown.map(function(g){
      return goalRow(g)+((!strip && openGroupEd && g.id===state.sel) ? goalEditor(g) : "");
    }).join("")||
    '<p class="calm">'+(state.groups.length?"Nothing matches.":"No goals yet. Add one below.")+'</p>';
  var gsel=gById(state.sel);
  $("#main-editor").innerHTML = (strip && openGroupEd && gsel) ? goalEditor(gsel) : "";
  $("#main-table").innerHTML=tbl(shown.map(function(g){
    return [esc(g.name), groupDone(g)+" / "+g.subs.length, groupPct(g)+"%"]; }),
    ["Goal","Subtasks done","Complete"]);
}
function goalEditor(g){
  return '<div class="editor">'+
    '<label class="wide">Goal<input class="f" data-ged="name" value="'+esc(g.name)+'"></label>'+
    '<label>Deadline<input class="f" type="date" data-ged="due" value="'+esc(g.due||"")+'"></label>'+
    '<label>Priority<select class="f" data-ged="prio">'+PRIOS.map(function(o){
      return '<option value="'+o[0]+'"'+(g.prio===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+'</select></label>'+
    '<label>Where<select class="f" data-ged="where">'+WHERES.map(function(o){
      return '<option value="'+o[0]+'"'+((g.where||"any")===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+'</select></label>'+
    '<label class="wide">Tags, up to five, separated by commas'+
      '<input class="f" data-ged="tags" value="'+esc(g.tags.join(", "))+'" placeholder="sap, migration, q4"></label>'+
    '<div class="acts">'+
      '<button class="btn" data-gback="'+g.id+'">Move to backlog</button>'+
      '<button class="btn" data-gdone="'+g.id+'">Archive this goal</button>'+
      '<button class="btn danger" data-gdel="'+g.id+'">Remove it and its '+g.subs.length+' subtasks</button>'+
    '</div></div>';
}

/* the strip scrolls the picked card into view; on a wide screen it does nothing */
function showPicked(){
  if(window.innerWidth>820) return;
  var el=$("#main-bars").querySelector(".row.sel");
  if(!el||!el.scrollIntoView) return;
  try{ el.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"}); }catch(e){}
}
/* Furthest along first. g.subs itself keeps insertion order, since that is
   what subScore and the rest of the ranking read; only what is shown here
   is sorted, so the list reads as progress without touching the planner.
   The sort is stable, so two subtasks at the same percent keep their
   relative order instead of reshuffling on every render.               */
function subsShown(g){
  var q=searchQ();
  return g.subs.filter(function(id){ var x=state.subs[id]; return x && hit(x.name,q); })
    .sort(function(a,b){ return (state.subs[b].pct||0)-(state.subs[a].pct||0); });
}
function renderSubs(){
  var g=gById(state.sel);
  if(!g){ $("#sub-bars").innerHTML=""; $("#sub-title").textContent="nothing selected"; return; }
  $("#sub-title").textContent=g.name;
  /* the editor itself lives with the main tasks, where it belongs */
  $("#group-editor").innerHTML="";
  $("#edit-group").setAttribute("aria-expanded", openGroupEd?"true":"false");

  $("#sub-bars").innerHTML=subsShown(g).map(function(id){
    var s=state.subs[id]; if(!s) return "";
    var st=statusOf(s), n=daysLeft(s);
    var late=(n!==null&&n<0), soon=(n!==null&&n>=0&&n<=3);
    return '<div class="row" data-sub="'+s.id+'">'+
      '<div class="rhead"><button class="grip" data-grip="sub:'+s.id+'" aria-label="Drag '+esc(s.name)+'">'+GRIP+'</button>'+
      '<span class="rname">'+esc(s.name)+'</span>'+
      (s.rep?'<span class="pill rep">'+esc(repLabel(s.rep))+'</span>':"")+
      (s.rep&&s.streak?'<span class="rmeta" title="Periods finished in a row">'+s.streak+'\u00d7</span>':"")+
      (s.tag?'<span class="pill">'+esc(s.tag)+'</span>':"")+
      ((s.prio&&s.prio!=="mid")?'<span class="pill pr-'+s.prio+' sub"><i></i>'+
        s.prio.toUpperCase()+'</span>':"")+
      (n!==null?'<span class="pill due sub'+(late?" late":(soon?" soon":""))+'">'+esc(dueLabel(s))+'</span>':"")+
      '<span class="pill s-'+st.k+'"><i></i>'+st.label+'</span>'+
      '<span class="rval '+band(s.pct)+'">'+s.pct+'%</span>'+
      '<button class="pen" data-ed-open="'+s.id+'" aria-expanded="'+(openEd===s.id)+'" aria-label="Edit '+esc(s.name)+'">'+PEN+'</button></div>'+
      '<div class="track scrub" data-scrub="'+s.id+'" data-tip="'+esc(s.name)+"|"+s.pct+"% · "+st.label+'" role="slider" tabindex="0" aria-label="'+esc(s.name)+' progress" aria-valuenow="'+s.pct+'" aria-valuemin="0" aria-valuemax="100">'+
      GRID+'<div class="fill '+band(s.pct)+'" style="width:'+s.pct+'%"></div></div>'+
      (openEd===s.id?subEditor(s):"")+"</div>";
  }).join("")||'<p class="calm">No subtasks yet. Add one above.</p>';

  $("#sub-table").innerHTML=tbl(subsShown(g).map(function(id){
    var s=state.subs[id]; if(!s) return ["","",""];
    return [esc(s.name), statusOf(s).label, s.pct+"%"]; }),
    ["Subtask","Status","Complete"]);
}
function subEditor(s){
  return '<div class="editor" data-ed-for="'+s.id+'">'+
    '<label class="wide">Name<input class="f" data-ed="name" value="'+esc(s.name)+'"></label>'+
    '<label>Status<select class="f" data-ed="status">'+STATUSES.map(function(o){
      return '<option value="'+o[0]+'"'+(s.status===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+'</select></label>'+
    '<label>Priority, inside this goal<select class="f" data-ed="prio">'+PRIOS.map(function(o){
      return '<option value="'+o[0]+'"'+((s.prio||"mid")===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+'</select></label>'+
    '<label>Deadline<input class="f" type="date" data-ed="due" value="'+esc(s.due||"")+'"></label>'+
    '<label>Repeats<select class="f" data-ed="rep">'+REPEATS.map(function(o){
      return '<option value="'+o[0]+'"'+((s.rep||"")===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+'</select></label>'+
    '<label>Done %<input class="f" type="number" min="0" max="100" step="5" data-ed="pct" value="'+s.pct+'"></label>'+
    '<label>Tag<input class="f" data-ed="tag" value="'+esc(s.tag)+'" placeholder="Planning"></label>'+
    '<div class="acts"><button class="btn danger" data-del="'+s.id+'">Remove subtask</button>'+
    '<span style="font-size:12px;color:var(--muted)">Drag this row onto another main task to move it there.</span></div>'+
  '</div>';
}
function tbl(rows,head){
  return '<table class="tv"><thead><tr><th>'+head[0]+'</th><th>'+head[1]+'</th><th style="text-align:right">'+head[2]+'</th></tr></thead><tbody>'+
    rows.map(function(r){ return "<tr><td>"+r[0]+"</td><td>"+r[1]+'</td><td class="num">'+r[2]+"</td></tr>"; }).join("")+"</tbody></table>";
}

function renderKpis(){
  var a=allSubs(), o=overall(), done=0;
  a.forEach(function(s){ if(s.pct>=100||s.status==="done") done++; });
  ease($("#kpi-overall"),o,1,"%");
  ease($("#kpi-done"),done,0,"");
  $("#kpi-done-sub").textContent="of "+a.length+" subtasks";
  var al=alerts();
  var hot=al.filter(function(a){ return a.score>=150; }).length;
  /* on a low day the board does not push, so it does not count what it would push on */
  if(doseNow().band==="low"){
    $("#kpi-alert").textContent="\u2013";
    $("#kpi-alert-sub").textContent="paused on a low day";
  } else {
    ease($("#kpi-alert"),hot,0,"");
    $("#kpi-alert-sub").textContent=hot?"past or near a deadline you called important":"nothing needs attention";
  }
  var planned=state.oftad.length+state.done.length;
  $("#kpi-today").textContent=state.done.length+"/"+planned;
  $("#kpi-today-sub").textContent=planned?"of the day’s plan":"nothing picked yet";
  /* no delta until there is something real to compare against */
  var h=state.hist, de=$("#kpi-delta"), sub=$("#kpi-delta-sub");
  if(h.length<3){
    de.textContent="Recording since "+h[0].d;
    de.className="delta";
    if(sub) sub.textContent="";
  } else {
    var back=Math.min(8,h.length), prev=h[h.length-back].v, d=Math.round((o-prev)*10)/10;
    de.textContent=(d>=0?"+":"")+d.toFixed(1)+" pts";
    de.className="delta"+(d>=0?" up":"");
    if(sub) sub.textContent="vs "+(back-1)+" days ago";
  }
  drawSpark();
}
function drawSpark(){
  var h=state.hist.slice(-14); if(!h.length) return;
  var W=260,H=44,p=4, vals=h.map(function(x){ return x.v; });
  var lo=Math.max(0,Math.min.apply(null,vals)-2), hi=Math.max.apply(null,vals)+2, sp=(hi-lo)||1;
  var X=function(i){ return p+i*(W-2*p)/Math.max(1,h.length-1); };
  var Y=function(v){ return H-p-((v-lo)/sp)*(H-2*p); };
  var line=h.map(function(x,i){ return (i?"L":"M")+X(i).toFixed(1)+" "+Y(x.v).toFixed(1); }).join(" ");
  $("#spark").innerHTML='<path d="'+line+" L"+X(h.length-1).toFixed(1)+" "+(H-p)+" L"+X(0).toFixed(1)+" "+(H-p)+'Z" fill="color-mix(in srgb, var(--run) 12%, transparent)"/>'+
    '<path d="'+line+'" fill="none" stroke="var(--run)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>'+
    '<circle cx="'+X(h.length-1).toFixed(1)+'" cy="'+Y(h[h.length-1].v).toFixed(1)+'" r="2.6" fill="var(--run)"/>';
}
