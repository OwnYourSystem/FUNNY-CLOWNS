/* Daysize (2026-10-19): the name, the mark, and a notification badge Android can paint. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const ORIGIN = new globalThis.URL(URL).origin;
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ["notifications"] });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
const shown = () => p.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, body: n.body, icon: n.icon, badge: n.badge })));
const closeAll = () => p.evaluate(async () => { for (const n of await (await navigator.serviceWorker.ready).getNotifications()) n.close(); });

await ok("the name is Daysize: page title, home-screen title, app name", async () => {
  assert.equal(await p.title(), "Daysize");
  assert.equal(await p.locator('meta[name="apple-mobile-web-app-title"]').getAttribute("content"), "Daysize");
  const m = await p.evaluate(async () => (await fetch("manifest.webmanifest", { cache: "no-store" })).json());
  assert.equal(m.name, "Daysize"); assert.equal(m.short_name, "Daysize"); assert.equal(m.theme_color.toUpperCase(), "#2C1332");
  assert.ok(!/Minimum Deliveries/.test(await p.content()), "the old name is still on the page");
});
await ok("the welcome shows the mark and the name", async () => {
  const img = p.locator(".ph-onb .ph-logo"); assert.equal(await img.isVisible(), true);
  assert.equal(await img.evaluate((e) => e.complete && e.naturalWidth), 192);
  assert.match(await p.locator(".ph-onb .ph-k").first().innerText(), /^Daysize$/i);
});
await ok("the badge is one colour on a see-through ground, so Android paints the mark, not a square", async () => {
  const r = await p.evaluate(async () => {
    const im = new Image(); im.src = "badge-96.png?t=" + Date.now(); await im.decode();
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const x = c.getContext("2d"); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let clear = 0, solid = 0, other = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] === 0) clear++; else if (d[i + 3] > 200) { solid++; if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) other++; } }
    const a = (px, py) => d[(py * c.width + px) * 4 + 3];
    return { w: im.width, corner: a(1, 1), clear, solid, other };
  });
  assert.equal(r.w, 96); assert.equal(r.corner, 0, "the corner is not see-through");
  assert.ok(r.clear > r.solid * 0.5 && r.solid > 96 * 96 * 0.25, JSON.stringify(r)); assert.equal(r.other, 0, "the badge has colour in it");
});
await ok("the home-screen icons are the plum mark, not the old black and red", async () => {
  const px = await p.evaluate(async () => {
    const at = async (src, fx, fy) => { const im = new Image(); im.src = src + "?t=" + Date.now(); await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
      const x = c.getContext("2d"); x.drawImage(im, 0, 0); return [...x.getImageData(Math.round(im.width * fx), Math.round(im.height * fy), 1, 1).data].slice(0, 3).join(","); };
    return { corner: await at("icon-192.png", 0.02, 0.02), tag: await at("icon-192.png", 0.36, 0.42), apple: await at("apple-touch-icon.png", 0.36, 0.42) };
  });
  assert.equal(px.corner, "44,19,50"); assert.equal(px.tag, "216,194,224"); assert.equal(px.apple, "216,194,224");
});

/* the reminder a push becomes: the worker draws it */
await p.evaluate(async () => { await navigator.serviceWorker.ready; });
const cdp = await ctx.newCDPSession(p); let regId = null;
cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => { if (e.registrations && e.registrations.length) regId = e.registrations[0].registrationId; });
await cdp.send("ServiceWorker.enable"); for (let i = 0; i < 50 && !regId; i++) await p.waitForTimeout(100);
await ok("a pushed reminder carries the mark, the one-colour badge, and says Daysize when it has no summary", async () => {
  await closeAll(); await cdp.send("ServiceWorker.deliverPushMessage", { origin: ORIGIN, registrationId: regId, data: JSON.stringify({ k: "am" }) }); await p.waitForTimeout(400);
  const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].title, "A new day");
  assert.match(s[0].body, /Daysize/); assert.match(s[0].icon, /icon-192\.png$/); assert.match(s[0].badge, /badge-96\.png$/);
});

/* You: send a test reminder */
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(150); await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(300);
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(500);
await p.evaluate(() => { location.hash = "#/you"; }); await p.waitForTimeout(300);
await ok("with reminders on, You offers a test reminder; it shows at once with the same mark and badge", async () => {
  const on = await p.evaluate(() => document.getElementById("btn-remind").getAttribute("aria-pressed"));
  assert.equal(on, "true", "reminders did not come on after the welcome");
  const row = p.locator("[data-ph=remtest]"); assert.equal(await row.isVisible(), true);
  assert.ok((await row.boundingBox()).height >= 44);
  await closeAll(); await row.click(); await p.waitForTimeout(500);
  const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].title, "A test from Daysize");
  assert.match(s[0].icon, /icon-192\.png$/); assert.match(s[0].badge, /badge-96\.png$/);
});
await ok("with reminders off, there is no test row", async () => {
  await p.evaluate(() => { document.getElementById("btn-remind").setAttribute("aria-pressed", "false"); location.hash = "#/goals"; });
  await p.waitForTimeout(200); await p.evaluate(() => { location.hash = "#/you"; }); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=remtest]").count(), 0);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
