import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = process.env.BOARD_ROOT || path.join(HERE, "..");
const KEY = "oys-min-deliveries-v1";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
let proxyCalls = 0; await p.route("**/api/tutor", (r) => { proxyCalls++; r.fulfill({ status: 503, body: "{}" }); });
await p.goto("file://" + path.join(ROOT, "index.html")); await p.waitForSelector(".row.pick");
await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
await p.reload(); await p.waitForSelector(".row.pick");

const SENTENCE = "If the person says they are in distress or unsafe, reply with one calm sentence that you cannot help with that here, suggest a professional or their local emergency number, and stop coaching.";
const norm = (t) => t.replace(/["+\s]+/g, " ").replace(/\s+/g, " ");
await ok("the artifact tutor's rules carry the same safety sentence as the hosted tutor's", async () => {
  const rules = await p.evaluate(() => window.__board.rules);
  const api = fs.readFileSync(path.join(ROOT, "api", "tutor.js"), "utf8");
  assert.ok(norm(rules).includes(norm(SENTENCE)), "page rules lack the sentence");
  assert.ok(norm(api).includes(norm(SENTENCE)), "api/tutor.js lacks the sentence");
  assert.ok(/Do not diagnose, and do not give medical or mental-health advice\./.test(rules));
});

const test = (t) => p.evaluate((t) => window.__board.distress(t), t);
const POS = ["I want to die", "i wanna die", "I think I'll kill myself", "thinking about killing myself", "I want to end my life", "I'm going to take my own life", "I have been suicidal", "suicide seems easier", "everyone would be better off dead", "there is no reason to live", "I keep thinking about self-harm", "I want to end it all", "I can't go on like this", "I can't go on anymore", "I'm thinking of hurting myself", "I feel like harming myself", "I was planning to cut myself"];
const NEG = ["kill the experiment", "stop experiment", "end the experiment", "I am killing it today", "this deadline is killing my week", "I hurt my back at the gym", "I can't go on Monday", "mark it done and end it", "I want to cut the plan in half", "I want to cut myself some slack", "I need to cut myself a break", "thinking of cutting myself off from email", "remove the task about harming the database", "set sleep to 50 percent", "I am worn out", "what should I do today"];
await ok("every plain phrase on the list is caught (" + POS.length + ")", async () => { for (const t of POS) assert.equal(await test(t), true, t); });
await ok("ordinary sentences, injuries and idioms are not caught (" + NEG.length + ")", async () => { for (const t of NEG) assert.equal(await test(t), false, t); });

const snap = () => p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return JSON.stringify({ subs: s.subs, groups: s.groups.map((g) => g.subs), plan: s.plan, oftad: s.oftad, done: s.done, backlog: s.backlog }); }, KEY);
const ask = async (q) => { await p.evaluate((q) => window.__board.ask(q), q); await p.waitForTimeout(300); };
const log = () => p.evaluate(() => [...document.querySelectorAll("#bot-log .bot-msg")].map((d) => d.className.replace("bot-msg ", "") + ": " + d.textContent));
await ok("the old guesser used to turn 'I want to ...' into a task; now the fixed message answers and nothing on the board changes", async () => {
  const before = await snap();
  await ask("I want to end it all");
  const l = await log(); assert.match(l.slice(-1)[0], /^bot: I am sorry it feels this heavy\. I cannot help with that here/); assert.match(l.slice(-1)[0], /local emergency number now \(for example 112 in the EU or 911 in the US\)/); assert.match(l.slice(-1)[0], /I will stop the coaching for now\.$/);
  assert.equal(await snap(), before);
  await ask("I want to die"); assert.equal(await snap(), before);
});
await ok("no hosted call is made, and an ordinary sentence still works", async () => {
  assert.equal(proxyCalls, 0);
  await ask("stop experiment"); assert.match((await log()).slice(-1)[0], /No experiment is running/);
});
await ok("the toast does not repeat the person's words", async () => {
  await ask("I want to die"); const t = await p.evaluate(() => { const el = document.querySelector("#toast, .toast"); return el ? el.textContent : ""; });
  assert.ok(!/want to die/i.test(t), t);
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
