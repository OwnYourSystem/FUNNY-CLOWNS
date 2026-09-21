/* The board is one static file, so it cannot reach a news feed itself: a
   browser will not read news.google.com from this origin and the feed is
   XML, not JSON. This runs on the same origin, fetches the feed, and hands
   back the few fields the banner shows. Nothing about the board is sent.
   Everything is public; nothing is stored.                                */
/* Google's topic sections are loose: the TECHNOLOGY one came back carrying
   an interiors magazine and a health service journal. A search query is
   what the section pretends to be, so every feed is one.               */
const FEEDS = {
  tech:     "https://news.google.com/rss/search?q=(technology+OR+software+OR+semiconductor+OR+cloud+OR+%22artificial+intelligence%22)+when:2d",
  finance:  "https://news.google.com/rss/search?q=(markets+OR+inflation+OR+%22central+bank%22+OR+earnings+OR+stocks)+when:2d",
  football: "https://news.google.com/rss/search?q=(football+OR+%22premier+league%22+OR+%22champions+league%22)+when:2d",
  world:    "https://news.google.com/rss/headlines/section/topic/WORLD",
  science:  "https://news.google.com/rss/search?q=(research+OR+study+OR+physics+OR+climate+OR+biology)+when:2d",
  denmark:  "https://news.google.com/rss/search?q=Denmark+when:2d&gl=DK&ceid=DK:en"
};
const LANG = "hl=en-GB&gl=GB&ceid=GB:en";

/* <source url="…">BBC</source> carries an attribute, so the open tag has to
   allow one or the publisher comes back empty. */
function pick(xml, tag) {
  const out = [], re = new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">", "g");
  let m; while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}
function clean(t) {
  return String(t)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

export default async function handler(req, res) {
  const want = String(req.query.f || "")
    .split(",").map(s => s.trim()).filter(s => FEEDS[s]).slice(0, 6);
  if (!want.length) return res.status(200).json({ items: [] });

  const per = Math.max(1, Math.ceil(12 / want.length));
  const jobs = want.map(async key => {
    const url = FEEDS[key] + (FEEDS[key].includes("?") ? "&" : "?") + LANG;
    try {
      const ctl = AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined;
      const r = await fetch(url, { signal: ctl, headers: { "user-agent": "Mozilla/5.0" } });
      if (!r.ok) return [];
      const xml = await r.text();
      /* one <item> at a time, so a title never pairs with another's source */
      return pick(xml, "item").slice(0, per).map(block => {
        let t = clean(pick(block, "title")[0] || "");
        const src = clean(pick(block, "source")[0] || "");
        /* Google appends " - Publisher" to every headline, and the source
           field already carries it. One of the two is enough. */
        if (src && t.endsWith(" - " + src)) t = t.slice(0, -(src.length + 3));
        return t ? { k: key, t, s: src } : null;
      }).filter(Boolean);
    } catch (e) { return []; }
  });

  const got = (await Promise.all(jobs)).flat();
  /* one from each feed in turn, so no single topic owns the front of the run */
  const byKey = {}; got.forEach(x => (byKey[x.k] = byKey[x.k] || []).push(x));
  const out = [];
  for (let i = 0; out.length < got.length; i++) {
    let added = false;
    for (const k of want) { const a = byKey[k]; if (a && a[i]) { out.push(a[i]); added = true; } }
    if (!added) break;
  }
  res.setHeader("cache-control", "public, s-maxage=600, stale-while-revalidate=1800");
  res.status(200).json({ items: out.slice(0, 14) });
}
