import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1400 } });
await ctx.addInitScript(() => { window.__notes = []; function N(t, o) { window.__notes.push({ title: t, tag: o && o.tag }); } Object.defineProperty(N, "permission", { get() { return "granted"; } }); N.requestPermission = () => Promise.resolve("granted"); if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = function (t, o) { window.__notes.push({ title: t, tag: o && o.tag }); return Promise.resolve(); }; try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick, #oftad-pick");
const ago = (n) => p.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); const q = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); }, n);
const seed = (mut) => p.evaluate(([KEY, mut]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.ev = []; s.dayLog = []; s.capLog = []; s.cap = null; s.plan = []; s.oftad = []; s.done = []; s.skip = null; s.told = null;
  s.me.hints = false; s.me.barrier = false; s.me.learn = false; s.hint = null; s.mem = []; s.exp = { active: null, done: [], unseen: false };
  window.__ids = Object.keys(s.subs); if (mut) eval("(" + mut + ")")(s, Object.keys(s.subs));
  localStorage.setItem(KEY, JSON.stringify(s));
}, [KEY, mut]).then(() => p.evaluate(() => { location.hash = "#/board"; })).then(() => p.reload()).then(() => p.waitForSelector('[data-panel="oftad"]'));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const y = (sel) => p.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top, sel);
const settle = () => p.waitForTimeout(200);

