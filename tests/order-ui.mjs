/* The phone side of "AI proposes an order" (2026-10-20): consent once, only the goal and step names sent, a suggestion to use or keep, Undo, and a switch on You.
   Since 2026-10-21 (flaw 1) it needs a signed-in person: signed out, it asks to sign in and sends nothing; signed in, it sends the session token. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
/* the stand-in for api/order: what the page sent, and what to answer */
let sent = [], reply = { status: 200, body: { ok: true, order: ["gS2", "gS1", "gS3"], why: "Timber first, because the base needs it." } }, hold = null;
/* a signed-in board talks to Supabase; a stand-in answers so nothing leaves the test */
await p.route(/supabase\.co\//, (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
await p.route("**/api/order", async (r) => { sent.push({ body: JSON.parse(r.request().postData() || "{}"), type: r.request().headers()["content-type"], auth: r.request().headers()["authorization"] });
  if (hold) await hold; await r.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.body) }); });
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.groups = []; s.subs = {}; s.oftad = []; s.plan = []; s.done = []; s.me.guided = true;
  const g = (id, name, steps) => { s.groups.push({ id, name, subs: steps.map((n, i) => id + i), prio: "mid", where: "any", due: "", tags: [] });
    steps.forEach((n, i) => { s.subs[id + i] = { id: id + i, gid: id, name: n, pct: n.startsWith("DONE") ? 100 : 0, status: n.startsWith("DONE") ? "done" : "todo", tag: "", upd: "2026-10-20", note: "PRIVATE-NOTE" }; }); };
  g("gS", "Shed", ["DONE clear the ground", "Lay the base", "Buy timber", "Build the walls"]); g("gO", "One", ["Only step"]);
  localStorage.setItem(KEY + ".journal", JSON.stringify({ v: 1, log: [{ id: "j1", at: new Date().toISOString(), d: "2026-10-20", tm: "08:00", kind: "start", a: "JOURNAL-SECRET", b: "" }] }));
  localStorage.setItem(KEY, JSON.stringify(s)); location.hash = "#/goal/gS"; }, KEY);
await p.reload(); await p.waitForSelector("[data-ph=step]");
const D = () => p.locator("dialog.ask[open]");
const btn = () => p.locator("[data-ph=aiorder]");
const subs = async () => (await st()).groups.find((g) => g.id === "gS").subs;
const toastText = () => p.evaluate(() => document.body.innerText);

await ok("signed out: Suggest an order asks to sign in first, and sends nothing", async () => {
  await btn().click(); await D().waitFor(); const t = await D().innerText();
  assert.match(t, /Sign in to get suggestions/); assert.match(t, /Your board stays on this device/);
  await D().getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(300); assert.equal(sent.length, 0);
});
/* sign in for the rest */
await p.evaluate((KEY) => localStorage.setItem(KEY + ".account", JSON.stringify({ access_token: "session-tok", refresh_token: "", at: Date.now(), email: "t@t", uid: "u1" })), KEY);
await p.reload(); await p.waitForSelector("[data-ph=step]");

