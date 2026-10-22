# Parked, 2026-10-22

Owner: "release everything remained and make it clean for the next development steps." Nothing is in progress. Everything below is pushed and live.

## Where things stand

- **Production:** https://funny-clowns.vercel.app runs `app` at dc3fd48 (deployment `dpl_9UN4Wh8NTrYg7E3Jt9QRcJJ3jvN5`). New since ce68b4b: the calm Talk page, Talk sense (low-energy days, "what can I take", small talk), the AI key fixes (QORDEL_ORDER_KEY and ANTHROPIC_WORKSPACE_ID), push version 5 (previews cannot sign up for reminders), and the tour (8 slides).
- **AI check:** `/api/tutor?verify=1` returned `{"configured":true,"works":true}` in production on 2026-10-22.
- **Rollback:** `dpl_3iNj1hEBMKvDRsWcKRQFR1HSandA` (ce68b4b).
- **Tests:** 45 suites, 950 checks, 0 failures (see notes/deploying.md).

## Branches

- `app`: production. Start every new piece of work from here.
- `claude/task-progress-dashboard-w4kltl`: tests and notes.
- Every other branch is fully inside `app` and can be deleted: `calendar-test`, `web-test`, `talk-test`, `tour-test`, `claude/birthday-gifts-reveal-app-m04y1g`, `claude/journal-checkpoint`, `claude/journal-privacy-progress`, `claude/phone-onboarding-guide`, `claude/phone-pages`. Deleting them from the session was blocked, so the owner deletes them on GitHub (Branches page), after the default branch is set to `app`.

## How to start the next piece of work

1. Branch from `app` (for example `next-test`).
2. Edit source/parts, then `sh source/build.sh`.
3. Run the full suite from the tests branch: `APP_ROOT=<app folder> bash tests/run-all.sh` (about 25 minutes, local server on port 8731).
4. Push the test branch; Vercel builds `funny-clowns-git-<branch>-oys-s-projects.vercel.app`.
5. Production only on the owner's "release it": fast-forward `app`, then deploy `app` to production.

## Waiting on the owner

0. **Remove the old preview's reminders on the phone:** Chrome, Settings, Site settings, Notifications, block every "funny-clowns-...-oys-s-projects.vercel.app" entry; keep funny-clowns.vercel.app. Or in the Supabase SQL editor: `delete from public.push_subs where id = 7;`.
1. **The Google Client ID**, to turn the calendar on. The steps are in notes/calendar.md. Never send the client secret.
2. **The 3 database migrations**, in this order: record_live_schema, boards_tighten_grants, ai_use. Paste them into the Supabase SQL editor, or approve the next try.
3. **A spend limit** on QORDEL_ORDER_KEY.
4. **The default GitHub branch** is still the birthday-gifts branch. Set it to `app`.
5. **Delete the merged branches** listed above.
6. **The git history** still holds the old goals. Rewriting it is the owner's call.

## Open flaws and ideas, not started

- Flaw 4 (processing record, now with Google and Anthropic for calendar data).
- Flaw 5 (privacy page and terms; Google needs them before the calendar can go public).
- Flaw 6 (Vercel functions run in iad1; the database is in eu-north-1).
- Flaw 10 (CSP `unsafe-inline`).
- Flaw 11 (CI build check).
- Flaws 8 and 9 (file splits).
- Calendar: Outlook; recurring-event editing.
- Web: keyboard shortcuts; an install prompt.
- Tutor: a durable rate limit; local crisis lines; a second language.
- Tour: add a slide (with `since`) when a feature ships, so people see "New".
- The flyer fixes and the mountain direction.
