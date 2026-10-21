/* What the tutor remembers (restored 2026-10-21, owner: "AI is the personal tutor and the coordinator").
   Notes come from "remember ..." or from the tutor's propose_memory, which the person keeps or not in a sheet.
   No side panel: the notes are read and removed in Talk. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
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
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
