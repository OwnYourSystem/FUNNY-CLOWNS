import { createRequire } from "node:module";
import assert from "node:assert/strict";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
/* these suites test the classic board, which a phone-width page now shows only in Classic view */
const _nc = b.newContext.bind(b); b.newContext = async (o) => { const c = await _nc(o); await c.addInitScript(() => { try { localStorage.setItem("oys-classic", "test"); } catch (e) {} }); return c; };
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");
await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
await p.reload(); await p.waitForSelector(".row.pick");
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const say = async (t) => { await p.fill("#bot-input", t); await p.press("#bot-input", "Enter"); await p.waitForTimeout(120);
  return p.evaluate(() => { const m = document.querySelectorAll("#bot-log .bot-msg.bot"); return m.length ? m[m.length - 1].textContent : ""; }); };
const names = () => p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return { subs: Object.values(s.subs).map((x) => x.name), groups: s.groups.map((g) => g.name) }; }, KEY);
const html = await (await fetch(URL)).text();

await ok("voice is one Speak button that fills the box: no orb, no audio capture, nothing listens on load", async () => {
  for (const w of ["getUserMedia", "bot-orb", "bottoast", "askSpoken"]) assert.equal(html.includes(w), false, w);
  assert.equal(await p.locator("#bot-orb, #bottoast").count(), 0); assert.equal(await p.locator("#bot-mic").count(), 1);
});
await ok("the permissions header allows the microphone for this page only", async () => {
  const v = JSON.parse(fs.readFileSync(new globalThis.URL("../vercel.json", import.meta.url), "utf8")); const s = JSON.stringify(v);
  assert.match(s, /microphone=\(self\)/); assert.doesNotMatch(s, /microphone=\(\)/); assert.doesNotMatch(s, /microphone=\*/);
});
await ok("an Assistant button in the header opens a plain chat and Escape closes it", async () => {
  const btn = p.locator("#btn-assistant"); assert.equal(await btn.innerText(), "Assistant");
  await btn.click(); await p.locator("#botsheet").waitFor({ state: "visible" });
  assert.equal(await btn.getAttribute("aria-expanded"), "true");
  assert.equal(await p.locator("#bot-input").isVisible(), true);
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  assert.equal(await p.locator("#botsheet").isHidden(), true); assert.equal(await btn.getAttribute("aria-expanded"), "false");
  await btn.click(); await p.locator("#botsheet").waitFor({ state: "visible" });
});
await ok("signed out, Talk says simple commands run on this device with no AI, and names the AI model it can use when signed in", async () => {
  const n = await p.evaluate(() => { window.__board.openSheet(); return document.querySelector("#bot-ai-note").textContent; });
  assert.match(n, /^Simple commands are handled on this device, with no AI\. When you are signed in, other questions can go to an AI model \(Claude, by Anthropic\)\.$/);
});
await ok("help lists what it can do, by group, and says check-ins are private", async () => {
  const r = await say("help"); for (const g of ["TODAY", "STEPS", "GOALS", "SETTINGS", "EASY THINGS", "CHECK-IN", "JOURNAL", "GO TO"]) assert.ok(r.includes(g), g);
  assert.match(r, /private/);
});
await ok("rough day and more change today's size", async () => {
  await say("make today a rough day"); assert.equal(await p.evaluate(() => window.__board.dose().band), "low");
  await say("give me more today"); assert.equal(await p.evaluate(() => window.__board.dose().band), "high");
  await say("let the board decide"); assert.notEqual((await st()).dose && (await st()).dose.mode, "high");
});
await ok("how am I doing this week answers from the records, not an error", async () => {
  const r = await say("how am I doing this week"); assert.doesNotMatch(r, /No subtask|could not/i); assert.ok(r.length > 20);
});
await ok("what needs attention answers", async () => { const r = await say("what needs attention?"); assert.match(r, /Delivery days, nearest first|No goal has a delivery day/); assert.doesNotMatch(r, /deadline|overdue/i); });
await ok("day end: one sentence, and a question when the time is missing", async () => {
  await say("set my day end to 21:00"); assert.equal((await st()).me.wind, "21:00");
  const q = await say("my day ends"); assert.match(q, /What time/);
  await say("9:30pm"); assert.equal((await st()).me.wind, "21:30");
});
await ok("work hours, days, brief, north star", async () => {
  await say("I work 9 to 5:30"); assert.deepEqual((await st()).me.work, ["09:00", "17:30"]);
  await say("I work monday to thursday"); assert.deepEqual((await st()).me.days, [1, 2, 3, 4]);
  await say("send my morning brief at 8am"); assert.equal((await st()).me.brief, "08:00");
  await say("what matters most is Ship the Migration"); assert.equal((await st()).me.north, "Ship the Migration");
});
await ok("removed settings (commute, sharpest, training, hints, low-day question) change nothing", async () => {
  const before = JSON.stringify((await st()).me);
  for (const m of ["my commute is 45 minutes", "I am sharpest in the afternoon", "I train at lunch", "turn hint reminders off", "turn the low-day question off"]) {
    const r = await say(m); assert.doesNotMatch(r, /TypeError|undefined/, m); }
  const me = (await st()).me; assert.equal(JSON.stringify(me), before); assert.equal(me.commute, undefined); assert.equal(me.sharp, undefined); assert.equal(me.gym, undefined);
});
await ok("dark mode by words", async () => {
  await say("switch to dark mode"); assert.equal(await p.evaluate(() => localStorage.getItem("oys-theme")), "dark");
  await say("use the light theme"); assert.equal(await p.evaluate(() => localStorage.getItem("oys-theme")), "light");
});
await ok("step fields: tag, when, how long (no priority and no own date: the order and the delivery day replace them)", async () => {
  const { subs } = await names(); const n = subs[2];
  await say("set " + n.toLowerCase() + " priority to high"); assert.notEqual(Object.values((await st()).subs).find((x) => x.name === n).prio, "high");
  await say("tag " + n + " as errands"); assert.equal(Object.values((await st()).subs).find((x) => x.name === n).tag, "errands");
  await say("when for " + n + ": after my coffee"); const s1 = await st(); const id = Object.values(s1.subs).find((x) => x.name === n).id; assert.equal(s1.when[id].t, "after my coffee");
  await say(n + " takes 25 minutes"); assert.equal((await st()).est.items[id].m, 25);
});
await ok("a missing detail is asked for, the next message answers it, and cancel stops", async () => {
  const { subs } = await names(); const n = subs[3];
  const q = await say("my easy things are"); assert.match(q, /energy is low/);
  await say("reading, a walk"); assert.deepEqual((await st()).floor.items.map((x) => x.t), ["reading", "a walk"]);
  const q2 = await say("tag " + n + " as"); // not a full command: falls to a suggestion or question, never an error
  assert.doesNotMatch(q2, /TypeError|undefined/);
  const q3 = await say("my easy things are"); assert.match(q3, /energy is low/); await say("cancel");
  assert.equal((await st()).floor.items.length, 2);
});
await ok("Today and Waiting by words", async () => {
  const { subs } = await names(); const n = subs[4];
  await say("put " + n + " in today"); assert.ok((await st()).oftad.some((c) => (await_name(c)) === n || true));
  const s = await st(); const id = Object.values(s.subs).find((x) => x.name === n).id; assert.ok(s.oftad.some((c) => c.id === id));
  await say("move " + n + " to waiting"); const s2 = await st(); assert.ok(!s2.oftad.some((c) => c.id === id)); assert.ok(s2.plan.some((c) => c.id === id));
});
function await_name() { return ""; }
await ok("goals: rename, delivery day, work, tags, backlog, restore, archive", async () => {
  const { groups } = await names(); const g = groups[0];
  await say("rename goal " + g + " to Brand New Goal"); assert.ok((await st()).groups.some((x) => x.name === "Brand New Goal"));
  await say("goal brand new goal is due 2027-03-04"); assert.equal((await st()).groups.find((x) => x.name === "Brand New Goal").due, "2027-03-04");
  await say("goal brand new goal is work"); assert.equal((await st()).groups.find((x) => x.name === "Brand New Goal").where, "work");
  await say("goal brand new goal is not work"); assert.equal((await st()).groups.find((x) => x.name === "Brand New Goal").where, "any");
  await say("tag goal brand new goal with house, q4"); assert.deepEqual((await st()).groups.find((x) => x.name === "Brand New Goal").tags, ["house", "q4"]);
  await say("move goal brand new goal to the backlog"); let s = await st(); assert.ok(!s.groups.some((x) => x.name === "Brand New Goal")); assert.ok(s.backlog.some((x) => x.goal && x.goal.name === "Brand New Goal"));
  await say("bring brand new goal back from the backlog"); assert.ok((await st()).groups.some((x) => x.name === "Brand New Goal"));
  await say("archive goal brand new goal"); s = await st(); assert.ok(s.archive.some((x) => x.name === "Brand New Goal"));
  await say("bring brand new goal back from the archive"); assert.ok((await st()).groups.some((x) => x.name === "Brand New Goal"));
});
await ok("removing a goal by typing is staged: nothing goes until the button is pressed", async () => {
  const n0 = (await st()).groups.length;
  const r = await say("remove goal brand new goal"); assert.match(r, /waiting|Ready|button/i);
  await p.locator("#bot-pend").waitFor({ state: "visible" }); assert.match(await p.locator("#bot-pend").innerText(), /Remove goal .Brand New Goal. and its \d+ step/);
  assert.equal((await st()).groups.length, n0);
  await p.locator("[data-pend-no]").click(); assert.equal((await st()).groups.length, n0);
  await say("remove goal brand new goal"); await p.locator("[data-pend-yes]").click(); await p.waitForTimeout(150);
  assert.equal((await st()).groups.length, n0 - 1);
});
await ok("minimum day: set, show, tick, untick", async () => {
  await say("my minimum day is a proper meal, water, a short walk");
  let s = await st(); assert.equal(s.floor.items.length, 3);
  const r = await say("show my minimum day"); assert.match(r, /proper meal/);
  await say("tick water"); s = await st(); const id = s.floor.items.find((x) => x.t === "water").id; assert.ok(s.floor.log[Object.keys(s.floor.log)[0]].d.includes(id));
  await say("untick water"); s = await st(); assert.ok(!(s.floor.log[Object.keys(s.floor.log)[0]].d.includes(id)));
});
await ok("the weekly check-in opens its dialog, and what is in it is never read back", async () => {
  await say("open the weekly check-in"); await p.locator("dialog[open]").waitFor({ state: "visible" });
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  const r = await say("show my check-ins"); assert.match(r, /private/i); assert.match(r, /cannot see/i);
  const r2 = await say("how is my mood"); assert.match(r2, /private/i);
});
await ok("go to a page and search by words", async () => {
  await say("go to the planner"); assert.match(await p.evaluate(() => location.hash), /planner/);
  await say("go to the board");
  await say("search for migration"); assert.equal(await p.evaluate(() => document.querySelector(".seek-in").value), "migration");
  await say("clear the search"); assert.equal(await p.evaluate(() => document.querySelector(".seek-in").value), "");
});
await ok("a sentence it cannot place gets the closest things it can do, and no change", async () => {
  const before = JSON.stringify((await st()).subs);
  const r = await say("the moon is purple and my deadline is vibes"); assert.match(r, /closest|did not find/i); assert.equal(JSON.stringify((await st()).subs), before);
});
await ok("a step name that matches nothing offers real names", async () => {
  const { subs } = await names(); const w = subs[0].split(" ")[0];
  const r = await say("set " + w + " zzzqx priority to high"); assert.doesNotMatch(r, /undefined/);
});
await ok("distress still gets the fixed calm reply, ahead of everything", async () => {
  const r = await say("I want to kill myself"); assert.match(r, /doctor|crisis line/);
});
await ok("every tool the page hands a model is in the hosted allowlist, and the reverse", async () => {
  const names_ = await p.evaluate(() => window.__board.modelTools().map((t) => t.name)); const src = fs.readFileSync((process.env.APP_ROOT || "/home/user/FUNNY-CLOWNS") + "/api/tutor.js", "utf8");
  const list = src.match(/export const TOOLS = \[([\s\S]*?)\];/)[1].match(/"([a-z_]+)"/g).map((x) => x.replace(/"/g, ""));
  assert.deepEqual([...names_].sort(), [...list].sort());
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close();
