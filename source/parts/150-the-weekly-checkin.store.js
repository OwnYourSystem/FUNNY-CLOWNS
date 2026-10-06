function weekData(){
  if(WEEK_DATA) return WEEK_DATA;
  try{ var x=JSON.parse(localStorage.getItem(WEEK_KEY)||"null"); WEEK_DATA=(x&&Array.isArray(x.log))?x:{v:1,log:[]}; }
  catch(e){ WEEK_DATA={v:1,log:[]}; }
  return WEEK_DATA;
}
function weekSave(){ try{ localStorage.setItem(WEEK_KEY,JSON.stringify(weekData())); }catch(e){} }
function weekClear(){
  WEEK_DATA={v:1,log:[]};
  try{ localStorage.removeItem(WEEK_KEY); }catch(e){}
}
