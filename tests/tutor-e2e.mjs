import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const ROOT = "/home/user/FUNNY-CLOWNS";

// ---- scripted "Anthropic" ------------------------------------------------
let queue = [], upstream = [];
const mock = http.createServer((q, s) => {
  let b = ""; q.on("data", (c) => b += c); q.on("end", () => {
    const body = JSON.parse(b); upstream.push(body);
    const step = queue.shift();
    if (!step) { s.writeHead(500); return s.end("{}"); }
    const r = step(body);
    s.writeHead(r.status || 200, { "content-type": "application/json", ...(r.headers || {}) });
    s.end(JSON.stringify(r.json));
  });
});
await new Promise((r) => mock.listen(0, r));
process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:" + mock.address().port;
process.env.ANTHROPIC_API_KEY = "test-key";
process.env.TUTOR_REQUIRE_AUTH = "0";
const { default: handler } = await import(ROOT + "/api/tutor.js");

// ---- the site: static files + the real handler ----------------------------
const site = http.createServer(async (q, s) => {
  if (q.url.startsWith("/api/tutor")) {
    let b = ""; q.on("data", (c) => b += c);
    await new Promise((r) => q.on("end", r));
    let parsed; try { parsed = JSON.parse(b); } catch { parsed = b; }
    const res = { h: {}, setHeader(k, v) { this.h[k] = v; }, status(c) { this.code = c; return this; }, json(j) { s.writeHead(this.code || 200, { "content-type": "application/json", ...this.h }); s.end(JSON.stringify(j)); } };
    return handler({ method: q.method, body: parsed, headers: q.headers }, res);
  }
  const f = path.join(ROOT, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  const flip = process.env.TUTOR_ON === "1";
  const bytes = f.endsWith(".html") && flip ? Buffer.from(fs.readFileSync(f, "utf8").replace("var TUTOR_PROXY=false;", "var TUTOR_PROXY=true;")) : fs.readFileSync(f);
  s.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html" : f.endsWith(".js") ? "text/javascript" : f.endsWith(".webmanifest") ? "application/manifest+json" : "application/octet-stream" }); s.end(bytes);
});
await new Promise((r) => site.listen(0, r));
const URL = "http://127.0.0.1:" + site.address().port + "/index.html";

const text = (t) => ({ json: { id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "thinking", thinking: "", signature: "SIG-" + t.length }, { type: "text", text: t }], usage: { input_tokens: 10, output_tokens: 5 } } });
const toolUse = (name, input, id) => ({ json: { id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "tool_use", content: [{ type: "thinking", thinking: "", signature: "SIGT-" + id }, { type: "tool_use", id, name, input }], usage: { input_tokens: 10, output_tokens: 5 } } });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };

await page.goto(URL); await page.waitForSelector(".row.pick");
// a 40-day golden history, and a signed-in session (token is not verified in this test)
await page.evaluate(([KEY]) => {
  const s = JSON.parse(localStorage.getItem(KEY)); s.me = s.me || {}; s.me.done = true;
  const gid = s.groups[0].id, ids = s.groups[0].subs, day = new Date(); day.setHours(0, 0, 0, 0); const ev = [];
  for (let d = 40; d >= 1; d--) { const dt = new Date(day); dt.setDate(dt.getDate() - d); const dow = dt.getDay(); const t = new Date(dt); t.setHours(dow >= 1 && dow <= 5 ? 8 : 15, 15, 0, 0); ev.push({ t: t.getTime(), k: "done", id: ids[0], g: gid }); }
  s.ev = ev; localStorage.setItem(KEY, JSON.stringify(s));
  localStorage.setItem(KEY + ".account", JSON.stringify({ access_token: "tok", refresh_token: "", at: Date.now(), email: "t@t", uid: "u1" }));
}, [KEY]);
await page.reload(); await page.waitForSelector(".row.pick");
const ask = async (q) => { await page.evaluate((q) => window.__board.ask(q), q); await page.waitForTimeout(500); };
const log = () => page.evaluate(() => [...document.querySelectorAll("#bot-log .bot-msg")].map((d) => d.className.replace("bot-msg ", "") + ": " + d.textContent));
const clear = () => page.evaluate(() => document.querySelector("#bot-clear").click());

// 1. offline answers never touch the proxy
upstream = [];
await ask("what do i skip");
await ok("a question the board can answer itself makes no call", async () => { assert.equal(upstream.length, 0); });

