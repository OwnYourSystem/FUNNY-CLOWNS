/* The five rules (owner, 2026-10-20), on the phone, at fixed times on Tuesday 20 October 2026:
   1 energy defaults to Good; 2 very low, the last 90 minutes or outside the day: no task, only easy things;
   3 low: easy things or one step marked Easy; 4 good: the next step in order of the goal with the nearest delivery day,
   else the goal matching what matters most, else the top of the list; 5 work goals only in work hours, the others only outside. */
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
const at = (h, m) => new Date(2026, 9, 20, h, m, 0);        /* a Tuesday */
await p.clock.setFixedTime(at(14, 0));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
/* a clean board: Shed (top of the list), Report (work), Novel; no work days unless a test sets them */
const seed = async (time, fn, arg) => {
  await p.clock.setFixedTime(time);
  await p.evaluate(([KEY, src, arg]) => { const s = JSON.parse(localStorage.getItem(KEY));
    s.groups = []; s.subs = {}; s.oftad = []; s.plan = []; s.done = []; s.cap = null; s.capLog = []; s.skip = null;
    Object.assign(s.me, { guided: true, days: [], work: ["09:00", "17:00"], rise: "07:00", wind: "22:30", north: "" });
    s.floor = { items: [{ id: "f1", t: "Listen to an audiobook" }, { id: "f2", t: "Read before sleep" }], log: {} };
    const g = (id, name, steps, where) => { s.groups.push({ id, name, subs: steps.map((n, i) => id + i), prio: "mid", where: where || "any", due: "", tags: [] });
      steps.forEach((n, i) => { s.subs[id + i] = { id: id + i, gid: id, name: n, pct: 0, status: "todo", tag: "", upd: "2026-10-01" }; }); };
    g("gS", "Shed", ["Buy timber", "Lay the base", "Build the walls"]);
    g("gR", "Report", ["Collect numbers", "Write the draft"], "work");
    g("gN", "Novel", ["Outline chapter one", "Write chapter one"]);
    if (src) (0, eval)("(" + src + ")")(s, arg); localStorage.setItem(KEY, JSON.stringify(s)); location.hash = "#/now"; }, [KEY, fn ? fn.toString() : "", arg]);
  await p.reload(); await p.waitForSelector("#ph-main [data-ph=energy]"); await p.waitForTimeout(200); };
const task = async () => (await p.locator("[aria-label='Do this now'] .ph-task").count()) ? p.locator("[aria-label='Do this now'] .ph-task").innerText() : null;
const why = () => p.locator("[aria-label='Do this now'] .ph-why").innerText();
const restCard = () => p.locator(".ph-rest");
const LVL = (s, n) => { s.cap = { d: "2026-10-20", mode: n <= 2 ? "low" : n === 4 ? "high" : "normal", lvl: n }; };

