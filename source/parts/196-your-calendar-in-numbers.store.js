/* the calendar kept on this device (part 415 writes it), read when the page
   loads, so rule 6 sees it from the first draw */
function calKept(){
  try{ var c=JSON.parse(localStorage.getItem(KEY+".cal")||"null"); return (c&&c.on&&c.ev)||[]; }catch(e){ return []; }
}
CAL_LIST=calKept();