// 2. a real chat turn with a tool round
queue = [
  () => toolUse("stats", { metric: "completions", days: 30, group_by: "hour_slot" }, "tu_1"),
  (body) => { const tr = body.messages[body.messages.length - 1].content[0].content; const j = JSON.parse(tr); return text("In the last 30 days: " + j.n + " finished, morning " + j.rows.find((r) => r.key === "morning").count + ". Not enough to say you work best then."); },
];
upstream = [];
await ask("Tell me what you notice about my mornings");
const turn1 = [...upstream];
await ok("two upstream calls: question, then tool result", async () => { assert.equal(turn1.length, 2); });
await ok("the answer quotes numbers the page computed locally", async () => { const l = (await log()).join("\n"); assert.match(l, /bot: In the last 30 days: 29 finished, morning 21/); });
await ok("the first request has the context tag and only allowed tools, no system from the page", async () => {
  const m0 = turn1[0].messages[0]; assert.match(m0.content, /^\[\w+ \d{4}-\d{2}-\d{2} \d{2}:\d{2}; today's dose: normal\] Tell me what you notice/);
  assert.ok(turn1[0].tools.every((t) => !t.type) && turn1[0].tools.length >= 10);
  assert.equal(turn1[0].system[0].type, "text");
});
await ok("the second request is the first plus two messages, thinking block unchanged", async () => {
  const a = turn1[0].messages, b = turn1[1].messages;
  assert.equal(b.length, a.length + 2);
  assert.deepEqual(b.slice(0, a.length), a);
  assert.deepEqual(b[1].content[0], { type: "thinking", thinking: "", signature: "SIGT-tu_1" });
  assert.equal(b[2].content[0].type, "tool_result"); assert.equal(b[2].content[0].tool_use_id, "tu_1");
});

// 3. follow-up turn: whole earlier transcript is replayed verbatim
queue = [(body) => text("Mornings it is.")]; upstream = [];
await ask("And what about afternoons, any thoughts?");
await ok("the follow-up carries the whole earlier transcript byte for byte", async () => {
  const prev = turn1[1].messages, now = upstream[0].messages;
  assert.deepEqual(now.slice(0, prev.length), prev);
  assert.equal(now[prev.length].role, "assistant");
  assert.equal(now[prev.length + 1].role, "user");
});

// 4. a tool the page cannot run reports an error back instead of crashing
queue = [() => toolUse("set_progress", { subtask: "No Such Thing", percent: 50 }, "tu_9"), (b) => { const r = b.messages[b.messages.length - 1].content[0]; return text(r.is_error ? "That name is not on your board." : "unexpected"); }];
await ask("Please do something about progress on the nonexistent thing");
await ok("a failing tool becomes an error result, and the chat goes on", async () => { assert.match((await log()).slice(-1)[0], /That name is not on your board/); });

// 5. failure leaves no trace in the transcript
const r429 = () => ({ status: 429, headers: { "retry-after": "0" }, json: { type: "error", error: { type: "rate_limit_error", message: "x" } } });
queue = [r429, r429];   /* the SDK retries a 429 once */
await ask("Anything else about my week, please explain");
await ok("a rate limit shows a plain message", async () => { assert.match((await log()).slice(-1)[0], /Too many questions at once/); });
queue = [(body) => text("Back.")]; upstream = [];
await ask("Try again please, anything about my week");
console.log("DBG_LOG="+JSON.stringify((await log()).slice(-4)));
await ok("after a failed turn the next request has no orphan from the failed one", async () => {
  const m = upstream[0].messages; const users = m.filter((x) => x.role === "user" && typeof x.content === "string").map((x) => x.content);
  assert.equal(users.filter((u) => u.includes("Anything else about my week")).length, 0);
  assert.equal(users.filter((u) => u.includes("Try again please")).length, 1);
});

// 6. clearing starts a fresh transcript
await clear(); queue = [() => text("Fresh.")]; upstream = [];
await ask("Hello there, who are you really");
await ok("clear starts the transcript over", async () => { assert.equal(upstream[0].messages.length, 1); });

// 6b. a sentence the old guesser would have acted on goes to the model, and changes nothing
const before = await page.evaluate((KEY) => JSON.stringify(JSON.parse(localStorage.getItem(KEY)).subs), KEY);
queue = [() => text("What is getting in the way?")]; upstream = [];
await ask("I am stuck, what now?");
await ok("conversation is not read as a command: model asked, no subtask changed", async () => {
  assert.equal(upstream.length, 1);
  const after = await page.evaluate((KEY) => JSON.stringify(JSON.parse(localStorage.getItem(KEY)).subs), KEY);
  assert.equal(after, before);
});
queue = [() => text("Fine.")]; upstream = [];
await ask("I want to understand my week better");
await ok("'I want to understand my week better' does not add a task", async () => {
  assert.equal(upstream.length, 1);
  const n = await page.evaluate((KEY) => Object.keys(JSON.parse(localStorage.getItem(KEY)).subs).length, KEY);
  assert.equal(n, JSON.parse(before) ? Object.keys(JSON.parse(before)).length : -1);
});
// exact commands still act without the model
upstream = []; queue = [];
const first = await page.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return s.subs[s.groups[0].subs[0]].name; }, KEY);
await ask("set " + first + " to 45%");
await ok("an exact command still acts locally, no model call", async () => {
  assert.equal(upstream.length, 0);
  const pct = await page.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); return s.subs[s.groups[0].subs[0]].pct; }, KEY);
  assert.equal(pct, 45);
});

// 7. signed out: no call, a plain message
await page.evaluate((KEY) => localStorage.removeItem(KEY + ".account"), KEY);
await page.reload(); await page.waitForSelector(".row.pick");
upstream = []; queue = [];
await ask("Tell me something encouraging about my week");
await ok("signed out: no upstream call (the old local guesser still reads it)", async () => { assert.equal(upstream.length, 0); });
await clear();
await ask("Tell me what you notice about my mornings");
await ok("signed out and nothing for the local brain to do: says to sign in", async () => { assert.equal(upstream.length, 0); assert.match((await log()).join("\n"), /Sign in to talk to the tutor/); });

await ok("no page errors", async () => { assert.deepEqual(errs.filter((e) => !/Failed to load resource/.test(e)), []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await browser.close(); mock.close(); site.close(); process.exit(0);
