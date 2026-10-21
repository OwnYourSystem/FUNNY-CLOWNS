/* Flaw 13 (2026-10-21): up to seed revision 6 every new board got the owner's own goals. A new board now starts
   empty, the names are gone from the app, and a board that holds the old seed loses it once, except the owner's
   signed-in board. The board below uses the old ids with made-up names, so the owner's goals are not copied here. */
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", OWNER = "5b461774-5e32-4ea1-ab09-9760fb3429c8";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const ROOT = process.env.APP_ROOT || "/home/user/FUNNY-CLOWNS";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const errs = [];

const day = new Date().toISOString().slice(0, 10);
const sub = (id, gid, name, pct = 0) => ({ id, name, pct, status: pct ? "doing" : "todo", tag: "", upd: day, gid });
const goal = (id, name, subs) => ({ id, name, subs, due: "", prio: "mid", tags: [] });
function oldBoard() {
  return {
    v: 2, seedRev: 6, day, sel: "vgd", ue: { "bk1|name": 1 }, killed: [], tagFilter: [], dayLog: [], log: [], hist: [], oftad: [], done: [],
    groups: [goal("vgd", "Old goal A", ["vg1", "vg2"]), goal("shr", "Old goal B", ["sh1"]), goal("bks", "Old goal C", ["bk1", "bk2"]),
      goal("apd", "Old goal D", ["ap1", "sOwn123"]), goal("gMine12", "My own goal", ["sMine12"])],
    subs: { vg1: sub("vg1", "vgd", "Old step 1", 40), vg2: sub("vg2", "vgd", "Old step 2"), sh1: sub("sh1", "shr", "Old step 3"),
      bk1: sub("bk1", "bks", "A step I renamed"), bk2: sub("bk2", "bks", "Old step 4"), ap1: sub("ap1", "apd", "Old step 5"),
      sOwn123: sub("sOwn123", "apd", "My step under an old goal"), sMine12: sub("sMine12", "gMine12", "My own step"),
      oy1: sub("oy1", "oys", "Old archived step"), tc9: sub("tc9", "tcs", "Old parked step") },
    archive: [Object.assign(goal("oys", "Old archived goal", ["oy1"]), { archivedAt: day })],
    backlog: [{ t: "Old parked goal", d: day, goal: goal("tcs", "Old parked goal", ["tc9"]) }],
    plan: [{ k: "sub", id: "vg1", done: false }, { k: "sub", id: "sMine12", done: false }],
    mem: [{ id: "m1", t: "I often skip a step.", src: "board", st: "kept", key: "skip-vg2", d: day, seen: day },
      { id: "m2", t: "I often skip my own step.", src: "board", st: "kept", key: "skip-sMine12", d: day, seen: day }],
    memNo: { "skip-sh1": day, "skip-sMine12": day },
    syncedAt: Date.now() - 60000, savedAt: Date.now() - 60000,
    me: { done: true, days: [1, 2, 3, 4, 5], work: ["08:00", "16:30"], rise: "07:00", wind: "22:30", north: "", brief: "07:30", icon: "" }
  };
}
/* opens the app with a stored board; the account service is never reached */
async function open(board, account, backup) {
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  await ctx.addInitScript(([KEY, board, account, backup]) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    if (board) localStorage.setItem(KEY, JSON.stringify(board));
    if (account) localStorage.setItem(KEY + ".account", JSON.stringify(account));
    if (backup) localStorage.setItem(KEY + ".before-sync", JSON.stringify(backup));
  }, [KEY, board, account, backup]);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1500);
  const read = (k) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), k);
  return { ctx, p, st: () => read(KEY), backup: () => read(KEY + ".before-sync") };
}
const acct = (uid) => ({ uid, email: "someone@example.com", access_token: "x", refresh_token: "y", at: Date.now() });

