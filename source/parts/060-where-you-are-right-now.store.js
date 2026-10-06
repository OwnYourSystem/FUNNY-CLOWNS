function readSnaps(){
  try{ return JSON.parse(localStorage.getItem(SNAP_KEY)||"[]"); }catch(e){ return []; }
}
function keepSnapshot(day){
  try{
    var all=readSnaps().filter(function(x){ return x.d!==day; });
    all.unshift({d:day, at:Date.now(), data:JSON.parse(JSON.stringify(state))});
    while(all.length>7) all.pop();
    localStorage.setItem(SNAP_KEY, JSON.stringify(all));
  }catch(e){ /* a full quota is not worth losing the board over */ }
}
