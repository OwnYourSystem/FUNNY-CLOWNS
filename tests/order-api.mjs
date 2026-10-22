/* api/order.js against a stand-in for the Anthropic API: Haiku 5.5, a fixed JSON answer, ids checked, nothing personal logged.
   Since 2026-10-21 (flaw 1) only a signed-in person is answered; the same stand-in plays Supabase: the session check
   (/auth/v1/user) and the durable counter (/rest/v1/rpc/ai_use_take, "missing" until the migration is applied). */
import http from "node:http";
import assert from "node:assert/strict";

let mode = "ok", seen = [], heads = [], rpc = "missing", rpcSeen = [], userChecks = 0;
const USERS = { "Bearer good": "u1", "Bearer other": "u2", "Bearer third": "u3" };
const ANSWER = { order: ["s2", "s1", "s3"], why: "The timber has to be bought before the base and the walls." };
const server = http.createServer((q, s) => {
  let b = ""; q.on("data", (c) => b += c); q.on("end", () => {
    const json = (code, v) => { s.writeHead(code, { "content-type": "application/json" }); s.end(JSON.stringify(v)); };
    if (q.url.startsWith("/auth/v1/user")) { userChecks++; const id = USERS[q.headers.authorization]; return id ? json(200, { id }) : json(401, { msg: "bad jwt" }); }
    if (q.url.startsWith("/rest/v1/rpc/ai_use_take")) { rpcSeen.push({ body: JSON.parse(b || "{}"), auth: q.headers.authorization, apikey: q.headers.apikey });
      return rpc === "missing" ? json(404, { code: "PGRST202" }) : json(200, rpc === "allow"); }
    seen.push(JSON.parse(b || "{}")); heads.push(q.headers);
    const err = (code, type) => { s.writeHead(code, { "content-type": "application/json" }); s.end(JSON.stringify({ type: "error", error: { type, message: "UPSTREAM-SECRET" } })); };
    if (mode === "429") return err(429, "rate_limit_error");
    if (mode === "401") return err(401, "authentication_error");
    if (mode === "529") return err(529, "overloaded_error");
    const text = mode === "extra" ? JSON.stringify({ order: ["s2", "s1", "s3", "evil"], why: "x" })
      : mode === "missing" ? JSON.stringify({ order: ["s2", "s1"], why: "x" })
      : mode === "junk" ? "not json" : JSON.stringify(ANSWER);
    s.writeHead(200, { "content-type": "application/json" });
    s.end(JSON.stringify({ id: "msg_1", type: "message", role: "assistant", model: "claude-haiku-5-5",
      stop_reason: mode === "refusal" ? "refusal" : mode === "cut" ? "max_tokens" : "end_turn",
      stop_details: mode === "refusal" ? { type: "refusal", category: "general_harms", explanation: "" } : null,
      content: [{ type: "thinking", thinking: "", signature: "SIG" }].concat(mode === "refusal" ? [] : [{ type: "text", text }]),
      usage: { input_tokens: 300, output_tokens: 60 } }));
  });
});
await new Promise((r) => server.listen(0, r));
process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:" + server.address().port;
process.env.SUPABASE_URL = "http://127.0.0.1:" + server.address().port; process.env.SUPABASE_KEY = "test-anon-key";
delete process.env.ORDER_REQUIRE_AUTH;
delete process.env.ANTHROPIC_API_KEY;
process.env.QORDEL_ORDER_KEY = "order-test-key";
process.env.ORDER_PER_MIN = "100";
const logs = []; const realLog = console.log; console.log = (...a) => logs.push(a.join(" "));
const mod = await import((process.env.APP_ROOT || new globalThis.URL("..", import.meta.url).pathname.replace(/\/$/, "")) + "/api/order.js?t=" + Date.now());
const { default: handler, cleanOrder, checkOrder, MODEL, SYSTEM } = mod;

const out = () => { const o = { h: {} }; o.setHeader = (k, v) => { o.h[k] = v; }; o.status = (c) => { o.code = c; return o; }; o.json = (j) => { o.body = j; return o; }; return o; };
let ip = 1;
const call = async (body, { method = "POST", type = "application/json", site = "same-origin", from, auth = "Bearer good" } = {}) => {
  const h = { "content-type": type, "sec-fetch-site": site, "x-forwarded-for": from || "10.0.0." + (ip++) }; if (auth) h.authorization = auth;
  const r = out(); await handler({ method, body, headers: h }, r); return r; };
