/* Sends one alert mail. Called by the database watcher (push_watch) with the tick secret.
   The mail service key, sender and recipient live in push_config, set by the owner. If they are not set,
   it records nothing and sends nothing, and says so. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { compose } from "./alerts.js";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "not_found" }, 404);
  try {
    const cfg: Record<string, string> = {};
    const { data } = await db.from("push_config").select("key,value").in("key", ["tick", "mail_key", "mail_to", "mail_from"]);
    (data || []).forEach((r) => { cfg[r.key] = r.value; });
    if (!cfg.tick || req.headers.get("x-tick") !== cfg.tick) return json({ error: "no" }, 401);

    const b = JSON.parse((await req.text()).slice(0, 2000));
    const m = compose(String(b.kind), String(b.state), b.detail);
    if (!m) return json({ error: "bad_kind" }, 400);
    if (!cfg.mail_key || !cfg.mail_to || !cfg.mail_from) return json({ ok: true, mailed: false, note: "no mail channel configured" });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + cfg.mail_key, "content-type": "application/json" },
      body: JSON.stringify({ from: cfg.mail_from, to: [cfg.mail_to], subject: m.subject, text: m.text }),
    });
    if (!r.ok) return json({ ok: false, mailed: false, status: r.status }, 502);
    const id = Number(b.id);
    if (id > 0) {
      await db.from("push_alerts").update(b.state === "resolved" ? { emailed_resolved_at: new Date().toISOString() } : { emailed_open_at: new Date().toISOString() }).eq("id", id);
    }
    return json({ ok: true, mailed: true });
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
