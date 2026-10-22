/* Talk understands plain sentences without the AI (owner, 2026-10-22: "the chatbot is still dysfunctional", after
   "I don't feel good today, what task can I take?" got a list of unrelated commands). A low day is read from a
   whole sentence, a question about what to do gets the board's pick, a hello or thanks gets a short answer, and
   a sentence it cannot place gets the 3 starter questions instead of guesses. The page also asks the server
   whether the tutor is switched on, and only a yes turns it on. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const errs = [];
const day = new Date().toISOString().slice(0, 10);
const sub = (id, gid, name, easy) => ({ id, name, pct: 0, status: "todo", tag: "", upd: day, gid, ...(easy ? { easy: true } : {}) });
const board = (o = {}) => ({ v: 2, seedRev: 7, unseeded: 1, day, sel: "g1", ue: {}, killed: [], archive: [], tagFilter: [], backlog: [], oftad: [], plan: [], done: [], hist: [], dayLog: [], log: [],
  groups: [{ id: "g1", name: "Garden shed", subs: ["s1", "s2"], due: "", prio: "mid", tags: [], where: "any" }, { id: "g2", name: "Spanish", subs: ["s3"], due: "", prio: "mid", tags: [], where: "any" }],
  subs: { s1: sub("s1", "g1", "Buy the timber"), s2: sub("s2", "g1", "Lay the base"), s3: sub("s3", "g2", "Watch one short video", o.easy !== false) },
  me: { done: true, guided: true, days: [1, 2, 3, 4, 5], work: ["08:00", "16:30"], rise: "07:00", wind: "22:30", north: "", brief: "07:30", icon: "" }, ...o.extra });

async function open({ tutor = null, b0 = board() } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (tutor !== null) await ctx.route(/\/api\/tutor$/, (r) => r.request().method() === "GET"
    ? r.fulfill({ contentType: "application/json", body: JSON.stringify({ configured: tutor }) }) : r.fulfill({ status: 500, body: "{}" }));
  await ctx.addInitScript(([k, s]) => { if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", "1"); localStorage.setItem(k, JSON.stringify(s)); } }, [KEY, b0]);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL + "#/talk"); await p.waitForTimeout(900);
  return { ctx, p };
}
/* through the real chat, as a person types it */
async function say(p, q) {
  await p.fill("#bot-input", q); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
  return p.evaluate(() => { const m = [...document.querySelectorAll("#bot-log .bot-msg.bot")].pop(); return m ? m.getAttribute("data-say-text") || m.textContent : ""; });
}
const st = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
const lvl = (p) => p.evaluate(() => window.__board.dose().lvl);

await ok("the owner's sentence: a low day is made, one easy step is offered, and the way back is said", async () => {
  const { ctx, p } = await open(); try {
    const r = await say(p, "I don't feel good today, what task can I take?");
    assert.match(r, /^I am sorry you do not feel well\. I made today a low day\.\n\nWatch one short video\./); assert.match(r, /Say normal day to change it back\.$/);
    assert.equal(await lvl(p), 2); assert.ok((await st(p)).oftad.some((c) => c.id === "s3"), "the easy step is not in Today");
    assert.doesNotMatch(r, /did not|command|closest/i);
  } finally { await ctx.close(); }
});
await ok("other ways of saying it: tired, rough day, slept badly, no energy", async () => {
  for (const q of ["I'm so tired", "rough day, what can I do?", "I slept badly", "no energy today", "feeling overwhelmed"]) {
    const { ctx, p } = await open(); try { const r = await say(p, q); assert.match(r, /low day/, q); assert.equal(await lvl(p), 2, q); } finally { await ctx.close(); }
  }
});
await ok("a good day is not read as a low one", async () => {
  const { ctx, p } = await open(); try {
    const r = await say(p, "I feel good today, what task can I take?"); assert.match(r, /^Buy the timber\./); assert.equal(await lvl(p), 3);
  } finally { await ctx.close(); }
});
await ok("with no easy step and no easy things, a low day asks for nothing and says how to add one", async () => {
  const { ctx, p } = await open({ b0: board({ easy: false }) }); try {
    const r = await say(p, "I don't feel well"); assert.match(r, /Nothing is needed today\. If you want one small thing, mark a step Easy on its page, or add your easy things on You\./);
  } finally { await ctx.close(); }
});
await ok("a low day already set is not set again", async () => {
  const { ctx, p } = await open(); try {
    await say(p, "I'm tired"); const r = await say(p, "I am still tired"); assert.match(r, /^Today is already a low day\./); assert.doesNotMatch(r, /Say normal day/);
  } finally { await ctx.close(); }
});
await ok("asking what to do, in many words, gets the board's pick", async () => {
  for (const q of ["what task can I take?", "which step should I do next", "what can I work on", "what's next", "give me something to do"]) {
    const { ctx, p } = await open(); try { assert.match(await say(p, q), /^Buy the timber\. This is the next step of Garden shed/, q); } finally { await ctx.close(); }
  }
});
await ok("hello, how are you and thanks get a short, warm answer", async () => {
  const { ctx, p } = await open(); try {
    assert.match(await say(p, "hello"), /^Good (morning|afternoon|evening)! What do you need\?$/);
    assert.match(await say(p, "how are you?"), /^I am fine, thank you\./);
    assert.match(await say(p, "thanks"), /^You are welcome\./);
  } finally { await ctx.close(); }
});
await ok("what it cannot place: the 3 starter questions, no unrelated commands, nothing changed", async () => {
  const { ctx, p } = await open(); try {
    const before = JSON.stringify((await st(p)).subs);
    const r = await say(p, "the moon is purple");
    assert.match(r, /^I did not catch that\. You can ask “What should I do now\?”, “What is left today\?” or “Make today lighter”\./);
    assert.doesNotMatch(r, /Sign in/, "no tutor here, so no sign-in hint"); assert.equal(JSON.stringify((await st(p)).subs), before);
  } finally { await ctx.close(); }
});
await ok("the page asks whether the tutor is on: a yes turns it on, and signed out it says sign in for questions like this", async () => {
  const { ctx, p } = await open({ tutor: true }); try {
    const r = await say(p, "the moon is purple"); assert.match(r, /Sign in on You, and the AI tutor can answer questions like this one\./);
  } finally { await ctx.close(); }
});
await ok("a no leaves the tutor off, and signed out the board still answers by itself", async () => {
  const { ctx, p } = await open({ tutor: false }); try {
    const r = await say(p, "the moon is purple"); assert.doesNotMatch(r, /Sign in/); assert.match(r, /^I did not catch that\./);
  } finally { await ctx.close(); }
});
await ok("distress is still met with the safety answer first, never a low day", async () => {
  const { ctx, p } = await open(); try {
    const r = await say(p, "I feel terrible and I want to die"); assert.match(r, /^I am sorry it feels this heavy\./); assert.equal(await lvl(p), 3);
  } finally { await ctx.close(); }
});
await ok("no page errors", () => assert.deepEqual(errs, []));
await b.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
