/* ---------------- state ---------------- */
/* Everything below runs before the first boot, because boot migrates the
   saved board against these lists and a var assigned later is undefined
   when it gets there. */
var PRIO_W={high:3, mid:2, low:1};
/* A subtask's priority ranks it against its own siblings and nothing else.
   Two goals are compared on the goal's deadline and the goal's priority; a
   subtask marked high inside a quiet goal must never drag that goal past an
   urgent one. So this weight is only ever read after a goal has won.    */
var SUB_W={high:66, mid:44, low:22};
/* which page is showing. Declared here because the first render reads it. */
var curView="board";
var WHERES=[
  ["any",  "Anywhere",        "nothing stops it"],
  ["desk", "At a screen",     "a laptop and quiet"],
  ["work", "At work",         "only on the clock, in the office"],
  ["home", "At home",         "only off the clock"],
  ["body", "Training",        "a gym, a bike, a road, and energy"],
  ["out",  "Out and about",   "shops, offices, other people's hours"]
];
function whereLabel(w){
  for(var i=0;i<WHERES.length;i++) if(WHERES[i][0]===w) return WHERES[i][1];
  return "Anywhere";
}
var DAYS_SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var SHARP=[["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"]];
/* The banner already runs. Once it is running, the cheapest thing it can
   also carry is what is happening outside the board, so the same strip
   does both. It is off until someone asks for it in the interview.     */
var FEEDS=[["tech","Tech"],["finance","Finance"],["football","Football"],
           ["world","World"],["science","Science"],["denmark","Denmark"]];
function feedLabel(k){
  for(var i=0;i<FEEDS.length;i++) if(FEEDS[i][0]===k) return FEEDS[i][1];
  return "News";
}
var GYMWIN=[["morning","Before work"],["lunch","At lunch"],["evening","After work"],
            ["weekend","Weekends only"],["none","Not at the moment"]];
/* A first guess, so nobody has to label fifteen goals before the board is
   useful. Every one of these is editable, and the interview shows them all
   at the end and asks you to correct it. */
function guessWhere(name){
  var n=String(name||"").toLowerCase();
  if(/shred|airbike|air bike|run|gym|workout|train|lift|cardio|swim|walk|yoga|stretch/.test(n)) return "body";
  if(/shop|buy|bank|doctor|dentist|post|collect|pick up|errand|appointment|visit/.test(n)) return "out";
  if(/sap|client|service desk|stakeholder|colleague|team|meeting|onboard|migration|datasphere|power platform|azure|databricks|adf/.test(n)) return "work";
  if(/read|book|chapter|course|write|study|learn|app|code|build|design|tracker|certificate/.test(n)) return "desk";
  return "any";
}
/* Three places used to build a goal by hand and they drifted apart: the
   assistant's was missing prio, so the next render threw on prio.toUpperCase
   and the whole board went blank behind a caught error. One maker now. */
function newGoal(name){
  var n=String(name||"").trim();
  return {id:uid("g"), name:n, subs:[], due:"", prio:"mid", tags:[], where:guessWhere(n)};
}
var state=boot();

function blankState(){
  return {v:2,seedRev:0,day:todayStr(),groups:[],subs:{},oftad:[],plan:[],done:[],
          hist:[],dayLog:[],log:[],sel:"",notified:"",ue:{},killed:[],layout:{},free:false,
          archive:[],tagFilter:[],backlog:[]};
}
/* A main task is a Goal. A goal is a thing with an end: a date it is wanted
   by and a weight against everything else. Boards written before this get
   the fields added and nothing taken away.                              */
var PRIOS=[["high","High"],["mid","Middle"],["low","Low"]];
function toggleTag(t){
  var i=state.tagFilter.indexOf(t);
  if(i>=0) state.tagFilter.splice(i,1); else state.tagFilter.push(t);
  save(); renderAll();
}
function allTags(){
  var seen={};
  state.groups.forEach(function(g){ g.tags.forEach(function(t){ seen[t]=(seen[t]||0)+1; }); });
  return Object.keys(seen).sort(function(a,b){ return seen[b]-seen[a]||a.localeCompare(b); })
    .map(function(t){ return {t:t,n:seen[t]}; });
}
