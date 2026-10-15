import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", JKEY = KEY + ".journal";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
/* these suites test the classic board, which a phone-width page now shows only in Classic view */
const _nc = b.newContext.bind(b); b.newContext = async (o) => { const c = await _nc(o); await c.addInitScript(() => { try { localStorage.setItem("oys-classic", "1"); } catch (e) {} }); return c; };
const ymd = (d) => { const q = (n) => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); };
const jday = (d) => { const x = new Date(d.getTime()); if (x.getHours() < 4) x.setDate(x.getDate() - 1); return ymd(x); };
const NOW = new Date(), TODAY = jday(NOW), YEST = jday(new Date(NOW.getTime() - 864e5));
const KIND_NOW = NOW.getHours() >= 4 && NOW.getHours() < 12 ? "start" : "end";

const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");
await p.evaluate(([KEY, JKEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); localStorage.removeItem(JKEY); }, [KEY, JKEY]);
await p.reload(); await p.waitForSelector(".row.pick");
const jr = () => p.evaluate((JKEY) => JSON.parse(localStorage.getItem(JKEY) || "null"), JKEY);
const setJr = (x) => p.evaluate(([JKEY, x]) => { if (x === null) localStorage.removeItem(JKEY); else localStorage.setItem(JKEY, JSON.stringify(x)); }, [JKEY, x]);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const open = () => p.evaluate(() => window.__board.openSheet());
const say = async (t) => { await open(); await p.fill("#bot-input", t); await p.press("#bot-input", "Enter"); await p.waitForTimeout(150);
  return p.evaluate(() => { const m = document.querySelectorAll("#bot-log .bot-msg.bot"); return m.length ? m[m.length - 1].textContent : ""; }); };
const D = () => p.locator("dialog.ask[open]");
const reload = async () => { await p.reload(); await p.waitForSelector(".row.pick"); await p.waitForTimeout(300); };

