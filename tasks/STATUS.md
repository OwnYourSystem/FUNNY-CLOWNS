# Qordel status

Lead reads this first in every session and updates it at the end of every
wave. "Built" = tests pass. "Proven" = worked for a real person on a real
device.

Last update: 2026-10-25, wave 1 in progress (see "Wave 1 progress" below).

## Wave 1 progress (2026-10-25)
- Cards written: `tasks/101-test-baseline.md`, `102-split-phone.md`, `103-governance-legal.md`.
- 101 tester: DONE and merged (commit `9a3cb24`). Baseline on Windows: 47 suites,
  941 checks, 0 failures; `tests/BASELINE.md` added; Windows path fixes landed;
  flaw 13 confirmed (no owner goal in the seed).
- 102 phone and 103 compliance: NOT STARTED. Blocked by a worktree lock: a
  leftover node worker holds `.claude/worktrees/agent-...` so a new worktree
  cannot be made (harness mkdir is not idempotent). Owner chose: keep worktrees,
  unlock by reboot. After reboot, run `claude --agent lead` and say "continue
  wave 1"; remove `.claude/worktrees`, then launch phone, then compliance.
- Worktree-base proof: DONE. A worktree made from `app` carries only what is in
  `app` (it lacked Wave 0). So a dependency must be merged to `app` before a
  dependent writer's worktree is made, or split across two waves. Wave 1's three
  writers are independent, so no risk this wave.
- Flagged for the owner at wave close: worktrees under OneDrive are fragile
  (the folder locks after each writer). Options were offered; owner picked
  reboot-and-keep for now.


## Flaws from the 21 Oct review

| # | Flaw | State | Owner |
|---|---|---|---|
| 1 | Open AI endpoint | Built in `9e34323`. Durable limit waits for migration `20261021_ai_use.sql` | assistant |
| 2 | `boards` table not in repo | Written in `e9ff565`. Migrations not applied | platform |
| 3 | No tests on `app` | Fixed before wave 0: `tests/` is in `app` (HANDOFF.md: 45 suites, 950 checks, 0 failures on 2026-10-22). Not re-run in wave 0. Tester still makes the paths configurable | tester |
| 4 | No processing record | Open | compliance |
| 5 | Legal text | Half. AI notice in Talk is built. Privacy text and terms open | compliance, board, phone |
| 6 | Functions in the default (US) region | Open | platform |
| 7 | Speak sends audio silently | Built in `e9ff565` | phone, board |
| 8 | All CSS in `head.html` | Built in wave 0 (2026-10-22): CSS is in 8 files in `source/styles/`, `head.html` is 18 lines, the rest of the old head is `head-end.html`. `cmp` shows `index.html` byte-identical. Order of rules not changed, so desktop and phone rules still interleave by file | lead |
| 9 | Phone in one 1,308-line file | Open | phone |
| 10 | CSP allows `unsafe-inline` | Open | lead (hash in build), platform (vercel.json) |
| 11 | No CI build check | Built in wave 0 (`.github/workflows/guard.yml`: owner check, build check, tests job). Not run on GitHub yet; it runs on the first pull request | lead |
| 12 | Push CORS `*` | Built in `e9ff565`. Not deployed | platform |
| 13 | Owner's own goals in the seed | Fixed by the owner on 21 Oct. Tester confirms in wave 1 | engine |

## Waiting for the owner
- [x] GitHub default branch is `app` (checked 2026-10-22)
- [ ] Run migrations `20261021090000_record_live_schema.sql` and `20261021_ai_use.sql` (`boards_tighten_grants` was applied on 2026-10-22, per HANDOFF.md)
- [ ] Say yes or no to the owner rules added in wave 0 (they are in `.claude/owners`): part 196 to engine, 415 to platform, 594 to board; `notes/`, `HANDOFF.md`, `.vercelignore`, `.gitattributes` to lead
- [ ] Deploy the push function
- [ ] Protect `app`: pull request, owner approval, the 3 guard checks
- [ ] Decide whether to rewrite git history to remove the old seed

## Wave queue

**Wave 1** (3 writers)
- tester: `tests/` is already in `app`. Make the paths configurable (`PW_MODULE`, `CHROME_PATH`; see README.md), run the full suite on `app` (about 25 minutes; modals, inputs and floor can fail on timing, run them alone), report the baseline. Confirm flaw 13. Note: `tests/` says `/opt/node22` in places; this owner's machine is Windows.
- phone: split `595-the-phone.js` into `595-1-now.js` ... `595-5-onboarding.js`. `index.html` must stay byte-identical.
- compliance: `governance/processing-record.md`, `governance/subcontractors.md`, drafts of `legal/privacy.md` and `legal/terms.md` marked "needs lawyer review".
- lead, in the same wave: prove the worktree base (see lead.md).

**Wave 2**
- platform: EU region in `vercel.json`; record the transfer basis with compliance.
- lead + platform: CSP script hash (build prints it, platform puts it in `vercel.json`, CI checks they match).
- board and phone: draw the privacy and terms text from `legal/`.

**Wave 3**
- Full review: design-review, principles-review, security-review on the whole app, not only the changes.
- Freeze a build for the owner's week of real use.

## Worktree base check
Not done yet. Result goes here.
