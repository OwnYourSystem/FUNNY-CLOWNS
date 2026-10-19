/* Branch claude/journal-privacy-progress (2026-10-18): the journal is private
   and editable, Now has the week from the air, and the top of Now has the date
   with its year, the week and a running clock. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", JKEY = KEY + ".journal";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const DAY = 864e5;
const ymd = (t) => { const x = new Date(t); if (x.getHours() < 4) x.setDate(x.getDate() - 1); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const PER = [2, 0, 3, 1, 4, 0, 2], PREV = [1, 1, 0, 2, 0, 1, 0];   /* steps per day, oldest first: this week 12, the week before 5 */

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const D = () => p.locator("dialog.ask[open]");
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250); };
const jr = () => p.evaluate((JKEY) => JSON.parse(localStorage.getItem(JKEY)), JKEY);
const tap0 = (sel) => p.locator(sel).first().click();
const sideways = () => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
await p.goto(URL); await p.waitForSelector("#ph-main");
/* the first-time guide: Your day, Your work, How you work, What matters most, then the first goal */
for (let i = 0; i < 5; i++) { await p.click("[data-ph=onb-next]"); await p.waitForTimeout(250); }
await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.click("[data-ph=onb-done]"); await p.waitForTimeout(300);
/* a known week: done events per day, one Done taken back with Undo, and three journal entries */
const T0 = Date.now();
await p.evaluate(([KEY, JKEY, PER, PREV, now, DAY, d1, d2]) => {
  const s = JSON.parse(localStorage.getItem(KEY)), ids = Object.keys(s.subs), mid = new Date(now); mid.setHours(12, 0, 0, 0);
  /* today's steps must already have happened */
  if (mid.getTime() > now - 3600000) mid.setTime(now - 3600000);
  s.ev = s.ev || [];
  PER.forEach((c, i) => { for (let j = 0; j < c; j++) s.ev.push({ t: mid.getTime() - (6 - i) * DAY - j * 60000, k: "done", id: ids[(i * 3 + j) % ids.length] }); });
  PREV.forEach((c, i) => { for (let j = 0; j < c; j++) s.ev.push({ t: mid.getTime() - (13 - i) * DAY - j * 60000, k: "done", id: ids[(i + j) % ids.length] }); });
  /* taken back the same day: must not count */
  s.ev.push({ t: mid.getTime() - 3 * DAY - 3600000, k: "done", id: "s-taken-back" }, { t: mid.getTime() - 3 * DAY - 3500000, k: "undo", id: "s-taken-back" });
  s.ev.sort((a, b) => a.t - b.t); localStorage.setItem(KEY, JSON.stringify(s));
  localStorage.setItem(JKEY, JSON.stringify({ v: 1, log: [
    { id: "j1", at: new Date(now - 2 * DAY).toISOString(), d: d2, tm: "06:20", kind: "start", a: "Not sure where I stand", b: "Today is my birthday" },
    { id: "j2", at: new Date(now - DAY - 3600000).toISOString(), d: d1, tm: "08:12", kind: "start", a: "Weekend, still in doubt", b: "Plan the calendar first" },
    { id: "j3", at: new Date(now - DAY).toISOString(), d: d1, tm: "21:40", kind: "end", a: "Cloud requirements for INEOS", b: "Call the bank" } ] }));
}, [KEY, JKEY, PER, PREV, T0, DAY, ymd(T0 - DAY), ymd(T0 - 2 * DAY)]);
await p.reload(); await p.waitForSelector("#ph-main"); await p.waitForTimeout(300);
const PRIVATE = /INEOS|bank|birthday|calendar first|still in doubt|where I stand/i;

/* ---------- 4. the top of Now ---------- */
await ok("Now opens with the day, the week, the date with its year, and a clock that runs", async () => {
  const d = new Date(), months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  assert.match(await p.locator("#ph-main h1").innerText(), new RegExp("^" + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear() + "$"));
  assert.match(await p.locator(".ph-today .ph-k").innerText(), /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) · Week \d{1,2}$/);
  const c1 = await p.locator("#ph-clock").innerText(); assert.match(c1, /^\d\d:\d\d:\d\d$/);
  /* poll, not one fixed wait: a loaded machine can hold the 1-second tick back */
  await p.waitForFunction(c => document.getElementById("ph-clock").innerText !== c, c1, { timeout: 4000 }).catch(() => {});
  assert.notEqual(await p.locator("#ph-clock").innerText(), c1, "the clock stood still");
  const bx = await p.locator("#ph-clock").boundingBox(); assert.ok(bx.y < 120, "the clock is not at the top");
});

