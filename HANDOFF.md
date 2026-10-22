# Qordel handoff

Date: 2026-10-22. From: Behnam Boujarzadeh (OwnYourSystem), the owner.
For: the developer who takes over the test and production phases, and the marketing team that works on a fork.

Read this file first. Then README.md (how to build and test) and notes/parked.md (the open list).

---

## 1. The product in 1 minute

Qordel is a phone-first day planner. It shows **one step at a time**, in the right order, sized by
your energy and your calendar. It is calm on purpose: no scores, no streaks, no pressure.

- **Live:** https://funny-clowns.vercel.app (phone app, and Qordel web on a big screen)
- **Repo:** https://github.com/OwnYourSystem/FUNNY-CLOWNS, branch `app` (the default and only main branch)
- **Brand:** Qordel, "Powered by OwnYourSystem". Logo, icons and flyer prompts are in notes/brand/.
- **In the app:** You, then "How Qordel works", opens an 8-slide tour of every feature. It is the
  fastest way to learn the product.

## 2. State on handoff day

| Item | State |
|---|---|
| Production | `app` at dc3fd48, deployment `dpl_9UN4Wh8NTrYg7E3Jt9QRcJJ3jvN5` |
| Rollback | `dpl_3iNj1hEBMKvDRsWcKRQFR1HSandA` (ce68b4b) |
| Repo head | `app` at 4718929 or later (adds tests, notes, README, this file; no app code change) |
| Tests | 45 suites, 950 checks, 0 failures (2026-10-22) |
| AI | `GET /api/tutor?verify=1` returns `{"configured":true,"works":true}` in production |
| Google Calendar | Built and tested, **off** until a Google Client ID is set (section 9) |
| Database | 1 of 3 pending migrations applied; 2 to run (section 9) |
| Users | 1 real account (the owner). No public launch yet. |

## 3. What the app does

**Phone (4 tabs):**
- **Now:** the one step to do now, with the reason ("Your energy is low, so only easy things").
  Energy is 4 batteries the person taps: Very low, Low, Good, Full. A line shows what is booked today.
- **Talk:** a calm chat. It answers simple things on the device ("What should I do now?",
  "What is left today?", "Make today lighter", "I don't feel good today"). Harder questions go to
  the AI tutor when the person is signed in. Voice input and read-aloud work.
- **Journal:** a private note per day. It stays on the device only, never synced, never sent to the AI.
- **You:** goals, backlog, settings, reminders, account, Google Calendar, the tour, backup.

**Qordel web:** the same pages and data in a big-screen design: a sidebar (Now, Talk, Journal,
Calendar, Goals, You, How it works), one calm column, dialogs in the middle. The older
"Classic board" (panels, docks, drag and drop) is still a choice on You, with a way back.

**Other features:** onboarding for a first goal; delivery days per goal; step order; "My easy things"
(a minimum day); push reminders (morning brief and evening check-in); missed-delivery-day notice;
weekly check-in; "Suggest an order" (AI); memory the tutor keeps only with the person's yes; offline use;
install to a home screen.

## 4. The 6 rules (the heart of the app)

The planner follows 6 rules a person can read and check. They live in
`source/parts/190-two-rankings-kept-apart.js` and `196-your-calendar-in-numbers.js`.

1. You set your energy. If you do not, it stays at Good.
2. Very low, or the last 90 minutes of your day (or outside it): no task. Only your own easy things.
3. Low: your easy things, or at most 1 step you marked Easy.
4. Good or Full: the next step, in order, of the goal with the nearest delivery day; otherwise of the
   goal that matches what you said matters most; otherwise of the goal at the top of your list.
5. In work hours only work goals; outside them only the other goals.
6. What is booked in your calendar comes first: no task during a booking, and every 2 hours booked
   removes 1 step from the day (never below 1).

Day size: Low 1 step, Good 3 (the person can change it), Full 5. Nothing else is weighed.
**Do not add hidden scores.** This was a deliberate decision (2026-10-20) after the old 15-factor
ranking gave bad picks.

## 5. How the code is built

- **One static page.** `index.html` is the whole app (ES5, no framework, no build tools beyond a shell
  script). It is built from about 80 parts in `source/parts/` between `source/head.html` (CSS and
  markup) and `source/tail.html`. Run `sh source/build.sh` after every change. Never edit `index.html`.
- **Part types:** a plain part is the engine (decides, touches no screen or storage); `.screen.js` draws;
  `.store.js` reads and writes the device. `tests/engine-purity.cjs` enforces this (259 checks).
- **Load order trap:** all parts run in one function that part 600 closes. A new part needs a number
  below 600. A part must not use a `var` from a later part while the page loads (the tour had to move
  from 596 to 594 for this reason).
- **Phone and web:** `595-the-phone.js` is the phone and web shell (routes `#/now`, `#/talk`,
  `#/journal`, `#/you`, `#/calendar`, `#/goals`, `#/tour/1`...). The class `ph-web` on `<html>` turns on
  the big-screen design. `localStorage["oys-web"]="classic"` shows the Classic board.
