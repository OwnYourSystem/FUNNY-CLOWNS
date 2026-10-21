# How the board gets to funny-clowns.vercel.app

Written 2026-10-05, after the live site was found 20 commits behind.

- The live address `funny-clowns.vercel.app` serves the **production** deployment only.
- A push to `app` or to the dashboard branch builds a **preview**, not production
  (`target: null` in the deployment list). Every "READY" reported on those pushes was a
  preview. The artifact is separate again: it is republished by hand.
- Until 2026-10-05 the production deployment was commit `00d4813` (22 September). It had
  none of the work done since: dose sizing, event log, evidence library, experiments,
  memory, hints, safety line, barrier question, dialogs, "When?" and "How long?", minimum
  day and the tutor confirm.
- Promoting a preview was refused (422). A production deployment was created from the git
  commit instead (`target: production`, `ref: app`, sha `fe03177`), which rebuilds it.
- Rule from now on: after a change ships, say which address shows it, and check that
  `funny-clowns.vercel.app` serves the new commit. A preview READY is not the live app.
- The browser keeps the board in `localStorage`, so each address has its own data. The
  live address keeps the data it already had; the new code reads it and adds what it needs.
  Use Backup (footer) to save a board before trying a new build on it.
- Rolling back: promote or redeploy the previous production deployment
  (`dpl_7MfsiA1YbRbGeGcLz2QJwrscdZnA`, commit `00d4813`).

## 2026-10-18: production moved to 1daba83

- Owner said "push all the changes to the prod link". `app` was fast-forwarded from 51e4a10 to
  1daba83 (journal privacy and editing, the week card, date and clock, the photo, the phone pages).
- Full regression on 1daba83 before the deploy: every suite passed; one timing check (the clock)
  failed under load, passed alone, and was made to poll (tests commit on the dashboard branch).
- Production deployment `dpl_D2GtpSS9r9VdzTfB3XL7n8CT6An8` (`target: production`, `ref: app`,
  sha 1daba83), READY, aliased to funny-clowns.vercel.app. Checked: the live `sw.js` is `board-v8`
  (it was `board-v5` on 14877b7).
- Rolling back: redeploy or promote `dpl_9XwXeL5RJqjEKyJpz9DoVwmrm2D7` (commit 14877b7, 6 October).

## 2026-10-19: production moved to 8db3ba2 (Daysize)

- Owner: "release all, when you are done". Contains bd01e50 (the Daysize name, the mark, the
  Android badge, the test reminder) and 8db3ba2 (name in Ruba on every page, plain greys with plum
  on buttons only, Talk writes at the top).
- Full regression on 8db3ba2 passed; phone-pages had one colour check still expecting plum on the
  interview dots, updated to the owner's new rule and rerun green.
- Production deployment `dpl_8BdQZSfY1ozbyWwh2vWpTJLKjNCJ`, READY, aliased to funny-clowns.vercel.app.
  Checked live: manifest name "Daysize", `fonts/Ruba-Regular-LICENSE.txt` served.
- Rolling back: `dpl_D2GtpSS9r9VdzTfB3XL7n8CT6An8` (1daba83, 18 October), or before that
  `dpl_9XwXeL5RJqjEKyJpz9DoVwmrm2D7` (14877b7, 6 October).

## 2026-10-19 (afternoon): production moved to 3aeac1e (OwnYourDay)

- Owner: "Push all to prod". Contains a127f32 (OwnYourDay name and mark, "Powered by OwnYourSystem",
  no Classic view on the phone), 4cca30e (assistant replies as cards with headings and rows) and
  3aeac1e (day start beside day end, Sign in first on You).
- Full regression on 3aeac1e: every suite green (purity 315).
- Production deployment `dpl_BJFA9KkYph33MqT4zsrzYbEWqJvQ`, READY, aliased to funny-clowns.vercel.app.
  Checked live: manifest name "OwnYourDay"; `fonts/Outfit-OFL.txt` served.
- Rolling back: `dpl_8BdQZSfY1ozbyWwh2vWpTJLKjNCJ` (8db3ba2, Daysize, this morning).

## 2026-10-19 (evening): production moved to 42087bc (guide, HIG review 2)

- Owner: "value first, then release it". Contains f59dc59 (HIG review 2: switches, Undo for Clear,
  photo level with Clear), a0b9c69 and 42087bc (the first-time guide, value first: welcome and first
  goal, then Now with a "Set up your week" card that opens the 5 guide screens and stays until done).
