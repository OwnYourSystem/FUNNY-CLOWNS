/* Branch claude/phone-pages (2026-10-18): Backlog, Archive, Tags, the Planner
   and What the board learned as phone pages, on the same functions as the
   board's own pages. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const D = () => p.locator("dialog.ask[open]");
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(300); };
const main = () => p.locator("#ph-main").innerText();
const sideways = () => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const undo = async () => { await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300); };
await p.goto(URL); await p.waitForSelector("#ph-main");
/* the first-time guide: Your day, Your work, How you work, What matters most, then the first goal */
for (let i = 0; i < 5; i++) { await p.click("[data-ph=onb-next]"); await p.waitForTimeout(250); }
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.click("[data-ph=onb-done]"); await p.waitForTimeout(300);
await p.evaluate((KEY) => {
  const s = JSON.parse(localStorage.getItem(KEY));
  s.backlog = [{ t: "Learn to sail", d: "2026-10-12" }, { t: "Write a short story", d: "2026-10-02" }];
  const gs = s.groups; gs[0].tags = ["work", "q4"]; gs[1].tags = ["work"]; gs[2].tags = ["home"];
  const g = gs.splice(3, 1)[0]; g.archivedAt = "2026-10-10"; s.archive = [g];
  s.tagFilter = [];
  localStorage.setItem(KEY, JSON.stringify(s));
}, KEY);
await p.reload(); await p.waitForSelector("#ph-main");

