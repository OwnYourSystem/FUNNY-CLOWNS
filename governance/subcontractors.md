# Subcontractors

The outside companies that process Qordel data, and what each one holds.
Written from the code and the README on 2026-10-25. Describes only what the app
does today. When a vendor or a data flow changes, this file changes first.

Qordel keeps most data on the person's device. Only three companies process any
data for the running product.

## Vercel (hosting)
- What it does: hosts the one-file app and runs the server functions
  (`api/order.js`, and the parked `api/tutor.js`).
- What it holds: the request and response of each server call while it runs,
  and the server logs. A log line holds a status, the model name, token counts
  and the time taken. It does not log what anyone wrote or said (code comments
  in `api/order.js` and `api/tutor.js`). Vercel does not hold the board, the
  journal or the check-ins; those stay on the device.
- Where named: README top ("Live at https://funny-clowns.vercel.app"), README
  "What is where" (`api/tutor.js` and `api/order.js` are "a Vercel function"),
  README "Settings that live outside the code" (Vercel environment variables).
- Region: not fixed in the code. To be confirmed with the vendor and recorded
  here.

## Supabase (account, reminders, region eu-north-1)
- What it does: the database and the push edge function, and it checks who is
  signed in for the AI endpoints.
- What it holds:
  - The account: one row per person in the `boards` table, holding their user
    id and a copy of their board. Row-level security limits each person to
    their own row.
  - The sign-in account itself (Supabase Auth).
  - The push subscriptions: per device, an endpoint address, two encryption
    keys, a time zone, reminder times, on/off flags, last-sent dates and a
    failure count. Never a task or a note.
  - Server-only counts: push health tables and the AI use rate-limit counter.
    No personal content.
- Where named: README "Settings that live outside the code": "Supabase project
  `phicqgnzqnuwugzbgxxw` (eu-north-1) holds the account sync (`boards`, one row
  per person), the push subscriptions and the push health tables." Code:
  `supabase/` migrations and functions.
- Region: eu-north-1.

## Anthropic (the AI)
- What it does: answers the AI calls. It is behind a server boundary, so the
  model can change without changing the product.
- What it holds while it answers:
  - From "Suggest an order" (`api/order.js`, live): one goal name and the names
    and ids of its open steps. Nothing else. Model `claude-haiku-5-5`.
  - From the tutor (`api/tutor.js`, built but parked): the chat transcript, the
    board tool results the model asked for, and (if the person connected Google
    Calendar) busy times, with meeting names only if the person turned that on.
- What it does not get: the journal, the check-ins, a photo, an email address
  or an account (code comment in `api/order.js`).
- Where named: README "What is where" ("the AI tutor (Anthropic)", "'Suggest an
  order' (Anthropic)"), README "Settings that live outside the code"
  (`ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`), notes/ai-decisions.md
  (Claude on the Anthropic API). Code: `api/order.js`, `api/tutor.js`.
- Retention and the region Anthropic uses, and a data-processing agreement:
  to be confirmed with the vendor and recorded here before the tutor is
  switched on. notes/ai-decisions.md lists this as still to write.

## Google (calendar, only if the person turns it on)
Listed for completeness. The calendar is built but off today (`CAL_CLIENT` is
empty, README "Settings that live outside the code"). When a person connects
Google Calendar, their browser reads the events straight from Google and keeps
a copy on the device. Qordel's own server never holds the calendar
(`source/parts/415-your-google-calendar.js`). Google is the person's own
account, not a Qordel subcontractor for the server, so it is noted here rather
than listed as a server processor.
