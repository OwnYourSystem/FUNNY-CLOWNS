/* A board with goals on it for the suites that need one (2026-10-21). The app ships an empty seed since flaw 13;
   every browser context made here gets the app page with the neutral list in _sample-seed.js in its place, so a new
   board starts with 15 goals as it did before. Only the seed line changes; the rest of the page is the app as built.
   TEST_SAMPLE=off turns it off (the unseed suite tests the real, empty start). Loaded by run-all.sh with --import. */
import { createRequire } from "node:module";
import { SAMPLE_SEED } from "./_sample-seed.js";
const require = createRequire(import.meta.url);
const pw = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright");
const PAGE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/((index|delivery-board)\.html)?(\?[^#]*)?$/;
const seed = "var SEED=" + JSON.stringify(SAMPLE_SEED) + ";";
if (process.env.TEST_SAMPLE !== "off") {
  /* after the first load the app's service worker fetches the page itself; this lets the route see that too */
  process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = "1";
  const launch = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch = async (...a) => {
    const b = await launch(...a), nc = b.newContext.bind(b);
    b.newContext = async (...o) => {
      const c = await nc(...o);
      await c.route(PAGE, async (route) => {
        const r = await route.fetch(); const body = await r.text();
        if (!body.includes("var SEED=[];")) return route.fulfill({ response: r });
        route.fulfill({ response: r, body: body.replace("var SEED=[];", () => seed) });
      });
      return c;
    };
    return b;
  };
}
/* Qordel web (2026-10-21): a big screen now gets the new web design. The suites written for the panel board keep
   testing it, as Classic board, which a person can still choose on You; TEST_WEB=on gives a suite the web design. */
if (process.env.TEST_WEB !== "on") {
  const launch2 = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch = async (...a) => {
    const b = await launch2(...a), nc = b.newContext.bind(b);
    b.newContext = async (...o) => {
      const c = await nc(...o);
      await c.addInitScript(() => { try { if (!localStorage.getItem("oys-web")) localStorage.setItem("oys-web", "classic"); } catch (e) {} });
      return c;
    };
    return b;
  };
}