await seed();
await ok("Today is the first panel under the banner, above Done, Waiting and the summary", async () => {
  const [t, d, w, k, m] = await Promise.all([y('[data-panel="oftad"]'), y('[data-panel="done"]'), y('[data-panel="plan"]'), y('[data-panel="kpis"]'), y('[data-panel="mains"]')]);
  assert.ok(t < w && t < d && t < k && t < m, JSON.stringify({ t, d, w, k, m }));
  assert.ok(await p.evaluate(() => document.querySelector("#canvas").children[1].getAttribute("data-panel") === "oftad"), "second child after the banner");
});
await ok("the lists are called Today, Waiting and Done today; the old names are gone from the board", async () => {
  const t = await p.locator("#v-board").innerText();
  assert.match(t, /\bToday\b/); assert.match(t, /Waiting/); assert.match(t, /Done today/i);
  assert.ok(!/One Task A Day/i.test(t), "One Task A Day"); assert.ok(!/Today.s plan/i.test(t), "Today's plan");
  assert.match(await p.locator("#oftad-note").innerText(), /sized to today.s dose/); assert.match(await p.locator('[data-panel="plan"] .p-note').innerText(), /None of it is today.s job/);
});
const yesterday = await ago(1);
await seed(`(s, ids) => { s.day = "${yesterday}"; s.oftad = [{ k: "sub", id: ids[0], done: false }, { k: "sub", id: ids[1], done: false }]; s.plan = [{ k: "sub", id: ids[1], done: false }, { k: "sub", id: ids[2], done: false }, { k: "sub", id: ids[3], done: false }]; s.done = [{ k: "sub", id: ids[4], done: true }]; }`);
await ok("a new day: what was not finished goes to Waiting, Today starts empty, and nothing is counted twice", async () => {
  const s = await st(); assert.equal(s.oftad.length, 0); assert.equal(s.plan.length, 4, "2 from Today + 3 waiting, one shared"); assert.ok(s.plan.every((c) => c.carried && c.from === yesterday));
  assert.equal(new Set(s.plan.map((c) => c.id)).size, 4); assert.deepEqual(s.done, []);
});
await ok("yesterday is logged by what was committed to (Today and done), not by the pile", async () => {
  const s = await st(); assert.equal(s.dayLog[0].d, yesterday); assert.equal(s.dayLog[0].done, 1); assert.equal(s.dayLog[0].planned, 3, "1 done + 2 in Today, not 1 + 5");
});
await ok("Waiting says where each card came from, and the footer says how many wait", async () => {
  const t = await p.locator("#plan").innerText(); assert.match(t, new RegExp("Carried over from " + yesterday.slice(5))); assert.match(await p.locator("#plan-count").innerText(), /4 waiting/); assert.match(await p.locator("#plan-roll").innerText(), /4 waiting from earlier days/);
});
await ok("Waiting shows the first 4 and offers the rest; Show all and Show fewer work", async () => {
  await seed(`(s, ids) => { s.plan = ids.slice(0, 7).map((id) => ({ k: "sub", id, done: false })); }`);
  assert.equal(await p.locator("#plan .chip").count(), 4); const more = p.locator("#plan-more"); assert.match(await more.innerText(), /show all 7/i);
  await more.click(); assert.equal(await p.locator("#plan .chip").count(), 7); assert.match(await more.innerText(), /show fewer/i); await more.click(); assert.equal(await p.locator("#plan .chip").count(), 4);
});
await ok("with 4 or fewer waiting there is no Show all", async () => { await seed(`(s, ids) => { s.plan = ids.slice(0, 3).map((id) => ({ k: "sub", id, done: false })); }`); assert.equal(await p.locator("#plan-more").isHidden(), true); });
await ok("a card the board suggested and you took keeps the board's reason; one you added says you chose it", async () => {
  await seed(); const name = await p.locator("#oftad-pick .pick-n").innerText(); await p.locator("#oftad-pick [data-pick-take]").click(); await settle();
  const c = p.locator("#oftad .chip").first(); assert.match(await c.locator(".c-why").innerText(), /^Why: .{10,}/); assert.match(await c.innerText(), new RegExp(name.slice(0, 10).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const s = await st(); assert.equal(s.oftad[0].src, "pick"); assert.ok(s.oftad[0].why.length > 10 && s.oftad[0].why.length <= 220);
  await p.evaluate(() => { const sub = Object.values(JSON.parse(localStorage.getItem("oys-min-deliveries-v1")).subs).find((q) => q.gid !== JSON.parse(localStorage.getItem("oys-min-deliveries-v1")).oftad[0] && true); window.__board.toolRun("focus_today", { subtask: Object.values(JSON.parse(localStorage.getItem("oys-min-deliveries-v1")).subs).filter((q) => q.id !== JSON.parse(localStorage.getItem("oys-min-deliveries-v1")).oftad[0].id).slice(-1)[0].name }); }); await settle();
  assert.match(await p.locator("#oftad").innerText(), /You chose this for today/);
});
await ok("on a low day (dose 1) the suggestion stops once Today holds one thing; the footer says so", async () => {
  await seed(`(s) => { const n = new Date(), q = (x) => String(x).padStart(2, "0"); s.cap = { d: n.getFullYear() + "-" + q(n.getMonth() + 1) + "-" + q(n.getDate()), mode: "low" }; }`);
  assert.equal(await p.locator("#oftad-pick").isVisible(), true); await p.locator("#oftad-pick [data-pick-take]").click(); await settle();
  assert.equal(await p.locator("#oftad-pick").isHidden(), true); assert.match(await p.locator("#oftad-count").innerText(), /1 of today.s dose of 1 \(low day\)/);
});
await ok("on a normal day (dose 3) it keeps offering until Today holds three", async () => {
  await seed(); for (let i = 1; i <= 3; i++) { assert.equal(await p.locator("#oftad-pick").isVisible(), true, "offer " + i); assert.match(await p.locator("#oftad-count").innerText(), new RegExp((i - 1) + " of today.s dose of 3")); await p.locator("#oftad-pick [data-pick-take]").click(); await settle(); }
  assert.equal(await p.locator("#oftad-pick").isHidden(), true); assert.match(await p.locator("#oftad-count").innerText(), /3 of today.s dose of 3/);
});
await ok("past the dose, it says so and leaves the choice to you", async () => {
  await seed(`(s, ids) => { const n = new Date(), q = (x) => String(x).padStart(2, "0"); s.cap = { d: n.getFullYear() + "-" + q(n.getMonth() + 1) + "-" + q(n.getDate()), mode: "low" }; s.oftad = [{ k: "sub", id: ids[0], done: false }, { k: "sub", id: ids[5], done: false }]; }`);
  assert.match(await p.locator("#oftad-count").innerText(), /over the dose, your call/);
});
await ok("Done today counts Today and finished cards, not Waiting", async () => {
  await seed(`(s, ids) => { s.oftad = [{ k: "sub", id: ids[0], done: false }]; s.done = [{ k: "sub", id: ids[1], done: true }]; s.plan = ids.slice(2, 8).map((id) => ({ k: "sub", id, done: false })); }`);
  assert.equal(await p.locator("#kpi-today").innerText(), "1/2");
});
await ok("the afternoon check names Today only: nothing in Today, no notification, even with a long Waiting list", async () => {
  await seed(`(s, ids) => { s.plan = ids.slice(0, 6).map((id) => ({ k: "sub", id, done: false })); }`);
  await p.evaluate(() => { const d = new Date(); d.setHours(16, 0, 0, 0); window.__board.remind(d); window.__board.remind(d); window.__board.remind(d); }); await settle(); assert.deepEqual(await p.evaluate(() => window.__notes.filter((n) => n.tag === "oys-today")), []);
  await seed(`(s, ids) => { s.oftad = [{ k: "sub", id: ids[0], done: false }]; s.plan = ids.slice(1, 6).map((id) => ({ k: "sub", id, done: false })); }`);
  await p.evaluate(() => { const d = new Date(); d.setHours(16, 0, 0, 0); window.__board.remind(d); window.__board.remind(d); window.__board.remind(d); }); await settle(); const n = await p.evaluate(() => window.__notes.filter((x) => x.tag === "oys-today")); assert.equal(n.length, 1);
});
await ok("a carried pile no longer makes every day look low", async () => {
  const d1 = await ago(1), d2 = await ago(2), d3 = await ago(3);
  await seed(`(s, ids) => { s.dayLog = [{ d: "${d1}", done: 1, planned: 1, items: [] }, { d: "${d2}", done: 1, planned: 1, items: [] }, { d: "${d3}", done: 1, planned: 1, items: [] }]; s.plan = ids.slice(0, 10).map((id) => ({ k: "sub", id, done: false, carried: true })); }`);
  assert.equal(await p.evaluate(() => window.__board.dose ? window.__board.dose().band : "x"), "normal");
});
await ok("Needs attention: new name; on a low day no count and no siren", async () => {
  await seed(); assert.equal(await p.locator(".k-label", { hasText: "Needs attention" }).count(), 1); assert.equal(await p.locator(".k-label", { hasText: /^Alarm$/ }).count(), 0);
  assert.match(await p.locator('[data-panel="alerts"] .p-title').innerText(), /Needs attention/);
  await seed(`(s) => { const n = new Date(), q = (x) => String(x).padStart(2, "0"); s.cap = { d: n.getFullYear() + "-" + q(n.getMonth() + 1) + "-" + q(n.getDate()), mode: "low" }; }`);
  assert.equal((await p.locator("#kpi-alert").innerText()).trim(), "–"); assert.equal(await p.locator("#kpi-alert-sub").innerText(), "paused on a low day"); assert.equal(await p.evaluate(() => document.querySelector('[data-panel="alerts"]').classList.contains("siren")), false);
});
await ok("the tutor knows the new names", async () => {
  const r = await p.evaluate(() => ({ snap: window.__board.modelTools().find((t) => t.name === "board_state").execute({}), rules: window.__board.rules, brain: window.__board.brain("what is left today") })); assert.match(r.snap, /TODAY \(what the person is doing today/); assert.match(r.snap, /WAITING \(queued or carried over/); assert.ok(!/ONE TASK A DAY|TODAY'S PLAN/.test(r.snap)); assert.match(r.rules, /three lists \(Today, Waiting, Done today\)/);
});
await ok("at 412px the cards fit and nothing scrolls sideways", async () => {
  await seed(`(s, ids) => { s.oftad = [{ k: "sub", id: ids[0], done: false, why: "It is 09:00 on a Monday and your time is your own. This goal is due soonest." }]; s.plan = ids.slice(1, 8).map((id) => ({ k: "sub", id, done: false, carried: true, from: "2026-10-04" })); }`);
  await p.setViewportSize({ width: 412, height: 900 }); await settle(); const r = await p.evaluate(() => ({ sx: document.documentElement.scrollWidth, w: innerWidth })); assert.ok(r.sx <= r.w, JSON.stringify(r)); await p.setViewportSize({ width: 1280, height: 1400 });
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
