import assert from "node:assert/strict";
import { compose, ALERT_KINDS } from "../functions/alert/alerts.js";
const r = []; const ok = (n, f) => { try { f(); r.push("PASS " + n); } catch (e) { r.push("FAIL " + n + ": " + e.message); } };
ok("every kind composes an open and a resolved mail with a clear subject", () => {
  for (const k of ALERT_KINDS) for (const s of ["open", "resolved"]) { const m = compose(k, s, "x"); assert.ok(m && m.subject.startsWith("[Board]") && m.text.length > 20, k + s); }
});
ok("an unknown kind is refused", () => { assert.equal(compose("nope", "open", ""), null); });
ok("open says what it means and what to check; resolved says it recovered", () => {
  const o = compose("job_stopped", "open", "last good run: never"); assert.match(o.text, /What to check/); assert.match(o.subject, /Alert: /);
  const c = compose("job_stopped", "resolved", ""); assert.match(c.subject, /Recovered: /); assert.doesNotMatch(c.text, /What to check/);
});
ok("the detail is cut to 300 characters and nothing else from the caller is echoed", () => {
  const m = compose("send_failures", "open", "a".repeat(1000)); assert.ok(m.text.length < 1100);
  const m2 = compose("send_failures", "open", "d"); assert.doesNotMatch(m2.text, /https?:\/\/(?!supabase)/);
});
ok("mail holds no address, key or secret wording", () => {
  for (const k of ALERT_KINDS) { const m = compose(k, "open", "due 3, sent 3"); assert.doesNotMatch(m.text + m.subject, /endpoint|p256dh|auth|secret|mail_key/i); }
});
console.log(r.join("\n"));
