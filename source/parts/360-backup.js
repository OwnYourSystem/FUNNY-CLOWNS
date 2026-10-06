/* ---------------- backup ---------------- */
(function(){
  var d=$("#backup"), b=$("#btn-backup"), downOn=false, opener=null;
  if(!d||!b) return;
  trapTab(d);
  b.addEventListener("click",function(){ opener=b; if(d.showModal) d.showModal(); else d.setAttribute("open",""); $("#backup-close").focus(); });
  $("#backup-close").addEventListener("click",function(){ d.close(); });
  d.addEventListener("pointerdown",function(e){ downOn=(e.target===d); });
  d.addEventListener("click",function(e){ if(e.target===d && downOn) d.close(); });
  d.addEventListener("close",function(){ try{ if(opener) opener.focus(); }catch(er){} });
})();
var IO=$("#io");
var sandboxed=(function(){ try{ return window.self!==window.top; }catch(e){ return true; } })();
if(sandboxed) $("#io-save").textContent="Copy backup text";
$("#io-dump").addEventListener("click",function(){ IO.value=JSON.stringify(state); IO.focus(); IO.select(); });
$("#io-load").addEventListener("click",function(){
  try{
    var s=JSON.parse(IO.value);
    if(!s||!(s.v===1||s.v===2)) throw new Error("bad");
    localStorage.setItem(KEY,JSON.stringify(s)); location.reload();
  }catch(e){ ioMsg("That is not a board backup. Paste the whole line, first brace to last."); }
});
$("#io-save").addEventListener("click",function(){
  if(sandboxed){
    IO.value=JSON.stringify(state); IO.focus(); IO.select();
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(IO.value).catch(function(){});
    return;
  }
  try{
    var a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(state)],{type:"application/json"}));
    a.download="minimum-deliveries-"+todayStr()+".json";
    document.body.appendChild(a); a.click(); a.remove();
  }catch(e){ IO.value=JSON.stringify(state); IO.focus(); IO.select(); ioMsg("This browser will not save a file. The backup text is selected instead, copy it."); }
});
$("#io-file").addEventListener("change",function(e){
  var f=e.target.files[0]; if(!f) return;
  var r=new FileReader(); r.onload=function(){ IO.value=r.result; $("#io-load").click(); }; r.readAsText(f);
});
$("#io-reset").addEventListener("click",function(){
  askUser({title:"Reset the board?", body:["This puts the shipped list back and throws away your goals, steps, history, notes, weekly check-ins and settings in this browser.","A backup file you saved earlier is not touched. This cannot be undone."],
    ok:"Reset everything", cancel:"Keep my board", danger:true}).then(function(yes){
    if(!yes) return;
    try{ localStorage.removeItem(KEY); localStorage.removeItem(WEEK_KEY); }catch(e){}
    location.reload();
  });
});

