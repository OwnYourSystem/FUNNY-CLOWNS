import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");

// ---- the statistics ------------------------------------------------------------
const T = (A, B, seed) => p.evaluate(([A, B, s]) => window.__board.exp.test(A, B, s), [A, B, seed]);
await ok("a clear rise is called clear: range above zero, small p", async () => {
  const r = await T([0, 0, 1, 0, 0, 1, 0, 0, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1], "a");
  assert.ok(r.diff > 0.4 && r.lo > 0 && r.p < 0.05, JSON.stringify(r));
});
await ok("identical days: no difference, range straddles zero, p near 1", async () => {
  const x = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0]; const r = await T(x, x, "b");
  assert.equal(r.diff, 0); assert.ok(r.lo < 0 && r.hi > 0 && r.p > 0.9, JSON.stringify(r));
});
await ok("same seed, same answer; the answer does not depend on Math.random", async () => {
  const A = [2, 1, 0, 3, 2, 1], B = [3, 4, 2, 5, 3, 3];
  const r1 = await T(A, B, "seed1");
  const r2 = await p.evaluate(([A, B]) => { const real = Math.random; Math.random = () => 0.123; const r = window.__board.exp.test(A, B, "seed1"); Math.random = real; return r; }, [A, B]);
  assert.deepEqual(r1, r2);
});
await ok("swapping the windows negates the difference", async () => {
  const A = [2, 1, 0, 3, 2, 1], B = [3, 4, 2, 5, 3, 3]; const a = await T(A, B, "s"), c = await T(B, A, "s");
  assert.ok(Math.abs(a.diff + c.diff) < 1e-12);
});
await ok("calibration: with no real change, a clear call is rare (200 null runs, 10 days each)", async () => {
  const r = await p.evaluate(() => {
    let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    let hits = 0; for (let i = 0; i < 200; i++) { const A = [], B = []; for (let k = 0; k < 10; k++) { A.push(rnd() < 0.5 ? 1 : 0); B.push(rnd() < 0.5 ? 1 : 0); } const t = window.__board.exp.test(A, B, "n" + i); if ((t.lo > 0 || t.hi < 0) && t.p < 0.10) hits++; }
    return hits / 200;
  });
  assert.ok(r <= 0.12, "false alarm rate " + r);
});
await ok("power: a big real change (20% against 90%) is found most of the time (100 runs)", async () => {
  const r = await p.evaluate(() => {
    let seed = 777; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    let hits = 0; for (let i = 0; i < 100; i++) { const A = [], B = []; for (let k = 0; k < 10; k++) { A.push(rnd() < 0.2 ? 1 : 0); B.push(rnd() < 0.9 ? 1 : 0); } const t = window.__board.exp.test(A, B, "p" + i); if (t.lo > 0 && t.p < 0.10) hits++; }
    return hits / 100;
  });
  assert.ok(r >= 0.8, "power " + r);
});

// ---- the lifecycle ----------------------------------------------------------------
const reset = () => p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.ev = []; s.exp = { active: null, done: [], unseen: false }; s.dayLog = []; s.cap = null; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const say = (q) => p.evaluate((q) => { try { return window.__board.brain(q); } catch (e) { return e.message; } }, q);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).exp, KEY);
await reset();
await ok("an entry the board cannot measure is refused plainly", async () => { assert.match(await say("try E-BARRIER-01"), /cannot be measured on this board/); });
await ok("an unknown id is refused", async () => { assert.match(await say("try E-NOPE-99"), /has no entry E-NOPE-99/); });
await ok("a measurable entry starts: today, 7 days, outcome fixed from the library", async () => {
  const m = await say("try E-CAP-01"); assert.match(m, /^Started E-CAP-01 for 7 days from today/);
  const x = (await st()).active; assert.equal(x.ev, "E-CAP-01"); assert.equal(x.days, 7); assert.deepEqual(x.outcome, { metric: "completion_days", direction: "up" });
});
await ok("the card shows it, with the day and what is measured", async () => {
  const t = await p.locator("#exp-card").innerText(); assert.match(t, /Experiment\s*[—-]\s*day 1 of 7/i); assert.match(t, /days with at least one thing finished/); assert.match(t, /practitioner opinion/);
});
await ok("only one at a time", async () => { assert.match(await say("try E-FLOOR-01"), /One experiment at a time/); });
await ok("status says where it is and when it will report", async () => { assert.match(await say("how is the experiment going"), /^Day 1 of 7 of E-CAP-01/); });
await ok("the card's Stop needs two presses, then clears", async () => {
  const btn = p.locator("[data-exp-stop]"); await btn.click(); assert.ok((await st()).active); await btn.click(); await p.waitForTimeout(200);
  assert.equal((await st()).active, null); assert.equal(await p.locator("#exp-card").isHidden(), true);
});