- `claude/phone-onboarding-guide` was fast-forwarded into `app`. Full regression on 42087bc: all 30
  suites green, no failures (purity 315).
- Production deployment `dpl_Hq6W2Ys2U8BUUvkMUkz9a46QYfum`, READY, aliased to funny-clowns.vercel.app
  (sha 42087bc per Vercel).
- Rolling back: `dpl_BJFA9KkYph33MqT4zsrzYbEWqJvQ` (3aeac1e, OwnYourDay and day start, this afternoon).

## 2026-10-19 (night): production moved to 3c6f71c (Qordel)

- Owner: "use capitals, then release it". Contains bda5820 (Planck, never released on its own),
  be2c771 (Qordel, the tagline on the welcome) and 3c6f71c (QORDEL in capitals in the app font).
- Full regression on 3c6f71c: all 30 suites green, no failures (purity 315).
- Production deployment `dpl_3SwciVrg7rvAm3KDePAA7h78XBz2`, READY, aliased to funny-clowns.vercel.app.
  Checked live: manifest name "Qordel"; `fonts/Ruba-Regular-LICENSE.txt` now 404 (only the Planck and
  Ruba-Qordel builds had it), so the capitals build is the one served.
- Note: the Git hook missed the bda5820 push (no preview was built); a preview was created by hand.
- Rolling back: `dpl_Hq6W2Ys2U8BUUvkMUkz9a46QYfum` (42087bc, OwnYourDay with the guide, this evening).

## 2026-10-19 (late night): production moved to 7b9d4cc (backup carries the private parts)

- Owner: "release it". The backup file carries the journal, weekly check-ins and photo (switch on by
  default); a restore adds back only what is missing. Full regression green (one voice timing flake,
  fixed in the test, 3 clean runs alone).
- Production deployment `dpl_BjsGnWWBus4J3xNUiWPPzc5ewmBj`, READY, aliased to funny-clowns.vercel.app.
- Rolling back: `dpl_3SwciVrg7rvAm3KDePAA7h78XBz2` (3c6f71c, Qordel in capitals).

## 2026-10-19 (late night): production moved to 3bcd31b (monthly backup reminder)

- Owner: "release it". A "Back up your board" card on Now when there is something to lose, the board
  is 7 days or more in use, and no backup was saved in 30 days. Later hides it for 7 days.
  Full regression green (31 suites, backup-reminder 8 checks, purity 315).
- Production deployment `dpl_7gWkLzqaKKfpwSYVs2N29Y2hazYK`, aliased to funny-clowns.vercel.app.
- Rolling back: `dpl_BjsGnWWBus4J3xNUiWPPzc5ewmBj` (7b9d4cc, backup carries the private parts).

## 2026-10-20: production moved to b926c96 (energy, sequence, AI order suggestion)

- Owner: "release it". Everything since 3bcd31b: the energy battery and easy steps; logo C (QORDEL
  letter-spacing -0.02em, icons redrawn, cache board-v15); sequence, not deadlines (steps in their
  order, one optional delivery day, pace); the missed delivery day asked by notification and card;
  good day steps set by the person; AI proposes an order (Claude Haiku 5.5 behind api/order.js,
  key QORDEL_ORDER_KEY, consent once, Undo); drag to reorder with Undo.
- Full regression on b926c96: 37 suites, 912 checks, 0 failures.
- Production deployment `dpl_4mVsS5tWUANNbC3A8HriCKGfjJp2`.
- Rolling back: `dpl_7gWkLzqaKKfpwSYVs2N29Y2hazYK` (3bcd31b, the monthly backup reminder).
- Open before the AI suggestion is promoted publicly: the privacy policy names Anthropic; region
  decision (Anthropic API runs in the US or global, not the EU).

## 2026-10-20 (evening): preview 4e80a03 (five rules, right column removed), NOT in production

- Owner: "the rules are fine, remove the right column". The five rules decide the next step; hints,
  the evidence library, the low-day question, experiments, What the board learned, news, the step's
  own date, goal priority, commute, sharpest, training, Never plan over and the AI order suggestion
  are gone (api/order.js and api/news.js deleted). The minimum day is now My easy things.
- Preview deployment `dpl_5kHLr9TqaKeFHkjPs9FAydbLabgh` (funny-clowns-git-app-oys-s-projects.vercel.app).
  Production stays on b926c96 until the owner says "release it". 7d04733 (desktop parity) is in it.
