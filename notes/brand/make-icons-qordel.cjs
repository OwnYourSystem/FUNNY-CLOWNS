/* Qordel: the logo is the name in capitals, QORDEL, in Schibsted Grotesk SemiBold
   (the app's own font, so the logo, the text and the icons are one family).
   Renders the app icons (white on Moonlit Plum), the maskable icon, and the
   Android status-bar badge (a one-colour Q: the word is unreadable at 24px). */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const FONT = fs.readFileSync(path.join(__dirname, "schibsted-600.txt"), "utf8");
const PLUM = "#2C1332", INK = "#FFFFFF";
const page = (px, bg, color, text, frac, ls) => `<html><head><style>@font-face{font-family:SG;src:url(${FONT}) format("woff2");font-weight:600}
html,body{margin:0;width:${px}px;height:${px}px;background:${bg}}
.w{width:${px}px;height:${px}px;display:flex;align-items:center;justify-content:center}
.t{font-family:SG;font-weight:600;color:${color};line-height:1;white-space:nowrap;letter-spacing:${ls}em;padding-left:${ls}em}</style></head>
<body><div class="w"><span class="t" id="t">${text}</span></div>
<script>document.fonts.ready.then(()=>{const t=document.getElementById("t");let s=${px};t.style.fontSize=s+"px";
while(t.getBoundingClientRect().width>${px}*${frac}&&s>4){s-=1;t.style.fontSize=s+"px";}document.body.dataset.ok=1;});</script></body></html>`;
const jobs = [["icon-192.png", 192, PLUM, INK, "QORDEL", 0.76, 0.06], ["icon-512.png", 512, PLUM, INK, "QORDEL", 0.76, 0.06],
  ["apple-touch-icon.png", 180, PLUM, INK, "QORDEL", 0.76, 0.06], ["icon-maskable-512.png", 512, PLUM, INK, "QORDEL", 0.64, 0.06],
  ["badge-96.png", 96, "transparent", "#FFFFFF", "Q", 0.7, 0], ["preview-1024.png", 1024, PLUM, INK, "QORDEL", 0.76, 0.06],
  ["wordmark-light.png", 640, "#FFFFFF", "#000000", "QORDEL", 0.9, 0.06]];
(async () => { const b = await chromium.launch();
  for (const [name, px, bg, color, text, frac, ls] of jobs) { const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent(page(px, bg, color, text, frac, ls)); await p.waitForSelector("body[data-ok]");
    await p.screenshot({ path: path.join(out, name), omitBackground: bg === "transparent" }); await p.close(); }
  await b.close(); console.log("done"); })();
