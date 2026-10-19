/* ---------------- the journal ----------------
   Added 2026-10-15 at the owner's request: a checkpoint between days. At the
   end of a day the person writes what got done and what comes next; at the
   start of the next one, the board shows that note first, so the day starts
   from where the last one stopped. Every entry keeps the date and the time it
   was written.

   It is as personal as the weekly check-in and kept apart the same way: its
   own storage key, never in the board's state, so it stays out of account
   sync, a reset, the tutor's snapshot and tools, the memory and the hints.
   Since 2026-10-19 the backup file carries it, while the person keeps
   "Include my journal, weekly check-ins and photo" on (see 360-backup). The chat can open it, save into it and read the last note
   back to the person who wrote it. It is deleted only from its own panel.
   A day here runs to 04:00, like the board's day: a note written at 00:30
   belongs to the evening before.                                          */
var JR_KEY=KEY+".journal", JR_KEEP=1000, JR_MAX=2000, JR_DATA=null;
var JR_KINDS={
  end:  {name:"End of day",   a:"Done",          b:"Tomorrow", qa:"What did you get done today?",  qb:"What should you do tomorrow?"},
  start:{name:"Start of day", a:"Where I stand", b:"First",    qa:"Where are you standing today?", qb:"What comes first today?"}
};
var JR_DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], JR_MONS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function jrDay(now){ var d=new Date((now||new Date()).getTime()); if(d.getHours()<4) d.setDate(d.getDate()-1); return dstr(d); }
function jrKindNow(now){ var h=(now||new Date()).getHours(); return (h>=4 && h<12) ? "start" : "end"; }
function jrClip(t){ t=String(t==null?"":t).replace(/\r\n?/g,"\n").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim(); return t.length>JR_MAX?t.slice(0,JR_MAX):t; }
/* one message, two parts: what got done, and what comes next */
function jrSplit(t,kind){
  t=jrClip(t); if(!t) return {a:"",b:""};
  /* in the morning "first" is how the next step is said; at night it is too often part of what got done */
  var key=kind==="start"?"tomorrow|next|first|then|today i (?:will|want to|need to)":"tomorrow|next|first thing";
  var re=new RegExp("^([\\s\\S]*?)(?:[.;!]\\s+|,?\\s+and\\s+|,\\s+|\\s+(?:then|but)\\s+|\\n+)((?:(?:and |so |then |but )?(?:"+key+"|i (?:should|will|need to|must|have to|want to|plan to)|i'll|i'd like to))\\b[\\s\\S]*)$","i");
  var m=t.match(re);
  if(m && m[1].trim() && m[2].trim()) return {a:m[1].trim(), b:m[2].trim()};
  return {a:t, b:""};
}
function jrAdd(o,now){
  now=now||new Date(); o=o||{};
  var kind=JR_KINDS[o.kind]?o.kind:jrKindNow(now), a=jrClip(o.a), b=jrClip(o.b);
  if(!a && !b) throw new Error("There is nothing to save yet. Write what got done, or what comes next.");
  var e={id:uid("j"), at:now.toISOString(), d:jrDay(now), tm:pad2(now.getHours())+":"+pad2(now.getMinutes()), kind:kind, a:a, b:b};
  var D=jrData(); D.log.push(e);
  if(D.log.length>JR_KEEP) D.log.splice(0,D.log.length-JR_KEEP);
  jrSave();
  return e;
}
/* Any entry can be changed later, the old ones too. It keeps the date and
   time it was written (its place in the record) and gains the time it was
   last changed, which is shown beside it. Removing is for good. */
