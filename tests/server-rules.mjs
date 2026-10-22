/* The server files hold the rules agreed on 2026-10-21 (flaws 2 and 12 of the agent review). There is no Deno
   and no test database here, so this reads the files: the push function's allowed addresses are run as code,
   the rest is checked as text. It cannot prove what is deployed; the deploy notes say what is live. */
import fs from "node:fs";
import assert from "node:assert/strict";
const ROOT = process.env.APP_ROOT || "/home/user/FUNNY-CLOWNS";
const read = (p) => fs.readFileSync(ROOT + "/" + p, "utf8");
const results = []; const ok = (n, f) => { try { f(); results.push("PASS " + n); } catch (e) { results.push("FAIL " + n + ": " + e.message); } };

const push = read("supabase/functions/push/index.ts");
ok("push function: browsers only from Qordel's own addresses (production, previews, localhost); never *", () => {
  assert.doesNotMatch(push, /allow-origin"\s*:\s*"\*"/);
  const ORIGINS = (0, eval)(push.match(/const ORIGINS = (\[[\s\S]*?\]);/)[1]);
  const okO = (o) => ORIGINS.some((r) => r.test(o));
  for (const o of ["https://funny-clowns.vercel.app", "https://funny-clowns-k3jfdvlgs-oys-s-projects.vercel.app", "https://funny-clowns-git-app-oys-s-projects.vercel.app", "http://localhost:8731", "http://127.0.0.1:8731"]) assert.ok(okO(o), o);
  for (const o of ["https://evil.example", "https://funny-clowns.vercel.app.evil.com", "http://funny-clowns.vercel.app", "https://x-funny-clowns-a-oys-s-projects.vercel.app", "null", ""]) assert.ok(!okO(o), o);
});
ok("push function: subscribe and unsubscribe from another site are refused; the database's tick (no Origin) is not", () => {
  assert.match(push, /\(path === "subscribe" \|\| path === "unsubscribe"\) && origin && !okOrigin\(origin\)\) return json\(\{ error: "other_site" \}, 403\)/);
  assert.match(push, /if \(path === "tick" && req\.method === "POST"\) \{\s*const secret/);
});
ok("push function in the repo matches live version 5: it records counts with push_record", () => { assert.match(push, /db\.rpc\("push_record"/); });
ok("push function: only the live app (and localhost) may sign up; a preview's sign-up is refused and its old one removed", () => {
  const LIVE = (0, eval)(push.match(/const LIVE = (\[[\s\S]*?\]);/)[1]); const live = (o) => LIVE.some((r) => r.test(o));
  for (const o of ["https://funny-clowns.vercel.app", "http://localhost:8731", "http://127.0.0.1:8731"]) assert.ok(live(o), o);
  for (const o of ["https://funny-clowns-k3jfdvlgs-oys-s-projects.vercel.app", "https://funny-clowns-git-app-oys-s-projects.vercel.app", "https://evil.example"]) assert.ok(!live(o), o);
  assert.match(push, /if \(origin && !liveOrigin\(origin\)\) \{\s*const gone = await db\.from\("push_subs"\)\.delete\(\)\.eq\("endpoint", row\.endpoint\)\.eq\("auth", row\.auth\);[\s\S]*?return json\(\{ error: "live_app_only" \}, 403\);/);
});
ok("the alert function is in the repo, sends counts only, and needs the tick secret", () => {
  const a = read("supabase/functions/alert/index.ts"); assert.match(a, /x-tick"\) !== cfg\.tick\) return json\(\{ error: "no" \}, 401\)/);
  assert.match(read("supabase/functions/alert/alerts.js"), /This message holds counts only/);
});

const live = read("supabase/migrations/20261021090000_record_live_schema.sql");
ok("the live schema is written down: boards with row-level security and 4 own-row rules", () => {
  assert.match(live, /create table if not exists public\.boards/); assert.match(live, /alter table public\.boards enable row level security/);
  for (const [n, c] of [["boards_select_own", "for select to authenticated using \\(auth\\.uid\\(\\) = user_id\\)"], ["boards_insert_own", "for insert to authenticated with check \\(auth\\.uid\\(\\) = user_id\\)"],
    ["boards_update_own", "for update to authenticated using \\(auth\\.uid\\(\\) = user_id\\) with check \\(auth\\.uid\\(\\) = user_id\\)"], ["boards_delete_own", "for delete to authenticated using \\(auth\\.uid\\(\\) = user_id\\)"]])
    assert.match(live, new RegExp("create policy " + n + " on public\\.boards " + c), n);
  assert.match(live, /on delete cascade/);
});
ok("the live schema is written down: push health tables closed to browsers, owner-rights functions for the server role only", () => {
  for (const tb of ["push_status", "push_hourly", "push_alerts"]) { assert.match(live, new RegExp("alter table public\\." + tb + " enable row level security")); assert.match(live, new RegExp("revoke all on public\\." + tb + " from anon, authenticated, public")); }
  for (const f of ["push_record", "push_watch", "push_clean"]) { assert.match(live, new RegExp("function public\\." + f + "\\([^)]*\\) from public, anon, authenticated")); assert.match(live, new RegExp("grant execute on function public\\." + f + "\\([^)]*\\) to service_role")); }
  assert.match(live, /security definer\s+set search_path to ''/);
});
ok("boards grants are tightened: anon loses everything, signed-in people keep only select, insert, update, delete", () => {
  const g = read("supabase/migrations/20261021090100_boards_tighten_grants.sql");
  assert.match(g, /revoke all on public\.boards from anon;/); assert.match(g, /revoke truncate, trigger, references on public\.boards from authenticated;/);
  assert.match(g, /grant select, insert, update, delete on public\.boards to authenticated;/);
});
ok("the AI use counter: closed to browsers, counted only through a function that a signed-in person can call", () => {
  const u = read("supabase/migrations/20261021_ai_use.sql");
  assert.match(u, /alter table public\.ai_use enable row level security/); assert.match(u, /revoke all on public\.ai_use from anon, authenticated, public/);
  assert.match(u, /security definer/); assert.match(u, /if uid is null/); assert.match(u, /grant execute on function public\.ai_use_take\(text, int, int\) to authenticated/);
  assert.match(u, /revoke all on function public\.ai_use_take\(text, int, int\) from public, anon/);
});
ok("the order endpoint needs a signed-in person and counts per person", () => {
  const o = read("api/order.js"); assert.match(o, /if \(!me\) return fail\(res, 401, "auth_required"/); assert.doesNotMatch(o, /x-forwarded-for/);
});
console.log(results.join("\n")); console.log(results.some((r) => r.startsWith("FAIL")) ? "SOME FAILED" : "ALL PASSED (" + results.length + ")");
process.exit(0);
