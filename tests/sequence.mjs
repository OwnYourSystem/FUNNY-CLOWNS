/* Sequence, not deadlines (owner, 2026-10-20): steps go in their listed order, a goal has one optional delivery day,
   pace instead of pressure, a missed delivery day is asked about (notification and card), and the person says what a good day is. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.grantPermissions(["notifications"], { origin: new globalThis.URL(URL).origin });
/* record notifications instead of showing them */
await ctx.addInitScript(() => { window.__notes = []; const rec = function (t, o) { window.__notes.push({ t, o }); return Promise.resolve(); };
  try { ServiceWorkerRegistration.prototype.showNotification = rec; } catch (e) {} });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
/* noon today, so the quiet hours never hide a notification */
const noon = new Date(); noon.setHours(12, 0, 0, 0); await p.clock.setFixedTime(noon);
const day = (n) => { const d = new Date(noon.getTime() + n * 864e5); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const put = async (fn, arg) => { await p.evaluate(([KEY, src, arg]) => { const s = JSON.parse(localStorage.getItem(KEY)); (0, eval)("(" + src + ")")(s, arg); localStorage.setItem(KEY, JSON.stringify(s)); location.hash = "#/now"; }, [KEY, fn.toString(), arg]); await p.reload(); await p.waitForSelector("#ph-main"); await p.waitForTimeout(300); };
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250); };
const D = () => p.locator("dialog.ask[open]");
const pick = () => p.locator("[aria-label='Do this now'] .ph-task").innerText();
const why = () => p.locator("[aria-label='Do this now'] .ph-why").innerText();
/* a clean board with two goals that can be done anywhere: Shed (3 steps, no date) and Report (no steps yet) */
const mk = (s, a) => {
  s.groups = []; s.subs = {}; s.oftad = []; s.plan = []; s.done = []; s.me.guided = true; s.me.wind = "23:59"; s.me.rise = "00:30";
  const g = (id, name, steps, due) => { s.groups.push({ id, name, subs: steps.map((n, i) => id + i), prio: "mid", where: "any", due: due || "", tags: [] });
    steps.forEach((n, i) => { s.subs[id + i] = { id: id + i, gid: id, name: n, pct: 0, status: "todo", tag: "", upd: a.today }; }); };
  g("gS", "Shed", ["Buy timber", "Lay the base", "Build the walls"]);
  g("gR", "Report", ["Collect numbers", "Write the draft", "Check it", "Send it"], a.due);
};

