/* Push reminders for the Minimum Deliveries Board.
   Four calls: GET /config (the public key), POST /subscribe, POST /unsubscribe,
   POST /tick (the database calls it every minute with a secret).
   The server holds a device address, a time zone and two clock times. It never
   holds a task, a note or the text of a notification: the message it sends is
   the single word "am" or "pm", and the device writes the words.            */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { cleanSub, dueKind, localParts, MAX_ROWS, validEndpoint, b64url } from "./schedule.js";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, apikey, authorization", "access-control-allow-methods": "GET, POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });
const b64u = (u8: Uint8Array) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const SUBJECT = "https://funny-clowns.vercel.app";

/* The signing key is made here, the first time it is asked for, and stays in
   push_config. It is never returned: only the public half is. */
async function vapid(): Promise<{ pub: string; priv: string }> {
  const read = async () => (await db.from("push_config").select("value").eq("key", "vapid").maybeSingle()).data?.value;
  let v = await read();
  if (!v) {
    const k = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const j = await crypto.subtle.exportKey("jwk", k.privateKey) as JsonWebKey;
    const raw = new Uint8Array(65); raw[0] = 4;
    raw.set(Uint8Array.from(atob(j.x!.replace(/-/g, "+").replace(/_/g, "/").padEnd(44, "=")), (c) => c.charCodeAt(0)), 1);
    raw.set(Uint8Array.from(atob(j.y!.replace(/-/g, "+").replace(/_/g, "/").padEnd(44, "=")), (c) => c.charCodeAt(0)), 33);
    await db.from("push_config").upsert({ key: "vapid", value: JSON.stringify({ pub: b64u(raw), priv: j.d }) }, { onConflict: "key", ignoreDuplicates: true });
    v = await read();
  }
  return JSON.parse(v!);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const path = new URL(req.url).pathname.replace(/\/+$/, "").split("/").pop();
  try {
    if (path === "config" && req.method === "GET") return json({ key: (await vapid()).pub });

    if (path === "subscribe" && req.method === "POST") {
      const text = await req.text(); if (text.length > 2000) return json({ error: "too_large" }, 413);
      const c = cleanSub(JSON.parse(text)); if (c.err) return json({ error: c.err }, 400);
      const row = c.row!;
      const old = await db.from("push_subs").select("updated_at").eq("endpoint", row.endpoint).maybeSingle();
      if (old.data) {
        if (Date.now() - Date.parse(old.data.updated_at) < 10000) return json({ ok: true, same: true });
        const up = await db.from("push_subs").update({ ...row, fails: 0, updated_at: new Date().toISOString() }).eq("endpoint", row.endpoint);
        if (up.error) throw up.error;
      } else {
        const n = await db.from("push_subs").select("id", { count: "exact", head: true });
        if ((n.count || 0) >= MAX_ROWS) return json({ error: "full" }, 503);
        const ins = await db.from("push_subs").insert(row); if (ins.error) throw ins.error;
      }
      return json({ ok: true });
    }

    if (path === "unsubscribe" && req.method === "POST") {
      const b = JSON.parse((await req.text()).slice(0, 2000));
      if (!validEndpoint(b.endpoint) || !b64url(b.auth, 16, 40)) return json({ error: "bad_body" }, 400);
      const r = await db.from("push_subs").delete().eq("endpoint", b.endpoint).eq("auth", b.auth);
      if (r.error) throw r.error;
      return json({ ok: true });
    }

    if (path === "tick" && req.method === "POST") {
      const secret = (await db.from("push_config").select("value").eq("key", "tick").maybeSingle()).data?.value;
      if (!secret || req.headers.get("x-tick") !== secret) return json({ error: "no" }, 401);
      const k = await vapid(); webpush.setVapidDetails(SUBJECT, k.pub, k.priv);
      const now = new Date();
      const { data } = await db.from("push_subs").select("*").limit(MAX_ROWS);
      const due = (data || []).map((s) => ({ s, kind: dueKind(s, now) })).filter((x) => x.kind);
      let sent = 0, gone = 0;
      for (let i = 0; i < due.length; i += 20) {
        await Promise.all(due.slice(i, i + 20).map(async ({ s, kind }) => {
          const date = localParts(now, s.tz).date;
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ k: kind }), { TTL: 3600, urgency: "normal" });
            await db.from("push_subs").update(kind === "am" ? { last_am: date, fails: 0 } : { last_pm: date, fails: 0 }).eq("id", s.id);
            sent++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410 || s.fails + 1 >= 5) { await db.from("push_subs").delete().eq("id", s.id); gone++; }
            else await db.from("push_subs").update({ fails: s.fails + 1 }).eq("id", s.id);
          }
        }));
      }
      /* health record: counts only. It must never stop or slow a send, so a failure here is ignored. */
      try { await db.rpc("push_record", { p_due: due.length, p_sent: sent, p_gone: gone, p_failed: due.length - sent - gone }); } catch (_e) { /* ignored */ }
      return json({ ok: true, due: due.length, sent, gone });
    }
    return json({ error: "not_found" }, 404);
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
