/* Apple HIG review 2 (2026-10-19): the screens built after 17 October. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
/* the first-time guide: Your day, Your work, How you work, What matters most, then the first goal */
for (let i = 0; i < 5; i++) { await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250); }
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(500);
await p.evaluate((KEY) => { const c = document.createElement("canvas"); c.width = c.height = 16; localStorage.setItem(KEY + ".photo", JSON.stringify({ src: c.toDataURL("image/jpeg"), show: true })); }, KEY);
await p.reload(); await p.waitForTimeout(500);
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(300); };

await ok("On/Off rows are switches: role switch, aria-checked, a track that moves, 44px or more, and the word for screen readers", async () => {
  for (const [route, k] of [["you", "phshow"], ["learned", "memlearn"], ["learned", "hinton"]]) {
    await go(route);
    const s = await p.evaluate((k) => { const e = document.querySelector(`[data-ph=${k}]`); const t = e.querySelector(".ph-switch");
      return { role: e.getAttribute("role"), checked: e.getAttribute("aria-checked"), track: !!t, h: e.getBoundingClientRect().height, word: e.querySelector(".ph-sr").textContent, bg: t && getComputedStyle(t).backgroundColor }; }, k);
    assert.equal(s.role, "switch", k); assert.equal(s.checked, "true", k); assert.ok(s.track, k + " has no switch"); assert.ok(s.h >= 44, k); assert.equal(s.word, "On");
    assert.equal(s.bg, "rgb(44, 19, 50)", k + " on is not the button colour");
  }
  await go("you"); await p.locator("[data-ph=phshow]").click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=phshow]").getAttribute("aria-checked"), "false");
  await p.locator("[data-ph=phshow]").click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=phshow]").getAttribute("aria-checked"), "true");
});
await ok("rows that open a page keep their chevron and are not switches", async () => {
  await go("you");
  assert.equal(await p.locator("[data-ph=daystart]").getAttribute("role"), null);
  assert.equal(await p.locator("[data-ph=daystart] svg").count(), 1);
});
await ok("Talk: Clear can be taken back for 6 seconds", async () => {
  await go("talk"); await p.fill("#bot-input", "help"); await p.keyboard.press("Enter"); await p.waitForTimeout(600);
  const n = await p.locator("#bot-log .bot-msg").count(); assert.ok(n >= 2);
  await p.locator("#bot-clear").click(); await p.waitForTimeout(200);
  assert.equal(await p.locator("#bot-log .bot-msg").count(), 0); assert.equal(await p.locator("#ph-undo").isVisible(), true);
  assert.match(await p.locator("#ph-undo-t").innerText(), /Conversation cleared/);
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(200);
  assert.equal(await p.locator("#bot-log .bot-msg").count(), n); assert.equal(await p.locator("#ph-undo").isVisible(), false);
});
await ok("Talk: your photo sits level with Clear and covers nothing", async () => {
  const r = await p.evaluate(() => { const a = document.getElementById("ph-mini").getBoundingClientRect(), c = document.getElementById("bot-clear").getBoundingClientRect();
    return { dy: Math.abs((a.top + a.height / 2) - (c.top + c.height / 2)), overlap: !(a.left >= c.right || a.right <= c.left || a.top >= c.bottom || a.bottom <= c.top) }; });
  assert.ok(r.dy <= 2, "off by " + r.dy); assert.equal(r.overlap, false);
});
await ok("What the board learned: the label after the empty card has room above it", async () => {
  await go("learned");
  const gap = await p.evaluate(() => { const l = document.querySelector('label[for="ph-memnew"]'), prev = l.previousElementSibling; return l.getBoundingClientRect().top - prev.getBoundingClientRect().bottom; });
  assert.ok(gap >= 12, "gap " + gap);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
