# 203 Goal contexts on the phone

Status: agreed
Owner's yes: 2026-10-25

## Summit word it serves
Yours, phone-first. The phone is where most people shape their board.

## Requirement
On the phone, the goal editor in the You tab and the onboarding context chooser
list the user's contexts from state instead of the fixed two, and the You tab
lets the person add, rename and remove a context and set its work-hours bit. The
phone calls the engine functions from card 201; it copies no logic.

## Limits (non-functional)
- Privacy: no change. Local board state only.
- Offline: no change.
- Interruptions: none.
- Accessibility: the chooser and the manage control keep 44px targets, work at
  the largest text, and read well in both themes.
- AI: a model sees nothing new.

## Files and owners
| File | Owner |
|---|---|
| source/parts/595-2-talk.js (the per-goal where select, line 123) | phone |
| source/parts/595-4-you.js (goal editor select + manage contexts, lines 146, 252, 262) | phone |
| source/parts/595-5-onboarding.js (the "Is it work?" step, lines 23-25, 104) | phone |

## Order
1. After card 201 is merged and on the base. phone only. May run in parallel
   with card 202 (board) and 204 (assistant); the three own different files.
2. design-review and principles-review read it before merge.

## Acceptance (Tester writes one test per line)
- [ ] The phone goal editor (You) shows every context in the user's list, with the goal's current context selected
- [ ] The You tab can add a context (name + work/outside bit), rename one, and remove one, all through the card 201 engine functions
- [ ] Onboarding's context step offers the user's contexts (the default two for a new person)
- [ ] A context added on the phone appears on the desktop board (same state list)
- [ ] The chooser and manage control keep 44px targets and read in both themes at the largest text

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No trigger fires. Phone rendering of local state only.)

## What the owner tries on a real device
On the phone, add a "Life" context in You, set a goal to it in onboarding or the
goal editor, and confirm it carries across to the desktop board.
