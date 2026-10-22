/* Qordel web (owner, 2026-10-21: the web version at the level of the phone app, in a design of its own). A big
   screen gets the same pages, rules and data as the phone in its own layout: a sidebar with Now, Talk, Journal,
   Calendar, Goals and You, one calm column, dialogs in the middle. Classic board stays a choice on You, with a way
   back. The phone is not changed. Runs with TEST_WEB=on and the neutral sample board. */
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const AXE = fs.readFileSync(new globalThis.URL("./vendor/axe.min.js", import.meta.url), "utf8");
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(400); };
const cls = () => p.evaluate(() => document.documentElement.className);
const cur = () => p.locator('#ph-tabs a[aria-current="page"]').getAttribute("data-tab");
const box = (sel) => p.locator(sel).first().boundingBox();

await p.goto(URL); await p.waitForTimeout(900);
await ok("a big screen gets Qordel web: the first-run screen in the middle, no sidebar yet, no panel board", async () => {
  const c = await cls(); assert.match(c, /\bph\b/); assert.match(c, /\bph-web\b/); assert.match(c, /\bph-onb\b/);
  assert.equal(await p.locator("#ph-tabs").isVisible(), false); assert.equal(await p.locator("#rail").isVisible(), false);
  const m = await box("#ph-main"); assert.ok(Math.abs(m.x + m.width / 2 - 720) < 4, "not centred: " + JSON.stringify(m)); assert.ok(m.width <= 620);
});
await p.click("[data-ph=onb-next]"); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.click("[data-ph=onb-done]"); await p.waitForTimeout(600);
await ok("after the first goal: a sidebar with the brand, 6 places and How it works, in order, Now marked", async () => {
  assert.equal(await p.locator("#ph-tabs").isVisible(), true);
  assert.deepEqual(await p.locator("#ph-tabs a").evaluateAll((l) => l.filter((a) => a.offsetParent).map((a) => a.textContent.trim())), ["Now", "Talk", "Journal", "Calendar", "Goals", "You", "How it works"]);
  assert.match(await p.locator(".ph-side-brand").innerText(), /Qordel\s+Powered by OwnYourSystem/i);
  const s = await box("#ph-tabs"); assert.equal(s.x, 0); assert.equal(s.height, 900); assert.ok(s.width >= 220 && s.width <= 260);
  assert.equal(await cur(), "now"); assert.equal(await p.locator('[aria-label="Do this now"]').count() >= 1, true);
});
await ok("the column sits right of the sidebar, no wider than 760, and the page never scrolls sideways", async () => {
  const s = await box("#ph-tabs"), card = await box('#ph-main [aria-label="Do this now"]');
  assert.ok(card.x >= s.width + 40, "under the sidebar"); assert.ok(card.width <= 760, "too wide: " + card.width);
  for (const [w, h] of [[1024, 768], [1920, 1080], [900, 700]]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, w + " wide");
    assert.match(await cls(), /\bph-web\b/, w + " wide is not web");
  }
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(200);
});
await ok("every sidebar place opens its page and is marked; Calendar and Goals have no Back to You", async () => {
  for (const [tab, h1] of [["talk", null], ["journal", "Journal"], ["calendar", "Calendar"], ["goals", "Goals"], ["you", "You"], ["now", null]]) {
    await p.click(`#ph-tabs a[data-tab="${tab}"]`); await p.waitForTimeout(400);
    assert.equal(await p.evaluate(() => location.hash), "#/" + tab); assert.equal(await cur(), tab);
    if (h1) assert.equal((await p.locator("#ph-main h1").first().innerText()).trim(), h1);
    if (tab === "calendar" || tab === "goals") assert.equal(await p.locator('#ph-main .ph-nav[href="#/you"]').isVisible().catch(() => false), false, tab);
  }
  const gid = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).groups[0].id, KEY);
  await go("goal/" + encodeURIComponent(gid)); assert.equal(await cur(), "goals", "a goal page belongs to Goals");
  await go("backlog"); assert.equal(await cur(), "you", "Backlog is still reached from You");
});
await ok("the sidebar is usable: links 44px tall, a visible keyboard focus", async () => {
  const hs = await p.locator("#ph-tabs a").evaluateAll((l) => l.filter((a) => a.offsetParent).map((a) => a.getBoundingClientRect().height));
  for (const h of hs) assert.ok(h >= 44, String(h));
  await p.focus('#ph-tabs a[data-tab="journal"]'); await p.keyboard.press("Tab");
  const o = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle); assert.notEqual(o, "none");
});
await ok("Talk fills the space right of the sidebar, with one brand only", async () => {
  await go("talk"); const s = await box("#ph-tabs"), t = await box("#botsheet");
  assert.ok(t.x >= s.width - 1, "over the sidebar: " + t.x); assert.ok(t.x + t.width <= 1441);
  const inp = await box("#bot-input"); assert.ok(inp.width <= 760 && inp.x >= s.width + 40, JSON.stringify(inp));
  assert.equal(await p.locator("#ph-tbrand").isVisible(), false);
  await go("now");
});
await ok("dialogs open in the middle of the screen, not as a bottom sheet", async () => {
  await go("goals"); await p.click("[data-ph=newgoal]"); await p.locator("dialog.ask[open]").waitFor();
  const d = await box("dialog.ask[open]"); assert.ok(d.y > 40 && d.y + d.height < 860, JSON.stringify(d)); assert.ok(d.width <= 640);
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  const nb = await box("[data-ph=newgoal]"); assert.ok(nb.y < 700, "New goal is pinned to the bottom");
});
await ok("words fit a computer: You says on this computer, not on this phone", async () => {
  await go("you"); const t = await p.locator("#ph-main").innerText();
  assert.match(t, /On this computer only/); assert.doesNotMatch(t, /this phone/);
});
await ok("WCAG 2.2 AA on Now, Calendar and You in the web design", async () => {
  for (const r of ["now", "calendar", "you"]) {
    await go(r); await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }))
      .violations.map((x) => x.id + ": " + x.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(", ")));
    assert.deepEqual(v, [], r);
  }
});
await ok("Classic board is a choice on You, kept after a reload, with New Qordel to come back", async () => {
  await go("you"); await p.click("[data-ph=classic]"); await p.waitForTimeout(600);
  assert.doesNotMatch(await cls(), /\bph\b/); assert.equal(await p.locator("#rail").isVisible(), true);
  assert.equal(await p.evaluate(() => localStorage.getItem("oys-web")), "classic");
  await p.reload(); await p.waitForTimeout(900); assert.equal(await p.locator("#rail").isVisible(), true, "the choice was not kept");
  const back = p.locator("#btn-web"); assert.equal(await back.isVisible(), true); await back.click(); await p.waitForTimeout(600);
  assert.match(await cls(), /\bph-web\b/); assert.equal(await p.evaluate(() => location.hash), "#/now"); assert.equal(await p.evaluate(() => localStorage.getItem("oys-web")), null);
  assert.equal(await p.locator("#btn-web").isVisible(), false);
});
await ok("the same board on both: a step finished on the web is finished for the rules", async () => {
  await go("now"); const name = await p.locator(".ph-task").first().innerText();
  await p.click("[data-ph=take]"); await p.waitForTimeout(400);
  const s = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); assert.ok(s.oftad.some((c) => s.subs[c.id] && s.subs[c.id].name === name), name);
});
await ctx.close();
await ok("the phone is not changed: 4 tabs at the bottom, no sidebar, even if Classic board was chosen", async () => {
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await c2.newPage();
  try {
    await c2.addInitScript(() => { localStorage.setItem("oys-web", "classic"); });
    await q.goto(URL); await q.waitForTimeout(800); await q.click("[data-ph=onb-next]"); await q.waitForTimeout(250);
    await q.fill("#ph-goal", "Garden Shed"); await q.click("[data-ph=onb-done]"); await q.waitForTimeout(500);
    const c = await q.evaluate(() => document.documentElement.className); assert.match(c, /\bph\b/); assert.doesNotMatch(c, /ph-web/);
    assert.deepEqual(await q.locator("#ph-tabs a").evaluateAll((l) => l.filter((a) => a.offsetParent).map((a) => a.textContent.trim())), ["Now", "Talk", "Journal", "You"]);
    const t = await q.locator("#ph-tabs").boundingBox(); assert.ok(t.y > 700, "tabs not at the bottom");
    await q.evaluate(() => { location.hash = "#/you"; }); await q.waitForTimeout(400);
    assert.equal(await q.locator("[data-ph=classic]").count(), 0); assert.match(await q.locator("#ph-main").innerText(), /On this phone only/);
  } finally { await c2.close(); }
});
await ok("no page errors", () => assert.deepEqual(errs, []));
await b.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
