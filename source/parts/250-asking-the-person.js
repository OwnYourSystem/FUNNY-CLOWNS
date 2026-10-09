/* ---------------- asking the person ----------------
   The one way to put a question that has to be answered before the board goes
   on. It is a native <dialog>, so the page behind goes inert, Tab stays inside,
   Escape cancels and focus goes back to what was pressed. It opens only from
   the person's own action: never from the tutor, a hint or a timer. The one
   exception is the reminder the person turned on, which waits until it is
   closed (see "a reminder waits until you close it"). There is always a way
   out (Not now, Escape, a click outside),
   and a destructive question puts focus on that way out, not on the yes.

   askUser({title, body, fields, ok, cancel, danger, check}) returns a promise
   that resolves to false (or null when it has fields) if it was cancelled, and
   to true (or an object of the field values) on yes. fields are
   {k, label, kind:"text"|"textarea"|"number"|"time"|"pick", value, ph, min,
   max, opts:[[value,label]]}. check(values) may return a sentence to show in
   the dialog and keep it open. Questions queue and are shown one at a time. */
/* Tab and Shift+Tab go round inside a box instead of out into the browser. */
function trapTab(d){
  if(d._trap) return; d._trap=true;
  d.addEventListener("keydown",function(e){
    if(e.key!=="Tab") return;
    var f=Array.prototype.filter.call(d.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'),
      function(x){ return !x.disabled && x.getClientRects().length>0; });
    if(!f.length) return;
    var i=f.indexOf(document.activeElement);
    if(e.shiftKey && i<=0){ e.preventDefault(); f[f.length-1].focus(); }
    else if(!e.shiftKey && i===f.length-1){ e.preventDefault(); f[0].focus(); }
  });
}
var askQ=[], askCur=null;
function askUser(o){
  return new Promise(function(resolve){ askQ.push({o:o||{}, resolve:resolve}); if(!askCur) askNext(); });
}
function askNext(){
  var job=askQ.shift(); if(!job){ askCur=null; return; }
  askCur=job;
  var o=job.o, opener=document.activeElement, fields=o.fields||[], hasF=fields.length>0;
  var id="ask"+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
  var body=o.body||[]; if(typeof body==="string") body=body.split(/\n\n/);
  var d=document.createElement("dialog");
  d.className="ask"+(o.danger?" danger":"");
  d.setAttribute("aria-labelledby",id+"t");
  if(body.length) d.setAttribute("aria-describedby",id+"b");
  var fh=fields.map(function(f,i){
    var v=f.value==null?"":String(f.value), a='data-ak="'+esc(f.k)+'"';
    if(f.kind==="pick")
      return '<div class="ask-grp">'+(f.label?'<span class="ask-lab">'+esc(f.label)+'</span>':'')+
        '<div class="ask-pick'+(f.row?' row':'')+'" role="group" aria-label="'+esc(f.label||"")+'" '+a+'>'+(f.opts||[]).map(function(op){
        return '<button type="button" data-av="'+esc(op[0])+'" aria-pressed="'+(String(op[0])===v)+'">'+esc(op[1])+'</button>'; }).join("")+'</div></div>';
    var inp = f.kind==="textarea"
      ? '<textarea class="f" '+a+' spellcheck="false" placeholder="'+esc(f.ph||"")+'">'+esc(v)+'</textarea>'
      : '<input class="f" '+a+' type="'+(f.kind||"text")+'" value="'+esc(v)+'" placeholder="'+esc(f.ph||"")+'"'+
        (f.min!=null?' min="'+esc(f.min)+'"':'')+(f.max!=null?' max="'+esc(f.max)+'"':'')+'>';
    return '<label>'+esc(f.label||"")+inp+'</label>';
  }).join("");
  d.innerHTML='<div class="ask-in"><h3 id="'+id+'t">'+esc(o.title||"")+'</h3>'+
    (body.length?'<div id="'+id+'b">'+body.map(function(t){ return '<p>'+esc(t)+'</p>'; }).join("")+'</div>':'')+
    (hasF?'<div class="ask-fields">'+fh+'</div>':'')+
    '<p class="ask-err" role="alert"></p>'+
    '<div class="ask-acts"><button type="button" class="btn" data-acancel>'+esc(o.cancel||"Not now")+'</button>'+
    (o.noOk?'':'<button type="button" class="btn take" data-aok>'+esc(o.ok||"Yes")+'</button>')+'</div></div>';
  var picked={}, result=hasF?null:false;
  function values(){
    var out={};
    fields.forEach(function(f){
      if(f.kind==="pick"){ out[f.k]=picked.hasOwnProperty(f.k)?picked[f.k]:(f.value==null?"":String(f.value)); return; }
      var el=d.querySelector('[data-ak="'+f.k+'"]'); out[f.k]=el?el.value:"";
    });
    return out;
  }
  function submit(){
    var v=values();
    if(typeof o.check==="function"){
      var bad=o.check(v);
      if(bad){ d.querySelector(".ask-err").textContent=bad; return; }
    }
    result=hasF?v:true; d.close("ok");
  }
  trapTab(d);
  var downOnBackdrop=false;
  d.addEventListener("pointerdown",function(e){ downOnBackdrop=(e.target===d); });
  d.addEventListener("click",function(e){
    if(e.target===d){ if(downOnBackdrop) d.close(""); return; }
    if(e.target.closest("[data-acancel]")){ d.close(""); return; }
    if(e.target.closest("[data-aok]")){ submit(); return; }
    var pk=e.target.closest("[data-av]");
    if(pk){
      var g=pk.parentNode; picked[g.getAttribute("data-ak")]=pk.getAttribute("data-av");
      Array.prototype.forEach.call(g.children,function(b){ b.setAttribute("aria-pressed",b===pk?"true":"false"); });
    }
  });
  d.addEventListener("keydown",function(e){
    if(e.key==="Enter" && e.target.tagName==="INPUT" && !o.noOk){ e.preventDefault(); submit(); }
  });
  d.addEventListener("close",function(){
    var r=d.returnValue==="ok"?result:(hasF?null:false);
    d.remove();
    try{ if(opener && opener.focus && document.contains(opener)) opener.focus(); }catch(er){}
    askCur=null; job.resolve(r); askNext();
  });
  document.body.appendChild(d);
  if(d.showModal) d.showModal(); else d.setAttribute("open","");
  var first = o.danger||!hasF ? d.querySelector("[data-acancel]") : d.querySelector("[data-ak]");
  if(first && !o.danger && !hasF && !o.noOk) first=d.querySelector("[data-aok]");
  if(first && first.focus) first.focus();
}
/* The two overlays that were built by hand (the interview and the account
   box) get the same behaviour: the page behind is inert while they are open,
   focus goes in, and goes back to what was pressed when they close. */
