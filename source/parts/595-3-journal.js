/* ---- Journal ----
   Private and quiet on purpose (2026-10-18): the page shows that there are
   notes, never what they say. Yesterday's note is one closed card; Show opens
   it. Earlier days are rows; a day opens on its own page, where each entry can
   be edited or removed. Leaving the page closes everything again. */
function phJournal(){
  var h=[], c=jrCheckpoint();
  h.push('<div class="ph-head"><div><h1 class="ph-h1">Journal</h1><p class="ph-sub">Your checkpoint between days. Kept on '+phHere()+' only.</p></div></div>');
  if(c){
    var s=jrSays(c);
    h.push('<section class="ph-card" aria-label="Where you left off"><div class="ph-row-h" style="padding:0"><div class="ph-k">Where you left off · '+esc(s.head)+'</div></div>'+
      (PH_JR_OPEN ? s.lines.map(function(t){ return '<p class="ph-line">'+esc(t)+'</p>'; }).join("")+
          '<button type="button" class="ph-link" data-ph="jrpeek" aria-expanded="true">Hide it</button>'
        : '<button type="button" class="ph-link" data-ph="jrpeek" aria-expanded="false">Show it</button>')+'</section>');
  }
  h.push('<div class="ph-two"><button type="button" class="ph-tile" data-ph="jr" data-kind="start"><span class="ph-k">Morning</span><span>Start of day</span></button>'+
    '<button type="button" class="ph-tile" data-ph="jr" data-kind="end"><span class="ph-k">Evening</span><span>End of day</span></button></div>');
  var days=jrDayList();
  h.push('<section aria-label="Earlier"><div class="ph-row-h"><h2 class="ph-h2">Earlier</h2><span class="ph-k">'+(days.length?days.length+(days.length===1?" day":" days"):"")+'</span></div>');
  if(!days.length) h.push('<p class="ph-empty">No entries yet. Start of day and End of day are above.</p>');
  else h.push('<div class="ph-grp">'+days.map(function(x){
    return '<button type="button" class="ph-rowb" data-ph="jday" data-d="'+esc(x.d)+'"><span>'+esc(jrDateLabel(x.d))+'</span><span class="ph-rv"><span class="ph-v">'+esc(jrDaySays(x))+'</span>'+PH_CHEV+'</span></button>';
  }).join("")+'</div>');
  h.push('</section>');
  return h.join("");
}
/* one day: its entries, each with Edit and Remove */
function phJDay(){
  var d=phArg(), l=d?jrDayEntries(d):[], h=[];
  if(!l.length) return phJournal();
  h.push('<div style="min-width:0">'+phNav("#/journal","Journal")+'<h1 class="ph-h1">'+esc(jrDateLabel(d))+'</h1></div>');
  l.forEach(function(e){
    var K=JR_KINDS[e.kind]||JR_KINDS.end, ed=jrEdited(e);
    h.push('<section class="ph-card ph-jr-e" aria-label="'+esc(K.name+", "+e.tm)+'"><div class="ph-k">'+esc(e.tm+" · "+K.name+(ed?" · "+ed:""))+'</div>'+
      (e.a?'<p class="ph-line"><b>'+esc(K.a)+'</b> '+esc(e.a)+'</p>':'')+(e.b?'<p class="ph-line"><b>'+esc(K.b)+'</b> '+esc(e.b)+'</p>':'')+
      '<div class="ph-acts"><button type="button" class="ph-btn" data-ph="jredit" data-id="'+esc(e.id)+'">Edit</button>'+
      '<button type="button" class="ph-btn ph-danger" data-ph="jrdel" data-id="'+esc(e.id)+'">Remove</button></div></section>');
  });
  return h.join("");
}

