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
const seed = (mut, done = true) => p.evaluate(([KEY, mut, done]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = done; delete s.floor; s.ev = []; s.cap = null; s.capLog = []; s.dayLog = []; s.plan = []; s.oftad = []; s.done = [];
  s.me.hints = false; s.me.barrier = false; s.me.learn = false; s.hint = null; s.mem = []; s.exp = { active: null, done: [], unseen: false };
  if (mut) eval("(" + mut + ")")(s);
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, mut, done]).then(() => p.evaluate(() => { location.hash = "#/board"; })).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const strip = () => p.locator("#floor"); const D = () => p.locator("dialog.ask[open]"); const settle = () => p.waitForTimeout(200);
const today = () => p.evaluate(() => { const n = new Date(), q = (x) => String(x).padStart(2, "0"); return n.getFullYear() + "-" + q(n.getMonth() + 1) + "-" + q(n.getDate()); });
const ago = (n) => p.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); const q = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); }, n);

await seed(null, false);
await ok("it stays out of the way until the planner has met you", async () => { assert.equal(await strip().isHidden(), true); });
await seed();
await ok("empty: one quiet line offers to set it, and nothing is invented", async () => {
  assert.equal(await strip().isVisible(), true); assert.match(await strip().innerText(), /Set a minimum day/); assert.equal(await strip().locator("[data-floor]").count(), 0);
  assert.deepEqual((await st()).floor === undefined ? { items: [] } : (await st()).floor.items ? { items: (await st()).floor.items } : {}, { items: [] });
});
await ok("the dialog has 4 boxes with suggestions; Not now changes nothing", async () => {
  await strip().locator("[data-floor-edit]").click(); await D().waitFor(); assert.equal(await D().locator("[data-ak]").count(), 4);
  assert.match(await D().innerText(), /these are enough/); assert.match(await D().locator('[data-ak="a0"]').getAttribute("placeholder"), /body/);
  await p.keyboard.press("Escape"); await settle(); assert.match(await strip().innerText(), /Set a minimum day/);
});
await ok("save 3 anchors: chips in your own words, none ticked, the event log has no words", async () => {
  await strip().locator("[data-floor-edit]").click(); await D().waitFor();
  await D().locator('[data-ak="a0"]').fill("Eat a proper meal"); await D().locator('[data-ak="a1"]').fill("Reply to the one email that matters"); await D().locator('[data-ak="a2"]').fill("Ten minutes outside"); await D().locator("[data-aok]").click(); await settle();
  assert.equal(await strip().locator("[data-floor]").count(), 3); assert.match(await strip().innerText(), /0 of 3/i); assert.equal(await strip().locator('[aria-pressed="true"]').count(), 0);
  const s = await st(); assert.deepEqual(s.floor.items.map((x) => x.t), ["Eat a proper meal", "Reply to the one email that matters", "Ten minutes outside"]);
  assert.ok(!JSON.stringify(s.ev).includes("meal")); assert.equal(s.ev.filter((e) => e.k === "floor" && e.act === "set").length, 1);
});
await ok("over 60 characters is refused; duplicates and blanks are dropped", async () => {
  await strip().locator("[data-floor-edit]").first().click(); await D().waitFor(); await D().locator('[data-ak="a3"]').fill("x".repeat(61)); await D().locator("[data-aok]").click(); await settle();
  assert.equal(await D().count(), 1); assert.match(await D().locator(".ask-err").innerText(), /under 60/);
  await D().locator('[data-ak="a3"]').fill("ten minutes OUTSIDE"); await D().locator("[data-aok]").click(); await settle();
  assert.equal((await st()).floor.items.length, 3, "a duplicate in other case is not added");
});
await ok("tapping an anchor ticks it, and the count and the log follow; no words in the log", async () => {
  const chip = strip().locator("[data-floor]").first(); await chip.click(); await settle();
  assert.equal(await strip().locator("[data-floor]").first().getAttribute("aria-pressed"), "true"); assert.match(await strip().innerText(), /1 of 3/i);
  const s = await st(), t = await today(); assert.equal(s.floor.log[t].d.length, 1); const e = s.ev.filter((x) => x.k === "floor" && x.act === "on"); assert.equal(e.length, 1); assert.ok(!JSON.stringify(s.ev).includes("proper meal"));
});
await ok("all ticked: it says so and that counts; unticking takes it back", async () => {
  for (const i of [1, 2]) { await strip().locator("[data-floor]").nth(i).click(); await settle(); }
  assert.match(await strip().innerText(), /3 of 3/i); assert.match(await strip().innerText(), /That counts as a day, whatever else happened/); assert.equal(await p.evaluate(() => window.__board.floor.met()), true);
  await strip().locator("[data-floor]").nth(2).click(); await settle(); assert.equal(await p.evaluate(() => window.__board.floor.met()), false); assert.ok(!/That counts as a day/.test(await strip().innerText()));
});
await ok("it survives a reload with today's ticks", async () => { await p.reload(); await p.waitForSelector(".row.pick"); assert.match(await strip().innerText(), /2 of 3/i); });
await ok("editing keeps the ticks of anchors whose words did not change, and drops a removed anchor from the count", async () => {
  await strip().locator("[data-floor-edit]").click(); await D().waitFor(); await D().locator('[data-ak="a2"]').fill(""); await D().locator("[data-aok]").click(); await settle();
  assert.match(await strip().innerText(), /2 of 2/i); assert.equal(await strip().locator('[aria-pressed="true"]').count(), 2);
  await strip().locator("[data-floor-edit]").click(); await D().waitFor(); await D().locator('[data-ak="a0"]').fill("Eat a proper meal"); await D().locator('[data-ak="a2"]').fill("A new one"); await D().locator("[data-aok]").click(); await settle();
  assert.match(await strip().innerText(), /2 of 3/i);
});
await ok("a low day says these are enough; a normal day does not", async () => {
  assert.ok(!/low day/i.test(await strip().innerText()));
  await seed(`(s) => { s.floor = { items: [{ id: "f1", t: "Water" }], log: {} }; const n = new Date(), q = (x) => String(x).padStart(2, "0"); s.cap = { d: n.getFullYear() + "-" + q(n.getMonth() + 1) + "-" + q(n.getDate()), mode: "low" }; }`);
  assert.match(await strip().innerText(), /A low day: these are enough/);
});
await ok("the last 14 days: only days it was opened count, and only complete days are met", async () => {
  const d = [await ago(1), await ago(2), await ago(3), await ago(4), await ago(20)];
  await seed(`(s) => { s.floor = { items: [{ id: "a", t: "A" }, { id: "b", t: "B" }], log: { "${d[0]}": { d: ["a", "b"], n: 2 }, "${d[1]}": { d: ["a"], n: 2 }, "${d[2]}": { d: ["a", "b"], n: 2 }, "${d[4]}": { d: ["a", "b"], n: 2 } } }; }`);
  assert.match(await strip().innerText(), /Met on 2 of the last 14 days/);
  const r = await p.evaluate(() => window.__board.floor.days(14)); assert.deepEqual(r, { met: 2, seen: 3 });
});
await ok("a day it was not opened is not a failure: no log, no number", async () => {
  await seed(`(s) => { s.floor = { items: [{ id: "a", t: "A" }], log: {} }; }`); assert.ok(!/Met on/.test(await strip().innerText()));
});
await ok("old days are dropped after 60", async () => {
  const old = await ago(70), keep = await ago(10);
  await seed(`(s) => { s.floor = { items: [{ id: "a", t: "A" }], log: { "${old}": { d: ["a"], n: 1 }, "${keep}": { d: ["a"], n: 1 } } }; }`);
  await p.locator("[data-floor]").click(); await settle(); const f = (await st()).floor; assert.ok(!f.log[old]); assert.ok(f.log[keep]);
});
await ok("clearing every box switches it off", async () => {
  await seed(`(s) => { s.floor = { items: [{ id: "a", t: "A" }], log: {} }; }`);
  await strip().locator("[data-floor-edit]").click(); await D().waitFor(); await D().locator('[data-ak="a0"]').fill(""); await D().locator("[data-aok]").click(); await settle();
  assert.match(await strip().innerText(), /Set a minimum day/); assert.deepEqual((await st()).floor.items, []);
});
await ok("an unknown anchor id is refused", async () => { assert.match(await p.evaluate(() => { try { window.__board.floor.toggle("nope"); return "ok"; } catch (e) { return e.message; } }), /not on your minimum day/); });
await ok("anchors are escaped, and the strip and dialog fit a phone", async () => {
  await seed(`(s) => { s.floor = { items: [{ id: "a", t: "<img src=x onerror=window.__x=1> and a long long long anchor to wrap" }, { id: "b", t: "Second" }], log: {} }; }`);
  assert.equal(await strip().locator("img").count(), 0); assert.equal(await p.evaluate(() => window.__x), undefined);
  await p.setViewportSize({ width: 412, height: 820 }); await settle();
  const r = await p.evaluate(() => ({ sx: document.documentElement.scrollWidth, w: innerWidth })); assert.ok(r.sx <= r.w, JSON.stringify(r));
  await strip().locator("[data-floor-edit]").click(); await D().waitFor(); await p.waitForTimeout(350); const r2 = await p.evaluate(() => ({ sx: document.documentElement.scrollWidth, w: innerWidth })); assert.ok(r2.sx <= r2.w, JSON.stringify(r2));
  await p.keyboard.press("Escape"); await settle(); await p.setViewportSize({ width: 1280, height: 1100 });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
