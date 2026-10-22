/* What the tutor remembers (restored 2026-10-21, owner: "AI is the personal tutor and the coordinator").
   Notes come from "remember ..." or from the tutor's propose_memory, which the person keeps or not in a sheet.
   The board also learns from behaviour (finishing, skips) and asks once a day in a quiet card. No side panel. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.setItem("oys-classic", "test"); } catch (e) {} });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const say = (t) => p.evaluate((t) => window.__board.brain(t), t);
const tool = (name, args) => p.evaluate(([n, a]) => { const t = window.__board.modelTools().find((x) => x.name === n); try { return { ok: t.execute(a) }; } catch (e) { return { err: e.message }; } }, [name, args]);
const D = () => p.locator("dialog.ask[open]");
/* the sheet closes first and its answer is saved a moment later: wait until no note is still waiting */
const settle = () => p.waitForFunction((KEY) => !document.querySelector("dialog.ask[open]") && !(JSON.parse(localStorage.getItem(KEY)).mem || []).some((m) => m.st === "proposed"), KEY, { timeout: 3000 }).catch(() => {});
const kept = async () => ((await st()).mem || []).filter((m) => m.st === "kept");

await ok("remember keeps a note in the person's words; what do you know lists it with where it came from", async () => {
  const r = await say("remember I do my best work before lunch"); assert.match(r, /^Kept: I do my best work before lunch\. Type forget 1/);
  const k = await kept(); assert.equal(k.length, 1); assert.equal(k[0].src, "you");
  assert.match(await say("what do you know about me"), /1\. I do my best work before lunch \(you told me\)/);
});
await ok("the tutor sees the kept notes: in the board snapshot and through get_memory", async () => {
  assert.match(await p.evaluate(() => window.__board.mem.snap()), /WHAT THE PERSON HAS KEPT ABOUT HOW THEY WORK: I do my best work before lunch/);
  const m = JSON.parse((await tool("get_memory", {})).ok); assert.equal(m.length, 1); assert.equal(m[0].note, "I do my best work before lunch");
});
await ok("propose_memory asks the person in a sheet; Keep it keeps it as the tutor's", async () => {
  const r = await tool("propose_memory", { note: "Calls go after lunch" }); assert.match(r.ok, /Asked/);
  await D().waitFor(); const t = await D().innerText(); assert.match(t, /Keep this note\?/); assert.match(t, /Calls go after lunch/);
  assert.equal((await kept()).length, 1, "kept before the yes");
  await D().getByRole("button", { name: "Keep it" }).click(); await settle();
  const k = await kept(); assert.equal(k.length, 2); assert.equal(k[1].src, "tutor"); assert.equal(k[1].t, "Calls go after lunch");
});
await ok("one question at a time: a second proposal while the sheet is open is refused", async () => {
  await tool("propose_memory", { note: "Fridays are for admin" }); await D().waitFor();
  const r = await tool("propose_memory", { note: "Mondays start slow" }); assert.match(r.err || "", /already waiting/);
  await D().getByRole("button", { name: "Not now" }).click(); await settle();
});
await ok("Not now keeps nothing and leaves no proposal behind", async () => {
  const s = await st(); assert.equal(s.mem.filter((m) => m.t === "Fridays are for admin").length, 0); assert.equal(s.mem.filter((m) => m.st === "proposed").length, 0);
});
await ok("the tutor cannot propose moods, health or personal details", async () => {
  const r = await tool("propose_memory", { note: "They feel sad on Mondays" }); assert.match(r.err || "", /not about moods, health or personal details/);
  assert.equal(await D().count(), 0);
});
await ok("a proposal left open by a closed page does not block the next one", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.mem.push({ id: "mold", t: "Old question", src: "tutor", st: "proposed", d: "2026-10-01" }); localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector(".row.pick");
  const r = await tool("propose_memory", { note: "Deep work needs two hours" }); assert.match(r.ok || "", /Asked/);
  await D().waitFor(); await D().getByRole("button", { name: "Not now" }).click(); await settle();
  assert.equal((await st()).mem.some((m) => m.id === "mold"), false);
});
await ok("forget and a number removes one; forget everything asks to be typed twice", async () => {
  assert.match(await say("forget 2"), /^Forgotten: Calls go after lunch/); assert.equal((await kept()).length, 1);
  assert.match(await say("forget everything"), /Type it again within 20 seconds/); assert.equal((await kept()).length, 1);
  assert.match(await say("forget everything"), /^Erased/); assert.equal((await kept()).length, 0);
  assert.match(await say("what do you know about me"), /^Nothing yet/);
});
await ok("the event log records keeping and forgetting, never the words", async () => {
  const ev = (await st()).ev.filter((e) => e.k === "mem"); assert.ok(ev.length >= 3); assert.ok(!JSON.stringify(ev).includes("lunch"));
});
/* ---------- learning from behaviour (owner, 2026-10-21: "the AI agent should learn from user behavior in order to give customized recommendations") ---------- */
/* n days back at hh:00, local */
const at = (n, hh) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hh, 0, 0, 0); return d.getTime(); };
const seedEv = async (ev, extra) => { await p.evaluate(([KEY, ev, extra]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.ev = ev; s.mem = []; s.memNo = {}; delete s.memAt; s.me.done = true; delete s.me.normalN; delete s.me.learn;
    if (extra) (0, eval)("(" + extra + ")")(s); localStorage.setItem(KEY, JSON.stringify(s)); location.hash = "#/board"; }, [KEY, ev, extra || ""]); await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(200); };
