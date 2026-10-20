/* One clock for the whole suite (2026-10-20). Rule 2 rests the board in the
   last 90 minutes of the day and outside it, so a run at 22:00 saw a
   different board than a run at 15:00. Every browser context now starts
   today at 18:00 local (after work hours, before the evening), and time runs
   on normally from there: Date is shifted by the same amount in the page
   and in the test itself (so the two agree); timers are not touched. A suite that needs another hour sets its own clock (p.clock),
   which replaces this one. TEST_CLOCK=off turns this off. Loaded by
   run-all.sh with --import. */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require("/opt/node22/lib/node_modules/playwright");
const shift = (off) => {
  const D = Date;
  function S(...a) { if (!(this instanceof S)) return new D(D.now() + off).toString(); return a.length ? new D(...a) : new D(D.now() + off); }
  S.prototype = D.prototype; S.now = () => D.now() + off; S.parse = D.parse; S.UTC = D.UTC;
  globalThis.Date = S;
};
if (process.env.TEST_CLOCK !== "off") {
  const at = new Date(); at.setHours(18, 0, 0, 0); const OFF = at.getTime() - Date.now();
  shift(OFF);
  const launch = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch = async (...a) => {
    const b = await launch(...a), nc = b.newContext.bind(b);
    b.newContext = async (...o) => { const c = await nc(...o); await c.addInitScript(shift, OFF); return c; };
    return b;
  };
}
