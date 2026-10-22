/* The phone app (2026-10-15): four tabs on the same engine, phone width only. */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1", JKEY = KEY + ".journal";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ymd = (d) => { const q = (n) => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + q(d.getMonth() + 1) + "-" + q(d.getDate()); };
const jday = (d) => { const x = new Date(d.getTime()); if (x.getHours() < 4) x.setDate(x.getDate() - 1); return ymd(x); };
const YEST = jday(new Date(Date.now() - 864e5));

/* ---------- the desktop does not change ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector(".row.pick");
  await ok("on a computer the board is the classic board and the phone app is hidden", async () => {
    assert.equal(await p.locator("#ph").isVisible(), false); assert.equal(await p.locator(".masthead").isVisible(), true);
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains("ph")), false);
  });
  await ok("the desktop does not take the phone's plum", async () => {
    assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ph-pri").trim()), "");
  });
  await ok("no page errors (computer)", async () => { assert.deepEqual(errs, []); });
  await ctx.close();
}

/* ---------- the phone ---------- */
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector("#ph-main .ph-onb");
const st = () => p.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
const tap = (sel) => p.locator(sel).first().click();
const D = () => p.locator("dialog.ask[open]");
const go = async (r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(250); };
const sideways = () => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

await ok("a first open shows the welcome, with no tabs and no old board", async () => {
  assert.match(await p.locator("#ph-main").innerText(), /One step. In the right order/);
  assert.equal(await p.locator("#ph-tabs").isVisible(), false); assert.equal(await p.locator(".masthead").isVisible(), false);
  assert.equal(await sideways(), false); await p.screenshot({ path: "/tmp/claude-0/ph-test-welcome.png" });
});
await ok("value first: the welcome, then the first goal; the goal is added and Now offers Set up your week", async () => {
  await tap("[data-ph=onb-next]"); await p.waitForTimeout(150);
  assert.equal(await p.locator(".ph-steps").getAttribute("aria-label"), "Step 2 of 2");
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await tap("[data-ph=onb-done]"); await p.waitForTimeout(400);
  assert.equal(await p.locator(".ph-guide").isVisible(), true);
});
await ok("Your day (from Set up your week): a time after the day end is refused, and the step does not move on", async () => {
  await tap(".ph-guide [data-ph=guide]"); await p.waitForTimeout(300);
  await p.fill("#ph-end", "18:00"); await p.fill("#ph-pm", "19:00"); await tap("[data-ph=onb-next]"); await p.waitForTimeout(150);
  assert.match(await p.locator("#ph-onb-err").innerText(), /after your day ends/); assert.equal(await p.locator(".ph-steps").getAttribute("aria-label"), "Step 1 of 5");
});
await ok("Your day saves the day end and the person's reminder choices", async () => {
  await p.fill("#ph-end", "21:00"); await p.fill("#ph-pm", "16:00"); await tap("[data-ph=tog][data-k=am][data-v=off]"); await p.waitForTimeout(100);
  assert.equal(await p.locator("#ph-end").inputValue(), "21:00", "a typed value was lost when a switch was pressed");
  await tap("[data-ph=onb-next]"); await p.waitForTimeout(300);
  const me = (await st()).me; assert.equal(me.wind, "21:00"); assert.equal(me.remAm, false); assert.equal(me.remPm, true); assert.equal(me.pmAt, "16:00");
  assert.equal(await p.locator(".ph-steps").getAttribute("aria-label"), "Step 2 of 5");
  for (let i = 0; i < 3; i++) { await tap("[data-ph=onb-next]"); await p.waitForTimeout(250); } /* Your work, How you work, What matters most */
  assert.equal(await p.locator(".ph-steps").getAttribute("aria-label"), "Step 5 of 5");
  await tap("[data-ph=guide-done]"); await p.waitForTimeout(400);
});
await ok("the first goal and step are added, and Now opens with the four tabs", async () => {
  const s = await st(); assert.equal(s.me.done, true); assert.ok(s.groups.some((g) => g.name === "Garden Shed"));
  assert.ok(Object.values(s.subs).some((x) => x.name === "Buy the timber"));
  assert.equal(await p.evaluate(() => location.hash), "#/now"); assert.equal(await p.locator("#ph-tabs").isVisible(), true);
  assert.equal(await p.locator('#ph-tabs [data-tab="now"]').getAttribute("aria-current"), "page");
});
await ok("Now shows one task with its reason, and fits the screen above the tabs", async () => {
  const card = p.locator(".ph-card").first(); assert.match(await card.innerText(), /Do this now/i);
  assert.ok((await card.locator(".ph-task").innerText()).length > 3);
  const bx = await card.boundingBox(); assert.ok(bx.y + bx.height < 844 - 80, "the card is below the fold: " + JSON.stringify(bx));
  assert.equal(await sideways(), false); await p.screenshot({ path: "/tmp/claude-0/ph-test-now.png" });
});
let first = "";
await ok("the full reason is on the card, and Skip shows the next one", async () => {
  first = await p.locator(".ph-task").innerText();
  assert.ok((await p.locator("[aria-label='Do this now'] .ph-why").innerText()).length > 20); assert.equal(await p.locator("[data-ph=why], [data-ph=else]").count(), 0);
  await tap("[data-ph=skip]"); await p.waitForTimeout(300);
  assert.notEqual(await p.locator(".ph-task").innerText(), first);
});
await ok("Start it puts the step in Today; Done ticks it off and counts it", async () => {
  const name = await p.locator(".ph-task").innerText(); await tap("[data-ph=take]"); await p.waitForTimeout(300);
  assert.match(await p.locator(".ph-card .ph-k").first().innerText(), /from today/i);
  assert.match(await p.locator(".ph-list").innerText(), new RegExp(name.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await tap(".ph-card [data-ph=done]"); await p.waitForTimeout(400);
  const s = await st(); assert.equal(s.done.length, 1); assert.match(await p.locator("section[aria-label=Today] .ph-k").innerText(), /1 of 1 done/i);
  assert.equal(await p.locator(".ph-item.is-done").count(), 1);
});
await ok("the energy battery: Very low makes today one thing", async () => {
  await tap("[data-ph=energy]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: /^Very low/ }).click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=energy]").getAttribute("data-l"), "1");
  assert.equal((await p.evaluate(() => window.__board.dose())).n, 1);
});
await ok("Journal: write the end of the day with the dialog, and it is listed with its time", async () => {
  await tap('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(250);
  await tap("[data-ph=jr][data-kind=end]"); await D().waitFor({ state: "visible" }); assert.equal(await D().locator("[data-mic-to]").count(), 2);
  await D().locator('[data-ak="a"]').fill("Bought the timber"); await D().locator('[data-ak="b"]').fill("Cut the frame"); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  /* builds from 2026-10-18 list days, not words: the entry shows once its day is opened */
  if (await p.locator("[data-ph=jday]").count()) {
    assert.doesNotMatch(await p.locator("#ph-main").innerText(), /Bought the timber/);
    await p.locator("[data-ph=jday]").first().click(); await p.waitForTimeout(250);
  }
  const t = await p.locator("#ph-main").innerText(); assert.match(t, /Bought the timber/); assert.match(t, /\d\d:\d\d/); assert.equal(await sideways(), false);
});
await ok("yesterday's note shows as one line on Now, and opens the Journal", async () => {
  await p.evaluate(([JKEY, YEST]) => { localStorage.setItem(JKEY, JSON.stringify({ v: 1, log: [{ id: "j1", at: new Date(Date.now() - 864e5).toISOString(), d: YEST, tm: "21:40", kind: "end", a: "Shipped", b: "Call the bank" }] })); }, [JKEY, YEST]);
  await p.reload(); await p.waitForSelector("#ph-main"); await go("now");
  const s = p.locator(".ph-strip[data-ph=jropen]"); assert.match(await s.innerText(), /yesterday/i);
  /* builds from 2026-10-18 say the note is waiting; its words show on the Journal page the strip opens */
  if (/note is waiting/.test(await s.innerText())) assert.doesNotMatch(await s.innerText(), /Call the bank/); else assert.match(await s.innerText(), /Call the bank/);
  await s.click(); await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), "#/journal"); assert.match(await p.locator("#ph-main").innerText(), /where you left off/i);
  assert.match(await p.locator("#ph-main").innerText(), /Call the bank/);
});
await ok("Talk is the chat as a full page with Speak, and it closes when you leave it", async () => {
  await tap('#ph-tabs [data-tab="talk"]'); await p.waitForTimeout(300);
  assert.equal(await p.locator("#botsheet").isVisible(), true); assert.equal(await p.locator("#bot-mic").isVisible(), true);
  await p.fill("#bot-input", "help"); await p.press("#bot-input", "Enter"); await p.waitForTimeout(200);
  assert.match(await p.locator("#bot-log").textContent(), /JOURNAL/); /* the words are unchanged; the heading shows in sentence case */
  const bx = await p.locator("#botsheet").boundingBox(); assert.ok(bx.y + bx.height <= 844 - 70, "the chat runs under the tabs");
  await p.screenshot({ path: "/tmp/claude-0/ph-test-talk.png" });
  await tap('#ph-tabs [data-tab="now"]'); await p.waitForTimeout(250); assert.equal(await p.locator("#botsheet").isVisible(), false);
});
await ok("You: day end changes through its row; Reminders opens the reminder choice", async () => {
  await tap('#ph-tabs [data-tab="you"]'); await p.waitForTimeout(250);
  await tap("[data-ph=dayend]"); await D().waitFor({ state: "visible" }); await D().locator('[data-ak="t"]').fill("21:30"); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  assert.equal((await st()).me.wind, "21:30"); assert.match(await p.locator("#ph-main").innerText(), /21:30/);
  await tap("[data-ph=remind]"); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /reminders/i); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  assert.equal(await sideways(), false); await p.screenshot({ path: "/tmp/claude-0/ph-test-you.png", fullPage: true });
});
await ok("Goals lists every goal with its progress and next step; a goal opens its steps; New goal adds one", async () => {
  await tap('#ph-main a[href="#/goals"]'); await p.waitForTimeout(250);
  const n = (await st()).groups.length; assert.equal(await p.locator(".ph-goal").count(), n);
  assert.match(await p.locator(".ph-goal").first().innerText(), /%/);
  await tap("[data-ph=newgoal]"); await D().waitFor({ state: "visible" }); await D().locator('[data-ak="g"]').fill("Read more"); await D().getByRole("button", { name: "Add it" }).click(); await p.waitForTimeout(300);
  assert.equal(await p.locator(".ph-goal").count(), n + 1); assert.equal(await sideways(), false);
});
const sub = async (name) => Object.values((await st()).subs).find((x) => x.name === name);
const msg = () => p.locator("#ph-s-msg").innerText();
const openStep = async (name) => { await go("goal/" + (await st()).groups.find((g) => g.name.startsWith("Garden Shed")).id); await p.locator("[data-ph=step]", { hasText: name }).click(); await p.waitForTimeout(300); };
await ok("a goal opens its own page, with its id in the address", async () => {
  await p.locator(".ph-goal", { hasText: "Garden Shed" }).click(); await p.waitForTimeout(250);
  assert.match(await p.evaluate(() => location.hash), /^#\/goal\/.+/);
  assert.match(await p.locator("#ph-main h1").innerText(), /Garden Shed/);
  const dock = await p.locator(".ph-dock [data-ph=addstep]").boundingBox(); assert.ok(dock && dock.y > 844 * 0.6, "Add a step is not under the thumb: " + JSON.stringify(dock));
  assert.equal(await p.locator('#ph-tabs [data-tab="you"]').getAttribute("aria-current"), "page");
});
await ok("Add a step is a sheet with Speak; Add and Enter both add, a repeat is kept, and it comes back for the next one", async () => {
  await tap("[data-ph=addstep]"); await D().waitFor({ state: "visible" });
  assert.equal(await D().locator('[data-mic-to="n"]').isVisible(), true, "no Speak on the step box");
  await D().getByRole("button", { name: "Add" }).click(); await p.waitForTimeout(150); assert.match(await D().innerText(), /first/);
  await D().locator('[data-ak="n"]').fill("Lay the base"); await D().getByRole("button", { name: "Add" }).click(); await p.waitForTimeout(300);
  assert.match(await D().innerText(), /Added .Lay the base/);
  await D().locator('[data-ak="n"]').fill("Fit the roof"); await D().locator('[data-ak="n"]').press("Enter"); await p.waitForTimeout(300);
  await D().locator('[data-ak="n"]').fill("Oil the hinges"); await D().locator('[data-ak="r"]').selectOption("monthly"); await D().getByRole("button", { name: "Add" }).click(); await p.waitForTimeout(300);
  await D().getByRole("button", { name: "Done" }).click(); await p.waitForTimeout(250); assert.equal(await D().count(), 0);
  const s = await sub("Lay the base"); assert.ok(s); assert.equal(s.prio, "mid"); assert.equal(s.streak, 0); assert.equal(s.rep, "");
  assert.ok(await sub("Fit the roof")); const o = await sub("Oil the hinges"); assert.equal(o.rep, "monthly"); assert.ok(o.period);
  assert.match(await p.locator("[data-ph=step]", { hasText: "Oil the hinges" }).innerText(), /Monthly/);
  assert.equal(await sideways(), false); await p.screenshot({ path: "/tmp/claude-0/ph-test-goal.png", fullPage: true });
});
await ok("a step opens its own page: every field except priority and its own date (the order and the delivery day replace them, 2026-10-20)", async () => {
  await p.locator("[data-ph=step]", { hasText: "Lay the base" }).click(); await p.waitForTimeout(300);
  assert.match(await p.evaluate(() => location.hash), /^#\/step\/.+/);
  for (const sel of ["#ph-s-name", "#ph-s-pct", "#ph-s-rep", "#ph-s-tag", "#ph-s-goal"]) assert.equal(await p.locator(sel).count(), 1, sel); assert.equal(await p.locator("#ph-s-due").count(), 0);
  assert.equal(await p.locator('[data-ph=sset][data-k=status]').count(), 4); assert.equal(await p.locator('[data-ph=sset][data-k=prio]').count(), 0);
  for (const k of ["stoday", "swhen", "sest", "sdone", "sdel"]) assert.equal(await p.locator(`[data-ph=${k}]`).count(), 1, k);
  assert.equal(await sideways(), false); await p.screenshot({ path: "/tmp/claude-0/ph-test-step.png", fullPage: true });
});
await ok("the name saves on Enter; an empty name is refused and put back", async () => {
  await p.fill("#ph-s-name", "Lay the concrete base"); await p.press("#ph-s-name", "Enter"); await p.waitForTimeout(250);
  assert.ok(await sub("Lay the concrete base")); assert.match(await p.locator("#ph-s-h").innerText(), /concrete/);
  await p.fill("#ph-s-name", "  "); await p.press("#ph-s-name", "Enter"); await p.waitForTimeout(250);
  assert.ok(await sub("Lay the concrete base")); assert.equal(await p.locator("#ph-s-name").inputValue(), "Lay the concrete base"); assert.match(await msg(), /needs a name/);
});
await ok("typing on the step page survives a background redraw", async () => {
  await p.fill("#ph-s-tag", "Build"); await p.evaluate(() => window.__board.render()); assert.equal(await p.locator("#ph-s-tag").inputValue(), "Build");
  await p.press("#ph-s-tag", "Enter"); await p.waitForTimeout(200); assert.equal((await sub("Lay the concrete base")).tag, "Build");
});
await ok("status and percent follow the same rules as the classic editor", async () => {
  const N = "Lay the concrete base";
  await tap('[data-ph=sset][data-k=status][data-v=doing]'); await p.waitForTimeout(200); assert.equal((await sub(N)).status, "doing");
  await p.evaluate(() => { const r = document.getElementById("ph-s-pct"); r.value = "40"; r.dispatchEvent(new Event("input", { bubbles: true })); r.dispatchEvent(new Event("change", { bubbles: true })); });
  await p.waitForTimeout(200); assert.equal((await sub(N)).pct, 40); assert.match(await p.locator("#ph-main").innerText(), /40%/);
  await tap('[data-ph=sset][data-k=status][data-v=done]'); await p.waitForTimeout(200); assert.equal((await sub(N)).pct, 100);
  await tap('[data-ph=sset][data-k=status][data-v=todo]'); await p.waitForTimeout(200); const s = await sub(N); assert.equal(s.status, "todo"); assert.equal(s.pct, 95);
  assert.equal(await p.locator('[data-ph=sset][data-k=status][data-v=todo]').getAttribute("aria-pressed"), "true");
});
await ok("repeats are saved", async () => {
  const N = "Lay the concrete base";
  await p.selectOption("#ph-s-rep", "weekly"); await p.waitForTimeout(250); const s = await sub(N); assert.equal(s.rep, "weekly"); assert.equal(s.pct, 0); assert.equal(s.status, "todo");
  await p.selectOption("#ph-s-rep", ""); await p.waitForTimeout(250); assert.equal((await sub(N)).rep, "");
});
await ok("When and How long are asked and shown on the step page", async () => {
  await tap("[data-ph=swhen]"); await D().waitFor({ state: "visible" }); await D().locator('[data-ak="t"]').fill("After lunch"); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  assert.match(await p.locator("[data-ph=swhen]").innerText(), /After lunch/);
  await tap("[data-ph=sest]"); await D().waitFor({ state: "visible" }); await D().locator('[data-ak="m"]').fill("25"); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  assert.match(await p.locator("[data-ph=sest]").innerText(), /25 min/);
});
await ok("Put it in Today, then Mark it done", async () => {
  await openStep("Fit the roof"); await tap("[data-ph=stoday]"); await p.waitForTimeout(300);
  const id = (await sub("Fit the roof")).id; assert.ok((await st()).oftad.some((c) => c.id === id), "not in Today");
  assert.equal(await p.locator("[data-ph=stoday]").isDisabled(), true);
  await tap("[data-ph=sdone]"); await p.waitForTimeout(300); assert.equal((await sub("Fit the roof")).status, "done");
  assert.equal(await p.locator("[data-ph=sdone]").count(), 0);
});
await ok("a reload on a step page opens the same step", async () => {
  await p.reload(); await p.waitForSelector("#ph-s-name"); assert.equal(await p.locator("#ph-s-name").inputValue(), "Fit the roof");
});
await ok("the Goal box moves the step to another goal", async () => {
  const to = (await st()).groups.find((g) => g.name === "Read more").id;
  await p.selectOption("#ph-s-goal", to); await p.waitForTimeout(300);
  assert.equal((await sub("Fit the roof")).gid, to); assert.match(await msg(), /Moved to Read more/);
  assert.match(await p.locator("#ph-main .ph-nav").innerText(), /Read more/);
});
await ok("Remove this step asks first; Keep it keeps it; Remove it removes it and goes back to the goal", async () => {
  await openStep("Lay the concrete base");
  await tap("[data-ph=sdel]"); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /Remove this step\?/);
  await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(250); assert.ok(await sub("Lay the concrete base"));
  await tap("[data-ph=sdel]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(400);
  assert.equal(await sub("Lay the concrete base"), undefined); assert.match(await p.evaluate(() => location.hash), /^#\/goal\//);
});
await ok("Edit changes the goal's name, delivery day, work and tags", async () => {
  await tap("[data-ph=gedit]"); await D().waitFor({ state: "visible" });
  assert.equal(await D().getByRole("button", { name: "Move it to the Backlog" }).count(), 1);
  await D().locator('[data-ak="n"]').fill("Garden Shed 2027"); assert.equal(await D().getByRole("button", { name: "High" }).count(), 0);
  await D().locator('[data-ak="d"]').fill("2027-03-01"); await D().locator('[data-ak="w"]').selectOption("work"); await D().locator('[data-ak="t"]').fill("Home, DIY");
  await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  const g = (await st()).groups.find((x) => x.name === "Garden Shed 2027"); assert.ok(g, "not renamed");
  assert.equal(g.due, "2027-03-01"); assert.equal(g.where, "work"); assert.deepEqual(g.tags, ["home", "diy"]);
  const t = await p.locator("#ph-main").innerText(); assert.match(t, /Work/); assert.match(t, /#diy/);
});
await ok("a Today item on Now opens its step page", async () => {
  await go("now"); const it = p.locator(".ph-item-b").first(); const nm = (await it.innerText()).trim();
  await it.click(); await p.waitForTimeout(300); assert.match(await p.evaluate(() => location.hash), /^#\/step\//);
  assert.equal(await p.locator("#ph-s-name").inputValue(), nm); await go("goals");
});
/* 2026-10-19, the owner: drop the plum as a theme, keep it for the buttons only */
await ok("the phone is plain greys with plum only on buttons; the desktop keeps its colours", async () => {
  const c = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return { pri: cs.getPropertyValue("--ph-pri").trim(), ground: cs.getPropertyValue("--ground").trim(), bar: document.querySelector('meta[name="theme-color"][media*="light"]').content }; });
  assert.equal(c.pri.toUpperCase(), "#2C1332"); assert.equal(c.ground.toUpperCase(), "#F2F2F7"); assert.equal(c.bar.toUpperCase(), "#F2F2F7");
  assert.equal(await p.locator("[data-ph=newgoal]").evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(44, 19, 50)");
  /* the card a goal sits on is plain white, not tinted */
  assert.equal(await p.locator(".ph-goal").first().evaluate((e) => { for (let x = e; x; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; if (b !== "rgba(0, 0, 0, 0)") return b; } return ""; }), "rgb(255, 255, 255)");
  await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(100);
  const d = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return { panel: cs.getPropertyValue("--panel").trim(), ground: cs.getPropertyValue("--ground").trim() }; });
  assert.equal(d.panel.toUpperCase(), "#1C1C1E"); assert.equal(d.ground.toUpperCase(), "#000000");
  await p.screenshot({ path: "/tmp/claude-0/ph-test-goals-dark.png" }); await p.emulateMedia({ colorScheme: "light" });
});
await ok("Backlog opens (as a phone page, or on older builds the old page under a Back bar), and Back returns to You", async () => {
  await go("backlog"); assert.equal(await p.locator(".masthead").isVisible(), false);
  if (await p.locator("#ph-back").isVisible()) {
    assert.equal(await p.locator("#ph-back-t").innerText(), "Backlog"); assert.equal(await p.locator("#v-backlog").isVisible(), true);
    await p.locator("#ph-back a").click();
  } else {
    /* builds from 2026-10-18: the phone's own Backlog page */
    assert.equal((await p.locator("#ph-main h1").innerText()).trim(), "Backlog"); assert.equal(await p.locator("#v-backlog").isVisible(), false);
    await p.locator("#ph-main .ph-nav").click();
  }
  await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), "#/you");
});
/* ---------- the four iPhone breaks from the HIG review (2026-10-17) ---------- */
const textBoxesUnder16 = () => p.evaluate(() => [...document.querySelectorAll("input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea")]
  .filter((e) => e.getClientRects().length && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => (e.id || e.getAttribute("data-ak") || e.tagName) + " " + getComputedStyle(e).fontSize));
