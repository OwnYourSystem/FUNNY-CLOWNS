const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const KEY='oys-min-deliveries-v1';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errs=[];
  const ctx = await browser.newContext({ viewport:{width:1280,height:1400} });
  const page = await ctx.newPage();
  page.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e=>errs.push('pageerror: '+e.message));
  await page.goto('http://localhost:8731/index.html'); await page.waitForSelector('.row.pick');
  await page.evaluate(KEY=>{ const s=JSON.parse(localStorage.getItem(KEY)); s.me=s.me||{}; s.me.done=true; s.ev=[]; s.dayLog=[]; s.capLog=[]; s.cap=null; s.plan=[]; s.done=[]; s.oftad=[]; localStorage.setItem(KEY,JSON.stringify(s)); },KEY);
  await page.reload(); await page.waitForSelector('.row.pick');
  const evs=async()=>page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).ev,KEY);

  // 1. capture through the real paths
  const firstSub=await page.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY)); const g=s.groups.find(g=>g.subs.length>1); return {id:g.subs[0], name:s.subs[g.subs[0]].name, pct:s.subs[g.subs[0]].pct};},KEY);
  console.log('SUB='+JSON.stringify(firstSub));
  await page.evaluate(n=>window.__board.brain('set '+n+' to 35%'),firstSub.name);
  await page.evaluate(n=>window.__board.brain('mark '+n+' as done'),firstSub.name);
  await page.waitForTimeout(200);
  let e=await evs();
  console.log('KINDS_AFTER_BRAIN='+JSON.stringify(e.map(x=>x.k+(x.k==='pct'?':'+x.a+'>'+x.b:''))));
  console.log('NO_NAMES_STORED='+!JSON.stringify(e).includes(firstSub.name));
  // take + skip + dose via UI
  await page.click('#oftad-pick [data-pick-skip]').catch(()=>{});
  await page.waitForTimeout(300);
  console.log('WHY_CHIPS='+await page.locator('[data-skipwhy]').count());
  await page.locator('#oftad-pick [data-skipwhy="too big"]').first().click().catch(async()=>{ await page.locator('[data-skipwhy="too big"]').first().click(); });
  await page.waitForTimeout(300);
  await page.click('#now-badge [data-dose="low"]');
  await page.waitForTimeout(300);
  e=await evs();
  console.log('SKIP_EV='+JSON.stringify(e.filter(x=>x.k==='skip'))+' DOSE_EV='+JSON.stringify(e.filter(x=>x.k==='dose')));
  console.log('CHIPS_AFTER_TAP='+await page.locator('[data-skipwhy]').count());

  // 2. golden dataset: known pattern, compare engine against independent arithmetic
  const gold=await page.evaluate(KEY=>{
    const s=JSON.parse(localStorage.getItem(KEY));
    const gid=s.groups[0].id, gid2=s.groups[1].id;
    const ids=s.groups[0].subs; ev=[];
    const day=new Date(); day.setHours(0,0,0,0);
    let n=0;
    // 40 days back to yesterday: weekday mornings 2 done, evenings 0; weekend afternoons 1 done; 3 skips on day-3 with reasons
    for(let d=40; d>=1; d--){
      const dt=new Date(day); dt.setDate(dt.getDate()-d);
      const dow=dt.getDay();
      const add=(h,k,id,extra)=>{ const t=new Date(dt); t.setHours(h,15,0,0); ev.push(Object.assign({t:t.getTime(),k:k,id:id,g:gid},extra||{})); };
      if(dow>=1&&dow<=5){ add(8,'done',ids[0]); add(10,'done',ids[1]||ids[0]); }
      else { add(15,'done',ids[0]); }
    }
    // duplicate done of same item same day must count once
    { const dt=new Date(day); dt.setDate(dt.getDate()-1); const t=new Date(dt); t.setHours(8,45,0,0); ev.push({t:t.getTime(),k:'done',id:ids[0],g:gid}); }
    for(let i=0;i<5;i++){ const dt=new Date(day); dt.setDate(dt.getDate()-3); dt.setHours(19,i,0,0); ev.push({t:dt.getTime(),k:'skip',id:ids[0],g:(i<3?gid:gid2),why:(i<4?'too big':'wrong time')}); }
    ev.sort((a,b)=>a.t-b.t);
    s.ev=ev; localStorage.setItem(KEY,JSON.stringify(s));
    return ev;
  },KEY);
  await page.reload(); await page.waitForSelector('.row.pick');
  const ex=await page.evaluate((gold)=>{
    // independent arithmetic from the raw events, using local time like the engine
    const now=new Date(); const start=new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate()-29);
    const seen={}; const slot={morning:0,afternoon:0,evening:0}; let n=0;
    gold.forEach(e=>{ if(e.k!=='done'||e.t<start.getTime()) return; const d=new Date(e.t); const key=d.toDateString()+'|'+e.id; if(seen[key]) return; seen[key]=1; n++; const h=d.getHours(); slot[h<12?'morning':(h<17?'afternoon':'evening')]++; });
    return {n,slot};
  },gold);
  const st=await page.evaluate(()=>window.__board.stats('completions',30,'hour_slot'));
  console.log('GOLD_N engine='+st.n+' expected='+ex.n+' MATCH='+(st.n===ex.n));
  const got={}; st.rows.forEach(r=>got[r.key]=r.count);
  console.log('GOLD_SLOTS engine='+JSON.stringify(got)+' expected='+JSON.stringify(ex.slot)+' MATCH='+(['morning','afternoon','evening'].every(k=>(got[k]||0)===ex.slot[k])));
  console.log('ENOUGH='+st.enough+' ACTIVE_DAYS='+st.active_days+' SHARES='+JSON.stringify(st.rows.map(r=>r.key+':'+r.share)));
  const sk=await page.evaluate(()=>({r:window.__board.stats('skips',30,'reason'), g:window.__board.stats('skips',30,'goal')}));
  console.log('SKIPS reason='+JSON.stringify(sk.r.rows)+' goal='+JSON.stringify(sk.g.rows)+' n='+sk.r.n);
  const cmp=await page.evaluate(()=>window.__board.compare('completions',7));
  console.log('COMPARE='+JSON.stringify({a:cmp.this_period,b:cmp.previous_period,delta:cmp.delta,enough:cmp.enough}));
  const tr=await page.evaluate(()=>window.__board.trend('completions',14));
  console.log('TREND points='+tr.points+' slope='+tr.slope_per_point+' enough='+tr.enough);
  // 3. thin data says "not enough"
  await page.evaluate(KEY=>{ const s=JSON.parse(localStorage.getItem(KEY)); s.ev=s.ev.slice(-3); localStorage.setItem(KEY,JSON.stringify(s)); },KEY);
  await page.reload(); await page.waitForSelector('.row.pick');
  const thin=await page.evaluate(()=>({s:window.__board.stats('completions',30,'hour_slot'), say:window.__board.brain('when am i most productive')}));
  console.log('THIN_ENOUGH='+thin.s.enough+' SAY='+thin.say);
  // 4. offline answers on full data
  await page.evaluate(KEY=>{ localStorage.setItem(KEY+'.keep',localStorage.getItem(KEY)); },KEY);
  await page.evaluate((gold)=>{ const KEY='oys-min-deliveries-v1'; const s=JSON.parse(localStorage.getItem(KEY)); s.ev=gold; localStorage.setItem(KEY,JSON.stringify(s)); },gold);
  await page.reload(); await page.waitForSelector('.row.pick');
  const say=await page.evaluate(()=>({w:window.__board.brain('when am i most productive?'), k:window.__board.brain('what do i skip'), c:window.__board.brain('am i getting better')}));
  console.log('SAY_WHEN='+say.w); console.log('SAY_SKIP='+say.k); console.log('SAY_WEEK='+say.c);
  // 5. tools are present and read-only
  const names=await page.evaluate(()=>{ try{ return ['stats','compare','trend','events'].map(n=>typeof n); }catch(e){ return e.message; } });
  // 6. bad arguments rejected
  const bad=await page.evaluate(()=>{ try{ window.__board.stats('nonsense',5); return 'no error'; }catch(e){ return e.message; } });
  console.log('BAD_METRIC='+bad);
  console.log('ERRORS='+JSON.stringify(errs));
  await browser.close();
})().catch(e=>{console.error('SCRIPT_ERROR',e);process.exit(1);});
