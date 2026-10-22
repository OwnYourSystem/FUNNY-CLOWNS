# Google Calendar in Qordel

Owner, 2026-10-21: "I want the system to get connected to the Google calendar to read and write meetings and reminders. Then show the output in a new page. The ai can use it for recommendations too. Create a branch for test."

Branch: `calendar-test` (from `app` at 538743e, the flaw 13 work). Not in production.

## Why (owner, 2026-10-21)

People have doctor and hospital visits, school runs and other duties in their personal calendar. These are responsibilities, not goals. A planner for one day must know them: a full battery does not mean 3 steps if 2 hours go to the hospital. The owner asked for the simple version: no travel time and no warm-up window.

## Rule 6: what is booked comes first

- **No task during a booking.** Now says "Booked until 11:00: Dentist." and offers only an easy thing if the person wants one.
- **Booked hours make the day smaller.** Every 2 hours booked inside the person's day (day start to day end) removes 1 step, never below 1. The board says why: "2.5 hours are booked in your calendar today, so 2 steps."
- **One line on Now and on the desktop board:** today's bookings that are still to come. In the evening, when nothing more is booked today, it shows tomorrow's first booking, so the person can get ready.
- **Every calendar the person shows in Google counts** (family or school calendars, for example). Calendars hidden in Google do not count. An invitation that sits in 2 calendars is counted once.
- **The names stay on the device.** The rules run on the phone. The tutor gets the smaller dose and the busy times, and gets names only if the person allows them.

## What it does

- **Calendar page.** On the phone: You, then Google Calendar. On the desktop: the Calendar tab. It shows the next 7 days, today first.
- **Read.** Connect once. Qordel reads every event for the next 7 days, from the main calendar and every calendar the person shows in Google (up to 10): its time, name, whether it blocks time, and its first reminder. It never asks Google for guests, places or notes. Qordel adds events only to the main calendar.
- **Write.** Add meeting: a name, a day, a start, an end and an alert. It blocks the time. Add reminder: a name, a day, a time and an alert. It is a 15-minute event that does not block the time; its alert is the reminder.
- **Delete.** Only events that Qordel added, after a confirm. Google's own events have no Delete.
- **Talk without the AI.** "What's on my calendar" lists today.
- **The tutor.** It gets a calendar line in its board picture and 2 tools:
  - `get_calendar` is read-only. It gives busy times per day, the next booked slot today, and the free minutes before it.
  - `propose_calendar_event` fills in the Add meeting or Add reminder form. Nothing is added until the person presses Add.
  - The tutor has no delete tool.
  - Meeting names reach the tutor only when the person turns on "Let the tutor see meeting names". It is off by default.

## Where the data goes

| Data | Where it is kept | Who sees it |
|---|---|---|
| Google's access key | This browser tab only (memory and sessionStorage). It lasts about 1 hour. | Google, this tab |
| Events for 7 days (time, name, busy, first alert) | This device only (`localStorage`, key `oys-min-deliveries-v1.cal`). Not in the synced board, not in the account row. | The person |
| Busy times, next slot, free minutes | Sent to the tutor only when the person asks it something. The request goes through `api/tutor.js` to Anthropic. | Anthropic, for that answer |
| Meeting names | Same as above, only when the person turns that on | Anthropic, for that answer |

Qordel's server and database never store the calendar. Disconnect gives the key back to Google and deletes the copy on the device.

Google's sign-in script (`accounts.google.com/gsi/client`) loads only when a person opens the Calendar page while connected, or presses Connect. It never loads for everyone.

## Why this design, and not the v2 plan's

The v2 plan (F10) had a read-only calendar behind a server that holds Google sign-in keys. That would end "local first" for signed-in users, and it would make Qordel hold refresh keys for people's calendars.

This build uses Google's browser sign-in, the token model:
- No refresh keys are stored anywhere.
- No new table is needed.
- No server change is needed, apart from the tutor's tool list.

The cost: after about 1 hour, Refresh opens Google's window again. Usually it closes at once, because the person has already said yes.

## Setup only the owner can do (Google Cloud Console)

1. Use the Google Cloud project that runs Google sign-in for Qordel, or make a new one.
2. **APIs and services, then Library:** turn on **Google Calendar API**.
3. **Google Auth Platform (OAuth consent screen), then Data access:** add 2 scopes: `https://www.googleapis.com/auth/calendar.events` (read and write events) and `https://www.googleapis.com/auth/calendar.calendarlist.readonly` (see which calendars the person has, so a family calendar counts). If the second is not given, Qordel reads only the main calendar.
4. **Audience:** while the app is in Testing, add yourself (and any testers) as test users. Up to 100 people.
5. **Clients, then Create client, then Web application.** Under Authorized JavaScript origins, add these 3 addresses. No redirect address is needed.
   - `https://funny-clowns.vercel.app`
   - `https://funny-clowns-git-calendar-test-oys-s-projects.vercel.app` (the test branch)
   - `http://localhost:8731` (the tests)
6. Send me the **Client ID**. It ends in `.apps.googleusercontent.com`. It is public and goes into the page as `CAL_CLIENT` in part 415. **Never send the client secret.** The page does not need it.

Until step 6, the Calendar page says "Google Calendar is not set up for Qordel yet" and loads nothing from Google.

## Before the public can use it

- `calendar.events` is a **sensitive** scope. While the app is in Testing, only test users can connect, and Google shows them an "unverified app" warning.
- To open it to everyone, Google must verify the app. That needs a privacy policy page and terms (flaw 5), a home page on a domain you own, and a short reason for the scope. A sensitive scope needs no paid security check. That check is only for restricted scopes.
- The processing record (flaw 4) must list Google as the source of calendar data, and Anthropic as the receiver of busy times (and names, if on).

## Tests

`tests/calendar.mjs` has 26 checks (rule 6 included). It fakes Google's sign-in script and the Calendar API, so no real calendar is touched. It covers:
- connect, read and the fields asked for;
- the data staying on the device;
- add meeting, add reminder, delete;
- the refused and expired-key cases;
- the tutor with names off and on, and the propose flow;
- the desktop tab;
- the not-set-up state;
- the policy (CSP).

The suite runs it without the sample board (`TEST_SAMPLE=off`).

## Not built (yet)

- Travel time before a booking and a "short step only" window. The owner chose to leave these out.
- Calendars other than the primary one, recurring-event editing, and Outlook.
- A push cue after a meeting ends (v2 plan P10).
