# F7 and F8: requirements

Written 2026-10-06. Requirements only. Nothing here is built. The `app` branch stays frozen while the owner tests.

- **F7** Delete my data, on the server and on request.
- **F8** Error reporting from real devices, and monitoring of the push job.

## What the live system holds today (checked 2026-10-06)

| Where | What | Personal? | Linked to a person? |
|---|---|---|---|
| The device (browser storage) | The board, check-ins, settings, push choice, sign-in token | Yes | It is on their device |
| Device cache | A short summary for push text | Yes | Same |
| Supabase sign-in (`auth.users`) | Email and sign-in identity. Currently 1 account | Yes | Yes |
| `public.boards` | The board as one block, one row per account. Currently 1 row | Yes | Yes, by account id |
| `public.push_subs` | Device address, two keys, time zone, brief time, day end, last-sent dates. Currently 2 rows | Yes (a device address) | **No.** Linked only to the device, not to an account |
| `public.push_config` | Server signing key, tick secret | No | No |
| `cron.job_run_details`, `net._http_response` | Logs of the once-a-minute job. Currently 1,582 and 360 rows | No names or tasks | No |
| Vercel function logs | The tutor writes counts and codes only, never what anyone said. The platform keeps request data such as addresses | Partly | No |
| The news and tutor functions | Pass-through. The hosted tutor is switched off | n/a | n/a |

Two findings that shape the requirements:
1. Push rows are **not tied to an account.** Deleting an account would leave them behind.
2. The job's own log (`cron.job_run_details`) **grows without limit** (about 1,440 rows a day). Nothing cleans it. The database's HTTP response log looks self-cleaning (360 rows, about 6 hours), but the cleanup job also trims it to be safe.

## F7: Delete my data

### What the person gets

- A button in the account area: **Delete my account and server data.**
- A dialog that opens only after they press it. It says exactly what will be deleted and what stays. It has "Not now" and a danger button.
- A step before the button: **Back up first.** It links to the existing backup.
- Confirmation by typing their own email address.
- After success: a plain message, and the app signs out. Nothing else on the page changes.

### Requirements

| # | Requirement |
|---|---|
| D1 | The action deletes: the person's `boards` row, their sign-in account and identities, and every push row linked to them. |
| D2 | A push row gets a `user_id` when the person subscribes while signed in (new nullable column, additive). A device that subscribed while signed out removes its own row with its keys, as today. |
| D3 | The delete runs in a server function that takes the **account from the verified sign-in token**, never from the request. The function can delete only the caller's own data. |
| D4 | Delete is final. No soft delete. Provider backups may keep a copy for a limited time. The privacy policy states how long (depends on the Supabase plan; to verify). |
| D5 | The device copy is the person's choice: after server deletion, ask whether to also erase this device (board, check-ins, push choice, cache). The default keeps it, so nobody loses their data by accident. The weekly check-ins live only on the device, and the dialog says so. |
| D6 | It is idempotent. If it fails halfway, the person sees which parts were not removed, and pressing it again finishes the job. |
| D7 | It finishes within 30 seconds, or says plainly that it could not. |
| D8 | It leaves one log line with the date and counts (rows deleted per table). No email, no content. |
| D9 | Push rows that belong to nobody (signed-out devices that never come back) are removed after 60 days without an update, or after 5 failed sends. |
| D10 | Export before delete: the person can already copy their whole board. Server-side export for a signed-in person is the same data, so no new export is built. |
| D11 | Only the person's own action opens the dialog. The assistant can open the account area but cannot delete. |

### Tests (automatic, with a test account)

- A test account with a board and two push rows. Delete. Every row is gone and the sign-in no longer works.
- A second account's data is untouched.
- A token for account A cannot delete account B. A request with no token is refused.
- A failed step is reported and a second press completes it.
- The dialog opens only from the button, and "Not now" changes nothing.

### Decision for the owner

- Legal retention: confirm that no data must be kept after deletion (invoices and the like do not exist yet).

## F8: Error reporting and monitoring

### Two parts

**A. The push job and the servers (no person involved).**