const under44 = (sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length)
  .map((e) => [((e.innerText || e.value || e.getAttribute("aria-label") || e.id) + "").trim().slice(0, 20), e.getBoundingClientRect().height]).filter((x) => x[1] < 44), sel);
await ok("iPhone: no text box under 16px on Goals, the goal page, the step page, Talk or a journal sheet", async () => {
  const bad = [];
  await go("goals"); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); bad.push(...await textBoxesUnder16());
  await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(250); bad.push(...await textBoxesUnder16());
  await tap('#ph-tabs [data-tab="talk"]'); await p.waitForTimeout(250); bad.push(...await textBoxesUnder16());
  await tap('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(200); await tap("[data-ph=jr][data-kind=end]"); await D().waitFor({ state: "visible" });
  bad.push(...await textBoxesUnder16()); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  assert.deepEqual(bad, []);
});
await ok("iPhone: dialog buttons, Talk controls and segmented controls are 44px or more", async () => {
  const bad = [];
  await tap('#ph-tabs [data-tab="talk"]'); await p.waitForTimeout(250); bad.push(...await under44("#botsheet button, #bot-input"));
  await go("goals"); bad.push(...await under44(".ph-seg a, .ph-nav, .ph-dock button"));
  await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(250);
  bad.push(...await under44(".ph-segb button, .ph-nav, .ph-range, .ph-rowb"));
  await tap("[data-ph=sdel]"); await D().waitFor({ state: "visible" }); bad.push(...await under44("dialog.ask[open] button")); await D().getByRole("button", { name: "Keep it" }).click();
  await tap('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(200); await tap("[data-ph=jr][data-kind=end]"); await D().waitFor({ state: "visible" });
  bad.push(...await under44("dialog.ask[open] button")); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  assert.deepEqual(bad, []);
});
/* its own context: a full-page screenshot earlier drops Playwright's touch emulation for the rest of the page's life */
await ok("iPhone: turning the phone sideways keeps the phone app and the same page, with bottom sheets", async () => {
  const lc = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  const q = await lc.newPage();
  try {
    await q.goto(URL); await q.waitForSelector("#ph-main"); await q.evaluate(() => { location.hash = "#/goals"; }); await q.waitForTimeout(300);
    await q.locator(".ph-goal").first().click(); await q.waitForTimeout(250); await q.locator("[data-ph=step]").first().click(); await q.waitForTimeout(250);
    const h = await q.evaluate(() => location.hash), nm = await q.locator("#ph-s-name").inputValue();
    await q.setViewportSize({ width: 844, height: 390 }); await q.waitForTimeout(400);
    assert.equal(await q.evaluate(() => document.documentElement.classList.contains("ph")), true, "the desktop board came up");
    assert.equal(await q.evaluate(() => location.hash), h); assert.equal(await q.locator("#ph-s-name").inputValue(), nm);
    assert.equal(await q.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await q.locator("[data-ph=sdel]").click(); const d = q.locator("dialog.ask[open]"); await d.waitFor({ state: "visible" }); await q.waitForTimeout(300);
    const bx = await d.boundingBox(); assert.ok(Math.abs(bx.y + bx.height - 390) < 2, "the sheet is not at the bottom: " + JSON.stringify(bx));
    await d.getByRole("button", { name: "Keep it" }).click();
    await q.setViewportSize({ width: 390, height: 844 }); await q.waitForTimeout(300);
    assert.equal(await q.evaluate(() => document.documentElement.classList.contains("ph")), true);
  } finally { await lc.close(); }
});
await ok("iPhone: the system draws the status bar (default style); the band is the ground and has no height in a browser tab", async () => {
  assert.equal(await p.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute("content"), "default");
  const band = () => p.evaluate(() => { const e = document.getElementById("sbar"); return { bg: getComputedStyle(e).backgroundColor, h: e.getBoundingClientRect().height }; });
  let b1 = await band(); assert.equal(b1.bg, "rgb(242, 242, 247)"); assert.equal(b1.h, 0);
  await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(100); b1 = await band(); assert.equal(b1.bg, "rgb(0, 0, 0)");
  await p.emulateMedia({ colorScheme: "light" }); await go("you");
});
/* ---------- plum everywhere (2026-10-17) ---------- */
const REDS = ["rgb(228, 36, 24)", "rgb(255, 59, 48)", "rgb(184, 28, 18)", "rgb(255, 122, 114)", "rgba(255, 59, 48, 0.5)"];
const redsIn = (sel) => p.evaluate(([sel, REDS]) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && !e.closest(".ask-err,.ph-danger,.bot-msg.err,dialog.danger"))
  .flatMap((e) => { const c = getComputedStyle(e); return ["color", "backgroundColor", "borderTopColor"].filter((k) => REDS.includes(c[k]) && !(k === "borderTopColor" && c.borderTopWidth === "0px")).map((k) => (e.id || e.className || e.tagName) + " " + k); }), [sel, REDS]);
const moulded = (sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && /inset|-6px -6px|-3px -3px/.test(getComputedStyle(e).boxShadow)).map((e) => e.id || e.className), sel);
await ok("plum: labels are sentence case in the body font, 13px or more, and Do this now is in the text colour", async () => {
  await p.evaluate(() => { window.__board.energy(3); }); await go("now"); assert.ok(await p.locator(".ph-hot").count(), "Now shows: " + (await p.locator("#ph-main").innerText()).slice(0, 300));
  const k = await p.evaluate(() => [...document.querySelectorAll(".ph-k")].filter((e) => e.getClientRects().length).map((e) => { const c = getComputedStyle(e); return [c.textTransform, c.fontFamily.includes("DM Mono"), parseFloat(c.fontSize)]; }));
  assert.ok(k.length > 0); for (const [t, mono, fs] of k) { assert.equal(t, "none"); assert.equal(mono, false); assert.ok(fs >= 13, "label " + fs + "px"); }
  assert.equal(await p.locator(".ph-hot").first().evaluate((e) => getComputedStyle(e).color), "rgb(0, 0, 0)");
});
await ok("plum: Talk and a journal sheet have no red and no moulded shadows; their labels are not capitals", async () => {
  await tap('#ph-tabs [data-tab="talk"]'); await p.waitForTimeout(250);
  await p.focus("#bot-input"); assert.deepEqual(await redsIn("#botsheet, #botsheet *"), []); assert.deepEqual(await moulded("#botsheet, #botsheet *"), []);
  assert.equal(await p.locator("#bot-clear").evaluate((e) => getComputedStyle(e).textTransform), "none");
  await tap('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(200); await tap("[data-ph=jr][data-kind=end]"); await D().waitFor({ state: "visible" });
  await D().locator('[data-ak="a"]').focus();
  assert.deepEqual(await redsIn("dialog.ask[open], dialog.ask[open] *"), []); assert.deepEqual(await moulded("dialog.ask[open] *"), []);
  assert.equal(await D().locator("label").first().evaluate((e) => getComputedStyle(e).textTransform), "none");
  assert.doesNotMatch(await D().innerText(), /microphone on your phone/);
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
});
await ok("plum: text follows the phone's text size, tab labels stay put, and nothing goes sideways", async () => {
  await go("now"); const t0 = await p.locator(".ph-task").evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  await p.evaluate(() => { document.documentElement.style.fontSize = "34px"; }); await p.waitForTimeout(150);
  const t1 = await p.locator(".ph-task").evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  assert.ok(Math.abs(t1 / t0 - 2) < 0.05, `task title ${t0} -> ${t1}`);
  assert.equal(await p.locator('#ph-tabs [data-tab="now"]').evaluate((e) => getComputedStyle(e).fontSize), "12px");
  assert.equal(await sideways(), false);
  await go("goals"); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(250);
  assert.equal(await sideways(), false);
  await p.evaluate(() => { document.documentElement.style.fontSize = ""; });
});
await ok("icons: the home-screen icon and the Android icon are the name on Moonlit Plum; the launch colour is the dark ground", async () => {
  const r = await p.evaluate(async () => {
    const corner = async (src) => { const im = new Image(); im.src = src + "?t=" + Date.now(); await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
      const x = c.getContext("2d"); x.drawImage(im, 0, 0); return [...x.getImageData(4, 4, 1, 1).data].slice(0, 3).join(","); };
    const m = await (await fetch("manifest.webmanifest", { cache: "no-store" })).json();
    return { apple: await corner("apple-touch-icon.png"), mask: await corner(m.icons.find((i) => i.purpose === "maskable").src), bg: m.background_color };
  });
  assert.equal(r.apple, "44,19,50"); assert.equal(r.mask, "44,19,50"); assert.equal(r.bg.toUpperCase(), "#000000");
  await go("you");
});
/* ---------- navigation (2026-10-17) ---------- */
const ev = async () => ((await st()).ev || []).map((e) => e.k);
const undoBar = () => p.locator("#ph-undo");
await ok("nav: Back is a chevron and the page it returns to, the same on Goals, a goal, a step and an old page", async () => {
  const back = async () => p.locator("#ph-main .ph-nav, #ph-back .ph-nav").filter({ visible: true }).first();
  await go("goals"); let b = await back(); assert.equal((await b.innerText()).trim(), "You"); assert.equal(await b.getAttribute("aria-label"), "Back to You"); assert.equal(await b.locator("svg").count(), 1);
  await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); b = await back(); assert.equal((await b.innerText()).trim(), "Goals");
  const gname = (await p.locator("#ph-main h1").innerText()).trim();
  await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(250); b = await back(); assert.ok(gname.startsWith((await b.innerText()).trim().replace("…", "")));
  await b.click(); await p.waitForTimeout(250); assert.match(await p.evaluate(() => location.hash), /^#\/goal\//);
  await go("backlog"); b = await back(); assert.equal((await b.innerText()).trim(), "You"); assert.equal(await b.locator("svg").count(), 1);
  const colour = await b.evaluate((e) => getComputedStyle(e).color); assert.equal(colour, "rgb(0, 0, 0)");
  await go("you");
});
await ok("nav: rows that open something end in a chevron; rows that switch at once do not", async () => {
  await go("you");
  assert.equal(await p.locator(".ph-tile .ph-chev").count(), 4);
  for (const k of ["dayend", "goodn", "easyedit", "remind", "planner", "learned", "account", "backup"]) assert.ok(await p.locator(`[data-ph=${k}] .ph-chev`).count() >= 1, k);
  for (const k of ["theme", "classic"]) assert.equal(await p.locator(`[data-ph=${k}] .ph-chev`).count(), 0, k);
  await go("goals"); assert.equal(await p.locator(".ph-goal .ph-chev").count(), await p.locator(".ph-goal").count());
  await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); assert.equal(await p.locator("[data-ph=step] .ph-chev").count(), await p.locator("[data-ph=step]").count());
  await go("now"); assert.equal(await p.locator(".ph-item-b .ph-chev").count(), await p.locator(".ph-item-b").count());
});
await ok("nav: the main action of Goals and a goal is in a dock under the thumb; You has nothing top right", async () => {
  await go("goals"); let bx = await p.locator(".ph-dock [data-ph=newgoal]").boundingBox(); assert.ok(bx.y > 844 * 0.6 && bx.y + bx.height < 844, JSON.stringify(bx));
  await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); bx = await p.locator(".ph-dock [data-ph=addstep]").boundingBox(); assert.ok(bx.y > 844 * 0.6 && bx.y + bx.height < 844, JSON.stringify(bx));
  assert.equal(await p.locator("#ph-main .ph-head .ph-chip").count(), 0, "a chip is still top right");
  await go("you"); assert.equal(await p.locator("#ph-main .ph-head .ph-chip").count(), 0); assert.equal(await p.locator("[data-ph=account]").count(), 1);
});
await ok("nav: nothing said twice: no bar above the step form, no count beside Steps, no Assistant title in Talk", async () => {
  await go("goals"); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250);
  assert.equal(await p.locator("section[aria-label=Steps] .ph-row-h .ph-k").count(), 0);
  await p.locator("[data-ph=step]").first().click(); await p.waitForTimeout(250); assert.equal(await p.locator("#ph-main > div .ph-bar").count(), 0);
  await tap('#ph-tabs [data-tab="talk"]'); await p.waitForTimeout(250); assert.equal(await p.locator(".bot-name").isVisible(), false);
  /* Talk, made calm (2026-10-22): New chat shows only once there is a chat */
  assert.equal(await p.locator("#bot-clear").isVisible(), (await p.locator("#bot-log .bot-turn").count()) > 0);
  await go("you");
});
await ok("nav: a sheet has a grabber; a short pull springs back, a long pull closes it", async () => {
  await tap('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(200); await tap("[data-ph=jr][data-kind=end]"); await D().waitFor({ state: "visible" }); await p.waitForTimeout(300);
  assert.equal(await D().locator(".ask-grab").isVisible(), true);
  const h3 = await D().locator("h3").boundingBox(), x = h3.x + 40, y = h3.y + h3.height / 2;
  await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x, y + 30, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(200);
  assert.equal(await D().count(), 1, "a short pull closed it");
  await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x, y + 160, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300);
  assert.equal(await D().count(), 0, "a long pull did not close it");
});
await ok("nav: Done shows Undo; Undo puts the step back and the log keeps a done and an undo", async () => {
  await go("goals"); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250);
  await tap("[data-ph=addstep]"); await D().waitFor({ state: "visible" }); await D().locator('[data-ak="n"]').fill("Sand the door"); await D().locator('[data-ak="n"]').press("Enter"); await p.waitForTimeout(250);
  await D().getByRole("button", { name: "Done" }).click(); await p.waitForTimeout(200);
  await p.locator("[data-ph=step]", { hasText: "Sand the door" }).click(); await p.waitForTimeout(250); await tap("[data-ph=stoday]"); await p.waitForTimeout(250);
  await go("now"); const n0 = (await ev()).length;
  await p.locator(".ph-item", { hasText: "Sand the door" }).locator("[data-ph=done]").click(); await p.waitForTimeout(300);
  assert.equal(await undoBar().isVisible(), true); assert.match(await undoBar().innerText(), /Done: Sand the door/);
  assert.equal((await sub("Sand the door")).status, "done");
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300);
  const s = await sub("Sand the door"); assert.notEqual(s.status, "done"); assert.equal(await undoBar().isVisible(), false);
  assert.ok(!(await st()).done.some((c) => c.id === s.id) && (await st()).oftad.some((c) => c.id === s.id), "not back in Today");
  const k = (await ev()).slice(n0); assert.ok(k.includes("done") && k.includes("undo"), "log: " + k.join(","));
});
await ok("nav: a ticked step reopens from its ring, with Undo", async () => {
  await p.locator(".ph-item", { hasText: "Sand the door" }).locator("[data-ph=done]").click(); await p.waitForTimeout(300);
  await p.locator(".ph-item", { hasText: "Sand the door" }).locator("[data-ph=reopen]").click(); await p.waitForTimeout(300);
  const s = await sub("Sand the door"); assert.notEqual(s.status, "done"); assert.match(await undoBar().innerText(), /Back in Today/);
  assert.ok((await st()).oftad.some((c) => c.id === s.id));
});
await ok("nav: Undo refuses when something else changed in between, and keeps the later change", async () => {
  await p.locator(".ph-item", { hasText: "Sand the door" }).locator("[data-ph=done]").click(); await p.waitForTimeout(300);
  await tap("[data-ph=energy]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: /^Full/ }).click(); await p.waitForTimeout(250);
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300);
  assert.equal((await sub("Sand the door")).status, "done", "undo went through over a later change");
  assert.equal(await p.locator("[data-ph=energy]").getAttribute("data-l"), "4");
  await p.evaluate(() => { window.__board.energy(3); window.__board.render(); }); await go("now"); assert.equal(await p.locator("[data-ph=energy]").getAttribute("data-l"), "3");
});
await ok("nav: archiving a goal can be undone, and Undo hides by itself after 6 seconds", async () => {
  await go("goals"); const name = (await p.locator(".ph-goal .ph-goal-n").first().innerText()).trim(), n = (await st()).groups.length;
  await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250); await tap("[data-ph=gedit]"); await D().waitFor({ state: "visible" });
  await D().getByRole("button", { name: "Archive this goal" }).click(); await p.waitForTimeout(400);
  assert.equal((await st()).groups.length, n - 1); assert.match(await undoBar().innerText(), /Archived/);
  const ub = await p.locator("#ph-undo-b").boundingBox(), dk = await p.locator(".ph-dock button").boundingBox(); assert.ok(ub.y + ub.height <= dk.y, "Undo covers the dock");
  await p.locator("#ph-undo-b").click(); await p.waitForTimeout(300);
  assert.equal((await st()).groups.length, n); assert.ok((await st()).groups.some((g) => g.name === name));
  await p.locator(".ph-item, .ph-goal").first().waitFor(); await p.locator(".ph-goal").first().click(); await p.waitForTimeout(250);
  await tap("[data-ph=addstep]"); await D().waitFor({ state: "visible" }); await D().locator('[data-ak="n"]').fill("Timer check"); await D().locator('[data-ak="n"]').press("Enter"); await p.waitForTimeout(250);
  await D().getByRole("button", { name: "Done" }).click(); await p.waitForTimeout(200);
  await p.locator("[data-ph=step]", { hasText: "Timer check" }).click(); await p.waitForTimeout(250); await tap("[data-ph=sdone]"); await p.waitForTimeout(200);
  assert.equal(await undoBar().isVisible(), true); await p.waitForTimeout(6300); assert.equal(await undoBar().isVisible(), false);
  await go("you");
});
/* a fresh context: an earlier full-page screenshot drops touch emulation */
await ok("nav: a swipe in from the left edge goes Back; a swipe that starts mid-screen or runs down does not", async () => {
  /* its own browser with Chromium's edge swipe (history Back) turned off, and the page told it is on the home screen,
     so the check proves the board's own swipe and nothing else */
  const sb = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--disable-features=OverscrollHistoryNavigation"] });
  const lc = await sb.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  await lc.addInitScript(() => { Object.defineProperty(navigator, "standalone", { value: true, configurable: true }); window.__h = []; addEventListener("hashchange", () => window.__h.push(location.hash)); });
  const q = await lc.newPage(), cdp = await lc.newCDPSession(q);
  const swipe = async (x0, y0, x1, y1) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * i / 8, y: y0 + (y1 - y0) * i / 8 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await q.waitForTimeout(350);
  };
  try {
    await q.goto(URL); await q.waitForSelector("#ph-main"); await q.evaluate(() => { location.hash = "#/goals"; }); await q.waitForTimeout(300);
    await q.locator(".ph-goal").first().click(); await q.waitForTimeout(250); await q.locator("[data-ph=step]").first().click(); await q.waitForTimeout(300);
    await swipe(200, 400, 380, 400); assert.match(await q.evaluate(() => location.hash), /^#\/step\//, "a mid-screen swipe went back");
    await swipe(6, 300, 30, 600); assert.match(await q.evaluate(() => location.hash), /^#\/step\//, "a downward drag went back");
    await swipe(6, 400, 240, 410); assert.match(await q.evaluate(() => location.hash), /^#\/goal\//);
    await swipe(6, 400, 240, 410); assert.equal(await q.evaluate(() => location.hash), "#/goals", "goal to goals");
    await swipe(6, 400, 240, 410); assert.equal(await q.evaluate(() => location.hash), "#/you", "goals to you");
    await swipe(6, 400, 240, 410); assert.equal(await q.evaluate(() => location.hash), "#/you", "a top-level page has nowhere to go back to");
    assert.equal(await q.evaluate(() => document.getElementById("ph-main").style.transform), "");
    /* in a browser tab the board leaves the edge to the browser */
    await q.evaluate(() => { Object.defineProperty(navigator, "standalone", { value: false, configurable: true }); location.hash = "#/goals"; }); await q.waitForTimeout(300);
    await swipe(6, 400, 240, 410); assert.equal(await q.evaluate(() => location.hash), "#/goals", "the board took the edge in a browser tab");
  } finally { await sb.close(); }
});
/* ---------- the tab bar, the iOS way (2026-10-17) ---------- */
/* only the tabs a phone shows: Calendar and Goals are in the markup for the web sidebar and hidden here */
await ok("tabs: the selected tab is the text colour with a filled icon and no pill; the rest are grey outlines; the bar is see-through", async () => {
  for (const [route, tab] of [["now", "now"], ["journal", "journal"], ["goals", "you"]]) {
    await go(route);
    const t = await p.evaluate(() => [...document.querySelectorAll("#ph-tabs a")].filter((a) => a.offsetParent).map((a) => { const c = getComputedStyle(a), o = a.querySelector(".ti-o"), f = a.querySelector(".ti-f");
      return { tab: a.dataset.tab, cur: a.getAttribute("aria-current"), color: c.color, bg: c.backgroundColor, o: getComputedStyle(o).display !== "none", f: getComputedStyle(f).display !== "none", h: a.getBoundingClientRect().height }; }));
    for (const x of t) {
      assert.ok(x.h >= 44, x.tab + " is " + x.h + "px");
      assert.equal(x.bg, "rgba(0, 0, 0, 0)", x.tab + " has a pill");
      if (x.tab === tab) { assert.equal(x.cur, "page"); assert.equal(x.color, "rgb(0, 0, 0)"); assert.ok(x.f && !x.o, x.tab + " is not filled"); }
      else { assert.equal(x.cur, null); assert.equal(x.color, "rgb(99, 99, 102)"); assert.ok(x.o && !x.f, x.tab + " is not an outline"); }
    }
  }
  assert.match(await p.locator("#ph-tabs").evaluate((e) => getComputedStyle(e).backdropFilter || getComputedStyle(e).webkitBackdropFilter), /blur/);
  await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(100);
  assert.equal(await p.locator('#ph-tabs [aria-current="page"]').evaluate((e) => getComputedStyle(e).color), "rgb(255, 255, 255)");
  await p.locator("#ph-tabs").screenshot({ path: "/tmp/claude-0/ph-test-tabs-dark.png" });
  await p.emulateMedia({ colorScheme: "light" }); await p.locator("#ph-tabs").screenshot({ path: "/tmp/claude-0/ph-test-tabs-light.png" });
  await go("you");
});
/* 2026-10-19, the owner: the phone app is for phones only, with no Classic view */
await ok("there is no Classic view on the phone, and a Classic view left from before gives way to the phone app", async () => {
  await go("you"); assert.equal(await p.locator("[data-ph=classic]").count(), 0); assert.doesNotMatch(await p.locator("#ph-main").innerText(), /Classic view/);
  assert.equal(await p.locator("#btn-phone").count(), 0);
  await p.evaluate(() => localStorage.setItem("oys-classic", "1")); await p.reload(); await p.waitForSelector("#ph-tabs");
  assert.equal(await p.locator("#ph-tabs").isVisible(), true); assert.equal(await p.locator(".masthead").isVisible(), false);
  assert.equal(await p.evaluate(() => localStorage.getItem("oys-classic")), null);
});
await ok("no page errors (phone)", async () => { assert.deepEqual(errs, []); });
await ctx.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
