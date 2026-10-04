import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const KEY = "oys-min-deliveries-v1";
const URL = process.env.BOARD_URL || "http://localhost:8731/index.html";
const results = []; const ok = async (n, f) => { try { await f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addInitScript(() => {
  /* the board must never use the browser's own windows */
  window.__native = []; ["alert", "confirm", "prompt", "open"].forEach((k) => { window[k] = function () { window.__native.push(k); return null; }; });
  window.__rp = 0;
  function N() {} Object.defineProperty(N, "permission", { get() { return sessionStorage.getItem("perm") || "default"; } });
  N.requestPermission = () => { window.__rp++; sessionStorage.setItem("perm", "denied"); return Promise.resolve("denied"); };
  try { Object.defineProperty(window, "Notification", { value: N, configurable: true, writable: true }); } catch (e) { window.Notification = N; }
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.waitForSelector(".row.pick");
const D = () => p.locator("dialog.ask[open]");
const ask = (o) => p.evaluate((o) => { window.__res = undefined; const f = o.check ? new Function("v", o.check) : undefined; const q = Object.assign({}, o); if (f) q.check = f; window.__board.askUser(q).then((r) => { window.__res = r === undefined ? "undef" : r; }); }, o);
const res = () => p.evaluate(() => window.__res);
const settle = () => p.waitForTimeout(150);

// ---- the helper ---------------------------------------------------------------------------------------------------
await ok("yes resolves true; Not now resolves false", async () => {
  await ask({ title: "Q1", body: "Line one.\n\nLine two.", ok: "Do it" }); await D().waitFor();
  assert.equal(await D().locator("p").count() >= 2, true); await D().locator("[data-aok]").click(); await settle(); assert.equal(await res(), true);
  await ask({ title: "Q2" }); await D().waitFor(); await D().locator("[data-acancel]").click(); await settle(); assert.equal(await res(), false);
});
await ok("Escape cancels, and so does a click outside the box", async () => {
  await ask({ title: "Q3" }); await D().waitFor(); await p.keyboard.press("Escape"); await settle(); assert.equal(await res(), false); assert.equal(await D().count(), 0);
  await ask({ title: "Q4" }); await D().waitFor(); await p.mouse.click(5, 5); await settle(); assert.equal(await res(), false); assert.equal(await D().count(), 0);
});
await ok("it is a real modal: the page behind cannot be reached, and Tab stays inside", async () => {
  await ask({ title: "Q5", fields: [{ k: "a", label: "A", kind: "text" }] }); await D().waitFor();
  assert.equal(await p.evaluate(() => document.querySelector("dialog.ask[open]").matches(":modal")), true);
  for (let i = 0; i < 7; i++) { await p.keyboard.press("Tab"); assert.equal(await p.evaluate(() => !!document.activeElement.closest("dialog.ask")), true, "focus left the dialog on Tab " + i); }
  for (let i = 0; i < 4; i++) { await p.keyboard.press("Shift+Tab"); assert.equal(await p.evaluate(() => !!document.activeElement.closest("dialog.ask")), true); }
  await p.keyboard.press("Escape"); await settle();
});
await ok("focus: a plain question starts on the yes, a destructive one on the way out, and focus returns to the opener", async () => {
  const btn = p.locator("#btn-backup"); await btn.focus();
  await ask({ title: "Plain" }); await D().waitFor(); assert.equal(await p.evaluate(() => document.activeElement.hasAttribute("data-aok")), true); await p.keyboard.press("Escape"); await settle();
  assert.equal(await p.evaluate(() => document.activeElement.id), "btn-backup");
  await ask({ title: "Danger", danger: true }); await D().waitFor(); assert.equal(await p.evaluate(() => document.activeElement.hasAttribute("data-acancel")), true);
  await p.keyboard.press("Enter"); await settle(); assert.equal(await res(), false, "Enter on a destructive question must not confirm it");
});
await ok("fields: values come back, Enter submits, pick buttons work, a failed check keeps it open", async () => {
  await ask({ title: "F", fields: [{ k: "t", label: "Text", kind: "text", value: "hi" }, { k: "n", label: "Num", kind: "number", value: 5 }, { k: "w", label: "Pick", kind: "pick", value: "a", opts: [["a", "A"], ["b", "B"]] }], check: "return v.t==='bad' ? 'Not that.' : ''" });
  await D().waitFor(); await D().locator('[data-ak="t"]').fill("bad"); await D().locator("[data-aok]").click(); await settle();
  assert.equal(await D().count(), 1); assert.match(await D().locator(".ask-err").innerText(), /Not that/);
  await D().locator('[data-ak="t"]').fill("good"); await D().locator('[data-ak="n"]').fill("9"); await D().locator('[data-av="b"]').click();
  assert.equal(await D().locator('[data-av="b"]').getAttribute("aria-pressed"), "true"); await D().locator('[data-ak="t"]').press("Enter"); await settle();
  assert.deepEqual(await res(), { t: "good", n: "9", w: "b" });
  await ask({ title: "G", fields: [{ k: "t", label: "T", kind: "text" }] }); await D().waitFor(); await p.keyboard.press("Escape"); await settle(); assert.equal(await res(), null);
});
await ok("questions queue and appear one at a time", async () => {
  await p.evaluate(() => { window.__r = []; window.__board.askUser({ title: "First" }).then((r) => window.__r.push("a" + r)); window.__board.askUser({ title: "Second" }).then((r) => window.__r.push("b" + r)); });
  await D().waitFor(); assert.equal(await p.locator("dialog.ask[open]").count(), 1); assert.match(await D().innerText(), /First/);
  await D().locator("[data-aok]").click(); await settle(); assert.match(await D().innerText(), /Second/); await D().locator("[data-acancel]").click(); await settle();
  assert.deepEqual(await p.evaluate(() => window.__r), ["atrue", "bfalse"]);
});
await ok("text is escaped", async () => {
  await ask({ title: "<img src=x onerror=window.__x=1>", body: "<b>x</b>" }); await D().waitFor(); assert.equal(await D().locator("img, b").count(), 0); assert.equal(await p.evaluate(() => window.__x), undefined); await p.keyboard.press("Escape"); await settle();
});

// ---- the hand-built overlays ------------------------------------------------------------------------------------------
await ok("the interview locks the page behind it, labels itself, and gives focus back on Escape", async () => {
  await p.locator("#pl-interview").evaluate((el) => el.click()).catch(() => {}); await p.waitForTimeout(100);
  if (!(await p.locator("#interview").isVisible())) await p.evaluate(() => document.querySelector("#pl-interview, #now-interview").click());
  await p.locator("#interview").waitFor({ state: "visible" });
  assert.equal(await p.locator("#interview").getAttribute("role"), "dialog"); assert.equal(await p.locator("#interview").getAttribute("aria-modal"), "true");
  assert.equal(await p.evaluate(() => !!document.querySelector("#btn-remind").closest("[inert]") && !!document.querySelector("#btn-backup").closest("[inert]") && !document.querySelector("#interview").closest("[inert]")), true);
  assert.equal(await p.evaluate(() => !!document.activeElement.closest("#interview")), true);
  await p.keyboard.press("Escape"); await settle();
  assert.equal(await p.locator("#interview").isHidden(), true); assert.equal(await p.evaluate(() => !!document.querySelector("[inert]")), false);
});
await ok("the account box does the same", async () => {
  await p.locator("#btn-account").click(); await p.locator("#account").waitFor({ state: "visible" });
  assert.equal(await p.evaluate(() => !!document.querySelector("#btn-backup").closest("[inert]") && !document.querySelector("#account").closest("[inert]")), true);
  assert.equal(await p.evaluate(() => !!document.activeElement.closest("#account")), true);
  await p.keyboard.press("Escape"); await settle(); assert.equal(await p.locator("#account").isHidden(), true); assert.equal(await p.evaluate(() => !!document.querySelector("[inert]")), false);
  assert.equal(await p.evaluate(() => document.activeElement.id), "btn-account");
});

// ---- the converted questions ----------------------------------------------------------------------------------------------
await ok("backup opens as a dialog, and its reset asks first and keeps the board on Not now", async () => {
  await p.locator("#btn-backup").click(); await p.locator("#backup").waitFor({ state: "visible" });
  assert.equal(await p.evaluate(() => document.querySelector("#backup").matches(":modal")), true);
  await p.locator("#io-reset").click(); await p.locator("dialog.ask[open]:not(#backup)").waitFor(); assert.match(await p.locator("dialog.ask[open]:not(#backup)").innerText(), /Reset the board\?/);
  assert.equal(await p.evaluate(() => document.activeElement.hasAttribute("data-acancel")), true);
  await p.keyboard.press("Escape"); await settle();
  assert.ok(await p.evaluate((K) => !!localStorage.getItem(K), KEY), "the board must still be there");
  assert.equal(await p.locator("#backup").isVisible(), true, "the backup dialog stays open under the question");
  await p.locator("#backup-close").click(); await settle(); assert.equal(await p.locator("#backup").isHidden(), true);
});
await ok("reset really resets when confirmed", async () => {
  await p.evaluate((K) => { const s = JSON.parse(localStorage.getItem(K)); s.marker = "keep-me"; localStorage.setItem(K, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector(".row.pick");
  await p.locator("#btn-backup").click(); await p.locator("#io-reset").click(); await p.locator("dialog.ask[open]:not(#backup)").waitFor();
  await Promise.all([p.waitForNavigation(), p.locator("dialog.ask[open]:not(#backup) [data-aok]").click()]); await p.waitForSelector(".row.pick");
  assert.equal(await p.evaluate((K) => JSON.parse(localStorage.getItem(K)).marker, KEY), undefined);
});
await ok("erase memory and forget hints ask first, and change nothing on Not now", async () => {
  await p.evaluate((K) => { const s = JSON.parse(localStorage.getItem(K)); s.mem = [{ id: "m1", st: "kept", t: "I work best in the morning", src: "you", at: "2026-10-01" }]; s.hintLog = [{ d: "2026-10-01", type: "progress", key: "k", ans: "helpful" }]; localStorage.setItem(K, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForSelector(".row.pick");
  const st = () => p.evaluate((K) => { const s = JSON.parse(localStorage.getItem(K)); return { mem: s.mem.length, log: s.hintLog.length }; }, KEY);
  await p.evaluate(() => { location.hash = "#/planner"; }); await p.waitForTimeout(300);
  await p.locator("#mem-erase").click(); await D().waitFor(); assert.match(await D().innerText(), /Erase everything/); assert.match(await D().innerText(), /1 note/);
  await p.keyboard.press("Escape"); await settle(); assert.equal((await st()).mem, 1);
  await p.locator("#hint-reset").click(); await D().waitFor(); assert.match(await D().innerText(), /Forget which hints helped/); await p.keyboard.press("Escape"); await settle(); assert.equal((await st()).log, 1);
  await p.locator("#mem-erase").click(); await D().waitFor(); await D().locator("[data-aok]").click(); await settle(); assert.equal((await st()).mem, 0);
  await p.locator("#hint-reset").click(); await D().waitFor(); await D().locator("[data-aok]").click(); await settle(); assert.equal((await st()).log, 0);
});
await ok("reminders: the explainer comes before the browser's prompt, and Not now never reaches it", async () => {
  await p.evaluate(() => { sessionStorage.setItem("perm", "default"); location.hash = "#/board"; }); await p.reload(); await p.waitForSelector(".row.pick");
  await p.locator("#btn-remind").click(); await D().waitFor(); const t = await D().innerText(); assert.match(t, /Turn on reminders\?/); assert.match(t, /At most 3 a day/); assert.match(t, /day ends at \d\d:\d\d/);
  assert.equal(await p.evaluate(() => window.__rp), 0); await D().locator("[data-acancel]").click(); await settle(); assert.equal(await p.evaluate(() => window.__rp), 0);
  await p.locator("#btn-remind").click(); await D().waitFor(); await D().locator("[data-aok]").click(); await settle(); assert.equal(await p.evaluate(() => window.__rp), 1);
  await p.locator("#btn-remind").click(); await D().waitFor(); assert.match(await D().innerText(), /blocked/); assert.equal(await D().locator("[data-aok]").count(), 0); await p.keyboard.press("Escape"); await settle();
});

// ---- small screens ---------------------------------------------------------------------------------------------------------------------
await ok("at 412px it is a bottom sheet that fits, with no sideways scroll", async () => {
  await p.setViewportSize({ width: 412, height: 800 });
  await ask({ title: "Narrow", body: "Some words that wrap.", fields: [{ k: "a", label: "A", kind: "text" }] }); await D().waitFor(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const b = document.querySelector("dialog.ask[open]").getBoundingClientRect(); return { l: b.left, r: b.right, bottom: b.bottom, w: innerWidth, h: innerHeight, sx: document.documentElement.scrollWidth }; });
  assert.ok(r.l >= 0 && r.r <= r.w + 0.5, JSON.stringify(r)); assert.ok(Math.abs(r.bottom - r.h) < 2, "sits at the bottom " + JSON.stringify(r)); assert.ok(r.sx <= r.w, "no sideways scroll " + JSON.stringify(r));
  await p.keyboard.press("Escape"); await settle(); await p.setViewportSize({ width: 1280, height: 1000 });
});
await ok("the board never used a browser alert, confirm, prompt or window.open", async () => { assert.deepEqual(await p.evaluate(() => window.__native), []); });
await ok("no page errors", async () => { assert.deepEqual(errs, []); });
console.log(results.join("\n")); await b.close(); process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
