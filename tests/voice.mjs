/* Speak instead of typing (put back 2026-10-15). A stand-in speech service plays the browser's part. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", JKEY = KEY + ".journal";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
/* these suites test the classic board, which a phone-width page now shows only in Classic view */
const _nc = b.newContext.bind(b); b.newContext = async (o) => { const c = await _nc(o); await c.addInitScript(() => { try { localStorage.setItem("oys-classic", "test"); } catch (e) {} }); return c; };
const fake = () => {
  window.__sr = [];
  function FakeSR() { window.__sr.push(this); this.started = false; this.stopped = false; }
  FakeSR.prototype.start = function () { this.started = true; };
  FakeSR.prototype.stop = function () { if (this.stopped) return; this.stopped = true; if (this.onend) this.onend(); };
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
};
async function page(mobile) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(fake);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector(".row.pick");
  await p.evaluate(([KEY, JKEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); localStorage.removeItem(JKEY); localStorage.removeItem("oys-mic-told"); }, [KEY, JKEY]);
  await p.reload(); await p.waitForSelector(".row.pick");
  return { ctx, p, errs };
}
/* the browser hears words, and then stops */
const hear = (p, words, end = true) => p.evaluate(([w, end]) => { const r = window.__sr[window.__sr.length - 1]; r.onresult({ resultIndex: 0, results: [[{ transcript: w }]] }); if (end) r.stop(); }, [words, end]);
const lastBot = (p) => p.evaluate(() => { const m = document.querySelectorAll("#bot-log .bot-msg.bot"); return m.length ? m[m.length - 1].textContent : ""; });
const botCount = (p) => p.evaluate(() => document.querySelectorAll("#bot-log .bot-msg").length);

