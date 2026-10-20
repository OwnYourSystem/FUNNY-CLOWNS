/* ---------------- where you are, right now ----------------
   Everything the planner refuses to suggest is refused here, from the clock
   and the profile alone. No goal is consulted yet: this just works out what
   kind of hour it is.                                                    */
function hm(t){ var m=String(t||"").match(/^(\d{1,2}):(\d{2})/); return m?(+m[1]*60 + +m[2]):0; }
function clockLabel(t){ return String(t||"").slice(0,5); }
/* True from "your day ends at" until 04:00. A day that ends after midnight
   (00:30, say) is over only between that time and 04:00, not all day. */
function pastDayEnd(me, mins){
  var w=hm((me||{}).wind);
  return w>=4*60 ? (mins>=w || mins<4*60) : (mins>=w && mins<4*60);
}
/* True from 04:00 until "your day starts at" (owner, 2026-10-19: a day has
   a start as well as an end). A start at or before 04:00 has no early quiet. */
function beforeDayStart(me, mins){
  var r=hm((me||{}).rise||"07:00");
  return r>4*60 && mins>=4*60 && mins<r;
}
/* nothing reaches you outside your day: before it starts, or after it ends */
function outsideDay(me, mins){ return pastDayEnd(me, mins) || beforeDayStart(me, mins); }
var DAYNAME=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function nowCtx(at){
  var d=at||new Date(), me=state.me||freshMe();
  var dow=d.getDay(), now=d.getHours()*60+d.getMinutes();
  var onDuty=me.days.indexOf(dow)>=0;
  var a=hm(me.work[0]), b=hm(me.work[1]), c=0;   /* travel no longer counts (2026-10-20) */
  var lunch = onDuty && now>=a+3*60 && now<=a+5*60;
  return {
    d:d, dow:dow, now:now, day:DAYNAME[dow],
    workday:onDuty,
    /* out of the house from the moment you leave until you are back */
    away: onDuty && now>=a-c && now<=b+c,
    atWork: onDuty && now>=a && now<=b,
    lunch: lunch,
    beforeWork: onDuty && now<a-c,
    afterWork: onDuty && now>b+c,
    wound: pastDayEnd(me, now),       /* past the end of the day, or the small hours */
    early: beforeDayStart(me, now),   /* the morning, before the day starts */
    free: !(onDuty && now>=a-c && now<=b+c),
    home: clockLabel(me.work[1]),
    leave: clockLabel(me.work[0]),
    wind: clockLabel(me.wind),
    rise: clockLabel(me.rise||"07:00"),
    slot: now<12*60 ? "morning" : (now<17*60 ? "afternoon" : "evening")
  };
}
/* Can this goal be worked in the hour you are in? A no comes with the
   reason in plain words, because a refusal you cannot argue with is worth
   more than a suggestion you cannot act on.                             */
/* rule 5: in work hours only work goals; outside them only the other goals */
function feasible(g,c){
  var work=g.where==="work";
  if(c.atWork) return work ? {ok:true} : {ok:false, why:"it is work hours until "+c.home+", so it waits"};
  if(work) return {ok:false, why:"it is a work goal, and work starts "+(c.workday&&c.beforeWork?"at "+c.leave+" today":"the next working morning")};
  return {ok:true};
}
/* the siren: only the ones that genuinely cannot wait */
/* nothing on the board screams any more (2026-10-20); what is left is the
   number of delivery days that have passed and still wait for an answer */
function screaming(){ return state.groups.filter(function(g){ return missedDelivery(g) && g.missAsk!==g.due; }).length; }


/* A copy of the whole board, once a day, for the last 7 days. It does not
   survive this browser being wiped, but it does survive a bad afternoon. */
var SNAP_KEY=KEY+".snaps";
function restoreSnapshot(day){
  var hit=readSnaps().filter(function(x){ return x.d===day; })[0];
  if(!hit) return false;
  keepSnapshot("before-restore-"+todayStr());
  state=hit.data;
  boot2();
  return true;
}

