/* Google Calendar (owner, 2026-10-21): connect, read the next 7 days, add meetings and reminders, delete only what
   Qordel added, a page of its own on the phone and the desktop, and the tutor sees busy times (names only when allowed).
   Google is faked here: its sign-in script and the Calendar API are answered by this test, so no real calendar is
   touched. The page gets a test client id in place of the empty one. */
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const ROOT = process.env.APP_ROOT || new globalThis.URL("..", import.meta.url).pathname.replace(/\/$/, "");
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = "1";   /* the service worker fetches the page after the first load; the route must see that too */
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const errs = [];
const PAGE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/((index|delivery-board)\.html)?(\?[^#]*)?$/;
const FAKE_GIS = `window.google={accounts:{oauth2:{
  initTokenClient:function(cfg){ return {requestAccessToken:function(o){ var n=(window.__gis=window.__gis||[]).push({prompt:o&&o.prompt, scope:cfg.scope, client:cfg.client_id});
    setTimeout(function(){ if(window.__gisDeny) cfg.callback({error:"access_denied"}); else cfg.callback({access_token:"tok-"+n, expires_in:3600, scope:cfg.scope}); },10); }}; },
  hasGrantedAllScopes:function(r,s){ return String(r.scope||"").indexOf(s)>=0; },
  revoke:function(t,cb){ window.__revoked=t; if(cb) cb(); }}}};`;
const day = (add, h, m) => { const d = new Date(); d.setDate(d.getDate() + add); d.setHours(h, m || 0, 0, 0); return d; };
const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const TODAY = ymd(day(0, 0)), TOMORROW = ymd(day(1, 0));
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, POST, DELETE" };

/* a phone (or desktop) context with the test client id and a fake Google */
async function open({ setUp = true, viewport = { width: 390, height: 844 }, phone = true, cache = null } = {}) {
  const api = { items: [
      { id: "g1", summary: "Lunch", start: { dateTime: day(0, 12).toISOString() }, end: { dateTime: day(0, 13).toISOString() }, status: "confirmed" },
      { id: "g2", iCalUID: "u-team", summary: "Team sync", start: { dateTime: day(0, 19).toISOString() }, end: { dateTime: day(0, 20).toISOString() }, status: "confirmed",
        attendees: [{ email: "sam@example.com" }], description: "private notes", location: "Room 4" },
      { id: "g3", summary: "Holiday", start: { date: TOMORROW }, end: { date: ymd(day(2, 0)) }, status: "confirmed" },
      { id: "g4", summary: "Dentist", start: { dateTime: day(1, 10).toISOString() }, end: { dateTime: day(1, 10, 30).toISOString() }, status: "confirmed" },
      { id: "g5", summary: "Cancelled one", start: { dateTime: day(0, 21).toISOString() }, end: { dateTime: day(0, 22).toISOString() }, status: "cancelled" },
      /* a family calendar the person shows in Google, with the same invitation in it, and one they hide */
      { cal: "family@group.calendar.google.com", id: "f1", summary: "School run", start: { dateTime: day(0, 21).toISOString() }, end: { dateTime: day(0, 21, 30).toISOString() }, status: "confirmed" },
      { cal: "family@group.calendar.google.com", id: "f2", iCalUID: "u-team", summary: "Team sync", start: { dateTime: day(0, 19).toISOString() }, end: { dateTime: day(0, 20).toISOString() }, status: "confirmed" },
      { cal: "hidden@group.calendar.google.com", id: "h1", summary: "Hidden thing", start: { dateTime: day(0, 21, 30).toISOString() }, end: { dateTime: day(0, 22).toISOString() }, status: "confirmed" }],
    lists: [{ id: "me@example.com", primary: true, selected: true }, { id: "family@group.calendar.google.com", selected: true }, { id: "hidden@group.calendar.google.com", selected: false }],
    reqs: [], fail401: 0, n: 0 };
  const ctx = await b.newContext(phone ? { viewport, isMobile: true, hasTouch: true } : { viewport });
  if (setUp) await ctx.route(PAGE, async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace('var CAL_CLIENT="";', 'var CAL_CLIENT="test-client.apps.googleusercontent.com";') }); });
  await ctx.route("https://accounts.google.com/gsi/client", (r) => r.fulfill({ contentType: "text/javascript", body: FAKE_GIS }));
  await ctx.route(/^https:\/\/www\.googleapis\.com\/calendar\/v3\//, async (r) => {
    const q = r.request(), u = new globalThis.URL(q.url()), m = q.method();
    if (m === "OPTIONS") return r.fulfill({ status: 204, headers: CORS });
    api.reqs.push({ m, u, auth: q.headers().authorization, body: q.postData() });
    if (api.fail401 > 0) { api.fail401--; return r.fulfill({ status: 401, headers: CORS, body: "{}" }); }
    if (m === "GET" && /\/users\/me\/calendarList$/.test(u.pathname)) return r.fulfill({ headers: CORS, contentType: "application/json", body: JSON.stringify({ items: api.lists }) });
    const calId = decodeURIComponent((u.pathname.match(/\/calendars\/([^/]+)\/events/) || [])[1] || "");
    const inCal = (x) => (x.cal || "primary") === calId;
    if (m === "GET") {
      const a = new Date(u.searchParams.get("timeMin")), z = new Date(u.searchParams.get("timeMax"));
      const st = (x) => new Date(x.start.dateTime || x.start.date + "T00:00:00"), en = (x) => new Date(x.end.dateTime || x.end.date + "T00:00:00");
      return r.fulfill({ headers: CORS, contentType: "application/json", body: JSON.stringify({ items: api.items.filter((x) => inCal(x) && st(x) < z && en(x) > a) }) });
    }
    if (m === "POST") { const x = { ...JSON.parse(q.postData()), id: "q" + (++api.n), status: "confirmed" }; api.items.push(x); return r.fulfill({ headers: CORS, contentType: "application/json", body: JSON.stringify(x) }); }
    if (m === "DELETE") { const id = decodeURIComponent(u.pathname.split("/").pop()); api.items = api.items.filter((x) => x.id !== id); return r.fulfill({ status: 204, headers: CORS }); }
    r.fulfill({ status: 405, headers: CORS });
  });
  if (cache) await ctx.addInitScript(([k, c]) => { if (!sessionStorage.getItem("cal-set")) { sessionStorage.setItem("cal-set", "1"); localStorage.setItem(k, JSON.stringify(c)); } }, [KEY + ".cal", cache]);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  return { ctx, p, api };
}
async function onboard(p) {
  await p.waitForSelector("#ph-main .ph-onb"); await p.click("[data-ph=onb-next]"); await p.waitForTimeout(250);
  await p.fill("#ph-goal", "Garden Shed"); await p.fill("#ph-step", "Buy the timber"); await p.click("[data-ph=onb-done]"); await p.waitForTimeout(400);
}
const go = async (p, r) => { await p.evaluate((r) => { location.hash = "#/" + r; }, r); await p.waitForTimeout(350); };
const main = (p) => p.locator("#ph-main").innerText();
const dlg = (p) => p.locator("dialog.ask[open]");
const msg = (p) => p.locator("#ph-main .cal-msg").innerText();
const cal = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY + ".cal");

