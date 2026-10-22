# Qordel web

Owner, 2026-10-21: "Could you build web application on the same level?" Then: Qordel stays one product (one account, one set of data), and the web version gets its own design for a big screen, at the level of the phone app.

Branch: `web-test` (from `calendar-test`, so the web has the Calendar page and rule 6). Not in production.

## What it is

- **Same product.** The web runs the same pages, the same 6 rules, the same tutor and the same data as the phone. A step finished on the computer is finished on the phone.
- **Its own design.**
  - A sidebar on the left: the brand, then Now, Talk, Journal, Calendar, Goals and You.
  - One calm column in the middle of the rest of the screen, at most 720 to 760 px wide.
  - Bigger headings and more space than on the phone.
  - Hover states.
  - Dialogs in the middle of the screen, as on a Mac.
  - Talk fills the space right of the sidebar.
  - No pointer effects.
- **Calendar and Goals are places of their own** in the sidebar, so they have no "Back to You". Backlog, Tags, Archive and Planner are still reached from You.
- **Words fit a computer.** "Kept on this computer only", not "on this phone".
- **The first run** (the welcome and the first goal) sits in the middle of the screen with no sidebar, as on the phone.

## Classic board

The old board with panels stays. A person can choose it on You, under "On this computer", and the choice is kept in that browser. On the classic board, a "New Qordel" button at the top brings the web design back. A phone always gets the phone app, whatever was chosen on a computer.

## When the web design shows

The phone app shows below 820 px wide, or on a touch screen lying on its side. Everything wider gets Qordel web, unless the person chose Classic board in that browser.

## How it is built

- The phone's pages (part 595) draw the content. The web design is CSS under `html.ph-web`, so nothing changes on a phone.
- 2 extra sidebar links (Calendar and Goals) exist in the markup and show only on the web.
- `phIsWeb()`, `phWebSet()` and the key `oys-web` (part 595) decide between web and classic.

## Tests

- `tests/web.mjs` has 13 checks, with axe for WCAG 2.2 AA on Now, Calendar and You. It covers:
  - the first run;
  - the sidebar and its order, marking and size;
  - no sideways scroll at 900, 1024, 1440 and 1920 px;
  - Talk;
  - dialogs in the middle;
  - the wording;
  - Classic board and the way back;
  - the shared data;
  - the phone being unchanged.
- The suites written for the panel board keep testing it as Classic board. The test helper `_sample.mjs` sets that choice unless a suite runs with `TEST_WEB=on`.

## Not built (yet)

- Keyboard shortcuts (for example, 1 to 6 for the sidebar places).
- A second column on very wide screens (Today beside Now). It was left out on purpose: the owner removed the right column on 2026-10-20 to keep the day calm.
- An installable desktop app (own window and icon). The web app can already be installed from Chrome or Edge; a proper install prompt is a small follow-up.
