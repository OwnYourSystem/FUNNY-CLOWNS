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

## Extra: your photo (asked the same day)

You has a round photo at the top. Tapping it (or Add a photo / Change photo) opens the phone's own picker, camera or library. The picture is cut to a centred square and made 256px, a JPEG of about 20 KB. It is kept in its own storage key (`<board key>.photo`), like the journal: not in the board's data, so no account sync, no backup file, never sent to the tutor. Once set it shows small (34px in a 44px target) at the top right of every page (Now, Talk, Journal and its days, Goals, a goal, a step, the old pages) and leads to You; You shows it large. "Show it on every page" (on by default) hides the small one. Remove photo asks first. Only a JPEG data URL this code made is ever shown, so a tampered value cannot put markup on the page.

Choice made: the photo stays on the phone it was picked on. Carrying it to other devices would mean putting it in the synced board data; say so if wanted.

## Choices made without asking (easy to change)

- Yesterday's note on Now and on the Journal page also hide their words until tapped, since both showed entry text before.
- The classic board's Journal panel got the same closed days, so the privacy is the same on a computer.
- "Steps finished" counts net of Undo; the board's own `completions` (used by the tutor and the event tests) is unchanged.
- The goals meter's "a week ago" figure is rebuilt from the progress log with the same plain average as `overall()`.

## Tests

`tests/journal-progress.mjs`, 20 checks (the 14 below, plus 6 for the photo: none at first; a picked picture is kept as a 256px square JPEG outside the board data and shows on You; the small one is top right on Now, Journal, Goals, Talk, an old page, a goal and a step, 44px, covering nothing, leading to You; the switch; Remove with a confirm; a tampered value is never shown): the top of Now (date with year, week, clock that runs, at the top); the week (12 against 5 with an undone Done left out, 5 of 7 days, meter equals the overall figure, 7 columns, only the tallest labelled, heights follow the counts, bars at most 24px, tap reads a day, table of 7, 44px targets, no sideways scroll); privacy (strip without words, strip opens the note, Journal without words, Show it and closing on leave, day page and Back); editing (a two-day-old entry, keeps date and time, notes the change, cannot be emptied, Remove asks, last entry of a day returns to the Journal); classic (closed days, words only when opened, Edit there); no page errors.

`journal.mjs` (2 checks) and `phone.mjs` (2 checks) now detect which build they face: on this branch they check the words are hidden, open the day or note, then check the same words as before. On `app` they behave as before.
