/* ---- Backlog, Archive, Tags (2026-10-18) ----
   The phone's own pages for what the board shows as its Backlog, Archive and
   Tags pages. Rows open a sheet with what can be done to them; anything that
   can be taken back has Undo. Both views call the same functions. */
function phSeg(cur){
  function a(r,t){ return '<a href="#/'+r+'"'+(cur===r?' aria-current="page"':'')+'>'+t+'</a>'; }
  return '<nav class="ph-seg" aria-label="Show">'+a("goals","Active")+a("backlog","Backlog")+a("archive","Archive")+'</nav>';
}
function phSearchBox(r,ph){
  return '<input class="ph-in ph-search" id="ph-q" data-r="'+r+'" type="search" placeholder="'+esc(ph)+'" aria-label="'+esc(ph)+'" value="'+esc(PH_Q[r]||"")+'" enterkeyhint="search" autocomplete="off">';
}
function phHit(r,t){ var q=String(PH_Q[r]||"").trim().toLowerCase(); return !q || String(t||"").toLowerCase().indexOf(q)>=0; }
function phShortDate(d){ var p=String(d||"").split("-"); return p.length===3 ? (+p[2])+" "+PH_MONTHS[+p[1]-1].slice(0,3)+" "+p[0] : ""; }
function phBacklog(){
  var h=[];
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Backlog</h1><p class="ph-sub">Ideas worth doing that are not goals yet. Put one here so it stops taking room in your head.</p></div>');
  h.push(phSeg("backlog"));
  if(state.backlog.length>4) h.push(phSearchBox("backlog","Search the backlog"));
  h.push('<div id="ph-list-body">'+phBacklogList()+'</div>');
  h.push('<div class="ph-dock"><button type="button" class="ph-btn ph-pri ph-wide" data-ph="bladd">Add an idea</button></div>');
  return h.join("");
}
function phBacklogList(){
  var l=state.backlog.filter(function(b){ return phHit("backlog",b.t); });
  if(!l.length) return '<p class="ph-empty">'+(state.backlog.length?"Nothing matches.":"Nothing waiting. Add the next idea with the button below.")+'</p>';
  return '<div class="ph-grp">'+l.map(function(b){
    var i=state.backlog.indexOf(b), g=b.goal;
    return '<button type="button" class="ph-rowb" data-ph="blitem" data-i="'+i+'"><span>'+esc(b.t)+'</span><span class="ph-rv"><span class="ph-v">'+
      esc(g?g.subs.length+(g.subs.length===1?" step":" steps")+" · "+groupPct(g)+"%":"Added "+phShortDate(b.d))+'</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>';
}
function phBlItem(i){
  var b=state.backlog[i]; if(!b) return;
  var g=b.goal;
  askUser({title:b.t, body:[g?"A goal with "+g.subs.length+(g.subs.length===1?" step":" steps")+", "+groupPct(g)+"% done, waiting here. Added "+phShortDate(b.d)+".":"An idea, added "+phShortDate(b.d)+"."],
    more:[["go",g?"Make it active":"Make it a goal"],["del","Remove it"]], noOk:true, cancel:"Close"}).then(function(v){
    if(v==="go"){
      var res=null; phUndoable((g?"Active again: ":"Now a goal: ")+phCut(b.t,36),function(){ res=backlogActivate(i); });
      if(res) phGoal(res.g.id);
    } else if(v==="del"){
      askUser({title:"Remove it?", body:[g?"“"+b.t+"” and its "+g.subs.length+" steps go.":"“"+b.t+"” goes."], ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
        if(yes) phUndoable("Removed: "+phCut(b.t,40),function(){ backlogRemove(i); });
      });
    }
  });
}
function phBlAdd(last){
  askUser({title:"Add an idea", body:[last?"Added “"+last+"”. Add the next, or press Done.":"Something for a free hour. It can become a goal later."],
    fields:[{k:"t",label:"The idea",kind:"text",mic:true,ph:"Say it or type it"}], ok:"Add", cancel:last?"Done":"Close",
    check:function(v){ return String(v.t||"").trim()?"":"Type or say the idea first."; }}).then(function(v){
    if(!v) return;
    var it=backlogAdd(v.t); save(); renderAll(); PH_DRAWN=""; phRender();
    if(it) phBlAdd(it.t);
  });
}
function phArchive(){
  var h=[];
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Archive</h1><p class="ph-sub">Finished goals, kept with their steps. Any of them can go back on the board.</p></div>');
  h.push(phSeg("archive"));
  if(state.archive.length>4) h.push(phSearchBox("archive","Search finished goals"));
  h.push('<div id="ph-list-body">'+phArchiveList()+'</div>');
  return h.join("");
}
function phArchiveList(){
  var l=state.archive.filter(function(g){ return phHit("archive",g.name); });
  if(!l.length) return '<p class="ph-empty">'+(state.archive.length?"Nothing matches.":"Nothing archived yet. Archive a finished goal from its Goal details.")+'</p>';
  return '<div class="ph-grp">'+l.map(function(g){
    return '<button type="button" class="ph-rowb" data-ph="aritem" data-id="'+esc(g.id)+'"><span>'+esc(g.name)+'</span><span class="ph-rv"><span class="ph-v">'+
      esc((g.archivedAt?phShortDate(g.archivedAt)+" · ":"")+groupPct(g)+"%")+'</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>';
}
function phArItem(id){
  var g=null; state.archive.forEach(function(x){ if(x.id===id) g=x; }); if(!g) return;
  askUser({title:g.name, body:[g.subs.length+(g.subs.length===1?" step, ":" steps, ")+groupPct(g)+"% done."+(g.archivedAt?" Archived "+phShortDate(g.archivedAt)+".":"")],
    more:[["back","Put it back on the board"]], noOk:true, cancel:"Close"}).then(function(v){
    if(v!=="back") return;
    phUndoable("Back on the board: "+phCut(g.name,32),function(){ unarchiveGoal(g.id); });
    phGoal(g.id);
  });
}
/* Tags: pick one or more; the goals that carry all of them show below. The
   pick is the phone page's own, so it never filters the board on a computer. */
function phTags(){
  var h=[], tags=allTags();
  PH_TAGS=PH_TAGS.filter(function(t){ return tags.some(function(x){ return x.t===t; }); });
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Tags</h1><p class="ph-sub">Pick tags to see the goals that carry all of them. A goal gets its tags in its Goal details.</p></div>');
  if(!tags.length){ h.push('<p class="ph-empty">No tags yet. Add up to five to any goal in its Goal details.</p>'); return h.join(""); }
  h.push('<div class="ph-chips" role="group" aria-label="Tags">'+tags.map(function(x){
    var gs=state.groups.filter(function(g){ return g.tags.indexOf(x.t)>=0; }), pct=gs.length?Math.round(gs.reduce(function(t,g){ return t+groupPct(g); },0)/gs.length):0;
    return '<button type="button" class="ph-tchip" data-ph="tagpick" data-t="'+esc(x.t)+'" aria-pressed="'+(PH_TAGS.indexOf(x.t)>=0)+'"><span>#'+esc(x.t)+'</span><span class="ph-tchip-n">'+x.n+' · '+pct+'%</span></button>';
  }).join("")+'</div>');
  var picked=PH_TAGS.length?state.groups.filter(function(g){ return PH_TAGS.every(function(t){ return g.tags.indexOf(t)>=0; }); }):[];
  h.push('<section aria-label="Goals with these tags"><div class="ph-row-h"><h2 class="ph-h2">'+(PH_TAGS.length?"Goals with "+(PH_TAGS.length===1?"this tag":"all of these"):"Goals")+'</h2></div>');
  if(!PH_TAGS.length) h.push('<p class="ph-empty">Pick a tag above.</p>');
  else if(!picked.length) h.push('<p class="ph-empty">No goal carries all of those tags.</p>');
  else h.push('<div class="ph-grp">'+picked.map(function(g){
    return '<button type="button" class="ph-rowb" data-ph="goal" data-id="'+esc(g.id)+'"><span>'+esc(g.name)+'</span><span class="ph-rv"><span class="ph-v">'+groupPct(g)+'%</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>');
  h.push('</section>');
  return h.join("");
}

/* ---- the Planner (2026-10-18) ----
   What the board may assume about an ordinary week, saved the moment it is
   changed, as on the board's Planner (same meSet and meDay). Then where each
   goal can be done, what is held back right now and why, and the interview. */
function phPlanner(){
  var me=state.me||freshMe(), h=[];
  function tm(k,lab,v){ return '<label class="ph-lab" for="ph-p-'+k+'">'+lab+'</label><input class="ph-in" type="time" id="ph-p-'+k+'" data-pme="'+k+'" value="'+esc(v||"")+'">'; }
  function sel(k,lab,list,v){ return '<label class="ph-lab" for="ph-p-'+k+'">'+lab+'</label><select class="ph-sel" id="ph-p-'+k+'" data-pme="'+k+'">'+phOpts(list,v)+'</select>'; }
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Planner</h1><p class="ph-sub">What the board may assume about an ordinary week. Changes are saved as you make them.</p></div>');
  h.push('<section class="ph-form" aria-label="Your week"><h2 class="ph-h2">Your week</h2>'+
    '<span class="ph-lab">Working days</span><div class="ph-segb" role="group" aria-label="Working days">'+
      DAYS_SHORT.map(function(n,i){ return '<button type="button" data-ph="pday" data-day="'+i+'" aria-pressed="'+(me.days.indexOf(i)>=0)+'" aria-label="'+esc(PH_DAYS[i])+'">'+esc(n.slice(0,2))+'</button>'; }).join("")+'</div>'+
    '<div class="ph-two"><div>'+tm("w0","Work starts",me.work[0])+'</div><div>'+tm("w1","Work ends",me.work[1])+'</div></div>'+
    '<div class="ph-two"><div>'+tm("rise","Your day starts at",me.rise||"07:00")+'</div><div>'+tm("wind","Your day ends at",me.wind)+'</div></div>'+
    tm("brief","Morning brief at",me.brief||"07:30")+'</section>');
  h.push('<section class="ph-form" aria-label="What matters"><h2 class="ph-h2">What matters</h2>'+
    '<label class="ph-lab" for="ph-p-north">The one thing that matters most right now</label><input class="ph-in" id="ph-p-north" data-pme="north" value="'+esc(me.north||"")+'" placeholder="Ship the tracker before the audit" enterkeyhint="done"></section>');
  h.push('<section aria-label="Which goals are work"><div class="ph-row-h"><h2 class="ph-h2">Which goals are work</h2></div>'+
    '<p class="ph-note">Work goals are suggested only in work hours, the others only outside them.</p>'+
    (state.groups.length?'<div class="ph-grp ph-wheres">'+state.groups.map(function(g){
      return '<label class="ph-where"><span>'+esc(g.name)+'</span><select class="ph-sel ph-sel-s" data-pwhere="'+esc(g.id)+'" aria-label="Is '+esc(g.name)+' work?">'+phOpts(WHERES.map(function(x){ return [x[0],x[1]]; }),g.where||"any")+'</select></label>';
    }).join("")+'</div>':'<p class="ph-empty">No goals yet.</p>')+'</section>');
  h.push('<section aria-label="Held back right now"><div class="ph-row-h"><h2 class="ph-h2">Held back right now</h2></div><div id="ph-held">'+phHeld()+'</div></section>');
  h.push('<div class="ph-grp">'+phRow("interview","Interview me again","")+'</div>');
  return h.join("");
}
function phHeld(){
  var c=nowCtx(), rows=[];
  state.groups.forEach(function(g){ if(groupPct(g)>=100) return; var f=feasible(g,c); if(!f.ok) rows.push([g.name,whereLabel(g.where)+" · "+f.why]); });
  return rows.length ? '<div class="ph-grp">'+rows.map(function(x){ return '<div class="ph-rowf ph-held"><span>'+esc(x[0])+'</span><span class="ph-v">'+esc(x[1])+'</span></div>'; }).join("")+'</div>'
    : '<p class="ph-empty">Nothing is held back. Everything can be worked on in this hour.</p>';
}
function phPlannerEdit(el){
  if(el.getAttribute("data-pwhere")){ var g=gById(el.getAttribute("data-pwhere")); if(g){ editGoal(g,"where",el.value); save(); renderAll(); } }
  else { meSet(el.getAttribute("data-pme"),el.value); save(); renderAll(); }
  var hd=$("#ph-held"); if(hd) hd.innerHTML=phHeld();
}

/* ---- Weekly check-in history (was "What the board learned", 2026-10-20) ----
   Only the check-ins are left on this page: kept on this phone, never read
   by the board's suggestions. */
function phLearned(){
  var h=[], wl=weekData().log;
  h.push('<div>'+phNav("#/you","You")+'<h1 class="ph-h1">Weekly check-in</h1></div>');
  h.push('<section aria-label="Weekly check-in"><div class="ph-row-h"><h2 class="ph-h2">Your check-ins</h2><span class="ph-k">'+(wl.length?wl.length+" kept":"")+'</span></div>'+
    '<p class="ph-note">Five taps, 1 to 5, once a week if you like. Kept on '+phHere()+' only. It is not a test and not advice.</p>'+
    '<div class="ph-grp">'+phRow("week","Check in",weekDue()?"Due":"Done this week")+
    wl.slice(-4).reverse().map(function(x){ var t=0; WEEK_ITEMS.forEach(function(it){ t+=+x[it[0]]||0; });
      return '<div class="ph-rowf"><span>Week '+esc(String(x.k).split("-W")[1]||x.k)+' · '+esc(phShortDate(x.d))+'</span><span class="ph-v">Average '+(Math.round(t/WEEK_ITEMS.length*10)/10)+' of 5</span></div>'; }).join("")+'</div>'+
    (wl.length?'<div class="ph-grp" style="margin-top:10px"><button type="button" class="ph-rowb ph-danger" data-ph="weekerase"><span>Delete my check-ins</span></button></div>':'')+'</section>');
  return h.join("");
}
/* press one of the board's own buttons, then draw this page again */
function phPress(sel){ var b=$(sel); if(b) b.click(); PH_DRAWN=""; phRender(); }
function phPressAsk(sel){ var b=$(sel); if(b) b.click(); var t=setInterval(function(){ if(!document.querySelector("dialog.ask[open]")){ clearInterval(t); PH_DRAWN=""; phRender(); } },150); }

