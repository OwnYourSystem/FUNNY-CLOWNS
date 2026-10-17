# Phone app against the Apple Human Interface Guidelines, 2026-10-17

First pass used the HIG directly; the owner's `apple-hig-design` skill then loaded, and its checklist is at the end.

Build: `app` c45bcc6. Method: a script on 15 phone screens in light and dark at 390x844 (targets, text sizes, contrast, input sizes, labels, sideways scroll), screenshots of each, plus landscape 844x390, the head tags, the manifest and the icon. Script: scratchpad `hig/audit.mjs` (ephemeral; rebuild from this note if needed).

## Must fix: breaks on an iPhone

**Fixed 2026-10-17 on `app`** (all four). The phone shell now also turns on for a touch screen under 500px high, so landscape keeps the app and the page. Every text box on the phone is 17px. A band the height of the status bar (`#sbar`, `env(safe-area-inset-top)`) is plum in light and the ground in dark, so the white status text always reads; it has no height in a browser tab. Dialog, Talk, segmented, Back and old-page controls are 44px or more. The phone always gets bottom sheets. 4 new checks in `phone.mjs` (39 in all); they fail on c45bcc6 and pass after. The status band was checked with a hand-set 59px inset, because Chromium has no safe-area inset: confirm on the installed app.

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

13. Selected tab is a filled pill (Material 3). iOS marks it with the tint colour and a filled symbol. Raised to a FAIL by the skill, item 15.
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

## The `apple-hig-design` checklist (section 10)

Result: 6 PASS, 9 FAIL.

| # | Check | Result | Element and fix |
|---|---|---|---|
| 1 | Tappable is obvious | FAIL | Today item names open the step but look like plain text; rows on You, Goals and the goal page open pages but have no chevron. Add a trailing chevron to every row that navigates |
| 2 | No gesture-only feature | PASS | There are no gestures; every action has a button |
| 3 | Undo, and destructive actions marked and confirmed | FAIL | Remove step and Remove goal: red and confirmed (pass). No Undo for Done, Mark it done, status, move to another goal, archive, backlog. The only undo is typing "undo done on ..." in Talk. Add a 5-second Undo strip; a done ring reopens on tap |
| 4 | Under 100 ms; progress over 1 s | FAIL | All local, instant; Talk shows "Thinking..." and Stop (pass). No pressed state on `.ph-btn`, `.ph-chip`, `.ph-rowb`, `.ph-goal`: only the classic `.btn` has `:active`. Add one pressed token |
| 5 | Hit areas 44x44 | FAIL | See Must fix 4 |
| 6 | Primary actions in the thumb zone | FAIL | Tabs and Start it: pass. Goal "Edit", "New goal" and "Sign in" sit in the top-right corner, the hardest reach. Move them to the bottom of their page |
| 7 | Adapts to tablet, landscape, split | FAIL | Landscape phone gets the desktop board (Must fix 1). iPad gets the full board, not a stretched phone (pass) |
| 8 | Semantic text styles, largest size | FAIL | All px, no Dynamic Type; 11px mono capitals carry meaning (Should fix 6) |
| 9 | Screen-reader labels | PASS | 0 unlabelled controls on 15 screens in both modes (script check; a VoiceOver walk-through is still owed) |
| 10 | Contrast in light and dark | FAIL | "Do this now" 4.29:1 in light. Dark passes |
| 11 | Reduce Motion | PASS | The phone has no motion; the sheet entry is removed under Reduce Motion |
| 12 | Colour only with meaning, never alone | FAIL | Red on the Talk icon and the Talk input focus ring is decoration; red must mean destructive. Never colour alone: pass (done rings also strike through; dots have a count) |
| 13 | Nothing removable | FAIL | Step page: the status and percent line above the bar repeat the Status control and Done slider just below. Goal page: "0% done" and "0 of N done" together. Talk: the "Assistant" header repeats the tab. Journal sheet: the keyboard-microphone sentence |
| 14 | Always know where you are and how to go back | PASS | Tab marked, page title, Back on every sub-page, id in the address so reload keeps the place. Improve: chevron, one bar style, edge swipe |
| 15 | No other platform's language | FAIL | The selected tab sits in a filled pill, which is Material 3's active indicator. iOS: tint colour plus a filled symbol |

Skill section 7: dark ground `#140A17` is a deep plum, not pure black, and panels stay visible (pass). One accent, plum (pass, apart from 12).