await ok("rule 1: energy not set today is Good, and says so", async () => {
  await seed(at(14, 0));
  const e = p.locator("[data-ph=energy]"); assert.equal(await e.getAttribute("data-l"), "3"); assert.match(await e.getAttribute("aria-label"), /Good, not set today/);
  assert.equal(await task(), "Buy timber");
});
await ok("rule 2: very low energy means no task, only the easy things, at any hour (the 21:01 case)", async () => {
  await seed(at(21, 1), LVL, 1);
  assert.equal(await task(), null, "a task was suggested on a very low evening");
  assert.match(await restCard().innerText(), /Nothing is needed now[\s\S]*very low[\s\S]*Listen to an audiobook[\s\S]*Read before sleep/);
  await seed(at(10, 0), LVL, 1); assert.equal(await task(), null);
});
await ok("rule 2: the last 90 minutes of the day ask for nothing, even on a Good day; just before, a step is shown", async () => {
  await seed(at(21, 0)); assert.equal(await task(), null); assert.match(await restCard().innerText(), /last part of your day/);
  await seed(at(20, 59)); assert.equal(await task(), "Buy timber");
});
await ok("rule 2: outside the day nothing is asked: after the end and before the start", async () => {
  await seed(at(23, 10)); assert.equal(await task(), null); assert.match(await restCard().innerText(), /Your day is over/);
  await seed(at(6, 30)); assert.equal(await task(), null); assert.match(await restCard().innerText(), /Your day starts at 07:00/);
});
await ok("easy things: one tick counts the day, and the tick is a checkbox", async () => {
  await seed(at(21, 30));
  const t = p.locator('[data-ph=easytick][data-id="f2"]'); assert.equal(await t.getAttribute("role"), "checkbox");
  await t.click(); await p.waitForTimeout(250);
  assert.equal(await p.locator('[data-ph=easytick][data-id="f2"]').getAttribute("aria-checked"), "true"); assert.match(await restCard().innerText(), /That counts as a day/);
});
await ok("rule 3: low energy with no Easy step shows the easy things, not a task", async () => {
  await seed(at(14, 0), LVL, 2); assert.equal(await task(), null); assert.match(await restCard().innerText(), /Your energy is low/);
});
await ok("rule 3: low energy shows one step marked Easy, with the easy things beside it", async () => {
  await seed(at(14, 0), (s) => { s.cap = { d: "2026-10-20", mode: "low", lvl: 2 }; s.subs.gN1.easy = true; });
  assert.equal(await task(), "Write chapter one"); assert.match(await why(), /Your energy is low, and you marked this step Easy/);
  assert.match(await p.locator(".ph-rest").innerText(), /Or one easy thing/);
});
await ok("rule 4: with no date and no match, the next step of the goal at the top of the list", async () => {
  await seed(at(14, 0)); assert.equal(await task(), "Buy timber"); assert.match(await why(), /next step of Shed, the goal at the top of your list/);
});
await ok("rule 4: the goal that matches what matters most comes before the top of the list", async () => {
  await seed(at(14, 0), (s) => { s.me.north = "Finish the novel"; });
  assert.equal(await task(), "Outline chapter one"); assert.match(await why(), /Novel, which you said matters most/);
});
await ok("rule 4: a delivery day comes before both, nearest first", async () => {
  await seed(at(14, 0), (s) => { s.me.north = "Finish the novel"; s.groups[0].due = "2026-10-30"; s.groups[2].due = "2026-10-24"; });
  assert.equal(await task(), "Outline chapter one"); assert.match(await why(), /Novel is for Saturday, with 2 steps left; this is its next step/);
  await seed(at(14, 0), (s) => { s.groups[0].due = "2026-10-23"; s.groups[2].due = "2026-10-24"; });
  assert.equal(await task(), "Buy timber");
});
await ok("rule 4: steps go in their order: a later step already started does not jump ahead, and nothing says 'stalled'", async () => {
  await seed(at(14, 0), (s) => { s.subs.gS2.pct = 50; s.subs.gS2.status = "doing"; });
  assert.equal(await task(), "Buy timber"); assert.doesNotMatch(await why(), /moved in|stalled|Finishing beats/i);
});
await ok("rule 5: in work hours only work goals; outside them only the others", async () => {
  await seed(at(11, 0), (s) => { s.me.days = [1, 2, 3, 4, 5]; });
  assert.equal(await task(), "Collect numbers"); assert.match(await why(), /work hours, so only work goals/);
  await seed(at(18, 0), (s) => { s.me.days = [1, 2, 3, 4, 5]; s.groups[1].due = "2026-10-21"; });
  assert.equal(await task(), "Buy timber", "a work goal was offered after work");
});
await ok("Skip takes the next one, and Undo brings it back", async () => {
  await seed(at(14, 0));
  await p.locator("[aria-label='Do this now'] [data-ph=skip]").click(); await p.waitForTimeout(300);
  assert.notEqual(await task(), "Buy timber");
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300); assert.equal(await task(), "Buy timber");
});
await ok("the reason is shown in full, with no 'Why this one' link to tap", async () => {
  await seed(at(14, 0), (s) => { s.groups[0].due = "2026-10-23"; });
  assert.equal(await p.locator("[data-ph=why]").count(), 0); assert.doesNotMatch(await why(), /…$/);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
