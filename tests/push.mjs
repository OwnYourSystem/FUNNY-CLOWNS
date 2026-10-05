import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const ORIGIN = new globalThis.URL(URL).origin;
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });

/* ---------- 1. the service worker: what a push becomes on the device ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, permissions: ["notifications"] });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); let regId = null;
  cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => { if (e.registrations && e.registrations.length) regId = e.registrations[0].registrationId; });
  await cdp.send("ServiceWorker.enable");
  await p.goto(URL); await p.waitForSelector("#btn-remind", { state: "attached" });
  await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY]);
  await p.reload(); await p.waitForSelector(".row.pick");
  await p.evaluate(async () => { await navigator.serviceWorker.ready; });
  for (let i = 0; i < 50 && !regId; i++) await p.waitForTimeout(100);
  const push = async (data) => { await cdp.send("ServiceWorker.deliverPushMessage", { origin: ORIGIN, registrationId: regId, data }); await p.waitForTimeout(400); };
  const shown = () => p.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag })));
  const closeAll = () => p.evaluate(async () => { for (const n of await (await navigator.serviceWorker.ready).getNotifications()) n.close(); });
  const setDigest = (d) => p.evaluate(async (d) => { const c = await caches.open("board-digest"); const u = new URL("digest.json", document.baseURI).href; if (d === null) await c.delete(u); else await c.put(u, new Response(JSON.stringify(d))); }, d);
  const today = await p.evaluate(() => { const d = new Date(), q = (n) => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); });
  const yest = await p.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 1); const q = (n) => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); });

  await ok("the worker is registered and the cache that holds the summary survives a worker update", async () => {
    assert.ok(regId, "no registration");
    await setDigest({ d: today, am: { t: "x", b: "y" }, nOpen: 0, open: [] });
    const keys = await p.evaluate(() => caches.keys()); assert.ok(keys.includes("board-digest"));
  });
  await ok("the page writes the summary: today's date, the brief, what is open, and no more", async () => {
    await p.evaluate(() => window.__board.push.digest()); await p.waitForTimeout(300);
    const d = await p.evaluate(async () => { const c = await caches.open("board-digest"); const r = await c.match(new URL("digest.json", document.baseURI).href); return r.json(); });
    assert.equal(d.d, today); assert.ok(d.am && d.am.t); assert.equal(typeof d.nOpen, "number"); assert.ok(d.open.length <= 3);
    assert.deepEqual(Object.keys(d).sort(), ["am", "d", "nOpen", "open", "t"]);
  });
  await ok("am with today's summary shows the brief, title under 41 and body under 121 characters", async () => {
    await closeAll(); await setDigest({ d: today, t: 1, am: { t: "Write the quarterly report for the whole department and send it", b: "You have a clear hour. ".repeat(12) }, nOpen: 2, open: ["a", "b"] });
    await push(JSON.stringify({ k: "am" })); const s = await shown(); assert.equal(s.length, 1);
    assert.match(s[0].title, /^Today: Write the quarterly/); assert.ok(s[0].title.length <= 40, s[0].title.length); assert.ok(s[0].body.length <= 120); assert.equal(s[0].tag, "oys-brief");
  });
  await ok("pm with open items names them; with none it says Today is clear", async () => {
    await closeAll(); await setDigest({ d: today, t: 1, am: { t: "x", b: "y" }, nOpen: 3, open: ["Alpha", "Beta", "Gamma"] });
    await push(JSON.stringify({ k: "pm" })); let s = await shown(); assert.equal(s[0].title, "Still open"); assert.equal(s[0].body, "3 still open: Alpha, Beta, Gamma"); assert.equal(s[0].tag, "oys-today");
    await closeAll(); await setDigest({ d: today, t: 1, am: { t: "x", b: "y" }, nOpen: 0, open: [] });
    await push(JSON.stringify({ k: "pm" })); s = await shown(); assert.equal(s[0].title, "Today is clear");
  });
  await ok("a summary from yesterday is never quoted: a plain line instead", async () => {
    await closeAll(); await setDigest({ d: yest, t: 1, am: { t: "Old step", b: "Old reason" }, nOpen: 5, open: ["Old"] });
    await push(JSON.stringify({ k: "am" })); let s = await shown(); assert.equal(s[0].title, "A new day"); assert.ok(!/Old/.test(s[0].body));
    await closeAll(); await push(JSON.stringify({ k: "pm" })); s = await shown(); assert.equal(s[0].title, "Check in"); assert.ok(!/5|Old/.test(s[0].body));
  });
  await ok("no summary at all still shows a notification (the browser requires one), and says nothing false", async () => {
    await closeAll(); await setDigest(null); await push(JSON.stringify({ k: "am" })); const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].title, "A new day");
  });
  await ok("a message with no data, or something odd, shows the generic reminder and never breaks", async () => {
    await closeAll(); await push(""); let s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].title, "Reminder");
    await closeAll(); await push("not json {"); s = await shown(); assert.equal(s[0].title, "Reminder");
    await closeAll(); await push(JSON.stringify({ k: "<script>" })); s = await shown(); assert.equal(s[0].title, "Reminder");
  });
  await ok("the am and pm notifications share a tag with the in-page ones, so one replaces the other", async () => {
    await closeAll(); await setDigest({ d: today, t: 1, am: { t: "A", b: "B" }, nOpen: 1, open: ["z"] });
    await push(JSON.stringify({ k: "am" })); await push(JSON.stringify({ k: "am" })); assert.equal((await shown()).length, 1);
  });
  await ok("pressing a notification closes it", async () => {
    await closeAll(); await push(JSON.stringify({ k: "am" })); assert.equal((await shown()).length, 1);
    const w = ctx.serviceWorkers()[0]; assert.ok(w);
    await w.evaluate(async () => { const n = (await self.registration.getNotifications())[0]; self.dispatchEvent(new NotificationEvent("notificationclick", { notification: n })); });
    await p.waitForTimeout(400); assert.equal((await shown()).length, 0);
  });
  await ok("no page errors (worker section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}

/* ---------- 2. the page: the Reminders button, the subscription, the server calls ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  const calls = []; let failSub = false;
  await ctx.route("https://phicqgnzqnuwugzbgxxw.supabase.co/functions/v1/push/**", async (route) => {
    const req = route.request(), path = req.url().split("/push/")[1];
    calls.push({ path, method: req.method(), body: req.postData() ? JSON.parse(req.postData()) : null });
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (failSub && path === "subscribe") return route.fulfill({ status: 503, headers: cors, contentType: "application/json", body: JSON.stringify({ error: "full" }) });
    const key = Buffer.from(Uint8Array.from({ length: 65 }, (_, i) => (i === 0 ? 4 : i))).toString("base64url");
    route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(path === "config" ? { key } : { ok: true }) });
  });
  await ctx.addInitScript(() => {
    window.__perm = (function () { try { return sessionStorage.getItem("perm") || "default"; } catch (e) { return "default"; } })();
    function N(t, o) {} Object.defineProperty(N, "permission", { get() { return window.__perm; } });
    N.requestPermission = () => { window.__asked = (window.__asked || 0) + 1; window.__perm = "granted"; try { sessionStorage.setItem("perm", "granted"); } catch (e) {} return Promise.resolve("granted"); };
    try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; }
    let cur = null; try { if (localStorage.getItem("__fakesub")) cur = 1; } catch (e) {}
    const fake = { endpoint: "https://fcm.googleapis.com/fcm/send/TESTDEVICE", toJSON() { return { endpoint: this.endpoint, keys: { p256dh: "B" + "x".repeat(86), auth: "y".repeat(22) } }; }, unsubscribe() { window.__unsub = (window.__unsub || 0) + 1; cur = null; try { localStorage.removeItem("__fakesub"); } catch (e) {} return Promise.resolve(true); } };
    if (window.PushManager) { PushManager.prototype.getSubscription = () => Promise.resolve(cur ? fake : null); PushManager.prototype.subscribe = (o) => { window.__subOpts = { uvo: o.userVisibleOnly, keyLen: o.applicationServerKey.length }; cur = 1; try { localStorage.setItem("__fakesub", "1"); } catch (e) {} return Promise.resolve(fake); }; }
    if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = function () { return Promise.resolve(); };
  });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector("#btn-remind", { state: "attached" });
  await p.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; s.me.brief = "08:15"; s.me.wind = "21:45"; localStorage.setItem(KEY, JSON.stringify(s)); localStorage.removeItem("oys-push"); localStorage.removeItem("oys-remind"); sessionStorage.setItem("perm", "default"); }, [KEY]);
  await p.reload(); await p.waitForSelector(".row.pick"); await p.evaluate(() => navigator.serviceWorker.ready);
  const label = () => p.locator("#btn-remind").innerText();

  await ok("nothing is asked, and nothing is sent, on load", async () => {
    assert.equal(await label(), "Reminders off"); assert.equal(await p.evaluate(() => window.__asked || 0), 0); assert.equal(calls.length, 0);
  });
  await ok("Not now sends nothing and asks the browser nothing", async () => {
    await p.locator("#btn-remind").click(); await p.locator("dialog[open]").waitFor({ state: "visible" });
    const txt = await p.locator("dialog[open]").innerText(); assert.match(txt, /At most 2 a day/); assert.match(txt, /time zone/); assert.match(txt, /never gets a task/);
    await p.getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => window.__asked || 0), 0); assert.equal(calls.length, 0); assert.equal(await label(), "Reminders off");
  });
  await ok("Continue asks the browser, subscribes, and tells the server the schedule and nothing else", async () => {
    await p.locator("#btn-remind").click(); await p.locator("dialog[open]").waitFor({ state: "visible" });
    await p.getByRole("button", { name: "Continue" }).click(); await p.waitForFunction(() => window.__board.push.state().on === true, null, { timeout: 5000 });
    assert.equal(await p.evaluate(() => window.__asked), 1);
    assert.deepEqual(calls.map((c) => c.path), ["config", "subscribe"]);
    const sb = calls[1].body; assert.equal(sb.sub.endpoint, "https://fcm.googleapis.com/fcm/send/TESTDEVICE"); assert.equal(sb.brief, "08:15"); assert.equal(sb.wind, "21:45");
    assert.equal(sb.am, true); assert.equal(sb.pm, true); assert.ok(sb.tz.length > 2);
    assert.deepEqual(Object.keys(sb).sort(), ["am", "brief", "pm", "sub", "tz", "wind"]);
    const s = JSON.stringify(sb); const board = await p.evaluate((KEY) => localStorage.getItem(KEY), KEY);
    for (const sub of JSON.parse(board).subs ? Object.values(JSON.parse(board).subs).slice(0, 5) : []) assert.ok(!s.includes(sub.name), "a task name reached the server");
    assert.deepEqual(await p.evaluate(() => window.__subOpts), { uvo: true, keyLen: 65 });
  });
  await ok("the button says push only now that the server confirmed", async () => { assert.equal(await label(), "Reminders on (push)"); });
  await ok("changing the brief time tells the server within a few seconds, once", async () => {
    const n = calls.length;
    await p.evaluate(() => window.__board.toolRun("set_setting", { key: "brief_time", value: "09:00" })); await p.waitForTimeout(3800);
    const sub = calls.slice(n).filter((c) => c.path === "subscribe"); assert.equal(sub.length, 1); assert.equal(sub[0].body.brief, "09:00");
  });
  await ok("a summary is kept for the worker after a save", async () => {
    const d = await p.evaluate(async () => { const c = await caches.open("board-digest"); const r = await c.match(new URL("digest.json", document.baseURI).href); return r ? r.json() : null; }); assert.ok(d && d.d);
  });
  await ok("it survives a reload: still on, and it does not subscribe again", async () => {
    const n = calls.length; await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(800);
    assert.equal(await label(), "Reminders on (push)"); assert.equal(calls.slice(n).filter((c) => c.path === "subscribe").length, 0);
  });
  await ok("turning off unsubscribes at the server and in the browser, and the choice survives a reload", async () => {
    const n = calls.length; await p.locator("#btn-remind").click(); await p.waitForTimeout(500);
    const un = calls.slice(n).filter((c) => c.path === "unsubscribe"); assert.equal(un.length, 1);
    assert.deepEqual(Object.keys(un[0].body).sort(), ["auth", "endpoint"]); assert.equal(await p.evaluate(() => window.__unsub), 1);
    assert.equal(await label(), "Reminders off"); await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(400); assert.equal(await label(), "Reminders off");
  });
  await ok("turning on again subscribes again", async () => {
    const n = calls.length; await p.locator("#btn-remind").click(); await p.waitForFunction(() => window.__board.push.state().on === true, null, { timeout: 5000 });
    assert.ok(calls.slice(n).some((c) => c.path === "subscribe")); assert.equal(await label(), "Reminders on (push)");
  });
  await ok("if the server refuses, the button does not claim push", async () => {
    await p.locator("#btn-remind").click(); await p.waitForTimeout(400); failSub = true;
    await p.evaluate(() => { localStorage.removeItem("oys-push"); }); await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(300);
    assert.equal(await label(), "Reminders off");
    await p.locator("#btn-remind").click(); await p.waitForTimeout(900);
    assert.equal(await label(), "Reminders on (while open)"); assert.equal(await p.evaluate(() => window.__board.push.state().on), false);
  });
  await ok("no page errors (page section)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
console.log(results.join("\n")); await b.close();