const { ctx, p, api } = await open(); await onboard(p);
await ok("You has a Google Calendar row; it opens a page of its own with Back to You", async () => {
  await go(p, "you"); const row = p.locator("[data-ph=calendar]");
  assert.match(await row.innerText(), /Google Calendar\s+Connect/); await row.click(); await p.waitForTimeout(350);
  assert.equal(await p.evaluate(() => location.hash), "#/calendar");
  assert.equal((await p.locator("#ph-main h1").innerText()).trim(), "Calendar");
  assert.equal(await p.locator("#ph-main .ph-nav").getAttribute("href"), "#/you");
  assert.equal(await p.locator('#ph-tabs [data-tab="you"]').getAttribute("aria-current"), "page");
  const t = await main(p); assert.match(t, /Qordel’s server does not keep it/); assert.match(t, /never guests, places or notes/); assert.match(t, /deletes only what Qordel added/);
});
await ok("Connect asks Google once with the calendar-events scope, then shows the next 7 days", async () => {
  await p.click("[data-cal=connect]"); await p.waitForTimeout(800);
  const gis = await p.evaluate(() => window.__gis);
  assert.equal(gis.length, 1); assert.equal(gis[0].prompt, "consent"); assert.equal(gis[0].scope, "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly");
  assert.equal(gis[0].client, "test-client.apps.googleusercontent.com");
  assert.match(await msg(p), /^Connected\. 5 events in the next 7 days\.$/);
  const t = await main(p);
  assert.match(t, /Today[\s\S]*12:00 to 13:00\s+Lunch[\s\S]*19:00 to 20:00\s+Team sync[\s\S]*Tomorrow[\s\S]*All day\s+Holiday[\s\S]*10:00 to 10:30\s+Dentist/);
  assert.doesNotMatch(t, /Cancelled one|Hidden thing/); assert.match(t, /21:00 to 21:30\s+School run/);
  assert.equal((t.match(/Team sync/g) || []).length, 1, "an invitation in 2 calendars is shown once"); assert.equal(await p.locator("#ph-main .cal-day").count(), 8, "7 days and the tutor section");
});
await ok("the read asks Google only for time, name and reminder, with the key, for 7 days", async () => {
  const ls = api.reqs.filter((r) => r.m === "GET" && /calendarList/.test(r.u.pathname)); assert.equal(ls.length, 1);
  assert.deepEqual(api.reqs.filter((r) => r.m === "GET" && /\/events$/.test(r.u.pathname)).map((r) => decodeURIComponent(r.u.pathname.split("/")[4])).sort(),
    ["family@group.calendar.google.com", "primary"], "reads the main calendar and the shown one, not the hidden one");
  const g = api.reqs.find((r) => r.m === "GET" && /\/events$/.test(r.u.pathname)); assert.equal(g.auth, "Bearer tok-1");
  const f = g.u.searchParams.get("fields"); assert.match(f, /summary/); assert.doesNotMatch(f, /attendees|description|location/);
  assert.equal(g.u.searchParams.get("singleEvents"), "true");
  assert.equal(Math.round((new Date(g.u.searchParams.get("timeMax")) - new Date(g.u.searchParams.get("timeMin"))) / 86400000), 7);
});
await ok("the calendar stays on this device, apart from the board: nothing of it is in the synced board", async () => {
  const c = await cal(p); assert.equal(c.on, true); assert.equal(c.ev.length, 5); assert.equal(JSON.stringify(c).includes("sam@example.com"), false);
  assert.equal(JSON.stringify(c).includes("Room 4"), false);
  const board = await p.evaluate((k) => localStorage.getItem(k), KEY); assert.equal(board.includes("Team sync"), false);
});
await ok("rule 6: Now shows what is still booked today, and the line opens the calendar", async () => {
  await go(p, "now"); const s = p.locator("#ph-main .ph-booked");
  assert.equal((await s.innerText()).replace(/\s+/g, " ").trim(), "Booked today 19:00 Team sync, 21:00 School run");
  assert.equal(await s.getAttribute("href"), "#/calendar"); await go(p, "calendar");
});
await ok("rule 6: booked hours make the day smaller, and the board says why", async () => {
  const dz = await p.evaluate(() => window.__board.dose());
  assert.equal(dz.n, 2); assert.equal(dz.booked, 150); assert.match(dz.why, /2\.5 hours are booked in your calendar today, so 2 steps\./);
});
await ok("Google's own events cannot be deleted from Qordel", async () => {
  assert.equal(await p.locator("#ph-main .cal-del").count(), 0);
});
await ok("Add meeting: a busy event with its alert, marked as Qordel's, and it can be deleted", async () => {
  await p.click("[data-cal=meeting]"); await dlg(p).waitFor();
  await p.fill("[data-ak=t]", "Plan review"); await p.fill("[data-ak=date]", TODAY); await p.fill("[data-ak=at]", "20:30"); await p.fill("[data-ak=end]", "21:15");
  await p.click("dialog.ask[open] [data-aok]"); await p.waitForTimeout(600);
  const post = JSON.parse(api.reqs.filter((r) => r.m === "POST").pop().body);
  assert.equal(api.reqs.filter((r) => r.m === "POST").pop().u.pathname, "/calendar/v3/calendars/primary/events");
  assert.equal(post.summary, "Plan review"); assert.equal(post.transparency, "opaque"); assert.equal(post.start.dateTime, TODAY + "T20:30:00");
  assert.equal(post.end.dateTime, TODAY + "T21:15:00"); assert.ok(post.start.timeZone); assert.deepEqual(post.reminders, { useDefault: false, overrides: [{ method: "popup", minutes: 10 }] });
  assert.deepEqual(post.extendedProperties, { private: { qordel: "meeting" } });
  assert.match(await msg(p), /Added to Google Calendar: Plan review/);
  assert.match(await main(p), /20:30 to 21:15\s+Plan review\s*Added by Qordel/);
  assert.equal(await p.locator("#ph-main .cal-del").count(), 1);
});
await ok("the meeting form refuses an end before the start", async () => {
  await p.click("[data-cal=meeting]"); await dlg(p).waitFor();
  await p.fill("[data-ak=t]", "Wrong"); await p.fill("[data-ak=at]", "15:00"); await p.fill("[data-ak=end]", "14:00");
  await p.click("dialog.ask[open] [data-aok]"); await p.waitForTimeout(200);
  assert.match(await p.locator("dialog.ask[open] .ask-err").innerText(), /The end has to be after the start/);
  await p.click("dialog.ask[open] [data-acancel]"); await p.waitForTimeout(300);
});
await ok("Add reminder: a 15-minute free event whose alert is the reminder", async () => {
  await p.click("[data-cal=reminder]"); await dlg(p).waitFor();
  await p.fill("[data-ak=t]", "Send the invoice"); await p.fill("[data-ak=date]", TODAY); await p.fill("[data-ak=at]", "21:00");
  await p.click("dialog.ask[open] [data-aok]"); await p.waitForTimeout(600);
  const post = JSON.parse(api.reqs.filter((r) => r.m === "POST").pop().body);
  assert.equal(post.transparency, "transparent"); assert.equal(post.end.dateTime, TODAY + "T21:15:00");
  assert.equal(post.reminders.overrides[0].minutes, 0); assert.equal(post.extendedProperties.private.qordel, "reminder");
  assert.match(await main(p), /21:00 to 21:15\s+Send the invoice\s*Reminder/);
  const free = (await p.locator("#ph-main .cal-ev.cal-free .cal-t").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
  assert.deepEqual(free, ["Send the invoice Reminder", "Holiday"], "all-day and reminder rows are not busy");
});
await ok("Delete asks first, then deletes only that event at Google", async () => {
  await p.click('#ph-main .cal-del[aria-label="Delete Send the invoice from Google Calendar"]'); await dlg(p).waitFor();
  assert.match(await dlg(p).innerText(), /Send the invoice/);
  await p.click("dialog.ask[open] [data-aok]"); await p.waitForTimeout(600);
  const del = api.reqs.filter((r) => r.m === "DELETE"); assert.equal(del.length, 1); assert.equal(del[0].u.pathname.split("/").pop(), "q2");
  assert.doesNotMatch((await p.locator("#ph-main .cal-grp").allInnerTexts()).join("\n"), /Send the invoice/); assert.match(await msg(p), /Deleted from Google Calendar: Send the invoice/);
});
await ok("the tutor sees busy times without names, unless the person turns names on", async () => {
  let t = await p.evaluate(() => window.__board.cal.tutor(2));
  assert.match(t, /names hidden, times only/); assert.match(t, /Today: 12:00-13:00, 19:00-20:00, 20:30-21:15, 21:00-21:30/); assert.match(t, /Tomorrow: all day, 10:00-10:30/);
  assert.match(t, /Next today: 19:00, in 60 minutes\./); assert.match(t, /Free for 60 minutes before the next busy slot\./);
  assert.doesNotMatch(t, /Team sync|Lunch|Dentist|Holiday/);
  assert.match(await p.evaluate(() => window.__board.mem.snap()), /CALENDAR \(Google/);
  const sw = p.locator("[data-cal=names]"); assert.equal(await sw.getAttribute("role"), "switch"); assert.equal(await sw.getAttribute("aria-checked"), "false");
  await sw.click(); await p.waitForTimeout(250);
  assert.equal(await p.locator("[data-cal=names]").getAttribute("aria-checked"), "true");
  t = await p.evaluate(() => window.__board.cal.tutor(2)); assert.match(t, /19:00-20:00 Team sync/); assert.doesNotMatch(t, /names hidden/);
  await p.locator("[data-cal=names]").click(); await p.waitForTimeout(200);
});
await ok("the tutor has get_calendar and propose_calendar_event, and the server allows exactly those", async () => {
  const names = await p.evaluate(() => window.__board.cal.tools()); assert.ok(names.includes("get_calendar")); assert.ok(names.includes("propose_calendar_event"));
  assert.ok(!names.some((n) => /delete.*calendar|calendar.*delete/.test(n)), "no delete tool");
  const srv = fs.readFileSync(ROOT + "/api/tutor.js", "utf8"); assert.match(srv, /"get_calendar", "propose_calendar_event"/); assert.match(srv, /call propose_calendar_event: the person sees/);
});
await ok("a meeting the tutor proposes is only filled in; nothing is added until the person presses Add", async () => {
  const before = api.reqs.filter((r) => r.m === "POST").length;
  const r = await p.evaluate((d) => window.__board.cal.propose({ kind: "meeting", title: "Focus block", date: d, start: "22:00", end: "23:00" }), TODAY);
  assert.match(r, /^Asked\./); await dlg(p).waitFor();
  assert.equal(await p.inputValue("[data-ak=t]"), "Focus block"); assert.equal(await p.inputValue("[data-ak=at]"), "22:00");
  assert.equal(api.reqs.filter((r) => r.m === "POST").length, before, "added before Add");
  await p.click("dialog.ask[open] [data-aok]"); await p.waitForTimeout(600);
  assert.equal(api.reqs.filter((r) => r.m === "POST").length, before + 1);
  assert.match(await main(p), /22:00 to 23:00\s+Focus block/);
});
await ok("Talk without the AI answers what is on the calendar today", async () => {
  const r = await p.evaluate(() => window.__board.brain("what's on my calendar"));
  assert.match(r, /^Today: 12:00 Lunch; 19:00 Team sync; 20:30 Plan review; 21:00 School run; 22:00 Focus block\.$/);
});
await ok("after a reload the page shows the kept events at once, and Refresh reuses the key in this tab", async () => {
  const gets = api.reqs.filter((r) => r.m === "GET").length;
  await p.reload(); await p.waitForTimeout(800); await go(p, "calendar");
  assert.match(await main(p), /Team sync/); assert.equal(api.reqs.filter((r) => r.m === "GET").length, gets, "fetched on load");
  await p.click("[data-cal=refresh]"); await p.waitForTimeout(700);
  assert.equal(api.reqs.filter((r) => r.m === "GET").length, gets + 3, "the list and 2 calendars"); assert.equal(api.reqs.filter((r) => r.m === "GET").pop().auth, "Bearer tok-1");
  assert.equal(await p.evaluate(() => (window.__gis || []).length), 0, "asked Google again");
});
await ok("an expired key says to press Refresh, and Refresh asks Google again", async () => {
  api.fail401 = 1; await p.click("[data-cal=refresh]"); await p.waitForTimeout(600);
  assert.match(await msg(p), /Google needs you to sign in again\. Press Refresh\./);
  await p.click("[data-cal=refresh]"); await p.waitForTimeout(800);
  assert.equal(await p.evaluate(() => (window.__gis || []).length), 1); assert.equal(await p.evaluate(() => window.__gis[0].prompt), "");
  assert.match(await msg(p), /^Updated\./);
});
await ok("the page is usable by touch: buttons and rows 44px or taller, no sideways scroll", async () => {
  const hs = await p.locator("#ph-main [data-cal]").evaluateAll((l) => l.map((e) => [e.getAttribute("data-cal"), Math.round(e.getBoundingClientRect().height)]));
  for (const [k, h] of hs) assert.ok(h >= 44, k + " " + h);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});
await ok("Disconnect asks, gives Google's key back and forgets the calendar on this device", async () => {
  await p.click("[data-cal=off]"); await dlg(p).waitFor(); await p.click("dialog.ask[open] [data-aok]"); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => window.__revoked), "tok-1"); assert.equal(await cal(p), null);
  assert.match(await msg(p), /Disconnected\. Your Google Calendar itself is not changed\./);
  assert.equal(await p.locator("[data-cal=connect]").count(), 1);
  await go(p, "you"); assert.match(await p.locator("[data-ph=calendar]").innerText(), /Connect/);
  assert.match(await p.evaluate(() => window.__board.cal.say()), /not connected/);
});
await ctx.close();