/* ---------- 3. the week from the air ---------- */
await ok("Your week: steps this week against the week before (a Done taken back does not count), and days with a step", async () => {
  const t = await p.locator(".ph-week").innerText();
  assert.match(t, /Steps finished\s+12\s+▲ 7 on the week before/);
  assert.match(t, /Days with a step done\s+5\s*of 7/);
});
await ok("Your week: the goals meter matches the board's overall figure and says how far it moved", async () => {
  const v = await p.locator(".ph-meter").getAttribute("aria-valuenow");
  assert.match(await p.locator(".ph-week").innerText(), new RegExp("All goals\\s+" + v + "%"));
  assert.match(await p.locator(".ph-week").innerText(), /(▲|▼) [\d.]+ points this week|No change this week/);
});
await ok("Your week: seven columns, the tallest labelled, a tap reads a day out, and a table carries every value", async () => {
  assert.equal(await p.locator("[data-ph=col]").count(), 7);
  const labelled = await p.locator(".ph-col-v").evaluateAll((l) => l.map((e) => e.textContent).filter(Boolean));
  assert.deepEqual(labelled, ["4"]);
  const hs = await p.locator(".ph-col-b").evaluateAll((l) => l.map((e) => e.getBoundingClientRect().height));
  assert.equal(hs[1], 0); assert.ok(hs[4] > hs[2] && hs[2] > hs[0] && hs[0] > hs[3], "heights do not follow the counts: " + hs);
  for (const w of await p.locator(".ph-col-b").evaluateAll((l) => l.map((e) => e.getBoundingClientRect().width))) assert.ok(w <= 24);
  await p.locator("[data-ph=col]").nth(4).click(); assert.match(await p.locator("#ph-cols-read").innerText(), /: 4 steps finished$/);
  assert.equal(await p.locator(".ph-week table.ph-sr tr").count(), 7);
  for (const h of await p.locator("[data-ph=col]").evaluateAll((l) => l.map((e) => e.getBoundingClientRect().height))) assert.ok(h >= 44);
  assert.equal(await sideways(), false);
});

