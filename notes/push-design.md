# Reminders and hints that reach a closed page: not built, and what it needs

Written 2026-10-02.

## What works today

`checkRemind()` runs once a minute while the board is open and Reminders are on.
It fires the morning brief, then the day's hint on the next tick, then an
afternoon check. If the page is closed, or the phone has suspended it, nothing
fires. A web page cannot wake itself.

## What would fix it

A real push, which needs a server the board does not have:

1. **Keys.** A VAPID key pair for Web Push. The private key is a secret held on
   the server only.
2. **A service worker handler.** `sw.js` gets a `push` event that shows the
   notification, and a `notificationclick` that opens the board.
3. **A subscription per device.** The page asks permission, calls
   `pushManager.subscribe`, and stores the result (an endpoint URL and two keys).
   An endpoint is personal data: it identifies a device. It belongs in the
   account's own row, protected by the same row-level security as the board.
4. **A scheduler.** Something that runs every few minutes (a Vercel cron or a
   Supabase scheduled function), finds who is due (their brief time, in their time
   zone), builds the day's hint on the server, and sends it with the `web-push`
   library.
5. **The hint on the server.** `hintCands()` reads the person's event log, which
   today lives in the browser and in the synced board document. The server would
   need to read that document, so it would hold the person's data in a place it
   does not today. That decision belongs to the governance phase.
6. **Platforms.** On iPhone and iPad, web push works only for a board added to the
   home screen. Android Chrome works in the browser.

## Why it was not built now

It needs secrets you must create, a table and a cron you must approve, a new
dependency, and a decision about the server holding behavioural data. Each of
those is the parked reliability, security and governance work. Once that is
settled, steps 2 to 4 are small.
