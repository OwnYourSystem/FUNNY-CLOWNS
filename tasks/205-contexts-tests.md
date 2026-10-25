# 205 Tests for goal contexts

Status: agreed
Owner's yes: 2026-10-25

## Summit word it serves
Built means tested. One test per agreed line across cards 201 to 204, with the
risky parts (migration, rule 5 parity) covered hard.

## Requirement
Write one test per acceptance line in cards 201, 202, 203 and 204, plus the
cross-cutting checks: an old board migrates with no loss, `feasible` keeps
parity for Work and Not-work goals, board and phone read the same context list
(no duplicated constant), a model receives no context, and the build stays
stable. Run the suite and report a baseline.

## Limits (non-functional)
- Privacy: tests read local fixtures only.
- Offline: tests run with no network except the AI evals, which stay separate.
- Interruptions: n/a.
- Accessibility: tests assert 44px targets and both themes where the cards claim them.
- AI: no model call added; the payload test asserts the context is absent.

## Files and owners
| File | Owner |
|---|---|
| tests/ (new context suite; extend engine-purity if needed) | tester |

## Order
1. Engine tests (migration, parity, shared-edit) run in Wave A, after card 201.
2. Board, phone and assistant tests run in Wave B, after cards 202, 203, 204.
3. tester signs each wave before Lead merges.

## Acceptance (Tester writes one test per line)
- [ ] Migration: a saved board with goals set to "work" and "any" maps to the Work and Not-work contexts with no goal losing its setting
- [ ] Parity: Work and Not-work goals get the same `feasible` result as before the change
- [ ] A context can be added, renamed and removed through the engine functions; removing one moves its goals to a safe default and never deletes a goal
- [ ] The desktop board and the phone render the context chooser from the same state list, with no duplicated hardcoded list
- [ ] The order payload is unchanged: no context name is sent to a model
- [ ] The built index.html rebuilds cleanly and the engine-purity test still passes

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No trigger fires. Tests only.)

## What the owner tries on a real device
Nothing new; the owner's real-device tries are listed on cards 201 to 204. This
card is the proof that those lines hold.