/* ---------- Backlog ---------- */
await ok("Backlog is a phone page: Back to You, the Active / Backlog / Archive switch, a row per idea with a chevron, Add in the dock", async () => {
  await go("backlog");
  assert.equal((await p.locator("#ph-main h1").innerText()).trim(), "Backlog"); assert.equal(await p.locator("#v-backlog").isVisible(), false);
  assert.equal(await p.locator("#ph-main .ph-nav").innerText(), "You");
  assert.equal(await p.locator('.ph-seg a[aria-current="page"]').innerText(), "Backlog");
  assert.equal(await p.locator("[data-ph=blitem]").count(), 2); assert.equal(await p.locator("[data-ph=blitem] .ph-chev").count(), 2);
  const bx = await p.locator(".ph-dock [data-ph=bladd]").boundingBox(); assert.ok(bx.y > 844 * 0.6);
  assert.equal(await p.locator('#ph-tabs [data-tab="you"]').getAttribute("aria-current"), "page"); assert.equal(await sideways(), false);
});
await ok("Backlog: Add an idea is a sheet with Speak that comes back for the next, and uses the board's own backlogAdd", async () => {
  await p.click("[data-ph=bladd]"); await D().waitFor({ state: "visible" }); assert.equal(await D().locator('[data-mic-to="t"]').count(), 1);
  await D().locator('[data-ak="t"]').fill("Plant an apple tree"); await D().locator('[data-ak="t"]').press("Enter"); await p.waitForTimeout(300);
  assert.match(await D().innerText(), /Added .Plant an apple tree/); await D().getByRole("button", { name: "Done" }).click(); await p.waitForTimeout(200);
  const s = await st(); assert.equal(s.backlog[0].t, "Plant an apple tree"); assert.match(s.backlog[0].d, /^\d{4}-\d\d-\d\d$/);
  assert.equal(await p.locator("[data-ph=blitem]").count(), 3);
});
await ok("Backlog: Make it a goal opens the new goal's page, and Undo puts the idea back", async () => {
  const n = (await st()).groups.length;
  await p.locator("[data-ph=blitem]", { hasText: "Learn to sail" }).click(); await D().waitFor({ state: "visible" });
  await D().getByRole("button", { name: "Make it a goal" }).click(); await p.waitForTimeout(400);
  assert.match(await p.evaluate(() => location.hash), /^#\/goal\//); assert.match(await p.locator("#ph-main h1").innerText(), /Learn to sail/);
  let s = await st(); assert.equal(s.groups.length, n + 1); assert.ok(!s.backlog.some((x) => x.t === "Learn to sail"));
  await undo(); s = await st(); assert.equal(s.groups.length, n); assert.ok(s.backlog.some((x) => x.t === "Learn to sail"));
});
await ok("Backlog: Remove asks first; Keep it keeps it; Remove it removes it, with Undo", async () => {
  await go("backlog");
  await p.locator("[data-ph=blitem]", { hasText: "Write a short story" }).click(); await D().waitFor({ state: "visible" });
  await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(250); assert.match(await D().innerText(), /Remove it\?/);
  await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200); assert.ok((await st()).backlog.some((x) => x.t === "Write a short story"));
  await p.locator("[data-ph=blitem]", { hasText: "Write a short story" }).click(); await D().waitFor({ state: "visible" });
  await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(250); await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(300);
  assert.ok(!(await st()).backlog.some((x) => x.t === "Write a short story")); assert.equal(await p.locator("[data-ph=blitem]", { hasText: "Write a short story" }).count(), 0);
  await undo(); assert.ok((await st()).backlog.some((x) => x.t === "Write a short story"));
});
await ok("Backlog: with more than four ideas a search box filters the list as you type, and keeps its focus", async () => {
  await p.evaluate((KEY) => { const s = JSON.parse(localStorage.getItem(KEY)); ["Fix the gate", "Paint the fence"].forEach((t) => s.backlog.push({ t, d: "2026-10-01" })); localStorage.setItem(KEY, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector("#ph-main"); await go("backlog");
  assert.equal(await p.locator("#ph-q").count(), 1);
  await p.locator("#ph-q").pressSequentially("fen", { delay: 30 }); await p.waitForTimeout(150);
  assert.equal(await p.locator("[data-ph=blitem]").count(), 1); assert.match(await p.locator("[data-ph=blitem]").innerText(), /Paint the fence/);
  assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.id), "ph-q");
  await p.locator("#ph-q").fill(""); await p.locator("#ph-q").dispatchEvent("input"); await p.waitForTimeout(100);
});

/* ---------- Archive ---------- */
await ok("Archive: a finished goal is a row; Put it back returns it to the board and opens it, with Undo", async () => {
  await go("archive"); assert.equal(await p.locator('.ph-seg a[aria-current="page"]').innerText(), "Archive");
  const row = p.locator("[data-ph=aritem]").first(); const name = (await row.locator("span").first().innerText()).trim();
  assert.match(await row.innerText(), /10 Oct 2026/);
  await row.click(); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: "Put it back on the board" }).click(); await p.waitForTimeout(400);
  let s = await st(); assert.equal(s.archive.length, 0); assert.ok(s.groups.some((g) => g.name === name)); assert.match(await p.evaluate(() => location.hash), /^#\/goal\//);
  await undo(); s = await st(); assert.equal(s.archive.length, 1); assert.ok(!s.groups.some((g) => g.name === name));
});

