const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const KEY='oys-min-deliveries-v1';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errors=[];
  async function open(mut){
    const ctx = await browser.newContext({ viewport:{width:1280,height:1400} });
    const page = await ctx.newPage();
    page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()); });
    page.on('pageerror', e=>errors.push('pageerror: '+e.message));
    await page.goto('http://localhost:8731/index.html');
    await page.waitForSelector('.row.pick',{timeout:10000});
    if(mut){
      await page.evaluate(([KEY,mut])=>{ const s=JSON.parse(localStorage.getItem(KEY)); s.me=s.me||{}; s.me.done=true; eval('('+mut+')')(s); localStorage.setItem(KEY,JSON.stringify(s)); },[KEY,mut]);
      await page.reload(); await page.waitForSelector('.row.pick',{timeout:10000});
    }
    return page;
  }
  const iso=n=>{const d=new Date(); d.setDate(d.getDate()-n); const p=x=>String(x).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());};
  async function snap(page){
    return page.evaluate(()=>({
      now:(document.querySelector('#now-card-2')||{}).textContent||'',
      badge:(document.querySelector('#now-badge')||{}).innerText||'',
      plan:(document.querySelector('#plan-count')||{}).innerText||'',
      btns:[...document.querySelectorAll('[data-dose]')].map(b=>b.dataset.dose+':'+b.textContent)
    }));
  }
  // A. baseline: profile done, no history -> no dose text
  let p=await open(`s=>{ s.dayLog=[]; s.capLog=[]; s.cap=null; }`);
  let a=await snap(p);
  console.log('A_NOW_HAS_LOW='+/low day|dose/i.test(a.now+a.badge+a.plan)+' BTNS='+JSON.stringify(a.btns));
  const baseVerdict=await p.evaluate(()=>document.querySelector('#now-card-2 .now-n')&&document.querySelector('#now-card-2 .now-n').textContent);
  console.log('A_BASE_PICK='+baseVerdict);
  // B. two bad days -> auto low
  p=await open(`s=>{ s.dayLog=[{d:'${iso(1)}',done:0,planned:4,items:[]},{d:'${iso(2)}',done:1,planned:5,items:[]}]; s.capLog=[]; s.cap=null; }`);
  a=await snap(p);
  console.log('B_NOW='+JSON.stringify(a.now.slice(0,420)));
  console.log('B_PLAN='+a.plan+' BTNS='+JSON.stringify(a.btns));
  const lowPick=await p.evaluate(()=>document.querySelector('#now-card-2 .now-n').textContent);
  console.log('B_PICK='+lowPick+' (base '+baseVerdict+')');
  // C. override "More" from the card, check log + persistence
  await p.click('#now-badge [data-dose="high"]'); await p.waitForTimeout(300);
  a=await snap(p);
  console.log('C_NOW_TAIL='+JSON.stringify(a.now.slice(-200))+' BTNS='+JSON.stringify(a.btns));
  let st=await p.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY)); return {cap:s.cap,capLog:s.capLog};},KEY);
  console.log('C_STATE='+JSON.stringify(st));
  await p.evaluate(()=>document.querySelector('#now-card-2 [data-dose="auto"]').click()); await p.waitForTimeout(300);
  st=await p.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY)); return {cap:s.cap,capLog:s.capLog};},KEY);
  console.log('C_AFTER_AUTO='+JSON.stringify(st));
  // D. rough-day tap from normal, dock overfill note
  p=await open(`s=>{ s.dayLog=[]; s.capLog=[]; s.cap=null; s.plan=[]; s.done=[]; }`);
  await p.click('#now-badge [data-dose="low"]'); await p.waitForTimeout(300);
  a=await snap(p);
  console.log('D_BADGE='+JSON.stringify(a.badge)+' PLAN='+a.plan);
  // E. quota met: mark one item done today in low day
  p=await open(`s=>{ s.dayLog=[]; s.capLog=[]; s.cap={d:'${iso(0)}',mode:'low'}; var id=Object.keys(s.subs)[0]; s.done=[{k:'sub',id:id,done:true}]; }`);
  a=await snap(p);
  console.log('E_NOW='+JSON.stringify(a.now)+' BADGE='+JSON.stringify(a.badge));
  // F. pattern from capLog: 2 rough taps in last 3 days
  p=await open(`s=>{ s.dayLog=[]; s.cap=null; s.capLog=[{d:'${iso(1)}',est:'normal',you:'low'},{d:'${iso(3)}',est:'normal',you:'low'}]; }`);
  a=await snap(p);
  console.log('F_NOW='+JSON.stringify(a.now.slice(0,300)));
  // G. snapshot + tool
  const g=await p.evaluate(()=>typeof window.botSnapshot);
  console.log('G_ERRORS='+JSON.stringify(errors));
  await p.screenshot({path:'/tmp/claude-0/shot-dose-low.png'});
  await browser.close();
})().catch(e=>{console.error('SCRIPT_ERROR',e);process.exit(1);});
