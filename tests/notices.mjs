import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const ORIGIN = new globalThis.URL(URL).origin;
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ymd = (d) => { const q = (n) => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); };
const TODAY = ymd(new Date()); const YEST = ymd(new Date(Date.now() - 864e5));

/* ---------- 1. the worker: a reminder stays until closed, and leaves a notice for the page ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, permissions: ["notifications"] });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); let regId = null;
  cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => { if (e.registrations && e.registrations.length) regId = e.registrations[0].registrationId; });
  await cdp.send("ServiceWorker.enable");
  await p.goto(URL); await p.waitForSelector("#btn-remind", { state: "attached" });
  await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
  await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(async () => { await navigator.serviceWorker.ready; });
  for (let i = 0; i < 50 && !regId; i++) await p.waitForTimeout(100);
  const push = async (data) => { await cdp.send("ServiceWorker.deliverPushMessage", { origin: ORIGIN, registrationId: regId, data }); await p.waitForTimeout(500); };
  const shown = () => p.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, tag: n.tag, ri: n.requireInteraction })));
  const closeAll = () => p.evaluate(async () => { for (const n of await (await navigator.serviceWorker.ready).getNotifications()) n.close(); });
  const notice = () => p.evaluate(async () => { const c = await caches.open("board-digest"); const r = await c.match(new URL("notice.json", document.baseURI).href); return r ? r.json() : null; });
  const clearNotice = () => p.evaluate(async () => { const c = await caches.open("board-digest"); await c.delete(new URL("notice.json", document.baseURI).href); });
  const setDigest = (d) => p.evaluate(async (d) => { const c = await caches.open("board-digest"); await c.put(new URL("digest.json", document.baseURI).href, new Response(JSON.stringify(d))); }, d);

  await ok("a push notification asks to stay until closed", async () => {
    await closeAll(); await setDigest({ d: TODAY, t: 1, am: { t: "Write the report", b: "A clear hour." }, nOpen: 2, open: ["a", "b"] });
    await push(JSON.stringify({ k: "am" })); const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].ri, true);
  });
  await ok("the morning and afternoon pushes leave a notice with today's date, the title, the text and the tag", async () => {
    await clearNotice(); await push(JSON.stringify({ k: "am" })); let n = await notice();
    assert.equal(n.d, TODAY); assert.match(n.t, /^Today: Write the report/); assert.equal(n.b, "A clear hour."); assert.equal(n.tag, "oys-brief");
    await clearNotice(); await push(JSON.stringify({ k: "pm" })); n = await notice();
    assert.equal(n.tag, "oys-today"); assert.equal(n.t, "Still open"); assert.deepEqual(Object.keys(n).sort(), ["at", "b", "d", "t", "tag"]);
  });
  await ok("a generic or odd push leaves no notice, so it never holds the board", async () => {
    await clearNotice(); await push(""); assert.equal(await notice(), null); await push(JSON.stringify({ k: "<x>" })); assert.equal(await notice(), null);
  });
  await ok("swiping the reminder away closes it: the notice goes, and the board does not hold the person to it", async () => {
    await closeAll(); await push(JSON.stringify({ k: "am" })); assert.ok(await notice());
    const w = ctx.serviceWorkers()[0];
    await w.evaluate(async () => { const n = (await self.registration.getNotifications())[0]; self.dispatchEvent(new NotificationEvent("notificationclose", { notification: n })); });
    await p.waitForTimeout(400); assert.equal(await notice(), null);
  });
  await ok("pressing the reminder keeps the notice, so the page can ask for the acknowledgement", async () => {
    await closeAll(); await push(JSON.stringify({ k: "pm" }));
    const w = ctx.serviceWorkers()[0];
    await w.evaluate(async () => { const n = (await self.registration.getNotifications())[0]; self.dispatchEvent(new NotificationEvent("notificationclick", { notification: n })); });
    await p.waitForTimeout(400); assert.ok(await notice());
  });
  await ok("no page errors (worker section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}

/* ---------- 2. the page on a phone: the board is held still until the person answers ---------- */
const stub = () => {
  window.__notes = []; window.__perm = "granted";
  function N(title, o) { window.__notes.push({ title, body: o && o.body, tag: o && o.tag, ri: o && o.requireInteraction }); }
  Object.defineProperty(N, "permission", { get() { return window.__perm; } }); N.requestPermission = () => Promise.resolve("granted");
  if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = function (t, o) { window.__notes.push({ title: t, body: o && o.body, tag: o && o.tag, ri: o && o.requireInteraction }); return Promise.resolve(); };
  try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; }
};
async function session(mobile) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(stub);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector("#btn-remind", { state: "attached" });
  await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.me.brief = "07:30"; s.me.wind = "23:59"; s.me.hintNote = false; s.told = null; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
  await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(() => navigator.serviceWorker.ready);
  const put = (n) => p.evaluate(async (n) => { const c = await caches.open("board-digest"); const u = new URL("notice.json", document.baseURI).href; if (n === null) await c.delete(u); else await c.put(u, new Response(JSON.stringify(n))); }, n);
  const get = () => p.evaluate(async () => { const c = await caches.open("board-digest"); const r = await c.match(new URL("notice.json", document.baseURI).href); return r ? r.json() : null; });
  const poll = () => p.evaluate(() => window.__board.notice.poll()).then(() => p.waitForTimeout(250));
  const dlg = () => p.locator("dialog.ask[open]");
  return { ctx, p, errs, put, get, poll, dlg };
}
{
  const { ctx, p, errs, put, get, poll, dlg } = await session(true);
  const brief = { d: TODAY, t: "Today: Write the report", b: "You have a clear hour.\n\nHeld back: Taxes, not now.", tag: "oys-brief", at: Date.now() };
  await ok("on a phone the page counts as a place that holds still", async () => { assert.equal(await p.evaluate(() => window.__board.notice.blocks()), true); });
  await ok("a waiting morning brief opens over the board with Got it and Close, and says what the notification said", async () => {
    await put(brief); await poll(); await dlg().waitFor({ state: "visible" });
    const txt = await dlg().innerText(); assert.match(txt, /Today: Write the report/); assert.match(txt, /clear hour/); assert.match(txt, /Held back: Taxes/);
    assert.equal(await dlg().getByRole("button", { name: "Got it" }).count(), 1); assert.equal(await dlg().getByRole("button", { name: "Close" }).count(), 1);
  });
  await ok("nothing behind it can be pressed or reached: the board is inert", async () => {
    let blocked = false; try { await p.locator("#btn-remind").click({ timeout: 800 }); } catch (e) { blocked = true; }
    assert.equal(blocked, true, "the Reminders button was pressable behind the reminder");
    assert.equal(await p.evaluate(() => document.querySelector("dialog.ask[open]").matches(":modal")), true);
    assert.equal(await p.evaluate(() => document.querySelector("dialog.ask[open]").matches(":modal")), true);
  });
  await ok("it stays: still open after 15 seconds, and polling again does not stack a second one", async () => {
    await p.waitForTimeout(15000); await poll(); await poll(); assert.equal(await p.locator("dialog.ask[open]").count(), 1);
  });
  await ok("Got it clears the notice and gives the board back", async () => {
    await dlg().getByRole("button", { name: "Got it" }).click(); await p.waitForTimeout(300);
    assert.equal(await p.locator("dialog.ask[open]").count(), 0); assert.equal(await get(), null);
    const before = await p.locator("#btn-remind").getAttribute("aria-pressed");
    await p.locator("#btn-remind").click({ timeout: 2000 }); await p.waitForTimeout(300);
    assert.notEqual(await p.locator("#btn-remind").getAttribute("aria-pressed"), before, "the board did not answer a press after Got it");
    await p.locator("#btn-remind").click({ timeout: 2000 }); await p.waitForTimeout(300);
  });
  await ok("Close, and Escape, count as closing it too", async () => {
    await put(brief); await poll(); await dlg().getByRole("button", { name: "Close" }).click(); await p.waitForTimeout(300); assert.equal(await get(), null);
    await put({ ...brief, tag: "oys-today", t: "Still open", b: "2 still open: A, B" }); await poll(); await dlg().waitFor({ state: "visible" }); await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    assert.equal(await p.locator("dialog.ask[open]").count(), 0); assert.equal(await get(), null);
  });
  await ok("a notice from yesterday never opens, and is dropped", async () => {
    await put({ ...brief, d: YEST }); await poll(); assert.equal(await p.locator("dialog.ask[open]").count(), 0); assert.equal(await get(), null);
  });
  await ok("a hint, or any tag that is not the two reminders, never holds the board", async () => {
    await put({ ...brief, tag: "oys-hint", t: "Today's hint" }); await poll(); assert.equal(await p.locator("dialog.ask[open]").count(), 0);
  });
  await ok("nothing opens after the day end", async () => {
    await put(brief); await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me.wind = "04:00"; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
    await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(600); assert.equal(await p.locator("dialog.ask[open]").count(), 0); assert.equal(await get(), null);
    await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me.wind = "23:59"; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]); await p.reload(); await p.waitForSelector(".row.pick");
  });
  await ok("a notice waiting when the board opens is shown at once, with no polling", async () => {
    await put(brief); await p.reload(); await p.waitForSelector(".row.pick"); await dlg().waitFor({ state: "visible", timeout: 4000 });
    await dlg().getByRole("button", { name: "Got it" }).click(); await p.waitForTimeout(200);
  });
  await ok("a reminder that fires while the board is open asks to stay, and holds the board", async () => {
    await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.told = null; s.oftad = [{ k: "sub", id: Object.keys(s.subs)[0], done: false }]; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
    await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(() => { window.__notes.length = 0; });
    await p.evaluate(() => { const d = new Date(); d.setHours(8, 0, 0, 0); window.__board.remind(d); }); await p.waitForTimeout(600);
    const n = await p.evaluate(() => window.__notes.slice()); assert.equal(n.length, 1); assert.equal(n[0].ri, true); assert.equal(n[0].tag, "oys-brief");
    await dlg().waitFor({ state: "visible", timeout: 3000 }); assert.match(await dlg().innerText(), /^Today:/);
    await dlg().getByRole("button", { name: "Got it" }).click(); await p.waitForTimeout(300); assert.equal(await get(), null);
  });
  await ok("the afternoon check holds the board too", async () => {
    await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); const d = new Date(), q = (n) => (n < 10 ? "0" : "") + n; s.told = { d: d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()), am: true, pm: false, hint: true }; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
    await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(() => { window.__notes.length = 0; });
    await p.evaluate(() => { const d = new Date(); d.setHours(15, 30, 0, 0); window.__board.remind(d); }); await p.waitForTimeout(600);
    await dlg().waitFor({ state: "visible", timeout: 3000 }); assert.match(await dlg().innerText(), /Still open/);
    assert.equal((await p.evaluate(() => window.__notes.slice()))[0].ri, true);
    await dlg().getByRole("button", { name: "Got it" }).click(); await p.waitForTimeout(200);
  });
  await ok("it fits a phone screen", async () => {
    await put(brief); await poll(); await dlg().waitFor({ state: "visible" });
    const box = await dlg().boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= 391 && box.y >= 0 && box.y + box.height <= 845, JSON.stringify(box));
    await dlg().screenshot({ path: "/tmp/claude-0/shot-notice.png" }); await dlg().getByRole("button", { name: "Got it" }).click();
  });
  await ok("the board still starts when a reminder is due the moment it loads, and holds itself for it", async () => {
    await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me.brief = "00:00"; s.told = null; s.oftad = [{ k: "sub", id: Object.keys(s.subs)[0], done: false }]; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
    await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(400);
    assert.equal(await p.evaluate(() => typeof window.__board), "object", "the page script stopped before the end");
    await dlg().waitFor({ state: "visible", timeout: 3000 }); await dlg().getByRole("button", { name: "Got it" }).click(); await p.waitForTimeout(200);
  });
  await ok("no page errors (phone section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}

/* ---------- 3. a computer is never held still ---------- */
{
  const { ctx, p, errs, put, get, poll } = await session(false);
  await ok("on a computer the notice does not open over the board, and waits quietly", async () => {
    assert.equal(await p.evaluate(() => window.__board.notice.blocks()), false);
    await put({ d: TODAY, t: "Today: X", b: "Y", tag: "oys-brief", at: Date.now() }); await poll(); assert.equal(await p.locator("dialog.ask[open]").count(), 0);
    assert.ok(await get());
  });
  await ok("no page errors (computer section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
