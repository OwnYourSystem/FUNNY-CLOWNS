/* ---------------- the journal, in the chat ----------------
   "I would like to journal my day" asks one question; the next message is
   saved as it was typed, split into what got done and what comes next. That
   answer is never read as a command, a memory or an experiment. "Journal:"
   with the text after it saves at once. The chat can read the last note back
   ("where did I leave off?"). The check-in stays out of the chat; the journal
   is the person's own note to themselves, read back only when they ask.
   When a hosted model is switched on (F12), these replies must be kept out of
   what is sent to it unless the person agrees.                            */
function jrKindWord(w){ w=String(w||"").toLowerCase(); return /morning|start/.test(w)?"start":/evening|night|end/.test(w)?"end":jrKindNow(); }
function jrSaveChat(text,kind){
  var p=jrSplit(text,kind), e=jrAdd({kind:kind,a:p.a,b:p.b}), K=JR_KINDS[e.kind];
  renderAll();
  return "Saved to your journal: "+K.name.toLowerCase()+", "+jrWhen(e)+".\n"+jrLines(e).join("\n")+
    (e.kind==="end"?"\nI will show it to you first thing tomorrow.":"");
}
var JR_OPEN=/^(?:i(?:'d| would) like to |i want to |i wanna |i need to |let me |let's |can i |could i |please )?(?:(?:write|make|add|do|start|begin) (?:in |into |an? |my |the )*(?:new )?journal(?: entry)?|journal(?:ing)?(?: about)?(?: for)?(?: (?:my|the|this))? ?(day|today|morning|evening|night|start of (?:the |my )?day|end of (?:the |my )?day)?)(?: now| please| for today)?$/;
act({id:"jr_write",group:"Journal",ex:"I would like to journal my day",kw:["journal","diary","log my day","end of day","checkpoint"],
  re:[JR_OPEN],take:[["entry",99]],free:true,
  ask:{entry:function(v,m){ var k=jrKindWord(m&&m[1]), K=JR_KINDS[k];
    return (k==="start"?"Good morning. ":"Go ahead. ")+K.qa+" And "+K.qb.charAt(0).toLowerCase()+K.qb.slice(1)+
      " One message is enough. It stays on this device only."; }},
  run:function(v,m){ return jrSaveChat(v.entry,jrKindWord(m&&m[1])); }});
act({id:"jr_now",group:"Journal",ex:"Journal: finished the report, tomorrow call the bank",kw:["journal"],
  re:[/^(?:my )?journal(?: (?:my|the) (day|morning|evening))?: ?\S/],
  run:function(v,m){ var r=SPOKE.raw||SPOKE.d, i=r.indexOf(":"); return jrSaveChat(r.slice(i+1),jrKindWord(m&&m[1])); }});
act({id:"jr_check",group:"Journal",ex:"Where did I leave off?",kw:["left","checkpoint","yesterday","journal"],
  re:[/^where (?:did i|was i|i) (?:leave off|left off|left it|leave it|stop|stopped|end|ended)(?: yesterday)?$/,/^where was i$/,/^(?:my |the )?checkpoint$/,/^what did i (?:write|say|journal|note)(?: down)? yesterday$/],
  run:function(){
    var c=jrCheckpoint();
    if(!c){ var t=jrToday(); if(!t.length) return "Your journal is empty. Type journal my day to start it.";
      return "Today so far ("+jrWhen(t[t.length-1])+"):\n"+jrLines(t[t.length-1]).join("\n"); }
    var s=jrSays(c); return "Where you left off. "+s.head+":\n"+s.lines.join("\n"); }});
act({id:"jr_view",group:"Journal",ex:"Show my journal",kw:["journal","diary","entries"],
  re:[/^(?:show|open|read|see|view|list)(?: me)?(?: all)? (?:my |the )?(?:journal|diary)(?: entries| notes)?$/,/^(?:my )?journal entries$/],
  run:function(){
    var n=jrData().log.length; location.hash="#/planner";
    setTimeout(function(){ var p=$("#jr-panel"); if(p&&p.scrollIntoView) p.scrollIntoView({block:"start"}); },60);
    return n ? "Your journal is open on the Planner: "+n+" entr"+(n===1?"y":"ies")+", newest first." : "Your journal is empty. Type journal my day to start it."; }});
