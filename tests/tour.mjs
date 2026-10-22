/* The tour (owner, 2026-10-22: an introduction to every service, always in the app, as animated slides). 8 slides
   with a small moving demo each; Try it opens the page; Ask about this gets an answer in Talk without the AI; it is
   reached from You, the web sidebar, Now (once, and again when slides are added) and from Talk. */
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const AXE = fs.readFileSync(new globalThis.URL("./vendor/axe.min.js", import.meta.url), "utf8");
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const errs = [];
const day = new Date().toISOString().slice(0, 10);
const board = { v: 2, seedRev: 7, unseeded: 1, day, sel: "g1", ue: {}, killed: [], archive: [], tagFilter: [], backlog: [], oftad: [], plan: [], done: [], hist: [], dayLog: [], log: [],
  groups: [{ id: "g1", name: "Garden shed", subs: ["s1"], due: "", prio: "mid", tags: [], where: "any" }], subs: { s1: { id: "s1", name: "Buy the timber", pct: 0, status: "todo", tag: "", upd: day, gid: "g1" } },
  me: { done: true, guided: true, days: [1, 2, 3, 4, 5], work: ["08:00", "16:30"], rise: "07:00", wind: "22:30", north: "", brief: "07:30", icon: "" } };
async function open({ seen = null, viewport = { width: 390, height: 844 }, phone = true, motion = "no-preference" } = {}) {
  const ctx = await b.newContext({ viewport, ...(phone ? { isMobile: true, hasTouch: true } : {}), reducedMotion: motion });
  await ctx.addInitScript(([k, s, seen]) => { if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.setItem(k, JSON.stringify(s)); if (seen) localStorage.setItem("oys-tour", seen); }, [KEY, board, seen]);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL + "#/now"); await p.waitForTimeout(900);
  return { ctx, p };
}
const go = async (p, r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(350); };
const hash = (p) => p.evaluate(() => location.hash);
const TITLES = ["One step, in the right order", "Your energy sizes the day", "What is booked comes first", "Talk, in plain words", "Goals and their steps", "The journal", "It learns, with your yes", "Yours, and private"];

const { ctx, p } = await open();
await ok("someone new sees, once, a line on Now that opens the tour", async () => {
  const s = p.locator("#ph-main .ph-tourstrip"); assert.equal((await s.innerText()).replace(/\s+/g, " ").trim(), "New here? How Qordel works, in 1 minute");
  await s.click(); await p.waitForTimeout(400); assert.equal(await hash(p), "#/tour/1");
  await go(p, "now"); assert.equal(await p.locator("#ph-main .ph-tourstrip").count(), 0, "the line came back after the tour was opened");
});
await ok("8 slides, each with a title, one or two sentences, a demo for the eye only, Try it and Ask about this", async () => {
  for (let i = 1; i <= 8; i++) {
    await go(p, "tour/" + i);
    assert.equal((await p.locator(".tour-t").innerText()).trim(), TITLES[i - 1]); assert.equal((await p.locator(".tour-of").innerText()).trim(), i + " of 8");
    assert.equal(await p.locator(".tour-demo").getAttribute("aria-hidden"), "true"); assert.ok((await p.locator(".tour-demo *").count()) > 1, "no demo on " + i);
    const s = (await p.locator(".tour-s").innerText()).trim(); assert.ok(s.split(/[.!?](\s|$)/).filter((x) => x && x.trim()).length <= 3, "too long: " + s);
    assert.equal(await p.locator(".tour-dot[aria-current=step]").getAttribute("data-i"), String(i - 1));
  }
});
await ok("Next, Back, the dots and the arrow keys move between slides; the ends stop", async () => {
  await go(p, "tour/1"); assert.equal(await p.locator("[data-tour=prev]").isDisabled(), true);
  await p.click("[data-tour=next]"); await p.waitForTimeout(300); assert.equal(await hash(p), "#/tour/2");
  await p.click("[data-tour=prev]"); await p.waitForTimeout(300); assert.equal(await hash(p), "#/tour/1");
  await p.click('.tour-dot[data-i="5"]'); await p.waitForTimeout(300); assert.equal(await hash(p), "#/tour/6");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(300); assert.equal(await hash(p), "#/tour/7");
  await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(300); assert.equal(await hash(p), "#/tour/6");
  await go(p, "tour/8"); assert.equal(await p.locator("[data-tour=next]").count(), 0); assert.equal(await p.locator("[data-tour=done]").getAttribute("href"), "#/now");
});
await ok("a swipe moves a slide on a phone", async () => {
  await go(p, "tour/3");
  await p.evaluate(() => { const t = (x) => [new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 400 })];
    document.dispatchEvent(new TouchEvent("touchstart", { touches: t(300), changedTouches: t(300) })); document.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: t(120) })); });
  await p.waitForTimeout(300); assert.equal(await hash(p), "#/tour/4");
});
await ok("Try it opens that slide's page", async () => {
  for (const [i, r] of [[1, "#/now"], [3, "#/calendar"], [4, "#/talk"], [5, "#/goals"], [6, "#/journal"]]) {
    await go(p, "tour/" + i); await p.click("[data-tour=try]"); await p.waitForTimeout(350); assert.equal(await hash(p), r, "slide " + i);
  }
});
await ok("Ask about this asks Talk, and Talk answers on this phone without the AI", async () => {
  await go(p, "tour/2"); await p.click("[data-tour=ask]"); await p.waitForTimeout(900);
  assert.equal(await hash(p), "#/talk");
  const last = await p.evaluate(() => [...document.querySelectorAll("#bot-log .bot-msg")].map((m) => m.textContent));
  assert.ok(last.includes("What does my energy change?"), JSON.stringify(last)); assert.match(last[last.length - 1], /^Full gives a bigger day/);
});
await ok("in Talk, show me the tour opens it", async () => {
  await p.fill("#bot-input", "show me the tour"); await p.keyboard.press("Enter"); await p.waitForTimeout(900);
  assert.equal(await hash(p), "#/tour/1");
});
await ok("You has How Qordel works, always", async () => {
  await go(p, "you"); const r = p.locator("[data-ph=tour]"); assert.match(await r.innerText(), /How Qordel works\s+1 minute/);
  await r.click(); await p.waitForTimeout(350); assert.equal(await hash(p), "#/tour/1");
});
await ok("WCAG 2.2 AA on a slide, dots 24px or larger, no sideways scroll at 320", async () => {
  await go(p, "tour/3"); await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => x.id));
  assert.deepEqual(v, []);
  for (const h of await p.locator(".tour-dot").evaluateAll((l) => l.map((d) => Math.min(d.getBoundingClientRect().width, d.getBoundingClientRect().height)))) assert.ok(h >= 24, String(h));
  await p.setViewportSize({ width: 320, height: 640 }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});
