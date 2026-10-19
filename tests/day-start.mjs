/* The day has a start as well as an end (owner, 2026-10-19: "Why only end day time and not start day too?"). */
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
const D = () => p.locator("dialog.ask[open]");
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250); };

await ok("Set up your week asks when the day starts as well as when it ends, and a start after the end is refused", async () => {
  await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(500);
  await p.locator(".ph-guide [data-ph=guide]").click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("#ph-start").inputValue(), "07:00"); assert.equal(await p.locator("#ph-end").inputValue(), "22:30");
  await p.fill("#ph-start", "23:00"); await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(200);
  assert.match(await p.locator("#ph-onb-err").innerText(), /start before it ends/);
  await p.fill("#ph-start", "06:30"); await p.fill("#ph-am", "06:00"); await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(200);
  assert.match(await p.locator("#ph-onb-err").innerText(), /before your day starts at 06:30/, "a brief before the start was let through");
  await p.fill("#ph-am", "07:00"); await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(300);
  const me = (await st()).me; assert.equal(me.rise, "06:30"); assert.equal(me.wind, "22:30");
  for (let i = 0; i < 3; i++) { await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250); } /* Your work, How you work, What matters most */
  await p.locator("[data-ph=guide-done]").click(); await p.waitForTimeout(500);
});
await ok("You shows Day starts beside Day ends; it opens a sheet, saves, and refuses a start after the end", async () => {
  await go("you");
  const row = p.locator("[data-ph=daystart]"); assert.match(await row.innerText(), /Day starts\s*06:30/);
  const rows = await p.evaluate(() => [...document.querySelectorAll(".ph-rowb")].map((x) => x.dataset.ph));
  assert.equal(rows.indexOf("daystart") + 1, rows.indexOf("dayend"), "Day starts is not just above Day ends");
  assert.ok((await row.boundingBox()).height >= 44);
  await row.click(); await D().waitFor();
  await D().locator("input[type=time]").fill("23:30"); await D().locator("[data-aok]").click(); await p.waitForTimeout(200);
  assert.equal(await D().isVisible(), true, "a start after the end was saved");
  await D().locator("input[type=time]").fill("06:00"); await D().locator("[data-aok]").click(); await p.waitForTimeout(300);
  assert.equal((await st()).me.rise, "06:00"); assert.match(await p.locator("[data-ph=daystart]").innerText(), /06:00/);
});
await ok("before the day starts the board stays quiet, and says why; after it starts, it does not", async () => {
  const r = await p.evaluate((KEY) => {
    const me = JSON.parse(localStorage.getItem(KEY)).me;
    const at = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return window.__board.nowCtx(d); };
    const early = at(5, 30), later = at(9, 30);
    return { early: early.early, later: later.early, body: window.__board.feasible({ where: "body" }, early), any: window.__board.feasible({ where: "any" }, early),
      outside5: window.__board.outsideDay(me, 5 * 60), outside10: window.__board.outsideDay(me, 10 * 60), small: window.__board.outsideDay(me, 2 * 60) };
  }, KEY);
  assert.equal(r.early, true); assert.equal(r.later, false);
  assert.equal(r.body.ok, false); assert.match(r.body.why, /your day starts at 06:00/);
  assert.equal(r.any.ok, true); assert.equal(r.any.soft, true);
  assert.equal(r.outside5, true); assert.equal(r.outside10, false); assert.equal(r.small, true);
});
await ok("a start at or before 04:00 has no early quiet", async () => {
  assert.equal(await p.evaluate(() => window.__board.beforeDayStart({ rise: "03:30" }, 5 * 60)), false);
});
await ok("the assistant sets the start in plain words", async () => {
  await go("talk"); await p.fill("#bot-input", "my day starts at 7am"); await p.keyboard.press("Enter"); await p.waitForTimeout(700);
  assert.equal((await st()).me.rise, "07:00");
  assert.match(await p.evaluate(() => [...document.querySelectorAll("#bot-log .bot-msg.bot")].pop().textContent), /starts at 07:00/);
});
await ok("the Planner has both times, and a change is saved", async () => {
  await go("planner");
  assert.equal(await p.locator("#ph-p-rise").inputValue(), "07:00"); assert.equal(await p.locator("#ph-p-wind").inputValue(), "22:30");
  await p.fill("#ph-p-rise", "06:45"); await p.locator("#ph-p-rise").dispatchEvent("change"); await p.waitForTimeout(300);
  assert.equal((await st()).me.rise, "06:45");
});
await ok("the reminders sheet names both ends of the day", async () => {
  assert.equal(await p.evaluate(() => window.__board.remCheck({ am: "on", amAt: "06:00", pm: "off", pmAt: "15:00" })), "The morning brief would come before your day starts at 06:45. Pick a later time.");
});
await ok("the interview asks for both times on one page", async () => {
  await go("planner"); await p.locator("[data-ph=interview]").click(); await p.waitForTimeout(300);
  for (let i = 0; i < 12 && !(await p.locator('#interview [data-iv="rise"]').count()); i++) { await p.locator("#iv-next").click(); await p.waitForTimeout(150); }
  assert.equal(await p.locator('#interview [data-iv="rise"]').inputValue(), "06:45"); assert.equal(await p.locator('#interview [data-iv="wind"]').inputValue(), "22:30");
  await p.locator("#iv-quit").click(); await p.waitForTimeout(200);
});
await ok("moving the start past the morning brief moves the brief to the start, and says so", async () => {
  await go("talk"); await p.fill("#bot-input", "my day starts at 8am"); await p.keyboard.press("Enter"); await p.waitForTimeout(700);
  const me = (await st()).me; assert.equal(me.rise, "08:00"); assert.equal(me.brief, "08:00");
  assert.match(await p.evaluate(() => [...document.querySelectorAll("#bot-log .bot-msg.bot")].pop().textContent), /morning brief moves to 08:00/);
});
await ok("Sign in is the first row on You, right under your name", async () => {
  await go("you");
  const first = await p.evaluate(() => { const r = document.querySelector("#ph-main .ph-rowb"); return r && r.dataset.ph; });
  assert.equal(first, "account"); assert.match(await p.locator("[data-ph=account]").innerText(), /Sign in/);
  assert.equal(await p.locator("[data-ph=account]").count(), 1);
});
await ok("a profile saved before the start existed is filled in with 07:00", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); delete s.me.rise; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForTimeout(500); await go("you");
  assert.match(await p.locator("[data-ph=daystart]").innerText(), /07:00/);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
