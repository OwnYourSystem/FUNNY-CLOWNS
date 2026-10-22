# Brand: Qordel

**Decision, 2026-10-19 (fifth round):** the owner chooses **Qordel** (card in `qordel-owner-card.jpg`). It replaces Planck, which had a near-twin in the App Store ("Planch", a one-next-task app).

- Tagline: **One step. In the right order.**
- Line: A planner that adjusts to your day and shows what matters next.
- Maker line: "Powered by OwnYourSystem" in the app (the owner asked for it on 19 October); the owner's card says "by OwnYourSystem". Either fits.

## Logo

- **The name in capitals, QORDEL** (owner: "use capitals", after the Ruba version could read as "qardel"). Set in the app's own Schibsted Grotesk SemiBold. Letter-spacing **-0.02em, slightly tight** (logo C, owner's choice on 2026-10-20; it replaced 0.06em), so the logo, the text and the icons are one family on every device. In the app the text stays "Qordel" (shown in capitals by CSS), so a screen reader says the word.
- App icons: QORDEL in white on Moonlit Plum `#2C1332`. Android status-bar badge: the "Q".
- Ruba Regular is no longer used; its file and credit were removed.
- Files: `make-icons-qordel-c.cjs` (logo C, current), `make-icons-qordel.cjs` (the 0.06em version) (draws every icon from the app font; needs the font's data URI in `schibsted-600.txt` beside it), `qordel-icon-1024.png`, `qordel-wordmark.png`.

## Flyer prompts (2026-10-21)

- `qordel-investor-flyer-prompt.md`: the investor flyer, the 90-second pitch, a 6-slide outline and a claims list.
- `qordel-flyer-prompt.md`: the marketing flyer, "stepping stones" concept.
- Both use only what is true of the live build 6f03082 and mark the rest as placeholders. The hosted AI
  tutor is a placeholder until its key is confirmed in production. Update both when the product changes.
- The older `investor-flyer-prompt.md` and `daysize-flyer-prompt.md` are history: old names, old features.

## Name check (2026-10-19)

- Domains: qordel.com, qordel.app, qordel.io, getqordel.com, qordelapp.com all free (Vercel registry). Nothing bought.
- Web search: no app, product or company named Qordel. Only a SoundCloud playlist name and an old forum username. Nearest: "Qordle", a Wordle variant word game (different spelling and category).
- Not final: search USPTO, EUIPO and WIPO in classes 9 and 42 before print.

---

# History

# Brand: Planck

**Decision, 2026-10-19 (fourth round):** the owner renames the app **Planck**, after Max Planck. "Powered by OwnYourSystem" stays under the name. It replaces OwnYourDay (kept below as history).

## The logo is the name

- "For the logo you just need to write the name in Ruba Regular font" (owner). Ruba Regular by floor-3013, FontStruct, CC BY-SA 3.0; credit in `fonts/Ruba-Regular-LICENSE.txt` in the app. Ruba is unicase, so the name reads "planck".
- App icons: the name in white on Moonlit Plum `#2C1332` (the button colour), 74% of the width; maskable 62% so it sits in the safe circle.
- Android status-bar badge: the "p" alone, one colour, drawn heavier (the full word is unreadable at 24px and Ruba's thin strokes fade at that size).
- In the app: the name in Ruba at the top of every page, "Powered by OwnYourSystem" under it in the body font. The welcome shows it large.
- Files: `make-icons-planck.cjs` (draws every icon from the font), `planck-icon-1024.png`, `planck-wordmark.png`.
- Not checked yet: "Planck" as a trademark for a planner app, and its domains. "Planck" is a famous surname and a physics term (Planck constant, the Planck mission), so expect many existing marks; search classes 9 and 42 before print.

---

# History: OwnYourDay (2026-10-19, third round)

# Brand: OwnYourDay

**Decision, 2026-10-19 (third round):** the owner renames the app **OwnYourDay**, "Powered by OwnYourSystem". It replaces Daysize (kept below as history).

## The mark: "Calm progress"

Chosen by Claude from the owner's 8 inspiration boards ("select the one that suits the user interface"): **Alternative 1, Calm progress**, a half sun over 2 rising arcs.

- Why this one: the fewest and boldest shapes, so it stays clear at 24px in the Android status bar and at 16px; it works in one colour; it has a dark version. The road, leaf and person versions lose detail when small.
- Colours: Warm Sun `#E9B949`, Sage `#9DB59A`, Deep Slate `#1F2A30`, Cream `#FBF9F4`.
- App icon: cream ground, sun, sage arc, slate arc. Dark version: slate ground, cream arc. In the app the mark is drawn inline; its lower arc takes the text colour (black on light, white on dark).
- Files: `ownyourday-icon.svg`, `ownyourday-icon-dark.svg`, `ownyourday-mark.svg`, `ownyourday-badge.svg`, previews; `make-icons-ownyourday.cjs` draws them and the app PNGs (`icon-192`, `icon-512`, `apple-touch-icon`, `icon-maskable-512`, `badge-96`).
- Wordmark: **Outfit SemiBold** (SIL Open Font License; `fonts/Outfit-OFL.txt` in the app), the closest free match to the lettering in the inspirations. Under it, small: "Powered by OwnYourSystem". The owner wrote "OwYourSystem"; read as a typo for the company name.

## Where the name is

Page and home-screen titles, manifest `name` and `short_name`, every phone page (mark, name, "Powered by OwnYourSystem"), the welcome screen, the classic board's eyebrow, notifications ("Open OwnYourDay ..."), the test reminder, the tutor's prompt.

## Domain and trademark (2026-10-19)

- Taken: ownyourday.com, ownyourday.app, ownyourdayapp.com. Free: ownyourday.io, getownyourday.com. Nothing bought.
- Web search found no "OwnYourDay" trademark filing for a planner. Near names: "OwnMyDay" (a children's visual schedule app on Google Play) and YourDay.com, Inc. (calendar marks). "Own your day" is a common phrase, which makes a trademark weak. Search USPTO, EUIPO and WIPO before print.

---

# History: Daysize (2026-10-18 to 2026-10-19)

# Brand: Daysize

Decision, 2026-10-18: the owner keeps **Daysize** as the working brand name for the Minimum Deliveries Board. Maker: OwnYourSystem.

2026-10-19: the app takes the name and a mark (owner: "design a unique logo for now and replace it everywhere logo and brand name are required").

## Name rules

- One word, capital D: Daysize. Never "DaySize", "Day Size" or "DAYSIZE" in running text.
- Wordmark font: RobaRegular, for the brand name only. The owner supplies the font file. No imitation in another font.
- Lock-up: "Daysize" with "by OwnYourSystem" below.

## Domain check (2026-10-18, Vercel registry lookup)

| Domain | Status |
|---|---|
| daysize.com | Registered by someone else (owner and sale status not checked: whois blocked from the session) |
| daysize.app | Free: $9.99 the first year, $15 a year after |
| daysize.io, daysize.co | Free |
| getdaysize.com, trydaysize.com, daysizeapp.com | Free |

Recommendation: daysize.app, with getdaysize.com as the .com fallback. Nothing bought yet; buying needs the owner's yes.

## Trademark check (2026-10-18, web search only)

- No "Daysize", "Day Size" or "Daysized" mark found through web search of USPTO, EUIPO, WIPO and aggregator sites. No app or company named Daysize found.
- Nearest name: Dayze (dayze.com), a life-in-days product from 2024 (calendar, people, memories by day). Different look and sound, close field. Name it to a lawyer.
- Not final: search engines do not index the official registers. Before print or filing, search USPTO (tmsearch.uspto.gov), EUIPO (eSearch plus) and the WIPO Global Brand Database for Daysize, Day Size and Dayze in classes 9 (downloadable app) and 42 (web software).

## Files

- `daysize-flyer-prompt.md`: the marketing flyer instruction ("made to measure" concept).
- `investor-flyer-prompt.md`: the investor flyer and pitch prompt. It still uses the old product name and the plum look; update the name before use.

## The mark (2026-10-19, "for now")

A garment size tag, tilted, with a punched hole and a Tape Yellow string. On the tag, 3 rising bars of 1, 3 and 5: the 3 day sizes, and a nod to the rising bars of the old icon.

- Colours: Moonlit Plum `#2C1332` ground, lilac `#D8C2E0` tag, Tape Yellow `#E9B949` string.
- Files: `daysize-mark.svg` (the app icon), `daysize-badge.svg` (one colour, see-through: the Android status-bar badge), `preview-1024.png`. `make-icons.cjs` draws all of them and writes the app's PNGs: `icon-192`, `icon-512`, `apple-touch-icon` (180), `icon-maskable-512` (tag at 70% so it sits in the safe circle) and `badge-96`.
- Why the badge is separate: Android paints the status-bar icon in one colour from its see-through shape. A full-colour square becomes a white square (owner's screenshot, 2026-10-19).
- Wordmark in the app: the body font. RobaRegular is for marketing pieces; the app has no licence or file for it yet.

## Where the name and mark are in the app

Page title and home-screen title, manifest `name` and `short_name`, the classic board's eyebrow, the welcome screen (mark and name), every notification (mark as icon, badge in the status bar, "Open Daysize ..." when there is no summary), the tutor's prompt.

## 2026-10-19, second round (owner's phone test)

- **Wordmark font: Ruba Regular**, sent by the owner ("use this font"). By floor-3013, made with FontStruct, Creative Commons BY-SA 3.0: free to use with credit. The credit is in `fonts/Ruba-Regular-LICENSE.txt` in the app. It is a unicase display font, so "Daysize" shows as "daysize". It is for the name only. Note: the flyer brief says "RobaRegular"; Ruba is the font the owner chose, so use Ruba there too.
- **The name and mark on every phone page**, top left (Now, Talk, Journal, You, Goals, a goal, a step, Backlog, Archive, Tags, Planner, Learned).
- **Colour: the plum theme is dropped.** Plain greys (iOS style) for grounds, cards and text; plum only on buttons (owner: "drop it as the whole and use only for the buttons. Keep it simple"). The app icon stays plum: it is the logo.
- **iPhone status bar**: `apple-mobile-web-app-status-bar-style` is now `default`, so iOS draws its own readable status bar on the light page. Re-add the app to the home screen to pick it up; check it on an iPhone.
