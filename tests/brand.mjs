/* The brand (2026-10-19): OwnYourDay, its mark, "Powered by OwnYourSystem", and a notification badge Android can paint. */
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

await ok("the name is OwnYourDay: page title, home-screen title, app name", async () => {
  assert.equal(await p.title(), "OwnYourDay");
  assert.equal(await p.locator('meta[name="apple-mobile-web-app-title"]').getAttribute("content"), "OwnYourDay");
  const m = await p.evaluate(async () => (await fetch("manifest.webmanifest", { cache: "no-store" })).json());
  assert.equal(m.name, "OwnYourDay"); assert.equal(m.short_name, "OwnYourDay"); assert.equal(m.theme_color.toUpperCase(), "#000000");
  assert.ok(!/Minimum Deliveries/.test(await p.content()), "the old name is still on the page");
});
await ok("the welcome shows the mark and the name", async () => {
  const img = p.locator(".ph-onb .ph-logo"); assert.equal(await img.isVisible(), true);
  assert.equal(await img.evaluate((e) => e.complete && e.naturalWidth), 192);
  assert.equal(await p.locator(".ph-onb .ph-word").first().innerText(), "OwnYourDay");
  assert.equal(await p.locator(".ph-onb .ph-by").first().innerText(), "Powered by OwnYourSystem");
  assert.ok(!/Daysize/.test(await p.content()), "the old name Daysize is still on the page");
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
  assert.ok(r.clear > r.solid && r.solid > 96 * 96 * 0.12, JSON.stringify(r)); assert.equal(r.other, 0, "the badge has colour in it");
});
await ok("the home-screen icons are the OwnYourDay mark: a sun over a sage arc, on cream", async () => {
  const px = await p.evaluate(async () => {
    const at = async (src, fx, fy) => { const im = new Image(); im.src = src + "?t=" + Date.now(); await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
      const x = c.getContext("2d"); x.drawImage(im, 0, 0); return [...x.getImageData(Math.round(im.width * fx), Math.round(im.height * fy), 1, 1).data].slice(0, 3).join(","); };
    return { corner: await at("icon-192.png", 0.02, 0.02), sun: await at("icon-192.png", 0.5, 0.37), sage: await at("icon-192.png", 0.48, 0.51), apple: await at("apple-touch-icon.png", 0.5, 0.37) };
  });
  assert.equal(px.corner, "251,249,244"); assert.equal(px.sun, "233,185,73"); assert.equal(px.sage, "157,181,154"); assert.equal(px.apple, "233,185,73");
});

