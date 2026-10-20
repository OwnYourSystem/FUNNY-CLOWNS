/* What the tutor may not say (2026-10-20, kept when the evidence library
   went): a clinical word, a claim about what research shows (the board holds
   no research to cite), or, when it answered from history, a number no tool
   returned. It cannot tell whether a true sentence is wise. It can tell
   whether a claim came from somewhere.                                  */
var CHK_BAN=/\b(diagnos\w*|disorders?|depress(?:ed|ion|ive)|adhd|bipolar|ptsd|medication\w*|prescri\w*|psychiatr\w*|mental illness)\b/i;
var CHK_SAYS=/\b(studies|research|science|scientists|meta-?analys\w*|clinical\w*|proven|evidence)\b[^.!?]*\b(show|shows|showed|found|find|prove|proves|proved|suggest|suggests|indicate|indicates|confirm\w*)\b|\baccording to\b/i;
function chkNums(text){
  return (String(text||"").match(/\d+(?:[.,]\d+)?/g)||[]).map(function(n){ return n.replace(",","."); });
}
function replyCheck(text,ctx){
  var t=String(text||""), why=[];
  if(CHK_BAN.test(t)) why.push("it used a clinical word, and I do not diagnose");
  if(CHK_SAYS.test(t)) why.push("it said what research shows, and the board holds no research to cite");
  if(ctx && ctx.history){
    var have={}, src=String(ctx.src||"");
    (src.match(/\d+(?:[.,]\d+)?/g)||[]).forEach(function(n){
      n=n.replace(",","."); have[n]=1;
      var f=parseFloat(n); if(f>0 && f<=1) have[String(Math.round(f*100))]=1;   /* a share of 0.72 may be said as 72% */
    });
    chkNums(t).forEach(function(n){ if(!have[n] && !have[String(parseFloat(n))]) why.push("it quoted "+n+", which no tool returned"); });
  }
  return {ok:!why.length, why:why.join("; ")};
}
/* ---------------- the tutor where there is no Claude in the page ----------------
   The artifact can ask Claude directly. Anywhere else the board asks its own
   /api/tutor, which holds the key, the rules and the model, and refuses any
   tool that is not one of the board's own. The tools themselves run here, on
   this device, on this board. What leaves is the question and the results the
   model asked for. The transcript is kept exactly as the API gave it and only
   ever appended to: the model's reasoning blocks are signed against what came
   before them, so editing history would throw them away.                  */
/* PARKED. The hosted tutor is built and tested but switched off: the model
   that should sit behind it has not been chosen yet (it may be a tuned one),
   and until it is, nothing in the page may call it or change how a sentence
   is read. Turning it on is this one flag, an ANTHROPIC_API_KEY on the
   function, and a decision about the model in api/tutor.js.               */
var TUTOR_PROXY=false;
var TUTOR_URL="/api/tutor", WIRE_MAX=40, TUTOR_STEPS=8;
var wire=[];
function wireClear(){ wire=[]; }
function wireStartsTurn(m){
  if(m.role!=="user") return false;
  if(typeof m.content==="string") return true;
  for(var i=0;i<m.content.length;i++) if(m.content[i].type==="tool_result") return false;
  return true;
}
/* a long chat is cut from the front, at the start of a turn, never in the middle of a tool round */
function wireTrim(){
  if(wire.length<=WIRE_MAX) return;
  var i=wire.length-WIRE_MAX;
  while(i<wire.length && !wireStartsTurn(wire[i])) i++;
  wire=wire.slice(i);
}
function proxyReady(){ return TUTOR_PROXY && (location.protocol==="https:" || location.hostname==="localhost" || location.hostname==="127.0.0.1"); }
function coded(code,msg){ var e=new Error(msg||code); e.code=code; return e; }
function tutorPost(payload,signal){
  function go(){
    var h={"content-type":"application/json"};
    if(acct&&acct.access_token) h.authorization="Bearer "+acct.access_token;
    return fetch(TUTOR_URL,{method:"POST",headers:h,body:JSON.stringify(payload),signal:signal})
      .then(function(r){
        return r.text().then(function(t){
          var d=null; try{ d=t?JSON.parse(t):null; }catch(e){ d=null; }
          if(!r.ok){
            var er=coded((d&&d.error&&d.error.code)||("http_"+r.status),(d&&d.error&&d.error.message)||("http "+r.status));
            er.status=r.status; throw er;
          }
          return d;
        });
      });
  }
  return go().catch(function(e){
    if(e&&e.name==="AbortError") throw coded("cancelled");
    if(e&&e.status===401 && acct && acct.refresh_token) return acctRefresh().then(go);
    if(e&&!e.code) throw coded("offline");
    throw e;
  });
}
function toolExec(tools,b){
  for(var i=0;i<tools.length;i++) if(tools[i].name===b.name) return tools[i].execute(b.input||{});
  throw new Error("No such tool.");
}
async function proxyChat(said,opts){
  if(!acct||!acct.access_token) throw coded("auth_required");
  var tools=opts.tools||[];
  var defs=tools.map(function(t){
    return {name:t.name, description:t.description, input_schema:t.inputSchema||{type:"object",properties:{}}};
  });
  var start=wire.length, c=nowCtx(), dz=doseNow();
  wire.push({role:"user", content:"["+c.day+" "+todayStr()+" "+pad2(c.d.getHours())+":"+pad2(c.d.getMinutes())+
    "; today's dose: "+dz.band+"] "+said});
  try{
    for(var step=0; step<TUTOR_STEPS; step++){
      var d=await tutorPost({messages:wire,tools:defs},opts.signal);
      wire.push({role:"assistant",content:d.content});
      if(d.stop_reason==="tool_use"){
        var results=[];
        d.content.forEach(function(b){
          if(b.type!=="tool_use") return;
          var out, bad=false;
          try{ out=toolExec(tools,b); }catch(e){ out=(e&&e.message)||"That did not work."; bad=true; }
          results.push({type:"tool_result",tool_use_id:b.id,content:String(out==null?"":out),is_error:bad});
        });
        wire.push({role:"user",content:results});
        continue;
      }
      if(d.stop_reason==="refusal") throw coded("refusal");
      var text=d.content.filter(function(b){ return b.type==="text"; })
        .map(function(b){ return b.text; }).join("").trim();
      if(d.stop_reason==="max_tokens") text=(text?text+" ":"")+"(cut short)";
      wireTrim();
      return {text:text||"Done."};
    }
    throw coded("too_many_steps");
  }catch(e){
    wire.length=start;       /* a turn that failed leaves no trace in the transcript */
    throw e;
  }
}

