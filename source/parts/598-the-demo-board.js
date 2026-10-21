/* ---------------- the demo board, for user sessions (2026-10-21) ----------------
   notes/user-sessions-anxiety.md needs a board that already has a passed
   delivery day, two weeks of history (so "Something I noticed" appears),
   easy things and a step marked Easy. Open the app with ?demo=session: it
   asks first, then replaces the board on this device with that example.
   It never runs for someone signed in, so an account's board is never
   replaced. The names are examples, not anyone's data.                    */
function demoBoard(){
  var s=blankState(), t=todayStr(), now=Date.now(), n, i;
  s.seedRev=SEED_REV; s.day=t; s.wn="none";
  s.me={done:true, guided:true, goodSet:true, normalN:3, days:[1,2,3,4,5], work:["09:00","17:00"],
        rise:"07:00", wind:"22:30", north:"Finish the garden shed before winter", brief:"07:30", icon:""};
  var add=function(id,name,where,due,steps){
    s.groups.push({id:id, name:name, subs:[], due:due||"", prio:"mid", tags:[], where:where});
    steps.forEach(function(x,k){
      var sid=id+"-"+k, done=x.charAt(0)==="+";
      s.subs[sid]={id:sid, gid:id, name:done?x.slice(1):x, pct:done?100:0, status:done?"done":"todo", tag:"", upd:addDays(t,-3)};
      s.groups[s.groups.length-1].subs.push(sid);
    });
  };
  add("dshed","Garden shed","any",addDays(t,10),["+Measure the base","Buy the timber","Lay the base","Build the walls"]);
  add("dreport","Quarterly report","work","",["Collect the numbers","Write the draft","Send it to Sam"]);
  add("dtrip","Plan a weekend away","any",addDays(t,-3),["Pick a place","Book a room"]);
  add("dspan","Learn Spanish","any","",["Download a language app","First lesson"]);
  s.subs["dspan-0"].easy=true;
  s.sel="dshed";
  s.floor={items:[{id:"fd1",t:"Listen to an audiobook"},{id:"fd2",t:"Read before sleep"},{id:"fd3",t:"A short walk"}],log:{}};
  /* two weeks of history: two steps finished on each of 12 days, one in the morning and one in the afternoon */
  s.ev=[];
  for(n=1;n<=14;n++){
    if(n===6||n===13) continue;
    var d=new Date(now); d.setDate(d.getDate()-n);
    for(i=0;i<2;i++){ var e=new Date(d); e.setHours(i?15:9,10,0,0); s.ev.push({t:e.getTime(), k:"done", id:"demo-"+n+"-"+i, g:"dshed"}); }
  }
  s.ev.sort(function(a,b){ return a.t-b.t; });
  s.mem=[]; s.memNo={}; s.hist=[{d:t, v:0, first:1}];
  return s;
}
function demoAsk(){
  if(!/[?&]demo=session\b/.test(location.search)) return;
  var clean=function(){ try{ history.replaceState(null,"",location.pathname+(location.hash||"#/now")); }catch(e){} };
  if(syncMode()==="account"){ clean(); toast("Demo board","Sign out first. The demo board never replaces the board of an account."); return; }
  askUser({title:"Load the demo board?",
    body:["For a user session. It replaces the board on this device with an example: 4 goals, a delivery day that has passed, 2 weeks of history and 3 easy things.",
      "Use it only on a test phone or a fresh board. No backup is made."],
    ok:"Load the demo board", cancel:"Not now", danger:true}).then(function(yes){
    clean();
    if(!yes) return;
    state=demoBoard(); save();
    location.replace(location.pathname+"#/now"); location.reload();
  });
}
setTimeout(demoAsk,0);
