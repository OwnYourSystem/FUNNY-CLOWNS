/* ---------------- clock ---------------- */
function weekNo(d){ var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  var dn=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-dn);
  return Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/864e5+1)/7); }