var BOT_ERR={
  auth_required:"Sign in to talk to the tutor. The board works without it.",
  not_configured:"The tutor is not switched on for this site yet.",
  offline:"No connection. The board's own commands still work.",
  refusal:"The tutor declined that one.",
  too_many_steps:"That took too many steps. Ask again, more simply.",
  too_large:"That conversation grew too long. Clear it and start again.",
  server_misconfigured:"The tutor could not answer just now. Try again in a minute.",
  server_error:"The tutor could not answer just now. Try again in a minute.",
  upstream_unreachable:"The tutor could not answer just now. Try again in a minute.",
  upstream_busy:"The tutor is busy. Try again in a minute.",
  upstream_rejected:"The tutor could not answer just now. Try again in a minute.",
  upstream_error:"The tutor could not answer just now. Try again in a minute.",
  not_granted:"You declined, so the assistant cannot run on this page. Reload to be asked again.",
  rate_limited:"Too many questions at once. Wait a moment and ask again.",
  prompt_too_large:"That conversation grew too long. Clear it and start again.",
  cancelled:"",
  empty_completion:"Nothing came back. Ask again.",
  invalid_request:"The assistant refused that request."
};
/* If someone says they may hurt themselves, no model, no tool and no command
   reads that sentence first. The board once answered "I want to ..." by adding
   a task, and a prompt alone cannot promise what a model will do. So a short
   list of plain phrases is caught here and answered with one fixed, calm
   message. It is a net with large holes, not a detector: anything subtler goes
   to the model, whose rules carry the same instruction. Phrases about an
   injury or a bad week ("killing it", "this is killing my week", "hurt my
   back") are deliberately not in it. Nothing from that exchange is sent
   anywhere, logged, or kept beyond the chat on this screen.             */
