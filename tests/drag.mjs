/* Apple-like step order (2026-10-20): the goal page says the order is the sequence, steps move by dragging a handle,
   and every move (drag, Earlier, Later) can be undone. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.groups = []; s.subs = {}; s.oftad = []; s.plan = []; s.done = []; s.me.guided = true;
  const g = (id, name, steps) => { s.groups.push({ id, name, subs: steps.map((n, i) => id + i), prio: "mid", where: "any", due: "", tags: [] });
    steps.forEach((n, i) => { const d = n.startsWith("DONE"); s.subs[id + i] = { id: id + i, gid: id, name: n, pct: d ? 100 : 0, status: d ? "done" : "todo", tag: "", upd: "2026-10-20" }; }); };
  g("gS", "Shed", ["DONE clear the ground", "Lay the base", "Buy timber", "Build the walls"]); g("gO", "One", ["Only step"]);
  localStorage.setItem(KEY, JSON.stringify(s)); location.hash = "#/goal/gS"; }, KEY);
await p.reload(); await p.waitForSelector("[data-ph=step]");
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const subs = async () => (await st()).groups.find((g) => g.id === "gS").subs;
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250); };
const drag = async (fromSid, toSid) => {
  const a = await p.locator(`.ph-dli[data-sid="${fromSid}"] .ph-grip`).boundingBox(), t = await p.locator(`.ph-dli[data-sid="${toSid}"]`).boundingBox();
  const x = a.x + a.width / 2, y0 = a.y + a.height / 2, y1 = t.y + t.height / 2 + (t.y > a.y ? 8 : -8);
  await p.mouse.move(x, y0); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(x, y0 + (y1 - y0) * i / 8); await p.mouse.up(); await p.waitForTimeout(300); };

await ok("the goal page says the list is the order, in words, when there are 2 or more open steps; not with one", async () => {
  assert.match(await p.locator(".ph-seqnote").innerText(), /Done from top to bottom\. Drag the handle to change the order\./);
  await go("goal/gO"); assert.equal(await p.locator(".ph-seqnote").count(), 0); assert.equal(await p.locator(".ph-grip").count(), 0); await go("goal/gS");
});
await ok("only open steps have a handle; it is 44px or more and hidden from screen readers", async () => {
  assert.equal(await p.locator(".ph-grip").count(), 3);
  const g = await p.locator(".ph-grip").first().boundingBox(); assert.ok(g.width >= 44 && g.height >= 44, JSON.stringify(g));
  assert.equal(await p.locator(".ph-grip").first().getAttribute("aria-hidden"), "true");
});
await ok("dragging a step down puts it there; finished steps keep their place", async () => {
  await drag("gS1", "gS3");
  assert.deepEqual(await subs(), ["gS0", "gS2", "gS3", "gS1"]);
  assert.deepEqual(await p.locator(".ph-ord").allInnerTexts(), ["1", "2", "3"]);
  assert.match(await p.locator(".ph-dli").first().innerText(), /Buy timber/);
});
await ok("the drag can be undone", async () => {
  assert.match(await p.locator("#ph-undo-t").innerText(), /Moved: Lay the base/);
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300); assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]);
});
await ok("dragging up works too, and a short wobble changes nothing", async () => {
  await drag("gS3", "gS1"); assert.deepEqual(await subs(), ["gS0", "gS3", "gS1", "gS2"]);
  const a = await p.locator('.ph-dli[data-sid="gS1"] .ph-grip').boundingBox();
  await p.mouse.move(a.x + 20, a.y + 20); await p.mouse.down(); await p.mouse.move(a.x + 20, a.y + 26); await p.mouse.up(); await p.waitForTimeout(250);
  assert.deepEqual(await subs(), ["gS0", "gS3", "gS1", "gS2"]);
});
await ok("tapping a row still opens the step", async () => {
  await p.locator('.ph-dli[data-sid="gS2"] [data-ph=step]').click(); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(() => location.hash), "#/step/gS2");
});
await ok("Earlier and Later on the step page can be undone too", async () => {
  await p.locator('[data-ph=sorder][data-d="-1"]').click(); await p.waitForTimeout(300);
  assert.deepEqual(await subs(), ["gS0", "gS3", "gS2", "gS1"]); assert.match(await p.locator("#ph-undo-t").innerText(), /Moved earlier/);
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300); assert.deepEqual(await subs(), ["gS0", "gS3", "gS1", "gS2"]);
});
await ok("no sideways scroll, no page errors", async () => {
  await go("goal/gS"); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.deepEqual(errs, []);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
