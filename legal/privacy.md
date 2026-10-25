needs lawyer review

# Privacy

This is a draft. A legal professional must review it before it is published.
It describes only what Qordel does today, taken from the code on 2026-10-25.

## The short version

Most of your data stays on your device. Qordel's server holds only what it
needs to carry your board between your devices and to send you reminders. We do
not sell your data. We do not track you across other sites.

## What stays on your device

These never leave your device:

- Your board: your goals, steps, progress and settings.
- Your journal.
- Your weekly check-in.
- Your photo, if you add one.
- Your calendar copy, if you connect Google Calendar: a copy of the time, name
  and reminder of your events, kept on the device only.

You can see, change and delete all of this in the app.

## What the server holds

Only if you choose to use these features:

- An account. If you sign in, the server keeps one copy of your board so it can
  appear on your other devices. Only you can read or change your own copy.
- Reminders. If you turn on reminders, the server keeps your device's reminder
  address, your time zone, and the times you chose. It never holds your tasks
  or notes. The reminder we send is only the word that tells your device
  whether it is the morning or the afternoon message; your device writes the
  words.

The server also keeps counts with no personal content, to check reminders are
working and to limit how often the AI can be called. These hold no tasks, names
or addresses.

## The AI

When you ask the board to suggest an order for the steps of one goal, it sends
the goal name and the step names to Anthropic to get an order back. It does not
send your journal, your check-ins, a photo, your email or your account. It does
not keep a record of what you wrote.

A conversational tutor is built but switched off. Before it is switched on, we
will tell you what it sends, ask for your agreement, and publish the terms.

## Who processes your data

- Vercel hosts the app and runs the server functions.
- Supabase runs the database and the reminders, in the eu-north-1 region.
- Anthropic answers the AI call.
- Google is the source of your calendar, if you connect it, read straight to
  your device.

## Your rights

You can see, export and delete your data. Your board, journal, check-in and
calendar copy are on your device for you to manage. You can delete your account
copy and turn off reminders in the app, which removes your reminder record.

## Contact

behnam@ownyoursystem.com

## Still to settle before publishing

- The regions Vercel and Anthropic use, and the data-processing agreements.
- How long each server record is kept, stated plainly.
- The exact steps to erase an account and the auth record.
- A legal professional's review of this whole page.
