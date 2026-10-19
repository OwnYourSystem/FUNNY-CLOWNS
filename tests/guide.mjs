/* The first-time guide on the phone (2026-10-19): value first (welcome, first goal, Now), then the web interview's questions from a Set up your week card. */
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
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const step = () => p.locator(".ph-steps").getAttribute("aria-label");
const next = async () => { await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250); };
const h1 = () => p.locator("#ph-main h1").first().innerText();

await ok("value first: a first open is 2 screens, the welcome and the first goal with where it can be done", async () => {
  assert.equal(await step(), "Step 1 of 2"); await next();
  assert.equal(await h1(), "What are you working on?"); assert.equal(await step(), "Step 2 of 2");
  await p.locator("[data-ph=onb-back]").click(); await p.waitForTimeout(250); assert.equal(await step(), "Step 1 of 2"); await next();
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber");
  await p.locator('[data-ph=onb-pick][data-k="where"][data-v="home"]').click(); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(500);
  const s = await st(); assert.equal(s.me.done, true); assert.ok(!s.me.guided); assert.equal(s.groups.find((g) => g.name === "Garden Shed").where, "home");
});
await ok("Now shows a real next step at once, and Set up your week right under the date", async () => {
  assert.equal(await p.evaluate(() => location.hash), "#/now");
  assert.equal(await p.locator(".ph-guide").isVisible(), true); assert.ok((await p.locator("[aria-label='Do this now']").count()) === 1, "no next step on Now");
  const order = await p.evaluate(() => { const g = document.querySelector(".ph-guide"), d = document.querySelector("[aria-label='Do this now']"); return g.getBoundingClientRect().top < d.getBoundingClientRect().top; });
  assert.ok(order, "the card is not above the next step");
});
await ok("the guide from the card: 5 screens, Later first; Your work checks days, hours and travel", async () => {
  await p.locator(".ph-guide [data-ph=guide]").click(); await p.waitForTimeout(300);
  assert.equal(await h1(), "Your day"); assert.equal(await step(), "Step 1 of 5"); assert.equal(await p.locator("[data-ph=guide-later]").count(), 1); await next();
  assert.equal(await h1(), "Your work"); assert.equal(await step(), "Step 2 of 5");
  await p.locator("[data-ph=onb-day][data-day=\"1\"]").click(); assert.equal(await p.locator("[data-ph=onb-day][data-day=\"1\"]").getAttribute("aria-pressed"), "false");
  await p.locator("[data-ph=onb-day][data-day=\"6\"]").click();
  await p.fill("#ph-w0", "17:00"); await p.fill("#ph-w1", "09:00"); await next();
  assert.equal(await h1(), "Your work"); assert.match(await p.locator("#ph-onb-err").innerText(), /start before it ends/);
  await p.fill("#ph-w0", "09:00"); await p.fill("#ph-w1", "17:00"); await p.fill("#ph-commute", "300"); await next();
  assert.match(await p.locator("#ph-onb-err").innerText(), /0 to 240/);
  await p.fill("#ph-commute", "45"); await next(); assert.equal(await h1(), "How you work");
});
await ok("How you work: one tick per question, as radio rows of 44px or more; Back keeps what was typed", async () => {
  const rows = await p.evaluate(() => [...document.querySelectorAll("[data-ph=onb-pick]")].map((x) => ({ role: x.getAttribute("role"), h: x.getBoundingClientRect().height })));
  assert.ok(rows.length >= 8); assert.ok(rows.every((r) => r.role === "radio" && r.h >= 44));
  await p.locator('[data-ph=onb-pick][data-k="sharp"][data-v="afternoon"]').click(); await p.locator('[data-ph=onb-pick][data-k="gym"][data-v="weekend"]').click();
  assert.equal(await p.locator('[data-k="sharp"][aria-checked="true"]').count(), 1); assert.equal(await p.locator('[data-k="sharp"][data-v="afternoon"]').getAttribute("aria-checked"), "true");
  await p.locator("[data-ph=onb-back]").click(); await p.waitForTimeout(250);
  assert.equal(await p.locator("#ph-w0").inputValue(), "09:00"); assert.equal(await p.locator("#ph-commute").inputValue(), "45");
  await next(); assert.equal(await p.locator('[data-k="gym"][data-v="weekend"]').getAttribute("aria-checked"), "true"); await next();
});
await ok("What matters most, then where each goal belongs; Done saves every answer and the card goes", async () => {
  assert.equal(await h1(), "What matters most"); await p.fill("#ph-north", "Ship the shed before winter"); await next();
  assert.equal(await h1(), "Where each goal belongs"); assert.equal(await step(), "Step 5 of 5");
  await p.locator("[data-ph=guide-done]").click(); await p.waitForTimeout(500);
  const s = await st(), me = s.me;
  assert.deepEqual(me.days, [2, 3, 4, 5, 6]); assert.deepEqual(me.work, ["09:00", "17:00"]); assert.equal(me.commute, 45);
  assert.equal(me.sharp, "afternoon"); assert.equal(me.gym, "weekend"); assert.equal(me.north, "Ship the shed before winter"); assert.equal(me.guided, true);
  assert.equal(s.groups.find((g) => g.name === "Garden Shed").where, "home", "the where chosen at the first goal was lost");
  assert.equal(await p.locator(".ph-guide").count(), 0);
});
await ok("someone who set up before the guide gets a card on Now; Later hides it for today only", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); delete s.me.guided; s.me.sharp = "evening"; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForTimeout(500);
  assert.equal(await p.locator(".ph-guide").isVisible(), true);
  await p.locator(".ph-guide [data-ph=guide-later]").click(); await p.waitForTimeout(300);
  assert.equal(await p.locator(".ph-guide").count(), 0);
  await p.reload(); await p.waitForTimeout(400); assert.equal(await p.locator(".ph-guide").count(), 0, "Later did not last the day");
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me.guideLater = "2000-01-01"; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForTimeout(400); assert.equal(await p.locator(".ph-guide").isVisible(), true, "the card did not come back the next day");
});
await ok("the guide starts from their own answers, 5 screens, Later instead of Back first, and ends with where each goal belongs", async () => {
  await p.locator(".ph-guide [data-ph=guide]").click(); await p.waitForTimeout(300);
  assert.equal(await h1(), "Your day"); assert.equal(await step(), "Step 1 of 5");
  assert.equal(await p.locator("[data-ph=guide-later]").count(), 1); assert.equal(await p.locator("[data-ph=onb-back]").count(), 0);
  await next(); assert.equal(await p.locator("#ph-w0").inputValue(), "09:00"); await next();
  assert.equal(await p.locator('[data-k="sharp"][data-v="evening"]').getAttribute("aria-checked"), "true"); await next(); await next();
  assert.equal(await h1(), "Where each goal belongs"); assert.equal(await step(), "Step 5 of 5");
  const gid = await p.evaluate(() => document.querySelector("[data-onb-where]").getAttribute("data-onb-where"));
  await p.locator(`[data-onb-where="${gid}"]`).selectOption("out"); await p.locator("[data-ph=guide-done]").click(); await p.waitForTimeout(500);
  const s = await st(); assert.equal(s.me.guided, true); assert.equal(s.groups.find((g) => g.id === gid).where, "out");
  assert.equal(await p.evaluate(() => location.hash), "#/now"); assert.equal(await p.locator(".ph-guide").count(), 0);
});
await ok("no sideways scroll on any guide screen", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); delete s.me.guided; delete s.me.guideLater; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForTimeout(400); await p.locator(".ph-guide [data-ph=guide]").click(); await p.waitForTimeout(300);
  for (let i = 0; i < 5; i++) { assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "screen " + (i + 1)); if (i < 4) await next(); }
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