/* ---------- 2. the journal keeps its words to itself ---------- */
await ok("Now says yesterday's note is waiting, without what it says", async () => {
  const s = await p.locator(".ph-strip").innerText(); assert.match(s, /note is waiting/); assert.doesNotMatch(s, PRIVATE);
  assert.doesNotMatch(await p.locator("#ph-main").innerText(), PRIVATE);
});
await ok("the strip opens the Journal with yesterday's note shown", async () => {
  await p.locator(".ph-strip").click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => location.hash), "#/journal"); assert.match(await p.locator("#ph-main").innerText(), /Call the bank/);
});
await ok("the Journal shows days, not words; Show it opens yesterday's note and leaving closes it", async () => {
  await go("now"); await p.click('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(250);
  assert.doesNotMatch(await p.locator("#ph-main").innerText(), PRIVATE);
  assert.equal(await p.locator("[data-ph=jday]").count(), 2);
  assert.equal(await p.locator("[data-ph=jday] .ph-chev").count(), 2);
  await p.click("[data-ph=jrpeek]"); await p.waitForTimeout(200);
  assert.match(await p.locator("#ph-main").innerText(), /Call the bank/); assert.equal(await p.locator("[data-ph=jrpeek]").getAttribute("aria-expanded"), "true");
  await p.click('#ph-tabs [data-tab="now"]'); await p.waitForTimeout(200); await p.click('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(250);
  assert.doesNotMatch(await p.locator("#ph-main").innerText(), PRIVATE);
});
await ok("a day opens on its own page with its entries, Back returns to the Journal", async () => {
  await p.locator("[data-ph=jday]").first().click(); await p.waitForTimeout(300);
  assert.match(await p.evaluate(() => location.hash), /^#\/jday\/\d{4}-\d\d-\d\d$/);
  const t = await p.locator("#ph-main").innerText(); assert.match(t, /Cloud requirements for INEOS/); assert.match(t, /Weekend, still in doubt/);
  assert.equal(await p.locator("[data-ph=jredit]").count(), 2); assert.equal(await p.locator("[data-ph=jrdel]").count(), 2);
  assert.equal(await p.locator('#ph-tabs [data-tab="journal"]').getAttribute("aria-current"), "page");
  await p.locator("#ph-main .ph-nav").click(); await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), "#/journal");
});

/* ---------- 1. every entry can be edited, the old ones too ---------- */
await ok("Edit changes an entry from two days ago; it keeps its date and time and shows when it was changed", async () => {
  await p.locator("[data-ph=jday]").nth(1).click(); await p.waitForTimeout(300);
  await p.locator("[data-ph=jredit]").first().click(); await D().waitFor({ state: "visible" });
  assert.equal(await D().locator('[data-ak="a"]').inputValue(), "Not sure where I stand");
  await D().locator('[data-ak="a"]').fill("I know where I stand now"); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  const e = (await jr()).log.find((x) => x.id === "j1");
  assert.equal(e.a, "I know where I stand now"); assert.equal(e.d, ymd(T0 - 2 * DAY)); assert.equal(e.tm, "06:20"); assert.ok(e.ed, "no time of change");
  assert.match(await p.locator("#ph-main").innerText(), /I know where I stand now/); assert.match(await p.locator("#ph-main").innerText(), /changed/);
});
await ok("an edit cannot empty an entry; that is what Remove is for", async () => {
  await p.locator("[data-ph=jredit]").first().click(); await D().waitFor({ state: "visible" });
  await D().locator('[data-ak="a"]').fill(""); await D().locator('[data-ak="b"]').fill(""); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(200);
  assert.equal(await D().count(), 1); assert.match(await D().innerText(), /use Remove/);
  await D().getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(200);
  assert.equal((await jr()).log.find((x) => x.id === "j1").a, "I know where I stand now");
});
await ok("Remove asks first; removing a day's last entry goes back to the Journal and the day is gone", async () => {
  await p.locator("[data-ph=jrdel]").first().click(); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /goes for good/);
  await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200); assert.ok((await jr()).log.some((x) => x.id === "j1"));
  await p.locator("[data-ph=jrdel]").first().click(); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(400);
  assert.ok(!(await jr()).log.some((x) => x.id === "j1")); assert.equal(await p.evaluate(() => location.hash), "#/journal");
  assert.equal(await p.locator("[data-ph=jday]").count(), 1);
});
/* ---------- your photo on You, and small on every other page ---------- */
const PHOTO = (process.env.APP_ROOT || "/tmp/claude-0/appwt") + "/apple-touch-icon.png";
const mini = async () => p.evaluate(() => { const m = document.getElementById("ph-mini"); if (!m || m.hidden || !m.getClientRects().length) return null; const r = m.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, img: !!m.querySelector("img") }; });
const overlaps = (a, b) => a && b && !(a.x + a.w <= b.x || b.x + b.width <= a.x || a.y + a.h <= b.y || b.y + b.height <= a.y);
await ok("photo: none yet, so no small photo anywhere, and You offers Add a photo", async () => {
  await go("now"); assert.equal(await mini(), null);
  await p.click('#ph-tabs [data-tab="you"]'); await p.waitForTimeout(250);
  assert.match(await p.locator("#ph-main").innerText(), /Add a photo/); assert.equal(await p.locator("label.ph-av-b").count(), 1);
});
await ok("photo: picking one keeps a 256px square JPEG on this phone, outside the board's data, and shows it large on You", async () => {
  await p.setInputFiles("#ph-photo-in", PHOTO); await p.waitForTimeout(600);
  const saved = await p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY + ".photo")), KEY);
  assert.match(saved.src, /^data:image\/jpeg;base64,/); assert.equal(saved.show, true);
  const dim = await p.evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode(); return [i.naturalWidth, i.naturalHeight]; }, saved.src);
  assert.deepEqual(dim, [256, 256]); assert.ok(saved.src.length < 60000, "too big: " + saved.src.length);
  assert.doesNotMatch(await p.evaluate((KEY) => localStorage.getItem(KEY), KEY), /data:image/, "the photo went into the board's data");
  assert.equal(await p.locator("label.ph-av-b img").count(), 1); assert.equal(await mini(), null, "You shows the small one too");
  assert.match(await p.locator("#ph-main").innerText(), /Change photo/);
});
await ok("photo: the small photo is at the top right of every page, leads to You, and covers nothing", async () => {
  for (const r of ["now", "journal", "goals", "talk", "backlog"]) {
    await go(r); const m = await mini(); assert.ok(m && m.img, "no photo on " + r);
    assert.ok(m.w >= 44 && m.h >= 44, r + " target " + m.w + "x" + m.h); assert.ok(m.x > 390 - 70 && m.y < 90, r + " not top right: " + JSON.stringify(m));
    const boxes = await p.evaluate((sels) => sels.map((sel) => [sel, [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden")
      .map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })]), ["#ph-clock", "#bot-clear", ".ph-nav", "#ph-back-t", "[data-ph=dose]"]);
    for (const [sel, list] of boxes) for (const bx of list) assert.ok(!overlaps(m, bx), r + ": the photo covers " + sel);
  }
  await go("goals"); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); assert.ok((await mini()).img, "no photo on a goal");
  await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(250); assert.ok((await mini()).img, "no photo on a step");
  await p.locator("#ph-mini").click(); await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), "#/you");
  assert.equal(await sideways(), false);
});
await ok("photo: Show it on every page can be switched off and on again", async () => {
  await tap0("[data-ph=phshow]"); await p.waitForTimeout(200); await go("now"); assert.equal(await mini(), null);
  await go("you"); assert.match(await p.locator("[data-ph=phshow]").innerText(), /Off/);
  await tap0("[data-ph=phshow]"); await p.waitForTimeout(200); await go("now"); assert.ok((await mini()).img);
});
await ok("photo: Remove asks first, then the photo is gone everywhere", async () => {
  await go("you"); await tap0("[data-ph=phdel]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(200);
  assert.ok(await p.evaluate((KEY) => localStorage.getItem(KEY + ".photo"), KEY));
  await tap0("[data-ph=phdel]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate((KEY) => localStorage.getItem(KEY + ".photo"), KEY), null);
  assert.equal(await p.locator("label.ph-av-b img").count(), 0); await go("now"); assert.equal(await mini(), null);
});
await ok("photo: a stored value that is not a picture this board made is never shown", async () => {
  await p.evaluate((KEY) => localStorage.setItem(KEY + ".photo", JSON.stringify({ src: 'x" onerror="window.__bad=1', show: true })), KEY);
  await go("journal"); await go("now"); assert.equal(await mini(), null); assert.equal(await p.evaluate(() => window.__bad), undefined);
  await p.evaluate((KEY) => localStorage.removeItem(KEY + ".photo"), KEY);
});
await ok("no page errors (phone)", async () => { assert.deepEqual(errs, []); });
await ctx.close();

/* ---------- the classic board keeps the same privacy ---------- */
{
  const dc = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  await dc.addInitScript(([JKEY, d1]) => {
    if (!localStorage.getItem(JKEY)) localStorage.setItem(JKEY, JSON.stringify({ v: 1, log: [{ id: "k1", at: new Date(Date.now() - 864e5).toISOString(), d: d1, tm: "21:40", kind: "end", a: "Desk secret done", b: "Desk secret next" }] }));
  }, [JKEY, ymd(T0 - DAY)]);
  const q = await dc.newPage(); const qe = []; q.on("pageerror", (e) => qe.push(e.message));
  await q.goto(URL); await q.waitForSelector(".row.pick"); await q.evaluate(() => { location.hash = "#/planner"; }); await q.waitForTimeout(400);
  await ok("classic: the Journal panel lists closed days; the words show only when a day is opened, and Edit works there", async () => {
    const body = q.locator("#jr-body"); assert.equal(await body.locator("details.jr-day").count(), 1);
    assert.equal(await body.locator("details.jr-day[open]").count(), 0);
    assert.equal(await q.getByText("Desk secret done").isVisible(), false);
    await body.locator("details.jr-day summary").click(); await q.waitForTimeout(150);
    assert.equal(await q.getByText("Desk secret done").first().isVisible(), true);
    await body.locator("[data-jr-edit]").click(); await q.locator("dialog.ask[open]").waitFor();
    await q.locator('dialog.ask[open] [data-ak="b"]').fill("Desk secret changed"); await q.locator("dialog.ask[open] [data-aok]").click(); await q.waitForTimeout(300);
    assert.equal((await q.evaluate((JKEY) => JSON.parse(localStorage.getItem(JKEY)), JKEY)).log[0].b, "Desk secret changed");
  });
  await ok("no page errors (classic)", async () => { assert.deepEqual(qe, []); });
  await dc.close();
}
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
