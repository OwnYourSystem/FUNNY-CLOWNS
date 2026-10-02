import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = process.env.BOARD_ROOT || path.join(HERE, "..");
const NOTES = process.env.NOTES_DIR || path.join(ROOT, "notes");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const m = html.match(/\/\* EVIDENCE:BEGIN \*\/([\s\S]*?)\/\* EVIDENCE:END \*\//);
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
await ok("the library block is present and parses", () => { assert.ok(m); });
const ctx = {}; vm.createContext(ctx); vm.runInContext(m[1], ctx);
const LIB = JSON.parse(JSON.stringify(ctx.EVIDENCE));
const norm = (t) => t.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\s+/g, " ");

await ok("every entry has the required fields and a unique id", () => {
  const ids = new Set();
  for (const e of LIB) {
    for (const k of ["id", "status", "tags", "claim", "strength", "from", "source", "quote", "limits", "tryit"]) assert.ok(e[k] !== undefined, e.id + " lacks " + k);
    assert.match(e.id, /^E-[A-Z0-9]+-\d\d$/); assert.ok(!ids.has(e.id), "duplicate " + e.id); ids.add(e.id);
    assert.ok(Array.isArray(e.tags) && e.tags.length >= 4, e.id + " tags");
    assert.ok(e.tryit.do && e.tryit.days > 0 && ["completions", "finished", "skips", "takes", "progress_moves"].includes(e.tryit.measure), e.id + " tryit");
    assert.ok(e.claim.length < 260 && e.limits.length > 10, e.id + " lengths");
  }
});
await ok("only practitioner and checked entries are in the file; nothing unverified ships", () => { for (const e of LIB) assert.ok(["practitioner", "checked"].includes(e.status), e.id + " is " + e.status); });
await ok("no tag is a word the search ignores or too short to match", () => {
  const stop = /^(?:the|and|for|why|how|what|does|did|that|this|with|about|when|you|are|was|have|has|can|should|not|but|say|says|tell|give|any|from|they|them|get|make|more|less|much|just|into|out|off|over|than|then|there|here|been|will|would|could)$/;
  for (const e of LIB) for (const t of e.tags) assert.ok(t.length > 2 && !stop.test(t), e.id + ": dead tag " + t);
});
await ok("no em dash in anything the person reads", () => { for (const e of LIB) assert.ok(!/—/.test(e.claim + e.limits + e.tryit.do), e.id); });
await ok("every practitioner quote is word for word in the saved note it names", () => {
  for (const e of LIB.filter((x) => x.status === "practitioner")) {
    assert.equal(e.source.kind, "notes");
    const t = norm(fs.readFileSync(path.join(NOTES, e.source.file), "utf8"));
    assert.ok(t.includes(e.quote), e.id + ": quote not found in " + e.source.file);
    assert.equal(e.strength, "practitioner opinion");
  }
});
await ok("a checked entry must carry its abstract, doi, who and when, and its numbers must be in the abstract", () => {
  for (const e of LIB.filter((x) => x.status === "checked")) {
    for (const k of ["abstract", "doi", "checkedBy", "checkedOn"]) assert.ok(e[k], e.id + " lacks " + k);
    assert.ok(norm(e.abstract).includes(norm(e.quote)), e.id + ": quote not in abstract");
    for (const n of (e.claim.match(/\d+(?:\.\d+)?/g) || [])) assert.ok(e.abstract.includes(n), e.id + ": number " + n + " not in abstract");
  }
});

// ---- in the page: retrieval, the offline answers, and the reply check
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + path.join(ROOT, "index.html")); await p.waitForSelector(".row.pick");
const ev = (fn, a) => p.evaluate(fn, a);

await ok("the page's library is the file's library", async () => { assert.deepEqual(await ev(() => window.__board.evidence()), LIB); });
await ok("retrieval finds the right entry by tag", async () => {
  const id = async (q) => (await ev((q) => window.__board.lib(q, 3).map((e) => e.id), q));
  assert.equal((await id("I keep procrastinating, motivation is low"))[0].startsWith("E-"), true);
  assert.ok((await id("burnout and no rest")).includes("E-CYCLE-01"));
  assert.ok((await id("exercise and sleep")).includes("E-BODY-01"));
  assert.ok((await id("guilt about a bad day")).includes("E-GUILT-01"));
  assert.deepEqual(await id("quantum gravity of black holes"), []);
  assert.deepEqual(await id(""), []);
});
await ok("every entry is findable by each of its own tags", async () => {
  for (const e of LIB) { const hit = await ev(([t]) => window.__board.lib(t, 5).map((x) => x.id), [e.tags[0]]); assert.ok(hit.includes(e.id), e.id + " not found by " + e.tags[0]); }
});
const say = (q) => ev((q) => window.__board.brain(q), q);
const asks = ["what does the evidence say about motivation", "is there research on burnout", "what should i try", "what does the science say about guilt", "any evidence for exercise", "what does the evidence say about quantum gravity"];
await ok("offline answers lead with what the source is, cite an id, and pass the checker", async () => {
  for (const q of asks.slice(0, 5)) {
    const a = await say(q);
    assert.match(a, /^From the library, practitioner opinion and not a trial/, q);
    assert.match(a, /\[E-[A-Z0-9]+-\d\d\]/, q);
    const c = await ev((a) => window.__board.check(a, { history: true, src: a }), a); assert.ok(c.ok, q + " -> " + c.why);
  }
});
await ok("a topic the library lacks gets a plain no, not a guess", async () => { assert.match(await say(asks[5]), /^The library has nothing on that/); });

const chk = (text, src, history) => ev(([t, s, h]) => window.__board.check(t, { src: s, history: h }), [text, src, history]);
await ok("checker: a valid citation passes", async () => { assert.equal((await chk("Try the smallest version [E-FLOOR-01].", "", false)).ok, true); });
await ok("checker: an id that is not in the library fails", async () => { const c = await chk("See [E-NOPE-99].", "", false); assert.equal(c.ok, false); assert.match(c.why, /not in the library/); });
await ok("checker: 'studies show' with no citation fails; with one it passes", async () => {
  assert.equal((await chk("Studies show mornings are best.", "", false)).ok, false);
  assert.equal((await chk("Research suggests small starts help [E-START-01].", "", false)).ok, true);
});
await ok("checker: a clinical word fails", async () => { for (const w of ["That sounds like depression.", "You may have ADHD.", "I would diagnose burnout.", "Ask about medication."]) assert.equal((await chk(w, "", false)).ok, false, w); });
await ok("checker: a number no tool returned fails, once history was used", async () => {
  assert.equal((await chk("You skipped 9 times.", '{"n":5}', true)).ok, false);
  assert.equal((await chk("You skipped 5 times.", '{"n":5}', true)).ok, true);
  assert.equal((await chk("Morning was 72% of them.", '{"share":0.72}', true)).ok, true);
  assert.equal((await chk("About 9 items.", '{"n":5}', false)).ok, true, "numbers are not policed when no history tool ran");
});
await ok("checker: ids in tags are not mistaken for numbers", async () => { assert.equal((await chk("Try this [E-FLOOR-01] for 7 days.", '{"days":7}', true)).ok, true); });
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
