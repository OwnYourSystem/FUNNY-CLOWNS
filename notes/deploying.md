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
