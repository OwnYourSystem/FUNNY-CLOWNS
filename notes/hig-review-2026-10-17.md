# Phone app against the Apple Human Interface Guidelines, 2026-10-17

The owner's `apple-hig-design` skill was not loaded in the session, so this review uses the HIG directly. Rerun it with the skill in a new session.

Build: `app` c45bcc6. Method: a script on 15 phone screens in light and dark at 390x844 (targets, text sizes, contrast, input sizes, labels, sideways scroll), screenshots of each, plus landscape 844x390, the head tags, the manifest and the icon. Script: scratchpad `hig/audit.mjs` (ephemeral; rebuild from this note if needed).

## Must fix: breaks on an iPhone

| # | Finding | Evidence | Fix |
|---|---|---|---|
| 1 | Turning the phone sideways swaps the whole app for the desktop board | 844x390: `html.ph` off, masthead shown. The cut is `max-width: 820px` and an iPhone in landscape is 844 wide | Phone shell when `(max-width: 820px), (pointer: coarse) and (max-height: 500px)` |
| 2 | iOS zooms the page when a box under 16px gets focus | Journal textareas 12px, Talk input 14px, Add repeat select 15px, old Backlog inputs 13 and 14px | 16px minimum for every input under `html.ph` |
| 3 | Status bar unreadable in light mode from the home screen | `apple-mobile-web-app-status-bar-style: black-translucent` gives white status text; light ground is `#F6F2F7` | Use `default`, or keep a dark plum band under the status bar |
| 4 | Touch targets under 44pt | Dialog buttons 38px (Save, Not now, Keep it, Remove it), Talk chips 34px, Clear 26px, Send and Speak 38px, segmented controls 40px (Status, Priority, Active/Backlog/Archive), onboarding On/Off 40px, journal Speak 28px | `min-height: 44px` on all of these under `html.ph` |

## Should fix: consistency and access

| # | Finding | Evidence | Fix |
|---|---|---|---|
| 5 | Two visual languages | Talk and every dialog keep the moulded desktop style: shadows, mono capitals, red focus ring, red assistant icon | Flat phone tokens for `#botsheet` and `dialog.ask` under `html.ph`; red only for danger |
| 6 | No Dynamic Type; meaning set in 11px mono capitals | All sizes in px. Percent, counts, "Do this now", section labels are 11px, tracked, uppercase | Scale from `-apple-system-body`; metadata at 13px or more, sentence case |
| 7 | One contrast failure | "Do this now" `#C75A00` on white, 4.29:1 at 11px (light) | Plum, or a darker orange |
| 8 | Sheets have no grabber and no swipe down to close | All `askUser` sheets | Grabber, and drag down to dismiss |
| 9 | Journal sheet copy contradicts the screen | "use the microphone on your phone's keyboard" above two Speak buttons | Drop the sentence |
| 10 | Back is a plain text link, and a different bar on the old pages | "Back to Goals" top left, no chevron; old pages use a fixed bar | One navigation bar: chevron plus the previous title. Edge swipe back, since a home-screen app has none |
| 11 | Rows that open something look like rows that show a value | You rows, goal rows, step rows: no disclosure chevron | Chevron on rows that navigate |
| 12 | Icon and launch screen are the old black and red | `apple-touch-icon.png`, manifest `background_color` and `theme_color` `#08080A` | Plum icon; manifest colours from the phone tokens |

## Polish

13. Selected tab is a filled pill. iOS marks it with the tint colour and a filled symbol. Optional.
14. Page titles are 26px; the iOS large title is 34pt. Optional.
15. No undo after Done or an edit. The HIG prefers undo to confirmation for things that can be reversed. Remove keeps its confirmation, which is right.

## Already meets the HIG

- 4 tabs, each with icon and label (HIG: 3 to 5).
- One primary action per screen on Now.
- Onboarding is 3 screens and can be skipped.
- Light and dark, both in plum; reduced motion respected (6 rules); safe areas used (`viewport-fit=cover`, `env()`).
- Dialogs: native, focus kept inside, Escape closes, focus goes back; a destructive question starts on the safe choice, and the destructive word is red.
- No control without an accessible name on any of the 15 screens; no sideways scroll on any.
- Plain, direct writing.

## Suggested order

1 to 4 first (about half a day, mostly CSS, plus one media query). Then 5, 6, 7 and 12 together as "the phone finishes its plum". Then 8, 10 and 11 as one navigation pass. 13 to 15 when there is time.
