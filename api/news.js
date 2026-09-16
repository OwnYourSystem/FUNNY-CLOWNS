/* One reader for the news, kept on the server so the page never holds a key.
   Google News gives a plain RSS feed that needs no key and answers fast.
   GDELT is kept behind it: it needs no key either, but from this host it
   times out more often than it answers.                                  */

var TOPICS = {
  world:   { q: "world news",                          gdelt: "summit" },
  geo:     { q: "geopolitics OR sanctions OR diplomacy", gdelt: "sanctions" },
  finance: { q: "markets OR inflation OR central bank", gdelt: "inflation" },
  energy:  { q: "offshore wind OR energy transition",   gdelt: "energy" },
  denmark: { q: "Denmark",                             gdelt: "Denmark" }
};
var ORDER = ["world", "geo", "finance", "energy", "denmark"];

function unxml(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}
function pick(block, tag) {
  var m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">"));
  return m ? unxml(m[1]) : "";
}
/* the headline carries " - Publisher" and the feed names the publisher anyway */
function trimTail(title, source) {
  if (source) {
    var cut = title.lastIndexOf(" - " + source);
    if (cut > 10) return title.slice(0, cut).trim();
  }
  return title.replace(/\s+-\s+[^-]{2,40}$/, "").trim();
}

function fromRss(xml) {
  var out = [];
  var blocks = xml.split("<item>").slice(1);
  blocks.forEach(function (b) {
    var raw = b.split("</item>")[0];
    var src = pick(raw, "source");
    var title = trimTail(pick(raw, "title"), src);
    var link = pick(raw, "link");
    var when = pick(raw, "pubDate");
    var at = null;
    var d = when ? new Date(when) : null;
    if (d && !isNaN(d.getTime())) at = d.toISOString();
    if (title && link) out.push({ title: title, url: link, source: src, country: "", at: at, image: "" });
  });
  return out;
}

function readStamp(s) {
  var m = String(s || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).toISOString();
}
function fromGdelt(body) {
  return (body.articles || []).map(function (a) {
    return {
      title: trimTail(String(a.title || "").trim(), a.domain),
      url: a.url || "", source: a.domain || "", country: a.sourcecountry || "",
      at: readStamp(a.seendate), image: a.socialimage || ""
    };
  });
}

function grab(url, ms) {
  var ctl = new AbortController();
  var bail = setTimeout(function () { ctl.abort(); }, ms);
  return fetch(url, {
    signal: ctl.signal,
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; deliveries-board/1.0)",
      "accept": "application/rss+xml, application/xml, application/json;q=0.8, */*;q=0.5"
    }
  }).then(function (r) {
    clearTimeout(bail);
    if (!r.ok) throw new Error("http " + r.status);
    return r;
  }, function (e) { clearTimeout(bail); throw e; });
}

module.exports = async function handler(req, res) {
  var url = new URL(req.url, "http://x");
  var topic = String(url.searchParams.get("topic") || "world").toLowerCase();
  if (!TOPICS[topic]) topic = "world";
  var want = Math.min(Math.max(parseInt(url.searchParams.get("n"), 10) || 60, 5), 100);
  var debug = url.searchParams.get("debug") === "1";
  var tried = [];

  function answer(code, items, err) {
    var seen = {}, clean = [];
    items.forEach(function (x) {
      if (!x.title || !x.url) return;
      var key = x.title.toLowerCase().slice(0, 60);
      if (seen[key]) return;          /* one story per wire, not twelve */
      seen[key] = 1; clean.push(x);
    });
    clean = clean.slice(0, want);
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", clean.length
      ? "public, s-maxage=600, stale-while-revalidate=3600"
      : "no-store");
    res.statusCode = code;
    var out = { topic: topic, topics: ORDER, count: clean.length, items: clean };
    if (err) out.error = err;
    if (debug) out.tried = tried;
    res.end(JSON.stringify(out));
  }

  var rss = "https://news.google.com/rss/search?q=" +
    encodeURIComponent(TOPICS[topic].q + " when:2d") +
    "&hl=en-GB&gl=DK&ceid=DK:en";

  try {
    var t0 = Date.now();
    var r = await grab(rss, 7000);
    var xml = await r.text();
    tried.push({ src: "google-news", ms: Date.now() - t0, bytes: xml.length });
    var items = fromRss(xml);
    if (items.length) return answer(200, items);
    tried.push({ src: "google-news", note: "no items parsed" });
  } catch (e) {
    tried.push({ src: "google-news", error: String(e && e.message || e) });
  }

  try {
    var t1 = Date.now();
    var g = await grab("https://api.gdeltproject.org/api/v2/doc/doc?query=" +
      encodeURIComponent(TOPICS[topic].gdelt + " sourcelang:english") +
      "&mode=artlist&format=json&sort=datedesc&timespan=1d&maxrecords=" + want, 8000);
    var body = await g.json();
    tried.push({ src: "gdelt", ms: Date.now() - t1 });
    return answer(200, fromGdelt(body));
  } catch (e2) {
    tried.push({ src: "gdelt", error: String(e2 && e2.message || e2) });
  }

  answer(502, [], "no source answered");
};