const card = () => p.locator("#learncard");
/* 10 days opened in the last 4 weeks, 2 different steps finished each day: one in the morning, one in the afternoon */
const twoADay = []; for (let n = 1; n <= 10; n++) { twoADay.push({ t: at(n, 9), k: "done", id: "a" + n }, { t: at(n, 15), k: "done", id: "b" + n }); }
const mornings = []; for (let n = 1; n <= 10; n++) { mornings.push({ t: at(n, 9), k: "done", id: "a" + n }, { t: at(n, 10), k: "done", id: "b" + n }); }
await ok("from what was finished, the board finds how many steps a good day holds and asks, with the numbers", async () => {
  await seedEv(twoADay);
  assert.equal(await card().isVisible(), true); const tx = await card().innerText();
  assert.match(tx, /Something I noticed/i); assert.match(tx, /median of 2 steps\. A good day is 2 steps\./); assert.match(tx, /Median over 10 days[\s\S]*changes from 3 to 2/);
  assert.equal((await kept()).length, 0, "nothing is kept before the yes");
});
await ok("Keep it keeps the note and changes Steps on a good day; forgetting it puts the old number back", async () => {
  await card().locator("[data-learn-keep]").click(); await p.waitForTimeout(250);
  let s = await st(); assert.equal(s.me.normalN, 2); assert.equal(s.mem.find((m) => m.key === "good-2").src, "board");
  assert.equal(await p.evaluate(() => window.__board.dose().n), 2);
  assert.match(await p.evaluate(() => window.__board.mem.snap()), /A good day is 2 steps/, "the tutor does not see what was learned");
  assert.match(await say("what do you know about me"), /learned from what you did, you kept it/);
  await say("forget 1"); s = await st(); assert.equal(s.me.normalN, undefined); assert.equal(await p.evaluate(() => window.__board.dose().n), 3);
});
await ok("one question at a time, and Not now silences that question for 30 days", async () => {
  await seedEv(mornings); /* all in the morning, so the hours finding exists too */
  assert.equal(await card().locator("[data-learn-keep]").count(), 1);
  const first = await card().innerText();
  await card().locator("[data-learn-no]").click(); await p.waitForTimeout(250);
  const s = await st(); const key = Object.keys(s.memNo)[0]; assert.ok(key, "no snooze"); assert.ok(s.memNo[key] > new Date().toISOString().slice(0, 10));
  assert.equal(await card().isVisible(), false, "a second question came the same day");
  await p.evaluate(() => window.__board.mem.tick(true)); await p.evaluate(() => window.__board.render()); await p.waitForTimeout(200);
  assert.notEqual(await card().innerText(), first, "the silenced question came back");
});
await ok("when the finishing happens is a note for the tutor, with no setting changed", async () => {
  const f = await p.evaluate(() => window.__board.mem.find()); const h = f.find((x) => x.key === "hours-morning");
  assert.ok(h, JSON.stringify(f)); assert.match(h.t, /Most of what I finish happens in the morning: 20 of 20/); assert.equal(h.apply, undefined);
  assert.match(h.evid, /not when you work best/);
});
await ok("a step skipped 3 times in 3 weeks becomes a suggestion to make it smaller", async () => {
  const id = await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return Object.values(s.subs).find((x) => x.pct < 100 && x.status !== "done").id; }, KEY);
  await seedEv([{ t: at(1, 9), k: "skip", id }, { t: at(3, 9), k: "skip", id }, { t: at(6, 9), k: "skip", id }]);
  const f = await p.evaluate(() => window.__board.mem.find()); const k = f.find((x) => x.key === "skip-" + id);
  assert.ok(k, JSON.stringify(f)); assert.match(k.t, /^I often skip “.+”\. A smaller first step may help\.$/); assert.match(k.evid, /Skipped 3 times/);
});
await ok("a lighter weekday is found only with enough days on both sides", async () => {
  const ev = []; for (let n = 1; n <= 56; n++) { const d = new Date(at(n, 9)); const fri = d.getDay() === 5; ev.push({ t: at(n, 9), k: "done", id: "x" + n }); if (!fri) ev.push({ t: at(n, 11), k: "done", id: "y" + n }); }
  await seedEv(ev);
  const f = await p.evaluate(() => window.__board.mem.find()); const l = f.find((x) => x.key === "light-5");
  assert.ok(l, JSON.stringify(f.map((x) => x.key))); assert.match(l.t, /^Fridays are my lightest day: 1 finished, against 2 on other days\.$/);
  await seedEv(ev.slice(0, 12)); assert.equal((await p.evaluate(() => window.__board.mem.find())).some((x) => x.key.startsWith("light-")), false);
});
await ok("learning off: nothing is asked; on again by a word or the Planner switch", async () => {
  await seedEv(twoADay, `(s) => { s.me.learn = false; }`);
  assert.equal(await card().isVisible(), false);
  assert.match(await say("what have you noticed"), /Learning is off/);
  await p.evaluate(() => { location.hash = "#/planner"; }); await p.waitForTimeout(300);
  assert.equal(await p.locator("#pl-learn").getAttribute("aria-pressed"), "false");
  await p.locator("#pl-learn").click(); await p.waitForTimeout(250); assert.equal((await st()).me.learn, undefined);
  assert.match(await say("what have you noticed"), /I noticed this/);
});
await ok("the event log holds no words of any note", async () => {
  const s = await st(); assert.ok(!JSON.stringify(s.ev.filter((e) => e.k === "mem")).includes("good day"));
});
await ok("on the phone the same card sits on Now; Keep it keeps it; the switch on You turns learning off", async () => {
  await seedEv(twoADay, `(s) => { s.me.guided = true; }`);
  const pc = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  await pc.addInitScript(() => { try { localStorage.removeItem("oys-classic"); } catch (e) {} }); /* the desktop checks force the classic board */
  const q = await pc.newPage(); const qe = []; q.on("pageerror", (e) => qe.push(e.message));
  try {
    await q.goto(URL); await q.evaluate(() => { location.hash = "#/now"; }); await q.waitForTimeout(800); if (!(await q.locator(".ph-learn").count())) throw new Error("no card. Now: " + (await q.locator("#ph-main").innerText()).slice(0, 400) + " MEM " + JSON.stringify(await q.evaluate(() => [window.__board.mem.list(), JSON.parse(localStorage.getItem("oys-min-deliveries-v1")).memAt])));
    assert.match(await q.locator(".ph-learn").innerText(), /A good day is 2 steps/);
    await q.locator("[data-ph=learnkeep]").click(); await q.waitForTimeout(300);
    const s = await q.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY); assert.equal(s.me.normalN, 2); assert.equal(await q.locator(".ph-learn").count(), 0);
    await q.evaluate(() => { location.hash = "#/you"; }); await q.waitForTimeout(300);
    const sw = q.locator("[data-ph=learn]"); assert.equal(await sw.getAttribute("role"), "switch"); assert.equal(await sw.getAttribute("aria-checked"), "true");
    await sw.click(); await q.waitForTimeout(250); assert.equal((await q.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY)).me.learn, false);
    assert.deepEqual(qe, []);
  } finally { await pc.close(); }
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
