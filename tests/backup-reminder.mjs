/* A monthly reminder on Now to save a backup (owner, 2026-10-19: "do the monthly reminder"). */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", LAST = KEY + ".lastBackup", LATER = KEY + ".backupLater", D = 864e5;
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250);
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click();
await p.waitForFunction((KEY) => { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.me && s.me.done; }, KEY);
const card = () => p.locator(".ph-bk");
const reload = async () => { await p.reload(); await p.waitForSelector("#ph-main [aria-label='Do this now']"); };
const ls = (k, v) => p.evaluate(([k, v]) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [k, v]);
const ago = (n) => new Date(Date.now() - n * D).toISOString();
const seedDone = (days) => p.evaluate(([KEY, t]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.ev = (s.ev || []).concat([{ k: "done", t, id: "old1" }]); localStorage.setItem(KEY, JSON.stringify(s)); }, [KEY, Date.now() - days * D]);

await ok("a new user sees no reminder: nothing to lose yet and under 7 days of use", async () => {
  await reload(); assert.equal(await card().count(), 0);
});
await ok("10 days of use with a finished step and no backup: the card shows, with buttons of 44px or more", async () => {
  await seedDone(10); await reload();
  assert.equal(await card().isVisible(), true); assert.match(await card().innerText(), /You have not saved a backup yet/);
  for (const k of ["bknow", "bklater"]) assert.ok((await p.locator(`[data-ph=${k}]`).boundingBox()).height >= 44, k);
});
await ok("Later hides it for 7 days; after 8 days it comes back", async () => {
  await p.locator("[data-ph=bklater]").click(); await p.waitForTimeout(250); assert.equal(await card().count(), 0);
  await reload(); assert.equal(await card().count(), 0, "Later did not last");
  await ls(LATER, ago(8)); await reload(); assert.equal(await card().isVisible(), true, "the card did not come back after 8 days");
});
await ok("Back up now opens Backup with Save as file in focus; saving the file stamps the date and the card goes", async () => {
  await p.locator("[data-ph=bknow]").click(); await p.locator("#backup[open]").waitFor();
  assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.id), "io-save");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.locator("#io-save").click()]);
  assert.match(dl.suggestedFilename(), /^qordel-backup-/);
  const last = await p.evaluate((k) => localStorage.getItem(k), LAST); assert.ok(Date.now() - Date.parse(last) < 60e3, "no date was saved");
  assert.equal(await p.evaluate((k) => localStorage.getItem(k), LATER), null, "Later was not cleared");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300); assert.equal(await card().count(), 0, "the card stayed after the backup");
});
await ok("a backup 31 days old brings the card back and says how old it is; 29 days does not", async () => {
  await ls(LAST, ago(29)); await reload(); assert.equal(await card().count(), 0);
  await ls(LAST, ago(31)); await reload(); assert.match(await card().innerText(), /Your last backup was 31 days ago/);
});
await ok("a journal entry alone counts as something to lose", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.ev = s.ev.filter((e) => e.k !== "done"); localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await ls(LAST, null); await reload(); assert.equal(await card().count(), 0, "a card with nothing to lose");
  await ls(KEY + ".journal", JSON.stringify({ v: 1, log: [{ id: "j1", at: ago(12), d: "2026-10-07", tm: "21:00", kind: "end", a: "Called the yard", b: "" }] }));
  await reload(); assert.equal(await card().isVisible(), true);
});
await ok("the card sits below the next step, so the day's work comes first", async () => {
  assert.equal(await p.evaluate(() => document.querySelector("[aria-label='Do this now']").getBoundingClientRect().top < document.querySelector(".ph-bk").getBoundingClientRect().top), true);
});
await ok("no sideways scroll, no page errors", async () => {
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.deepEqual(errs, []);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
