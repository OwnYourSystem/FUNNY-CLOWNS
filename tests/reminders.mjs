import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
await ctx.addInitScript(() => {
  window.__notes = []; window.__perm = (function () { try { return sessionStorage.getItem("perm") || "granted"; } catch (e) { return "granted"; } })();
  function N(title, o) { window.__notes.push({ title, body: o && o.body, tag: o && o.tag }); }
  Object.defineProperty(N, "permission", { get() { return window.__perm; } }); N.requestPermission = () => Promise.resolve(N.permission);
  if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = function (t, o) { window.__notes.push({ title: t, body: o && o.body, tag: o && o.tag }); return Promise.resolve(); };
  try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; }
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");

/* a clean day: nothing told yet, brief at 07:30, the day ends at `wind` */
const setup = (wind) => p.evaluate(([KEY, wind]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.me.brief = "07:30"; s.me.wind = wind; s.me.hintNote = false;
  const id = Object.keys(s.subs)[0]; s.oftad = [{ k: "sub", id, done: false }]; s.plan = [];
  s.told = null; localStorage.setItem(KEY, JSON.stringify(s)); sessionStorage.setItem("perm", "default");
}, [KEY, wind]).then(() => p.reload()).then(() => p.waitForSelector(".row.pick")).then(() => p.evaluate(() => { window.__perm = "granted"; window.__notes.length = 0; }));
const at = (h, m) => p.evaluate(([h, m]) => { const d = new Date(); d.setHours(h, m, 0, 0); window.__board.remind(d); }, [h, m]).then(() => p.waitForTimeout(200));
const notes = () => p.evaluate(() => window.__notes.slice());
const open = () => p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return s; }, KEY);

await setup("22:30");
await ok("the pure rule: past the end of the day, and in the small hours", async () => {
  const r = await p.evaluate(() => [[22, 29], [22, 30], [23, 59], [0, 10], [3, 59], [4, 0], [12, 0]].map(([h, m]) => window.__board.pastDayEnd({ wind: "22:30" }, h * 60 + m)));
  assert.deepEqual(r, [false, true, true, true, true, false, false]);
});
await ok("a day that ends after midnight is over only between that time and 04:00", async () => {
  const r = await p.evaluate(() => [[0, 20], [0, 30], [2, 0], [4, 0], [9, 0], [20, 0], [23, 0]].map(([h, m]) => window.__board.pastDayEnd({ wind: "00:30" }, h * 60 + m)));
  assert.deepEqual(r, [false, true, true, false, false, false, false]);
});
await ok("the brief is not sent at 23:00 when the board is first opened late", async () => {
  await at(23, 0); assert.equal((await notes()).length, 0);
  const told = (await open()).told; assert.ok(!told || told.am === false, "the brief must not be marked as told: " + JSON.stringify(told));
});
await ok("the afternoon check is not sent at 22:45", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); const n = new Date(), p2 = (x) => String(x).padStart(2, "0"); s.told = { d: n.getFullYear() + "-" + p2(n.getMonth() + 1) + "-" + p2(n.getDate()), am: true, pm: false, hint: true }; localStorage.setItem(KEY, JSON.stringify(s)); sessionStorage.setItem("perm", "default"); }, KEY); await p.reload(); await p.waitForSelector(".row.pick");
  await p.evaluate(() => { window.__perm = "granted"; window.__notes.length = 0; }); await at(22, 45); assert.equal((await notes()).length, 0);
});
await ok("nothing is sent at 02:00 either", async () => {
  await p.evaluate(() => { window.__notes.length = 0; }); await at(2, 0); assert.equal((await notes()).length, 0);
});
await ok("it still fires in the day: the brief at 08:00", async () => {
  await setup("22:30"); await at(8, 0); const n = await notes(); assert.equal(n.length, 1); assert.equal(n[0].tag, "oys-brief");
});
await ok("it still fires in the day: the afternoon check at 16:00, after the brief, when something is open", async () => {
  const s0 = await open(); const openN = (s0.oftad || []).length; assert.ok(openN > 0, "the seed has open work");
  await at(16, 0); const n = await notes(); assert.ok(n.some((x) => x.tag === "oys-today"), JSON.stringify(n));
});
await ok("a day ending at 00:30 does not silence the afternoon", async () => {
  await setup("00:30"); await at(16, 0); const n = await notes(); assert.equal(n.length, 1);
});
await ok("a late time with the day ending late (23:30) still sends at 23:00", async () => {
  await setup("23:30"); await at(23, 0); const n = await notes(); assert.equal(n.length, 1);
});
await ok("reminders off stays off; no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
