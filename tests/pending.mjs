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
const seed = () => p.evaluate((KEY) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.plan = []; s.oftad = []; s.done = [];
  const ids = Object.keys(s.subs).slice(0, 3); s.plan = [{ k: "sub", id: ids[0], done: false }, { k: "sub", id: ids[1], done: false }]; s.botOpen = false;
  localStorage.setItem(KEY, JSON.stringify(s)); window.__ids = ids;
}, KEY).then(() => p.reload()).then(() => p.waitForSelector(".row.pick")).then(() => p.evaluate(() => { window.__board.openSheet(); })).then(() => p.waitForTimeout(250));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const model = (name, args) => p.evaluate(([n, a]) => { try { return window.__board.modelTools().find((t) => t.name === n).execute(a); } catch (e) { return "ERR " + e.message; } }, [name, args]);
const subName = (i) => p.evaluate((i) => { const s = JSON.parse(localStorage.getItem("oys-min-deliveries-v1")); return s.subs[Object.keys(s.subs)[i]].name; }, i);
const pend = p.locator("#bot-pend");

await seed();
await ok("the tutor's remove only stages it: nothing is deleted, and the chat shows what would happen", async () => {
  const n0 = Object.keys((await st()).subs).length, name = await subName(0);
  const out = await model("remove_subtask", { subtask: name });
  assert.match(out, /^Ready: Remove /); assert.match(out, /do not say it is done/i);
  assert.equal(Object.keys((await st()).subs).length, n0);
  await pend.waitFor({ state: "visible" }); assert.match(await pend.innerText(), new RegExp("Remove .*" + name.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(await pend.locator("[data-pend-yes]").innerText(), "Remove it"); assert.equal(await pend.locator("[data-pend-no]").innerText(), "Keep it");
});
await ok("Keep it leaves everything as it was", async () => {
  const n0 = Object.keys((await st()).subs).length; await pend.locator("[data-pend-no]").click(); assert.equal(await pend.isHidden(), true); assert.equal(Object.keys((await st()).subs).length, n0);
});
await ok("pressing Remove it does it, says so in the chat, and hides the question", async () => {
  const name = await subName(0), n0 = Object.keys((await st()).subs).length;
  await model("remove_subtask", { subtask: name }); await pend.waitFor({ state: "visible" });
  await p.evaluate(() => window.__board.ask("how are things")).catch(() => {}); // a new sentence replaces a waiting question
  assert.equal(await pend.isHidden(), true, "a new sentence must drop the waiting question");
  await model("remove_subtask", { subtask: name }); await pend.waitFor({ state: "visible" }); await pend.locator("[data-pend-yes]").click(); await p.waitForTimeout(150);
  const s = await st(); assert.equal(Object.keys(s.subs).length, n0 - 1); assert.equal(await pend.isHidden(), true);
  assert.match(await p.locator("#bot-log").innerText(), /Removed/);
});
await ok("an unknown or ambiguous name is an error from the tool, with nothing staged", async () => {
  const out = await model("remove_subtask", { subtask: "zzzz no such step" }); assert.match(out, /^ERR /); assert.equal(await pend.isHidden(), true);
});
await seed();
await ok("clear_dock stages with the card count and the dock's name; confirming clears it", async () => {
  const out = await model("clear_dock", { dock: "plan" }); assert.match(out, /^Ready: Clear 2 cards from Waiting/); assert.equal((await st()).plan.length, 2);
  await pend.waitFor({ state: "visible" }); assert.equal(await pend.locator("[data-pend-yes]").innerText(), "Clear it");
  await pend.locator("[data-pend-yes]").click(); await p.waitForTimeout(150); assert.equal((await st()).plan.length, 0); assert.match(await p.locator("#bot-log").innerText(), /Cleared 2 cards/);
});
await ok("an empty dock stages nothing", async () => { const out = await model("clear_dock", { dock: "done" }); assert.match(out, /already empty/); assert.equal(await pend.isHidden(), true); });
await ok("a bad dock name is refused", async () => { assert.match(await model("clear_dock", { dock: "everything" }), /^ERR Dock must be/); });
await seed();
await ok("what you type yourself still runs at once", async () => {
  const name = await subName(0), n0 = Object.keys((await st()).subs).length;
  await p.evaluate((n) => window.__board.brain("remove " + n), name); assert.equal(Object.keys((await st()).subs).length, n0 - 1); assert.equal(await pend.isHidden(), true);
  await p.evaluate(() => window.__board.brain("clear plan")); assert.equal((await st()).plan.length, 0);
});
await seed();
await ok("a clear request is staged with exactly what it would do", async () => {
  await model("clear_dock", { dock: "plan" }); await pend.waitFor({ state: "visible" });
  assert.equal((await st()).plan.length, 2); assert.match(await pend.innerText(), /Clear 2 cards from Waiting/);
});
await ok("Clear (start over) drops a waiting question, and an old one expires", async () => {
  await p.locator("#bot-clear").click(); assert.equal(await pend.isHidden(), true);
  await model("clear_dock", { dock: "plan" }); await pend.waitFor({ state: "visible" });
  await p.evaluate(() => { window.__board.pend().at = Date.now() - 200000; }); await pend.locator("[data-pend-yes]").click(); await p.waitForTimeout(150);
  assert.equal((await st()).plan.length, 2, "an expired question must not run"); assert.match(await p.locator("#bot-log").innerText(), /a while ago/);
});
await ok("the tool descriptions tell the model it only stages, and the rules say never to claim it is done", async () => {
  const d = await p.evaluate(() => window.__board.modelTools().filter((t) => /remove_subtask|clear_dock/.test(t.name)).map((t) => t.description)); d.forEach((x) => assert.match(x, /stages the request/));
  assert.match(await p.evaluate(() => window.__board.rules), /never that it is done/);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
