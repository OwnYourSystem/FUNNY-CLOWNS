/* The backup carries the journal, the weekly check-ins and the photo (owner, 2026-10-19), and a restore only adds back what is missing. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", JK = KEY + ".journal", WK = KEY + ".week", PK = KEY + ".photo";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");
const get = (k) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), k);
const day = (n) => { const d = new Date(Date.now() - n * 864e5), q = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); };
const J = [{ id: "j1", at: new Date(Date.now() - 2 * 864e5).toISOString(), d: day(2), tm: "21:10", kind: "end", a: "Called the yard", b: "Book the delivery" },
           { id: "j2", at: new Date(Date.now() - 864e5).toISOString(), d: day(1), tm: "07:40", kind: "start", a: "Rested", b: "The shed floor" }];
const W = [{ k: "2026-W41", d: "2026-10-08", e: 3, m: 4, c: 2, f: 3, w: 5, n: 4 }, { k: "2026-W42", d: "2026-10-15", e: 4, m: 4, c: 3, f: 4, w: 4, n: 6 }];
const PH = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = c.height = 8; return c.toDataURL("image/jpeg"); });
await p.evaluate(([JK, WK, PK, J, W, PH]) => { localStorage.setItem(JK, JSON.stringify({ v: 1, log: J })); localStorage.setItem(WK, JSON.stringify({ v: 1, log: W })); localStorage.setItem(PK, JSON.stringify({ src: PH, show: true })); }, [JK, WK, PK, J, W, PH]);
await p.reload(); await p.waitForSelector(".row.pick");
const openBackup = async () => { await p.locator("#btn-backup").click(); await p.locator("#backup[open]").waitFor(); };
const dump = async () => { await p.locator("#io-dump").click(); return p.locator("#io").inputValue(); };
const load = async (text) => { await p.locator("#io").fill(text); await Promise.all([p.waitForEvent("load"), p.locator("#io-load").click()]); await p.waitForSelector(".row.pick"); };
let full = "";

await ok("with the switch on (the default), the backup carries the journal, the check-ins and the photo; the board's state never does", async () => {
  await openBackup(); assert.equal(await p.locator("#io-private").isChecked(), true);
  full = await dump(); const o = JSON.parse(full);
  assert.deepEqual(o.private.journal.map((e) => e.id), ["j1", "j2"]); assert.deepEqual(o.private.week.map((e) => e.k), ["2026-W41", "2026-W42"]); assert.equal(o.private.photo.src, PH);
  assert.equal("private" in (await get(KEY)), false);
  assert.match(await p.locator("#backup").innerText(), /holds your private notes/);
});
await ok("with the switch off, none of them is in the backup", async () => {
  await p.locator("#io-private").uncheck(); const o = JSON.parse(await dump()); assert.equal("private" in o, false); await p.locator("#io-private").check();
});
await ok("Save as file names it qordel-backup-<date>.json and it carries the private parts", async () => {
  const [dl] = await Promise.all([p.waitForEvent("download"), p.locator("#io-save").click()]);
  assert.match(dl.suggestedFilename(), /^qordel-backup-\d{4}-\d\d-\d\d\.json$/);
  const fs = await import("node:fs"); const o = JSON.parse(fs.readFileSync(await dl.path(), "utf8")); assert.equal(o.private.journal.length, 2);
});
await ok("a phone that lost them gets them all back from the file", async () => {
  await p.keyboard.press("Escape");
  await p.evaluate(([JK, WK, PK]) => { localStorage.removeItem(JK); localStorage.removeItem(WK); localStorage.removeItem(PK); }, [JK, WK, PK]);
  await p.reload(); await p.waitForSelector(".row.pick"); await openBackup(); await load(full);
  assert.deepEqual((await get(JK)).log.map((e) => e.id), ["j1", "j2"]); assert.deepEqual((await get(WK)).log.map((e) => e.k), ["2026-W41", "2026-W42"]);
  assert.equal((await get(PK)).src, PH); assert.equal("private" in (await get(KEY)), false, "the private parts landed in the board's state");
});
await ok("loading again adds only what is missing: nothing doubles, newer entries on the phone stay, the phone's own photo stays", async () => {
  const other = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = c.height = 4; const x = c.getContext("2d"); x.fillStyle = "#f00"; x.fillRect(0, 0, 4, 4); return c.toDataURL("image/jpeg"); });
  await p.evaluate(([JK, PK, other, d]) => { const j = JSON.parse(localStorage.getItem(JK)); j.log.push({ id: "j3", at: new Date().toISOString(), d, tm: "08:00", kind: "start", a: "New on this phone", b: "" }); localStorage.setItem(JK, JSON.stringify(j)); localStorage.setItem(PK, JSON.stringify({ src: other, show: true })); }, [JK, PK, other, day(0)]);
  await p.reload(); await p.waitForSelector(".row.pick"); await openBackup(); await load(full);
  assert.deepEqual((await get(JK)).log.map((e) => e.id), ["j1", "j2", "j3"]); assert.equal((await get(WK)).log.length, 2); assert.equal((await get(PK)).src, other);
});
await ok("a tampered file: anything that is not what this app writes is dropped, the rest comes back", async () => {
  const o = JSON.parse(full);
  o.private.journal.push({ id: "bad1", at: "yesterday", d: "x", tm: "9", kind: "rant", a: "<img src=x onerror=alert(1)>", b: "" });
  o.private.journal.push({ id: "j9", at: new Date().toISOString(), d: day(0), tm: "09:00", kind: "end", a: "A good one", b: "" });
  o.private.week.push({ k: "2026-W43", d: "2026-10-22", e: 9, m: 4, c: 2, f: 3, w: 5 });
  o.private.photo = { src: "data:text/html;base64,PHNjcmlwdD4=", show: true };
  await p.evaluate(([JK, WK, PK]) => { localStorage.removeItem(JK); localStorage.removeItem(WK); localStorage.removeItem(PK); }, [JK, WK, PK]);
  await p.reload(); await p.waitForSelector(".row.pick"); await openBackup(); await load(JSON.stringify(o));
  const j = (await get(JK)).log.map((e) => e.id); assert.ok(j.includes("j9") && !j.includes("bad1"), JSON.stringify(j));
  assert.deepEqual((await get(WK)).log.map((e) => e.k), ["2026-W41", "2026-W42"]); assert.equal(await get(PK), null);
});
await ok("an old backup without the private parts still loads and leaves them alone", async () => {
  const o = JSON.parse(full); delete o.private; const before = (await get(JK)).log.length;
  await openBackup(); await load(JSON.stringify(o)); assert.equal((await get(JK)).log.length, before);
});
await ok("on the phone, Backup opens from You and the switch is 44px or more", async () => {
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await c2.newPage();
  await q.goto(URL); await q.waitForSelector(".ph-onb"); await q.locator("[data-ph=onb-next]").click(); await q.waitForTimeout(250);
  await q.fill("#ph-goal", "Garden Shed"); await q.locator("[data-ph=onb-done]").click(); await q.waitForTimeout(400);
  await q.evaluate(() => { location.hash = "#/you"; }); await q.waitForTimeout(300); await q.locator("[data-ph=backup]").click(); await q.locator("#backup[open]").waitFor();
  assert.ok((await q.locator(".io-priv").boundingBox()).height >= 44); await c2.close();
});
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
