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
  assert.match(await p.locator("#ph-main").innerText(), /One next step, every day/);
  assert.equal(await p.locator("#ph-tabs").isVisible(), false); assert.equal(await p.locator(".masthead").isVisible(), false);
  assert.equal(await sideways(), false); await p.screenshot({ path: "/tmp/claude-0/ph-test-welcome.png" });
});
await ok("Your day: a time after the day end is refused, and the step does not move on", async () => {
  await tap("[data-ph=onb-next]"); await p.waitForTimeout(150);
  await p.fill("#ph-end", "18:00"); await p.fill("#ph-pm", "19:00"); await tap("[data-ph=onb-next]"); await p.waitForTimeout(150);
  assert.match(await p.locator("#ph-onb-err").innerText(), /after your day ends/); assert.equal(await p.locator(".ph-steps").getAttribute("aria-label"), "Step 2 of 3");
});
await ok("Your day saves the day end and the person's reminder choices", async () => {
  await p.fill("#ph-end", "21:00"); await p.fill("#ph-pm", "16:00"); await tap("[data-ph=tog][data-k=am][data-v=off]"); await p.waitForTimeout(100);
  assert.equal(await p.locator("#ph-end").inputValue(), "21:00", "a typed value was lost when a switch was pressed");
  await tap("[data-ph=onb-next]"); await p.waitForTimeout(300);
  const me = (await st()).me; assert.equal(me.wind, "21:00"); assert.equal(me.remAm, false); assert.equal(me.remPm, true); assert.equal(me.pmAt, "16:00");
  assert.equal(await p.locator(".ph-steps").getAttribute("aria-label"), "Step 3 of 3");
});
await ok("the first goal and step are added, and Now opens with the four tabs", async () => {
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await tap("[data-ph=onb-done]"); await p.waitForTimeout(400);
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
await ok("Something else gives the full reason and can show the next one", async () => {
  first = await p.locator(".ph-task").innerText();
  await tap("[data-ph=else]"); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /Why this one/);
  await D().getByRole("button", { name: "Show me the next one" }).click(); await p.waitForTimeout(300);
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
await ok("the day-size button makes today a rough day", async () => {
  await tap("[data-ph=dose]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: /Rough day/ }).click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("[data-ph=dose]").innerText(), "Rough day");
});
await ok("Journal: write the end of the day with the dialog, and it is listed with its time", async () => {
  await tap('#ph-tabs [data-tab="journal"]'); await p.waitForTimeout(250);
  await tap("[data-ph=jr][data-kind=end]"); await D().waitFor({ state: "visible" }); assert.equal(await D().locator("[data-mic-to]").count(), 2);
  await D().locator('[data-ak="a"]').fill("Bought the timber"); await D().locator('[data-ak="b"]').fill("Cut the frame"); await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  const t = await p.locator("#ph-main").innerText(); assert.match(t, /Bought the timber/); assert.match(t, /\d\d:\d\d/); assert.equal(await sideways(), false);
});
await ok("yesterday's note shows as one line on Now, and opens the Journal", async () => {
  await p.evaluate(([JKEY, YEST]) => { localStorage.setItem(JKEY, JSON.stringify({ v: 1, log: [{ id: "j1", at: new Date(Date.now() - 864e5).toISOString(), d: YEST, tm: "21:40", kind: "end", a: "Shipped", b: "Call the bank" }] })); }, [JKEY, YEST]);
  await p.reload(); await p.waitForSelector("#ph-main"); await go("now");
  const s = p.locator(".ph-strip"); assert.match(await s.innerText(), /yesterday/i); assert.match(await s.innerText(), /Call the bank/);
  await s.click(); await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), "#/journal"); assert.match(await p.locator("#ph-main").innerText(), /where you left off/i);
});
await ok("Talk is the chat as a full page with Speak, and it closes when you leave it", async () => {
  await tap('#ph-tabs [data-tab="talk"]'); await p.waitForTimeout(300);
  assert.equal(await p.locator("#botsheet").isVisible(), true); assert.equal(await p.locator("#bot-mic").isVisible(), true);
  await p.fill("#bot-input", "help"); await p.press("#bot-input", "Enter"); await p.waitForTimeout(200);
  assert.match(await p.locator("#bot-log").innerText(), /JOURNAL/);
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
  assert.equal(await p.locator("#ph-newstep").isVisible(), true); assert.equal(await p.locator('[data-ph=mic][data-for="ph-newstep"]').isVisible(), true);
  assert.equal(await p.locator('#ph-tabs [data-tab="you"]').getAttribute("aria-current"), "page");
});
await ok("Add works with the button, with Enter, and with a repeat, and makes the same step as the classic Add", async () => {
  await tap("[data-ph=addstep]"); await p.waitForTimeout(150); assert.match(await p.locator("#ph-onb-hint").innerText(), /first/);
  await p.fill("#ph-newstep", "Lay the base"); await tap("[data-ph=addstep]"); await p.waitForTimeout(300);
  await p.fill("#ph-newstep", "Fit the roof"); await p.press("#ph-newstep", "Enter"); await p.waitForTimeout(300);
  await p.fill("#ph-newstep", "Oil the hinges"); await p.selectOption("#ph-newrep", "monthly"); await tap("[data-ph=addstep]"); await p.waitForTimeout(300);
  const s = await sub("Lay the base"); assert.ok(s); assert.equal(s.prio, "mid"); assert.equal(s.streak, 0); assert.equal(s.rep, "");
  assert.ok(await sub("Fit the roof")); const o = await sub("Oil the hinges"); assert.equal(o.rep, "monthly"); assert.ok(o.period);
  assert.match(await p.locator("[data-ph=step]", { hasText: "Oil the hinges" }).innerText(), /Monthly/);
  assert.equal(await p.locator("#ph-newstep").inputValue(), ""); assert.equal(await sideways(), false);
  await p.screenshot({ path: "/tmp/claude-0/ph-test-goal.png", fullPage: true });
});
await ok("a half-typed step survives a background redraw", async () => {
  await p.fill("#ph-newstep", "Half typed"); await p.evaluate(() => window.__board.render()); assert.equal(await p.locator("#ph-newstep").inputValue(), "Half typed");
  await p.fill("#ph-newstep", "");
});
await ok("a step opens its own page with every field the classic editor has", async () => {
  await p.locator("[data-ph=step]", { hasText: "Lay the base" }).click(); await p.waitForTimeout(300);
  assert.match(await p.evaluate(() => location.hash), /^#\/step\/.+/);
  for (const sel of ["#ph-s-name", "#ph-s-pct", "#ph-s-due", "#ph-s-rep", "#ph-s-tag", "#ph-s-goal"]) assert.equal(await p.locator(sel).count(), 1, sel);
  assert.equal(await p.locator('[data-ph=sset][data-k=status]').count(), 4); assert.equal(await p.locator('[data-ph=sset][data-k=prio]').count(), 3);
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
await ok("priority, deadline (and Clear), and repeats are saved", async () => {
  const N = "Lay the concrete base";
  await tap('[data-ph=sset][data-k=prio][data-v=high]'); await p.waitForTimeout(200); assert.equal((await sub(N)).prio, "high");
  await p.fill("#ph-s-due", "2027-02-01"); await p.waitForTimeout(250); assert.equal((await sub(N)).due, "2027-02-01");
  await tap("[data-ph=nodue]"); await p.waitForTimeout(250); assert.equal((await sub(N)).due, "");
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
  assert.match(await p.locator("#ph-main .ph-backl").innerText(), /Read more/);
});
await ok("Remove this step asks first; Keep it keeps it; Remove it removes it and goes back to the goal", async () => {
  await openStep("Lay the concrete base");
  await tap("[data-ph=sdel]"); await D().waitFor({ state: "visible" }); assert.match(await D().innerText(), /Remove this step\?/);
  await D().getByRole("button", { name: "Keep it" }).click(); await p.waitForTimeout(250); assert.ok(await sub("Lay the concrete base"));
  await tap("[data-ph=sdel]"); await D().waitFor({ state: "visible" }); await D().getByRole("button", { name: "Remove it" }).click(); await p.waitForTimeout(400);
  assert.equal(await sub("Lay the concrete base"), undefined); assert.match(await p.evaluate(() => location.hash), /^#\/goal\//);
});
await ok("Edit changes the goal's name, priority, deadline, place and tags", async () => {
  await tap("[data-ph=gedit]"); await D().waitFor({ state: "visible" });
  assert.equal(await D().getByRole("button", { name: "Move it to the Backlog" }).count(), 1);
  await D().locator('[data-ak="n"]').fill("Garden Shed 2027"); await D().getByRole("button", { name: "High" }).click();
  await D().locator('[data-ak="d"]').fill("2027-03-01"); await D().locator('[data-ak="w"]').selectOption("home"); await D().locator('[data-ak="t"]').fill("Home, DIY");
  await D().getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(300);
  const g = (await st()).groups.find((x) => x.name === "Garden Shed 2027"); assert.ok(g, "not renamed");
  assert.equal(g.prio, "high"); assert.equal(g.due, "2027-03-01"); assert.equal(g.where, "home"); assert.deepEqual(g.tags, ["home", "diy"]);
  const t = await p.locator("#ph-main").innerText(); assert.match(t, /at home/i); assert.match(t, /#diy/);
});
await ok("a Today item on Now opens its step page", async () => {
  await go("now"); const it = p.locator(".ph-item-b").first(); const nm = (await it.innerText()).trim();
  await it.click(); await p.waitForTimeout(300); assert.match(await p.evaluate(() => location.hash), /^#\/step\//);
  assert.equal(await p.locator("#ph-s-name").inputValue(), nm); await go("goals");
});
await ok("the phone wears Moonlit Plum; the desktop keeps its colours", async () => {
  const c = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return { pri: cs.getPropertyValue("--ph-pri").trim(), bar: document.querySelector('meta[name="theme-color"][media*="light"]').content }; });
  assert.equal(c.pri.toUpperCase(), "#2C1332"); assert.equal(c.bar.toUpperCase(), "#F6F2F7");
  assert.equal(await p.locator("[data-ph=newgoal]").evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(44, 19, 50)");
  await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(100);
  assert.equal((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--panel").trim())).toUpperCase(), "#2C1332");
  await p.screenshot({ path: "/tmp/claude-0/ph-test-goals-dark.png" }); await p.emulateMedia({ colorScheme: "light" });
});
await ok("Backlog opens the old page under a Back bar, and Back returns to You", async () => {
  await go("backlog"); assert.equal(await p.locator("#ph-back").isVisible(), true); assert.equal(await p.locator("#ph-back-t").innerText(), "Backlog");
  assert.equal(await p.locator("#v-backlog").isVisible(), true); assert.equal(await p.locator(".masthead").isVisible(), false);
  await p.locator("#ph-back a").click(); await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), "#/you");
});
await ok("Classic view brings the old board back, and Phone view returns", async () => {
  await tap("[data-ph=classic]"); await p.waitForTimeout(300);
  assert.equal(await p.locator(".masthead").isVisible(), true); assert.equal(await p.locator("#ph").isVisible(), false);
  assert.equal(await p.locator("#btn-phone").isVisible(), true);
  await p.reload(); await p.waitForSelector(".masthead"); assert.equal(await p.locator(".masthead").isVisible(), true, "classic did not survive a reload");
  await p.locator("#btn-phone").click(); await p.waitForTimeout(300);
  assert.equal(await p.locator("#ph-tabs").isVisible(), true); assert.equal(await p.locator(".masthead").isVisible(), false);
});
await ok("no page errors (phone)", async () => { assert.deepEqual(errs, []); });
await ctx.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
await b.close(); process.exit(0);
