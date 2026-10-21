/* Reading aloud (owner, 2026-10-21: "close the 3 gaps, start with read aloud").
   A speaker button on each card on Now and on each answer in Talk reads that one thing; pressed again it stops.
   "Read answers aloud" (off by default) reads each new answer once. No voice in the browser: no buttons.
   The browser's voice is replaced by a stand-in that records what would be said. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const voice = () => {
  window.__said = []; window.__cancel = 0; let cur = null;
  function U(t) { this.text = t; this.lang = ""; this.rate = 1; }
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: U, configurable: true });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    speak(u) { cur = u; window.__said.push({ t: u.text, lang: u.lang }); },
    cancel() { window.__cancel++; const c = cur; cur = null; if (c && c.onend) c.onend(); },
    get speaking() { return !!cur; } } });
  /* the stand-in finishes an utterance when a test says so */
  window.__end = () => { const c = cur; cur = null; if (c && c.onend) c.onend(); };
};
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(voice);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const said = () => p.evaluate(() => window.__said);
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(300); };
const D = () => p.locator("dialog.ask[open]");
const talk = async (t) => { await p.fill("#bot-input", t); await p.keyboard.press("Enter"); await p.waitForTimeout(500); };

await ok("the Do this now card has a speaker button: 44px, top right, named for screen readers, not pressed", async () => {
  await go("now"); const sb = p.locator("[aria-label='Do this now'] > .ph-say");
  assert.equal(await sb.count(), 1);
  const r = await sb.evaluate((e) => { const b = e.getBoundingClientRect(), c = e.parentElement.getBoundingClientRect(); return { w: b.width, h: b.height, right: c.right - b.right, top: b.top - c.top }; });
  assert.ok(r.w >= 44 && r.h >= 44, JSON.stringify(r)); assert.ok(r.right < 16 && r.top < 16, "not top right " + JSON.stringify(r));
  assert.equal(await sb.getAttribute("aria-label"), "Read this card aloud"); assert.equal(await sb.getAttribute("aria-pressed"), "false");
});
await ok("pressed, it reads the card in order (label, step, reason) without its buttons; pressed again, it stops", async () => {
  const sb = p.locator("[aria-label='Do this now'] > .ph-say"); const step = (await p.locator("[aria-label='Do this now'] .ph-task").innerText()).trim();
  await sb.click(); await p.waitForTimeout(150);
  const s = (await said()).pop(); assert.ok(s.t.startsWith("Do this now. " + step), s.t); assert.doesNotMatch(s.t, /Start it|Skip/); assert.match(s.lang, /^en/);
  assert.equal(await sb.getAttribute("aria-pressed"), "true"); assert.equal(await sb.getAttribute("aria-label"), "Stop reading");
  const c0 = await p.evaluate(() => window.__cancel); await sb.click(); await p.waitForTimeout(150);
  assert.ok((await p.evaluate(() => window.__cancel)) > c0); assert.equal(await sb.getAttribute("aria-pressed"), "false"); assert.equal(await sb.getAttribute("aria-label"), "Read this card aloud");
});
await ok("when the reading ends by itself, the button goes back", async () => {
  const sb = p.locator("[aria-label='Do this now'] > .ph-say"); await sb.click(); await p.evaluate(() => window.__end()); await p.waitForTimeout(100);
  assert.equal(await sb.getAttribute("aria-pressed"), "false");
});
await ok("the rest card reads its message and the easy things by name, not 'Edit my easy things'", async () => {
  await p.evaluate(() => { window.__board.floor.set(["Listen to a book", "Read before sleep"]); window.__board.energy(1); }); await go("you"); await go("now");
  const card = p.locator(".ph-rest").first(); await card.locator(".ph-say").click(); await p.waitForTimeout(150);
  const s = (await said()).pop().t; assert.match(s, /^Nothing is needed now\. /); assert.match(s, /Listen to a book\. Read before sleep/); assert.doesNotMatch(s, /Edit my easy things/);
  await card.locator(".ph-say").click(); await p.evaluate(() => { window.__board.energy(3); });
});
await ok("leaving the page stops the voice", async () => {
  await go("now"); await p.locator("[aria-label='Do this now'] > .ph-say").click(); const c0 = await p.evaluate(() => window.__cancel);
  await go("goals"); assert.ok((await p.evaluate(() => window.__cancel)) > c0);
});
await ok("off by default: an answer in Talk is not read by itself, and its speaker button reads it without list dashes", async () => {
  assert.equal((await st()).me.readAloud, undefined);
  await go("talk"); const n0 = (await said()).length; await talk("help");
  assert.equal((await said()).length, n0, "an answer was read without being asked");
  const last = p.locator("#bot-log .bot-msg.bot").last(); const sb = last.locator(".bot-say"); assert.equal(await sb.count(), 1);
  assert.equal(await sb.getAttribute("aria-label"), "Read this answer aloud"); assert.ok((await sb.boundingBox()).height >= 36);
  await sb.click(); await p.waitForTimeout(150); const s = (await said()).pop().t; assert.ok(s.length > 40); assert.doesNotMatch(s, /(^|\. )- /); assert.doesNotMatch(s, /\n/);
  await sb.click();
});
await ok("Read answers aloud on You is a switch; on, each new answer is read once, and older ones are not read again", async () => {
  await go("you"); const sw = p.locator("[data-ph=readaloud]"); assert.equal(await sw.getAttribute("role"), "switch"); assert.equal(await sw.getAttribute("aria-checked"), "false");
  await sw.click(); await p.waitForTimeout(250); assert.equal((await st()).me.readAloud, true); assert.equal(await p.locator("[data-ph=readaloud]").getAttribute("aria-checked"), "true");
  await go("talk"); const n0 = (await said()).length;
  await talk("what is left today"); let s = await said(); assert.equal(s.length, n0 + 1, "the new answer was not read once"); const first = s[s.length - 1].t;
  await talk("help"); s = await said(); assert.equal(s.length, n0 + 2); assert.notEqual(s[s.length - 1].t, first, "an older answer was read again");
});
await ok("Talk words switch it: stop reading answers aloud, read answers aloud", async () => {
  await talk("stop reading answers aloud"); assert.equal((await st()).me.readAloud, undefined);
  const n0 = (await said()).length; await talk("help"); assert.equal((await said()).length, n0);
  await talk("read answers aloud"); assert.equal((await st()).me.readAloud, true);
  await talk("read aloud off"); assert.equal((await st()).me.readAloud, undefined);
});
await ok("no sideways scroll on Now and Talk with the buttons in place; no page errors", async () => {
  for (const r of ["now", "talk", "you"]) { await go(r); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, r); }
  assert.deepEqual(errs, []);
});
await ctx.close();

