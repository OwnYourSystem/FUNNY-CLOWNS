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
/* a goal is work or it is not (2026-10-20): rule 5 is the only place rule */
var WHERES=[
  ["any",  "Not work"],
  ["work", "Work"]
];
function whereLabel(w){ return w==="work"?"Work":"Not work"; }
var DAYS_SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
/* The banner already runs. Once it is running, the cheapest thing it can
   also carry is what is happening outside the board, so the same strip
   does both. It is off until someone asks for it in the interview.     */
/* A first guess, so nobody has to label fifteen goals before the board is
   useful. Every one of these is editable, and the interview shows them all
   at the end and asks you to correct it. */
function guessWhere(name){
  var n=String(name||"").toLowerCase();
  return /sap|client|service desk|stakeholder|colleague|team|meeting|onboard|migration|datasphere|power platform|azure|databricks|adf|work|office/.test(n) ? "work" : "any";
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