- The tests now run on one clock: tests/_clock.mjs starts every page today at 18:00 (rule 2 rests the
  board after 21:00, so a night run saw a different board). TEST_CLOCK=off uses the real time.
- Full regression: 32 browser suites, 695 of 696 checks on the run before the last fix (floor counted
  the chips before the strip redrew; it now waits), purity 216, dose and events clean.
- (Corrected 2026-10-21: keep QORDEL_ORDER_KEY. The AI order suggestion came back, see below.)

## 2026-10-21: preview ce904ea (the AI restored), NOT in production

- Owner: "Why did you remove AI ... AI is the personal tutor and the coordinator" and "yes, restore both".
  The AI order suggestion (api/order.js, Claude Haiku 5.5, QORDEL_ORDER_KEY) and the tutor's memory
  (get_memory, propose_memory, forget_memory; Keep it / Not now sheet; remember / forget in Talk) are back.
  No side panel. The tutor itself was never removed (api/tutor.js, ANTHROPIC_API_KEY, Opus 5.5 by default).
- Preview deployment `dpl_5TaH7URzEmKspWzaMpgryaq13BaV` (funny-clowns-git-app-oys-s-projects.vercel.app).
- Full regression: 35 browser suites, 739 checks, 0 failures; purity 228.

## 2026-10-21: preview 1c2e763 (the board learns from behaviour), NOT in production

- Owner: "the AI agent should learn from user behavior in order to give customized recommendations.
  It was one of the principles from the very beginning of this project." Recorded in notes/principles.md.
- Findings once a day, asked in a "Something I noticed" card (Keep it / Not now); kept notes go to the tutor.
- Preview deployment `dpl_AgV8RPe2jKs5XeQffiVCR2k9gyXm`. Full regression: 35 browser suites, 758 checks,
  0 failures; purity 238.

## 2026-10-21: preview abeed3e (read aloud, WCAG 2.2 AA fixes), NOT in production

- Owner: "close the 3 gaps, start with read aloud". Read aloud is built. The automated accessibility
  audit (tests/a11y.mjs, axe-core 4.10.2 in tests/vendor, MPL-2.0) passes 47 checks after the fixes.
  The real-phone screen-reader test (notes/screen-reader-test.md) and the user sessions
  (notes/user-sessions-anxiety.md) need people and are ready to run.
- Full regression: 37 browser suites, 818 checks, 0 failures; purity 239.

## 2026-10-21: production moved to abeed3e (5 rules, AI restored, learning, read aloud, WCAG fixes)

- Owner: "release it". Everything since b926c96: desktop parity (7d04733); the 5 rules and the right
  column removed (4e80a03); the AI order suggestion and the tutor's memory restored (ce904ea); learning
  from behaviour (1c2e763); read aloud and the WCAG 2.2 AA fixes (abeed3e).
- Full regression on abeed3e: 37 browser suites, 818 checks, 0 failures; purity 239.
- Production deployment `dpl_AmgQNBgD9ux5mQa3SvYBTeLFuwne`.
- Rolling back: `dpl_4mVsS5tWUANNbC3A8HriCKGfjJp2` (b926c96, energy, sequence, AI order suggestion).
- Not in this release: an in-app note that tells existing users the next step is now chosen by the
  5 rules (principle 6, "no surprise"). Open: confirm ANTHROPIC_API_KEY is set for the tutor.

## 2026-10-21: preview (What changed card, demo board), NOT in production

- Owner: "do 1 and 2". The What changed card for boards from before the release, and the demo board
  (?demo=session) for the user sessions. Full regression: 38 browser suites, 830 checks, 0 failures.

## 2026-10-21: production moved to 666544d (What changed card, demo board)

- Owner: "Release all". On top of abeed3e: the What changed card for boards set up before
  2026-10-21, and the demo board (?demo=session) for the user sessions.
- Full regression on 666544d: 38 browser suites, 830 checks, 0 failures; purity 239.
- Production deployment `dpl_6CE4wi89HY9VitjytKRJFNCqF7BQ`.
- Rolling back: `dpl_AmgQNBgD9ux5mQa3SvYBTeLFuwne` (abeed3e, read aloud and the WCAG fixes).
- Still open: confirm ANTHROPIC_API_KEY is set for the tutor.

## 2026-10-21: preview (example goals to tap), NOT in production

- Owner: "do 3, example goals to tap". Full regression: 39 browser suites, 836 checks, 0 failures.

## 2026-10-21: production moved to 6f03082 (example goals to tap)