/* ---------- Tags ---------- */
await ok("Tags: chips with count and progress; picking narrows the goals to those with all picked tags; the board's own filter is not touched", async () => {
  await go("tags"); assert.equal(await p.locator("[data-ph=tagpick]").count(), 3);
  assert.match(await main(), /Pick a tag above/);
  await p.locator('[data-ph=tagpick][data-t="work"]').click(); await p.waitForTimeout(200);
  assert.equal(await p.locator('[data-ph=tagpick][data-t="work"]').getAttribute("aria-pressed"), "true");
  assert.equal(await p.locator("section[aria-label='Goals with these tags'] [data-ph=goal]").count(), 2);
  await p.locator('[data-ph=tagpick][data-t="q4"]').click(); await p.waitForTimeout(200);
  assert.equal(await p.locator("section[aria-label='Goals with these tags'] [data-ph=goal]").count(), 1);
  assert.deepEqual((await st()).tagFilter, [], "the board's filter changed");
  await p.locator("section[aria-label='Goals with these tags'] [data-ph=goal]").click(); await p.waitForTimeout(300); assert.match(await p.evaluate(() => location.hash), /^#\/goal\//);
});

/* ---------- Planner ---------- */
await ok("Planner is a phone page: every fact of the week is there and saves as it changes, through the board's meSet", async () => {
  await go("planner"); assert.equal((await p.locator("#ph-main h1").innerText()).trim(), "Planner"); assert.equal(await p.locator("#v-planner").isVisible(), false);
  for (const k of ["w0", "w1", "commute", "wind", "sharp", "gym", "brief", "north", "never"]) assert.equal(await p.locator(`[data-pme=${k}]`).count(), 1, k);
  await p.locator("[data-pme=w0]").fill("09:15"); await p.locator("[data-pme=commute]").fill("45"); await p.locator("[data-pme=commute]").press("Enter");
  await p.locator("[data-pme=sharp]").selectOption("evening"); await p.locator("[data-pme=north]").fill("Ship the audit"); await p.locator("[data-pme=north]").press("Enter"); await p.waitForTimeout(250);
  const me = (await st()).me; assert.equal(me.work[0], "09:15"); assert.equal(me.commute, 45); assert.equal(me.sharp, "evening"); assert.equal(me.north, "Ship the audit");
  await p.locator("[data-pme=commute]").fill("999"); await p.locator("[data-pme=commute]").press("Enter"); await p.waitForTimeout(200); assert.equal((await st()).me.commute, 240);
});
await ok("Planner: working days toggle; a typed field survives a background redraw", async () => {
  const before = (await st()).me.days.includes(6);
  await p.locator("[data-ph=pday][data-day='6']").click(); await p.waitForTimeout(200);
  assert.equal((await st()).me.days.includes(6), !before); assert.equal(await p.locator("[data-ph=pday][data-day='6']").getAttribute("aria-pressed"), String(!before));
  await p.locator("[data-ph=pday][data-day='6']").click(); await p.waitForTimeout(150);
  await p.locator("[data-pme=never]").fill("Sunday mornings"); await p.evaluate(() => window.__board.render()); assert.equal(await p.locator("[data-pme=never]").inputValue(), "Sunday mornings");
});
await ok("Planner: where each goal can be done saves, and the held-back list answers at once", async () => {
  const g = (await st()).groups[0];
  await p.locator(`[data-pwhere="${g.id}"]`).selectOption("body"); await p.waitForTimeout(250);
  assert.equal((await st()).groups[0].where, "body");
  assert.ok(await p.locator("#ph-held").count());
});
await ok("Planner: Interview me again opens the interview, plum on its button only, and Leave it closes it", async () => {
  await p.locator("[data-ph=interview]").click(); await p.waitForTimeout(400);
  assert.equal(await p.locator("#interview").isVisible(), true);
  /* 2026-10-19: plum is for buttons; the progress dots are the text colour */
  assert.equal(await p.locator(".iv-dots i.on").first().evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(0, 0, 0)");
  assert.equal(await p.locator(".iv-acts .btn.take").first().evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(44, 19, 50)");
  assert.equal(await p.locator(".iv-k").evaluate((e) => getComputedStyle(e).textTransform), "none");
  await p.locator("#iv-quit").click(); await p.waitForTimeout(300); assert.equal(await p.locator("#interview").isVisible(), false);
});

/* ---------- What the board learned ---------- */
await ok("You's private row opens What the board learned, a phone page", async () => {
  await go("you"); await p.locator("[data-ph=learned]").click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => location.hash), "#/learned"); assert.match(await p.locator("#ph-main h1").innerText(), /What the board learned/);
});
await ok("Learned: a note is kept with Remember it (and Enter), shown, and removed", async () => {
  await p.fill("#ph-memnew", "Mornings are for deep work"); await p.click("[data-ph=memadd]"); await p.waitForTimeout(300);
  assert.match(await main(), /Mornings are for deep work/); assert.ok((await st()).mem.some((m) => m.t === "Mornings are for deep work" && m.st === "kept"));
  await p.fill("#ph-memnew", "Calls go after lunch"); await p.press("#ph-memnew", "Enter"); await p.waitForTimeout(300);
  assert.match(await main(), /Calls go after lunch/);
  await p.locator(".ph-mem", { hasText: "Calls go after lunch" }).locator("[data-ph=memdel]").click(); await p.waitForTimeout(300);
  assert.doesNotMatch(await main(), /Calls go after lunch/);
});
await ok("Learned: the switches are the board's own (Learning, Hints, Also as a reminder, Low-day check-in)", async () => {
  const flip = async (k, field, want) => { await p.locator(`[data-ph=${k}]`).click(); await p.waitForTimeout(250); assert.equal((await st()).me[field], want, k); assert.match(await p.locator(`[data-ph=${k}]`).innerText(), want ? /On/ : /Off/); };
  await flip("memlearn", "learn", false); await flip("memlearn", "learn", true);
  await flip("hinton", "hints", false); await flip("hinton", "hints", true);
  await flip("hintnote", "hintNote", false); await flip("hintnote", "hintNote", true);
  await flip("baron", "barrier", false); await flip("baron", "barrier", true);
});
await ok("Learned: Check in opens the weekly sheet; the page lists the check-in after saving", async () => {
  await p.locator("[data-ph=week]").click(); await D().waitFor({ state: "visible" });
  for (const k of ["e", "m", "c", "f", "w"]) await D().locator(`[data-ak="${k}"] [data-av="4"]`).click();
  await D().locator("[data-aok]").click(); await p.waitForTimeout(400);
  assert.match(await main(), /Week \d+ · [^\n]+\s+Average 4 of 5/); assert.equal(await p.locator("[data-ph=weekerase]").count(), 1);
});
await ok("Learned: Erase everything asks first (the board's own confirmation) and clears the notes", async () => {
  await p.locator("[data-ph=memerase]").click(); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /Erase everything/);
  await D().getByRole("button", { name: "Erase it all" }).click(); await p.waitForTimeout(500);
  assert.equal((await st()).mem.filter((m) => m.st === "kept").length, 0); assert.match(await main(), /Nothing kept yet/);
  assert.equal(await sideways(), false);
});
await ok("no page errors (phone)", async () => { assert.deepEqual(errs, []); });
await ctx.close();

