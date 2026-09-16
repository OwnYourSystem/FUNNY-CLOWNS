/* One reader for the news, kept on the server so the page never holds a key.
   GDELT needs none at all, which is why it goes first. The answer is cached
   at the edge, so a hundred opens cost one call.                          */

var TOPICS = {
  world:   '(world OR global OR international OR summit) sourcelang:english',
  geo:     '(geopolitics OR sanctions OR "foreign policy" OR NATO OR "security council" OR treaty) sourcelang:english',
  finance: '(markets OR inflation OR "central bank" OR earnings OR "interest rates" OR bonds) sourcelang:english',
  energy:  '("offshore wind" OR "carbon capture" OR "energy transition" OR grid OR hydrogen) sourcelang:english',
  denmark: '(Denmark OR Danish OR Copenhagen OR Esbjerg) sourcelang:english'
};
var ORDER = ["world", "geo", "finance", "energy", "denmark"];

/* GDELT stamps a date as 20260916T131500Z */
function readStamp(s) {
  var m = String(s || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).toISOString();
}

function tidy(a) {
  var title = String(a.title || "").trim();
  /* many feeds append " - Publisher" to the headline; the domain says it already */
  title = title.replace(/\s+[-|–]\s+[^-|–]{2,40}$/, "");
  return {
    title: title,
    url: a.url || "",
    source: a.domain || "",
    country: a.sourcecountry || "",
    at: readStamp(a.seendate),
    image: a.socialimage || ""
  };
}

module.exports = async function handler(req, res) {
  var url = new URL(req.url, "http://x");
  var topic = String(url.searchParams.get("topic") || "world").toLowerCase();
  if (!TOPICS[topic]) topic = "world";
  var want = Math.min(Math.max(parseInt(url.searchParams.get("n"), 10) || 60, 5), 120);

  var q = "https://api.gdeltproject.org/api/v2/doc/doc" +
    "?query=" + encodeURIComponent(TOPICS[topic]) +
    "&mode=artlist&format=json&sort=datedesc&timespan=2d&maxrecords=" + want;

  try {
    var ctl = new AbortController();
    var bail = setTimeout(function () { ctl.abort(); }, 8000);
    var r = await fetch(q, { signal: ctl.signal, headers: { "user-agent": "deliveries-board/1.0" } });
    clearTimeout(bail);
    if (!r.ok) throw new Error("gdelt " + r.status);

    var body = await r.json();
    var items = (body.articles || []).map(tidy).filter(function (x) { return x.title && x.url; });

    /* one story per publisher run, so a wire copied 12 times does not fill the page */
    var seen = {}, out = [];
    items.forEach(function (x) {
      var key = x.title.toLowerCase().slice(0, 60);
      if (seen[key]) return;
      seen[key] = 1; out.push(x);
    });

    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=600, stale-while-revalidate=3600");
    res.statusCode = 200;
    res.end(JSON.stringify({ topic: topic, topics: ORDER, count: out.length, items: out }));
  } catch (e) {
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.statusCode = 502;
    res.end(JSON.stringify({ topic: topic, topics: ORDER, count: 0, items: [], error: String(e && e.message || e) }));
  }
};
