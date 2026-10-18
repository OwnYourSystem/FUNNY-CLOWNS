# Journal privacy, editing, the week from the air, and the top of Now

Branch `claude/journal-privacy-progress`, made 2026-10-18 from `app` at 51e4a10 (after the HIG passes). Developed apart from `app` at the owner's request; merge only when the owner says so.

Test link: funny-clowns-git-claude-journal-privacy-progress-oys-s-projects.vercel.app (its own storage: bring the board over by sign-in or backup file).

## The four asks and what was built

| # | Ask | Built |
|---|---|---|
| 1 | Journals editable, the old ones too | Every entry has Edit and Remove. Edit opens the sheet it was written in, filled in. The entry keeps its date and time (its place in the record) and gains the time it was changed, shown beside it ("changed 09:12"). An edit cannot empty an entry; Remove asks first and is for good. Works on the phone day page and in the classic Journal panel. |
| 2 | Journals hidden until a day is opened | Phone: the Journal page lists days only (date, which kinds), each a row with a chevron; a day opens on its own page (`#/jday/<date>`). Classic: each day is a closed `<details>`. Yesterday's note is a closed card ("Show it"); leaving the page closes it again. The strip on Now says "Your end of day note is waiting", not the words; tapping it opens the Journal with the note shown. |
| 3 | A short view of progress, to move the person to act | "Your week" on Now, under Today: steps finished in the last 7 days against the 7 before (a Done taken back with Undo does not count); days with a step done, of 7; all goals as one meter with how far it moved this week; 7 columns of steps per day (tallest labelled, tap a column to read its day; a hidden table carries every value for a screen reader). One colour, the accent; text in text colours. |
| 4 | Date, year and clock at the top of Now, as in the old version | "Sunday · Week 42" and a running clock (hh:mm:ss, mono, the accent) on the first line; "18 October 2026" as the title, the day size chip beside it. |

## Choices made without asking (easy to change)

- Yesterday's note on Now and on the Journal page also hide their words until tapped, since both showed entry text before.
- The classic board's Journal panel got the same closed days, so the privacy is the same on a computer.
- "Steps finished" counts net of Undo; the board's own `completions` (used by the tutor and the event tests) is unchanged.
- The goals meter's "a week ago" figure is rebuilt from the progress log with the same plain average as `overall()`.

## Tests

`tests/journal-progress.mjs`, 14 checks (11 fail on `app`, all pass on this branch): the top of Now (date with year, week, clock that runs, at the top); the week (12 against 5 with an undone Done left out, 5 of 7 days, meter equals the overall figure, 7 columns, only the tallest labelled, heights follow the counts, bars at most 24px, tap reads a day, table of 7, 44px targets, no sideways scroll); privacy (strip without words, strip opens the note, Journal without words, Show it and closing on leave, day page and Back); editing (a two-day-old entry, keeps date and time, notes the change, cannot be emptied, Remove asks, last entry of a day returns to the Journal); classic (closed days, words only when opened, Edit there); no page errors.

`journal.mjs` (2 checks) and `phone.mjs` (2 checks) now detect which build they face: on this branch they check the words are hidden, open the day or note, then check the same words as before. On `app` they behave as before.