await ctx.close();
await ok("slides added since the last visit show New, on the slide, the dots, You and a line on Now", async () => {
  const o = await open({ seen: "2026-10-20" }); try {
    const s = o.p.locator("#ph-main .ph-tourstrip"); assert.equal((await s.innerText()).replace(/\s+/g, " ").trim(), "New in Qordel 3 new things to see");
    assert.equal(await s.getAttribute("href"), "#/tour/3");
    await go(o.p, "you"); assert.match(await o.p.locator("[data-ph=tour]").innerText(), /3 new/);
    await o.p.evaluate(() => { localStorage.setItem("oys-tour", "2026-10-20"); }); await go(o.p, "tour/3");
    assert.equal(await o.p.locator(".tour-new").count(), 1); assert.equal(await o.p.locator(".tour-dnew").count(), 3);
  } finally { await o.ctx.close(); }
});
await ok("with reduced motion the demos stand still", async () => {
  const o = await open({ motion: "reduce" }); try {
    await go(o.p, "tour/2"); assert.equal(await o.p.evaluate(() => getComputedStyle(document.querySelector(".td-bat i.td-off")).animationName), "none");
  } finally { await o.ctx.close(); }
});
await ok("on the web, How it works sits at the foot of the sidebar and is marked on the tour", async () => {
  const o = await open({ phone: false, viewport: { width: 1440, height: 900 } }); try {
    await o.p.evaluate(() => { localStorage.removeItem("oys-web"); }); await o.p.reload(); await o.p.waitForTimeout(900);
    const l = o.p.locator('#ph-tabs a[data-tab="tour"]'); assert.equal(await l.isVisible(), true);
    const bx = await l.boundingBox(); assert.ok(bx.y > 700, "not at the foot: " + bx.y);
    await l.click(); await o.p.waitForTimeout(400); assert.equal(await l.getAttribute("aria-current"), "page");
    assert.equal(await o.p.locator('#ph-tabs a[data-tab="tour"]').count(), 1);
  } finally { await o.ctx.close(); }
});
await ok("the phone's tab bar is not changed", async () => {
  const o = await open(); try {
    assert.deepEqual(await o.p.locator("#ph-tabs a").evaluateAll((l) => l.filter((a) => a.offsetParent).map((a) => a.textContent.trim())), ["Now", "Talk", "Journal", "You"]);
  } finally { await o.ctx.close(); }
});
await ok("no page errors", () => assert.deepEqual(errs, []));
await b.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
