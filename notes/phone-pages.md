# Backlog, Archive, Tags, Planner and What the board learned as phone pages

Branch `claude/phone-pages`, made 2026-10-18 on top of `claude/journal-privacy-progress` (dc682c9), because the new pages must sit beside that branch's small photo and Journal. Merging this branch into `app` brings both. Test link: funny-clowns-git-claude-phone-pages-oys-s-projects.vercel.app (its own storage).

Before this, those four opened the board's own desktop pages under a Back bar: the last screens on the phone that looked and worked differently.

## What each page does

| Page | Route | What is on it |
|---|---|---|
| Backlog | `#/backlog` | Back to You; the Active / Backlog / Archive switch (shared with Goals); one row per idea (added date, or steps and percent for a goal waiting there); a search box once there are more than 4; "Add an idea" in the dock: a sheet with Speak that comes back for the next. A row opens a sheet: Make it a goal (or Make it active), which opens the new goal; Remove it, which asks first. Both with Undo. |
| Archive | `#/archive` | The same switch; one row per finished goal (archived date, percent); search over 4. A row offers Put it back on the board, which opens the goal, with Undo. |
| Tags | `#/tags` | Tag chips with goal count and average progress; picking narrows to the goals that carry every picked tag; a goal row opens the goal. The pick belongs to the phone page, so it never leaves the board filtered on a computer. |
| Planner | `#/planner` | Working days; work starts and ends; travel each way (capped at 240, as on the board); day end; when you are sharpest; when training fits; morning brief; the one thing that matters most; never plan over; where each goal can be done; what is held back right now and why (answers at once); Interview me again. Every change saves as it is made. |
| What the board learned | `#/learned` | The private side of the old Planner page: Learning on or off; the notes it keeps, with Remove; add a note (Speak, Remember it, Enter); the daily hint switches (Hints, Also as a reminder, Low-day check-in) and which hint kinds helped; Forget which hints helped; the weekly check-in (Check in, the last 4 with their average, Delete my check-ins); Erase everything it has learned. Opened from its row on You. |

Not on the phone, on purpose: News in the banner and the planner badge picture (the banner and the badge are desktop board furniture the phone never shows), and the Journal panel (the Journal tab has it).

## One code path

- New shared functions: `backlogAdd`, `backlogActivate`, `backlogRemove` (in `280-editing.js`) and `meSet`, `meDay` (in `550-the-planner-page.js`). The board's own Backlog and Planner now call them too.
- The switches and erase buttons on What the board learned press the board's own buttons, so the rules and confirmations are the same.
- `weekAsk` now returns its promise, so a page can redraw after a check-in.
- The interview (still the board's own overlay) is styled plum on the phone: body type, plum progress and Next, 44px choices.
- These pages are drawn once per visit (like the step page) so a background redraw never eats a half-typed search or field; their own actions draw them again, and `phUndoable` now always redraws.

## Tests

`tests/phone-pages.mjs`, 20 checks: Backlog (phone page, switch, rows with chevrons, dock; Add with Speak and the loop; Make it a goal opens the goal, Undo; Remove asks, Keep it, Remove it, Undo; search over 4 filters as you type and keeps focus); Archive (Put it back opens the goal, Undo); Tags (chips, narrowing by all picked tags, the board's filter untouched, a goal opens); Planner (every field present and saved, the 240 cap, working days, a typed field survives a background redraw, where saves, Interview opens in plum and Leave it closes); What the board learned (opened from You; Remember it and Enter; Remove; the four switches are the board's own; Check in lists the week with its average; Erase asks first and clears); classic (Backlog add, make a goal, remove; Planner days and fields still save); no page errors on either.

`phone.mjs` "Backlog opens ..." detects the build: on this branch it checks the phone page, on `app` the old page.

HIG audit on the 5 pages plus the Add sheet and the interview, light and dark: no target under 44px, no text box under 16px, nothing unlabelled, no sideways scroll. (The audit script reports the tab labels as low contrast in light mode since the tab bar became translucent; that is the script misreading `color(srgb …)`, not the page: muted on the near-white bar is about 5.6:1.)
