# 201 Goal contexts: the model, migration and rule 5

Status: agreed
Owner's yes: 2026-10-25 (scheduling fork decided: contexts are labels, rule 5 stays binary)

## Summit word it serves
Yours. A person shapes the board to their own life, not to our two boxes.
Work, Life, Personal, Study, or whatever else they name.

## Requirement
Replace the fixed two-item work/not-work list with a user-editable list of
contexts held in the board state, each context carrying one bit: work-hours or
outside-hours. A goal points at a context by id. The hour rule (rule 5,
`feasible`) does not change in behaviour: it reads the chosen context's work
bit. Seed the list with the current two (Work, Not work) and migrate every
existing goal with no loss.

## Limits (non-functional)
- Privacy: context names stay in the board state on the device. They ride
  inside the board JSON that an account already syncs (same as goal names and
  tags today). Nothing new leaves the device.
- Offline: no change. All local.
- Interruptions: none.
- Accessibility: engine has no UI; the data must let board and phone render the
  list at the largest text and in both themes (their cards).
- AI: a model sees nothing new. The context is never added to the order or tutor
  payload (today they send only goal name and step names).

## Files and owners
| File | Owner |
|---|---|
| source/parts/030-state.js (the list, `whereLabel`, `guessWhere`) | engine |
| source/parts/040-what-the-planner-is-allowed.js (migrate in `toGoals`; replace the coerce-to-"any" at line 31) | engine |
| source/parts/060-where-you-are-right-now.js (`feasible` reads the work bit, line 52) | engine |
| source/parts/280-editing.js (goal's context set; new shared add/rename/remove/set-bit context functions) | engine |

## Order
1. engine only, first. Board, phone and assistant (cards 202, 203, 204) all
   call the new engine functions, so this must land on the `app` base before
   their worktrees are made.
2. tester (205) proves migration and feasibility parity; principles-review and
   design-review read it before merge (a core rule's data model changes).

## Acceptance (Tester writes one test per line)
- [ ] An existing board with goals set to "work" keeps them on a Work context after load; goals set to "any" land on a Not work context; no goal loses its setting
- [ ] The context list lives in state and starts with exactly two: Work (work hours) and Not work (outside hours)
- [ ] A shared engine function adds a context (name + work bit), one renames a context, one removes a context; removing a context moves its goals to a safe default and never deletes a goal
- [ ] `feasible` gives the same yes/no for Work and Not-work goals as before this change (parity against the old binary)
- [ ] A goal's context is set only through the shared function in 280-editing.js; no part writes `g.where` directly
- [ ] The built `index.html` rebuilds cleanly and the engine-purity test still passes

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No trigger fires. The context list is local board state, carried inside the
already-disclosed board JSON; no server field, no vendor, no model, no legal
text. If context ever gets sent to a model, that flips the AI trigger.)

## What the owner tries on a real device
Open an existing board; every goal still shows its old Work or Not-work setting,
and the board offers the same goals at the same hours as before.