await ok("when Google access is refused, nothing is kept and Connect stays", async () => {
  const o = await open(); try {
    await onboard(o.p); await go(o.p, "calendar"); await o.p.evaluate(() => { window.__gisDeny = true; });
    await o.p.click("[data-cal=connect]"); await o.p.waitForTimeout(600);
    assert.match(await msg(o.p), /Google access was not given, so nothing changed\./); assert.equal(await cal(o.p), null);
    assert.equal(o.api.reqs.length, 0);
  } finally { await o.ctx.close(); }
});
await ok("rule 6: during a booking Now offers no task and says what is booked; without it the step comes back", async () => {
  const cache = { on: true, at: Date.now(), ev: [{ id: "x1", t: "Physio", s: day(0, 17, 30).toISOString(), e: day(0, 18, 30).toISOString(), all: false, busy: true, mine: "", rem: null }] };
  const o = await open({ cache }); try {
    await onboard(o.p); await go(o.p, "now");
    assert.equal(await o.p.locator("[data-ph=take]").count(), 0, "a task was offered");
    assert.match(await main(o.p), /Nothing is needed now[\s\S]*Booked until 18:30: Physio\./);
    assert.match((await o.p.locator("#ph-main .ph-booked").innerText()).replace(/\s+/g, " "), /Booked today 17:30 Physio/);
    await o.p.evaluate((k) => localStorage.removeItem(k), KEY + ".cal"); await o.p.reload(); await o.p.waitForTimeout(800); await go(o.p, "now");
    assert.equal(await o.p.locator("[data-ph=take]").count(), 1, "the step did not come back"); assert.equal(await o.p.locator("#ph-main .ph-booked").count(), 0);
  } finally { await o.ctx.close(); }
});
await ok("rule 6: with nothing more today, Now shows tomorrow's first booking, to get ready for", async () => {
  const cache = { on: true, at: Date.now(), ev: [{ id: "x2", t: "Hospital", s: day(1, 8).toISOString(), e: day(1, 9).toISOString(), all: false, busy: true, mine: "", rem: null },
    { id: "x3", t: "Lunch", s: day(0, 12).toISOString(), e: day(0, 13).toISOString(), all: false, busy: true, mine: "", rem: null }] };
  const o = await open({ cache }); try {
    await onboard(o.p); await go(o.p, "now");
    assert.equal((await o.p.locator("#ph-main .ph-booked").innerText()).replace(/\s+/g, " ").trim(), "Tomorrow 08:00 Hospital");
    assert.equal((await o.p.evaluate(() => window.__board.dose())).n, 3, "1 hour booked does not shrink the day");
  } finally { await o.ctx.close(); }
});
await ok("the desktop has a Calendar tab with the same page", async () => {
  const cache = { on: true, at: Date.now(), ev: [{ id: "g2", t: "Team sync", s: day(0, 19).toISOString(), e: day(0, 20).toISOString(), all: false, busy: true, mine: "", rem: null }] };
  const o = await open({ phone: false, viewport: { width: 1300, height: 900 }, cache }); try {
    const line = o.p.locator("#booked-line"); assert.equal(await line.isVisible(), true);
    assert.equal((await line.innerText()).replace(/\s+/g, " ").trim(), "Booked today 19:00 Team sync"); assert.equal(await line.getAttribute("href"), "#/calendar");
    const tab = o.p.locator('#rail [data-view="calendar"]'); assert.equal(await tab.count(), 1);
    await tab.click(); await o.p.waitForTimeout(400);
    assert.equal(await o.p.locator("#v-calendar").isVisible(), true); assert.equal(await tab.getAttribute("aria-current"), "page");
    assert.match(await o.p.locator("#cal-body").innerText(), /Today[\s\S]*19:00 to 20:00\s+Team sync/);
    assert.equal(await o.p.locator("#cal-body [data-cal=meeting]").count(), 1);
  } finally { await o.ctx.close(); }
});
await ok("without a client id the row and the page say it is coming soon, with no developer words, and nothing loads Google", async () => {
  const o = await open({ setUp: false }); try {
    await onboard(o.p); await go(o.p, "you"); assert.match(await o.p.locator("[data-ph=calendar]").innerText(), /Coming soon/);
    await go(o.p, "calendar"); assert.match(await main(o.p), /coming to Qordel soon/); assert.doesNotMatch(await main(o.p), /client id|notes\//); assert.equal(await o.p.locator("[data-cal]").count(), 0);
    assert.equal(await o.p.evaluate(() => !!document.querySelector('script[src*="accounts.google.com"]')), false);
  } finally { await o.ctx.close(); }
});
await ok("the policy lets the page reach Google's sign-in and the Calendar API, and nothing else new", async () => {
  const v = fs.readFileSync(ROOT + "/vercel.json", "utf8");
  assert.match(v, /script-src 'self' 'unsafe-inline' https:\/\/accounts\.google\.com\/gsi\/client;/);
  assert.match(v, /connect-src 'self' https:\/\/phicqgnzqnuwugzbgxxw\.supabase\.co https:\/\/www\.googleapis\.com https:\/\/accounts\.google\.com\/gsi\/;/);
  assert.match(v, /frame-src https:\/\/accounts\.google\.com\/gsi\/;/);
});
await ok("no page errors", () => assert.deepEqual(errs, []));
await b.close();
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
