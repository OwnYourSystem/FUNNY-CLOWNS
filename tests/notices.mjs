/* Reminders the person sets, that stay until closed and never cover the board (owner, 2026-10-15). */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const ORIGIN = new globalThis.URL(URL).origin;
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
/* these suites test the classic board, which a phone-width page now shows only in Classic view */
const _nc = b.newContext.bind(b); b.newContext = async (o) => { const c = await _nc(o); await c.addInitScript(() => { try { localStorage.setItem("oys-classic", "1"); } catch (e) {} }); return c; };
const ymd = (d) => { const q = (n) => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); };
const TODAY = ymd(new Date());
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

/* ---------- 1. the worker: a push stays until closed, and writes nothing that could hold the board ---------- */
{
  const ctx = await b.newContext({ ...PHONE, permissions: ["notifications"] });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); let regId = null;
  cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => { if (e.registrations && e.registrations.length) regId = e.registrations[0].registrationId; });
  await cdp.send("ServiceWorker.enable");
  await p.goto(URL); await p.waitForSelector("#btn-remind", { state: "attached" });
  await p.evaluate(([KEY, TODAY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.told = { d: TODAY, am: true, pm: true, hint: true }; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY, TODAY]);
  await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(async () => { await navigator.serviceWorker.ready; });
  for (let i = 0; i < 50 && !regId; i++) await p.waitForTimeout(100);
  const push = async (data) => { await cdp.send("ServiceWorker.deliverPushMessage", { origin: ORIGIN, registrationId: regId, data }); await p.waitForTimeout(500); };
  const shown = () => p.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, tag: n.tag, ri: n.requireInteraction })));
  await p.evaluate(async () => { const c = await caches.open("board-digest"); await c.put(new URL("digest.json", document.baseURI).href, new Response(JSON.stringify({ d: new Date().toISOString().slice(0, 10), am: { t: "Write the report", b: "A clear hour." }, nOpen: 1, open: ["a"] }))); });
  await ok("a push notification asks to stay until it is closed", async () => {
    await push(JSON.stringify({ k: "am" })); const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].ri, true);
  });
  await ok("a push while the board is open on a phone opens nothing over the board, and leaves no notice behind", async () => {
    await push(JSON.stringify({ k: "pm" })); await p.waitForTimeout(400);
    assert.equal(await p.locator("dialog.ask[open]").count(), 0);
    assert.equal(await p.evaluate(async () => !!(await (await caches.open("board-digest")).match(new URL("notice.json", document.baseURI).href))), false);
  });
  await ok("no page errors (worker section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}

/* ---------- 2. the page on a phone ---------- */
const stub = () => {
  window.__notes = []; window.__perm = (function () { try { return sessionStorage.getItem("perm") || "granted"; } catch (e) { return "granted"; } })();
  function N(title, o) { window.__notes.push({ title, body: o && o.body, tag: o && o.tag, ri: o && o.requireInteraction }); }
  Object.defineProperty(N, "permission", { get() { return window.__perm; } }); N.requestPermission = () => Promise.resolve("granted");
  if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = function (t, o) { window.__notes.push({ title: t, body: o && o.body, tag: o && o.tag, ri: o && o.requireInteraction }); return Promise.resolve(); };
  try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; }
};
{
  const ctx = await b.newContext(PHONE); await ctx.addInitScript(stub);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector("#btn-remind", { state: "attached" });
  /* me: the person's choices; told: what was already sent today; the reload itself must not fire anything */
  const day = (me, told) => p.evaluate(([KEY, me, told]) => {
    const s = JSON.parse(localStorage.getItem(KEY)); s.me = Object.assign(s.me || {}, { done: true, brief: "07:30", wind: "22:30", hintNote: false }, me);
    s.told = told; s.oftad = [{ k: "sub", id: Object.keys(s.subs)[0], done: false }]; localStorage.setItem(KEY, JSON.stringify(s)); sessionStorage.setItem("perm", "default");
  }, [KEY, me, told]).then(() => p.reload()).then(() => p.waitForSelector(".row.pick")).then(() => p.evaluate(() => { sessionStorage.removeItem("perm"); window.__perm = "granted"; window.__notes.length = 0; }));
  const at = (h, m) => p.evaluate(([h, m]) => { const d = new Date(); d.setHours(h, m, 0, 0); window.__board.remind(d); }, [h, m]).then(() => p.waitForTimeout(400));
  const notes = () => p.evaluate(() => window.__notes.slice());
  const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
  const say = async (t) => { await p.evaluate(() => window.__board.openSheet()); await p.fill("#bot-input", t); await p.press("#bot-input", "Enter"); await p.waitForTimeout(150);
    const r = await p.evaluate(() => { const m = document.querySelectorAll("#bot-log .bot-msg.bot"); return m.length ? m[m.length - 1].textContent : ""; }); await p.keyboard.press("Escape"); return r; };

  await ok("a reminder that fires while the board is open asks to stay, and nothing covers the board", async () => {
    await day({}, null); await at(8, 0);
    const n = await notes(); assert.equal(n.length, 1); assert.equal(n[0].tag, "oys-brief"); assert.equal(n[0].ri, true);
    assert.equal(await p.locator("dialog.ask[open]").count(), 0);
  });
  await ok("the morning brief switched off never comes", async () => {
    await day({ remAm: false }, null); await at(8, 0); assert.equal((await notes()).filter((x) => x.tag === "oys-brief").length, 0);
  });
  await ok("the afternoon check comes at the person's own time, not at 15:00", async () => {
    await day({ pmAt: "16:30" }, { d: TODAY, am: true, pm: false, hint: true }); await at(15, 30); assert.equal((await notes()).length, 0);
    await at(16, 40); const n = await notes(); assert.equal(n.length, 1); assert.equal(n[0].title, "Still open"); assert.equal(n[0].ri, true);
  });
  await ok("the afternoon check switched off never comes", async () => {
    await day({ remPm: false }, { d: TODAY, am: true, pm: false, hint: true }); await at(16, 0); assert.equal((await notes()).length, 0);
  });
  await ok("the board says nothing on its own when it opens: no note floats over the cards", async () => {
    await day({}, { d: TODAY, am: true, pm: true, hint: true }); await p.waitForTimeout(2600);
    assert.equal(await p.evaluate(() => { const n = document.getElementById("flashnote"); return !n || n.hidden || !n.textContent; }), true);
  });
  await ok("the assistant sets them: turn the afternoon check off, morning brief on, afternoon check at 4pm", async () => {
    await say("turn the afternoon check off"); assert.equal((await st()).me.remPm, false);
    await say("afternoon check on"); assert.equal((await st()).me.remPm, true);
    const r = await say("afternoon check at 4pm"); assert.match(r, /16:00/); assert.equal((await st()).me.pmAt, "16:00");
    const r2 = await say("afternoon check at 11pm"); assert.match(r2, /after your day ends/); assert.equal((await st()).me.pmAt, "16:00");
    await say("switch the morning brief off"); assert.equal((await st()).me.remAm, false);
    const r3 = await say("afternoon check off"); assert.match(r3, /Both reminders are off/);
  });
  await ok("the backlog on a phone: a long name gets its own line, not one letter a line", async () => {
    await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.backlog = [{ t: "Local LLM Sunscape evaluation for the analytics team", d: "2026-10-15" }]; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
    await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(() => { location.hash = "#/backlog"; }); await p.waitForTimeout(400);
    const w = await p.locator("#backlog-list .gcard .gname").first().evaluate((e) => e.getBoundingClientRect().width); assert.ok(w > 200, "name width " + w);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await p.locator("#backlog-list .gcard").first().screenshot({ path: "/tmp/claude-0/shot-backlog.png" });
  });
  await ok("no page errors (phone section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
