/* ---------------- the board is a grid, and it stays one ----------------
   Panels used to be draggable and resizable, which meant the board could be
   left in a mess and every open needed a Tidy up button to undo it. The
   grid already knows where everything goes and it reflows on its own at
   every width, so the handles, the free mode and the button are gone. What
   is left is the one thing they were hiding: the layout is not yours to
   maintain.                                                              */
var wasStrip=stripMode();
addEventListener("resize",function(){
  if(stripMode()!==wasStrip){ wasStrip=stripMode(); renderMain(); }
});
function wide(){ return window.innerWidth>=900; }

