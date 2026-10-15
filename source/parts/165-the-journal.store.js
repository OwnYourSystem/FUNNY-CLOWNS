function jrData(){
  if(JR_DATA) return JR_DATA;
  try{ var x=JSON.parse(localStorage.getItem(JR_KEY)||"null"); JR_DATA=(x&&Array.isArray(x.log))?x:{v:1,log:[]}; }
  catch(e){ JR_DATA={v:1,log:[]}; }
  return JR_DATA;
}
function jrSave(){ try{ localStorage.setItem(JR_KEY,JSON.stringify(jrData())); }catch(e){} }
function jrClear(){
  JR_DATA={v:1,log:[]};
  try{ localStorage.removeItem(JR_KEY); }catch(e){}
}
