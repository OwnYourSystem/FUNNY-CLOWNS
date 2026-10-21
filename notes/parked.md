# Parked, 2026-10-21

Owner: "Park it here." Nothing is in progress. Everything below is pushed.

## Where things stand

- **Production:** https://funny-clowns.vercel.app runs `app` at ce68b4b (deployment `dpl_3iNj1hEBMKvDRsWcKRQFR1HSandA`). It has Qordel web, flaw 13, the Calendar page ("coming soon"), rule 6 (off until a calendar is connected) and the tutor's calendar tools.
- **Rollback:** `dpl_4osDtE5UrmXaXbnZKBrF7GuGMtVv` (e9ff565).
- **Branches:**
  - `app`: production.
  - `calendar-test` and `web-test`: the test branches. Both are now inside `app`.
  - `claude/task-progress-dashboard-w4kltl`: tests and notes.
- **Tests:** 43 suites, 919 checks, 0 failures (see notes/deploying.md).

## Waiting on the owner

1. **The Google Client ID**, to turn the calendar on. The steps are in notes/calendar.md: the Calendar API, 2 permissions, test users, the 3 web addresses. Never send the client secret.
2. **The 3 database migrations**, in this order: record_live_schema, boards_tighten_grants, ai_use. They were cancelled twice through the connection. Paste them into the Supabase SQL editor, or approve the next try.
3. **ANTHROPIC_API_KEY** for the tutor in production: confirm it is set. Also set a spend limit on QORDEL_ORDER_KEY.
4. **The default GitHub branch** is still the birthday-gifts branch. Set it to `app`.
5. **The git history** still holds the old goals. Rewriting it is the owner's call.

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
- The flyer fixes and the mountain direction.
