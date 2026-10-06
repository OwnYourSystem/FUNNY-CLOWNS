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
var DAYNAME=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function nowCtx(at){
  var d=at||new Date(), me=state.me||freshMe();
  var dow=d.getDay(), now=d.getHours()*60+d.getMinutes();
  var onDuty=me.days.indexOf(dow)>=0;
  var a=hm(me.work[0]), b=hm(me.work[1]), c=+me.commute||0;
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
    free: !(onDuty && now>=a-c && now<=b+c),
    home: clockLabel(me.work[1]),
    leave: clockLabel(me.work[0]),
    wind: clockLabel(me.wind),
    slot: now<12*60 ? "morning" : (now<17*60 ? "afternoon" : "evening")
  };
}
/* Can this goal be worked in the hour you are in? A no comes with the
   reason in plain words, because a refusal you cannot argue with is worth
   more than a suggestion you cannot act on.                             */
function feasible(g,c){
  var w=g.where||"any";
  if(c.wound){
    if(w==="body") return {ok:false, why:"it is past "+c.wind+", and training now costs you tomorrow"};
    if(w==="out")  return {ok:false, why:"it is past "+c.wind+" and nothing is open"};
    if(w==="work") return {ok:false, why:"it needs you at work, and it is past "+c.wind};
    return {ok:true, soft:true, why:"it is past "+c.wind+", so this is a quiet one"};
  }
  if(c.away){
    if(w==="body") return {ok:false, why:"you are out until about "+c.home};
    if(w==="home") return {ok:false, why:"you are not home until about "+c.home};
    if(w==="out")  return c.lunch ? {ok:true, soft:true, why:"it is your lunch window"}
                                  : {ok:false, why:"it wants other people's opening hours, and you are on the clock"};
    return {ok:true};
  }
  /* off the clock */
  if(w==="work"){
    var nx = c.workday && c.beforeWork ? "at "+c.leave+" today" : "the next working morning";
    return {ok:false, why:"it needs you at work, and the next window is "+nx};
  }
  if(w==="body"){
    var g2=(state.me||freshMe()).gym;
    if(g2==="none") return {ok:false, why:"you said training is not on at the moment"};
    if(g2==="weekend" && c.workday) return {ok:false, why:"you said training is weekends only"};
    if(g2==="morning" && !c.beforeWork) return {ok:true, soft:true, why:"you train before work, so this is off its window"};
    if(g2==="evening" && c.beforeWork)  return {ok:true, soft:true, why:"you train after work, so this is early"};
    return {ok:true};
  }
  return {ok:true};
}
/* the siren: only the ones that genuinely cannot wait */
function screaming(){ return alerts().filter(function(a){ return a.score>=150; }).length; }


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