/* the reminder a push becomes: the worker draws it */
await p.evaluate(async () => { await navigator.serviceWorker.ready; });
const cdp = await ctx.newCDPSession(p); let regId = null;
cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => { if (e.registrations && e.registrations.length) regId = e.registrations[0].registrationId; });
await cdp.send("ServiceWorker.enable"); for (let i = 0; i < 50 && !regId; i++) await p.waitForTimeout(100);
await ok("a pushed reminder carries the mark, the one-colour badge, and says OwnYourDay when it has no summary", async () => {
  await closeAll(); await cdp.send("ServiceWorker.deliverPushMessage", { origin: ORIGIN, registrationId: regId, data: JSON.stringify({ k: "am" }) }); await p.waitForTimeout(400);
  const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].title, "A new day");
  assert.match(s[0].body, /OwnYourDay/); assert.match(s[0].icon, /icon-192\.png$/); assert.match(s[0].badge, /badge-96\.png$/);
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
  const s = await shown(); assert.equal(s.length, 1); assert.equal(s[0].title, "A test from OwnYourDay");
  assert.match(s[0].icon, /icon-192\.png$/); assert.match(s[0].badge, /badge-96\.png$/);
});
await ok("with reminders off, there is no test row", async () => {
  await p.evaluate(() => { document.getElementById("btn-remind").setAttribute("aria-pressed", "false"); location.hash = "#/goals"; });
  await p.waitForTimeout(200); await p.evaluate(() => { location.hash = "#/you"; }); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=remtest]").count(), 0);
});
/* 2026-10-19: the name on every page, plum only on buttons, and Talk writes at the top */
await ok("every page starts with the mark, the name in Outfit, and Powered by OwnYourSystem", async () => {
  await p.evaluate(() => document.fonts.ready);
  for (const r of ["now", "journal", "you", "goals", "backlog", "planner", "talk"]) {
    await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250);
    const b = await p.evaluate(() => { const e = [...document.querySelectorAll(".ph-brand")].find((x) => x.getClientRects().length); if (!e) return null;
      const w = e.querySelector(".ph-word"); return { word: w.textContent, by: (e.querySelector(".ph-by") || {}).textContent, font: getComputedStyle(w).fontFamily, top: e.getBoundingClientRect().top, mark: e.querySelectorAll("svg.ph-mark path").length }; });
    assert.ok(b, r + ": no name"); assert.equal(b.word, "OwnYourDay"); assert.equal(b.by, "Powered by OwnYourSystem"); assert.match(b.font, /^"?Outfit"?/); assert.ok(b.top < 60, r + ": the name is not at the top"); assert.equal(b.mark, 3);
  }
  assert.equal(await p.evaluate(() => document.fonts.check('600 20px "Outfit"')), true, "the Outfit font did not load");
});
await ok("Talk: a big box at the top to write in, above the chips and the answers", async () => {
  await p.evaluate(() => { location.hash = "#/talk"; }); await p.waitForTimeout(300);
  const g = await p.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const i = document.getElementById("bot-input");
    return { tag: i.tagName, inTop: r("#bot-input").top, inH: r("#bot-input").height, chips: r("#bot-chips").top, log: r("#bot-log").top }; });
  assert.equal(g.tag, "TEXTAREA"); assert.ok(g.inTop < 140, "box top " + g.inTop); assert.ok(g.inH >= 120, "box height " + g.inH);
  assert.ok(g.chips > g.inTop + g.inH && g.log > g.chips, JSON.stringify(g));
});
await ok("Talk: Enter sends; the newest question and its answer come first, under the box", async () => {
  for (const q of ["help", "what is left today?"]) { await p.fill("#bot-input", q); await p.keyboard.press("Enter"); await p.waitForTimeout(700); }
  const t = await p.evaluate(() => [...document.querySelectorAll("#bot-log .bot-turn")].map((x) => ({ q: x.querySelector(".bot-msg.you").textContent, a: !!x.querySelector(".bot-msg.bot"), top: x.getBoundingClientRect().top })));
  assert.equal(t.length, 2); assert.ok(t.every((x) => x.a), "a question has no answer under it");
  assert.equal(t[1].q, "what is left today?"); assert.ok(t[1].top < t[0].top, "the newest turn is not first");
  assert.equal(await p.inputValue("#bot-input"), "");
});
await ok("plum is on buttons only: Send is plum, the page, the cards and your words are not", async () => {
  const c = await p.evaluate(() => ({ send: getComputedStyle(document.getElementById("bot-send")).backgroundColor, you: getComputedStyle(document.querySelector(".bot-msg.you")).backgroundColor,
    sheet: getComputedStyle(document.getElementById("botsheet")).backgroundColor, tab: getComputedStyle(document.querySelector('#ph-tabs [aria-current="page"]')).color }));
  assert.equal(c.send, "rgb(44, 19, 50)"); for (const k of ["you", "sheet", "tab"]) assert.ok(!/44, 19, 50|216, 194, 224/.test(c[k]), k + " is plum: " + c[k]);
});
/* 2026-10-19: replies laid out to read at a glance, with the words unchanged */
await ok("Talk: a list reply becomes headings with counts and rows that open the step; its words are unchanged", async () => {
  await p.evaluate(() => { const K = "oys-min-deliveries-v1"; const st = JSON.parse(localStorage.getItem(K)); const ids = Object.keys(st.subs).slice(0, 5);
    st.oftad = ids.slice(0, 2).map((id) => ({ k: "sub", id, done: false })); st.plan = ids.slice(2).map((id) => ({ k: "sub", id, done: false })); localStorage.setItem(K, JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(400); await p.evaluate(() => { location.hash = "#/talk"; }); await p.waitForTimeout(300);
  await p.fill("#bot-input", "what is left today"); await p.keyboard.press("Enter"); await p.waitForTimeout(700);
  const r = await p.evaluate(() => { const m = [...document.querySelectorAll("#bot-log .bot-msg.bot")].pop(); const st = JSON.parse(localStorage.getItem("oys-min-deliveries-v1"));
    const nm = (c) => st.subs[c.id].name;
    return { text: m.textContent, want: "Today: " + st.oftad.map(nm).join(", ") + ". Waiting: " + st.plan.map(nm).join(", ") + ".",
      heads: [...m.querySelectorAll(".bot-lh")].map((h) => [h.firstChild.textContent, h.getAttribute("data-n")]), rows: m.querySelectorAll(".bot-row.bot-go").length,
      rowH: Math.min(...[...m.querySelectorAll(".bot-row")].map((x) => x.getBoundingClientRect().height)), firstHref: m.querySelector(".bot-go").getAttribute("href"), firstId: st.oftad[0].id }; });
  assert.equal(r.text, r.want); assert.deepEqual(r.heads, [["Today", "2"], ["Waiting", "3"]]); assert.equal(r.rows, 5); assert.ok(r.rowH >= 44, "row " + r.rowH);
  assert.equal(r.firstHref, "#/step/" + encodeURIComponent(r.firstId));
  await p.locator("#bot-log .bot-msg.bot .bot-go").last().click(); await p.waitForTimeout(300);
  assert.match(await p.evaluate(() => location.hash), /^#\/step\//);
});
await ok("Talk: a help example, tapped, goes into the box", async () => {
  await p.evaluate(() => { location.hash = "#/talk"; }); await p.waitForTimeout(300);
  await p.fill("#bot-input", "help"); await p.keyboard.press("Enter"); await p.waitForTimeout(700);
  const m = p.locator("#bot-log .bot-msg.bot[data-help]").last(); assert.ok((await m.locator(".bot-h").count()) >= 3);
  const ex = (await m.locator(".bot-row .bot-rt").first().textContent()); await m.locator(".bot-row").first().click(); await p.waitForTimeout(150);
  assert.equal(await p.inputValue("#bot-input"), ex); await p.fill("#bot-input", "");
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