/* ---------- the desktop ---------- */
{
  const dc = await b.newContext({ viewport: { width: 1280, height: 1000 } }); await dc.addInitScript(voice);
  await dc.addInitScript(() => { try { localStorage.setItem("oys-classic", "test"); } catch (e) {} });
  const q = await dc.newPage(); const qe = []; q.on("pageerror", (e) => qe.push(e.message));
  await q.goto(URL); await q.waitForSelector(".row.pick");
  await q.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await q.reload(); await q.waitForSelector(".row.pick");
  await ok("desktop: the Do this now strip has a speaker button that reads it", async () => {
    const sb = q.locator("#now-badge .nb-say"); assert.equal(await sb.count(), 1);
    await sb.click(); await q.waitForTimeout(150); const s = (await q.evaluate(() => window.__said)).pop().t;
    assert.ok(s.length > 10, s); assert.doesNotMatch(s, /Open the planner/);
  });
  await ok("desktop: the Planner has the Read answers aloud switch", async () => {
    await q.evaluate(() => { location.hash = "#/planner"; }); await q.waitForTimeout(300);
    const sw = q.locator("#pl-read"); assert.equal(await sw.getAttribute("aria-pressed"), "false");
    await sw.click(); await q.waitForTimeout(250); assert.equal(await q.locator("#pl-read").getAttribute("aria-pressed"), "true");
    assert.equal(await q.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).me.readAloud, KEY), true);
    assert.deepEqual(qe, []);
  });
  await dc.close();
}

/* ---------- a browser with no voice ---------- */
{
  const nc = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await nc.addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }); });
  const q = await nc.newPage(); const qe = []; q.on("pageerror", (e) => qe.push(e.message));
  await q.goto(URL); await q.waitForSelector("#ph-main .ph-onb");
  await q.locator("[data-ph=onb-next]").click(); await q.waitForTimeout(250);
  await q.fill("#ph-goal", "Garden Shed"); await q.fill("#ph-step", "Buy the timber"); await q.locator("[data-ph=onb-done]").click(); await q.waitForTimeout(500);
  await ok("no voice in the browser: no speaker buttons and no switch, and nothing breaks", async () => {
    assert.equal(await q.locator(".say-btn").count(), 0);
    await q.evaluate(() => { location.hash = "#/you"; }); await q.waitForTimeout(300); assert.equal(await q.locator("[data-ph=readaloud]").count(), 0);
    assert.deepEqual(qe, []);
  });
  await nc.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
