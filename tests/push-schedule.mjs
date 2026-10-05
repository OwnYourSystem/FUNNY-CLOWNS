import assert from "node:assert/strict";
import { dueKind, cleanSub, localParts, validEndpoint, pastDayEnd, hm } from "../supabase/functions/push/schedule.js";
const r = []; const ok = (n, f) => { try { f(); r.push("PASS " + n); } catch (e) { r.push("FAIL " + n + ": " + e.message); } };
const sub = (o) => ({ tz: "Europe/Copenhagen", brief: "07:30", wind: "22:30", am: true, pm: true, last_am: null, last_pm: null, ...o });
const at = (iso) => new Date(iso);
ok("the brief is due from its time, in the person's zone", () => {
  assert.equal(dueKind(sub(), at("2026-10-05T05:29:00Z")), null);       // 07:29 local (CEST, +2)
  assert.equal(dueKind(sub(), at("2026-10-05T05:30:00Z")), "am");       // 07:30 local
});
ok("the same instant is a different hour in another zone", () => {
  assert.equal(dueKind(sub({ tz: "America/New_York" }), at("2026-10-05T05:30:00Z")), null);
  assert.equal(dueKind(sub({ tz: "America/New_York" }), at("2026-10-05T11:30:00Z")), "am");
});
ok("once a day: a sent brief is not sent again", () => {
  assert.equal(dueKind(sub({ last_am: "2026-10-05" }), at("2026-10-05T06:00:00Z")), null);
  assert.equal(dueKind(sub({ last_am: "2026-10-04" }), at("2026-10-05T06:00:00Z")), "am");
});
ok("a brief more than 90 minutes late is dropped", () => {
  assert.equal(dueKind(sub(), at("2026-10-05T07:00:00Z")), "am");        // 09:00 local = 90 min
  assert.equal(dueKind(sub(), at("2026-10-05T07:01:00Z")), null);
});
ok("the afternoon check is due from 15:00 for 90 minutes, once", () => {
  const b = { last_am: "2026-10-05" };
  assert.equal(dueKind(sub(b), at("2026-10-05T12:59:00Z")), null);
  assert.equal(dueKind(sub(b), at("2026-10-05T13:00:00Z")), "pm");
  assert.equal(dueKind(sub({ ...b, last_pm: "2026-10-05" }), at("2026-10-05T13:00:00Z")), null);
  assert.equal(dueKind(sub(b), at("2026-10-05T14:31:00Z")), null);
});
ok("nothing at or after the day end", () => {
  assert.equal(dueKind(sub({ wind: "15:30", last_am: "x" }), at("2026-10-05T13:20:00Z")), "pm");
  assert.equal(dueKind(sub({ wind: "15:30" }), at("2026-10-05T13:30:00Z")), null);
  assert.equal(dueKind(sub({ brief: "22:45" }), at("2026-10-05T20:50:00Z")), null);
});
ok("a day that ends after midnight is still open at 23:00 and over at 00:45 until 04:00", () => {
  assert.equal(pastDayEnd("00:30", 23 * 60), false); assert.equal(pastDayEnd("00:30", 45), true); assert.equal(pastDayEnd("00:30", 4 * 60), false);
});
ok("a turned-off kind is never sent", () => {
  assert.equal(dueKind(sub({ am: false }), at("2026-10-05T06:00:00Z")), null);
  assert.equal(dueKind(sub({ pm: false, last_am: "2026-10-05" }), at("2026-10-05T13:30:00Z")), null);
});
ok("at most 2 a day, over a whole month and a summer-time change, for 4 zones", () => {
  for (const tz of ["Europe/Copenhagen", "America/Los_Angeles", "Asia/Kolkata", "Pacific/Auckland"]) {
    let s = sub({ tz }), sent = {}, t = Date.parse("2026-10-20T00:00:00Z");
    for (let i = 0; i < 12 * 24 * 30; i++, t += 5 * 60000) {       // every 5 minutes, 30 days (Europe changes 25 Oct, US 1 Nov)
      const k = dueKind(s, new Date(t)); if (!k) continue;
      const d = localParts(new Date(t), tz).date; sent[d] = (sent[d] || 0) + 1;
      s = { ...s, ["last_" + k]: d };
    }
    const days = Object.values(sent); assert.ok(days.length >= 28, tz + " days " + days.length); assert.ok(days.every((n) => n <= 2), tz);
    assert.ok(days.filter((n) => n === 2).length >= 27, tz + " both kinds nearly every day");
  }
});
ok("a bad zone sends nothing", () => { assert.equal(dueKind(sub({ tz: "Mars/Base" }), at("2026-10-05T06:00:00Z")), null); });
const good = { sub: { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "B" + "x".repeat(86), auth: "y".repeat(22) } }, tz: "Europe/Copenhagen", brief: "07:30", wind: "22:30", am: true, pm: false };
ok("a good subscribe is accepted and cleaned", () => { const c = cleanSub(good); assert.ok(c.row); assert.equal(c.row.pm, false); assert.equal(c.row.tz, "Europe/Copenhagen"); });
ok("the server only ever calls a known push service over https", () => {
  for (const u of ["https://fcm.googleapis.com/fcm/send/x", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://web.push.apple.com/x", "https://db5p.notify.windows.com/x"]) assert.equal(validEndpoint(u), true, u);
  for (const u of ["http://fcm.googleapis.com/x", "https://evil.example.com/x", "https://fcm.googleapis.com.evil.com/x", "https://169.254.169.254/x", "https://localhost/x", "https://fcm.googleapis.com:8443/x", "javascript:alert(1)", "https://user@evil.com/", ""]) assert.equal(validEndpoint(u), false, u);
});
ok("bad bodies are refused with a reason", () => {
  assert.equal(cleanSub(null).err, "bad_body");
  assert.equal(cleanSub({ ...good, sub: { ...good.sub, endpoint: "https://evil.example.com/x" } }).err, "bad_endpoint");
  assert.equal(cleanSub({ ...good, sub: { ...good.sub, keys: { p256dh: "short", auth: "y".repeat(22) } } }).err, "bad_keys");
  assert.equal(cleanSub({ ...good, tz: "nope" }).err, "bad_zone");
  assert.equal(cleanSub({ ...good, brief: "25:00" }).err, "bad_time");
  assert.equal(cleanSub({ ...good, wind: "x" }).err, "bad_time");
});
console.log(r.join("\n"));