{
  const { ctx, p, errs } = await page(false);
  await ok("nothing listens until Speak is pressed", async () => { assert.equal(await p.evaluate(() => window.__sr.length), 0); });
  await p.evaluate(() => window.__board.openSheet());
  await ok("Speak starts listening in English, says so, and says where the voice goes the first time", async () => {
    await p.locator("#bot-mic").click(); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const x = window.__sr[0]; return { started: x.started, lang: x.lang, interim: x.interimResults }; });
    assert.equal(r.started, true); assert.match(r.lang, /^en/); assert.equal(r.interim, true);
    assert.equal(await p.locator("#bot-mic").getAttribute("aria-pressed"), "true");
    assert.match(await p.locator("#bot-note").innerText(), /speech service/);
    /* it says who hears the voice (2026-10-21, flaw 7): the service by name, and that the sound may leave the device */
    assert.match(await p.locator("#bot-note").innerText(), /Google in Chrome, Apple in Safari\) turns your voice into text and may send the sound to its servers\. Qordel keeps only the text/);
  });
  await ok("the words land in the box and nothing is sent or changed until Send", async () => {
    const n = await botCount(p); await hear(p, "I would like to journal my day");
    assert.equal(await p.locator("#bot-input").inputValue(), "I would like to journal my day");
    assert.equal(await botCount(p), n, "something was sent"); assert.match(await p.locator("#bot-note").innerText(), /Check the words, then press Send/);
    assert.equal(await p.locator("#bot-mic").getAttribute("aria-pressed"), "false");
    await p.locator("#bot-send").click(); await p.waitForTimeout(200); assert.match(await lastBot(p), /One message is enough/);
  });
  await ok("a spoken journal entry is saved, as said, after Send", async () => {
    await p.locator("#bot-mic").click(); await hear(p, "I finished the budget sheet today and I should call the bank tomorrow");
    await p.locator("#bot-send").click(); await p.waitForTimeout(200); assert.match(await lastBot(p), /^Saved to your journal/);
    const j = await p.evaluate((JKEY) => JSON.parse(localStorage.getItem(JKEY)), JKEY);
    assert.equal(j.log[0].a, "I finished the budget sheet today"); assert.equal(j.log[0].b, "I should call the bank tomorrow");
  });
  await ok("the second time it does not repeat where the voice goes", async () => {
    await p.locator("#bot-mic").click(); await p.waitForTimeout(80); assert.doesNotMatch(await p.locator("#bot-note").innerText(), /speech service/);
  });
  await ok("pressing Speak again stops listening", async () => {
    await p.locator("#bot-mic").click(); await p.waitForTimeout(80);
    assert.equal(await p.evaluate(() => window.__sr[window.__sr.length - 1].stopped), true); assert.equal(await p.locator("#bot-mic").getAttribute("aria-pressed"), "false");
  });
  await ok("speaking adds to what is already typed", async () => {
    await p.fill("#bot-input", "Put"); await p.locator("#bot-mic").click(); await hear(p, "the report into today");
    assert.equal(await p.locator("#bot-input").inputValue(), "Put the report into today"); await p.fill("#bot-input", "");
  });
  await ok("Send while listening stops listening, so late words do not land in the empty box", async () => {
    await p.fill("#bot-input", "help"); await p.locator("#bot-mic").click(); await p.waitForTimeout(50);
    await p.locator("#bot-send").click(); await p.waitForTimeout(150);
    assert.equal(await p.evaluate(() => window.__sr[window.__sr.length - 1].stopped), true);
  });
  await ok("a blocked microphone, and silence, are said plainly", async () => {
    await p.locator("#bot-mic").click(); await p.evaluate(() => { const r = window.__sr[window.__sr.length - 1]; r.onerror({ error: "not-allowed" }); r.stop(); });
    assert.match(await p.locator("#bot-note").innerText(), /blocked/);
    await p.locator("#bot-mic").click(); await p.evaluate(() => { const r = window.__sr[window.__sr.length - 1]; r.onerror({ error: "no-speech" }); r.stop(); });
    assert.match(await p.locator("#bot-note").innerText(), /heard nothing/);
  });
  await ok("the journal form has Speak under each box, and the words go into that box", async () => {
    await p.keyboard.press("Escape"); await p.waitForTimeout(100);
    await p.locator("#oftad").locator("xpath=..").getByRole("button", { name: "Journal" }).click();
    const d = p.locator("dialog.ask[open]"); await d.waitFor({ state: "visible" });
    assert.equal(await d.locator("[data-mic-to]").count(), 2);
    await d.locator('[data-mic-to="b"]').click(); await hear(p, "Call the bank first");
    assert.equal(await d.locator('[data-ak="b"]').inputValue(), "Call the bank first"); assert.match(await d.locator(".ask-hint").innerText(), /press Save/);
    await d.locator('[data-mic-to="a"]').click(); await hear(p, "Wrote the plan");
    await d.getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(200);
    const j = await p.evaluate((JKEY) => JSON.parse(localStorage.getItem(JKEY)), JKEY); const e = j.log[j.log.length - 1];
    assert.equal(e.a, "Wrote the plan"); assert.equal(e.b, "Call the bank first");
  });
  await ok("closing the form while listening stops listening", async () => {
    await p.locator("#oftad").locator("xpath=..").getByRole("button", { name: "Journal" }).click();
    const d = p.locator("dialog.ask[open]"); await d.waitFor({ state: "visible" }); await d.locator('[data-mic-to="a"]').click(); await p.waitForTimeout(50);
    await d.getByRole("button", { name: "Not now" }).click();
    /* wait for the stop, not a fixed 150ms: under load it lands later */
    await p.waitForFunction(() => window.__sr.length && window.__sr[window.__sr.length - 1].stopped === true, null, { timeout: 3000 }).catch(() => {});
    assert.equal(await p.evaluate(() => window.__sr[window.__sr.length - 1].stopped), true);
  });
  await ok("no page errors (computer)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(() => { try { delete window.SpeechRecognition; } catch (e) {} try { delete window.webkitSpeechRecognition; } catch (e) {} window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector(".row.pick"); await p.evaluate(() => window.__board.openSheet());
  await ok("a browser with no speech service says to use the keyboard's microphone", async () => {
    await p.locator("#bot-mic").click(); await p.waitForTimeout(80); assert.match(await p.locator("#bot-note").innerText(), /keyboard/);
  });
  await ok("no page errors (no speech service)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
{
  const { ctx, p, errs } = await page(true);
  await ok("on a phone Speak sits beside the box and the row fits the screen", async () => {
    await p.evaluate(() => window.__board.openSheet()); await p.waitForTimeout(200);
    const bx = await p.locator("#bot-mic").boundingBox(); assert.ok(bx && bx.x + bx.width <= 391, JSON.stringify(bx));
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await p.locator(".bot-ask").screenshot({ path: "/tmp/claude-0/shot-voice.png" });
  });
  await ok("no page errors (phone)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
