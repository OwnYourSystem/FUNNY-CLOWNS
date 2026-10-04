import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 1100 } })).newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");

/* low: days back that were low (default: yesterday and the day before); todayLow: whether today is made low by a tap */
const seed = (o = {}) => p.evaluate(([KEY, o]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; delete s.me.barrier; delete s.me.hints;
  const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  s.bandLog = {}; (o.low || [-1, -2]).forEach((n) => { s.bandLog[iso(n)] = "low"; }); (o.normal || []).forEach((n) => { s.bandLog[iso(n)] = "normal"; });
  s.cap = o.todayLow === false ? null : { d: iso(0), mode: "low" };
  s.barrier = o.barrier || { asked: [], next: "", show: null, force: false };
  s.mem = []; s.memNo = {}; s.memAt = iso(0); s.hint = null; s.hintLog = []; s.hintAt = iso(0); s.exp = { active: null, done: [], unseen: false };
  s.ev = []; s.dayLog = []; s.capLog = [];
  if (o.mut) eval("(" + o.mut + ")")(s);
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, o]).then(() => p.evaluate(() => { location.hash = "#/board"; })).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const card = () => p.locator("#barrier-card");
const say = (q) => p.evaluate((q) => { try { return window.__board.brain(q); } catch (e) { return e.message; } }, q);

// ---- when it asks ---------------------------------------------------------------------------------------------
await seed();
await ok("three low days in a row (today included): it asks, in plain words, with five answers and Not now", async () => {
  await card().waitFor({ state: "visible", timeout: 3000 });
  const t = await card().innerText(); assert.match(t, /Three low days in a row/); assert.match(t, /information, not a failure/); assert.match(t, /What is closest to what is in the way\?/);
  for (const l of ["I can’t", "I’m afraid of it", "I don’t know how", "I don’t want to", "Just a rough patch", "Not now"]) assert.ok(t.includes(l), l);
});
await seed({ low: [-1] });
await ok("two low days: it does not ask", async () => { assert.equal(await card().isHidden(), true); });
await seed({ low: [-1, -3], normal: [-2] });
await ok("a normal day in between breaks the run", async () => { assert.equal(await card().isHidden(), true); });
await seed({ low: [-1, -2], todayLow: false });
await ok("today not low: it does not ask, even after two low days", async () => { assert.equal(await card().isHidden(), true); });
await seed({ low: [-1, -3] });
await ok("a gap of up to 3 days without opening does not break the run", async () => { await card().waitFor({ state: "visible", timeout: 3000 }); });
await seed({ low: [-1, -6] });
await ok("a gap of more than 3 days does", async () => { assert.equal(await card().isHidden(), true); });

// ---- the answers --------------------------------------------------------------------------------------------------------
const answers = { cant: ["E-CAP-01", "E-CYCLE-01"], afraid: ["E-STRETCH-01", "E-START-01"], how: ["E-STRETCH-01", "E-ONE-01"], want: ["E-CHOICE-01"], patch: ["E-GUILT-01"] };
for (const [k, ids] of Object.entries(answers)) {
  await seed();
  await ok("answer '" + k + "': logged, and the board offers " + ids.join(" and ") + ", checked, no clinical word", async () => {
    await card().waitFor({ state: "visible", timeout: 3000 });
    await p.locator('[data-bar="' + k + '"]').click(); await p.waitForTimeout(200);
    const s = await st(); assert.equal(s.barrier.asked.length, 1); assert.equal(s.barrier.asked[0].why, k); assert.equal(s.barrier.asked[0].streak, 3);
    assert.ok(s.ev.some((e) => e.k === "barrier" && e.why === k), "no event");
    const t = await card().innerText(); assert.match(t, /Thank you for saying/); ids.forEach((id) => assert.ok(t.includes("[" + id + "]"), id + " missing"));
    const chk = await p.evaluate((x) => window.__board.check(x, { history: false, src: "" }), s.barrier.show.text); assert.ok(chk.ok, chk.why);
    assert.ok(!/depress|diagnos|disorder|anxiety|medicat/i.test(s.barrier.show.text));
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 14); assert.equal(s.barrier.next, tomorrow.getFullYear() + "-" + String(tomorrow.getMonth() + 1).padStart(2, "0") + "-" + String(tomorrow.getDate()).padStart(2, "0"));
  });
}
await seed();
await ok("'I don't want to' tells you a goal can go to the Backlog", async () => {
  await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator('[data-bar="want"]').click(); await p.waitForTimeout(200);
  assert.match(await card().innerText(), /move a goal to the Backlog: open it and press Move to backlog/);
});
await ok("Try it starts the offered experiment; Got it would have cleared the card; the question is not asked again for 14 days", async () => {
  await seed(); await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator('[data-bar="cant"]').click(); await p.waitForTimeout(200);
  await p.locator("[data-bar-try]").click(); await p.locator("dialog.ask[open] [data-aok]").waitFor(); await p.locator("dialog.ask[open] [data-aok]").click(); await p.waitForTimeout(250);
  const s = await st(); assert.equal(s.exp.active.ev, "E-CAP-01"); assert.equal(s.barrier.show, null); assert.equal(await card().isHidden(), true);
  await p.reload(); await p.waitForSelector(".row.pick"); assert.equal(await card().isHidden(), true);
});
await ok("Got it clears the follow-up", async () => {
  await seed(); await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator('[data-bar="patch"]').click(); await p.waitForTimeout(200);
  await p.locator("[data-bar-ok]").click(); await p.waitForTimeout(200); assert.equal(await card().isHidden(), true); assert.equal((await st()).barrier.show, null);
});
await ok("Not now: nothing is recorded as an answer, and it waits 7 days", async () => {
  await seed(); await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator("[data-bar-later]").click(); await p.waitForTimeout(200);
  const s = await st(); assert.equal(s.barrier.asked.length, 0); const d = new Date(); d.setDate(d.getDate() + 7);
  assert.equal(s.barrier.next, d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")); assert.equal(await card().isHidden(), true);
});

// ---- the plain line about talking to someone --------------------------------------------------------------------------------------
await seed({ low: [-1, -2, -3, -4] });
await ok("five low days in a row: the answer adds the line about talking to someone you trust, without saying why", async () => {
  await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator('[data-bar="cant"]').click(); await p.waitForTimeout(200);
  const t = await card().innerText(); assert.match(t, /worth talking to someone you trust or a professional\. I cannot tell you why it is happening/);
});
await seed({ barrier: { asked: [{ d: new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10), why: "cant", streak: 3 }, { d: new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 10), why: "patch", streak: 3 }], next: "", show: null, force: false } });
await ok("asked twice already in 28 days: the line appears even on a short run", async () => {
  await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator('[data-bar="patch"]').click(); await p.waitForTimeout(200);
  assert.match(await card().innerText(), /worth talking to someone you trust or a professional/);
});
await seed();
await ok("three low days alone: no such line", async () => {
  await card().waitFor({ state: "visible", timeout: 3000 }); await p.locator('[data-bar="afraid"]').click(); await p.waitForTimeout(200);
  assert.ok(!/talking to someone/.test(await card().innerText()));
});

