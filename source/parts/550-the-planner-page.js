/* ---------------- the planner page ----------------
   The verdict again at the top, so the page opens with the answer rather
   than the settings. Then the facts behind it, editable in place, and last
   the list of everything it refused and when each one opens again. Nothing
   here is hidden from the person it is about.                           */
function renderPlanner(){
  var me=state.me||freshMe(), form=$("#pl-form");
  if(!form) return;
  form.innerHTML=
    '<label class="wide">Working days<span class="dayrow" id="pl-days">'+
      DAYS_SHORT.map(function(n,i){
        return '<button type="button" data-day="'+i+'" aria-pressed="'+(me.days.indexOf(i)>=0)+'">'+
          n.slice(0,2)+"</button>"; }).join("")+'</span></label>'+
    '<label>Starts<input class="f" type="time" data-me="w0" value="'+esc(me.work[0])+'"></label>'+
    '<label>Ends<input class="f" type="time" data-me="w1" value="'+esc(me.work[1])+'"></label>'+
    '<label>Each way, in minutes<input class="f" type="number" min="0" max="240" data-me="commute" value="'+
      (+me.commute||0)+'"></label>'+
    '<label>Your day ends at<input class="f" type="time" data-me="wind" value="'+esc(me.wind)+'"></label>'+
    '<label>Sharpest<select class="f" data-me="sharp">'+SHARP.map(function(o){
      return '<option value="'+o[0]+'"'+(me.sharp===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+
      '</select></label>'+
    '<label>Training fits<select class="f" data-me="gym">'+GYMWIN.map(function(o){
      return '<option value="'+o[0]+'"'+(me.gym===o[0]?" selected":"")+">"+o[1]+"</option>"; }).join("")+
      '</select></label>'+
    '<label class="wide">The one thing that matters most right now'+
      '<input class="f" data-me="north" value="'+esc(me.north||"")+'" placeholder="Ship the tracker before the audit"></label>'+
    '<label class="wide">Never schedule over'+
      '<input class="f" data-me="never" value="'+esc(me.never||"")+'" placeholder="Thursday evenings, and Sunday before noon"></label>'+
    '<label>Morning brief at<input class="f" type="time" data-me="brief" value="'+esc(me.brief||"07:30")+'"></label>'+
    '<label class="wide">News in the banner<span class="dayrow feedrow" id="pl-feeds">'+
      FEEDS.map(function(f){
        return '<button type="button" data-feed="'+f[0]+'" aria-pressed="'+
          ((me.feeds||[]).indexOf(f[0])>=0)+'">'+esc(f[1])+"</button>"; }).join("")+'</span></label>'+
    '<div class="wide iconrow"><span class="prev">'+plannerIcon()+'</span>'+
      '<p>The planner badge on the board wears this. Choose one from your phone or your computer.</p>'+
      '<button class="btn" id="pl-icon-pick">Choose a picture</button>'+
      (me.icon?'<button class="btn" id="pl-icon-clear">Back to the clock</button>':"")+'</div>';

  var wl=$("#pl-where");
  wl.innerHTML = state.groups.length ? state.groups.map(function(g){
    return '<div class="whererow"><span class="wn">'+esc(g.name)+'</span>'+
      '<select class="f" data-where="'+g.id+'">'+WHERES.map(function(o){
        return '<option value="'+o[0]+'"'+((g.where||"any")===o[0]?" selected":"")+">"+o[1]+"</option>";
      }).join("")+'</select></div>';
  }).join("") : '<p class="calm">No goals yet.</p>';

  var held=$("#pl-held"), c=nowCtx(), rows=[];
  state.groups.forEach(function(g){
    if(groupPct(g)>=100) return;
    var f=feasible(g,c);
    if(!f.ok) rows.push('<div class="heldrow"><span class="hn">'+esc(g.name)+'</span>'+
      '<span class="hw">'+esc(whereLabel(g.where))+" \u00b7 "+esc(f.why)+"</span></div>");
  });
  held.innerHTML = rows.length ? rows.join("")
    : '<p class="calm">Nothing is held back. Everything on the board can be worked in this hour.</p>';
}
$("#pl-form").addEventListener("input",function(e){
  var k=e.target.dataset.me; if(!k) return;
  var me=state.me, v=e.target.value;
  if(k==="w0") me.work[0]=v;
  else if(k==="w1") me.work[1]=v;
  else if(k==="commute") me.commute=Math.max(0,Math.min(240,+v||0));
  else me[k]=v;
  me.done=true; save(); renderVerdict(); renderPlanner2();
});
$("#pl-form").addEventListener("change",function(e){
  if(e.target.dataset.me) { save(); renderVerdict(); }
});
$("#pl-form").addEventListener("click",function(e){
  var b=e.target.closest("[data-day]"); if(!b) return;
  var i=+b.dataset.day, me=state.me, at=me.days.indexOf(i);
  if(at>=0) me.days.splice(at,1); else me.days.push(i);
  me.days.sort(); me.done=true; save();
  b.setAttribute("aria-pressed", me.days.indexOf(i)>=0 ? "true":"false");
  renderVerdict(); renderPlanner2();
});
$("#pl-form").addEventListener("click",function(e){
  var f=e.target.closest("[data-feed]"); if(!f) return;
  var k=f.dataset.feed, me=state.me, at=(me.feeds||[]).indexOf(k);
  if(at>=0) me.feeds.splice(at,1); else me.feeds.push(k);
  me.done=true; save();
  f.setAttribute("aria-pressed", me.feeds.indexOf(k)>=0 ? "true":"false");
  loadNews(true);
});
/* The picture is squared off and shrunk to 128px before it is kept, because
   a photo straight off a phone is three megabytes and this has to fit in
   the same localStorage as the board.                                    */
function readIcon(file,then){
  if(!file || !/^image\//.test(file.type)) return;
  var fr=new FileReader();
  fr.onload=function(){
    var img=new Image();
    img.onload=function(){
      var n=128, c=document.createElement("canvas");
      c.width=c.height=n;
      var g=c.getContext("2d"), side=Math.min(img.width,img.height);
      g.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,n,n);
      try{ then(c.toDataURL("image/jpeg",0.82)); }catch(err){ then(""); }
    };
    img.onerror=function(){ then(""); };
    img.src=fr.result;
  };
  fr.readAsDataURL(file);
}
(function(){
  var inp=$("#pl-icon-file"); if(!inp) return;
  document.addEventListener("click",function(e){
    if(e.target.closest("#pl-icon-pick")){ inp.value=""; inp.click(); return; }
    if(e.target.closest("#pl-icon-clear")){
      state.me.icon=""; save(); renderVerdict(); renderPlanner(); return;
    }
  });
  inp.addEventListener("change",function(){
    readIcon(inp.files&&inp.files[0],function(url){
      if(!url) return;
      state.me.icon=url; state.me.done=true;
      try{ save(); }catch(err){ state.me.icon=""; }
      renderVerdict(); renderPlanner();
    });
  });
})();
$("#pl-where").addEventListener("change",function(e){
  var id=e.target.dataset.where; if(!id) return;
  var g=gById(id); if(!g) return;
  g.where=e.target.value; save(); renderVerdict(); renderPlanner2();
});
/* redraw only what the edit changed, so a field does not lose focus */
function renderPlanner2(){
  var held=$("#pl-held"), c=nowCtx(), rows=[];
  state.groups.forEach(function(g){
    if(groupPct(g)>=100) return;
    var f=feasible(g,c);
    if(!f.ok) rows.push('<div class="heldrow"><span class="hn">'+esc(g.name)+'</span>'+
      '<span class="hw">'+esc(whereLabel(g.where))+" \u00b7 "+esc(f.why)+"</span></div>");
  });
  held.innerHTML = rows.length ? rows.join("")
    : '<p class="calm">Nothing is held back. Everything on the board can be worked in this hour.</p>';
}

