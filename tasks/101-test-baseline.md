# 101 Test baseline on app, paths configurable

Status: in progress
Owner's yes: not yet

## Summit word it serves
Proven. The suite is how we earn the word "built"; a green baseline on this
owner's machine is the floor every later wave stands on.

## Requirement
Make the test paths configurable so the suite runs off this owner's own
Node, Playwright and Chromium (no hard-coded `/opt/node22`), using the
`PW_MODULE` and `CHROME_PATH` route in README.md. Run the full suite against
the current build and report the baseline, PASS and FAIL per suite. Confirm
flaw 13: the owner's own goals are not in the seed.

## Limits (non-functional)
- Privacy: tests only; nothing leaves the device
- Offline: the suite runs against a local http.server
- Interruptions: none
- Accessibility: not changed (a11y suite still runs)
- AI: the tutor and order suites may call the API if keys are set; otherwise skip and say so

## Files and owners
| File | Owner |
|---|---|
| tests/* | tester |

## Order
1. tester only. No engine, board or phone change in this card.

## Acceptance (Tester writes one test per line)
- [ ] `tests/run-all.sh` runs with `PW_MODULE` and `CHROME_PATH` set, no path edit needed
- [ ] No hard-coded `/opt/node22` remains in any suite
- [ ] Baseline recorded: N suites, N checks, N failures, on 2026-10-24, this machine
- [ ] Flaw 13 confirmed: a fresh seed holds no owner goal

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No trigger fires. Tester change only.)

## What the owner tries on a real device
Nothing this card. The baseline is for the team, not the owner.
