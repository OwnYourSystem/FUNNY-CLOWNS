import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
await ctx.addInitScript(() => {
  /* a Notification that records instead of showing */
  window.__notes = [];
  function N(title, o) { window.__notes.push({ title, body: o && o.body, tag: o && o.tag }); }
  Object.defineProperty(N, "permission", { get() { return window.__perm || "default"; } }); N.requestPermission = () => Promise.resolve(N.permission);
  if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = function (t, o) { window.__notes.push({ title: t, body: o && o.body, tag: o && o.tag }); return Promise.resolve(); };
  try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; }
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");

const seed = (mut) => p.evaluate(([KEY, mut]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; delete s.me.hints; delete s.me.hintNote; s.me.brief = "00:00";
  s.ev = []; s.mem = []; s.memNo = {}; s.memAt = new Date().toISOString().slice(0, 10); s.hint = null; s.hintLog = []; delete s.hintAt; s.told = null; s.exp = { active: null, done: [], unseen: false }; s.dayLog = []; s.capLog = []; s.cap = null;
  const day = new Date(); day.setHours(0, 0, 0, 0); const ids = Object.keys(s.subs), gid = s.groups[0].id; const ev = [];
  for (let o = -14; o <= -1; o++) if (o % 3 !== 0) { const d = new Date(day); d.setDate(d.getDate() + o); ev.push({ t: d.getTime() + 9 * 3600000, k: "done", id: ids[0], g: gid }); }
  s.ev = ev; window.__expectDays = ev.length;
  if (mut) eval("(" + mut + ")")(s);
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, mut]).then(() => p.evaluate(() => { location.hash = "#/board"; })).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const say = (q) => p.evaluate((q) => { try { return window.__board.brain(q); } catch (e) { return e.message; } }, q);
const card = () => p.locator("#hint-card");
const expectDays = 14 - Math.floor(14 / 3) - (14 % 3 === 2 ? 0 : 0);

// ---- the choice, as pure functions -----------------------------------------------------------------------------
const choose = (c, l) => p.evaluate(([c, l]) => { const r = window.__board.hint.choose(c, l, "2026-10-02"); return r && r.type; }, [c, l]);
const C = (type, key) => ({ type, key });
const all = [C("progress", "progress"), C("stalled", "stalled-a"), C("library", "lib-E-X")];
await ok("it tries each kind once, in order, before favouring any", async () => {
  assert.equal(await choose(all, []), "progress");
  assert.equal(await choose(all, [{ d: "2026-09-30", type: "progress", key: "old", ans: "helpful" }]), "stalled");
  assert.equal(await choose(all, [{ d: "2026-09-30", type: "progress", key: "o1", ans: "helpful" }, { d: "2026-09-29", type: "stalled", key: "o2", ans: "no" }]), "library");
});
await ok("once all are tried, the kind marked helpful is favoured", async () => {
  const log = [];
  for (let i = 0; i < 6; i++) log.push({ d: "2026-09-" + (10 + i), type: "progress", key: "p" + i, ans: "helpful" });
  log.push({ d: "2026-09-20", type: "stalled", key: "s0", ans: "no" }, { d: "2026-09-21", type: "library", key: "l0", ans: "no" });
  assert.equal(await choose(all, log), "progress");
});
await ok("acting on a hint (starting its experiment) counts as helpful", async () => {
  const log = [{ d: "2026-09-25", type: "progress", key: "a", ans: "no" }, { d: "2026-09-26", type: "stalled", key: "b", ans: null, acted: true }, { d: "2026-09-27", type: "library", key: "c", ans: "no" }];
  const st = await p.evaluate((l) => window.__board.hint.stats(l), log); assert.equal(st.stalled.h, 1); assert.equal(st.progress.h, 0);
  assert.equal(await choose(all, log), "stalled");
});
await ok("three 'not for me' and no 'helpful' silences a kind until reset", async () => {
  const log = [1, 2, 3].map((i) => ({ d: "2026-08-0" + i, type: "stalled", key: "s" + i, ans: "no" })).concat([{ d: "2026-08-10", type: "progress", key: "p", ans: "helpful" }, { d: "2026-08-11", type: "library", key: "l", ans: "helpful" }]);
  for (let i = 0; i < 4; i++) assert.notEqual(await choose(all, log), "stalled");
  assert.equal(await choose([C("stalled", "stalled-a")], log), null);
});
await ok("the same hint is not repeated within 14 days, and returns after", async () => {
  assert.equal(await choose([C("progress", "progress")], [{ d: "2026-09-25", type: "progress", key: "progress", ans: "helpful" }]), null);
  assert.equal(await choose([C("progress", "progress")], [{ d: "2026-09-10", type: "progress", key: "progress", ans: "helpful" }]), "progress");
});
await ok("'later' and unanswered hints do not count for or against a kind", async () => {
  const st = await p.evaluate(() => window.__board.hint.stats([{ type: "progress", ans: "later" }, { type: "progress", ans: null }])); assert.equal(st.progress.n, 0);
});

// ---- the hints themselves --------------------------------------------------------------------------------------------------------
await seed();
await ok("progress hint: the count is the real count of days, and it passes the same check as a tutor reply", async () => {
  const c = await p.evaluate(() => window.__board.hint.cands()); const pr = c.find((x) => x.type === "progress");
  const days = await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); const set = new Set(s.ev.filter((e) => e.k === "done").map((e) => new Date(e.t).toDateString())); return set.size; }, KEY);
  assert.ok(pr, "no progress candidate"); assert.match(pr.t, new RegExp("^You finished something on " + days + " of the last 14 days"));
  const chk = await p.evaluate((x) => window.__board.check(x.t, { history: true, src: x.facts }), pr); assert.ok(chk.ok, chk.why);
});
await ok("the card shows one hint with its source and the answers", async () => {
  await card().waitFor({ state: "visible", timeout: 3000 });
  const t = await card().innerText(); assert.match(t, /Today.s hint\s*[—-]\s*Evidence of your progress/); assert.match(t, /of the last 14 days had at least one finished item/); assert.match(t, /Helpful/); assert.match(t, /Not for me/); assert.match(t, /Later/);
  assert.equal((await st()).hint.type, "progress");
});
await ok("Helpful hides it, is logged on the hint, and the next day's pick moves on to another kind", async () => {
  await p.locator('[data-hint-a="helpful"]').click(); await p.waitForTimeout(200);
  assert.equal(await card().isHidden(), true); const s = await st(); assert.equal(s.hint.ans, "helpful");
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); const y = new Date(); y.setDate(y.getDate() - 1); s.hint.d = y.toISOString().slice(0, 10); delete s.hintAt; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector(".row.pick");
  const s2 = await st(); assert.equal(s2.hintLog.length, 1); assert.equal(s2.hintLog[0].ans, "helpful"); assert.notEqual(s2.hint && s2.hint.type, "progress");
});