await ok("a goal with 2 or more open steps offers Suggest an order, 44px or more; a goal with one does not", async () => {
  assert.equal(await btn().isVisible(), true); assert.ok((await btn().boundingBox()).height >= 44);
  await p.evaluate(() => { location.hash = "#/goal/gO"; }); await p.waitForTimeout(250); assert.equal(await btn().count(), 0);
  await p.evaluate(() => { location.hash = "#/goal/gS"; }); await p.waitForTimeout(250);
});
await ok("the first time it asks for consent, says what leaves the phone, and Not now sends nothing", async () => {
  await btn().click(); await D().waitFor(); const t = await D().innerText();
  assert.match(t, /Anthropic/); assert.match(t, /goal.s name and its open step names/); assert.match(t, /not your journal, check-ins, photo or account/);
  await D().getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(300);
  assert.equal(sent.length, 0); assert.equal((await st()).me.aiOrderOk, undefined);
});
await ok("Send: only the goal name and the open steps' ids and names leave the phone, as JSON, with the session token", async () => {
  await btn().click(); await D().waitFor(); await D().getByRole("button", { name: "Send" }).click();
  await D().waitFor(); assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].body, { goal: "Shed", steps: [{ id: "gS1", name: "Lay the base" }, { id: "gS2", name: "Buy timber" }, { id: "gS3", name: "Build the walls" }] });
  assert.equal(sent[0].type, "application/json"); assert.equal(sent[0].auth, "Bearer session-tok");
  for (const w of ["PRIVATE-NOTE", "JOURNAL-SECRET", "DONE clear"]) assert.equal(JSON.stringify(sent[0]).includes(w), false, w);
  assert.ok((await st()).me.aiOrderOk, "consent was not kept");
});
await ok("the suggestion is labelled AI, lists the steps in its order with the reason, and Keep mine changes nothing", async () => {
  const t = await D().innerText();
  assert.match(t, /Suggested by AI/); assert.match(t, /1\. Buy timber\s+2\. Lay the base\s+3\. Build the walls/); assert.match(t, /Timber first/); assert.match(t, /check it before you use it/);
  await D().getByRole("button", { name: "Keep mine" }).click(); await p.waitForTimeout(250);
  assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]);
});
await ok("Use this order: the open steps take the new order, a finished step keeps its place, and Undo takes it back", async () => {
  await btn().click(); await D().waitFor(); assert.equal(sent.length, 2, "it asked for consent again");
  await D().getByRole("button", { name: "Use this order" }).click(); await p.waitForTimeout(300);
  assert.deepEqual(await subs(), ["gS0", "gS2", "gS1", "gS3"]);
  assert.match(await p.locator("#ph-undo-t").innerText(), /New order for Shed/);
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300); assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]);
});
await ok("while it waits, the button says Asking and cannot be pressed twice", async () => {
  let open; hold = new Promise((r) => { open = r; });
  await btn().click(); await p.waitForTimeout(200);
  assert.equal(await btn().innerText(), "Asking…"); assert.equal(await btn().isDisabled(), true); assert.equal(await btn().getAttribute("aria-busy"), "true");
  open(); hold = null; await D().waitFor(); await D().getByRole("button", { name: "Keep mine" }).click(); await p.waitForTimeout(200);
  assert.equal(await btn().innerText(), "Suggest an order");
});
await ok("the same order, a decline, not switched on, and no connection each say so calmly and change nothing", async () => {
  reply = { status: 200, body: { ok: true, order: ["gS1", "gS2", "gS3"], why: "w" } }; await btn().click(); await p.waitForTimeout(400);
  assert.match(await toastText(), /the same order you have/); assert.equal(await D().count(), 0);
  reply = { status: 200, body: { ok: false, reason: "declined" } }; await btn().click(); await p.waitForTimeout(400); assert.match(await toastText(), /No suggestion this time/);
  reply = { status: 503, body: { error: { code: "not_configured", message: "x" } } }; await btn().click(); await p.waitForTimeout(400); assert.match(await toastText(), /not switched on yet/);
  await p.unroute("**/api/order"); await p.route("**/api/order", (r) => r.abort()); await btn().click(); await p.waitForTimeout(500);
  assert.match(await toastText(), /No answer right now/); assert.deepEqual(await subs(), ["gS0", "gS1", "gS2", "gS3"]);
});
await ok("You has an Order suggestions by AI switch; off withdraws the consent, and the next use asks again", async () => {
  await p.evaluate(() => { location.hash = "#/you"; }); await p.waitForTimeout(300);
  const sw = p.locator("[data-ph=aiok]"); assert.equal(await sw.getAttribute("role"), "switch"); assert.equal(await sw.getAttribute("aria-checked"), "true");
  await sw.click(); await p.waitForTimeout(250); assert.equal(await p.locator("[data-ph=aiok]").getAttribute("aria-checked"), "false"); assert.equal((await st()).me.aiOrderOk, undefined);
  await p.locator("[data-ph=aiok]").click(); await D().waitFor(); assert.match(await D().innerText(), /Anthropic/); await D().getByRole("button", { name: "Send" }).click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=aiok]").getAttribute("aria-checked"), "true");
});
await ok("no sideways scroll, no page errors", async () => {
  await p.evaluate(() => { location.hash = "#/goal/gS"; }); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.deepEqual(errs, []);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