var DISTRESS=/\b(?:kill(?:ing)? myself|end(?:ing)? my (?:own )?life|take my own life|suicid\w*|want(?:ed)? to die|wanna die|better off dead|no reason to live|self[- ]?harm\w*|(?:end|ending) it all|can'?t go on (?:like this|anymore|any more|any longer)|(?:want|going|plan|planning|thinking|thought|feel like)\b[^.!?]{0,20}\b(?:hurt|harm|cut|kill)(?:ing)? myself(?!\s+(?:some\s+)?(?:slack|a\s+break|off)))\b/i;   /* "cut myself some slack" is the opposite of this */
var SAFE_REPLY="I am sorry it feels this heavy. I cannot help with that here, and you should not have to carry it alone: please talk to a doctor, a crisis line or someone you trust. If you might act on it, call your local emergency number now (for example 112 in the EU or 911 in the US). I will stop the coaching for now.";
async function botAsk(text,opts){
  if(botBusy) return;
  var said=String(text||"").trim();
  if(!said) return;
  PEND=null; pendRender();                         /* a new sentence replaces a waiting question */
  micStop();
  $("#bot-input").value="";
  /* the board answers its own commands first: no model, no network, no wait */
  var reply=null, care=DISTRESS.test(said);
  if(care) reply=SAFE_REPLY;
  else {
    try{ reply=localBrain(said,modelThere()); }
    catch(err){ reply=nearMiss((err&&err.message)||"I could not do that."); }
  }
  if(reply===null && !botSample && !proxyReady()) reply=suggestFor(said);
  if(reply!==null){
    botTurns.push({role:"user",content:said});
    botTurns.push({role:"assistant",content:reply});
    if(botTurns.length>14) botTurns=botTurns.slice(-14);
    botRender();
    if(!SHEET.hidden) try{ $("#bot-input").focus(); }catch(e){}
    return;
  }
  botBusy=true;
  $("#bot-send").disabled=true; $("#bot-stop").hidden=false;
  botTurns.push({role:"user",content:said});
  if(botTurns.length>14) botTurns=botTurns.slice(-14);
  botRender();
  var bub=botBubble("bot","Thinking…");
  botCtl=new AbortController();
  try{
    TURN_OUT=""; TURN_HIST=false;
    /* no live text: a reply is read by the check below before anyone sees it */
    var res = botSample
      ? await botSample(
          [{role:"user",content:BOT_RULES+botSnapshot()}].concat(botTurns),
          { signal:botCtl.signal, tools:recordTools(botTools()) })
      : await proxyChat(said,{signal:botCtl.signal,tools:recordTools(botTools())});
    var nowD=new Date(), chk=replyCheck(res.text,{history:TURN_HIST,
      src:TURN_OUT+" "+said+" "+todayStr()+" "+pad2(nowD.getHours())+":"+pad2(nowD.getMinutes())});
    if(!chk.ok) res={text:"I held that answer back: "+chk.why+". Ask again and I will stay with your own numbers."};
    botTurns.push({role:"assistant",content:res.text});
    botRender();
    try{ $("#bot-input").focus(); }catch(e){}
  }catch(e){
    var msg=BOT_ERR[e&&e.code]||("Something went wrong"+(e&&e.code?" ("+e.code+")":"")+".");
    if(e&&e.text){ botTurns.push({role:"assistant",content:e.text}); botRender(); }
    else botRender();
    if(msg) botBubble("err",msg);
  }finally{
    botBusy=false; botCtl=null;
    $("#bot-send").disabled=false; $("#bot-stop").hidden=true;
  }
}

(function(){
  botOpen(false);   /* it opens when you ask for it, never on its own */
  var chips=[["Help","help"],
             ["What is left today?","what is left today"],
             ["Make today a rough day","make today a rough day"],
             ["What needs attention?","what needs attention"],
             ["How am I doing this week?","how am i doing this week"]];
  var box=$("#bot-chips");
  chips.forEach(function(c){
    var b=document.createElement("button");
    b.type="button"; b.className="bot-chip"; b.textContent=c[0];
    b.addEventListener("click",function(e){ e.stopPropagation(); botAsk(c[1]); });
    box.appendChild(b);
  });
  /* where Claude is reachable, it takes the sentences the board cannot parse */
  if(!window.claude||typeof claude.use!=="function") return;
  try{
    claude.use("sample").then(function(fn){ if(fn) botSample=fn; })
      .catch(function(e){ try{ console.warn("board tutor failed to start:",e&&e.message||e); }catch(_){} });
  }catch(e){ try{ console.warn("board tutor failed to start:",e&&e.message||e); }catch(_){} }
})();
$("#bot-send").addEventListener("click",function(e){
  e.stopPropagation();
  var v=$("#bot-input").value.trim(); if(v) botAsk(v);
});
$("#bot-input").addEventListener("keydown",function(e){
  if(e.key==="Enter"){ e.preventDefault(); var v=this.value.trim(); if(v) botAsk(v); }
});
$("#bot-stop").addEventListener("click",function(e){ e.stopPropagation(); if(botCtl) botCtl.abort(); });
$("#week-erase").addEventListener("click",function(e){
  e.stopPropagation();
  var n=weekData().log.length;
  if(!n){ toast("Check-in","There are no check-ins to delete."); return; }
  askUser({title:"Delete your check-ins?", body:["This deletes all "+n+" weekly check-in"+(n===1?"":"s")+" on this device. There is no other copy."],
    ok:"Delete them", cancel:"Keep them", danger:true}).then(function(yes){
    if(!yes) return;
    weekClear(); renderAll();
  });
});
$("#jr-erase").addEventListener("click",function(e){
  e.stopPropagation();
  var n=jrData().log.length;
  if(!n){ toast("Journal","There are no journal entries to delete."); return; }
  askUser({title:"Delete your journal?", body:["This deletes all "+n+" journal entr"+(n===1?"y":"ies")+" on this device. There is no other copy."],
    ok:"Delete them", cancel:"Keep them", danger:true}).then(function(yes){
    if(!yes) return;
    jrClear(); renderAll();
  });
});
$("#bot-clear").addEventListener("click",function(e){
  e.stopPropagation(); var keep=botTurns.slice();
  botTurns=[]; PEND=null; wireClear(); botRender();
  /* on the phone, Clear can be taken back for 6 seconds, like Done and Remove */
  if(keep.length && typeof PH_ON!=="undefined" && PH_ON) phUndoFn("Conversation cleared",function(){ botTurns=keep; botRender(); });
});
$("#bot-pend").addEventListener("click",function(e){
  e.stopPropagation();
  if(e.target.closest("[data-pend-yes]")) pendYes();
  else if(e.target.closest("[data-pend-no]")) pendNo();
});

