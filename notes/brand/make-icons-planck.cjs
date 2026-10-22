/* Planck: the logo is the name, written in Ruba Regular (floor-3013, CC BY-SA 3.0).
   Renders the app icons (white on Moonlit Plum), the maskable icon, and the
   Android status-bar badge (a one-colour "p": the word is unreadable at 24px). */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const FONT = "data:font/ttf;base64," + fs.readFileSync(path.join(__dirname, "Ruba-Regular.ttf")).toString("base64");
const PLUM = "#2C1332", INK = "#FFFFFF";
const page = (px, bg, color, text, frac, stroke) => `<html><head><style>@font-face{font-family:Ruba;src:url(${FONT})}
html,body{margin:0;width:${px}px;height:${px}px;background:${bg}}
.w{width:${px}px;height:${px}px;display:flex;align-items:center;justify-content:center}
.t{font-family:Ruba;color:${color};line-height:1;white-space:nowrap;-webkit-text-stroke:${stroke||0}px ${color}}</style></head>
<body><div class="w"><span class="t" id="t">${text}</span></div>
<script>document.fonts.ready.then(()=>{const t=document.getElementById("t");let s=${px};t.style.fontSize=s+"px";
while(t.getBoundingClientRect().width>${px}*${frac}&&s>4){s-=1;t.style.fontSize=s+"px";}document.body.dataset.ok=1;});</script></body></html>`;
const jobs = [["icon-192.png", 192, PLUM, INK, "planck", 0.74], ["icon-512.png", 512, PLUM, INK, "planck", 0.74],
  ["apple-touch-icon.png", 180, PLUM, INK, "planck", 0.74], ["icon-maskable-512.png", 512, PLUM, INK, "planck", 0.62],
  ["badge-96.png", 96, "transparent", "#FFFFFF", "p", 0.62, 7], ["preview-1024.png", 1024, PLUM, INK, "planck", 0.74],
  ["wordmark-light.png", 640, "#FFFFFF", "#000000", "planck", 0.9]];
(async () => { const b = await chromium.launch();
  for (const [name, px, bg, color, text, frac, stroke] of jobs) { const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent(page(px, bg, color, text, frac, stroke)); await p.waitForSelector("body[data-ok]");
    await p.screenshot({ path: path.join(out, name), omitBackground: bg === "transparent" }); await p.close(); }
  await b.close(); console.log("done"); })();
