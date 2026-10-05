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
