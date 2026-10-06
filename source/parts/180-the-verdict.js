/* ---------------- the verdict ----------------
   One thing. Not a shortlist, not a ranked table: the board has already
   ranked everything and a ranking is another decision handed back to you.
   So it names one subtask, says why it and not the next one, and says what
   it threw out and when that becomes possible again.

   The ranking is pickToday's, because that scoring is already the board's
   idea of what matters. What the profile adds is the veto: anything that
   cannot be done in the hour you are in never reaches the top, however
   loudly it is shouting, and the thing it displaced is named.          */
/* The one line someone typed as what matters most is not decoration. Any
   goal whose name or tags carry a word from it is lifted above the rest.
   Short and common words are dropped, or every goal would match.       */
var NORTH_STOP={the:1,a:1,an:1,and:1,or:1,of:1,to:1,for:1,in:1,on:1,at:1,by:1,with:1,
  before:1,after:1,my:1,me:1,it:1,is:1,get:1,do:1,all:1,new:1,more:1,this:1,that:1};
function northWords(me){
  return String((me&&me.north)||"").toLowerCase().split(/[^a-z0-9]+/)
    .filter(function(w){ return w.length>3 && !NORTH_STOP[w]; });
}
function northHit(g,me,sub){
  var ws=northWords(me); if(!ws.length) return false;
  /* the line can name the goal or the step inside it, so both are read */
  var hay=(g.name+" "+(g.tags||[]).join(" ")+" "+((sub&&sub.name)||"")).toLowerCase();
  /* whole words only. A plain indexOf let "ship" in "Ship the tracker"
     match "Partnership", which lifted the wrong goal to the top. */
  return ws.some(function(w){
    return new RegExp("\\b"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(s|es)?\\b").test(hay);
  });
}