await seed(`function(s){ const g=s.groups[0]; const old=new Date(); old.setDate(old.getDate()-20); const p2=n=>String(n).padStart(2,"0"); const o=old.getFullYear()+"-"+p2(old.getMonth()+1)+"-"+p2(old.getDate());
  s.hintLog=[{d:"2026-09-01",type:"progress",key:"progress",ans:"helpful"}]; g.subs.forEach(id=>{ s.subs[id].upd=o; s.subs[id].pct=Math.min(60,s.subs[id].pct||40); if(!s.subs[id].pct) s.subs[id].pct=40; s.subs[id].status="doing"; });
  s.groups.slice(1).forEach(gg=>gg.subs.forEach(id=>{ s.subs[id].upd=new Date().toISOString().slice(0,10); })); window.__gname=g.name; }`);
await ok("stalled hint: names the goal, the days and the percent, cites the barrier entry, offers the experiment", async () => {
  const c = await p.evaluate(() => window.__board.hint.cands()); const x = c.find((y) => y.type === "stalled"); assert.ok(x, "no stalled candidate");
  assert.match(x.t, /has not moved in 20 days and sits at \d+%/); assert.match(x.t, /\[E-BARRIER-01\]/); assert.equal(x.suggest, "E-STRETCH-01");
  const chk = await p.evaluate((y) => window.__board.check(y.t, { history: true, src: y.facts }), x); assert.ok(chk.ok, chk.why);
});
await ok("Try it starts the experiment and counts as acting on the hint", async () => {
  const s0 = await st(); assert.equal(s0.hint.type, "stalled");
  await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator("[data-hint-try]").click(); await p.waitForTimeout(250);
  const s = await st(); assert.equal(s.exp.active.ev, "E-STRETCH-01"); assert.equal(s.hint.acted, true); assert.equal(await card().isHidden(), true);
});

// ---- priority, controls, commands ------------------------------------------------------------------------------------------------------------
await seed(`function(s){ s.mem=[{id:"p1",t:"Mornings are for deep work",src:"tutor",st:"proposed",d:new Date().toISOString().slice(0,10),seen:new Date().toISOString().slice(0,10)}]; }`);
await ok("a question that is waiting for you comes first: the hint card stays hidden", async () => { assert.equal(await card().isHidden(), true); assert.ok((await st()).hint); });
await seed();
await ok("commands: ask for the hint, answer it, switch hints off and on", async () => {
  assert.match(await say("give me a hint"), /You finished something on \d+ of the last 14 days/);
  assert.match(await say("hint helpful"), /^Noted: helpful\./); assert.equal((await st()).hint.ans, "helpful");
  assert.equal(await say("stop hints"), "Hints are off."); assert.equal(await card().isHidden(), true);
  assert.match(await say("give me a hint"), /^Hints are off/);
  assert.match(await say("start hints"), /^Hints are on/);
});
await ok("get_hint returns today's hint to the tutor, and null text when hints are off", async () => {
  await seed();
  const j = JSON.parse(await p.evaluate(() => window.__board.toolRun("get_hint", {}))); assert.equal(j.kind, "progress"); assert.match(j.text, /You finished something on/); assert.equal(j.cite, "E-EVID-01");
  await say("stop hints");
  const k = JSON.parse(await p.evaluate(() => window.__board.toolRun("get_hint", {}))); assert.equal(k.text, null);
});