var pageLock=null;
function pageLockOn(el){
  pageLockOff();
  var opener=document.activeElement, held=[];
  for(var n=el; n && n!==document.body; n=n.parentNode){
    Array.prototype.forEach.call(n.parentNode.children,function(c){
      if(c!==n && c.tagName!=="SCRIPT" && !c.inert){ c.inert=true; held.push(c); }
    });
  }
  el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); trapTab(el);
  pageLock={el:el, opener:opener, held:held};
}
function pageLockOff(){
  if(!pageLock) return;
  pageLock.held.forEach(function(c){ c.inert=false; });
  pageLock.el.removeAttribute("aria-modal");
  var op=pageLock.opener; pageLock=null;
  try{ if(op && op.focus && document.contains(op)) op.focus(); }catch(er){}
}
function ioMsg(t){ var m=$("#io-msg"); if(m){ m.textContent=t; clearTimeout(m._t); m._t=setTimeout(function(){ m.textContent=""; },6000); } }

function renderAll(){
  renderMain(); renderSubs(); renderKpis(); renderAlerts(); renderTick(); renderDocks(); renderSnaps();
  renderVerdict(); renderFollow(); renderFloor(); renderWeek(); renderExp(); renderLearn(); renderBarrier(); renderMemList(); renderHint(); renderHintPanel();
  if(typeof renderTags==="function"){ renderTags(); renderBacklog(); renderArchive(); }
  if(typeof renderPlanner==="function") renderPlanner();
  if(typeof enhanceSelects==="function") enhanceSelects();
  /* content can change a panel's height, so re-separate before measuring */
}
renderAll();
bindSeek();
$("#revnote").textContent="Drag any panel by its header to move it anywhere, and pull its right edge to resize. Tidy up puts them back. Panels never overlap: whatever you drop onto steps out below. Opened from the claude.ai link, the board mirrors today\u2019s three docks so the 05:00 and 20:00 reminders can name real tasks; the saved file keeps everything local and mirrors nothing. Board revision "+SEED_REV+" · "+allSubs().length+" subtasks across "+state.groups.length+" main tasks. Adding, removing and editing all happen here in the browser and survive a reload. When new work is fed in from a Claude session the board merges it: new items appear, renames apply, and nothing you have already set is overwritten.";

/* One query for the whole board. Every box types into it, and every box
   shows it, so you never wonder which list is filtered.               */