function jrById(id){ var l=jrData().log; for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return null; }
function jrEdit(id,o,now){
  var e=jrById(id); if(!e) throw new Error("That entry is not there any more.");
  o=o||{}; now=now||new Date();
  var a=jrClip(o.a), b=jrClip(o.b), kind=JR_KINDS[o.kind]?o.kind:e.kind;
  if(!a && !b) throw new Error("An entry needs some words. To take it away, use Remove.");
  if(a===e.a && b===e.b && kind===e.kind) return e;
  e.a=a; e.b=b; e.kind=kind; e.ed=now.toISOString();
  jrSave();
  return e;
}
function jrRemove(id){
  var D=jrData(), n=D.log.length;
  D.log=D.log.filter(function(e){ return e.id!==id; });
  if(D.log.length===n) return false;
  jrSave(); return true;
}
/* the days that have entries, newest first, each with how many and of which kind */
function jrDayList(){
  var by={}, days=[];
  jrData().log.forEach(function(e){ if(!by[e.d]){ by[e.d]={d:e.d, n:0, start:0, end:0}; days.push(e.d); } by[e.d].n++; by[e.d][e.kind==="start"?"start":"end"]++; });
  return days.sort().reverse().map(function(d){ return by[d]; });
}
function jrDayEntries(d){ return jrData().log.filter(function(e){ return e.d===d; }).sort(function(x,y){ return x.at<y.at?-1:1; }); }
function jrDaySays(x){
  var k=[]; if(x.start) k.push(x.start===1?"start of day":x.start+" starts"); if(x.end) k.push(x.end===1?"end of day":x.end+" ends");
  return k.join(" and ");
}
function jrEdited(e){ if(!e.ed) return ""; var t=new Date(e.ed); return "changed "+(dstr(t)===e.d?"":jrDateLabel(dstr(t)).replace(/ \d{4}$/,"")+" ")+pad2(t.getHours())+":"+pad2(t.getMinutes()); }
function jrDateLabel(d){ var p=String(d).split("-"), x=new Date(+p[0],+p[1]-1,+p[2]); return JR_DAYS[x.getDay()]+" "+(+p[2])+" "+JR_MONS[+p[1]-1]+" "+p[0]; }
function jrWhen(e){ return jrDateLabel(e.d)+", "+e.tm; }
function jrLines(e){
  var k=JR_KINDS[e.kind]||JR_KINDS.end, out=[];
  if(e.a) out.push(k.a+": "+e.a);
  if(e.b) out.push(k.b+": "+e.b);
  return out;
}
/* the last note from an earlier day: the end of that day if there is one */
function jrCheckpoint(now){
  var today=jrDay(now), l=jrData().log, d=null, i;
  for(i=l.length-1;i>=0;i--) if(l[i].d<today){ d=l[i].d; break; }
  if(!d) return null;
  var day=l.filter(function(e){ return e.d===d; }), ends=day.filter(function(e){ return e.kind==="end"; });
  return {d:d, e:ends.length?ends[ends.length-1]:day[day.length-1], n:day.length, today:today};
}
function jrToday(now){ var t=jrDay(now); return jrData().log.filter(function(e){ return e.d===t; }); }
function jrHide(now){ jrData().hid=jrDay(now); jrSave(); }
/* the strip at the top of Today: the checkpoint, until today has its own start */
function jrCardOn(now){
  var c=jrCheckpoint(now); if(!c) return null;
  if(jrData().hid===c.today) return null;
  if(jrToday(now).some(function(e){ return e.kind==="start"; })) return null;
  return c;
}
function jrSays(c){
  var ago=Math.round((new Date(c.today)-new Date(c.d))/864e5);
  var head=(ago===1?"Yesterday":ago+" days ago")+", "+c.e.tm+" ("+(JR_KINDS[c.e.kind]||JR_KINDS.end).name.toLowerCase()+")";
  return {head:head, lines:jrLines(c.e)};
}
function jrAsk(kind){
  var k=JR_KINDS[kind]?kind:jrKindNow(), K=JR_KINDS[k];
  return askUser({title:K.name+", "+jrDateLabel(jrDay()),
    body:["Kept on this device only, with today's date and time."],
    fields:[{k:"kind",label:"Which",kind:"pick",row:true,opts:[["end","End of day"],["start","Start of day"]],value:k},
            {k:"a",label:K.qa,kind:"textarea"},{k:"b",label:K.qb,kind:"textarea"}],
    ok:"Save", cancel:"Not now",
    check:function(v){ return (!String(v.a||"").trim() && !String(v.b||"").trim()) ? "Write something first, or press Not now." : ""; }}).then(function(v){
    if(!v) return null;
    var e=null;
    try{ e=jrAdd({kind:v.kind,a:v.a,b:v.b}); }catch(er){ toast("Journal",er.message); }
    renderAll();
    return e;
  });
}
/* change an entry: the same sheet it was written in, filled in */
function jrEditAsk(id){
  var e=jrById(id); if(!e) return Promise.resolve(null);
  var K=JR_KINDS[e.kind]||JR_KINDS.end;
  return askUser({title:"Edit: "+K.name+", "+jrWhen(e),
    body:["It keeps its date and time; the time you change it is noted beside it."],
    fields:[{k:"kind",label:"Which",kind:"pick",row:true,opts:[["end","End of day"],["start","Start of day"]],value:e.kind},
            {k:"a",label:K.qa,kind:"textarea",value:e.a},{k:"b",label:K.qb,kind:"textarea",value:e.b}],
    ok:"Save", cancel:"Not now",
    check:function(v){ return (!String(v.a||"").trim() && !String(v.b||"").trim()) ? "An entry needs some words. To take it away, use Remove." : ""; }}).then(function(v){
    if(!v) return null;
    var r=null; try{ r=jrEdit(id,{kind:v.kind,a:v.a,b:v.b}); }catch(er){ toast("Journal",er.message); }
    renderAll(); return r;
  });
}
function jrRemoveAsk(id){
  var e=jrById(id); if(!e) return Promise.resolve(false);
  return askUser({title:"Remove this entry?", body:[jrWhen(e)+". It goes for good; nothing else keeps a copy."],
    ok:"Remove it", cancel:"Keep it", danger:true}).then(function(yes){
    if(!yes) return false;
    jrRemove(id); renderAll(); return true;
  });
}
/* Every day with entries, newest first, each closed until it is opened, so
   nothing anyone wrote is on show when the page opens. Inside a day, each
   entry has its time, Edit and Remove. */
function jrListHtml(){
  var days=jrDayList();
  if(!days.length) return '<p class="wk-note">No entries yet. Press Write, or type &ldquo;journal my day&rdquo; to the assistant.</p>';
  return days.map(function(x){
    return '<details class="jr-day"><summary class="jr-date">'+esc(jrDateLabel(x.d))+' <span class="jr-n">'+esc(jrDaySays(x))+'</span></summary>'+
      jrDayEntries(x.d).map(function(e){
        var K=JR_KINDS[e.kind]||JR_KINDS.end, ed=jrEdited(e);
        return '<div class="jr-e"><div class="jr-meta">'+esc(e.tm)+' &middot; '+esc(K.name)+(ed?' &middot; '+esc(ed):'')+'</div>'+
          (e.a?'<p><b>'+esc(K.a)+'</b> '+esc(e.a)+'</p>':'')+(e.b?'<p><b>'+esc(K.b)+'</b> '+esc(e.b)+'</p>':'')+
          '<div class="jr-acts"><button class="mini" data-jr-edit="'+esc(e.id)+'">Edit</button><button class="mini" data-jr-del="'+esc(e.id)+'">Remove</button></div></div>';
      }).join("")+'</details>';
  }).join("");
}
