/* Accessibility (2026-10-21, the third gap: "a real-device screen-reader test").
   axe-core (tests/vendor, MPL-2.0) checks every phone page in light and dark, a sheet, the rest card and the
   desktop board and Planner against WCAG 2.2 A and AA. It cannot hear VoiceOver or TalkBack: the
   real-device script in notes/screen-reader-test.md does that. A few checks below read the
   accessibility tree, which is what a screen reader announces. */
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const AXE = fs.readFileSync(new globalThis.URL("./vendor/axe.min.js", import.meta.url), "utf8");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const audit = async (p) => {
  await p.addScriptTag({ content: AXE });
  return p.evaluate(async (tags) => { const r = await axe.run(document, { runOnly: { type: "tag", values: tags } });
    return r.violations.map((v) => v.id + " (" + v.impact + ", " + v.nodes.length + "): " + v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")); }, TAGS);
};
const clean = (p, name) => ok("WCAG 2.2 AA, no failures: " + name, async () => { const v = await audit(p); assert.deepEqual(v, []); });

for (const scheme of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: scheme });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
  await clean(p, scheme + ", welcome");
  await p.locator("[data-ph=onb-next]").click(); await p.waitForTimeout(250); await clean(p, scheme + ", first goal");
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.locator("[data-ph=onb-done]").click(); await p.waitForTimeout(600);
  const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(400); };
  for (const r of ["now", "talk", "journal", "you", "goals", "planner", "backlog", "archive", "tags", "learned"]) { await go(r); await clean(p, scheme + ", " + r); }
  await go("goals"); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(300); await clean(p, scheme + ", a goal page");
  await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(300); await clean(p, scheme + ", a step page");
  await go("now"); await p.locator("[data-ph=energy]").click(); await p.locator("dialog.ask[open]").waitFor(); await p.waitForTimeout(600); /* after the sheet slides in */ await clean(p, scheme + ", the energy sheet");
  await p.keyboard.press("Escape"); await p.evaluate(() => window.__board.energy(1)); await go("you"); await go("now"); await clean(p, scheme + ", the rest card");
  if (scheme === "light") {
    await ok("what a screen reader hears: the energy sheet is a named dialog with 4 levels and a way out", async () => {
      await p.locator("[data-ph=energy]").click(); const d = p.locator("dialog.ask[open]"); await d.waitFor();
      const s = await d.ariaSnapshot(); assert.match(s, /dialog "How is your energy\?"/); for (const w of ["Very low", "Low", "Good", "Full", "Keep it"]) assert.match(s, new RegExp('button "' + w));
      await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    });
    await ok("what a screen reader hears: Your week once (7 named days, no second copy as a table)", async () => {
      await p.evaluate(() => window.__board.energy(3)); await go("you"); await go("now");
      const s = await p.locator("#ph-main").getByRole("region", { name: "Your week", exact: true }).ariaSnapshot();
      assert.equal((s.match(/button "\w+day \d{1,2} \w+, \d+ steps?"/g) || []).length, 7, s); assert.doesNotMatch(s, /table/);
    });
    await ok("what a screen reader hears: on You the photo is offered once, as the Your photo row", async () => {
      await go("you"); const s = await p.locator("#ph-main").ariaSnapshot();
      assert.equal((s.match(/Add a photo of you/g) || []).length, 1, s.slice(0, 400)); assert.match(s, /heading "You"/);
      assert.equal(await p.locator("#ph-photo-in").getAttribute("aria-label"), "Add a photo of you");
    });
  }
  await ok(scheme + ": no page errors", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}
for (const scheme of ["light", "dark"]) {
  const dc = await b.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: scheme });
  await dc.addInitScript(() => { try { localStorage.setItem("oys-classic", "test"); } catch (e) {} });
  const q = await dc.newPage(); await q.goto(URL); await q.waitForSelector(".row.pick");
  await q.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); s.me.done = true; localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await q.reload(); await q.waitForSelector(".row.pick"); await q.waitForTimeout(2000); /* after the opening fade */
  await clean(q, scheme + ", desktop board");
  for (const v of ["planner", "backlog", "archive", "tags"]) { await q.evaluate((v) => { location.hash = "#/" + v; }, v); await q.waitForTimeout(500); await clean(q, scheme + ", desktop " + v); }
  await dc.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
