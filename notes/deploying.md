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
