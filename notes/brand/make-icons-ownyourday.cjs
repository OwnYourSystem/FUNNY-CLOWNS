/* OwnYourDay mark ("Calm progress"): a half sun over two rising arcs.
   Renders the app icons, the Android badge and the SVG sources.
   Usage: node make.cjs <outdir>; copy the PNGs to the app root.        */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const SUN = "#E9B949", SAGE = "#9DB59A", SLATE = "#1F2A30", CREAM = "#FBF9F4";
/* the mark in a 512 box, centred; s scales it about the centre */
const mark = (s, sun, sage, band) => `<g transform="translate(256 256) scale(${s}) translate(-259 -279)">
  <path d="M173 250 A86 86 0 0 1 345 250 Z" fill="${sun}"/>
  <path d="M92 352 Q 250 196 410 330 Q 262 272 92 352 Z" fill="${sage}"/>
  <path d="M138 392 Q 290 270 426 394 Q 300 352 138 392 Z" fill="${band}"/></g>`;
const icon = (s, bg, band) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/>${mark(s, SUN, SAGE, band)}</svg>`;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${mark(1.45, "#fff", "#fff", "#fff")}</svg>`;
const bare = (band) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="84 156 350 246">${mark(1, SUN, SAGE, band).replace('transform="translate(256 256) scale(1) translate(-259 -279)"', "")}</svg>`;
fs.writeFileSync(path.join(out, "ownyourday-icon.svg"), icon(1.12, CREAM, SLATE));
fs.writeFileSync(path.join(out, "ownyourday-icon-dark.svg"), icon(1.12, SLATE, CREAM));
fs.writeFileSync(path.join(out, "ownyourday-mark.svg"), bare(SLATE));
fs.writeFileSync(path.join(out, "ownyourday-badge.svg"), badge);
const jobs = [["icon-192.png", icon(1.12, CREAM, SLATE), 192], ["icon-512.png", icon(1.12, CREAM, SLATE), 512],
  ["apple-touch-icon.png", icon(1.12, CREAM, SLATE), 180], ["icon-maskable-512.png", icon(1.05, CREAM, SLATE), 512],
  ["badge-96.png", badge, 96], ["preview-1024.png", icon(1.12, CREAM, SLATE), 1024], ["preview-dark-1024.png", icon(1.12, SLATE, CREAM), 1024]];
(async () => { const b = await chromium.launch();
  for (const [name, svg, px] of jobs) { const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${px}" height="${px}" `)}</body></html>`);
    await p.screenshot({ path: path.join(out, name), omitBackground: true }); await p.close(); }
  await b.close(); console.log("done"); })();