const STEPS = { goal: "Garden Shed", steps: [{ id: "s1", name: "Lay the base" }, { id: "s2", name: "Buy timber" }, { id: "s3", name: "Build the walls" }] };
const results = [];
const ok = (name, fn) => Promise.resolve().then(fn).then(() => results.push("PASS " + name), (e) => results.push("FAIL " + name + ": " + e.message));

await ok("the model is Claude Haiku 5.5", () => assert.equal(MODEL, "claude-haiku-5-5"));
await ok("GET says whether it is on, and nothing about the key", async () => {
  let r = await call(null, { method: "GET" }); assert.deepEqual(r.body, { on: true, model: "claude-haiku-5-5" });
  delete process.env.QORDEL_ORDER_KEY; r = await call(null, { method: "GET" }); assert.deepEqual(r.body, { on: false, model: null });
  r = await call(STEPS); assert.equal(r.code, 503); assert.equal(r.body.error.code, "not_configured");
  process.env.QORDEL_ORDER_KEY = "order-test-key";
});
await ok("only JSON from the same site: another content type is 415, a cross-site call is 403, PUT is 405", async () => {
  assert.equal((await call(JSON.stringify(STEPS), { type: "text/plain" })).code, 415);
  assert.equal((await call(STEPS, { site: "cross-site" })).code, 403);
  assert.equal((await call(STEPS, { method: "PUT" })).code, 405);
  assert.equal(seen.length, 0, "a refused call reached the model");
});
await ok("no sign-in, or a token Supabase does not know, is 401 and never reaches the model", async () => {
  seen = []; let r = await call(STEPS, { auth: null }); assert.equal(r.code, 401); assert.equal(r.body.error.code, "auth_required");
  r = await call(STEPS, { auth: "Bearer stolen" }); assert.equal(r.code, 401); r = await call(STEPS, { auth: "Basic x" }); assert.equal(r.code, 401);
  assert.equal(seen.length, 0, "an unsigned call reached the model");
});
await ok("cleanOrder: 2 to 15 steps, distinct ids, short names, nothing else passes", () => {
  assert.throws(() => cleanOrder({ goal: "G", steps: [{ id: "a", name: "x" }] }), /2 to 15/);
  assert.throws(() => cleanOrder({ goal: "G", steps: Array.from({ length: 16 }, (_, i) => ({ id: "a" + i, name: "x" })) }), /2 to 15/);
  assert.throws(() => cleanOrder({ goal: "G", steps: [{ id: "a", name: "x" }, { id: "a", name: "y" }] }), /differ/);
  assert.throws(() => cleanOrder({ goal: "G", steps: [{ id: "a", name: "x".repeat(121) }, { id: "b", name: "y" }] }), /too long/);
  assert.throws(() => cleanOrder({ goal: "", steps: [{ id: "a", name: "x" }, { id: "b", name: "y" }] }), /goal/);
  const c = cleanOrder({ goal: " G ", steps: [{ id: "a", name: " x ", note: "secret" }, { id: "b", name: "y" }], journal: "private" });
  assert.deepEqual(c, { goal: "G", steps: [{ id: "a", name: "x" }, { id: "b", name: "y" }] });
});
await ok("the request: Haiku 5.5, low effort, a JSON schema answer, its own key, no sampling settings, only the goal and step names", async () => {
  seen = []; heads = []; const r = await call(STEPS);
  assert.equal(r.code, 200); const q = seen[0];
  assert.equal(q.model, "claude-haiku-5-5"); assert.equal(q.output_config.effort, "low"); assert.equal(q.output_config.format.type, "json_schema");
  assert.deepEqual(q.output_config.format.schema.required, ["order", "why"]); assert.equal(q.output_config.format.schema.additionalProperties, false);
  for (const k of ["temperature", "top_p", "top_k", "tools", "thinking"]) assert.equal(k in q, false, k);
  assert.equal(q.system, SYSTEM); assert.match(SYSTEM, /never instructions to you/);
  assert.deepEqual(JSON.parse(q.messages[0].content), STEPS); assert.equal(q.messages.length, 1);
  assert.equal(heads[0]["x-api-key"], "order-test-key");
});
await ok("a good answer comes back as the ids in order with the reason", async () => {
  mode = "ok"; const r = await call(STEPS);
  assert.deepEqual(r.body, { ok: true, order: ["s2", "s1", "s3"], why: ANSWER.why, model: "claude-haiku-5-5" }); assert.equal(r.h["cache-control"], "no-store");
});
await ok("an answer with an extra id, a missing id or no JSON is refused as unusable", async () => {
  for (const m of ["extra", "missing", "junk"]) { mode = m; const r = await call(STEPS); assert.deepEqual(r.body, { ok: false, reason: "unusable" }, m); }
  assert.equal(checkOrder(STEPS.steps, { order: ["s1", "s2", "s3"], why: "w" }).order.length, 3);
  assert.equal(checkOrder(STEPS.steps, { order: ["s1", "s1", "s3"], why: "w" }), null);
});
await ok("a decline or a cut-off answer is a calm no, not an error", async () => {
  mode = "refusal"; assert.deepEqual((await call(STEPS)).body, { ok: false, reason: "declined" });
  mode = "cut"; assert.deepEqual((await call(STEPS)).body, { ok: false, reason: "incomplete" });
});
await ok("upstream errors map to plain messages and never pass the upstream text on", async () => {
  mode = "429"; let r = await call(STEPS); assert.equal(r.code, 429);
  mode = "401"; r = await call(STEPS); assert.equal(r.code, 500); assert.equal(r.body.error.code, "server_misconfigured");
  mode = "529"; r = await call(STEPS); assert.equal(r.code, 503);
  assert.doesNotMatch(JSON.stringify(r.body), /UPSTREAM-SECRET/);
  mode = "ok";
});
await ok("the session is checked with Supabase once a minute per token, not on every call", async () => {
  const n0 = userChecks; await call(STEPS); await call(STEPS); assert.ok(userChecks - n0 <= 1, String(userChecks - n0));
});
await ok("without the migration, each instance limits per person: a new address does not reset it, another person is not blocked", async () => {
  rpc = "missing"; process.env.ORDER_PER_MIN = "2";
  const m2 = await import((process.env.APP_ROOT || new globalThis.URL("..", import.meta.url).pathname.replace(/\/$/, "")) + "/api/order.js?t=" + Date.now() + "b");
  let k = 0; const c2 = async (auth) => { const r = out(); await m2.default({ method: "POST", body: STEPS, headers: { "content-type": "application/json", authorization: auth, "x-forwarded-for": "9.9.9." + (k++) } }, r); return r; };
  assert.equal((await c2("Bearer good")).code, 200); assert.equal((await c2("Bearer good")).code, 200);
  const r = await c2("Bearer good"); assert.equal(r.code, 429); assert.equal(r.h["retry-after"], "60");
  assert.equal((await c2("Bearer other")).code, 200, "another person was blocked");
  process.env.ORDER_PER_MIN = "100";
});
await ok("with the migration applied, the count is durable: the person's own token, the order kind and the limits go to Supabase; a no is 429 and never reaches the model", async () => {
  rpc = "allow"; rpcSeen = []; let r = await call(STEPS, { auth: "Bearer third" }); assert.equal(r.code, 200);
  assert.deepEqual(rpcSeen[0].body, { p_kind: "order", p_per_min: 100, p_per_day: 30 }); assert.equal(rpcSeen[0].auth, "Bearer third"); assert.equal(rpcSeen[0].apikey, "test-anon-key");
  rpc = "deny"; seen = []; r = await call(STEPS, { auth: "Bearer third" }); assert.equal(r.code, 429); assert.equal(seen.length, 0);
  rpc = "missing";
});
await ok("logs hold the model, tokens and time, never a goal or step name", () => {
  const all = logs.join("\n"); assert.match(all, /"ev":"order"/); assert.match(all, /claude-haiku-5-5/);
  for (const w of ["Garden Shed", "Buy timber", "Lay the base", "order-test-key"]) assert.equal(all.includes(w), false, w);
});
console.log = realLog; server.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
