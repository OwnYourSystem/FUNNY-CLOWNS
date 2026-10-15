# Journal: the checkpoint between days

Asked by the owner on 2026-10-15, built on branch `claude/journal-checkpoint` (from `app`).

## What it does

- **Write.** Type "I would like to journal my day" to the assistant. It asks one question; the next message is saved as typed, split into what got done and what comes next. "Journal: ..." saves at once. The Journal button on Today and the Write button on the Planner open the same entry as a dialog.
- **Two kinds.** End of day (Done, Tomorrow) and start of day (Where I stand, First). The time picks one (04:00 to 12:00 is the start), and "journal my morning" or "journal my evening" picks it by word.
- **Watermark.** Each entry keeps the exact time (`at`), the board day (`d`, a day runs to 04:00) and the clock time (`tm`).
- **First thing the next day.** The first open of a day with nothing written yet shows the last note from an earlier day, once: "Where you left off", with Got it or Write today's start. It also stays at the top of Today until hidden, or until today has a start entry.
- **Any time.** "Where did I leave off?" reads the last note back in the chat. "Show my journal" opens the Journal panel on the Planner: every entry, newest first, grouped by day, each with its time.
- **Voice.** The page still has no microphone (decided earlier). On a phone, the keyboard's own microphone types into the chat or the dialog.

## Privacy

Kept on this device only, under its own key (`oys-min-deliveries-v1.journal`), the same way as the weekly check-in: not synced, not in the backup text, not in the tutor's snapshot or tools, not in memory or hints. A Reset keeps it; "Delete my journal" on its panel removes it, after asking.

## Decisions taken for the owner (can be changed)

1. **Device only.** A second device does not see the journal, and clearing the browser loses it. A download or account sync would fix that; neither is built.
2. **Reset keeps the journal.** It is the one personal record a board reset should not take.
3. **The note opens by itself once a day.** The owner asked for it to be the first thing seen. It is the second exception to "a dialog opens only from the person's own action" (the first is the phone reminder hold).
4. **Not in the push notification.** The morning notification shows on a lock screen; the note does not go there.

## Tested here

`tests/journal.mjs`, 19 checks: the split, the 04:00 day boundary, the chat flow with date and time, an answer that looks like a command ("a rough day", "remember") saved and not acted on, cancel, "Journal:", the morning kind, kept out of the board state, the first-open note once, the strip and Hide, Write today's start, "where did I leave off", "show my journal", the empty dialog check, delete, the empty state, a phone layout, no page errors.

## Not done

Search, edit or delete of one entry, export, sync, the tutor (AI) reading the journal, a reminder to write it in the evening.