| # | Requirement |
|---|---|
| M1 | A health record for push, with no addresses: last successful run, due, sent, gone and failed counts per day. |
| M2 | An alert when the job has not run successfully for 15 minutes while any device is subscribed. |
| M3 | An alert when more than 20% of due devices failed in the last 24 hours (at least 5 due), or when every due send failed, or when nothing was sent for 36 hours while devices are subscribed. Dead addresses (404 or 410) are normal churn and do not count as failures. |
| M4 | Retention for the job logs: delete rows older than 7 days, by a small scheduled job. |
| M5 | Server errors carry a code only. No device address, no keys, no text in any log. |
| M6 | A private status view for the owner: today's numbers and the last 14 days. |

**B. The app on real devices.**

| # | Requirement |
|---|---|
| M7 | A new small server function receives error reports and stores them in a closed table. |
| M8 | A report contains only: error type and short message, the page area, the app version, the browser family and version, the time. **Never** a task, goal, note, check-in, email or any text the person typed. |
| M9 | Size at most 2 KB. At most 5 reports per device per day. Identical errors are counted, not stored again. Kept 30 days. |
| M10 | The app shows its version number in settings, and every report carries it. |
| M11 | **Push delivery confirmation.** The service worker counts each push it shows. The next time the app opens, it sends only the count, so we can compare "sent" with "shown" and know the real delivery rate. A push that arrives but cannot show is counted as a failure. |
| M12 | Error reporting is a setting: "Help fix bugs: send anonymous error reports." **It is off by default until the legal review decides.** Reason: sending reports from the device is probably not strictly necessary, so the EU rules on device access likely need the person's consent. |
| M13 | The setting is easy to find, says in plain words what is sent, and one press turns it off. |
| M14 | Delivery confirmation (M11) follows the same setting. |

### Tests

- The health record updates after a run, and a stopped job raises the alert within 15 minutes (simulated clock).
- Job logs older than 7 days are deleted and newer ones stay.
- An error report with a task name in its message is **refused or stripped** by the server (a test sends one on purpose).
- Over-size, over-rate and malformed reports are rejected.
- With the setting off, no report and no delivery count leaves the device.
- The service worker counts a shown push, and a push that fails to show is counted as a failure.

### Decision for the owner

- **Alert channel.** An alert needs somewhere to go. Choose one: an email from the server through a mail service (needs an account and a small cost), a message to a chat tool, or only a status page you look at (no alert). I recommend email.

## What was found in production today

Not part of the requirements, but it matters:
- Two devices are subscribed, both created on 5 October. Both show a sent morning push on 6 October and a sent afternoon push on 5 October, and 360 server calls succeeded. So the **server side of push works**.
- Whether the notification **appeared on the phone** is not known from the server. M11 closes that gap. For now, only the owner can say whether the 07:30 reminder arrived.

## Order and size

| Task | Part | Size | Needs |
|---|---|---|---|
| F7 | Column and cleanup job, delete function, dialog, tests | M (was S) | Nothing from the owner but the legal check |
| F8-A | Health record, retention job, status view, alert | S | Alert channel choice |
| F8-B | Report function, app setting, version, delivery count | M | Legal decision on the default |

F8-A can be built on the server before the owner's test ends, because it changes nothing the owner is testing. F7 and F8-B change the app and wait until the owner finishes testing.

## Status of F8-A (2026-10-06)

Live in the production database and functions:
- The migration `20261006_push_health.sql` was run by the owner in the SQL editor. The tool call for it was cancelled four times, so the owner's run is the one that applied.
- The rollback test `push_watch.test.sql` ended with `ALL PASS (rolled back)`: healthy state raises nothing, the job-stopped alert opens once and clears, send failures count only real failures (dead addresses do not), silence for 36 hours opens and clears, and no devices means no alert.
- The push function (version 2) reports counts after each run. The new `alert` function (version 1) is deployed.
- Checked after deploy: the status updates every minute, no alert is open, and no subscribed device has failures.
- Cleanup of the job log runs daily at 03:10 UTC (7 days kept).
- Alert mail is **not active yet**: it waits for the owner to create the mail account and store the key, recipient and sender in `push_config`. Until then, alerts are recorded in `push_alerts` and show in `push_status_now`, but no mail is sent.

Not yet done: F8-B (error reports from the app, delivery count), and all of F7. They change the app and wait until the owner finishes testing.
