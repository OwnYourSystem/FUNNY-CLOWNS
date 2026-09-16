/* One reader for the news, kept on the server so the page never holds a key.
   GDELT needs none at all, which is why it goes first. The answer is cached
   at the edge, so a hundred opens cost one call.                          */

/* GDELT answers a short query in under a second and a long one not at all,
   so each topic is one or two terms. A wide OR list timed out every time. */
var TOPICS = {
  world:   'summit sourcelang:english',
  geo:     'sanctions sourcelang:english',
  finance: 'inflation sourcelang:english',
  energy:  '"offshore wind" sourcelang:english',
  denmark: 'Denmark sourcelang:english'
};
var PLAN_B = {
  world:   'government sourcelang:english',
  geo:     'diplomacy sourcelang:english',
  finance: 'markets sourcelang:english',
  energy:  'energy sourcelang:english',
  denmark: 'Copenhagen sourcelang:english'
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

  function ask(query, span, ms) {
    var q = "https://api.gdeltproject.org/api/v2/doc/doc" +
      "?query=" + encodeURIComponent(query) +
      "&mode=artlist&format=json&sort=datedesc&timespan=" + span + "&maxrecords=" + want;
    var ctl = new AbortController();
    var bail = setTimeout(function () { ctl.abort(); }, ms);
    return fetch(q, { signal: ctl.signal, headers: { "user-agent": "deliveries-board/1.0" } })
      .then(function (r) {
        clearTimeout(bail);
        if (!r.ok) throw new Error("gdelt " + r.status);
        return r.json();
      }, function (e) { clearTimeout(bail); throw e; });
  }

  try {
    var body;
    try {
      body = await ask(TOPICS[topic], "2d", 9000);
    } catch (first) {
      /* a slow answer is normal here, so try once more, narrower */
      body = await ask(PLAN_B[topic], "1d", 9000);
    }
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
