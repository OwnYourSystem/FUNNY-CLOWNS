# Qordel

A phone-first day planner: one step at a time, sized by your energy and your calendar.
Live at https://funny-clowns.vercel.app. Qordel web (the big-screen design) is the same page.

`app` is the main branch. It holds the app, the tests and the project notes. Production runs
`app` as it stands.

## What is where

    index.html              the whole app, one file, built from source/ (never edit by hand)
    source/                 the app in parts, and build.sh
    sw.js                   the offline cache and the push reminders
    manifest.webmanifest    install to a home screen
    api/tutor.js            the AI tutor (Anthropic), a Vercel function
    api/order.js            "Suggest an order" (Anthropic), a Vercel function
    supabase/               the push server (edge function) and the database migrations
    vercel.json             headers, CSP, microphone rule
    tests/                  45 suites (Playwright and Node); run-all.sh runs them all
    notes/                  decisions, designs and the deploy log; start with notes/parked.md
    .claude/skills/         the house style guide for AI coding tools

`.vercelignore` keeps tests/, notes/ and .claude/ off the live site.

## Changing the app

The page ships as one file but is written in parts: `source/parts/*.js` between
`source/head.html` and `source/tail.html`.

- A plain part is the engine: it decides (day size, picks, reasons, numbers) and touches no screen or storage.
- A `.screen.js` part draws. A `.store.js` part reads and writes the device.
- All parts run inside one function that part 600 closes. A new part needs a number below 600, and a
  part must not call a `var` that a later part defines while the page loads.
- The code is ES5 on purpose (old phones). Keep it so.

After any change:

    sh source/build.sh        # writes index.html and source/delivery-board.html
    node tests/engine-purity.cjs

## Testing

Needs Node 22, Python 3 and Playwright with Chromium.

    python3 -m http.server 8731 &          # from the repo root
    bash tests/run-all.sh                  # about 25 minutes; prints PASS and FAIL per suite

On another machine, point the tests at your own Playwright and Chromium:

    PW_MODULE=$(npm root -g)/playwright CHROME_PATH=/path/to/chromium bash tests/run-all.sh

A single suite: `node tests/tour.mjs` (with the server running). Last full run, 2026-10-22:
45 suites, 950 checks, 0 failures.

## Branches and releases

1. Branch from `app` for each piece of work (for example `feature-x`).
2. Push it. Vercel builds a preview at `funny-clowns-git-<branch>-oys-s-projects.vercel.app`.
3. Run the full suite and check the preview.
4. Merge into `app`, then promote that build to production in Vercel. Production changes only
   on the owner's yes.

Previews cannot sign up for push reminders; only production and localhost can.

## Settings that live outside the code

Vercel environment variables (never commit them):

- `ANTHROPIC_API_KEY` or `QORDEL_ORDER_KEY`: the Anthropic key for the tutor and the order suggestion.
- `ANTHROPIC_WORKSPACE_ID`: needed because the key is scoped to a workspace.
- `SUPABASE_URL`, `SUPABASE_KEY`: let the functions check who is signed in.
- Optional: `TUTOR_MODEL`, `TUTOR_EFFORT`, `TUTOR_PER_MIN`, `TUTOR_PER_DAY`, `TUTOR_REQUIRE_AUTH`,
  `ORDER_PER_MIN`, `ORDER_PER_DAY`, `ORDER_REQUIRE_AUTH`.

Check the AI with `GET /api/tutor?verify=1`; it answers `{"configured":true,"works":true}`.

Supabase project `phicqgnzqnuwugzbgxxw` (eu-north-1) holds the account sync (`boards`, one row
per person), the push subscriptions and the push health tables. Run new files in
`supabase/migrations` in the SQL editor first, then deploy `supabase/functions/push`.

Google Calendar is built but off: `CAL_CLIENT` in `source/parts/415-your-google-calendar.js` is
empty until a Google Client ID is set. The setup steps are in notes/calendar.md.

## The data

The board lives in `localStorage` on the device. The journal and the weekly check-in stay on the
device only. An optional account carries the board between devices. The calendar copy stays on
the device. The push server holds a device address, a time zone and reminder times, never a task.
The AI gets what a question needs; see notes/ai-decisions.md.

## Open work

See notes/parked.md: what waits on the owner, the open flaws, and ideas not started.
