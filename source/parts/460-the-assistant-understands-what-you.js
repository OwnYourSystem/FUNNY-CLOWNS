/* ---------------- the assistant understands what you type ----------------
   Every list and setting you can change by hand can be changed here, in plain
   words, with no model and no network. A sentence that names what to change
   but not the value gets a question back ("What time does your day end?"), and
   your next message is read as the answer. A sentence it cannot place gets the
   closest things it can do, never a guess. Your weekly check-ins are the one
   thing it cannot see or change: they are private.                          */
var DAYNAMES=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
var MONTHNAMES=["january","february","march","april","may","june","july","august","september","october","november","december"];
function dayIdx(w){ w=String(w||"").toLowerCase(); if(w.length<3) return -1; for(var i=0;i<7;i++) if(DAYNAMES[i].indexOf(w)===0||w===DAYNAMES[i].slice(0,3)) return i; return -1; }
function dayWord(i){ return DAYNAMES[i].charAt(0).toUpperCase()+DAYNAMES[i].slice(1,3); }
function pTime(t){
  t=String(t==null?"":t).toLowerCase().replace(/\s+/g," ").trim().replace(/^(?:at|by|to|is|=) /,"").replace(/^at /,"");
  if(!t) return null;
  if(t==="noon"||t==="midday") return "12:00";
  if(t==="midnight") return "00:00";
  var m=t.match(/^(\d{1,2})(?:[:.h](\d{2}))?\s?(a\.?m\.?|p\.?m\.?)?$/), h, mi, ap;
  if(m){ h=+m[1]; mi=+(m[2]||0); ap=m[3]?m[3].charAt(0):""; }
  else {
    m=t.match(/^([a-z\-]+)(?: o'?clock)?\s?(am|pm)?$/);
    if(!m) return null;
    h=numOf(m[1]); mi=0; ap=m[2]?m[2].charAt(0):"";
    if(isNaN(h)) return null;
  }
  if(ap==="p" && h<12) h+=12;
  if(ap==="a" && h===12) h=0;
  if(h>23||mi>59) return null;
  return pad2(h)+":"+pad2(mi);
}
function pRange(t){
  var parts=String(t||"").toLowerCase().split(/\s*(?:\bto\b|\buntil\b|\btill\b|-|–|\bthrough\b)\s*/);
  if(parts.length!==2) return null;
  var a=pTime(parts[0]), b=pTime(parts[1]);
  if(!a||!b) return null;
  /* "8 to 4:30" means the afternoon for the end */
  if(b<=a && !/[ap]\.?m/.test(parts[1])){
    var hh=+b.slice(0,2);
    if(hh<12){ b=pad2(hh+12)+b.slice(2); }
  }
  return b>a ? [a,b] : null;
}
function pDays(t){
  t=String(t||"").toLowerCase().replace(/[,&]/g," ").replace(/\s+/g," ").trim();
  if(!t) return null;
  if(/^(?:every ?day|all week|daily|seven days|7 days|all days)$/.test(t)) return [0,1,2,3,4,5,6];
  if(/^(?:weekdays?|work ?days?|week days?|monday to friday)$/.test(t)) return [1,2,3,4,5];
  if(/^weekends?$/.test(t)) return [0,6];
  var r=t.match(/^([a-z]+) ?(?:to|through|thru|-|until) ?([a-z]+)$/);
  if(r){
    var a=dayIdx(r[1]), b=dayIdx(r[2]); if(a<0||b<0) return null;
    var out=[], i=a;
    for(var k=0;k<7;k++){ out.push(i); if(i===b) break; i=(i+1)%7; }
    return out.sort(function(x,y){ return x-y; });
  }
  var out2=[], bad=false;
  t.split(/ (?:and )?/).forEach(function(w){ if(!w||w==="and") return; var d=dayIdx(w); if(d<0) bad=true; else if(out2.indexOf(d)<0) out2.push(d); });
  return (bad||!out2.length) ? null : out2.sort(function(x,y){ return x-y; });
}
function pMinutes(t){
  t=String(t==null?"":t).toLowerCase().replace(/\s+/g," ").trim().replace(/^(?:about|around|roughly|approximately|to|is|=) /,"");
  if(!t) return null;
  var x;
  if(/^(?:half an hour|half hour)$/.test(t)) return 30;
  if(/^an? hour$/.test(t)) return 60;
  if(/^(?:an hour and a half|hour and a half)$/.test(t)) return 90;
  x=t.match(/^(\d+(?:\.\d+)?)\s?(?:h|hr|hrs|hours?)(?:\s?(?:and )?(\d+)\s?(?:m|min|mins|minutes?)?)?$/);
  if(x) return Math.round(parseFloat(x[1])*60+(+x[2]||0));
  x=t.match(/^(\d+)\s?(?:m|min|mins|minutes?)?$/); if(x) return +x[1];
  x=t.match(/^([a-z\- ]+?)\s?(?:minutes?|mins?)$/); if(x){ var n=numOf(x[1]); if(!isNaN(n)) return n; }
  x=t.match(/^([a-z\-]+)\s?hours?$/); if(x){ var h=numOf(x[1]); if(!isNaN(h)) return h*60; }
  return null;
}
/* a date as 2026-10-12, "" for none, or null when it cannot be read */
function pDate(t){
  t=String(t==null?"":t).toLowerCase().replace(/\s+/g," ").trim().replace(/^(?:on|by|at|to|is) /,"");
  if(/^(?:none|no deadline|no date|nothing|clear|remove|never)$/.test(t)) return "";
  if(!t) return null;
  var d=new Date(), m; d.setHours(0,0,0,0);
  if(t==="today") return dstr(d);
  if(t==="tomorrow"){ d.setDate(d.getDate()+1); return dstr(d); }
  if(t==="next week"){ d.setDate(d.getDate()+7); return dstr(d); }
  m=t.match(/^in (\d+|[a-z\-]+) (day|days|week|weeks)$/);
  if(m){ var n=numOf(m[1]); if(isNaN(n)) return null; d.setDate(d.getDate()+n*(m[2].charAt(0)==="w"?7:1)); return dstr(d); }
  m=t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m){ var x=new Date(+m[1],+m[2]-1,+m[3]); return (x.getFullYear()===+m[1]&&x.getMonth()===+m[2]-1&&x.getDate()===+m[3]) ? t : null; }
  m=t.match(/^(next |this )?([a-z]+)$/);
  if(m && dayIdx(m[2])>=0){
    var want=dayIdx(m[2]), add=(want-d.getDay()+7)%7;
    if(m[1]==="next " && add===0) add=7;
    d.setDate(d.getDate()+add); return dstr(d);
  }
  var mo=function(w){ w=w.slice(0,3); for(var i=0;i<12;i++) if(MONTHNAMES[i].indexOf(w)===0) return i; return -1; };
  m=t.match(/^(\d{1,2})(?:st|nd|rd|th)? ([a-z]+)(?: (\d{4}))?$/) || null;
  var dayN, monN, yr;
  if(m){ dayN=+m[1]; monN=mo(m[2]); yr=m[3]?+m[3]:null; }
  else { m=t.match(/^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?$/); if(m){ monN=mo(m[1]); dayN=+m[2]; yr=m[3]?+m[3]:null; } }
  if(m && monN>=0 && dayN>=1 && dayN<=31){
    var y=yr||d.getFullYear(), cand=new Date(y,monN,dayN);
    if(!yr && cand<d) cand=new Date(y+1,monN,dayN);
    return (cand.getMonth()===monN) ? dstr(cand) : null;
  }
  return null;
}
function pPrio(t){
  t=String(t||"").toLowerCase().trim();
  if(/^(?:high|important|urgent|top|critical|highest)/.test(t)) return "high";
  if(/^(?:mid|medium|middle|normal|ok|okay|average)/.test(t)) return "mid";
  if(/^(?:low|minor|someday|lowest)/.test(t)) return "low";
  return null;
}
function pWhere(t){
  t=String(t||"").toLowerCase().trim();
  if(/^(?:any|anywhere|everywhere)/.test(t)) return "any";
  if(/^(?:screen|a screen|desk|laptop|computer|at a screen|at a desk)/.test(t)) return "desk";
  if(/^(?:work|the office|office|at work)/.test(t)) return "work";
  if(/^(?:home|at home|house)/.test(t)) return "home";
  if(/^(?:training|gym|body|exercise|workout)/.test(t)) return "body";
  if(/^(?:out|out and about|outside|errands|shops?)/.test(t)) return "out";
  return null;
}
function pGym(t){
  t=String(t||"").toLowerCase().trim();
  if(/before work|in the morning|^morning/.test(t)) return "morning";
  if(/lunch/.test(t)) return "lunch";
  if(/after work|evening|after hours|^night/.test(t)) return "evening";
  if(/weekend/.test(t)) return "weekend";
  if(/^(?:none|never|no|not at the moment|not now)/.test(t)) return "none";
  return null;
}
function pSharp(t){ var m=String(t||"").toLowerCase().match(/\b(morning|afternoon|evening)\b/); return m?m[1]:null; }
function onOff(t){
  t=String(t==null?"":t).toLowerCase().trim();
  if(/^(?:on|yes|true|enable|enabled|start|resume|1)$/.test(t)) return true;
  if(/^(?:off|no|false|disable|disabled|stop|pause|0)$/.test(t)) return false;
  return null;
}
function pTheme(t){
  t=String(t||"").toLowerCase();
  return /dark/.test(t)?"dark":/light/.test(t)?"light":/system|auto|default/.test(t)?"system":null;
}
function stepFrom(t){ return fuzSub(t); }
function goalFrom(t){ return fuzGroup(t); }
function anchorFrom(t){
  t=String(t||"").toLowerCase().trim();
  var l=floorState().items, hit=l.filter(function(x){ return x.t.toLowerCase()===t; });
  if(!hit.length) hit=l.filter(function(x){ return x.t.toLowerCase().indexOf(t)>=0 && t.length>2; });
  if(!hit.length){ var f=loose(t,l,function(x){ return x.t; }); if(f) hit=[f]; }
  return hit.length===1?hit[0]:null;
}
var VIEWS={board:"board",today:"board",planner:"planner",plan:"planner",tags:"tags",backlog:"backlog",archive:"archive"};
var PARSE={
  time:pTime, range:pRange, days:pDays, minutes:pMinutes, date:pDate, prio:pPrio, where:pWhere, gym:pGym, sharp:pSharp,
  onoff:onOff, theme:pTheme,
  text:function(t){ t=String(t||"").trim(); return t?t:null; },
  step:function(t){ var s=stepFrom(t); return s?s.name:null; },
  goal:function(t){ var g=goalFrom(t); return g?g.name:null; },
  anchor:function(t){ var a=anchorFrom(t); return a?a.t:null; },
  list:function(t){
    var l=String(t||"").split(/\s*(?:,|;|\band\b)\s*/).map(function(x){ return x.trim(); }).filter(Boolean);
    return l.length?l:null;
  },
  view:function(t){ t=String(t||"").toLowerCase().trim().replace(/^the /,"").replace(/ (?:page|view|tab)$/,""); return VIEWS[t]||null; }
};
function applySetting(key,val){
  var me=state.me||(state.me=freshMe()), v=String(val==null?"":val).trim(), t, x, b;
  switch(key){
    case "day_end":
      t=pTime(v); if(!t) throw new Error("I could not read that time. Type it like 21:00 or 9pm.");
      me.wind=t; return "Your day now ends at "+t+". Reminders and suggestions go quiet after that.";
    case "work_hours":
      x=pRange(v); if(!x) throw new Error("I could not read those hours. Type it like 8 to 4:30 or 09:00 to 17:30.");
      me.work=[x[0],x[1]]; return "Work hours are now "+x[0]+" to "+x[1]+".";
    case "work_days":
      x=pDays(v); if(!x) throw new Error("I could not read those days. Type it like monday to friday or mon wed fri.");
      me.days=x; return "Work days are now "+x.map(dayWord).join(", ")+".";
    case "commute":
      x=pMinutes(v); if(x===null||x>240) throw new Error("Give the commute in minutes, from 0 to 240.");
      me.commute=x; return "Your commute is now "+x+" minutes each way.";
    case "sharpest":
      t=pSharp(v); if(!t) throw new Error("Type morning, afternoon or evening.");
      me.sharp=t; return "You are sharpest in the "+t+". The board will put its hardest suggestions there.";
    case "training":
      t=pGym(v); if(!t) throw new Error("Type before work, at lunch, after work, weekends only, or not at the moment.");
      me.gym=t; return "Training: "+GYMWIN.filter(function(o){ return o[0]===t; })[0][1].toLowerCase()+".";
    case "brief_time":
      t=pTime(v); if(!t) throw new Error("I could not read that time. Type it like 07:30 or 8am.");
      me.brief=t; return "Your morning brief is now at "+t+".";
    case "north_star":
      if(!v) throw new Error("Type what matters most, in one line.");
      me.north=v.slice(0,140); return "Noted. What matters most: "+me.north;
    case "hints":
      b=onOff(v); if(b===null) throw new Error("Type on or off."); me.hints=b; return b?"Hints are on. At most one a day.":"Hints are off.";
    case "hint_reminders":
      b=onOff(v); if(b===null) throw new Error("Type on or off."); me.hintNote=b; return b?"The hint also arrives as a reminder.":"Hints no longer arrive as a reminder. The card still shows.";
    case "low_day_question":
      b=onOff(v); if(b===null) throw new Error("Type on or off."); me.barrier=b; return b?"After three low days in a row the board will ask what is in the way.":"The low-day question is off.";
    case "learning":
      b=onOff(v); if(b===null) throw new Error("Type on or off."); me.learn=b; return b?"Learning is on.":"Learning is off. What you kept stays, and nothing new is proposed.";
    case "theme":
      t=pTheme(v); if(!t) throw new Error("Type dark, light or system.");
      try{ if(t==="system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY,t); }catch(e){}
      paintTheme(); return "Theme: "+t+".";
    case "animation":
      b=onOff(v); if(b===null) throw new Error("Type on or off.");
      if(b!==!!motionOn) $("#btn-motion").click();
      return b?"The moving background is on.":"The moving background is off.";
  }
  throw new Error("I do not have a setting called "+key+".");
}
function prioWord(p){ return p==="high"?"high":p==="low"?"low":"middle"; }

/* what you can ask for, grouped. Each entry has the words that trigger it, the
   details it needs, a question for each detail it may have to ask, and what it
   runs. "loose" ones read free text, so they stand down when a model is there. */
var ACT=[];
function act(o){ ACT.push(o); }
act({id:"dose_low",group:"Today",ex:"Make today a rough day",kw:["rough","tired","low","exhausted","small"],
  re:[/\b(?:rough|bad|tough|hard|slow) (?:day|one)\b/,/\bmake (?:today|it) (?:a |an )?(?:rough|low|light|easy|small)\b/,/\bi(?:'m| am) (?:worn out|exhausted|wiped out|shattered|knackered)\b/],
  run:function(){ return toolRun("set_dose",{mode:"rough"}); }});
act({id:"dose_more",group:"Today",ex:"Give me more today",kw:["more","energy","good day"],
  re:[/^(?:give me |i want |ask for |let me have )?more(?: today| things| work)?$/,/\b(?:good|great|strong|big) day\b/,/\bi (?:have|got|feel) (?:lots of |plenty of )?(?:energy|great|strong|good)\b/,/\bmake today (?:a )?(?:bigger|good|big|full)\b/],
  run:function(){ return toolRun("set_dose",{mode:"more"}); }});
act({id:"dose_auto",group:"Today",ex:"Let the board size today",kw:["auto","size","dose"],
  re:[/\bback to auto\b/,/\blet the board (?:decide|guess|choose|size)\b/,/\b(?:dose|day size) (?:to )?auto\b/],
  run:function(){ return toolRun("set_dose",{mode:"auto"}); }});
act({id:"explain",group:"Today",ex:"Why this one?",kw:["why","reason","criteria","explain"],
  re:[/^(?:why(?: this| that| now| this one| that one)?|why did you (?:pick|suggest|choose|recommend) (?:that|this)(?: one)?|explain(?: that| this)?|what(?:'s| is) the reason)$/],
  run:function(){
    var p=pickToday();
    if(!p) return "There is nothing to explain: no step is being suggested right now.";
    return "I suggest "+p.s.name+" ("+p.g.name+"). "+p.why+" I look at the time and your hours, how close the deadline is and how important you called it, whether the step is already started, and how big today is."; }});
act({id:"into_today",group:"Today",ex:"Put buy milk in today",kw:["today","focus","pull"],
  re:[/^(?:put|add|move|pull|bring|take) (.+?) (?:in|into|to|onto|in to) today$/,/^(?:do|work on) (.+?) today$/],take:[["step",1]],ask:{step:"Which step do you want in Today?"},
  run:function(v){ return toolRun("focus_today",{subtask:v.step}); }});
act({id:"into_waiting",group:"Today",ex:"Move buy milk to waiting",kw:["waiting","later","park","queue"],
  re:[/^(?:put|add|move|queue|send|push) (.+?) (?:in|into|to|onto) (?:the )?waiting(?: list)?$/,/^(?:not today|later|park|wait on|leave for later) (.+)$/],take:[["step",1]],ask:{step:"Which step should wait?"},
  run:function(v){ return toolRun("plan_today",{subtask:v.step}); }});
act({id:"undo_done",group:"Today",ex:"Undo done on buy milk",kw:["undo","reopen","not done"],
  re:[/^(?:undo|reopen|put back|un-?do) (?:done |finished )?(?:on |for )?(.+?)(?: as done)?$/],take:[["step",1]],ask:{step:"Which step should I reopen?"},
  run:function(v){ return toolRun("undo_done_today",{subtask:v.step}); }});
act({id:"how_doing",group:"Today",ex:"How am I doing this week?",kw:["how","week","doing","progress"],
  re:[/\bhow (?:am i|was i|did i) (?:doing|do)\b/,/\bhow(?:'s| is| was) (?:my|the|this) (?:week|day)\b/,/\bhow have i (?:been )?(?:doing|done)\b/],
  run:function(){ return evSayWeek()+" Today you have finished "+state.done.length+" and "+state.oftad.length+" "+(state.oftad.length===1?"is":"are")+" still in Today."; }});
act({id:"attention",group:"Today",ex:"What needs attention?",kw:["due","late","overdue","urgent","deadline","attention"],
  re:[/^(?:what(?:'s| is| are)? )?(?:due|late|overdue|urgent|close|needs? (?:attention|a look))(?: soon)?$/,/\bwhat needs (?:attention|a look)\b/,/\bwhat(?:'s| is) (?:due|late|overdue|urgent)\b/],
  run:function(){
    var al=alerts().slice(0,5);
    if(!al.length) return "Nothing needs attention right now.";
    return "Needs attention:\n"+al.map(function(a){ return "- "+a.t+": "+a.w; }).join("\n"); }});
act({id:"step_priority",group:"Steps",ex:"Set buy milk priority to high",kw:["priority","important"],
  re:[/^(?!(?:(?:set|change|make|remove|clear|delete) )?(?:the )?(?:deadline (?:of|from|for|on) )?(?:the )?(?:goal|project) )(?:set |change |make )?(?:the )?(.+?) (?:priority|prio)(?: (?:to |is |as )?(.*))?$/,/^(?!(?:(?:set|change|make|remove|clear|delete) )?(?:the )?(?:deadline (?:of|from|for|on) )?(?:the )?(?:goal|project) )make (.+?) (?:a )?(high|low|medium|middle|mid|normal|urgent|important)(?: priority)?$/],take:[["step",1],["prio",2]],
  ask:{step:"Which step?",prio:"High, middle or low?"},
  run:function(v){ return toolRun("set_subtask_field",{subtask:v.step,field:"priority",value:v.prio}); }});
act({id:"step_deadline",group:"Steps",ex:"Buy milk is due friday",kw:["due","deadline","date"],loose:true,
  re:[/^(?!(?:(?:set|change|make|remove|clear|delete) )?(?:the )?(?:deadline (?:of|from|for|on) )?(?:the )?(?:goal|project) )(?:remove|clear|delete) (?:the )?deadline (?:of|from|for|on) (.+)$/,/^(?!(?:(?:set|change|make|remove|clear|delete) )?(?:the )?(?:deadline (?:of|from|for|on) )?(?:the )?(?:goal|project) )(?:set |change )?(?:the )?deadline (?:of|for|on) (.+?)(?::| to | is )\s*(.*)$/,/^(?!(?:(?:set|change|make|remove|clear|delete) )?(?:the )?(?:deadline (?:of|from|for|on) )?(?:the )?(?:goal|project) )(.+?) (?:is )?due (?:on |by )?(.+)$/],
  take:[["step",1],["date",2]],fixed:{0:{date:""}},ask:{step:"Which step?",date:"What date? Type a day like friday, tomorrow or 2026-10-12, or none."},
  run:function(v){ return toolRun("set_subtask_field",{subtask:v.step,field:"deadline",value:v.date}); }});
act({id:"step_tag",group:"Steps",ex:"Tag buy milk as errands",kw:["tag","label"],
  re:[/^tag (?!goal|project)(.+?) (?:as|with) (.+)$/],take:[["step",1],["text",2]],ask:{step:"Which step?",text:"Which tag?"},
  run:function(v){ return toolRun("set_subtask_field",{subtask:v.step,field:"tag",value:v.text}); }});
act({id:"step_when",group:"Steps",ex:"When for buy milk: after my coffee",kw:["when","cue","after"],
  re:[/^(?:set )?when (?:for|to do|i will do) (.+?)(?::| to | is )\s*(.*)$/,/^i(?:'ll| will) do (.+?) ((?:after|when|before|at) .+)$/],take:[["step",1],["text",2]],
  ask:{step:"Which step?",text:"When will you do it? Pick a moment you will notice, such as after your coffee."},
  run:function(v){ return toolRun("set_when",{subtask:v.step,text:v.text}); }});
act({id:"step_estimate",group:"Steps",ex:"Buy milk takes 25 minutes",kw:["takes","long","minutes","guess","estimate"],loose:true,
  re:[/^(?:set )?(?:the )?(?:guess|estimate) (?:for|of) (.+?)(?::| to | is )\s*(.*)$/,/^(?!(?:(?:set|change|make|remove|clear|delete) )?(?:the )?(?:deadline (?:of|from|for|on) )?(?:the )?(?:goal|project) )(.+?) (?:will )?takes? (?:me )?(?:about |around )?(\d.*|an? hour.*|half an hour|\w+ (?:minutes?|hours?))$/],take:[["step",1],["minutes",2]],
  ask:{step:"Which step?",minutes:"About how long, in minutes?"},
  run:function(v){ return toolRun("set_estimate",{subtask:v.step,minutes:v.minutes}); }});
act({id:"step_actual",group:"Steps",ex:"It took 40 minutes",kw:["took","actually"],loose:true,
  re:[/^(?:it|that|(.+?)) took (?:me )?(?:about |around )?(\d.*|an? hour.*|half an hour|\w+ (?:minutes?|hours?))$/],take:[["minutes",2]],
  ask:{minutes:"How many minutes did it take?"},
  run:function(v){ return toolRun("log_actual",{minutes:v.minutes}); }});
act({id:"goal_rename",group:"Goals",ex:"Rename goal Home to House",kw:["rename","goal"],
  re:[/^rename (?:the )?(?:goal|project|main task) (.+?) to (.+)$/],take:[["goal",1],["text",2]],ask:{goal:"Which goal?",text:"What should it be called?"},
  run:function(v){ return toolRun("set_goal_field",{main_task:v.goal,field:"name",value:v.text}); }});
act({id:"goal_priority",group:"Goals",ex:"Set goal Home priority to high",kw:["goal","priority"],
  re:[/^(?:set |change )?(?:the )?(?:goal|project) (.+?) (?:priority|prio)(?: (?:to |is |as )?(.*))?$/,/^make (?:the )?(?:goal|project) (.+?) (?:a )?(high|low|medium|middle|mid|normal|urgent|important)(?: priority)?$/],take:[["goal",1],["prio",2]],
  ask:{goal:"Which goal?",prio:"High, middle or low?"},
  run:function(v){ return toolRun("set_goal_field",{main_task:v.goal,field:"priority",value:v.prio}); }});
act({id:"goal_deadline",group:"Goals",ex:"Goal Home is due 2026-12-01",kw:["goal","deadline","due"],
  re:[/^(?:remove|clear|delete) (?:the )?deadline (?:of|from|for|on) (?:the )?(?:goal|project) (.+)$/,/^(?:set |change )?(?:the )?(?:goal|project) (.+?) (?:deadline|due(?: date)?) (?:to |is |on |by )?(.*)$/,/^(?:the )?(?:goal|project) (.+?) is due (?:on |by )?(.+)$/],
  take:[["goal",1],["date",2]],fixed:{0:{date:""}},ask:{goal:"Which goal?",date:"What date? Type a day like friday or 2026-12-01, or none."},
  run:function(v){ return toolRun("set_goal_field",{main_task:v.goal,field:"deadline",value:v.date}); }});
act({id:"goal_where",group:"Goals",ex:"Goal Home can only be done at home",kw:["goal","where","place"],
  re:[/^(?:set )?(?:the )?(?:goal|project) (.+?) (?:where|place|location) (?:to |is )?(.*)$/,/^(?:the )?(?:goal|project) (.+?) (?:can only be|is only|is) done (?:at|in) (.+)$/],take:[["goal",1],["where",2]],
  ask:{goal:"Which goal?",where:"Where? Anywhere, at a screen, at work, at home, training, or out and about."},
  run:function(v){ return toolRun("set_goal_field",{main_task:v.goal,field:"where",value:v.where}); }});
act({id:"goal_tags",group:"Goals",ex:"Tag goal Home with house, q4",kw:["goal","tag"],
  re:[/^(?:tag|label) (?:the )?(?:goal|project) (.+?) (?:with|as) (.+)$/,/^set (?:the )?tags (?:of|for) (?:the )?(?:goal |project )?(.+?) to (.+)$/],take:[["goal",1],["text",2]],
  ask:{goal:"Which goal?",text:"Which tags, separated by commas?"},
  run:function(v){ return toolRun("set_goal_field",{main_task:v.goal,field:"tags",value:v.text}); }});
act({id:"goal_archive",group:"Goals",ex:"Archive goal Home",kw:["archive","finish","close"],
  re:[/^(?:archive|finish|close) (?:the )?(?:goal|project) (.+)$/],take:[["goal",1]],ask:{goal:"Which goal?"},
  run:function(v){ return toolRun("archive_goal",{main_task:v.goal}); }});
act({id:"goal_backlog",group:"Goals",ex:"Move goal Home to the backlog",kw:["backlog"],
  re:[/^(?:move|send|put) (?:the )?(?:goal |project )?(.+?) (?:to|into|in) (?:the )?backlog$/],take:[["goal",1]],ask:{goal:"Which goal?"},
  run:function(v){ return toolRun("backlog_goal",{main_task:v.goal}); }});
act({id:"goal_restore",group:"Goals",ex:"Bring Home back from the backlog or archive",kw:["backlog","restore","back"],
  re:[/^(?:bring|move|restore|take|put|get) (?:the )?(?:goal |project )?(.+?) (?:back )?(?:from|out of|off) (?:the )?(?:backlog|archive)$/,/^(?:restore|unarchive) (?:the )?(?:goal |project )?(.+)$/],take:[["text",1]],ask:{text:"Which one?"},
  run:function(v){ return toolRun("restore_goal",{name:v.text}); }});
act({id:"goal_remove",group:"Goals",ex:"Remove goal Home",kw:["remove","delete","goal"],
  re:[/^(?:remove|delete|drop|scrap) (?:the )?(?:goal|project|main task) (.+)$/],take:[["goal",1]],ask:{goal:"Which goal?"},
  run:function(v){ return pendStage({name:"remove_main_task"},{main_task:v.goal}); }});
act({id:"day_end",group:"Settings",ex:"My day ends at 9pm",kw:["day","end","evening","finish","wind"],
  re:[/\b(?:day ends?|end of (?:my )?day|wind ?down(?: time)?|stop for the day)\b(?: (?:at|to|is|by))? ?(.*)$/],take:[["time",1]],ask:{time:"What time does your day end? For example 21:00 or 9pm."},
  run:function(v){ return toolRun("set_setting",{key:"day_end",value:v.time}); }});
act({id:"work_hours",group:"Settings",ex:"I work 8 to 4:30",kw:["work","hours","start","finish"],
  re:[/\b(?:work(?:ing)? hours|i work|i start|working hours are)\b(?: (?:from|at|are|is|to))? ?(\d.*)$/,/^(?:set )?(?:my )?work(?:ing)? hours(?: to| are| is)? ?(.*)$/],take:[["range",1]],ask:{range:"What are your work hours? For example 8 to 4:30."},
  run:function(v){ return toolRun("set_setting",{key:"work_hours",value:v.range.join(" to ")}); }});
act({id:"work_days",group:"Settings",ex:"I work monday to friday",kw:["work","days","weekdays"],
  re:[/^(?:set )?(?:my )?work(?:ing)? days(?: to| are| is)? ?(.*)$/,/^i work (?:on )?((?:mon|tue|wed|thu|fri|sat|sun|every|week|all).*)$/],take:[["days",1]],ask:{days:"Which days do you work? For example monday to friday, or mon wed fri."},
  run:function(v){ return toolRun("set_setting",{key:"work_days",value:v.days.map(dayWord).join(" ")}); }});
act({id:"commute",group:"Settings",ex:"My commute is 30 minutes",kw:["commute","travel"],
  re:[/\b(?:commute|travel(?:ling)? to work)\b(?: (?:is|takes|to|=))? ?(.*)$/],take:[["minutes",1]],ask:{minutes:"How long is your commute each way, in minutes?"},
  run:function(v){ return toolRun("set_setting",{key:"commute",value:String(v.minutes)}); }});
act({id:"sharpest",group:"Settings",ex:"I am sharpest in the morning",kw:["sharpest","best","focus","alert"],
  re:[/\b(?:sharpest|most focused|most alert|focus(?:ed)? best|work best|best time)\b.*?\b(morning|afternoon|evening)\b/,/\bi(?:'m| am) (?:a |an )?(morning|afternoon|evening) (?:person|type)\b/],take:[["sharp",1]],ask:{sharp:"Morning, afternoon or evening?"},
  run:function(v){ return toolRun("set_setting",{key:"sharpest",value:v.sharp}); }});
act({id:"training",group:"Settings",ex:"I train after work",kw:["train","gym","exercise","workout"],
  re:[/^(?:i |i'm |i am )?(?:train|training|work out|exercise|go to the gym)\b(?: (?:at|in|during))? ?(.*)$/],take:[["gym",1]],ask:{gym:"When do you train? Before work, at lunch, after work, weekends only, or not at the moment."},
  run:function(v){ return toolRun("set_setting",{key:"training",value:v.gym}); }});
act({id:"brief_time",group:"Settings",ex:"Send my morning brief at 8am",kw:["brief","morning","briefing"],
  re:[/\b(?:morning )?(?:brief|briefing)(?: time)?\b(?: (?:at|to|is|for))? ?(\d.*|noon|midnight)$/,/^(?:set )?(?:my )?(?:morning )?brief(?:ing)?(?: time)?(?: to| at| is)? ?(.*)$/],take:[["time",1]],ask:{time:"What time should the morning brief come? For example 07:30."},
  run:function(v){ return toolRun("set_setting",{key:"brief_time",value:v.time}); }});
act({id:"north_star",group:"Settings",ex:"What matters most is finishing the migration",kw:["matters","north","star","important"],
  re:[/^(?:what matters most(?: to me)?(?: is| right now is)?|my north star is|the one thing that matters most is|north star:?) (.+)$/],take:[["text",1]],ask:{text:"In one line, what matters most?"},
  run:function(v){ return toolRun("set_setting",{key:"north_star",value:v.text}); }});
act({id:"reminders_on",group:"Settings",ex:"Turn reminders on",kw:["reminders","notifications","notify"],
  re:[/^(?:turn on|enable|allow|switch on|start) (?:the )?(?:reminders?|notifications?)$/,/^(?:turn |switch )?reminders? on$/],
  run:function(){
    if(!("Notification" in window)) return "This browser cannot show reminders.";
    if(Notification.permission==="granted"&&$("#btn-remind").getAttribute("aria-pressed")==="true") return "Reminders are already on.";
    $("#btn-remind").click(); return "I opened the reminder question. Your browser will ask you to allow notifications next."; }});
act({id:"reminders_off",group:"Settings",ex:"Turn reminders off",kw:["reminders","notifications"],
  re:[/^(?:turn off|disable|stop|switch off) (?:the )?(?:reminders?|notifications?)$/,/^(?:turn |switch )?reminders? off$/],
  run:function(){
    if($("#btn-remind").getAttribute("aria-pressed")!=="true") return "Reminders are already off.";
    $("#btn-remind").click(); return "Reminders are off."; }});
act({id:"hint_reminders",group:"Settings",ex:"Turn hint reminders off",kw:["hint","reminder"],
  re:[/^(?:turn |switch )?(?:the )?hint (?:reminders?|notifications?) (on|off)$/,/^(?:turn |switch )?(on|off) (?:the )?hint (?:reminders?|notifications?)$/],take:[["onoff",1]],
  run:function(v){ return toolRun("set_setting",{key:"hint_reminders",value:v.onoff?"on":"off"}); }});
act({id:"low_day_question",group:"Settings",ex:"Turn the low-day question off",kw:["low","question","three"],
  re:[/^(?:turn |switch )?(?:the )?low[- ]day (?:question|check[- ]?in) (on|off)$/,/^(?:turn |switch )?(on|off) (?:the )?low[- ]day (?:question|check[- ]?in)$/],take:[["onoff",1]],
  run:function(v){ return toolRun("set_setting",{key:"low_day_question",value:v.onoff?"on":"off"}); }});
act({id:"theme",group:"Settings",ex:"Switch to dark mode",kw:["dark","light","theme","mode"],
  re:[/\b(dark|light|system|auto) (?:mode|theme)\b/,/\bswitch to (dark|light)\b/,/^(?:use|set) (?:the )?(dark|light|system) (?:mode|theme)$/],take:[["theme",1]],ask:{theme:"Dark, light or system?"},
  run:function(v){ return toolRun("set_setting",{key:"theme",value:v.theme}); }});
act({id:"animation",group:"Settings",ex:"Turn the moving background off",kw:["animation","flight","background","motion"],
  re:[/\b(?:turn |switch )?(?:the )?(?:moving background|animation|flight|motion|background) (on|off)\b/,/\b(?:turn|switch) (on|off) (?:the )?(?:moving background|animation|flight|motion)\b/],take:[["onoff",1]],
  run:function(v){ return toolRun("set_setting",{key:"animation",value:v.onoff?"on":"off"}); }});
act({id:"min_set",group:"Minimum day",ex:"My minimum day is a meal, water, a walk",kw:["minimum","floor","anchors"],
  re:[/^(?:set )?(?:my )?minimum day (?:to|as|is|:|=|are) ?(.*)$/,/^my minimum day (.+)$/],take:[["list",1]],ask:{list:"What are your anchors? Up to four small things, separated by commas."},
  run:function(v){ return toolRun("set_minimum_day",{items:v.list}); }});
act({id:"min_show",group:"Minimum day",ex:"Show my minimum day",kw:["minimum","floor"],
  re:[/^(?:show|what is|what's|read) (?:me )?(?:my )?minimum day$/],
  run:function(){
    var f=floorState(); if(!f.items.length) return "You have not set a minimum day. Type, for example: my minimum day is a meal, water, a walk.";
    var on=floorToday();
    return "Your minimum day ("+on.length+" of "+f.items.length+" today):\n"+f.items.map(function(x){ return (on.indexOf(x.id)>=0?"[x] ":"[ ] ")+x.t; }).join("\n"); }});
act({id:"min_tick",group:"Minimum day",ex:"Tick a meal",kw:["tick","untick","minimum"],
  re:[/^(un)?tick (?:off )?(.+)$/,/^(?:minimum day|floor):? (un)?tick (.+)$/],take:[["anchor",2]],ask:{anchor:"Which one of your minimum-day items?"},
  run:function(v,m){ return toolRun("tick_minimum_day",{item:v.anchor,ticked:!(m&&m[1])}); }});
act({id:"checkin_open",group:"Check-in",ex:"Open the weekly check-in",kw:["check","weekly","mood"],
  re:[/^(?:open |start |do )?(?:the |my )?(?:weekly )?check[- ]?in$/,/^(?:i want to |let me )?check in$/],
  run:function(){ weekAsk(); return "I opened the weekly check-in. What you pick stays on this device and I cannot see it."; }});
act({id:"checkin_private",group:"Check-in",ex:"Show my check-ins",kw:["check","mood","energy"],
  re:[/\b(?:my |the )?(?:weekly )?check[- ]?ins?\b.*\b(?:show|read|tell|what|how|compare)\b/,/\b(?:show|read|tell me|what(?:'s| is| are)) (?:my |the )?(?:weekly )?check[- ]?ins?\b/,/\bhow (?:is|was|has) my (?:mood|energy|calm)\b/],
  run:function(){ location.hash="#/planner"; return "Your weekly check-ins are private, so I cannot see or change them. I opened the Planner, where they are listed under Weekly check-in."; }});
act({id:"nav",group:"Go to",ex:"Go to the planner",kw:["go","open","planner","backlog","archive","tags","board"],
  re:[/^(?:go to|open|show me|take me to|switch to|show) (?:the )?(board|planner|tags|backlog|archive)(?: page| view| tab)?$/],take:[["view",1]],
  run:function(v){ location.hash="#/"+v.view; return "Opened the "+v.view+"."; }});
act({id:"search",group:"Go to",ex:"Search for invoices",kw:["search","find","filter"],loose:true,
  re:[/^clear (?:the )?search$/,/^(?:search|find|filter)(?: for)? (.+)$/],take:[["text",1]],fixed:{0:{text:"__clear__"}},ask:{text:"What should I search for?"},
  run:function(v){ return toolRun("search_board",{text:v.text==="__clear__"?"":v.text}); }});
act({id:"backup",group:"Go to",ex:"Back up my data",kw:["backup","export","restore"],
  re:[/\b(?:back ?up|backup|export|restore)\b/],
  run:function(){ $("#btn-backup").click(); return "I opened Backup, restore and reset. Show backup gives you the text to keep; Load pasted backup puts it back."; }});
act({id:"help",group:"Help",ex:"What can you do?",kw:["help"],
  re:[/^(?:help|what can you do|what can i (?:say|ask|do|type)|commands|how do i use you|what do you do|what are you for)(?: for me)?$/],
  run:function(){ return helpText(); }});

function helpText(){
  var groups=[], by={};
  ACT.forEach(function(a){ if(!by[a.group]){ by[a.group]=[]; groups.push(a.group); } by[a.group].push(a.ex); });
  var extra={
    "Today":["What is left today?","Focus on buy milk","I finished buy milk","Clear waiting"],
    "Steps":["Add a task called buy milk to Home","Buy milk to 40 percent","Rename buy milk to buy oat milk","Move buy milk to Garden","Repeat buy milk weekly","Remove buy milk"],
    "Goals":["Add a main task called Garden"],
    "Settings":[],"Minimum day":[],"Check-in":[],"Go to":[],"Help":[]
  };
  return "I can change what you can change by hand, and answer from your own numbers. Type it in plain words. If I need a detail, I will ask.\n\n"+
    groups.map(function(g){ return g.toUpperCase()+"\n"+extra[g||""].concat(by[g]).map(function(x){ return "- "+x; }).join("\n"); }).join("\n\n")+
    "\n\nYour weekly check-ins are private: I cannot see or change them. To stop what I am asking, type cancel.";
}
/* the closest things it can do, for a sentence it could not place */
function suggestFor(s){
  var w=String(s||"").toLowerCase().split(/[^a-z0-9]+/).filter(function(x){ return x.length>2; });
  var scored=ACT.map(function(a){
    var n=0; a.kw.forEach(function(k){ if(w.indexOf(k)>=0||String(s).toLowerCase().indexOf(k)>=0) n++; });
    return {a:a,n:n};
  }).filter(function(x){ return x.n>0; }).sort(function(x,y){ return y.n-x.n; }).slice(0,3);
  if(!scored.length) return "I did not find something to do in that. Type help to see everything I can do.";
  return "I did not find a command in that. The closest things I can do:\n"+scored.map(function(x){ return "- "+x.a.ex; }).join("\n")+"\nType help for everything.";
}
var FLOW=null;
function assistExtract(a,m){
  var vals={}, need=[], fixed=null, idx=-1;
  if(a.fixed){ for(var k in a.fixed){ if(a.re[+k]===m.re) { fixed=a.fixed[k]; } } }
  (a.take||[]).forEach(function(t){
    var slot=t[0], g=m.m[t[1]], v;
    if(fixed && fixed.hasOwnProperty(slot)){ vals[slot]=fixed[slot]; return; }
    if(g===undefined||g===null||String(g).trim()===""){ need.push(slot); return; }
    try{ v=PARSE[slot]((slot==="text"||slot==="list") ? asTyped(String(g).trim()) : String(g).trim()); }
    catch(e){ if(a.loose) v=null; else throw e; }   /* a loose sentence that names no real step is just a sentence */
    if(v===null||v===undefined) need.push(slot); else vals[slot]=v;
  });
  return {vals:vals,need:need};
}
function assistMatch(q,strict){
  for(var i=0;i<ACT.length;i++){
    var a=ACT[i]; if(strict && a.loose) continue;
    for(var j=0;j<a.re.length;j++){
      var m=q.match(a.re[j]);
      if(m){
        var ex=assistExtract(a,{re:a.re[j],m:m});
        /* a free-text sentence that merely contains the trigger words is not a command */
        if(a.loose && ex.need.length) continue;
        return {a:a,m:m,vals:ex.vals,need:ex.need};
      }
    }
  }
  return null;
}
/* these belong to memory, evidence and experiments, which read them first */
var NOT_MINE=/^(?:remember|forget|try|stop experiment|start experiment|what do you know|any evidence|is there (?:any )?(?:evidence|research)|what does the (?:evidence|science|research)|what should i try)\b/;
function assist(q,strict){
  if(NOT_MINE.test(q)) return undefined;
  if(FLOW){
    var f=FLOW;
    if(/^(?:cancel|never ?mind|forget it|stop|no|leave it)$/.test(q)){ FLOW=null; return "Okay, I stopped."; }
    if(assistMatch(q,strict)||/^(?:help|what can you do)$/.test(q)){ FLOW=null; }
    else {
      var slot=f.need[0], val=null;
      try{ val=PARSE[slot]((slot==="text"||slot==="list") ? asTyped(q) : q); }catch(e){ val=null; }
      if(val===null||val===undefined){
        f.tries++;
        if(f.tries>=3){ FLOW=null; return "I could not read that, so I stopped. Type help to see what I can do."; }
        return f.a.ask[slot]+" (Type cancel to stop.)";
      }
      f.vals[slot]=val; f.need.shift();
      if(f.need.length) return f.a.ask[f.need[0]];
      FLOW=null;
      try{ return f.a.run(f.vals,f.m); }catch(e){ return e.message||"I could not do that."; }
    }
  }
  var hit=assistMatch(q,strict);
  if(!hit) return undefined;
  if(hit.need.length){
    var first=hit.need[0];
    if(!hit.a.ask||!hit.a.ask[first]) return undefined;
    FLOW={a:hit.a,m:hit.m,vals:hit.vals,need:hit.need,tries:0};
    return hit.a.ask[first];
  }
  return hit.a.run(hit.vals,hit.m);
}

var BRAIN=[
  /* --- the low-day question ---------------------------------------- */
  [/^(?:ask me why|what is in the way|why am i stuck)$/, function(){
    var b=barState(); b.force=true; save(); renderAll();
    return "What is closest to what is in the way? Type one: can't, afraid, don't know how, don't want to, or rough patch."; }],
  [/^(?:it'?s |i'?m |i )?(can'?t|afraid|don'?t know how|don'?t want to|a rough patch|rough patch)$/, function(m){
    if(!barPending()) return null;
    var w=m[1]; var k=/^can/.test(w)?"cant":/^afraid/.test(w)?"afraid":/know how/.test(w)?"how":/want/.test(w)?"want":"patch";
    var r=barAnswer(k); renderAll(); return r.text; }],
  /* --- the daily hint ------------------------------------------------ */
  [/^(?:give me a hint|any hints?|hint|what should i know today|today'?s hint)$/, function(){ return hintSay(); }],
  [/^hint (?:was )?(helpful|not for me|later)$/, function(m){
    return hintAnswer(m[1]==="not for me"?"no":m[1]) ? (renderAll(),"Noted: "+m[1]+".") : "There is no hint from today to answer."; }],
  [/^(?:stop|pause) hints$/, function(){ if(!state.me) state.me=freshMe(); state.me.hints=false; save(); renderAll(); return "Hints are off."; }],
  [/^(?:start|resume) hints$/, function(){ if(!state.me) state.me=freshMe(); state.me.hints=true; save(); renderAll(); return "Hints are on. At most one a day."; }],
  /* --- memory -------------------------------------------------------- */
  [/^remember (?:that )?(.{3,})$/, function(m){
    var n=memAdd(asTyped(m[1]),"you"); save(); renderAll(); return "Kept: "+n.t+". Type forget "+memKept().length+" to remove it."; }],
  [/^(?:what do you know about me|what have you learned(?: about me)?|show (?:my )?memory|what do you remember)$/, function(){ return memSay(); }],
  [/^(?:forget|delete) (?:note |item |memory )?(\d{1,2})$/, function(m){
    var k=memKept(), t=k[+m[1]-1]; if(!t) return "There is no note "+m[1]+". Type what do you know about me to see them.";
    memDrop(t.id,false); save(); renderAll(); return "Forgotten: "+t.t; }],
  [/^(?:forget everything|erase (?:my )?memory|erase everything)$/, function(){
    if(Date.now()-MEM_ARM>20000){ MEM_ARM=Date.now(); return "That erases everything I have learned or been told, and puts any learned setting back. Type it again within 20 seconds to confirm."; }
    MEM_ARM=0; memErase(); save(); renderAll(); return "Erased. I know nothing about you now except what the board itself holds."; }],
  [/^what have you noticed$/, function(){
    var f=memTick(true); if(f) return "I noticed this, and nothing is changed until you say so: "+f.t+" "+(f.evid||"");
    var p=memProposed(); if(p) return "Already waiting for your answer: "+p.t;
    return "Nothing new that I am sure enough about."; }],
  [/^(?:stop|pause) learning$/, function(){ if(!state.me) state.me=freshMe(); state.me.learn=false; save(); renderAll(); return "Learning is off. What you kept stays, and nothing new is proposed."; }],
  [/^(?:start|resume) learning$/, function(){ if(!state.me) state.me=freshMe(); state.me.learn=true; save(); renderAll(); return "Learning is on."; }],
  /* --- experiments --------------------------------------------------- */
  [/^(?:try|start|run|begin) (?:the )?(?:experiment )?(e-[a-z0-9]+-\d\d)$/, function(m){ return expStart(m[1].toUpperCase()); }],
  [/^(?:stop|end|cancel|drop) (?:the |my )?experiment$/, function(){ return expStopMsg(); }],
  [/^(?:how(?:'s| is| am i doing on)|what(?:'s| is)) (?:the |my )?experiment(?: going)?$|^(?:experiment|experiment status)$/, function(){ return expStatusMsg(); }],
  /* --- what the library says, answered with no model and no network --- */
  [/\bwhat (?:does|do) (?:the )?(?:evidence|research|science|studies) (?:say|show)(?: about| on| for)? ?(.*)$/, function(m){ return libSay(m[1]); }],
  [/\b(?:is there|any|got any) (?:evidence|research|science)(?: for| on| about)? ?(.*)$/, function(m){ return libSay(m[1]); }],
  [/^(?:what should i try|what can i try|any tips|any advice|give me a tip|give me a hint)\b/, function(){ return libSay(""); }],
  /* --- what the history says, answered with no model and no network --- */
  [/\b(?:most productive|work best|best time|when do i (?:finish|get|do))\b/, function(){ return evSayWhen(); }],
  [/\bwhat do i (?:skip|dodge|avoid)\b|\bwhy do i skip\b|\bwhat (?:am i|do i keep) skipping\b/, function(){ return evSaySkips(); }],
  [/\b(?:am i|is it) (?:getting )?(?:better|worse|improving)\b|\bthis week (?:against|vs|versus|compared)\b/, function(){ return evSayWeek(); }],
  /* --- progress --------------------------------------------------- */
  [/^(?:set |put |move |bump |take )?(.+?) (?:to |at |up to |down to )?(\d{1,3}|[a-z\- ]{3,12}) ?(?:%|percent)$/,
   function(m){ var v=numOf(m[2]); if(isNaN(v)) return null;
     return toolRun("set_progress",{subtask:fuzSub(m[1]).name,percent:v}); }],
  /* --- done ------------------------------------------------------- */
  [/^(?:i(?:'m| am)? )?(?:done|finished|completed|complete) (?:with |on )?(.+)$/,
   function(m){ var sb=fuzSub(m[1]);
     toolRun("set_status",{subtask:sb.name,status:"done"});
     return toolRun("mark_done_today",{subtask:sb.name}); }],
  [/^(?:mark |log )(.+?) (?:as )?(?:done|finished|complete)$/,
   function(m){ var sb=fuzSub(m[1]);
     toolRun("set_status",{subtask:sb.name,status:"done"});
     return toolRun("mark_done_today",{subtask:sb.name}); }],
  /* --- status ----------------------------------------------------- */
  [/^(?:i(?:'m| am)? )?(?:start(?:ing|ed)?|begin|beginning|working on|i work on) (.+)$/,
   function(m){ return toolRun("set_status",{subtask:fuzSub(m[1]).name,status:"doing"}); }],
  [/^(?:i(?:'m| am)? )?(?:stuck on|blocked on|block) (.+)$/,
   function(m){ return toolRun("set_status",{subtask:fuzSub(m[1]).name,status:"blocked"}); }],
  [/^(?:unblock|not stuck on) (.+)$/,
   function(m){ return toolRun("set_status",{subtask:fuzSub(m[1]).name,status:"doing"}); }],
  /* --- adding ----------------------------------------------------- */
  [/^(?:add|create|new|make) (?:a )?(?:new )?(?:main task|project|group) (?:called |named )?(.+)$/,
   function(m){ return toolRun("add_main_task",{name:asTyped(m[1])}); }],
  [/^(?:add|create|new|make) (?:a )?(?:new )?(?:sub ?task|task|item)? ?(?:called |named )?(.+?) (?:to|under|in|for) (.+)$/,
   function(m){ var nm=asTyped(m[1]), out=toolRun("add_subtask",{main_task:fuzGroup(m[2]).name,name:nm});
     LASTSUB=nm; return out; }],
  /* --- editing ---------------------------------------------------- */
  [/^rename (.+?) to (.+)$/,
   function(m){ var nm=asTyped(m[2]), out=toolRun("rename_subtask",{subtask:fuzSub(m[1]).name,new_name:nm});
     LASTSUB=nm; return out; }],
  [/^move (.+?) (?:to|under|into) (.+)$/,
   function(m){ return toolRun("move_subtask",{subtask:fuzSub(m[1]).name,to_main_task:fuzGroup(m[2]).name}); }],
  [/^(?:remove|delete|drop|scrap|get rid of) (?:the )?(?:sub ?task |task )?(.+)$/,
   function(m){ return toolRun("remove_subtask",{subtask:fuzSub(m[1]).name}); }],
  /* --- the docks -------------------------------------------------- */
  /* "add a task called X", with no main task said: it goes under the one
     that is open, and the answer says where it landed.                    */
  /* a bare "task called X", with the verb lost or never said */
  [/^(?:subtask|task|item)(?: called| named)? (.+)$/,
   function(m){
     var g=gById(state.sel)||state.groups[0];
     if(!g) throw new Error("There is no main task to put it under yet.");
     var nm=asTyped(m[1]), out=toolRun("add_subtask",{main_task:g.name,name:nm});
     LASTSUB=nm;
     return out+" Type \u201cmove it to\u201d and a main task if that is the wrong place.";
   }],
  [/^(?:add|create|make|new|start) (?:a |an )?(?:new )?(?:subtask|task|item|one)(?: called| named)? (.+)$/,
   function(m){
     var g=gById(state.sel)||state.groups[0];
     if(!g) throw new Error("There is no main task to put it under yet.");
     var nm=asTyped(m[1]), out=toolRun("add_subtask",{main_task:g.name,name:nm});
     LASTSUB=nm;
     return out+" Type \u201cmove it to\u201d and a main task if that is the wrong place.";
   }],
  [/^(?:i need to|i have to|i must|remind me to) (.+)$/,
   function(m){
     var g=gById(state.sel)||state.groups[0];
     if(!g) throw new Error("There is no main task to put it under yet.");
     var nm=asTyped(m[1]), out=toolRun("add_subtask",{main_task:g.name,name:nm});
     LASTSUB=nm; return out;
   }],
  /* let the board choose */
  [/^(?:what should i do(?: today| now)?|pick (?:my |one |a )?task|choose(?: for me| one)?|decide(?: for me)?|give me one|one task)$/,
   function(){
     if(state.oftad.length)
       return "Today is already set: "+state.oftad.map(function(c){ return cardName(c); }).join(", ")+".";
     var p=pickToday();
     if(!p) return "Nothing left to pick. Everything is done, blocked or already taken.";
     takePick(p.s.id);
     return p.s.name+". "+p.why;
   }],
  [/^(?:not that|something else|another one|skip it|no, ?something else)$/,
   function(){
     var p=pickToday();
     if(!p) return "There is nothing else to offer.";
     skipPick(p.s.id);
     var n=pickToday();
     return n ? (n.s.name+". "+n.why) : "That was the last one I had.";
   }],
  [/^(?:focus on|today is|my task today is|one task a day is|the one task is) (.+)$/,
   function(m){ return toolRun("focus_today",{subtask:fuzSub(m[1]).name}); }],
  [/^(?:add|put|queue|plan) (.+?) (?:in|into|on|to) (?:the |today's |my )?plan$/,
   function(m){ return toolRun("plan_today",{subtask:fuzSub(m[1]).name}); }],
  [/^(?:add|put|make) (.+?) (?:in|into|as) (?:the |my )?(?:one task a day|task of the day|today's task)$/,
   function(m){ return toolRun("focus_today",{subtask:fuzSub(m[1]).name}); }],
  [/^(?:plan|queue|line up|add to (?:the |today's )?plan) (.+)$/,
   function(m){ return toolRun("plan_today",{subtask:fuzSub(m[1]).name}); }],
  [/^(?:clear|empty|wipe) (?:the |today's )?(focus|one task a day|plan|done|done today)$/,
   function(m){ var d=m[1]; d=(d.indexOf("one task")>=0||d==="focus")?"focus":(d.indexOf("done")>=0?"done":"plan");
     return toolRun("clear_dock",{dock:d}); }],
  /* --- repeating -------------------------------------------------- */
  [/^(?:repeat |make )?(.+?) (?:repeats? )?(?:every |each )?(day|daily|weekday|weekdays|week|weekly|two weeks|biweekly|fortnight|month|monthly|never)$/,
   function(m){ var e=EVERY[m[2]]; if(!e) return null;
     /* "how was my week" ends like "bronze database weekly". With a model to talk to, only a sentence that says so counts. */
     if(STRICT && !/\b(repeats?|make|every|each|daily|weekly|monthly|biweekly|fortnight|weekdays?)\b/.test(m[0])) return null;
     return toolRun("set_recurrence",{subtask:fuzSub(m[1]).name,every:e==="none"?"none":e}); }],
  [/^(?:stop|don't|do not) repeat(?:ing)? (.+)$/,
   function(m){ return toolRun("set_recurrence",{subtask:fuzSub(m[1]).name,every:"none"}); }],
  /* --- opening ---------------------------------------------------- */
  [/^(?:open|show me|show|go to) (?:the )?(.+)$/,
   function(m){ return toolRun("open_main_task",{main_task:fuzGroup(m[1]).name}); }],
  /* --- questions -------------------------------------------------- */
  [/^(?:what(?:'s| is| are)? ?(?:left|on|next|my plan)?(?: for)? today|today|what do i do today|what now|what(?:'s| is) next)$/,
   function(){
     var f=nameList(state.oftad), p=nameList(state.plan.filter(function(c){ return !c.done; }));
     if(!f&&!p) return "Nothing is set for today. Say: focus on, then a task name.";
     return ((f?"Today: "+f+". ":"Nothing is in Today yet. ")+(p?"Waiting: "+p+".":"")).trim();
   }],
  [/^(?:what did i do today|what(?:'s| is|'ve i| have i) done(?: today)?|done today)$/,
   function(){ var d=nameList(state.done);
     return d?"Done today: "+d+".":"Nothing logged as done today yet."; }],
  [/^(?:what needs a look|what(?:'s| is) stuck|what(?:'s| is) blocked|what am i behind on|where am i behind)$/,
   function(){ var al=alerts();
     if(!al.length) return "Nothing needs a look. Everything moved recently.";
     return al.slice(0,5).map(function(a){ return a.t+" ("+a.kind+")"; }).join("; ")+"."; }],
  [/^(?:how am i doing|status|progress|overall|where am i)$/,
   function(){
     var g=state.groups.filter(function(x){ return x.subs.length; })
            .sort(function(a,b){ return groupPct(b)-groupPct(a); });
     if(!g.length) return "The board is empty.";
     var top=g[0], low=g[g.length-1];
     return "Overall "+overall().toFixed(0)+"%. Furthest on: "+top.name+" at "+groupPct(top)+
       "%. Furthest behind: "+low.name+" at "+groupPct(low)+"%.";
   }],
  [/^(?:how (?:far |much )?(?:is|along is|done is) )(.+)$/,
   function(m){ var sb=fuzSub(m[1]); return sb.name+" is "+sb.pct+"%, "+statusOf(sb).label.toLowerCase()+"."; }],
  [/^(?:help|what can you do|what can i say|commands)$/,
   function(){ return "Say: add a task called weekly review. Bronze database to 40 percent. "+
     "Done with it. Focus on running. Move it to Alchemy. Repeat it daily. "+
     "What is left today. What needs a look. A new task with no main task named goes under the one that is open."; }]
];

/* one hook, so the command engine can be exercised by a test */
try{ window.__board={brain:function(t){ return localBrain(t); },ask:function(t){ return botAsk(t); }, openSheet:function(){ botOpen(true); }, dose:function(){ return doseNow(); },
  stats:evStats, compare:evCompare, trend:evTrend, recent:evRecent,
  lib:libFind, say:libSay, check:replyCheck, evidence:function(){ return EVIDENCE; },
  toolRun:toolRun, modelTools:function(){ return recordTools(botTools()); }, pend:function(){ return PEND; }, remind:checkRemind, pastDayEnd:pastDayEnd, askUser:askUser,
  push:{state:function(){ return PUSH; }, digest:digestWrite, sync:pushSync, brief:briefText},
  notice:{poll:noticePoll, read:noticeRead, write:noticeWrite, blocks:noticeBlocks},
  when:{set:whenSet, map:whenMap, tidy:whenTidy},
  week:{set:weekSet, data:weekData, due:weekDue, note:weekNote, clear:weekClear, key:weekKeyOf},
  floor:{set:floorSet, toggle:floorToggle, state:floorState, today:floorToday, days:floorDays, met:floorMet}, est:{set:estSet, state:estState, answer:estAnswer, ratio:estRatio, line:estCompareLine, tidy:estTidy}, rules:BOT_RULES, distress:function(t){ return DISTRESS.test(t); },
  bar:{streak:barStreak, pending:barPending, answer:barAnswer, status:barStatus, touch:barTouch},
  hint:{cands:hintCands, choose:hintChoose, stats:hintStats, tick:hintTick, say:hintSay, answer:hintAnswer},
  mem:{list:memList, kept:memKept, tick:memTick, find:memFindings, say:memSay, ok:memOk, snap:botSnapshot, dose:doseNow},
  exp:{start:expStart, stop:expStopMsg, status:expStatus, test:expTest, say:expSay, tick:expTick, result:expResult}}; }catch(e){}
/* When no pattern fits, read the sentence for what it is plainly asking.
   Speech does not arrive in the shape a pattern expects, so this reads the
   verb and takes whatever is left as the name.                            */
var VERBS=/\b(please|kindly|now|the|a|an|my|to|for|on|in|into|at|it|that|this|and|of|up|down|set|put|mark|log|make|do|go|task|subtask|item|called|named|new)\b/g;
function rest(s,drop){
  return s.replace(drop," ").replace(VERBS," ").replace(/\s+/g," ").trim();
}
function guessIntent(s){
  var pc=s.match(/(\d{1,3}|[a-z\-]+)\s*(?:%|percent)/);
  if(pc){
    var v=numOf(pc[1]);
    if(!isNaN(v)){
      var nm=rest(s,new RegExp(pc[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"));
      if(nm) return toolRun("set_progress",{subtask:fuzSub(nm).name,percent:v});
    }
  }
  if(/\b(done|finished|complete|completed)\b/.test(s)){
    var n1=rest(s,/\b(i'?m|i am|is|are|was|done|finished|complete|completed|with|today)\b/g);
    var sb=fuzSub(n1||"it");
    toolRun("set_status",{subtask:sb.name,status:"done"});
    return toolRun("mark_done_today",{subtask:sb.name});
  }
  if(/\b(remove|delete|drop|scrap|bin)\b/.test(s)){
    var n2=rest(s,/\b(remove|delete|drop|scrap|bin|get|rid)\b/g);
    if(n2) return toolRun("remove_subtask",{subtask:fuzSub(n2).name});
  }
  if(/\b(stuck|blocked|blocking)\b/.test(s)){
    var n3=rest(s,/\b(i'?m|i am|stuck|blocked|blocking|but|still)\b/g);
    if(n3) return toolRun("set_status",{subtask:fuzSub(n3).name,status:"blocked"});
  }
  if(/\b(focus|today'?s? one|only thing)\b/.test(s)){
    var n4=rest(s,/\b(focus|only|thing|today|today'?s|one)\b/g);
    if(n4) return toolRun("focus_today",{subtask:fuzSub(n4).name});
  }
  if(/\b(plan|queue|line)\b/.test(s)){
    var n5=rest(s,/\b(plan|queue|line|today|today'?s)\b/g);
    if(n5) return toolRun("plan_today",{subtask:fuzSub(n5).name});
  }
  if(/\b(start|starting|begin|working|work)\b/.test(s)){
    var n6=rest(s,/\b(i'?m|i am|start|starting|began|begin|beginning|working|work)\b/g);
    if(n6) return toolRun("set_status",{subtask:fuzSub(n6).name,status:"doing"});
  }
  /* an add is the last read, because almost any sentence can name a new task */
  if(/\b(add|create|new|make|start|need|want)\b/.test(s)){
    var n7=rest(s,/\b(add|create|created|make|need|want|start|would|like|i'?d|i)\b/g);
    if(n7){
      var g=gById(state.sel)||state.groups[0];
      if(!g) throw new Error("There is no main task to put it under yet.");
      var nm2=asTyped(n7), out=toolRun("add_subtask",{main_task:g.name,name:nm2});
      LASTSUB=nm2;
      return out+" Type \u201cmove it to\u201d and a main task if that is the wrong place.";
    }
  }
  return null;
}
/* guessIntent reads almost any sentence as a command: "I am stuck, what now?"
   once blocked a task at random, and "I need help with my week" added one.
   That is the right trade when nothing else can read the sentence. When a
   model is there to talk, only the exact patterns act and everything else
   is a conversation, so strict leaves the guesser out.                    */
var STRICT=false;
function localBrain(said,strict){
  SPOKE=spoken(said);
  var s=SPOKE.q;
  if(!s) return null;
  STRICT=!!strict;
  try{
    var asked=assist(s,!!strict);
    if(asked!==undefined) return asked;
    for(var i=0;i<BRAIN.length;i++){
      var m=s.match(BRAIN[i][0]);
      if(!m) continue;
      var out=BRAIN[i][1](m);
      if(out!==null && out!==undefined) return out;
    }
  }catch(e){
    /* a pattern that read a sentence as a command and then found no such task was probably a sentence, not a command */
    if(strict && /^No (?:sub|main )?task matches/.test((e&&e.message)||"")) return null;
    throw e;
  }finally{ STRICT=false; }
  return strict ? null : guessIntent(s);
}
/* a name that matched nothing gets the closest real names, so the next try works */
function nearMiss(msg){
  var m=msg.match(/^No (sub|main )?task matches "(.*)"\.$/);
  if(!m) return msg;
  var q=m[2], pool=(m[1]==="main "?state.groups:allSubs()).map(function(x){ return {n:x.name,s:overlap(q,x.name)}; })
    .filter(function(x){ return x.s>0; }).sort(function(a,b){ return b.s-a.s; }).slice(0,3);
  return msg+(pool.length?" Did you mean: "+pool.map(function(x){ return x.n; }).join(" | ")+"?":" Type help to see what I can do.");
}
function modelThere(){ return !!botSample || (proxyReady() && !!(acct&&acct.access_token)); }

function botBubble(cls,text){
  var log=$("#bot-log"), d=document.createElement("div");
  d.className="bot-msg "+cls; d.textContent=text;
  log.appendChild(d); log.scrollTop=log.scrollHeight;
  return d;
}
function botRender(){
  var log=$("#bot-log"); log.innerHTML=""; pendRender();
  if(!botTurns.length){
    var e=document.createElement("p"); e.className="bot-empty";
    e.textContent="Type what you want to change, or ask a question. I can change goals, steps, Today, Waiting, your hours and your settings. Type help to see everything."+
      ((botSample||!proxyReady())?"":" Questions it cannot answer itself go to a hosted model, which sees your question and only the numbers it asks for.");
    log.appendChild(e); return;
  }
  botTurns.forEach(function(t){ botBubble(t.role==="user"?"you":"bot",t.content); });
  log.scrollTop=log.scrollHeight;
}
