/* Daysize mark: a size tag (the day comes in sizes) with three marks of 1, 3 and 5,
   on Moonlit Plum, with a Tape Yellow string. Renders every app icon and the
   Android status-bar badge. Usage: node make-icons.cjs <outdir>; copy the PNGs to the app root */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });

const PLUM = "#2C1332", LILAC = "#D8C2E0", TAPE = "#E9B949";
/* the tag, drawn in a 512 box around (256,262); s scales it about the centre */
function tag(s, fill, cut, string) {
  return `<g transform="translate(256 262) scale(${s}) rotate(-12) translate(-256 -262)">
    <path d="M150 186 L256 104 L362 186 L362 416 L150 416 Z" fill="${fill}" stroke="${fill}" stroke-width="44" stroke-linejoin="round"/>
    <circle cx="256" cy="176" r="24" fill="${cut}"/>
    <g stroke="${cut}" stroke-width="34" stroke-linecap="round">
      <line x1="196" y1="380" x2="196" y2="380.01"/>
      <line x1="256" y1="380" x2="256" y2="316"/>
      <line x1="316" y1="380" x2="316" y2="252"/>
    </g>
    ${string ? `<path d="M256 176 C 248 120, 292 52, 380 44" fill="none" stroke="${TAPE}" stroke-width="13" stroke-linecap="round"/>` : ""}
  </g>`;
}
const icon = (s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${PLUM}"/>${tag(s, LILAC, PLUM, true)}</svg>`;
/* the badge: one colour, see-through, the marks cut out (Android paints it white) */
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><mask id="m"><rect width="512" height="512" fill="black"/>${tag(1.02, "white", "black", false)}</mask></defs><rect width="512" height="512" fill="#fff" mask="url(#m)"/></svg>`;

const jobs = [
  ["icon-192.png", icon(0.9), 192], ["icon-512.png", icon(0.9), 512],
  ["apple-touch-icon.png", icon(0.9), 180], ["icon-maskable-512.png", icon(0.7), 512],
  ["badge-96.png", badge, 96], ["preview-1024.png", icon(0.9), 1024],
];
fs.writeFileSync(path.join(out, "daysize-mark.svg"), icon(0.9));
fs.writeFileSync(path.join(out, "daysize-badge.svg"), badge);
(async () => {
  const b = await chromium.launch();
  for (const [name, svg, px] of jobs) {
    const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${px}" height="${px}" `)}</body></html>`);
    await p.screenshot({ path: path.join(out, name), omitBackground: true });
    await p.close();
  }
  await b.close(); console.log("done", jobs.map((j) => j[0]).join(" "));
})();
