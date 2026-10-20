/* The board (desktop) at the phone's level (owner, 2026-10-20: "keep both on the same level, with different interfaces"):
   steps in their order, no step priority, own date under More, Easy, Earlier/Later and drag with Undo, the energy battery,
   steps on a good day, Delivery days instead of Needs attention, the passed-day question, and Suggest an order. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
let sent = [], reply = { status: 200, body: { ok: true, order: ["gS3", "gS1", "gS2"], why: "The walls need the timber and the base first." } };
await p.route("**/api/order", async (r) => { sent.push(JSON.parse(r.request().postData() || "{}")); await r.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.body) }); });
await p.goto(URL); await p.waitForSelector(".row.pick");
const day = (n) => { const d = new Date(Date.now() + n * 864e5), q = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); };
const seed = async (fn, arg) => { await p.evaluate(([KEY, src, arg]) => { const s = JSON.parse(localStorage.getItem(KEY));
    s.me = s.me || {}; s.me.done = true; s.me.guided = true; s.me.hints = false; s.me.barrier = false; s.me.learn = false; s.groups = []; s.subs = {}; s.oftad = []; s.plan = []; s.done = []; s.cap = null; s.capLog = [];
    const g = (id, name, steps, due) => { s.groups.push({ id, name, subs: steps.map((n, i) => id + i), prio: "mid", where: "any", due: due || "", tags: [] });
      steps.forEach((n, i) => { const d = n.startsWith("DONE"); s.subs[id + i] = { id: id + i, gid: id, name: n, pct: d ? 100 : 0, status: d ? "done" : "todo", tag: "", upd: "2026-10-20" }; }); };
    g("gS", "Shed", ["DONE clear the ground", "Lay the base", "Buy timber", "Build the walls"]); g("gR", "Report", ["Collect numbers", "Write the draft"]);
    s.sel = "gS"; if (src) (0, eval)("(" + src + ")")(s, arg); localStorage.setItem(KEY, JSON.stringify(s)); location.hash = "#/board"; }, [KEY, fn ? fn.toString() : "", arg]);
  await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(300); };
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const subs = async (g = "gS") => (await st()).groups.find((x) => x.id === g).subs;
const D = () => p.locator("dialog.ask[open]");
const names = () => p.locator("#sub-bars .row .rname").allInnerTexts();
const openEd = async (id) => { await p.locator(`#sub-bars [data-ed-open="${id}"]`).click(); await p.waitForSelector(`#sub-bars .editor[data-ed-for="${id}"]`); };

