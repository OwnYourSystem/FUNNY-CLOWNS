# Processing record

What Qordel holds, where it lives, why, how long it is kept, who processes it
and in which region. Written from the code and the README on 2026-10-25. It
describes only what the app does today. When a store, a field or a vendor
changes, this file changes first.

Most of a person's data never leaves their device. The server holds only what
sync and reminders need.

## Stores on the device (nothing leaves)

These live in `localStorage` in the browser on the person's own device. The
server never sees them.

### 1. The board (localStorage)
- What it holds: the person's goals, steps, progress, status, docks, day size,
  energy and settings. The whole working board.
- Where: `localStorage` key `KEY` on the device.
- Why: the board is the product. It must work offline and start fast.
- Kept: until the person clears it or clears the browser. The person can see,
  change and delete every part of it in the app.
- Processor: none. It stays on the device.
- Region: the person's own device.
- Code: `source/parts/040-what-the-planner-is-allowed.store.js`,
  `source/parts/060-where-you-are-right-now.store.js`. README "The data":
  "The board lives in `localStorage` on the device."

### 2. The journal (localStorage)
- What it holds: the person's own journal entries, a dated log.
- Where: `localStorage` key `JR_KEY` on the device.
- Why: a private record the person keeps for themselves.
- Kept: until the person deletes it.
- Processor: none. It stays on the device.
- Region: the person's own device.
- Code: `source/parts/165-the-journal.store.js`. README "The data": "The
  journal and the weekly check-in stay on the device only."

### 3. The weekly check-in (localStorage)
- What it holds: the person's weekly check-in answers, a dated log.
- Where: `localStorage` key `WEEK_KEY` on the device.
- Why: lets the person look back over their weeks.
- Kept: until the person deletes it.
- Processor: none. It stays on the device.
- Region: the person's own device.
- Code: `source/parts/150-the-weekly-checkin.store.js`. README "The data" names
  it with the journal as device-only.

### 4. The photo (localStorage)
- What it holds: a small square photo the person chose with the phone's picker,
  cut to 256px (about 20 KB) and kept as a JPEG. It shows at the top of the
  pages and on the You page.
- Where: `localStorage` key `KEY + ".photo"` on the device.
- Why: so the person sees their own photo in the app. It is theirs.
- Kept: until the person removes it. It is kept outside the synced board, so it
  never reaches the server. It is carried in the person's own backup file while
  they keep that on.
- Processor: none. It stays on the device.
- Region: the person's own device.
- Code: `source/parts/595-the-phone.js` (comment: "It stays on this phone in
  its own storage key, like the journal: no sync, never sent to the tutor").

### 5. The calendar copy (localStorage)
- What it holds: a copy of the time, name and reminder of the person's Google
  Calendar events for the next few days. Never guests, places or notes.
- Where: `localStorage` key `KEY + ".cal"` on the device.
- Why: so the board can plan around what is already booked, without the server
  ever holding the calendar.
- Kept: until the person turns the calendar off or deletes it. Google is the
  source; the copy refreshes from Google in the browser.
- Processor: Google (the source of the events, reached from the browser only).
  Qordel's own server never holds the calendar.
- Region: the person's own device. The calendar is built but off today:
  `CAL_CLIENT` is empty until a Google Client ID is set (README "Settings that
  live outside the code").
- Code: `source/parts/415-your-google-calendar.js` (comment: "the meetings
  stay on this device ... Qordel's server never holds the calendar").

## Stores on the server

### 6. The account (the `boards` table)
- What it holds: one row per person: the person's user id, a copy of their
  board as JSON (`data`), and two timestamps (`created_at`, `updated_at`).
- Where: Supabase Postgres, table `public.boards`, project
  `phicqgnzqnuwugzbgxxw`, region eu-north-1.
- Why: an optional account that carries the board between the person's own
  devices. README "The data": "An optional account carries the board between
  devices."
- Kept: while the account exists. Row-level security limits every read, insert,
  update and delete to the person's own row. Deleting the account user removes
  the row (`on delete cascade`). The person can delete their own row.
- Processor: Supabase (the database), Vercel (the functions that check who is
  signed in).
- Region: eu-north-1.
- Code: `supabase/migrations/20261021090000_record_live_schema.sql` (the
  `boards` table and its row-level security),
  `supabase/migrations/20261021090100_boards_tighten_grants.sql`. The account
  and the auth user live in Supabase Auth.

### 7. The push subscriptions (the `push_subs` table)
- What it holds, per device: a push endpoint address, two encryption keys for
  that address (`p256dh`, `auth`), a time zone, the morning and evening
  reminder times (`brief`, `wind`, `pmt`), two on/off flags (`am`, `pm`), the
  dates a reminder last went out (`last_am`, `last_pm`), a failure count, and
  timestamps. It never holds a task, a note or the text of a notification.
- Where: Supabase Postgres, table `public.push_subs`, region eu-north-1.
- Why: to send at most two reminders a day. The message is only the word "am"
  or "pm"; the device writes the words. README "The data": "The push server
  holds a device address, a time zone and reminder times, never a task."
- Kept: while the device is subscribed. A dead address is removed (a 404 or
  410, or five failures in a row). The person turns reminders off in the app,
  which removes their row.
- Processor: Supabase (the database and the edge function), Vercel (hosting).
  The notification is delivered by the browser's own push service (Google,
  Mozilla, Apple or Microsoft), to the endpoint the device gave.
- Region: eu-north-1 for the stored row. The push service is the one the
  person's own browser chose.
- Code: `supabase/migrations/20261005_push.sql`,
  `supabase/migrations/20261015_push_pm_time.sql`,
  `supabase/functions/push/index.ts`, `supabase/functions/push/schedule.js`.

### Server side-records that belong to push and AI (no personal content)

These are not a person's content, but they are server data, so they are listed
for honesty.

- Push health counts: `push_status`, `push_hourly`, `push_alerts`. Counts of
  runs, due, sent, removed and failed, and open or resolved alert markers. No
  task, no name, no address. Closed to every browser role; only the server
  reads them. Old rows are dropped after 90 days.
  Code: `20261021090000_record_live_schema.sql`.
- AI use counter: `ai_use`. Per person and day: the user id, the feature name
  ("order" or "tutor"), a date and three numbers. No content, no names. It is
  only a rate limit. Rows older than 7 days are removed on the next call.
  Code: `supabase/migrations/20261021_ai_use.sql`.

## What goes to the AI

The AI endpoints send Anthropic only what a question needs; they add no new
store.

- Suggest an order (`api/order.js`): sends one goal name and the names and ids
  of its open steps. Never the journal, the check-ins, a photo, an email
  address or an account. It does not log what anyone wrote. Code comment in
  `api/order.js`.
- The tutor (`api/tutor.js`): built but parked. When used, it sends the chat
  transcript and the results of the board tools the model asked for, plus (if
  the person connected Google Calendar) busy times, and meeting names only if
  the person turned that on. It does not log what anyone said. Code comment in
  `api/tutor.js`; notes/ai-decisions.md ("AI stays out of development for now").

Full AI detail is kept in `governance/ai-register.md`. The vendors are listed
in `governance/subcontractors.md`.