// ---- priority, controls, chat, tool -------------------------------------------------------------------------------------------------------
await seed({ mut: `function(s){ s.mem=[{id:"p1",t:"Mornings are for deep work",src:"tutor",st:"proposed",d:new Date().toISOString().slice(0,10),seen:new Date().toISOString().slice(0,10)}]; }` });
await ok("a memory question that is waiting comes first: the check-in stays hidden", async () => { assert.equal(await card().isHidden(), true); });
await seed({ mut: `function(s){ const h=new Date().toISOString().slice(0,10); s.hint={d:h,type:"progress",key:"progress",t:"You finished something on 5 of the last 14 days. Writing that down is the point [E-EVID-01].",evid:"5 of the last 14 days had at least one finished item.",cite:"E-EVID-01",ans:null,acted:false}; }` });
await ok("while the check-in is open the hint card waits", async () => { await card().waitFor({ state: "visible", timeout: 3000 }); assert.equal(await p.locator("#hint-card").isHidden(), true); });
await seed({ mut: `function(s){ s.me.barrier=false; }` });
await ok("switched off in the Planner: it never asks", async () => { assert.equal(await card().isHidden(), true); });
await ok("the Planner toggle exists and flips it", async () => {
  await p.evaluate(() => { location.hash = "#/planner"; }); await p.waitForTimeout(250);
  assert.match(await p.locator("#bar-on").innerText(), /check-in off/i); await p.locator("#bar-on").click(); await p.waitForTimeout(150);
  assert.equal((await st()).me.barrier, true); assert.match(await p.locator("#bar-on").innerText(), /check-in on/i);
});
await seed({ low: [-1], todayLow: false });
await ok("chat: 'afraid' on its own does nothing unless the question is open; 'ask me why' opens it, then the answer works", async () => {
  assert.equal(await say("afraid"), null);
  assert.match(await say("ask me why"), /^What is closest to what is in the way\?/);
  const r = await say("afraid"); assert.match(r, /Fear usually wants a smaller first step/); assert.match(r, /\[E-STRETCH-01\]/); assert.equal((await st()).barrier.asked[0].why, "afraid");
  assert.equal(await say("afraid"), null);
});
await seed();
await ok("barrier_status tells the tutor the state and never a cause", async () => {
  const j = JSON.parse(await p.evaluate(() => window.__board.toolRun("barrier_status", {}))); assert.equal(j.pending, true); assert.equal(j.low_days_in_a_row, 3); assert.equal(j.on, true); assert.deepEqual(j.asked_recently, []);
});
await ok("old days are pruned from the band log after 30 days", async () => {
  await seed({ mut: `function(s){ const o=new Date(); o.setDate(o.getDate()-45); s.bandLog[o.toISOString().slice(0,10)]="low"; }` });
  const keys = Object.keys((await st()).bandLog); assert.ok(keys.every((d) => d >= new Date(Date.now() - 31 * 864e5).toISOString().slice(0, 10)), keys.join());
});
await ok("the card fits a phone", async () => {
  await seed(); await card().waitFor({ state: "visible", timeout: 3000 }); await p.setViewportSize({ width: 390, height: 900 });
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false); await card().screenshot({ path: "/tmp/claude-0/shot-barrier.png" });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