await ok("the built app holds none of the old seed: the list is empty and no old id is shipped as a goal", () => {
  for (const f of ["index.html", "source/delivery-board.html"]) {
    const h = fs.readFileSync(ROOT + "/" + f, "utf8");
    assert.match(h, /var SEED=\[\];/, f); assert.match(h, /var SEED_REV = 7;/, f);
    assert.doesNotMatch(h, /\{id:"(vgd|vg1|shr|sh1|bks|bk1|apd|ap1)",name:/, f);
  }
});
await ok("a new board starts empty", async () => {
  const o = await open(null); try { const s = await o.st(); assert.deepEqual(s.groups, []); assert.deepEqual(s.subs, {}); assert.equal(s.seedRev, 7); }
  finally { await o.ctx.close(); }
});
await ok("a signed-out board loses the old seed, keeps everything of the person's own, and says it is done", async () => {
  const o = await open(oldBoard()); try {
    const s = await o.st();
    assert.deepEqual(Object.keys(s.subs).sort(), ["bk1", "sMine12", "sOwn123"]);
    assert.deepEqual(s.groups.map((g) => g.id + ":" + g.name), ["bks:My goal", "apd:My goal", "gMine12:My own goal"]);
    assert.deepEqual(s.groups[0].subs, ["bk1"], "a renamed step stays, the old one beside it goes");
    assert.deepEqual(s.groups[1].subs, ["sOwn123"], "the person's step keeps its goal, under a plain name");
    assert.deepEqual(s.archive, []); assert.deepEqual(s.backlog, []);
    assert.deepEqual(s.plan.map((c) => c.id), ["sMine12"]);
    assert.deepEqual(s.mem.map((m) => m.key), ["skip-sMine12"]); assert.deepEqual(Object.keys(s.memNo), ["skip-sMine12"]);
    assert.notEqual(s.sel, "vgd"); assert.equal(s.unseeded, 1); assert.equal(s.syncedAt, 0, "a later sign-in must weigh both copies");
    assert.doesNotMatch(await o.p.locator("body").innerText(), /Old goal A|Old step 1/);
  } finally { await o.ctx.close(); }
});
await ok("the copy kept for Restore loses the old seed too", async () => {
  const o = await open(oldBoard(), null, oldBoard()); try {
    const k = await o.backup(); assert.deepEqual(Object.keys(k.subs).sort(), ["bk1", "sMine12", "sOwn123"]); assert.equal(k.unseeded, 1);
  } finally { await o.ctx.close(); }
});
await ok("it runs once: a second load changes nothing", async () => {
  const o = await open(oldBoard()); try {
    const a = await o.st(); await o.p.reload(); await o.p.waitForTimeout(1200); const c = await o.st();
    assert.deepEqual(Object.keys(c.subs).sort(), Object.keys(a.subs).sort()); assert.deepEqual(c.groups.map((g) => g.id), a.groups.map((g) => g.id));
  } finally { await o.ctx.close(); }
});
await ok("the owner's own signed-in board keeps every goal, step, note and the Restore copy", async () => {
  const o = await open(oldBoard(), acct(OWNER), oldBoard()); try {
    const s = await o.st();
    assert.equal(s.unseeded, undefined); assert.equal(Object.keys(s.subs).length, 10);
    assert.deepEqual(s.groups.map((g) => g.id), ["vgd", "shr", "bks", "apd", "gMine12"]); assert.equal(s.groups[0].name, "Old goal A");
    assert.equal(s.archive.length, 1); assert.equal(s.backlog.length, 1); assert.equal(s.mem.length, 2);
    assert.equal((await o.backup()).groups.length, 5);
  } finally { await o.ctx.close(); }
});
await ok("any other signed-in account loses the old seed", async () => {
  const o = await open(oldBoard(), acct("00000000-0000-4000-8000-000000000000")); try {
    assert.deepEqual(Object.keys((await o.st()).subs).sort(), ["bk1", "sMine12", "sOwn123"]);
  } finally { await o.ctx.close(); }
});
await ok("no page errors", () => assert.deepEqual(errs, []));
await b.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
