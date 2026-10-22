/* What changed (principle 6, 2026-10-21): a board set up before the 2026-10-21 release is told once, in
   plain words, what changed; a new board never is. The demo board for user sessions (?demo=session):
   asked first, never for a signed-in person, and it has what the session tasks need. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const st = (p) => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
/* a board as the version before 2026-10-21 left it: set up, with the old settings, and no wn */
const makeOld = async (p) => { await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY));
  s.me = Object.assign(s.me || {}, { done: true, guided: true, commute: 30, sharp: "morning", gym: "evening", never: "", feeds: [] }); delete s.wn;
  localStorage.setItem(KEY, JSON.stringify(s)); }, KEY); await p.reload(); await p.waitForTimeout(500); };

/* ---------- what changed, phone ---------- */
{
  const ctx = await b.newContext(PHONE); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
  await makeOld(p); await p.evaluate(() => { location.hash = "#/now"; }); await p.waitForTimeout(400);
  await ok("a board from before the release sees What changed on Now, once, above Do this now, in 4 plain points", async () => {
    const c = p.locator(".ph-wn"); assert.equal(await c.count(), 1);
    assert.match(await c.locator("h2").innerText(), /What changed in Qordel/); assert.equal(await c.locator("li").count(), 4);
    const t = await c.innerText(); assert.match(t, /5 simple rules/); assert.match(t, /All your goals and steps are still here/); assert.doesNotMatch(t, /deadline|overdue|must/i);
    const above = await p.evaluate(() => { const w = document.querySelector(".ph-wn"), d = document.querySelector("[aria-label='Do this now']"); return !d || w.getBoundingClientRect().top < d.getBoundingClientRect().top; });
    assert.ok(above); assert.equal((await st(p)).wn, "show");
  });
  await ok("it can be read aloud, and Got it puts it away for good", async () => {
    assert.equal(await p.locator(".ph-wn .ph-say").count(), await p.evaluate(() => (window.speechSynthesis ? 1 : 0)));
    await p.locator("[data-ph=wnok]").click(); await p.waitForTimeout(300);
    assert.equal(await p.locator(".ph-wn").count(), 0); assert.equal((await st(p)).wn, "seen");
    await p.reload(); await p.waitForTimeout(500); assert.equal(await p.locator(".ph-wn").count(), 0);
  });
  await ok("no page errors (phone)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
{
  const ctx = await b.newContext(PHONE); const p = await ctx.newPage();
  await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
  await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(600);
  await ok("a new board never sees it", async () => {
    await p.reload(); await p.waitForTimeout(500); assert.equal(await p.locator(".ph-wn").count(), 0); assert.equal((await st(p)).wn, "none");
  });
  await ctx.close();
}
/* ---------- what changed, desktop ---------- */
{
  const dc = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  await dc.addInitScript(() => { try { localStorage.setItem("oys-classic", "test"); } catch (e) {} });
  const q = await dc.newPage(); const qe = []; q.on("pageerror", (e) => qe.push(e.message));
  await q.goto(URL); await q.waitForSelector(".row.pick"); await makeOld(q); await q.waitForSelector(".row.pick");
  await ok("desktop: the same card on the board, and Got it puts it away", async () => {
    const c = q.locator("#wncard"); assert.equal(await c.isVisible(), true); assert.equal(await c.locator("li").count(), 4);
    await c.locator("[data-wn-ok]").click(); await q.waitForTimeout(300);
    assert.equal(await c.isVisible(), false); assert.equal((await st(q)).wn, "seen"); assert.deepEqual(qe, []);
  });
  await dc.close();
}

/* ---------- the demo board ---------- */
{
  const ctx = await b.newContext(PHONE); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const D = () => p.locator("dialog.ask[open]");
  await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
  const before = JSON.stringify((await st(p)).groups.map((g) => g.id));
  await p.goto(URL + "?demo=session"); await D().waitFor();
  await ok("?demo=session asks first, says it replaces the board, and Not now changes nothing", async () => {
    const t = await D().innerText(); assert.match(t, /Load the demo board\?/); assert.match(t, /replaces the board on this device/); assert.match(t, /No backup is made/);
    await D().getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(400);
    assert.equal(JSON.stringify((await st(p)).groups.map((g) => g.id)), before); assert.doesNotMatch(await p.evaluate(() => location.search), /demo/);
  });
  await p.goto(URL + "?demo=session"); await D().waitFor(); await D().getByRole("button", { name: "Load the demo board" }).click();
  await p.waitForSelector("#ph-main [data-ph=energy]"); await p.waitForTimeout(600);
  await ok("Load: 4 example goals, set up, on Now, and the address is clean", async () => {
    const s = await st(p); assert.deepEqual(s.groups.map((g) => g.name), ["Garden shed", "Quarterly report", "Plan a weekend away", "Learn Spanish"]);
    assert.equal(s.me.done, true); assert.equal(s.me.guided, true); assert.equal(s.wn, "none");
    assert.equal(await p.evaluate(() => location.hash), "#/now"); assert.doesNotMatch(await p.evaluate(() => location.search), /demo/);
  });
  await ok("session task 6: the passed delivery day asks on Now", async () => { assert.match(await p.locator(".ph-miss").innerText(), /Plan a weekend away[\s\S]*has passed/); });
  await ok("session task 7: Something I noticed is on Now, from the 2 weeks of history", async () => { assert.match(await p.locator(".ph-learn").innerText(), /A good day is 2 steps/); });
  await ok("session task 5: Very low shows the 3 easy things; Low offers the step marked Easy", async () => {
    await p.evaluate(() => { window.__board.energy(1); }); await p.evaluate(() => { location.hash = "#/you"; }); await p.waitForTimeout(250); await p.evaluate(() => { location.hash = "#/now"; }); await p.waitForTimeout(400);
    const r = await p.locator(".ph-rest").first().innerText(); for (const e of ["Listen to an audiobook", "Read before sleep", "A short walk"]) assert.match(r, new RegExp(e));
    await p.evaluate(() => { window.__board.energy(2); }); await p.evaluate(() => { location.hash = "#/you"; }); await p.waitForTimeout(250); await p.evaluate(() => { location.hash = "#/now"; }); await p.waitForTimeout(400);
    assert.equal((await p.locator("[aria-label='Do this now'] .ph-task").innerText()).trim(), "Download a language app");
  });
  await ok("no page errors (demo)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
{
  const ctx = await b.newContext(PHONE);
  await ctx.addInitScript((KEY) => { try { localStorage.setItem(KEY + ".account", JSON.stringify({ access_token: "tok", refresh_token: "", at: Date.now(), email: "t@t", uid: "u1" })); } catch (e) {} }, KEY);
  const p = await ctx.newPage();
  await p.goto(URL + "?demo=session"); await p.waitForTimeout(1200);
  await ok("signed in: the demo board is refused, and nothing is asked", async () => {
    assert.equal(await p.locator("dialog.ask[open]").count(), 0);
    const names = ((await st(p)) || { groups: [] }).groups.map((g) => g.name); assert.ok(!names.includes("Learn Spanish"), names.join(", "));
  });
  await ctx.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
