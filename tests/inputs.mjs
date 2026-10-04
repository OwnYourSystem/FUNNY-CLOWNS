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
const seed = (mut) => p.evaluate(([KEY, mut]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.ev = []; s.when = {}; s.est = { items: {}, pairs: [], ask: null };
  s.done = []; s.plan = []; s.oftad = []; s.cap = null; s.capLog = []; s.dayLog = []; s.skip = null; s.mem = []; s.hint = null; s.hintLog = []; s.exp = { active: null, done: [], unseen: false };
  s.me.hints = false; s.me.barrier = false; s.me.learn = false;
  if (mut) eval("(" + mut + ")")(s);
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, mut]).then(() => p.evaluate(() => { location.hash = "#/board"; })).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const card = () => p.locator("#oftad-pick"); const follow = () => p.locator("#est-follow");
const D = () => p.locator("dialog.ask[open]");
const stepId = () => card().locator("[data-pick-take]").getAttribute("data-pick-take");
const stepName = () => card().locator(".pick-n").innerText();
const settle = () => p.waitForTimeout(200);

await seed();
await ok("the card offers When? and How long? beside the step", async () => {
  assert.equal(await card().locator("[data-when]").innerText(), "When?"); assert.equal(await card().locator("[data-est]").innerText(), "How long?");
});
await ok("When?: the dialog names the step; Not now changes nothing; Save shows it beside the step", async () => {
  const name = await stepName(); await card().locator("[data-when]").click(); await D().waitFor(); assert.match(await D().innerText(), new RegExp("Step: " + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await p.keyboard.press("Escape"); await settle(); assert.deepEqual((await st()).when, {});
  await card().locator("[data-when]").click(); await D().waitFor(); await D().locator('[data-ak="t"]').fill("After I pour my coffee"); await D().locator("[data-aok]").click(); await settle();
  const id = await stepId(); const s = await st(); assert.equal(s.when[id].t, "After I pour my coffee");
  assert.match(await card().locator(".now-plan").innerText(), /When: After I pour my coffee/); assert.equal(await card().locator("[data-when]").innerText(), "Change when");
});
await ok("the event log notes that it was set, and never the words", async () => {
  const s = await st(); const e = s.ev.filter((x) => x.k === "when"); assert.equal(e.length, 1); assert.equal(e[0].act, "set"); assert.ok(!JSON.stringify(s.ev).includes("coffee"));
});
await ok("an empty answer removes it; more than 80 characters is refused and the dialog stays", async () => {
  await card().locator("[data-when]").click(); await D().waitFor(); await D().locator('[data-ak="t"]').fill("x".repeat(81)); await D().locator("[data-aok]").click(); await settle();
  assert.equal(await D().count(), 1); assert.match(await D().locator(".ask-err").innerText(), /under 80/);
  await D().locator('[data-ak="t"]').fill(""); await D().locator("[data-aok]").click(); await settle();
  assert.deepEqual((await st()).when, {}); assert.equal(await card().locator(".now-plan").count(), 0);
});
await ok("what you type is escaped on the card", async () => {
  await card().locator("[data-when]").click(); await D().waitFor(); await D().locator('[data-ak="t"]').fill("<img src=x onerror=window.__x=1>"); await D().locator("[data-aok]").click(); await settle();
  assert.equal(await card().locator("img").count(), 0); assert.equal(await p.evaluate(() => window.__x), undefined); assert.match(await card().locator(".now-plan").innerText(), /<img/);
});
await ok("it lapses when the step is done, after 14 days, and keeps to 12", async () => {
  const r = await p.evaluate(() => {
    const B = window.__board, ids = Object.keys(JSON.parse(localStorage.getItem("oys-min-deliveries-v1")).subs).slice(0, 14);
    ids.forEach((id) => { B.when.set(id, "cue " + id); });
    const n = Object.keys(B.when.map()).length; const first = ids[0];
    return { n, firstKept: !!B.when.map()[first], lastKept: !!B.when.map()[ids[13]] };
  });
  assert.equal(r.n, 12); assert.equal(r.lastKept, true);
  const r2 = await p.evaluate(() => { const B = window.__board, m = B.when.map(), id = Object.keys(m)[0]; m[id].d = "2000-01-01"; const ch = B.when.tidy(); return { ch, gone: !B.when.map()[id] }; });
  assert.equal(r2.ch, true); assert.equal(r2.gone, true);
});

// ---- how long ---------------------------------------------------------------------------------------------------------------------------------
await seed();
await ok("How long?: refuses nonsense, saves a guess, and shows it", async () => {
  await card().locator("[data-est]").click(); await D().waitFor(); assert.match(await D().innerText(), /After 5 steps with a guess and a result/);
  for (const bad of ["0", "601", "2.5", ""]) { await D().locator('[data-ak="m"]').fill(bad); await D().locator("[data-aok]").click(); await settle(); assert.equal(await D().count(), 1, "accepted " + JSON.stringify(bad)); assert.ok((await D().locator(".ask-err").innerText()).length > 0); }
  await D().locator('[data-ak="m"]').fill("25"); await D().locator("[data-aok]").click(); await settle();
  assert.match(await card().locator(".now-plan").innerText(), /About 25 min/); assert.equal(await card().locator("[data-est]").innerText(), "Change guess");
  const id = await stepId(); assert.equal((await st()).est.items[id].m, 25);
});
await ok("finishing a step that has a guess asks once, quietly; Escape in the dialog keeps the question", async () => {
  const name = await stepName(); await p.evaluate((n) => window.__board.toolRun("mark_done_today", { subtask: n }), name); await settle();
  const f = follow(); await f.waitFor({ state: "visible" }); assert.match(await f.innerText(), /About how long did it take\? You guessed 25 min/);
  await f.locator("[data-est-log]").click(); await D().waitFor(); assert.match(await D().innerText(), /You guessed 25 minutes/); await p.keyboard.press("Escape"); await settle();
  assert.equal(await follow().isVisible(), true);
});
await ok("an answer is kept as a pair, and the question and the guess are cleared", async () => {
  await follow().locator("[data-est-log]").click(); await D().waitFor(); await D().locator('[data-ak="a"]').fill("40"); await D().locator("[data-aok]").click(); await settle();
  const s = await st(); assert.deepEqual(s.est.pairs.map((x) => [x.m, x.a]), [[25, 40]]); assert.equal(s.est.ask, null); assert.deepEqual(s.est.items, {});
  assert.equal(await follow().isVisible(), false);
  assert.ok(!/"m":25|"a":40/.test(JSON.stringify(s.ev)), "no minutes in the event log");
});
await ok("Skip clears the question and the guess without making a pair", async () => {
  /* a different step from the one already finished (a repeating step would not cross into Done twice) */
  await p.evaluate(() => { const B = window.__board, s = JSON.parse(localStorage.getItem("oys-min-deliveries-v1")), doneIds = (s.done || []).map((c) => c.id); const sb = Object.values(s.subs).find((q) => !doneIds.includes(q.id) && (q.pct || 0) < 100 && q.status !== "done"); B.est.set(sb.id, 30); B.toolRun("mark_done_today", { subtask: sb.name }); });
  await settle(); await follow().waitFor({ state: "visible" });
  await follow().locator("[data-est-skip]").click(); await settle(); const s = await st(); assert.equal(s.est.pairs.length, 1); assert.equal(s.est.ask, null); assert.deepEqual(s.est.items, {});
});
await ok("under 5 pairs the board says it cannot compare yet; from 5 it reports the middle ratio in your own numbers", async () => {
  const r = await p.evaluate(() => { const B = window.__board; const x = B.est.state(); const a = B.est.ratio(); x.pairs = [{ m: 20, a: 30 }, { m: 20, a: 30 }, { m: 20, a: 30 }, { m: 20, a: 30 }]; const b = B.est.ratio(); x.pairs.push({ m: 20, a: 10 }); const c = B.est.ratio(); return { a, b, c, line: B.est.line(25) }; });
  assert.equal(r.a.ratio, null); assert.equal(r.b.ratio, null); assert.equal(r.b.n, 4); assert.equal(r.c.ratio, 1.5);
  assert.match(r.line, /last 5 steps, what happened was about 1\.5 times your guess, so a guess of 25 minutes has meant about 40/); assert.match(r.line, /your own record, not anyone else's/);
  assert.ok(!/stud|research|science|evidence|proven/i.test(r.line), "no evidence claim: " + r.line);
});
await ok("with a record, the dialog and the card say what usually happens", async () => {
  await seed(`(s) => { s.est.pairs = [20,20,20,20,20].map((m) => ({ m, a: 30, d: "2026-10-01" })); }`);
  await card().locator("[data-est]").click(); await D().waitFor(); assert.match(await D().innerText(), /about 1\.5 times your guess/);
  await D().locator('[data-ak="m"]').fill("20"); await D().locator("[data-aok]").click(); await settle();
  assert.match(await card().locator(".now-plan").innerText(), /About 20 min \(yours usually run 1\.5 times the guess, so nearer 30\)/);
});
await ok("a guess for a step that is gone is dropped", async () => {
  const r = await p.evaluate(() => { const B = window.__board, x = B.est.state(); x.items["nope"] = { m: 10, d: "2026-10-01" }; x.ask = "nope"; const ch = B.est.tidy(); return { ch, items: Object.keys(x.items), ask: x.ask }; });
  assert.equal(r.ch, true); assert.ok(!r.items.includes("nope")); assert.equal(r.ask, null);
});
await ok("the card and dialog fit a phone, with no sideways scroll", async () => {
  await seed(); await p.setViewportSize({ width: 412, height: 820 }); await p.waitForTimeout(200);
  await card().locator("[data-est]").click(); await D().waitFor(); await p.waitForTimeout(350);
  const r = await p.evaluate(() => ({ sx: document.documentElement.scrollWidth, w: innerWidth })); assert.ok(r.sx <= r.w, JSON.stringify(r));
  await p.keyboard.press("Escape"); await settle(); await p.setViewportSize({ width: 1280, height: 1100 });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
