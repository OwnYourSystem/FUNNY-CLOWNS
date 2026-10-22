# Phone app against the Apple HIG, second review, 2026-10-19

The first review (`hig-review-2026-10-17.md`) covered 15 screens on `app` c45bcc6. This one covers what was built after it: the Journal day list and day page, the "Your week" card and the top of Now, the photo (large on You, small on every page, the remove sheet), Backlog, Archive, Tags, Planner and What the board learned as phone pages, Talk with reply cards, the Day starts and Day ends sheets, and the OwnYourDay brand row.

Method: an audit script (scratchpad `hig2/audit.mjs`, ephemeral) on 12 screens in light and dark at 390x844, seeded with journal entries, a photo, a week of finished steps, Today and Waiting. It measures touch targets, text sizes, contrast against the real (blended) background, accessible names, sideways scroll, and sideways scroll and clipping at double text size. Then a look at every screenshot against the checklist.

## Findings and fixes

| # | Finding | Fix |
|---|---|---|
| 1 | On/Off rows (Show it on every page, Learning, Hints, Also as a reminder, Low-day check-in) read as text: "On" with nothing that says it can be pressed | iOS switches: `role="switch"`, `aria-checked`, a 51x31 track in the button colour when on; the word stays for screen readers. No animation under Reduce Motion |
| 2 | Talk: Clear threw the conversation away with no way back | The 6-second Undo bar, as for Done and Remove ("Conversation cleared") |
| 3 | Talk: the small photo sat 14px lower than Clear (an older rule placed it for the head before it became sticky) | Level with Clear |
| 4 | What the board learned: no space between "Nothing kept yet" and the next label | 16px above a label that follows a card |

## Checked and passing

- Contrast: no text under 4.5:1 (3:1 for large) on any of the 12 screens, light or dark, including the reply cards, the grey details, the count badges and the week card.
- Text: nothing under 11px; at double text size no screen scrolls sideways and nothing is clipped (the only "clipped" items are the screen-reader-only spans, on purpose).
- Labels: no control without an accessible name.
- Targets: every control is 44px or more. Two flags were not real: the field labels on Planner and Learned (each belongs to a 44px field), and the 28px done rings on Now, which already have a 46px invisible touch area.
- Where you are: every sub-page has the chevron Back with the page name; Talk keeps its head on top while it scrolls.
- Undo and confirmation: removing a journal entry, the photo and what the board learned all ask first and are marked red.

## Noted, left as the owner chose

- The brand row (mark, OwnYourDay, Powered by OwnYourSystem) is on every page, by the owner's request. It costs about 60px at the top of each sub-page above Back and the title. If space becomes tight, the sub-pages could show a smaller one.
- Dark mode uses a black ground with #1C1C1E cards (the iOS grouped style), owner's "plain greys". The skill prefers a dark grey ground; depth stays visible because every card is lifted. Revisit only if the owner wants it softer.

## Still owed (needs a person)

- The VoiceOver walk-through, now including the switches and the reply cards.
- The iPhone status bar with `default` style, and reminders on an installed iPhone app.

## Tests

`tests/hig2.mjs`, 6 checks: the switches (role, state, track colour, size, the word for screen readers, toggling), rows that open pages keep their chevron, Clear and Undo, the photo level with Clear and not covering it, the label spacing, no page errors.
