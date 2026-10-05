import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", WK = KEY + ".week";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");
const ago = (n) => p.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); const q = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); }, n);
const seed = (mut, week, done = true) => p.evaluate(([KEY, WK, mut, week, done]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = done; s.ev = []; delete s.week;
  s.me.hints = false; s.me.barrier = false; s.me.learn = false; s.hint = null; s.mem = []; s.exp = { active: null, done: [], unseen: false };
  if (mut) eval("(" + mut + ")")(s);
  localStorage.setItem(KEY, JSON.stringify(s));
  if (week === null) localStorage.removeItem(WK); else localStorage.setItem(WK, JSON.stringify(week));
}, [KEY, WK, mut, week, done]).then(() => p.evaluate(() => { location.hash = "#/board"; })).then(() => p.reload()).then(() => p.waitForSelector(".row.pick"));
const wk = () => p.evaluate((WK) => JSON.parse(localStorage.getItem(WK) || "null"), WK);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const D = () => p.locator("dialog.ask[open]"); const settle = () => p.waitForTimeout(200);
const nudge = () => p.locator("#week-nudge");
const entry = (k, d, e, m, c, f, w, n) => ({ k, d, e, m, c, f, w, n });
const pickAll = async (v) => { for (const [k, x] of Object.entries(v)) await D().locator('[data-ak="' + k + '"] [data-av="' + x + '"]').click(); };

