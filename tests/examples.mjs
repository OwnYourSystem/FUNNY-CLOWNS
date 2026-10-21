/* Example goals to tap (2026-10-21, the last "cannot type" gap): the first goal can be set up with taps only.
   A tap fills the goal, its first step and Is it work?; the words stay editable; a screen reader hears what was filled. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const ex = (i) => p.locator(`[data-ph=onb-ex][data-i="${i}"]`);
const checked = (v) => p.locator(`[data-ph=onb-pick][data-k=where][data-v="${v}"]`).getAttribute("aria-checked");
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);

await ok("the first-goal screen offers 6 example goals, each with a first step, 44px or taller, in a named group", async () => {
  assert.equal(await p.locator("[data-ph=onb-ex]").count(), 6);
  assert.equal(await p.locator(".ph-exs").getAttribute("aria-label"), "Example goals");
  const r = await p.locator("[data-ph=onb-ex]").evaluateAll((l) => l.map((e) => ({ h: e.getBoundingClientRect().height, t: e.innerText, pr: e.getAttribute("aria-pressed") })));
  for (const x of r) { assert.ok(x.h >= 44, JSON.stringify(x)); assert.match(x.t, /\n/); assert.equal(x.pr, "false"); }
  assert.match(await p.locator(".ph-lede").innerText(), /Pick an example, say it or type it/);
});
await ok("a tap fills the goal, its first step and Is it work, marks the example, and says what was filled", async () => {
  await ex(0).click(); await p.waitForTimeout(250);
  assert.equal(await p.locator("#ph-goal").inputValue(), "Tidy the home"); assert.equal(await p.locator("#ph-step").inputValue(), "Clear one shelf");
  assert.equal(await checked("any"), "true"); assert.equal(await ex(0).getAttribute("aria-pressed"), "true");
  assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-i")), "0", "focus did not stay on the example");
  assert.match(await p.locator("#ph-onb-hint").innerText(), /^Filled in: Tidy the home, and first clear one shelf\./);
});
await ok("another example replaces it; a work example sets Is it work to Work", async () => {
  await ex(2).click(); await p.waitForTimeout(250);
  assert.equal(await p.locator("#ph-goal").inputValue(), "Finish a work project"); assert.equal(await checked("work"), "true");
  assert.equal(await ex(0).getAttribute("aria-pressed"), "false"); assert.equal(await ex(2).getAttribute("aria-pressed"), "true");
});
await ok("Show me today adds the example as the first goal and step, with no typing", async () => {
  await ex(1).click(); await p.waitForTimeout(250); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(600);
  const s = await st(); const g = s.groups.find((x) => x.name === "Get a bit fitter"); assert.ok(g, "no goal"); assert.equal(g.where, "any");
  assert.ok(g.subs.some((id) => s.subs[id] && s.subs[id].name === "A 10-minute walk"));
  assert.equal(await p.evaluate(() => location.hash), "#/now");
});
await ok("the words stay the person's own: an example changed before Show me today is saved as changed", async () => {
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await c2.newPage();
  try {
    await q.goto(URL); await q.waitForSelector("#ph-main .ph-onb"); await q.locator("[data-ph=onb-next]").click(); await q.waitForTimeout(250);
    await q.locator('[data-ph=onb-ex][data-i="3"]').click(); await q.waitForTimeout(250);
    await q.fill("#ph-goal", "Learn Italian"); await q.locator("[data-ph=onb-done]").click(); await q.waitForTimeout(600);
    const s = await q.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
    const g = s.groups.find((x) => x.name === "Learn Italian"); assert.ok(g); assert.ok(g.subs.some((id) => s.subs[id] && s.subs[id].name === "Pick a short course"));
    assert.ok(!s.groups.some((x) => x.name === "Learn something new"));
  } finally { await c2.close(); }
});
await ok("no sideways scroll on the screen, and no page errors", async () => {
  const c3 = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }); const q = await c3.newPage();
  try { await q.goto(URL); await q.waitForSelector("#ph-main .ph-onb"); await q.locator("[data-ph=onb-next]").click(); await q.waitForTimeout(250);
    assert.equal(await q.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "320px wide"); } finally { await c3.close(); }
  assert.deepEqual(errs, []);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
