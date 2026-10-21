# Screen-reader test on real phones

Written 2026-10-21 for the gap "a real-device screen-reader test". The automated part is done:
`tests/a11y.mjs` checks every page against WCAG 2.2 A and AA with axe-core (47 checks, 0 failures),
and reads the accessibility tree for the energy sheet, Your week and the photo. What no automated
test can do is listen. This script is for a person with a real phone.

## What you need

- An iPhone with VoiceOver: Settings > Accessibility > VoiceOver. Test in Safari, then from the
  home-screen icon.
- An Android phone with TalkBack: Settings > Accessibility > TalkBack. Test in Chrome.
- The preview link, a fresh browser profile (or a private window), about 45 minutes per phone.
- Best: a tester who uses a screen reader every day. Second best: you, with the screen curtain on
  (VoiceOver: triple-tap with 3 fingers), so you cannot look.

## How to record

For each task write: Pass / Problem, what was said, and where you got stuck. A problem is anything
that is not said, said twice, said in the wrong order, said with a meaningless name ("button"), or
that cannot be reached by swiping.

## Tasks

| # | Task | What should be heard |
|---|---|---|
| 1 | Open the app for the first time | "One step. In the right order.", heading. "Step 1 of 2", image. "Start", button |
| 2 | Add the first goal by voice: double-tap Speak, say a goal | The Speak button says it is pressed; the words land in the box; nothing is saved before Show me today |
| 3 | On Now, find the energy button and set Low | "Energy: Good, not set today. Change", button. A dialog "How is your energy?" with 4 choices and Keep it |
| 4 | Hear the step without reading: double-tap the speaker on Do this now | "Read this card aloud", button. The phone's voice reads the label, the step and the reason. Double-tap again stops it ("Stop reading") |
| 5 | Start the step, then mark it Done | Done is reachable; Undo is announced and reachable for 6 seconds |
| 6 | Set energy to Very low | "Nothing is needed now", heading, the message, then each easy thing as a checkbox |
| 7 | Tick one easy thing | "checked" is announced; "That counts as a day." follows |
| 8 | Your week | 7 day buttons, each "Thursday 15 October, 2 steps"; the week is said once, not twice |
| 9 | Talk: ask "what is left today", then use the speaker on the answer | The answer is reached by swiping; its speaker reads it without list dashes |
| 10 | You: switch Read answers aloud on, ask again | "Read answers aloud, switch, off" then "on". The new answer is read once; the screen reader and the voice do not talk over each other badly |
| 11 | A goal: move a step Earlier and Later | The buttons are named; the new position is announced or easy to find; no drag is needed |
| 12 | Back from a goal page | "Back" or the page name; focus lands somewhere sensible |
| 13 | Turn the phone's text size to the largest | Nothing is cut off; nothing scrolls sideways |
| 14 | A "Something I noticed" card (seed it, or wait for one) | The note, its numbers, Keep it and Not now |

## Known points to listen for

- Read aloud and VoiceOver can speak at the same time. With VoiceOver on, the speaker button is
  still useful for long answers, but "Read answers aloud" may be too much. Note what the tester prefers.
- The clock on Now shows seconds. It is not a live region, so it should only be read when focused.

## After the test

Put the results in a table like the one above with Pass / Problem and send it back. Each problem
becomes a fix and, where possible, an automated check in `tests/a11y.mjs`.
