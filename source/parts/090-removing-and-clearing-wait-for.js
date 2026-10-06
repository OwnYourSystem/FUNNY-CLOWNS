/* ---------------- removing and clearing wait for a button ----------------
   The tutor can ask to remove a step or clear a dock, but it cannot do either.
   It stages the request; the chat shows exactly what would happen with two
   buttons; only the person pressing the first one does it. What you type
   yourself ("remove X") is your own word and runs at once. A spoken sentence is
   staged too, because speech is misheard and the board matches names loosely. */
var PEND=null, PEND_MS=120000, PEND_TOOLS={remove_subtask:1, clear_dock:1, remove_main_task:1};
var DOCK_NAME={oftad:"Today", plan:"Waiting", done:"Done today"};
function pendStage(t,a){
  var label, verb, args;
  if(t.name==="remove_subtask"){
    var sb=botFindSub(a.subtask);
    label="Remove \u201c"+sb.name+"\u201d for good"; verb="Remove it"; args={subtask:sb.name};
  } else if(t.name==="remove_main_task"){
    var rg=botFindGroup(a.main_task), rn=rg.subs.length;
    label="Remove goal \u201c"+rg.name+"\u201d and its "+rn+" step"+(rn===1?"":"s")+" for good"; verb="Remove it"; args={main_task:rg.name};
  } else {
    var d=String(a.dock||"").toLowerCase(), z=d==="focus"?"oftad":d;
    if(["oftad","plan","done"].indexOf(z)<0) throw new Error("Dock must be focus, plan or done.");
    var n=(state[z]||[]).length;
    if(!n) return "That dock is already empty.";
    label="Clear "+n+" card"+(n===1?"":"s")+" from "+DOCK_NAME[z]; verb="Clear it"; args={dock:d};
  }
  PEND={name:t.name, args:args, label:label, verb:verb, at:Date.now()};
  pendRender();
  return "Ready: "+label+". Nothing has changed. The person has to press the button in the chat to confirm. Tell them it is waiting for them, and do not say it is done.";
}
function pendYes(){
  var p=PEND; PEND=null;
  if(!p) { pendRender(); return; }
  var msg;
  if(Date.now()-p.at>PEND_MS) msg="That was a while ago, so I did not do it. Ask again if you still want it.";
  else { try{ msg=toolRun(p.name,p.args); }catch(er){ msg=(er&&er.message)||"I could not do that."; } }
  var last=botTurns[botTurns.length-1];
  if(last && last.role==="assistant") last.content+="\n"+msg; else botTurns.push({role:"assistant",content:msg});
  pendRender(); botRender();
}
function pendNo(){ PEND=null; pendRender(); }
var TURN_OUT="", TURN_HIST=false;
/* every tool result of one question, kept so the reply can be checked against it */
function recordTools(tools){
  return tools.map(function(t){
    var c={}; Object.keys(t).forEach(function(k){ c[k]=t[k]; });
    c.execute=function(a){
      /* the tutor can ask for these, never do them: the person presses a button */
      var out=PEND_TOOLS[t.name] ? pendStage(t,a||{}) : t.execute(a);
      TURN_OUT+=" "+String(out==null?"":out);
      if(/^(stats|compare|trend|events|find_evidence|experiment_status|get_hint|barrier_status)$/.test(t.name)) TURN_HIST=true;
      return out;
    };
    return c;
  });
}