await ok("one message splits into what got done and what comes next", async () => {
  const s = (t) => p.evaluate((t) => window.__board.journal.split(t), t);
  assert.deepEqual(await s("I have done these tasks today and I should do that tomorrow"), { a: "I have done these tasks today", b: "I should do that tomorrow" });
  assert.deepEqual(await s("Finished the slides, sent the invoice. Tomorrow: call the bank"), { a: "Finished the slides, sent the invoice", b: "Tomorrow: call the bank" });
  assert.deepEqual(await s("A quiet day, nothing much"), { a: "A quiet day, nothing much", b: "" });
});
await ok("a note written after midnight belongs to the evening before; from 04:00 it is the new day", async () => {
  const r = await p.evaluate(() => [new Date(2026, 9, 15, 0, 30), new Date(2026, 9, 15, 3, 59), new Date(2026, 9, 15, 4, 0)].map((d) => window.__board.journal.day(d)));
  assert.deepEqual(r, ["2026-10-14", "2026-10-14", "2026-10-15"]);
});
await ok("'I would like to journal my day' asks one question, and the next message is saved with date and time", async () => {
  const q = await say("I would like to journal my day"); assert.match(q, /One message is enough/); assert.match(q, /this device only/);
  const r = await say("I have done the Bronze report today and I should call the Bank tomorrow");
  assert.match(r, /^Saved to your journal/); const j = await jr(); assert.equal(j.log.length, 1); const e = j.log[0];
  assert.equal(e.a, "I have done the Bronze report today"); assert.equal(e.b, "I should call the Bank tomorrow");
  assert.equal(e.d, TODAY); assert.match(e.tm, /^\d\d:\d\d$/); assert.ok(Math.abs(new Date(e.at) - Date.now()) < 60000); assert.equal(e.kind, ["morning"].includes("x") ? "x" : (await p.evaluate(() => { const h = new Date().getHours(); return h >= 4 && h < 12 ? "start" : "end"; })));
});
await ok("the answer is the person's words, never a command: 'a rough day' and 'remember' are saved, not acted on", async () => {
  const before = await st(); const mem = (before.mem || []).length, cap = JSON.stringify(before.capLog || []);
  await say("journal my day"); await say("Remember to call mum. I had a rough day, tomorrow I will rest");
  const after = await st(); assert.equal((after.mem || []).length, mem, "memory changed"); assert.equal(JSON.stringify(after.capLog || []), cap, "the day size changed");
  const l = (await jr()).log; assert.equal(l.length, 2); assert.equal(l[1].a, "Remember to call mum. I had a rough day"); assert.equal(l[1].b, "tomorrow I will rest");
});
await ok("cancel stops it and saves nothing", async () => {
  await say("I want to journal"); const r = await say("cancel"); assert.match(r, /Nothing was saved/); assert.equal((await jr()).log.length, 2);
});
await ok("'Journal:' with the text after it saves at once, capitals kept", async () => {
  const r = await say("Journal: Finished the Q3 slides. Tomorrow: send them to Anna"); assert.match(r, /^Saved/);
  const e = (await jr()).log[2]; assert.equal(e.a, "Finished the Q3 slides"); assert.equal(e.b, "Tomorrow: send them to Anna");
});
await ok("'journal my morning' asks the start-of-day questions and saves a start entry", async () => {
  const q = await say("journal my morning"); assert.match(q, /Where are you standing today/);
  await say("Rested, a clear head. First the bank"); const e = (await jr()).log[3]; assert.equal(e.kind, "start"); assert.equal(e.b, "First the bank");
});
await ok("it is kept apart: not in the board's state, so not in sync or the backup text", async () => {
  const s = JSON.stringify(await st()); assert.equal(s.includes("Bronze report"), false); assert.equal(s.includes("Anna"), false);
});
await ok("the next day the note is the first thing on Today, and nothing opens over the board", async () => {
  await setJr({ v: 1, log: [{ id: "j1", at: new Date(Date.now() - 864e5).toISOString(), d: YEST, tm: "21:40", kind: "end", a: "Shipped the release", b: "Write the changelog" }] });
  await reload(); await p.waitForTimeout(400); assert.equal(await p.locator("dialog.ask[open]").count(), 0);
  const t = await p.locator("#jr-check").innerText(); assert.match(t, /Yesterday, 21:40/i); assert.match(t, /Done: Shipped the release/); assert.match(t, /Tomorrow: Write the changelog/);
});
await ok("the note also stays at the top of Today until hidden or until today has its own start", async () => {
  const c = p.locator("#jr-check"); assert.equal(await c.isVisible(), true); assert.match(await c.innerText(), /Write the changelog/);
  await c.getByRole("button", { name: "Hide" }).click(); await p.waitForTimeout(150); assert.equal(await c.isVisible(), false);
  await reload(); assert.equal(await c.isVisible(), false);
});
await ok("Write today's start on the note saves a start entry, and the note goes", async () => {
  await setJr({ v: 1, log: [{ id: "j1", at: new Date(Date.now() - 864e5).toISOString(), d: YEST, tm: "21:40", kind: "end", a: "Shipped", b: "Changelog" }] });
  await reload(); await p.locator("#jr-check").getByRole("button", { name: "Write today\u2019s start" }).click();
  await p.waitForTimeout(250); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /Start of day/);
  assert.equal(await D().locator('[data-ak="kind"] [data-av="start"]').getAttribute("aria-pressed"), "true");
  await D().locator('[data-ak="a"]').fill("Fresh, coffee done"); await D().locator('[data-ak="b"]').fill("The changelog first");
  await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(250);
  const l = (await jr()).log; assert.equal(l.length, 2); assert.equal(l[1].kind, "start"); assert.equal(l[1].d, TODAY); assert.equal(l[1].b, "The changelog first");
  assert.equal(await p.locator("#jr-check").isVisible(), false);
});
await ok("'where did I leave off?' reads the last note back in the chat", async () => {
  const r = await say("where did I leave off?"); assert.match(r, /Yesterday, 21:40/); assert.match(r, /Tomorrow: Changelog/);
});
await ok("'show my journal' opens the Planner with every entry, newest first, each with its date and time", async () => {
  const r = await say("show my journal"); assert.match(r, /2 entries/); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(() => location.hash), "#/planner");
  const t = await p.locator("#jr-body").innerText(); assert.ok(t.indexOf("The changelog first") < t.indexOf("Shipped"), "newest first"); assert.match(t, /21:40/); assert.match(t, /START OF DAY|Start of day/i);
});
await ok("the Journal button on Today opens the same dialog; an empty one cannot be saved", async () => {
  await p.evaluate(() => { location.hash = "#/board"; }); await p.waitForTimeout(250);
  await p.locator('#oftad').locator("xpath=..").getByRole("button", { name: "Journal" }).click(); await D().waitFor({ state: "visible" });
  await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(150); assert.match(await D().innerText(), /Write something first/);
  await D().getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(150); assert.equal((await jr()).log.length, 2);
});
await ok("Delete my journal asks first, then removes every entry", async () => {
  await p.evaluate(() => { location.hash = "#/planner"; }); await p.waitForTimeout(250);
  await p.locator("#jr-erase").click(); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /2 journal entries/);
  await D().getByRole("button", { name: "Delete them" }).click(); await p.waitForTimeout(200); assert.equal(await jr(), null);
  assert.match(await p.locator("#jr-body").innerText(), /No entries yet/);
});
await ok("an empty journal shows nothing at the top and says so in the chat", async () => {
  await p.evaluate(() => { location.hash = "#/board"; }); await reload(); assert.equal(await p.locator("#jr-check").isVisible(), false);
  assert.match(await say("where did I leave off"), /empty/);
});
await ok("no page errors (computer)", async () => { assert.deepEqual(errs, []); });
await ctx.close();

/* the phone */
{
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const q = await ctx2.newPage(); const errs2 = []; q.on("pageerror", (e) => errs2.push(e.message));
  await q.goto(URL); await q.waitForSelector(".row.pick");
  await q.evaluate(([KEY, JKEY, YEST]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem(JKEY, JSON.stringify({ v: 1, log: [{ id: "j1", at: new Date(Date.now() - 864e5).toISOString(), d: YEST, tm: "22:05", kind: "end", a: "A long day of meetings with the whole team about the plan for next quarter", b: "Start with the budget sheet before any email" }] })); }, [KEY, JKEY, YEST]);
  await q.reload(); await q.waitForSelector(".row.pick");
  await ok("on a phone the note sits on Today, fits the screen, opens nothing, and the page does not scroll sideways", async () => {
    await q.waitForTimeout(500); assert.equal(await q.locator("dialog.ask[open]").count(), 0);
    const bx = await q.locator("#jr-check").boundingBox(); assert.ok(bx && bx.x >= 0 && bx.x + bx.width <= 391, JSON.stringify(bx));
    assert.equal(await q.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await q.locator("#jr-check").screenshot({ path: "/tmp/claude-0/shot-journal-card.png" });
  });
  await ok("no page errors (phone)", async () => { assert.deepEqual(errs2, []); });
  await ctx2.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