- Owner: "release it". On top of 666544d: 6 example goals to tap on the first-goal screen.
- Full regression on 6f03082: 39 browser suites, 836 checks, 0 failures; purity 239.
- Production deployment `dpl_EseVHrUjcKtivGaVajkPcthtdzYE`.
- Rolling back: `dpl_6CE4wi89HY9VitjytKRJFNCqF7BQ` (666544d, What changed card and demo board).

## 2026-10-21: preview (flaw 1 closed: Suggest an order needs sign-in), NOT in production

- Owner: "yes, fix flaw 1". api/order.js answers only a signed-in person; limits per person.
- The migration `supabase/migrations/20261021_ai_use.sql` is written and NOT applied. It makes the
  limits durable. Applying it is the owner's call (new table; Security Review and Compliance per the
  agent plan). Until then each server instance counts per person.
- Also on the owner: a monthly spend limit on QORDEL_ORDER_KEY in the Anthropic console.
- Full regression: 39 browser suites, 840 checks, 0 failures.

## 2026-10-21: production moved to 9e34323 (flaw 1 closed: Suggest an order needs sign-in)

- Owner: "release it". Production deployment `dpl_BtENKpLGeURiMdfVMv2Ahnu54KBF`.
- Rolling back: `dpl_EseVHrUjcKtivGaVajkPcthtdzYE` (6f03082, example goals). Rolling back reopens flaw 1.
- Full regression on 9e34323: 39 browser suites, 840 checks, 0 failures.

## 2026-10-21: live database read for flaw 2 (read-only, nothing changed)

- Supabase project `phicqgnzqnuwugzbgxxw` ("deliveries-board") runs in **eu-north-1** (Stockholm).
- boards: row-level security on, 4 own-row rules for signed-in people. Sound. Browser roles hold every
  table privilege (Supabase default), TRUNCATE included; not reachable through REST. Tightening written
  in 20261021090100_boards_tighten_grants.sql, NOT applied.
- push_status, push_hourly, push_alerts, 2 views, 3 owner-rights functions and 2 jobs were live with no
  file in the repo. Recorded in 20261021090000_record_live_schema.sql (idempotent), NOT applied.
- The 3 owner-rights functions are callable only by the server role. Sound.
- Edge functions: push (version 3) and alert. The repo now holds both as they are live; the push
  function's new address rule (flaw 12) is in the repo, NOT deployed.

## 2026-10-21: preview e9ff565 (flaws 2, 12, 5 AI notice, 7), NOT in production

- Owner: "release it, then do 2, 3 and 4". The app part (AI notice, AI label, Speak wording) is in the
  preview. The server parts wait for the owner: 2 migrations (record, tighten grants) and the push
  function's new address rule are written, not applied or deployed.
- Full regression: 40 browser suites, 851 checks, 0 failures.

## 2026-10-21: production moved to e9ff565 (AI notice, AI label, Speak wording)

- Owner: "Want all 3, go ahead". Production deployment `dpl_4osDtE5UrmXaXbnZKBrF7GuGMtVv`.
- Rolling back: `dpl_BtENKpLGeURiMdfVMv2Ahnu54KBF` (9e34323, flaw 1 closed).
- Full regression on e9ff565: 40 browser suites, 851 checks, 0 failures.
- The first migration (record_live_schema) was sent through the Supabase connection and came back
  "cancelled" (a confirmation was declined or timed out). Nothing was applied; the live migration list
  still ends at push_pm_time. The other 2 migrations and the push function deploy were not attempted.

## 2026-10-21: push function version 4 live (flaw 12 closed); migrations still cancelled

- Owner: "Yes" (retry). The first migration was sent a second time and again came back "cancelled".
  Not retried after that. The live migration list still ends at push_pm_time: none of the 3 is applied.
- The push function was deployed as **version 4** (verify_jwt off, as before). Read back from the live
  project: it holds the address rule (only funny-clowns.vercel.app, its previews and localhost get CORS
  headers; subscribe and unsubscribe from another site get 403 "other_site") and still records counts
  with push_record. The database's once-a-minute tick sends no Origin, so it is not affected.
- Rolling back the push function: redeploy the version 3 file (CORS "*") from git history before
  commit e9ff565 on the app branch.
- Still to apply, in this order, by the owner in the Supabase SQL editor or by a later approved run:
  20261021090000_record_live_schema.sql, 20261021090100_boards_tighten_grants.sql, 20261021_ai_use.sql.
  Until ai_use is applied, api/order.js counts per server instance (the in-memory fallback).