await seed(null, null, false);
await ok("nothing shows until the planner has met you", async () => { assert.equal(await nudge().isHidden(), true); });
await seed(null, null);
await ok("due: one quiet line on the board, and it only opens when pressed", async () => {
  assert.equal(await nudge().isVisible(), true); assert.match(await nudge().innerText(), /Weekly check-in: five taps, kept on this device only/); assert.equal(await D().count(), 0);
});
await ok("the dialog: five labelled groups of 1 to 5, Not now changes nothing", async () => {
  await nudge().locator("[data-week-open]").click(); await D().waitFor();
  const t = await D().innerText(); for (const w of ["Energy", "Mood", "Calm", "Getting through the day", "Something that mattered to me"]) assert.match(t, new RegExp(w, "i"));
  assert.equal(await D().locator(".ask-pick").count(), 5); assert.equal(await D().locator("[data-av]").count(), 25); assert.match(t, /not synced, and the tutor never sees it/); assert.match(t, /not a test and not advice/i);
  await p.keyboard.press("Escape"); await settle(); assert.equal(await wk(), null);
});
await ok("all five are needed; the error stays in the dialog", async () => {
  await nudge().locator("[data-week-open]").click(); await D().waitFor(); await pickAll({ e: 3, m: 4 }); await D().locator("[data-aok]").click(); await settle();
  assert.equal(await D().count(), 1); assert.match(await D().locator(".ask-err").innerText(), /Pick a number for each/); assert.equal(await wk(), null);
});
await ok("saving keeps the five numbers and the week's finished count, under its own key", async () => {
  const t0 = Date.now(); await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("oys-min-deliveries-v1")); const t = Date.now(); s.ev = [1, 2, 3].map((i) => ({ t: t - i * 3600000, k: "done", id: "x" + i })); localStorage.setItem("oys-min-deliveries-v1", JSON.stringify(s)); });
  await p.reload(); await p.waitForSelector(".row.pick");
  await nudge().locator("[data-week-open]").click(); await D().waitFor(); await pickAll({ e: 3, m: 4, c: 2, f: 3, w: 5 }); await D().locator("[data-aok]").click(); await settle();
  const x = await wk(); assert.equal(x.log.length, 1); const e = x.log[0]; assert.deepEqual([e.e, e.m, e.c, e.f, e.w], [3, 4, 2, 3, 5]); assert.equal(e.n, 3); assert.match(e.k, /^\d{4}-W\d\d$/);
  assert.equal(await nudge().isHidden(), true, "no longer due");
});
await ok("it is kept out of the board's own state, the backup text and the event log", async () => {
  const s = await st(); assert.ok(!("week" in s)); assert.ok(!JSON.stringify(s).includes('"w":5'));
  assert.deepEqual(s.ev.filter((x) => x.k === "week"), s.ev.filter((x) => x.k === "week").map((x) => ({ t: x.t, k: "week", act: "set" })));
  await p.evaluate(() => { location.hash = "#/board"; }); await p.locator("#btn-backup").click(); await p.locator("#io-dump").click();
  const dump = await p.locator("#io").inputValue(); assert.ok(!dump.includes(WK) && !dump.includes("Getting through"), "not in the backup text"); await p.keyboard.press("Escape"); await settle();
});
await ok("the tutor cannot reach it: not in the snapshot, and no tool reads it", async () => {
  const r = await p.evaluate(() => { const B = window.__board, tools = B.modelTools(); const snap = tools.find((t) => t.name === "board_state").execute({}); return { snap, names: tools.map((t) => t.name) }; });
  assert.ok(!/check-in|calm|getting through|mattered/i.test(r.snap), "snapshot"); assert.ok(!r.names.some((n) => /week|checkin|mood/i.test(n)));
  const mem = await p.evaluate(() => window.__board.modelTools().find((t) => t.name === "get_memory").execute({})); assert.ok(!/check-in|calm|mood/i.test(mem));
});
await ok("the planner shows the table; a second check-in the same week replaces the first", async () => {
  await p.evaluate(() => { location.hash = "#/planner"; }); await settle();
  assert.equal(await p.locator("#week-body tbody tr").count(), 1); assert.match(await p.locator("#week-body").innerText(), /3\s+4\s+2\s+3\s+5\s+3/);
  await p.locator("#week-open").click(); await D().waitFor(); assert.equal(await D().locator('[data-ak="m"] [aria-pressed="true"]').innerText(), "4", "prefilled with this week's");
  await D().locator('[data-ak="m"] [data-av="5"]').click(); await D().locator("[data-aok]").click(); await settle();
  const x = await wk(); assert.equal(x.log.length, 1); assert.equal(x.log[0].m, 5);
});
await ok("ISO weeks: the first days of January and the last days of December belong to the right year", async () => {
  const r = await p.evaluate(() => ["2026-01-01", "2025-12-29", "2027-01-03", "2026-12-31"].map((d) => { const [y, m, dd] = d.split("-"); return window.__board.week.key(new Date(+y, +m - 1, +dd)); }));
  assert.deepEqual(r, ["2026-W01", "2026-W01", "2026-W53", "2026-W53"]);
});
const L = async (arr) => { const d = [await ago(21), await ago(14), await ago(7)]; return { v: 1, log: arr.map((a, i) => entry("2026-W0" + (i + 1), d[i + (3 - arr.length)], ...a)) }; };
await ok("more finished and three of the four lower: it says so, plainly, and says to tell someone", async () => {
  await seed(null, await L([[4, 4, 4, 4, 4, 3], [2, 3, 3, 3, 4, 7]]));
  const n = await p.evaluate(() => window.__board.week.note()); assert.match(n, /finished more/); assert.match(n, /7 against 3/); assert.match(n, /energy, mood, calm/); assert.match(n, /someone you trust/); assert.ok(!/depress|anxiety disorder|diagnos/i.test(n));
});
await ok("it stays quiet when only two are lower, or output did not rise", async () => {
  await seed(null, await L([[4, 4, 4, 4, 4, 3], [2, 3, 4, 4, 4, 7]])); assert.equal(await p.evaluate(() => window.__board.week.note()), "");
  await seed(null, await L([[4, 4, 4, 4, 4, 5], [2, 3, 3, 3, 4, 6]])); assert.equal(await p.evaluate(() => window.__board.week.note()), "");
});
await ok("mood and calm both low at two check-ins in a row: it points to someone you trust or a doctor, and says it can only help with the board", async () => {
  await seed(null, await L([[3, 2, 2, 3, 3, 4], [3, 1, 2, 3, 3, 4]]));
  const n = await p.evaluate(() => window.__board.week.note()); assert.match(n, /talk to someone you trust or a doctor/); assert.match(n, /only handle the board/);
  await seed(null, await L([[3, 4, 4, 3, 3, 4], [3, 1, 2, 3, 3, 4]])); assert.equal(await p.evaluate(() => window.__board.week.note()), "", "one low check-in is not enough");
  await p.evaluate(() => { location.hash = "#/planner"; }); await seed(null, await L([[3, 2, 2, 3, 3, 4], [3, 1, 2, 3, 3, 4]])); await p.evaluate(() => { location.hash = "#/planner"; }); await settle(); assert.match(await p.locator("#week-body .wk-note").innerText(), /talk to someone you trust/);
});
await ok("due again after 7 days, not before", async () => {
  await seed(null, { v: 1, log: [entry("2026-W01", await ago(3), 3, 3, 3, 3, 3, 1)] }); assert.equal(await nudge().isHidden(), true);
  await seed(null, { v: 1, log: [entry("2026-W01", await ago(8), 3, 3, 3, 3, 3, 1)] }); assert.equal(await nudge().isVisible(), true);
});
await ok("Delete asks first, keeps them on Not now, and removes the whole key when confirmed", async () => {
  await seed(null, await L([[3, 3, 3, 3, 3, 1], [3, 3, 3, 3, 3, 1]])); await p.evaluate(() => { location.hash = "#/planner"; }); await settle();
  await p.locator("#week-erase").click(); await D().waitFor(); assert.match(await D().innerText(), /all 2 weekly check-ins/); assert.equal(await p.evaluate(() => document.activeElement.hasAttribute("data-acancel")), true); await p.keyboard.press("Escape"); await settle(); assert.equal((await wk()).log.length, 2);
  await p.locator("#week-erase").click(); await D().waitFor(); await D().locator("[data-aok]").click(); await settle(); assert.equal(await wk(), null); assert.match(await p.locator("#week-body").innerText(), /No check-ins yet/);
});
await ok("Reset the board removes them too, and says so", async () => {
  await seed(null, await L([[3, 3, 3, 3, 3, 1]])); await p.locator("#btn-backup").click().catch(() => {}); 
  await p.evaluate(() => { location.hash = "#/board"; }); await p.reload(); await p.waitForSelector(".row.pick");
  await p.locator("#btn-backup").click(); await p.locator("#io-reset").click(); await p.locator("dialog.ask[open]:not(#backup)").waitFor(); assert.match(await p.locator("dialog.ask[open]:not(#backup)").innerText(), /weekly check-ins/);
  await Promise.all([p.waitForNavigation(), p.locator("dialog.ask[open]:not(#backup) [data-aok]").click()]); await p.waitForSelector(".row.pick"); assert.equal(await wk(), null);
});
await ok("at 412px the dialog's rows fit and the table scrolls inside its box, not the page", async () => {
  await seed(null, await L([[3, 3, 3, 3, 3, 1], [4, 4, 4, 4, 4, 2]])); await p.setViewportSize({ width: 412, height: 820 });
  await p.evaluate(() => { location.hash = "#/planner"; }); await settle(); const r0 = await p.evaluate(() => ({ sx: document.documentElement.scrollWidth, w: innerWidth })); assert.ok(r0.sx <= r0.w, JSON.stringify(r0));
  await p.locator("#week-open").click(); await D().waitFor(); await p.waitForTimeout(350);
  const r = await p.evaluate(() => { const d = document.querySelector("dialog.ask[open]"), b = d.querySelector(".ask-pick.row").getBoundingClientRect(); return { sx: document.documentElement.scrollWidth, w: innerWidth, right: b.right, left: b.left, btnW: d.querySelector("[data-av]").getBoundingClientRect().width }; });
  assert.ok(r.sx <= r.w && r.right <= r.w && r.left >= 0 && r.btnW >= 36, JSON.stringify(r)); await p.keyboard.press("Escape"); await settle(); await p.setViewportSize({ width: 1280, height: 1100 });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