- **Server side:** 2 Vercel functions (`api/tutor.js`, `api/order.js`) and 2 Supabase edge functions
  (`supabase/functions/push`, `supabase/functions/alert`). Nothing else.
- **Offline:** `sw.js` caches the page; the page always loads fresh when online. Bump `CACHE` in sw.js
  when the cached file list changes.
- **Style guide for AI coding tools:** `.claude/skills/minimum-deliveries-ui/SKILL.md`.

## 6. The AI

| Feature | Where | Model | What it gets |
|---|---|---|---|
| Tutor (Talk) | `api/tutor.js` | Opus 5.5 by default (`TUTOR_MODEL` may pick Sonnet 5.5) | The question, a board summary, busy times; meeting names only if the person turns that on |
| Suggest an order | `api/order.js` | Haiku 5.5 | Step names of 1 goal |

- The tutor runs **tools** on the device (board_state, stats, set_energy, add_subtask, get_calendar,
  propose_calendar_event and about 35 more). The server keeps the list of allowed tools and the system
  rules; the page cannot change them. Anything that writes to the calendar is only a proposal; the
  person presses Add.
- **Safety:** crisis phrases ("I want to die" and 16 more) are caught on the device, get a fixed
  caring answer, and are **never** sent to the AI. `tests/safety.mjs` guards this.
- Without the AI (signed out, or no key) Talk still works for the common questions.
- Rate limits per person: `TUTOR_PER_MIN`, `TUTOR_PER_DAY`, `ORDER_PER_MIN`, `ORDER_PER_DAY`.
  A durable per-person count needs the `ai_use` migration (section 9).
- The owner's rule: **never remove an AI feature, change a prompt or change a model without the
  owner's yes.** Decisions are logged in notes/ai-decisions.md.

## 7. Data and privacy

| Data | Where it lives |
|---|---|
| Goals, steps, settings | The device (`localStorage`, key `oys-min-deliveries-v1`). With an account, also 1 row per person in Supabase `boards` (row-level security: only the owner of the row). |
| Journal, weekly check-in | The device only. Never synced, never in backup text, never sent to the AI. |
| Calendar copy (7 days) | The device only. Google's access key lives in the browser tab for about 1 hour. |
| Push reminders | Supabase `push_subs`: a device address, a time zone and 2 clock times. Never a task or words. The device writes the notification text. |
| AI questions | Sent to Anthropic for that answer only. The server logs no content. |

The account uses Supabase Auth: email and password, or Google sign-in. The owner's account (uid `5b461774-...`) is the only one that
still sees the old sample goals; everyone else starts empty.

## 8. Infrastructure and access

You need access to these. Ask the owner.

| Service | What | Notes |
|---|---|---|
| GitHub | OwnYourSystem/FUNNY-CLOWNS | `app` is the default branch |
| Vercel | team `oys-s-projects`, project `funny-clowns` | Every pushed branch gets a preview: `funny-clowns-git-<branch>-oys-s-projects.vercel.app`. Production is promoted by hand. Hobby plan: runtime logs last 1 hour. |
| Supabase | project `phicqgnzqnuwugzbgxxw`, eu-north-1 | Auth, `boards`, push tables, cron jobs (push every minute, health watch every 5 minutes, clean-up daily), edge functions `push` (version 5) and `alert` |
| Anthropic | 1 workspace-scoped API key | Set a spend limit (the owner is doing this) |
| Google Cloud | not set up yet | For the calendar, section 9 |

**Vercel environment variables** (names only; never commit values):
`QORDEL_ORDER_KEY` (or `ANTHROPIC_API_KEY`), `ANTHROPIC_WORKSPACE_ID`, `SUPABASE_URL`, `SUPABASE_KEY`.
Optional: `TUTOR_MODEL`, `TUTOR_EFFORT`, `TUTOR_PER_MIN`, `TUTOR_PER_DAY`, `TUTOR_REQUIRE_AUTH`,
`ORDER_PER_MIN`, `ORDER_PER_DAY`, `ORDER_REQUIRE_AUTH`.

**Supabase secrets** (edge functions): VAPID keys for web push, the tick secret, the alert mail settings.
They are set in the Supabase dashboard, not in the repo.

**Security notes:** CSP is in `vercel.json` (allows Google sign-in and the Calendar API only).
Only production and localhost may sign up for push; previews get 403 `live_app_only`.

## 9. Open work, in priority order

**Waiting on the owner or the new team:**
1. **2 database migrations** did not run through the AI connection (they timed out). In the Supabase
   SQL editor, run the full text of these files, in this order. Both are safe to run twice.
   - `supabase/migrations/20261021090000_record_live_schema.sql` (writes down the live schema; changes nothing live)
   - `supabase/migrations/20261021_ai_use.sql` (per-person AI use count; then `api/order.js` limits survive restarts)
   - Already applied 2026-10-22: `boards_tighten_grants`.
