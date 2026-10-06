function pad2(n){ return (n<10?"0":"")+n; }
function dstr(d){ return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate()); }
function todayStr(){ return dstr(new Date()); }
function agoDate(n){ var d=new Date(); d.setDate(d.getDate()-n); return dstr(d); }
function ageOf(iso){ if(!iso) return 0; return Math.max(0,Math.round((new Date(todayStr())-new Date(iso))/864e5)); }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function clamp(n,a,b){ return n<a?a:(n>b?b:n); }
function uid(p){ return p+Math.random().toString(36).slice(2,8); }