await ok("steps go in their listed order: the first open step is the one on Now", async () => {
  await put(mk, { today: day(0) });
  assert.equal(await pick(), "Buy timber");
});
await ok("the goal page numbers the open steps, and a step page moves one Earlier or Later; Now follows the new order", async () => {
  await go("goal/gS");
  assert.deepEqual(await p.locator(".ph-ord").allInnerTexts(), ["1", "2", "3"]);
  await go("step/gS1"); assert.match(await p.locator("#ph-s-ordl").innerText(), /step 2 of 3/);
  assert.equal(await p.locator('[data-ph=sorder][data-d="-1"]').isDisabled(), false);
  await p.locator('[data-ph=sorder][data-d="-1"]').click(); await p.waitForTimeout(250);
  assert.match(await p.locator("#ph-s-ordl").innerText(), /step 1 of 3/); assert.equal(await p.locator('[data-ph=sorder][data-d="-1"]').isDisabled(), true);
  assert.deepEqual((await st()).groups.find((g) => g.id === "gS").subs, ["gS1", "gS0", "gS2"]);
  await go("now"); assert.equal(await pick(), "Lay the base");
});
await ok("a step already started goes first, because finishing beats starting", async () => {
  await put((s) => { s.subs.gS2.pct = 30; s.subs.gS2.status = "doing"; }, {});
  assert.equal(await pick(), "Build the walls");
  await put((s) => { s.subs.gS2.pct = 0; s.subs.gS2.status = "todo"; }, {});
});
await ok("a step's own date (a fixed appointment) puts it first in its goal when the day comes", async () => {
  await put((s, a) => { s.subs.gS2.due = a; }, day(0)); assert.equal(await pick(), "Build the walls");
  await put((s) => { s.subs.gS2.due = ""; }, {});
});
await ok("pace: four steps and three days to the delivery day pull ahead of a goal with no date, and Now says the pace, not a deadline", async () => {
  await put((s, a) => { s.groups.find((g) => g.id === "gR").due = a; }, day(2));
  assert.equal(await pick(), "Collect numbers");
  const w = await why(); assert.match(w, /Report is for \w+, with 4 steps left, so about 2 a day keeps it on pace\./); assert.doesNotMatch(w, /deadline|overdue|days over/i);
  await go("goal/gR"); assert.match(await p.locator(".ph-row-h").first().innerText(), /Delivery \w+/);
});
await ok("a far delivery day pulls less than a near one", async () => {
  await put((s, a) => { s.groups.find((g) => g.id === "gR").due = a[0]; s.groups.find((g) => g.id === "gS").due = a[1]; }, [day(60), day(2)]);
  assert.equal(await pick(), "Lay the base", "Shed in 2 days should beat Report in 60");
  await put((s, a) => { s.groups.find((g) => g.id === "gR").due = a[0]; s.groups.find((g) => g.id === "gS").due = a[1]; }, [day(2), day(60)]);
  assert.equal(await pick(), "Collect numbers", "Report in 2 days should beat Shed in 60");
  await put((s) => { s.groups.find((g) => g.id === "gS").due = ""; }, {});
});
await ok("a missed delivery day does not shout: no 'past its deadline', no jump to the top; Now asks with a card", async () => {
  await put((s, a) => { s.groups.find((g) => g.id === "gR").due = a; }, day(-3));
  const w = await why(); assert.doesNotMatch(w, /deadline|overdue|days over/i);
  const c = p.locator(".ph-miss"); assert.equal(await c.isVisible(), true); assert.match(await c.innerText(), /Report[\s\S]*delivery day[\s\S]*has passed\. Nothing is lost/);
  for (const k of ["missnew", "missoff", "misskeep"]) assert.ok((await p.locator(`[data-ph=${k}]`).boundingBox()).height >= 44, k);
});
await ok("the same question comes as a notification, once for that date, not on every redraw", async () => {
  const n = await p.evaluate(() => window.__notes); assert.equal(n.length, 1, JSON.stringify(n));
  assert.match(n[0].t, /Report: its delivery day has passed/); assert.match(n[0].o.body, /Pick a new day/); assert.equal(n[0].o.data.url, "./#/now");
  await p.reload(); await p.waitForSelector(".ph-miss"); assert.equal((await p.evaluate(() => window.__notes)).length, 0, "it was sent again after a reload");
});
await ok("Keep it as it is: the card goes and stays gone for that date; a new missed date asks again", async () => {
  await p.locator("[data-ph=misskeep]").click(); await p.waitForTimeout(250); assert.equal(await p.locator(".ph-miss").count(), 0);
  await p.reload(); await p.waitForSelector("#ph-main"); await p.waitForTimeout(300); assert.equal(await p.locator(".ph-miss").count(), 0);
  await put((s, a) => { s.groups.find((g) => g.id === "gR").due = a; }, day(-1)); assert.equal(await p.locator(".ph-miss").isVisible(), true);
});
await ok("Pick a new day saves it, refuses a day in the past, and the card goes", async () => {
  await p.locator("[data-ph=missnew]").click(); await D().waitFor();
  await D().locator('[data-ak="d"]').fill(day(-2)); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(200);
  assert.equal(await D().isVisible(), true, "a past day was saved");
  await D().locator('[data-ak="d"]').fill(day(5)); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  const g = (await st()).groups.find((g) => g.id === "gR"); assert.equal(g.due, day(5)); assert.equal(g.missAsk, undefined);
  assert.equal(await p.locator(".ph-miss").count(), 0);
});
await ok("No date takes the date off, and Undo puts it back", async () => {
  await put((s, a) => { s.groups.find((g) => g.id === "gR").due = a; }, day(-1));
  await p.locator("[data-ph=missoff]").click(); await p.waitForTimeout(300);
  assert.equal((await st()).groups.find((g) => g.id === "gR").due, ""); assert.equal(await p.locator(".ph-miss").count(), 0);
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300); assert.equal((await st()).groups.find((g) => g.id === "gR").due, day(-1));
});
await ok("the first time Good is picked, the person says how many steps make a good day; Low and Full follow", async () => {
  await p.locator("[data-ph=energy]").click(); await D().waitFor(); await D().getByRole("button", { name: /^Good/ }).click(); await p.waitForTimeout(300);
  await D().waitFor(); assert.match(await D().innerText(), /How many steps make a good day/);
  await D().getByRole("button", { name: /^2 steps/ }).click(); await p.waitForTimeout(300);
  const me = (await st()).me; assert.equal(me.normalN, 2); assert.equal(me.goodSet, true);
  const n = await p.evaluate(() => window.__board.dose().n); assert.equal(n, 2);
  await p.locator("[data-ph=energy]").click(); await D().waitFor();
  const t = await D().innerText(); assert.match(t, /Low: one easier thing/); assert.match(t, /Good: 2 steps/); assert.match(t, /Full: 4 steps/);
  await D().getByRole("button", { name: /^Good/ }).click(); await p.waitForTimeout(300); assert.equal(await D().count(), 0, "it asked again");
});
await ok("You has a Steps on a good day row that asks the same question", async () => {
  await go("you"); const r = p.locator("[data-ph=goodn]"); assert.match(await r.innerText(), /Steps on a good day\s*2/);
  await r.click(); await D().waitFor(); await D().getByRole("button", { name: /^3 steps/ }).click(); await p.waitForTimeout(300);
  assert.equal((await st()).me.normalN, 3); assert.match(await p.locator("[data-ph=goodn]").innerText(), /3/);
});
await ok("goal details call it a delivery day", async () => {
  await go("goal/gR"); await p.locator("[data-ph=gedit]").click(); await D().waitFor();
  assert.match(await D().innerText(), /Delivery day/); assert.doesNotMatch(await D().innerText(), /Deadline/); await D().getByRole("button", { name: /Not now|Cancel|Close/ }).first().click();
});
await ok("no sideways scroll, no page errors", async () => {
  for (const r of ["now", "goal/gS", "step/gS0"]) { await go(r); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, r); }
  assert.deepEqual(errs, []);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