await seed();
await ok("the subtask list is the sequence: open steps in their order, numbered, finished ones last; the order is said in words", async () => {
  assert.deepEqual(await names(), ["Lay the base", "Buy timber", "Build the walls", "DONE clear the ground"]);
  assert.deepEqual(await p.locator("#sub-bars .rhead .ord").allInnerTexts(), ["1", "2", "3"]);
  assert.match(await p.locator("#sub-bars .seqline").innerText(), /Done from top to bottom\. Drag a step to change the order\./);
});
await ok("the step editor has no priority; its own date sits under More; Easy is a checkbox that saves", async () => {
  await openEd("gS1");
  assert.equal(await p.locator('#sub-bars .editor [data-ed="prio"]').count(), 0);
  assert.equal(await p.locator('#sub-bars .editor details.more:not([open]) [data-ed="due"]').count(), 1);
  await p.locator('#sub-bars [data-ed-easy="gS1"]').check(); await p.waitForTimeout(250);
  assert.equal((await st()).subs.gS1.easy, true); assert.match(await p.locator('#sub-bars .row[data-sub="gS1"] .rhead').innerText(), /Easy/i);
});
await ok("Later and Earlier move a step, with the board's own Undo bar", async () => {
  await p.locator('#sub-bars [data-sorder-d="1"][data-sid="gS1"]').click(); await p.waitForTimeout(300);
  assert.deepEqual(await subs(), ["gS0", "gS2", "gS1", "gS3"]);
  assert.equal(await p.locator("#dk-undo").isVisible(), true); assert.match(await p.locator("#dk-undo-t").innerText(), /Moved later: Lay the base/);
  await p.locator("#dk-undo-b").click(); await p.waitForTimeout(300);
  assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]); assert.equal(await p.locator("#dk-undo").isVisible(), false);
});
await ok("dragging a step onto another step puts it there, with Undo", async () => {
  await p.locator(`#sub-bars [data-ed-open="gS1"]`).click(); await p.waitForTimeout(200);
  const a = await p.locator('#sub-bars [data-grip="sub:gS3"]').boundingBox(), t = await p.locator('#sub-bars .row[data-sub="gS1"] .rhead').boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  for (let i = 1; i <= 10; i++) await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + ((t.y + 4) - (a.y + a.height / 2)) * i / 10);
  await p.mouse.up(); await p.waitForTimeout(400);
  assert.deepEqual(await subs(), ["gS0", "gS3", "gS1", "gS2"]);
  await p.locator("#dk-undo-b").click(); await p.waitForTimeout(300); assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]);
});
await ok("the battery on the Do this now strip opens the same energy sheet; Very low sizes the day to one easy thing", async () => {
  const e = p.locator("#now-badge [data-energy-open]"); assert.match(await e.getAttribute("aria-label"), /Energy: Good, the board.s guess/);
  await e.click(); await D().waitFor(); assert.match(await D().innerText(), /How is your energy/);
  await D().getByRole("button", { name: /^Very low/ }).click(); await p.waitForTimeout(300);
  assert.equal((await st()).cap.lvl, 1); assert.match(await p.locator("#now-badge [data-energy-open]").getAttribute("aria-label"), /Very low, set by you/);
  assert.match(await p.locator("#oftad-count").innerText(), /of today.s 1 · energy very low/);
  assert.match(await p.locator("#now-badge").innerText(), /Lay the base/, "the easy step did not come first");
});
await ok("the first Good asks how many steps make a good day; the Planner can change it", async () => {
  await p.locator("#now-badge [data-energy-open]").click(); await D().waitFor(); await D().getByRole("button", { name: /^Good/ }).click(); await p.waitForTimeout(300);
  await D().waitFor(); assert.match(await D().innerText(), /How many steps make a good day/); await D().getByRole("button", { name: /^2 steps/ }).click(); await p.waitForTimeout(300);
  assert.equal((await st()).me.normalN, 2);
  await p.locator('[data-goto-view="planner"]').first().click(); await p.waitForTimeout(400);
  const sel = p.locator('#pl-form [data-me="normalN"]'); assert.equal(await sel.inputValue(), "2");
  await sel.selectOption("4"); await p.waitForTimeout(250); assert.equal((await st()).me.normalN, 4);
});
await ok("the Planner has the AI switch: on asks for consent first, off withdraws it", async () => {
  const sw = p.locator("#pl-aiok"); assert.equal(await sw.getAttribute("aria-pressed"), "false");
  await sw.click(); await D().waitFor(); assert.match(await D().innerText(), /Anthropic/); await D().getByRole("button", { name: "Send" }).click(); await p.waitForTimeout(300);
  assert.ok((await st()).me.aiOrderOk); assert.equal(await p.locator("#pl-aiok").getAttribute("aria-pressed"), "true");
  await p.locator("#pl-aiok").click(); await p.waitForTimeout(250); assert.equal((await st()).me.aiOrderOk, undefined);
});
await ok("Suggest an order on the board: consent, the suggestion labelled AI, Use this order, Undo", async () => {
  await seed();
  await p.locator("#sub-bars [data-aiorder-d]").click(); await D().waitFor(); await D().getByRole("button", { name: "Send" }).click();
  await D().waitFor(); assert.deepEqual(sent.pop(), { goal: "Shed", steps: [{ id: "gS1", name: "Lay the base" }, { id: "gS2", name: "Buy timber" }, { id: "gS3", name: "Build the walls" }] });
  assert.match(await D().innerText(), /Suggested by AI[\s\S]*1\. Build the walls/);
  await D().getByRole("button", { name: "Use this order" }).click(); await p.waitForTimeout(300);
  assert.deepEqual(await subs(), ["gS0", "gS3", "gS1", "gS2"]); assert.match(await p.locator("#dk-undo-t").innerText(), /New order for Shed/);
  await p.locator("#dk-undo-b").click(); await p.waitForTimeout(300); assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]);
});
await ok("Delivery days: the strip, the count and the panel speak of pace; a passed day asks, and Keep, No date (with Undo) and Pick a new day answer it", async () => {
  await seed((s, a) => { s.groups[0].due = a[0]; s.groups[1].due = a[1]; }, [day(-2), day(3)]);
  assert.equal(await p.locator("#tick-tag").textContent(), "Delivery days"); assert.equal(await p.evaluate(() => document.getElementById("tick").classList.contains("hot")), false);
  const al = await p.locator("#alerts").innerText(); assert.match(al, /Report[\s\S]*for \w+ · 2 steps left/); assert.doesNotMatch(al, /deadline|overdue|days over/i);
  await p.locator("#alerts [data-miss-keep]").click(); await p.waitForTimeout(300); assert.equal(await p.locator("#alerts [data-miss-new]").count(), 0);
  await seed((s, a) => { s.groups[0].due = a; }, day(-1));
  await p.locator("#alerts [data-miss-off]").click(); await p.waitForTimeout(300); assert.equal((await st()).groups[0].due, "");
  await p.locator("#dk-undo-b").click(); await p.waitForTimeout(300); assert.equal((await st()).groups[0].due, day(-1));
  await p.locator("#alerts [data-miss-new]").click(); await D().waitFor(); await D().locator('[data-ak="d"]').fill(day(6)); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  assert.equal((await st()).groups[0].due, day(6)); assert.equal(await p.locator("#alerts [data-miss-new]").count(), 0);
});
await ok("the goal editor calls it a delivery day", async () => {
  await p.locator('#main-bars [data-gedit="gS"]').click(); await p.waitForSelector(".mains .editor");
  const html = await p.locator(".mains .editor").innerHTML(); assert.match(html, /Delivery day/); assert.doesNotMatch(html, />Deadline</);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
