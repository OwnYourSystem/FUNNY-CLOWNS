# 202 Goal contexts on the desktop board

Status: agreed
Owner's yes: 2026-10-25

## Summit word it serves
Yours. The desktop board lets a person pick and shape their own contexts.

## Requirement
On the desktop board, the goal editor's context chooser lists the user's
contexts from state instead of the fixed two, and a Manage contexts control on
the Planner page lets the person add, rename and remove a context and set each
one's work-hours bit. The board calls the engine functions from card 201; it
copies no logic.

## Limits (non-functional)
- Privacy: no change. Reads and writes the local board state only.
- Offline: no change.
- Interruptions: none.
- Accessibility: the chooser and the manage control keep 44px targets, work at
  the largest text, and read well in both themes.
- AI: a model sees nothing new.

## Files and owners
| File | Owner |
|---|---|
| source/parts/210-render.js (goal editor select, line 72) | board |
| source/parts/530-the-panel.js | board |
| source/parts/550-the-planner-page.js (manage-contexts control + the where select, lines 38, 139-141) | board |
| source/parts/560-the-interview.js (the where select, lines 25, 68, 80, 109) | board |
| source/parts/598-the-demo-board.js | board |

## Order
1. After card 201 is merged and on the base. board only.
2. design-review and principles-review read it before merge.

## Acceptance (Tester writes one test per line)
- [ ] The desktop goal editor shows every context in the user's list, with the goal's current context selected
- [ ] The Planner page has a control to add a context (name + work/outside bit), rename one, and remove one, all through the card 201 engine functions
- [ ] A context added on the desktop is available in the goal editor and also appears on the phone (same state list)
- [ ] The interview and the demo board use the user's list, not a hardcoded two
- [ ] The chooser and manage control keep 44px targets and read in both themes at the largest text

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No trigger fires. Desktop rendering of local state only.)

## What the owner tries on a real device
On the desktop board, add a "Personal" context on the Planner page, set a goal
to it, and confirm the goal still obeys the hour rule for an outside-hours
context.