2. **Old preview reminders** on the owner's phone: delete row 7 in `push_subs`
   (`delete from public.push_subs where id = 7;`) or block the preview sites in Chrome. The owner is doing this.
3. **Google Calendar:** create a Google Cloud OAuth Web client (steps in notes/calendar.md: Calendar API,
   2 scopes, test users, origins `https://funny-clowns.vercel.app` and `http://localhost:8731`).
   Put the Client ID in `CAL_CLIENT` in `source/parts/415-your-google-calendar.js`. **Never commit the
   client secret; the app does not need it.** Public use needs Google verification, which needs item 4.
4. **Privacy policy and terms page** (flaw 5). Needed for Google verification and for a public launch.
5. **Processing record** (flaw 4): Supabase, Vercel, Anthropic and Google as processors.
6. **Old branches:** delete every branch except `app` on GitHub. All of them are inside `app`.
7. **Git history** still holds old personal sample goals. Rewriting it is the owner's call.

**Known technical debt:**
- Flaw 6: Vercel functions run in iad1 (US); the database is in eu-north-1. Move functions to an EU region.
- Flaw 10: CSP uses `unsafe-inline` (the app is one inline file).
- Flaw 11: no CI. Add a GitHub Action that runs `sh source/build.sh` and `node tests/engine-purity.cjs`,
  then the browser suites.
- Flaws 8 and 9: some parts are large and could be split.
- Tests: modals, inputs and floor can fail on timing in a full run; run them alone before calling a break.

**Ideas, not started:** Outlook calendar; editing recurring events; keyboard shortcuts on the web;
an install prompt; a second language; local crisis lines by country; new tour slides when features ship
(each slide has a `since` date, so people see "New").

## 10. How to work on it

```
git clone https://github.com/OwnYourSystem/FUNNY-CLOWNS.git && cd FUNNY-CLOWNS
git switch -c my-feature              # always branch from app
# edit source/parts/... or source/head.html
sh source/build.sh
node tests/engine-purity.cjs
python3 -m http.server 8731 &         # serve the repo root
bash tests/run-all.sh                 # about 25 minutes, 45 suites
git push -u origin my-feature         # Vercel builds a preview
```

On a machine without the original paths, set `PW_MODULE` (the Playwright package) and `CHROME_PATH`
(a Chromium). See README.md.

**Release:** merge into `app`, wait for the preview of `app`, check it (`/api/tutor?verify=1`, a phone,
a big screen), then promote that deployment to production in Vercel. Roll back by promoting the previous
production deployment. Record each release in notes/deploying.md.

**Database changes:** add a file to `supabase/migrations/`, run it in the SQL editor (or with the
Supabase CLI), then deploy any changed edge function.

## 11. Rules the owner set (keep them)

- Production changes only on the owner's explicit yes.
- New tables, migrations, vendors, AI prompts or models: ask the owner first.
- Never remove an AI feature without asking.
- No personal data to new vendors without the owner's yes.
- Never put keys or secrets in the repo, in chat or in logs.
- Words in the app: plain, short, calm, numbers as digits, no em dashes.
- Accessibility: WCAG 2.2 AA (the suites run axe), touch targets of 44px, respect reduced motion.
- The phone design and its 4 tabs stay as they are unless the owner says otherwise.

## 12. For the marketing fork

- Fork from `app`. Work on copy, the landing page, flyers and screenshots in your fork.
- Brand files: notes/brand/ (Qordel icon, wordmark, flyer prompts, owner card) and notes/brand/brand.md.
- Product claims must match the app. Good sources: the tour text (`source/parts/594-the-tour.js`),
  notes/solution-overview.md, notes/principles.md, notes/comparison-motion-sunsama.md.
- Privacy claims must match section 7. Do not say "nothing leaves your device": the board syncs with an
  account, and AI questions go to Anthropic.
- Send changes back as a pull request into `app`. Do not change `index.html` directly; it is built.
- A Vercel preview of a fork is not set up. Ask the owner if you need one.

## 13. Where to read more (notes/)

| Topic | File |
|---|---|
| Open list and status | parked.md |
| Every deploy and its tests | deploying.md |
| AI decisions | ai-decisions.md, tutor-llm-parked.md |
| Calendar (setup, privacy, rule 6) | calendar.md |
| Qordel web | web.md |
| Phone app and pages | phone-app.md, phone-pages.md |
| Journal and privacy | journal.md, journal-privacy-progress.md |
| Push reminders | push-design.md, push-nfr.md |
| Memory | memory-design.md |
| Voice | voice.md |
| Product plan | v2-brief.md, v2-plan.md, solution-overview.md, principles.md |
| Research behind the rules | science-*.md, adaptive-1-percent-method.md, user-sessions-anxiety.md |
| Design reviews | hig-review-2026-10-17.md, hig-review-2026-10-19.md, apple-principals-2026-10-19.md |
| Brand | brand/ |