// ---- results from a seeded history ------------------------------------------------------
const seed = (cfg) => p.evaluate(([KEY, cfg]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); const gid = s.groups[0].id, id = s.groups[0].subs[0];
  const day = new Date(); day.setHours(0, 0, 0, 0); const at = (off, h) => { const d = new Date(day); d.setDate(d.getDate() + off); d.setHours(h, 5, 0, 0); return d.getTime(); };
  const start = -8; /* started 8 days ago, 7-day experiment: finished yesterday */
  const ev = [];
  const put = (off, done) => { ev.push({ t: at(off, 9), k: "take", id, g: gid, z: "plan" }); if (done) ev.push({ t: at(off, 10), k: "done", id, g: gid }); };
  cfg.before.forEach((v, i) => { if (v !== null) put(start - cfg.before.length + i, v); });
  cfg.during.forEach((v, i) => { if (v !== null) put(start + i, v); });
  if (cfg.fill) { ev.length = 0; for (let i = 0; i < 800; i++) ev.push({ t: at(-5, 0) + i * 400000, k: "take", id, g: gid, z: "plan" }); }  /* a full log that only reaches back 5 days */
  ev.sort((a, b) => a.t - b.t); s.ev = ev.slice(-800);
  const d0 = new Date(day); d0.setDate(d0.getDate() + start); const p2 = (n) => String(n).padStart(2, "0");
  s.exp = { active: { id: "xtest", ev: "E-CAP-01", start: d0.getFullYear() + "-" + p2(d0.getMonth() + 1) + "-" + p2(d0.getDate()), days: 7, outcome: { metric: "completion_days", direction: "up" }, do: "On a day you feel flat, plan one step only." }, done: [], unseen: false };
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, cfg]).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const last = () => st().then((x) => x.done[0]);

await seed({ before: [0, 1, 0, 0, 1, 0, 0], during: [1, 1, 1, 1, 1, 1, 1] });
await ok("a real rise: finished on its own, verdict better, range and sample size in the sentence", async () => {
  const d = await last(); assert.ok(d, "no result stored"); assert.equal(d.result.verdict, "better"); assert.equal(d.result.nBefore, 7); assert.equal(d.result.nDuring, 7);
  const t = await p.locator("#exp-card").innerText();
  assert.match(t, /Experiment finished/); assert.match(t, /100% during, 29% before/); assert.match(t, /90% range/); assert.match(t, /over 7 and 7 active days/); assert.match(t, /looks better than before/); assert.match(t, /not a controlled trial/);
});
await ok("Got it hides the card; status still reads the result", async () => {
  await p.locator("[data-exp-ack]").click(); await p.waitForTimeout(200); assert.equal(await p.locator("#exp-card").isHidden(), true);
  assert.match(await say("how is the experiment going"), /^E-CAP-01 finished\. Completion|^E-CAP-01 finished\. Days with at least one/);
});
await seed({ before: [1, 0, 1, 0, 1, 0, 1], during: [1, 0, 1, 0, 1, 0, 1] });
await ok("no change: verdict unclear and it says no clear difference", async () => { const d = await last(); assert.equal(d.result.verdict, "unclear"); assert.match(await p.locator("#exp-card").innerText(), /No clear difference/); });
await seed({ before: [1, 1, 1, 1, 1, 1, 1], during: [0, 0, 1, 0, 0, 0, 0] });
await ok("a real fall is called worse, not hidden", async () => { const d = await last(); assert.equal(d.result.verdict, "worse"); assert.match(await p.locator("#exp-card").innerText(), /looks worse than before/); });
await seed({ before: [1, null, null, 0, null, null, null], during: [1, 1, 1, 1, 1, 1, 1] });
await ok("too few days before: not enough, with the counts, and no verdict of better", async () => {
  const d = await last(); assert.equal(d.result.verdict, "not_enough"); assert.equal(d.result.nBefore, 2);
  const t = await p.locator("#exp-card").innerText(); assert.match(t, /Not enough to say/); assert.match(t, /active on 2 days before and 7 during/); assert.ok(!/looks better/.test(t));
});
await seed({ before: [0, 1, 0, 0, 1, 0, 0], during: [1, 1, 1, 1, 1, 1, 1], fill: true });
await ok("a log that does not reach back far enough says so instead of guessing", async () => {
  const d = await last(); assert.equal(d.result.verdict, "not_enough"); assert.match(d.result.why || "", /does not reach back/);
});

// ---- the page still behaves ---------------------------------------------------------------
await reset();
await ok("the tutor tools exist and the status tool is read-only JSON", async () => {
  const s = await p.evaluate(() => JSON.stringify(window.__board.exp.status())); assert.deepEqual(JSON.parse(s), { state: "none" });
});
await ok("the card fits a phone screen", async () => {
  await p.setViewportSize({ width: 390, height: 900 }); await say("try E-CAP-01"); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await p.locator("#exp-card").screenshot({ path: "/tmp/claude-0/shot-exp.png" });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
