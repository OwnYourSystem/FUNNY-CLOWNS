# The phone app

Built 2026-10-15 from the agreed wireframes (https://claude.ai/artifact/PKNcqBYvqWfzmtz2cquXPd). Phone width only (below 820px); the desktop is unchanged.

## Why

Measured on the old phone board at 390 px: the Board was 5.9 screens long with 92 buttons, the Planner 5.4 screens with 61. The one decision ("Do this now") was cut to one letter on the first screen.

## What it is

- **Now:** the date and the day size; yesterday's journal note in one line; one task with its reason and two buttons (Start it / Something else for the board's pick, Done / Not now for a step already in Today); Today as a plain list; days you finished something, of the last 7. It fits one screen.
- **Talk:** the assistant as a full page, with Speak.
- **Journal:** where you left off, Start of day and End of day, every entry.
- **You:** account; Goals, Backlog, Tags, Archive; day end, reminders, work hours; weekly check-in; backup and reset; theme; Classic view.
- **Onboarding:** three screens on a first open: welcome, your day (day end and the two reminders), first goal and step.

Same engine, same data, same storage. Backlog, Tags, Archive and the Planner are still the old pages, shown under a Back bar. Classic view brings the old phone board back; a Phone view button returns.

## Not done yet

- A phone design for Backlog, Tags, Archive and the Planner (they are the old pages).
- Swipe on Today's list (tap the ring for now).
- Goal detail with editing (a goal opens a read-only list of its steps).
- The visual layer: type, colour and spacing beyond the plain structure.

## Tests

`tests/phone.mjs`, 18 checks: the desktop unchanged, onboarding (refusal of a late time, saved choices, first goal), Now (one card above the fold, Something else, Start it, Done, day size), Journal (write, list, yesterday's line on Now), Talk (full page, Speak, closes when you leave), You (day end, reminders), Goals (list, steps, new goal), the old pages under Back, Classic view and back, no page errors. The other browser suites now run in Classic view, since they test the classic board.