/* ---------- the board's own Backlog and Planner after the shared functions ---------- */
{
  const dc = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  const q = await dc.newPage(); const qe = []; q.on("pageerror", (e) => qe.push(e.message));
  const qs = () => q.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
  await q.goto(URL); await q.waitForSelector(".row.pick");
  await ok("classic: Backlog add, make it a goal, and remove (asks once) behave as before", async () => {
    await q.evaluate(() => { location.hash = "#/backlog"; }); await q.waitForTimeout(300);
    await q.fill("#bl-name", "Desk idea one"); await q.click("#bl-add"); await q.fill("#bl-name", "Desk idea two"); await q.press("#bl-name", "Enter"); await q.waitForTimeout(200);
    let s = await qs(); assert.equal(s.backlog[0].t, "Desk idea two"); assert.equal(s.backlog[1].t, "Desk idea one");
    const n = s.groups.length; await q.locator("[data-bl-goal]").first().click(); await q.waitForTimeout(300);
    s = await qs(); assert.equal(s.groups.length, n + 1); assert.equal(s.groups[s.groups.length - 1].name, "Desk idea two"); assert.equal(await q.evaluate(() => location.hash), "#/board");
    await q.evaluate(() => { location.hash = "#/backlog"; }); await q.waitForTimeout(300);
    await q.locator("[data-bl-del]").first().click(); await q.waitForTimeout(150); s = await qs(); assert.ok(!s.backlog.some((x) => x.t === "Desk idea one"), "a plain idea should go on the first press");
  });
  await ok("classic: the Planner's working days and fields still save", async () => {
    await q.evaluate(() => { location.hash = "#/planner"; }); await q.waitForTimeout(300);
    const before = (await qs()).me.days.includes(0); await q.locator("#pl-days [data-day='0']").click(); await q.waitForTimeout(150);
    assert.equal((await qs()).me.days.includes(0), !before);
    await q.locator('#pl-form [data-me="commute"]').fill("20"); await q.waitForTimeout(150); assert.equal((await qs()).me.commute, 20);
  });
  await ok("no page errors (classic)", async () => { assert.deepEqual(qe, []); });
  await dc.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
