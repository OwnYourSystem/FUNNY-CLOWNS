# Push notifications: non-functional requirements

Written 2026-10-05, before any code. It replaces the "not built" note in `push-design.md`.

## Why

Today the board can show a reminder only while a page of it is open. If the
person closes the tab or the phone suspends the page, nothing comes. To the
person this looks like "notifications are failing". A web page cannot wake
itself. A push message from a server can.

## When a person gets a notification

Only two kinds. Both need the person to have turned Reminders on.

| Kind | When | Text (made on the device) |
|---|---|---|
| Morning brief | At the brief time (default 07:30), once a day, only before the day end | The board's own brief for today: how big today is, and the first step |
| Afternoon check | At 15:00, once a day, only before the day end | How many things in Today are still open, and the first 3 names. If none: "Today is clear." |

Never more than 2 a day. Nothing after the day end. A hint is not pushed: it
stays a card on the board, and a reminder while the board is open.

## Requirements

### Consent and control

- N1. The browser permission question appears only after the person presses Reminders and says Continue. Never on page load.
- N2. Turning Reminders off removes the subscription from the server within 5 seconds, or says plainly that it could not.
- N3. The Reminders button always says the truth: "Reminders on (push)", "Reminders on (while open)", or "Reminders off".

### Privacy

- N4. The server holds only what it needs to send: the device address (endpoint and two keys), the time zone, the brief time, the day end, and which of the two kinds are on, plus the date of the last send of each.
- N5. The server never holds a task name, a goal, a note, a check-in, or any text of a notification.
- N6. The message the server sends carries one word: `am` or `pm`. The device writes the text from a small summary the board keeps on the device (Cache API), refreshed each time the board saves.
- N7. If the summary is not from today, the device shows a plain line ("A new day. Open the board to see what fits it.") and never old numbers.
- N8. The weekly check-in is not in the summary, and not on the server.

### Quiet by design

- N9. At most 2 pushes a day per device; the server enforces it with the last-send dates, not the device.
- N10. Nothing is sent at or after the day end, in the person's own time zone.
- N11. A brief that is more than 90 minutes late (server down, device asleep) is dropped, not sent late.
- N12. A push is built to expire after 1 hour (TTL). A stale one is not shown.
- N13. Notification text is plain words. No guilt, no streak talk, no "you missed". The same tone as the board.
- N14. Notifications share a tag with the in-page reminders, so a person with both gets one, not two.

### Reliability

- N15. The brief arrives within 5 minutes of its time, on 95% of days, when the device is online. This is a goal, not a promise: the push services do not guarantee delivery.
- N16. A dead address (404 or 410 from the push service) is deleted at once. 5 failures in a row delete it too.
- N17. If push is not available (a browser without it, an iPhone page that is not on the home screen, blocked permission), the board says so in plain words and falls back to the reminders that work while it is open.
- N18. A server fault never changes the board. The board works the same with no server.

### Security

- N19. The private signing key (VAPID) is made on the server, stays on the server, and is never sent to a browser, a log or this repository. Only the public key is public.
- N20. The server accepts a device address only from a known push service (Google, Mozilla, Apple, Microsoft) over https. It never calls any other address.
- N21. Table access is denied to every browser role. Only the server function can read or write it. (Row-level security on, no policies, grants revoked.)
- N22. The scheduled call carries a secret that only the database and the function know. A call without it is refused.
- N23. A subscribe call is limited in size (2 KB), a device can change its row at most once every 10 seconds, and the table is capped at 5,000 rows. There is no per-address rate limit beyond that; that is a known gap.
- N24. Unsubscribing needs the device's own keys, so nobody can remove someone else's.

### Platforms

- N25. Android Chrome, desktop Chrome, Edge and Firefox: in the browser or installed.
- N26. iPhone and iPad: only when the board is added to the home screen, iOS 16.4 or later.
- N27. Anywhere else: fallback in N17.

### Accessibility

- N28. Title under 40 characters, body under 120. Text works without sound or an icon. Pressing the notification opens the board.

### Testability, and what cannot be tested here

Tested in this project, automatically:
- the schedule rules (N9 to N11) as plain code, many days, many zones, including summer time changes;
- the device side: the service worker shows the right text from a summary, a stale summary, and no summary; a press opens the board;
- the page side: the Reminders flow, the stored subscription, the button text, off and on, with a pretend push service;
- the allowlist and size checks of the server (N20, N23).

Not testable from this project, so not claimed:
- delivery through a real push service to a real phone, and its timing (N15);
- iPhone behaviour (N26);
- that the scheduled job in the database fires on time in production.

These need one real device and one day of watching. The write-up says so, and the board does not say "reminders work" until a device has received one: the button says "Reminders on (push)" only after the server confirms the subscription.

## Out of scope

Hints by push. Email or SMS. Sending the person's tasks to a server. Notification actions (snooze, done). A different time per kind.

## Status (2026-10-05)

Built and deployed:
- database: tables `push_subs` and `push_config` (closed to every browser role), and a job `push-tick` that calls the function every minute while at least one device is subscribed;
- function `push` (public, with its own checks): `/config`, `/subscribe`, `/unsubscribe`, `/tick`;
- page: the Reminders button, the subscription, a summary kept on the device, a sync when the brief time or day end changes;
- service worker: `push` and `notificationclick`.

Tested here: N6, N7, N9 to N12, N14, N16 logic, N20 to N24 checks, N28 length, the page flow and the worker with a pretend push service (36 checks).

Not tested, and not claimed: delivery to a real phone, the timing in N15, iPhone, and the database job firing in production. The first real device that turns Reminders on is the test. Someone who already had Reminders on has to press the button off and on once, because the new server sharing needs their yes.
