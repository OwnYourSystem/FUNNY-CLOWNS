/* The classic subtask and goal editors (2026-10-15). Both views now share
   editSub, editGoal, moveSub, addSub and removeSub; this proves the board's
   own editor still does what it did before the move.                    */
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
await p.goto(URL); await p.waitForSelector(".row.pick");
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const sub = async (name) => Object.values((await st()).subs).find((x) => x.name === name);
/* set a field the way a person does: a value, then the change event */
const set = (sel, v) => p.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }, [sel, v]);
const ed = (k) => `#sub-bars .editor [data-ed="${k}"]`;

await ok("Add makes a step with the chosen repeat", async () => {
  await p.fill("#ns-name", "Classic step"); await set("#ns-rep", "weekly"); await p.click("#ns-add"); await p.waitForTimeout(250);
  const s = await sub("Classic step"); assert.ok(s); assert.equal(s.rep, "weekly"); assert.equal(s.prio, "mid"); assert.equal(s.streak, 0); assert.ok(s.period);
});
await ok("the editor saves name and tag; priority and the step's own date are gone, the order and the delivery day replace them (2026-10-20)", async () => {
  const id = (await sub("Classic step")).id;
  await p.click(`#sub-bars [data-ed-open="${id}"]`); await p.waitForSelector(ed("name"));
  await set(ed("name"), "Classic step two"); await p.waitForTimeout(150);
  if (!(await p.locator(ed("tag")).count())) await p.click(`#sub-bars [data-ed-open="${id}"]`);
  assert.equal(await p.locator(ed("prio")).count(), 0, "priority is still offered");
  await set(ed("tag"), " Admin "); await p.waitForTimeout(150); assert.equal(await p.locator(ed("due")).count(), 0, "the step's own date is still offered");
  const s = await sub("Classic step two"); assert.ok(s, "not renamed"); assert.equal(s.tag, "Admin");
});
await ok("an empty name is refused", async () => {
  await set(ed("name"), "   "); await p.waitForTimeout(150); assert.ok(await sub("Classic step two"));
});
await ok("percent rounds to 5 and moves the status; status moves the percent", async () => {
  await set(ed("pct"), "42"); await p.waitForTimeout(150); let s = await sub("Classic step two"); assert.equal(s.pct, 40); assert.equal(s.status, "doing");
  await set(ed("status"), "done"); await p.waitForTimeout(150); s = await sub("Classic step two"); assert.equal(s.pct, 100);
  await set(ed("status"), "blocked"); await p.waitForTimeout(150); s = await sub("Classic step two"); assert.equal(s.pct, 95); assert.equal(s.status, "blocked");
  await set(ed("pct"), "100"); await p.waitForTimeout(150); assert.equal((await sub("Classic step two")).status, "done");
});
await ok("a repeat starts the step again from zero", async () => {
  await set(ed("rep"), "daily"); await p.waitForTimeout(150); const s = await sub("Classic step two"); assert.equal(s.rep, "daily"); assert.equal(s.pct, 0); assert.equal(s.status, "todo");
});
await ok("the goal editor saves name, delivery day, work and tags; no priority", async () => {
  const gid = (await sub("Classic step two")).gid;
  await p.click(`[data-gedit="${gid}"]`); await p.waitForSelector('.mains .editor [data-ged="tags"]');
  await set('.mains .editor [data-ged="tags"]', "Ops, ops, Q4"); await p.waitForTimeout(150);
  await set('.mains .editor [data-ged="where"]', "work"); assert.equal(await p.locator('.mains .editor [data-ged="prio"]').count(), 0); await set('.mains .editor [data-ged="due"]', "2027-06-30");
  await set('.mains .editor [data-ged="name"]', "Classic goal"); await p.waitForTimeout(150);
  const g = (await st()).groups.find((x) => x.id === gid); assert.equal(g.name, "Classic goal"); assert.deepEqual(g.tags, ["ops", "q4"]);
  assert.equal(g.where, "work"); assert.equal(g.due, "2027-06-30");
});
await ok("Remove subtask asks once, then removes it for good", async () => {
  const id = (await sub("Classic step two")).id;
  if (!(await p.locator(`#sub-bars [data-del="${id}"]`).count())) await p.click(`#sub-bars [data-ed-open="${id}"]`);
  await p.click(`#sub-bars [data-del="${id}"]`); await p.waitForTimeout(100); assert.ok(await sub("Classic step two"), "removed on the first press");
  await p.click(`#sub-bars [data-del="${id}"]`); await p.waitForTimeout(200);
  const s = await st(); assert.equal(s.subs[id], undefined); assert.ok(s.killed.includes(id));
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
