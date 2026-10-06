/* the one line, on one line */
function renderBadge(){
  var bar=$("#now-badge"); if(!bar) return;
  var me=state.me||freshMe();
  var ico='<button class="nb-ico" id="nb-ico" aria-label="Open the planner">'+plannerIcon()+'</button>';
  if(!me.done){
    bar.hidden=false; bar.className="nowbadge ask";
    bar.innerHTML=ico+'<span class="nb-k">Planner</span>'+
      '<button class="nb-n" id="now-interview">It has not met you yet. One minute, eight questions.</button>'+
      '<button class="nb-go" data-goto-view="planner" aria-label="Open the planner">'+I_ARROW+'</button>';
    return;
  }
  var v=verdict();
  bar.hidden=false;
  if(v.none){
    bar.className="nowbadge calm-card";
    bar.innerHTML=ico+'<span class="nb-k">Right now</span>'+
      '<button class="nb-n" data-goto-view="planner">Nothing, and that is the answer.</button>'+
      '<button class="nb-go" data-goto-view="planner" aria-label="Why">'+I_ARROW+'</button>';
    return;
  }
  var dz=doseNow();
  if(doseMet(dz)){
    bar.className="nowbadge calm-card";
    bar.innerHTML=ico+'<span class="nb-k">Right now</span>'+
      '<button class="nb-n" data-dose="high">That is today\u2019s dose. Stop, or ask for more.</button>'+
      '<button class="nb-go" data-goto-view="planner" aria-label="Why">'+I_ARROW+'</button>';
    return;
  }
  bar.className="nowbadge"+(v.soft?" soft":"");
  bar.innerHTML=ico+'<span class="nb-k">Do this now</span>'+
    '<button class="nb-n" data-goto-goal="'+v.g.id+'" data-goto-sub="'+esc(v.s.id)+'" title="'+
      esc(verdictWhy(v))+'">'+esc(v.s.name)+'</button>'+
    '<span class="nb-where">'+esc(whereLabel(v.g.where))+'</span>'+
    '<button class="nb-dose" data-dose="'+doseBtns(dz)[0][0]+'">'+
      (dz.band==="low"?'<span class="nb-dx">Low day \u00b7 </span>More'
        :dz.band==="high"?'<span class="nb-dx">More \u00b7 </span>Rough day':"Rough day")+'</button>'+
    '<button class="nb-go" data-goto-view="planner" aria-label="Why this one">'+I_ARROW+'</button>';
}
function renderVerdict(){
  renderBadge();
  var box=$("#now-card-2"); if(!box) return;
  whenTidy(); estTidy();
  var me=state.me||freshMe();
  if(!me.done){
    box.className="nowc ask";
    box.innerHTML='<div class="now-k">The planner has not met you yet</div>'+
      '<div class="now-n">Tell it when you work, when you train, and when your day ends.</div>'+
      '<div class="now-w">Until it knows, it can only see what is loudest. It cannot see that an '+
      'hour on an airbike is a bad answer at one o\u2019clock on a Monday. Eight questions, about a minute.</div>'+
      '<div class="now-acts"><button class="btn take" id="now-interview">Start the interview</button>'+
      '<button class="btn" data-goto-view="planner">Fill it in by hand</button></div>';
    return;
  }
  var v=verdict();
  if(v.none){
    box.className="nowc calm-card";
    var b0=(v.blocked||[])[0];
    box.innerHTML='<div class="now-k">Right now</div>'+
      '<div class="now-n">Nothing, and that is the answer.</div>'+
      '<div class="now-w">'+esc(b0 ? "The only thing left is "+b0.g.name+", and "+b0.why+"."
        : "Everything that can be done in this hour is either done, blocked or already picked up.")+'</div>';
    return;
  }
  var dz=doseNow();
  if(doseMet(dz)){
    box.className="nowc calm-card";
    box.innerHTML='<div class="now-k">Right now</div>'+
      '<div class="now-n">That is today\u2019s dose.</div>'+
      '<div class="now-w">'+esc(dz.why+" You did what it was sized for. Stop here, or ask for more on purpose.")+'</div>'+
      '<div class="now-acts">'+doseBtnHTML(dz)+'</div>';
    return;
  }
  box.className="nowc"+(v.soft?" soft":"");
  box.innerHTML=
    '<div class="now-k">Do this now<span class="now-where">'+esc(whereLabel(v.g.where))+'</span></div>'+
    '<button class="now-n" data-goto-goal="'+v.g.id+'" data-goto-sub="'+esc(v.s.id)+'">'+esc(v.s.name)+'</button>'+
    '<div class="now-from">in '+esc(v.g.name)+'</div>'+
    '<div class="now-w">'+esc(verdictWhy(v))+'</div>'+
    planLineHTML(v.s.id)+
    (verdictNot(v).length?'<ul class="now-not">'+verdictNot(v).map(function(t){
      return "<li>"+esc(t)+"</li>"; }).join("")+"</ul>":"")+
    '<div class="now-acts">'+
      '<button class="btn take" data-pick-take="'+v.s.id+'">Take it</button>'+
      '<button class="btn" data-pick-skip="'+v.s.id+'">Not this</button>'+
      '<button class="btn" data-when="'+v.s.id+'" title="Pick a moment you will notice, and tie this step to it">'+(whenMap()[v.s.id]?"Change when":"When?")+'</button>'+
      '<button class="btn" data-est="'+v.s.id+'" title="A guess is fine. The board learns how your guesses compare">'+(estState().items[v.s.id]?"Change guess":"How long?")+'</button>'+
      '<button class="btn" data-goto-view="planner">Why</button>'+
      doseBtnHTML(dz)+
    '</div>'+skipWhyHTML();
}
function renderPick(){
  var box=$("#oftad-pick"); if(!box) return;
  /* offer the next one until Today holds what today's dose allows */
  if(state.oftad.length+state.done.length>=doseNow().n){ box.hidden=true; box.innerHTML=""; return; }
  var p=pickToday();
  if(!p){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML=
    '<div class="pick-k">Suggested next</div>'+
    '<div class="pick-n">'+esc(p.s.name)+'</div>'+
    '<div class="pick-w">'+esc(p.why)+'</div>'+
    planLineHTML(p.s.id)+
    '<div class="row-btns">'+
      '<button class="btn take" data-pick-take="'+p.s.id+'">Take it</button>'+
      '<button class="btn" data-pick-skip="'+p.s.id+'">Something else</button>'+
      '<button class="btn" data-when="'+p.s.id+'" title="Pick a moment you will notice, and tie this step to it">'+(whenMap()[p.s.id]?"Change when":"When?")+'</button>'+
      '<button class="btn" data-est="'+p.s.id+'" title="A guess is fine. The board learns how your guesses compare">'+(estState().items[p.s.id]?"Change guess":"How long?")+'</button>'+
    '</div>'+skipWhyHTML();
}
