/* The rules for when a push may go out. Plain code with no imports, so the
   same file runs in the edge function and in the tests. Time is the person's
   own: the device sends its time zone, and every rule below reads the clock in
   that zone, never the server's.                                          */
export const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^[a-z0-9.-]+\.push\.apple\.com$/,
  /^[a-z0-9.-]+\.notify\.windows\.com$/,
  /^[a-z0-9.-]+\.push\.services\.mozilla\.com$/,
];
export const PM_AT = 15 * 60;       /* the afternoon check */
export const LATE_MIN = 90;         /* a push later than this after its time is dropped, not sent late */
export const MAX_ROWS = 5000;

export function hm(t) {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m || +m[1] > 23 || +m[2] > 59) return NaN;
  return +m[1] * 60 + +m[2];
}
export function validZone(tz) {
  try { new Intl.DateTimeFormat("en-CA", { timeZone: tz }); return typeof tz === "string" && tz.length < 64; } catch (_e) { return false; }
}
/* the date and minutes since midnight in a zone */
export function localParts(now, tz) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const o = {}; f.formatToParts(now).forEach((p) => { o[p.type] = p.value; });
  return { date: o.year + "-" + o.month + "-" + o.day, mins: +o.hour * 60 + +o.minute };
}
/* the same rule the board uses: a day that ends late at night is over until 04:00 */
export function pastDayEnd(wind, mins) {
  const w = hm(wind);
  return w >= 4 * 60 ? (mins >= w || mins < 4 * 60) : (mins >= w && mins < 4 * 60);
}
/* which push, if any, this device is owed right now: "am", "pm" or null. At most one per call. */
export function dueKind(sub, now) {
  if (!validZone(sub.tz)) return null;
  const l = localParts(now, sub.tz);
  if (pastDayEnd(sub.wind, l.mins)) return null;
  const b = hm(sub.brief);
  if (sub.am && sub.last_am !== l.date && !isNaN(b) && l.mins >= b && l.mins <= b + LATE_MIN) return "am";
  if (sub.pm && sub.last_pm !== l.date && l.mins >= PM_AT && l.mins <= PM_AT + LATE_MIN) return "pm";
  return null;
}
export function b64url(s, min, max) { return typeof s === "string" && /^[A-Za-z0-9_-]+$/.test(s) && s.length >= min && s.length <= max; }
export function validEndpoint(u) {
  let x; try { x = new URL(u); } catch (_e) { return false; }
  return x.protocol === "https:" && !x.port && u.length <= 600 && PUSH_HOSTS.some((r) => r.test(x.hostname));
}
/* what a subscribe call may carry. Returns a clean row, or a reason. */
export function cleanSub(b) {
  if (!b || typeof b !== "object") return { err: "bad_body" };
  const s = b.sub || {};
  if (!validEndpoint(s.endpoint)) return { err: "bad_endpoint" };
  const k = s.keys || {};
  if (!b64url(k.p256dh, 80, 100) || !b64url(k.auth, 16, 40)) return { err: "bad_keys" };
  if (!validZone(b.tz)) return { err: "bad_zone" };
  if (isNaN(hm(b.brief)) || isNaN(hm(b.wind))) return { err: "bad_time" };
  return { row: { endpoint: s.endpoint, p256dh: k.p256dh, auth: k.auth, tz: b.tz, brief: b.brief, wind: b.wind, am: b.am !== false, pm: b.pm !== false } };
}