// ---- the reminder ---------------------------------------------------------------------------------------------------------------------------------------
const withPerm = async (fn) => { await p.addInitScript(() => { window.__perm = "granted"; }); await fn(); };
await p.close();
const p2 = await ctx.newPage(); p2.on("pageerror", (e) => errs.push(e.message));
await p2.addInitScript(() => { window.__perm = "granted"; });
await p2.goto(URL); await p2.waitForSelector(".row.pick");
const seed2 = (mut) => p2.evaluate(([KEY, mut]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.me.brief = "00:00"; delete s.me.hints; delete s.me.hintNote;
  const day = new Date(); day.setHours(0, 0, 0, 0); const ids = Object.keys(s.subs), gid = s.groups[0].id; const ev = [];
  for (let o = -14; o <= -1; o++) if (o % 3 !== 0) { const d = new Date(day); d.setDate(d.getDate() + o); ev.push({ t: d.getTime() + 9 * 3600000, k: "done", id: ids[0], g: gid }); }
  s.ev = ev; s.mem = []; s.memAt = new Date().toISOString().slice(0, 10); s.hint = null; s.hintLog = []; delete s.hintAt; s.told = null; s.exp = { active: null, done: [], unseen: false };
  if (mut) eval("(" + mut + ")")(s);
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, mut]).then(() => p2.reload()).then(() => p2.waitForSelector(".row.pick"));
await seed2();
await p2.waitForTimeout(400);
await ok("reminder: opening the board fires the brief; the next tick fires the hint without its ids; then nothing more that day", async () => {
  let n = await p2.evaluate(() => window.__notes.slice()); assert.ok(n.some((x) => x.tag === "oys-brief"), "no brief on load: " + JSON.stringify(n)); assert.ok(!n.some((x) => x.tag === "oys-hint"), "hint must not come with the brief");
  await p2.evaluate(() => { window.__board.remind(); }); await p2.waitForTimeout(300); n = await p2.evaluate(() => window.__notes.slice()); const h = n.find((x) => x.tag === "oys-hint");
  assert.ok(h, JSON.stringify(n)); assert.equal(h.title, "Today\u2019s hint"); assert.match(h.body, /^You finished something on \d+ of the last 14 days\./); assert.ok(!/\[E-/.test(h.body));
  const before = n.length; await p2.evaluate(() => { window.__board.remind(); window.__board.remind(); }); await p2.waitForTimeout(300); assert.equal((await p2.evaluate(() => window.__notes.length)), before);
});
await seed2(`function(s){ s.me.hintNote=false; }`);
await p2.evaluate(() => { window.__notes.length = 0; window.__board.remind(); window.__board.remind(); window.__board.remind(); }); await p2.waitForTimeout(300);
await ok("reminder off for hints: no hint notification, the card still appears", async () => {
  assert.ok(!(await p2.evaluate(() => window.__notes)).some((x) => x.tag === "oys-hint")); await p2.locator("#hint-card").waitFor({ state: "visible", timeout: 3000 });
});
await seed2(`function(s){ s.me.hints=false; }`);
await p2.evaluate(() => { window.__notes.length = 0; window.__board.remind(); window.__board.remind(); window.__board.remind(); }); await p2.waitForTimeout(300);
await ok("hints off: no card and no hint notification", async () => {
  assert.ok(!(await p2.evaluate(() => window.__notes)).some((x) => x.tag === "oys-hint")); assert.equal(await p2.locator("#hint-card").isHidden(), true);
});
await seed2(`function(s){ s.hintLog=[{d:"2026-09-01",type:"progress",key:"k1",ans:"helpful"},{d:"2026-09-02",type:"stalled",key:"k2",ans:"no"}]; }`);
await p2.evaluate(() => { location.hash = "#/planner"; }); await p2.waitForTimeout(300);
await ok("planner: what helps you is shown with counts, and Forget what helps takes two presses and clears it", async () => {
  const t = await p2.locator("#hint-stats").innerText(); assert.match(t, /Evidence of your progress[\s\S]*1 helpful, 0 not for me/); assert.match(t, /A goal that stopped moving[\s\S]*0 helpful, 1 not for me/); assert.match(t, /An idea from the library[\s\S]*not tried yet/);
  const btn = p2.locator("#hint-reset"); await btn.click(); assert.equal((await p2.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).hintLog.length, KEY)), 2); await btn.click(); await p2.waitForTimeout(200);
  assert.equal((await p2.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).hintLog.length, KEY)), 0);
});
await ok("the planner section and the card fit a phone", async () => {
  await p2.setViewportSize({ width: 390, height: 900 }); assert.equal(await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await p2.locator("#hint-panel").screenshot({ path: "/tmp/claude-0/shot-hint.png" });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
