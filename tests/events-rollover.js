const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const KEY='oys-min-deliveries-v1';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errs=[]; 
  // A. rollover must not emit a storm of undo events
  let ctx=await browser.newContext({viewport:{width:390,height:900}}); let page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await page.goto('http://localhost:8731/index.html'); await page.waitForSelector('.row.pick');
  await page.evaluate(KEY=>{ const s=JSON.parse(localStorage.getItem(KEY)); s.me=s.me||{}; s.me.done=true; const id=Object.keys(s.subs)[0]; const y=new Date(); y.setDate(y.getDate()-1); const p=x=>String(x).padStart(2,'0'); s.day=y.getFullYear()+'-'+p(y.getMonth()+1)+'-'+p(y.getDate()); s.done=[{k:'sub',id:id,done:true},{k:'sub',id:Object.keys(s.subs)[1],done:true}]; s.ev=[]; delete s.cap; localStorage.setItem(KEY,JSON.stringify(s)); },KEY);
  await page.reload(); await page.waitForSelector('.row.pick'); await page.waitForTimeout(300);
  let st=await page.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY)); return {ev:s.ev.length, done:s.done.length, log:s.dayLog.length};},KEY);
  console.log('ROLLOVER '+JSON.stringify(st)+' (expect ev 0, done 0)');
  // B. an old saved board with no ev key loads
  await page.evaluate(KEY=>{ const s=JSON.parse(localStorage.getItem(KEY)); delete s.ev; localStorage.setItem(KEY,JSON.stringify(s)); },KEY);
  await page.reload(); await page.waitForSelector('.row.pick');
  console.log('NO_EV_KEY_LOADS='+await page.evaluate(KEY=>Array.isArray(JSON.parse(localStorage.getItem(KEY)).ev)||'ev missing until first save',KEY));
  // C. chips at phone width, after a skip
  await page.evaluate(KEY=>{ const s=JSON.parse(localStorage.getItem(KEY)); s.me.done=true; s.ev=[]; s.plan=[]; s.oftad=[]; s.done=[]; localStorage.setItem(KEY,JSON.stringify(s)); },KEY);
  await page.reload(); await page.waitForSelector('.row.pick');
  await page.click('#oftad-pick [data-pick-skip]'); await page.waitForTimeout(300);
  const el=page.locator('#oftad-pick'); await el.scrollIntoViewIfNeeded();
  await el.screenshot({path:'/tmp/claude-0/shot-skipwhy.png'});
  console.log('OVERFLOW_X='+await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth));
  console.log('ERRORS='+JSON.stringify(errs));
  await browser.close();
})().catch(e=>{console.error('SCRIPT_ERROR',e);process.exit(1);});
