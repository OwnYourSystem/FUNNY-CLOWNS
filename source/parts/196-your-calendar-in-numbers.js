/* ---------------- your calendar, in numbers ----------------
   Meetings and reminders from Google Calendar, already on this device
   (part 415 fetches them), turned into what the tutor and the Calendar
   page need: what is on a day, when the person is busy, what comes next
   and how long until then. It reads the list it is given and the clock,
   nothing else. An event here is {id, t, s, e, all, busy, mine, rem}:
   s and e are Google's own start and end (a date for an all-day event). */
function calStart(ev){ return ev.all ? new Date(ev.s+"T00:00:00") : new Date(ev.s); }
function calEnd(ev){ return ev.all ? new Date(ev.e+"T00:00:00") : new Date(ev.e); }
function calHM(d){ return pad2(d.getHours())+":"+pad2(d.getMinutes()); }
/* the events that touch one day (YYYY-MM-DD), all-day ones first, then by start */
function calOnDay(evs,day){
  var a=new Date(day+"T00:00:00"), b=new Date(a); b.setDate(b.getDate()+1);
  return (evs||[]).filter(function(ev){ return calStart(ev)<b && calEnd(ev)>a; })
    .sort(function(x,y){ return (y.all?1:0)-(x.all?1:0) || calStart(x)-calStart(y); });
}
/* busy blocks on a day, as clock times; a reminder or a free event is not busy */
function calBusy(evs,day){
  return calOnDay(evs,day).filter(function(ev){ return ev.busy; })
    .map(function(ev){ return {from:calHM(calStart(ev)), to:calHM(calEnd(ev)), t:ev.t, kind:ev.mine||"event"}; });
}
/* what is on now or comes next today: {t, from, to, inMin, now} or null */
function calNext(evs,now){
  now=now||new Date();
  var day=dstr(now), hit=null;
  calOnDay(evs,day).forEach(function(ev){
    if(hit || ev.all || calEnd(ev)<=now) return;
    var s=calStart(ev);
    hit={t:ev.t, from:calHM(s), to:calHM(calEnd(ev)), inMin:Math.max(0,Math.round((s-now)/60000)), now:s<=now, busy:ev.busy, kind:ev.mine||"event"};
  });
  return hit;
}
/* minutes free from now until the next busy block today; 0 when busy now, null when nothing more is booked */
function calFreeMin(evs,now){
  now=now||new Date();
  var day=dstr(now), out=null;
  calOnDay(evs,day).forEach(function(ev){
    if(out!==null || !ev.busy || calEnd(ev)<=now) return;
    out=Math.max(0,Math.round((calStart(ev)-now)/60000));
  });
  return out;
}
/* one line per day for the tutor: busy times, names only when the person allows them */
function calSummary(evs,days,now,names){
  now=now||new Date();
  var out=[], d=new Date(now); d.setHours(0,0,0,0);
  for(var i=0;i<days;i++){
    var day=dstr(d), list=calOnDay(evs,day), parts=[];
    list.forEach(function(ev){
      var what=names?" "+ev.t:(ev.mine==="reminder"?" (reminder)":"");
      parts.push((ev.all?"all day":calHM(calStart(ev))+"-"+calHM(calEnd(ev)))+what+(ev.busy||ev.all?"":" (not busy)"));
    });
    out.push((i===0?"Today":i===1?"Tomorrow":DAYS_SHORT[d.getDay()]+" "+day)+": "+(parts.length?parts.join(", "):"nothing booked"));
    d.setDate(d.getDate()+1);
  }
  var nx=calNext(evs,now), free=calFreeMin(evs,now);
  if(nx) out.push(nx.now?"Now: in a booked slot until "+nx.to+".":"Next today: "+nx.from+", in "+nx.inMin+" minutes.");
  out.push(free===null?"Nothing more is booked today.":free===0?"Busy right now.":"Free for "+free+" minutes before the next busy slot.");
  return out.join("\n");
}

/* ---- rule 6, commitments come first (owner, 2026-10-21) ----
   A booking in the calendar is something the person must do: a doctor, a
   school run, a hospital visit. It is not weighed against the goals; it
   comes first. During a booking the board asks for nothing, and booked
   time makes the day smaller: every 2 hours booked is one step less, never
   below one. Kept simple on purpose: no travel time, no warm-up window.
   CAL_LIST is the calendar kept on this device; a store part fills it
   when the page loads and part 415 when it changes.                    */
var CAL_LIST=[];
/* the booking happening now, as {t, to}, or null */
function calBookedNow(evs,now){
  now=now||new Date();
  var hit=null;
  calOnDay(evs,dstr(now)).forEach(function(ev){
    if(!hit && ev.busy && calStart(ev)<=now && calEnd(ev)>now) hit={t:ev.t, to:calHM(calEnd(ev))};
  });
  return hit;
}
/* booked minutes today inside the person's day (day start to day end) */
function calBookedMin(evs,day,me){
  var a=new Date(day+"T"+((me&&me.rise)||"07:00")+":00"), b=new Date(day+"T"+((me&&me.wind)||"22:30")+":00");
  if(b<=a) b.setDate(b.getDate()+1);
  var min=0;
  calOnDay(evs,day).forEach(function(ev){
    if(!ev.busy) return;
    var s=calStart(ev), e=calEnd(ev);
    if(s<a) s=a; if(e>b) e=b;
    if(e>s) min+=Math.round((e-s)/60000);
  });
  return min;
}
/* the dose, made smaller by what is booked today */
function calDose(dz,me){
  var min=calBookedMin(CAL_LIST,todayStr(),me), cut=Math.floor(min/120);
  if(!cut || dz.n<=1) return dz;
  var n=Math.max(1,dz.n-cut), h=Math.round(min/30)/2;
  dz.n=n; dz.booked=min;
  dz.why=(dz.why?dz.why+" ":"")+h+(h===1?" hour is":" hours are")+" booked in your calendar today, so "+n+(n===1?" step.":" steps.");
  return dz;
}
/* what Now says about the calendar: today's bookings still to come, or in the
   evening (nothing more today) tomorrow's first one, to get ready for */
function calAhead(evs,now){
  now=now||new Date();
  var today=calOnDay(evs,dstr(now)).filter(function(ev){ return ev.all || calEnd(ev)>now; });
  if(today.some(function(ev){ return !ev.all; })) return {when:"Today", list:today};
  var t=new Date(now); t.setDate(t.getDate()+1);
  var first=calOnDay(evs,dstr(t)).filter(function(ev){ return !ev.all; })[0];
  return first ? {when:"Tomorrow", list:[first]} : today.length ? {when:"Today", list:today} : null;
}
function calAheadText(a){
  if(!a) return "";
  var l=a.list.slice(0,3).map(function(ev){ return (ev.all?"All day":calHM(calStart(ev)))+" "+ev.t; });
  return l.join(", ")+(a.list.length>3?", and "+(a.list.length-3)+" more":"");
}
