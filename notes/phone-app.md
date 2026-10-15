# The phone app

Built 2026-10-15 from the agreed wireframes (https://claude.ai/artifact/PKNcqBYvqWfzmtz2cquXPd). Phone width only (below 820px); the desktop is unchanged.

## Why

Measured on the old phone board at 390 px: the Board was 5.9 screens long with 92 buttons, the Planner 5.4 screens with 61. The one decision ("Do this now") was cut to one letter on the first screen.

## What it is

- **Now:** the date and the day size; yesterday's journal note in one line; one task with its reason and two buttons (Start it / Something else for the board's pick, Done / Not now for a step already in Today); Today as a plain list; days you finished something, of the last 7. It fits one screen.
- **Talk:** the assistant as a full page, with Speak.
- **Journal:** where you left off, Start of day and End of day, every entry.
- **You:** account; Goals, Backlog, Tags, Archive; day end, reminders, work hours; weekly check-in; backup and reset; theme; Classic view.
- **Goal page (`#/goal/<id>`):** a goal opens its own page. Each step shows its status, priority, deadline, repeat with streak, and tag, as the classic row does. Add a step by typing or Speak, with an optional repeat, then Add or Enter. Edit changes every classic goal field (name, priority, deadline, where, tags) and can move the goal to the Backlog, archive it or remove it.
- **Step page (`#/step/<id>`):** every field of the classic subtask editor (name, status, done % on a 5-step slider, priority inside the goal, deadline with Clear, repeats, tag), plus the Goal box (the classic drag to another goal), Put it in Today, When, How long, Mark it done, and Remove (asks first). Each change is saved at once, as on the board. The page is drawn once per step, so a background redraw never eats typing. The id is in the address, so reload and the phone's Back work. Both views now go through the same `editSub`, `editGoal`, `moveSub`, `addSub` and `removeSub` (`280-editing.js`), so they cannot drift apart.
- **Colour:** Moonlit Plum `#2C1332`, phone only (`html.ph` tokens). Dark: plum surfaces on `#140A17`, pale lilac `#D8C2E0` for the pressed and primary things. Light: plum for those on `#F6F2F7`. Red stays for danger. Text contrast is 4.5:1 or more on every surface. The browser bar takes the ground colour.
- **Onboarding:** three screens on a first open: welcome, your day (day end and the two reminders), first goal and step.

Same engine, same data, same storage. Backlog, Tags, Archive and the Planner are still the old pages, shown under a Back bar. Classic view brings the old phone board back; a Phone view button returns.

## Not done yet

- A phone design for Backlog, Tags, Archive and the Planner (they are the old pages).
- Swipe on Today's list (tap the ring for now).
- The visual layer: type, colour and spacing beyond the plain structure.

## Tests

`tests/classic-editor.mjs`, 8 checks, proves the classic subtask and goal editors behave as before the shared functions (it passes on the old build and the new one).

`tests/phone.mjs`, 35 checks: the desktop unchanged (and not plum), onboarding (refusal of a late time, saved choices, first goal), Now (one card above the fold, Something else, Start it, Done, day size), Journal (write, list, yesterday's line on Now), Talk (full page, Speak, closes when you leave), You (day end, reminders), Goals (list, new goal), the goal page (add by button, Enter and with a repeat, the same step as classic Add, a half-typed step survives a redraw, goal edit of all five fields), the step page (every classic field present, name with refusal of an empty one, typing survives a redraw, status and percent follow the classic rules, priority, deadline and Clear, repeats, When, How long, Today, done, reload, move to another goal, remove with a confirm), a Today item opens its step, the plum colours in light and dark, the old pages under Back, Classic view and back, no page errors. The other browser suites run in Classic view, since they test the classic board.
