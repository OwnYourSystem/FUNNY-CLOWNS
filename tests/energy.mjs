/* The energy level on Now (owner, 2026-10-20): one battery beside the date shows the level the day is sized to.
   Until the person sets it, it is the board's own sizing; a change re-sizes the plan at once. A low level puts easy steps first. */
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
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const dose = () => p.evaluate(() => window.__board.dose());
const E = () => p.locator("[data-ph=energy]");
const D = () => p.locator("dialog.ask[open]");
/* the first Good asks how many steps make a good day; keep 3 unless a test says otherwise */
const set = async (re) => { await E().click(); await D().waitFor(); await D().getByRole("button", { name: re }).click(); await p.waitForTimeout(250);
  if (await D().count() && /good day/.test(await D().innerText())) { await D().getByRole("button", { name: /^Keep 3$/ }).click(); await p.waitForTimeout(250); } };
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250); };
const pick = () => p.locator("[aria-label='Do this now'] .ph-task").innerText();

await ok("Now shows one battery beside the date: the board's own sizing until you set it, 44px or more, named for screen readers", async () => {
  assert.equal(await E().count(), 1);
  const r = await p.evaluate(() => { const e = document.querySelector("[data-ph=energy]"), h = document.querySelector(".ph-head h1");
    return { inHead: !!e.closest(".ph-head"), h: e.getBoundingClientRect().height, l: e.dataset.l, bars: e.querySelectorAll("rect.on").length, label: e.getAttribute("aria-label"), text: e.textContent }; });
  assert.ok(r.inHead); assert.ok(r.h >= 44); assert.equal(r.l, "3"); assert.equal(r.bars, 3);
  assert.match(r.label, /^Energy: Good, the board.s guess\. Change$/); assert.match(r.text, /Good.*Board.s guess/);
});
await ok("the board's guess follows its own sizing: after rough days it shows Very low, without anyone setting it", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); const d = (n) => { const x = new Date(Date.now() - n * 864e5); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    s.capLog = [{ d: d(1), est: "normal", you: "low" }, { d: d(2), est: "normal", you: "low" }]; s.cap = null; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector("[data-ph=energy]");
  assert.equal(await E().getAttribute("data-l"), "1"); assert.match(await E().getAttribute("aria-label"), /board.s guess/); assert.equal((await dose()).src, "auto");
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.capLog = []; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector("[data-ph=energy]");
});
await ok("tapping it opens a sheet with the four levels; each one re-sizes the day: 1, 2, normal and normal plus 2", async () => {
  const n = [];
  for (const [re, l] of [[/^Very low/, 1], [/^Low/, 2], [/^Good/, 3], [/^Full/, 4]]) {
    await set(re); n.push((await dose()).n);
    assert.equal(await E().getAttribute("data-l"), String(l)); assert.match(await E().getAttribute("aria-label"), /set by you/);
  }
  assert.deepEqual(n, [1, 2, 3, 5]);
  const s = await st(); assert.equal(s.cap.lvl, 4); assert.equal(s.capLog[0].lvl, 4); assert.equal(s.capLog.filter((x) => x.d === s.cap.d).length, 1, "one entry a day");
  assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-ph")), "energy", "focus did not come back");
});
await ok("Keep it changes nothing; Let the board decide is offered only once you set it, and clears it", async () => {
  await E().click(); await D().waitFor(); await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200); assert.equal((await st()).cap.lvl, 4);
  await set(/Let the board decide/); assert.equal((await st()).cap, null); assert.match(await E().getAttribute("aria-label"), /board.s guess/);
  await E().click(); await D().waitFor(); assert.equal(await D().getByRole("button", { name: /Let the board decide/ }).count(), 0);
  await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200);
});
await ok("a step can be marked Easy on its page, as a switch, and turned off again", async () => {
  const id = await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return Object.values(s.subs).find((x) => x.name === "Buy the timber").id; }, KEY);
  await go("step/" + encodeURIComponent(id));
  const sw = p.locator("[data-ph=seasy]"); assert.equal(await sw.getAttribute("role"), "switch"); assert.equal(await sw.getAttribute("aria-checked"), "false");
  await sw.click(); await p.waitForTimeout(250);
  assert.equal(await p.locator("[data-ph=seasy]").getAttribute("aria-checked"), "true"); assert.equal((await st()).subs[id].easy, true);
  await p.locator("[data-ph=seasy]").click(); await p.waitForTimeout(250); assert.equal("easy" in (await st()).subs[id], false);
  await p.locator("[data-ph=seasy]").click(); await p.waitForTimeout(250);
});
await ok("on a low level the easy step comes first, and says why; on a full one it does not jump the queue", async () => {
  await go("now"); await set(/^Full/); const full = await pick();
  await set(/^Very low/); assert.equal(await pick(), "Buy the timber", "very low did not pick the easy step");
  await set(/^Low/); assert.equal(await pick(), "Buy the timber", "low did not pick the easy step");
  assert.notEqual(full, "Buy the timber", "the seeded board should have a harder step first on a full day");
  assert.match(await p.evaluate(() => window.__board.dose().why), /energy is low/);
});
await ok("with no easy step the sheet says how to mark one; with one it does not", async () => {
  await E().click(); await D().waitFor(); assert.doesNotMatch(await D().innerText(), /Mark one on its page/); await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200);
  await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return s.cap && s.cap.lvl === 2; }, KEY);
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); Object.values(s.subs).forEach((x) => delete x.easy); localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector("[data-ph=energy]");
  assert.equal(await E().getAttribute("data-l"), "2", "the level did not last a reload");
  await E().click(); await D().waitFor(); assert.match(await D().innerText(), /Mark one on its page/); await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200);
});
await ok("a level you set is for today only; tomorrow starts from the board's guess", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.cap.d = "2000-01-01"; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector("[data-ph=energy]"); assert.match(await E().getAttribute("aria-label"), /board.s guess/);
});
await ok("the assistant sets it in plain words, and the battery follows", async () => {
  await go("talk"); await p.fill("#bot-input", "my energy is very low"); await p.keyboard.press("Enter"); await p.waitForTimeout(600);
  assert.equal((await st()).cap.lvl, 1);
  assert.match(await p.evaluate(() => [...document.querySelectorAll("#bot-log .bot-msg.bot")].pop().textContent), /very low/i);
  await p.fill("#bot-input", "energy 3"); await p.keyboard.press("Enter"); await p.waitForTimeout(600); assert.equal((await st()).cap.lvl, 3);
  await go("now"); assert.equal(await E().getAttribute("data-l"), "3");
});
await ok("no sideways scroll, no page errors, in light and dark", async () => {
  for (const c of ["light", "dark"]) { await p.emulateMedia({ colorScheme: c }); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, c); }
  assert.deepEqual(errs, []);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
