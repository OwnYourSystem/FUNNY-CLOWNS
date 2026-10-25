# Qordel status

Lead reads this first in every session and updates it at the end of every
wave. "Built" = tests pass. "Proven" = worked for a real person on a real
device.

Last update: 2026-10-25, wave 1 COMPLETE (all three cards built, signed, merged).

## Wave 1 progress (2026-10-25) - COMPLETE
- Cards: `tasks/101-test-baseline.md`, `102-split-phone.md`, `103-governance-legal.md`. All done.
- 101 tester: DONE and merged (commit `9a3cb24`). Baseline on Windows: 47 suites,
  941 checks, 0 failures; `tests/BASELINE.md` added; Windows path fixes landed;
  flaw 13 confirmed (no owner goal in the seed).
- 102 phone: DONE and merged (`f22a8cf`). `595-the-phone.js` split into five tab
  files `595-1-now.js` ... `595-5-onboarding.js`. Lead rebuilt and proved
  `index.html` byte-identical with `cmp` (871069 bytes, IDENTICAL). Tester SIGNED
  (`1ece7c1`): `tests/split-phone-102.mjs`, 4/4 acceptance tests pass (joined ==
  old 595 byte-identical, rebuild == committed index.html, IIFE preserved across
  cuts, no load-time `var` moved below a reader); phone smoke 54+17 pass, 0 fail.
- 103 compliance: DONE and merged (`9a13271`). `governance/processing-record.md`,
  `governance/subcontractors.md`, `legal/privacy.md`, `legal/terms.md` (both legal
  drafts marked "needs lawyer review"). Privacy/legal trigger fired:
  security-review SIGNED after a MAJOR fix (the photo device-store was missing and
  was added, commit `d3b5464`); compliance co-signs as author. Google disclosed
  under its own heading (browser-only, server never holds the calendar, feature
  off today); server side-records (push_status/hourly/alerts, ai_use) listed
  separately as holding no personal content. Server log policy confirmed clean.
- Worktree-base proof: DONE (result below). Confirmed the fragility again this
  wave: the harness `mkdir .claude/worktrees` is NOT idempotent, and write-capable
  agents auto-create a worktree. So the dir must be ABSENT before each write-agent
  launch. Working-tree removal (`rm -rf .claude/worktrees`) succeeds; the
  `.git/worktrees/*` metadata stays permission-locked under OneDrive but is inert
  (`git worktree list` shows only main). Read-only agents (the reviewers) do not
  trip this. Procedure this wave: merge each writer's branch to `setup/agent-team`
  (surgical `git checkout <branch> -- <paths>` of only the card's files, since the
  worktrees branch off `app` and a naive 3-way merge looks alarming), then
  `rm -rf .claude/worktrees` before the next write-agent.


## Flaws from the 21 Oct review

| # | Flaw | State | Owner |
|---|---|---|---|
| 1 | Open AI endpoint | Built in `9e34323`. Durable limit waits for migration `20261021_ai_use.sql` | assistant |
| 2 | `boards` table not in repo | Written in `e9ff565`. Migrations not applied | platform |
| 3 | No tests on `app` | Fixed before wave 0: `tests/` is in `app` (HANDOFF.md: 45 suites, 950 checks, 0 failures on 2026-10-22). Not re-run in wave 0. Tester still makes the paths configurable | tester |
| 4 | No processing record | Built in wave 1 (`9a13271`): `governance/processing-record.md` + `subcontractors.md`, security-review signed | compliance |
| 5 | Legal text | Drafts built in wave 1 (`9a13271`): `legal/privacy.md` + `terms.md`, both "needs lawyer review". Board and phone draw them into the UI in wave 2 | compliance, board, phone |
| 6 | Functions in the default (US) region | Open | platform |
| 7 | Speak sends audio silently | Built in `e9ff565` | phone, board |
| 8 | All CSS in `head.html` | Built in wave 0 (2026-10-22): CSS is in 8 files in `source/styles/`, `head.html` is 18 lines, the rest of the old head is `head-end.html`. `cmp` shows `index.html` byte-identical. Order of rules not changed, so desktop and phone rules still interleave by file | lead |
| 9 | Phone in one 1,308-line file | Built in wave 1 (`f22a8cf`): split into five tab files, `index.html` byte-identical, tester signed | phone |
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

**Wave 1** (3 writers) - DONE. 101 (`9a3cb24`), 102 (`f22a8cf` + tester `1ece7c1`),
103 (`9a13271`). All signed and merged to `setup/agent-team`.

**Wave 2** (next)
- platform: EU region in `vercel.json`; record the transfer basis with compliance.
- lead + platform: CSP script hash (build prints it, platform puts it in `vercel.json`, CI checks they match).
- board and phone: draw the privacy and terms text from `legal/`.

**Wave 3**
- Full review: design-review, principles-review, security-review on the whole app, not only the changes.
- Freeze a build for the owner's week of real use.

## Worktree base check
DONE (wave 1). The harness creates a writer's worktree by branching off `app`
(= `6fce45d`, pre-Wave-0), so a fresh worktree does NOT contain Wave 0 or any
earlier wave's merges. Proof: the 103 compliance worktree branched from `6fce45d`;
`git diff HEAD <branch>` looked like it would revert all of Wave 0/1, but
`git diff <merge-base> <branch>` showed the branch's REAL delta was only its four
new files. So: (1) a dependent writer must have its dependency already on `app`
before its worktree is made, OR the waves must be ordered so dependencies land on
`app` first; (2) at merge time, never do a naive `git merge` of a worktree branch
into `setup/agent-team` - instead `git checkout <branch> -- <only the card's
paths>` and commit, which brings exactly the card's files and cannot revert other
waves. Wave 1's three writers were independent (disjoint paths), so order did not
matter this wave. NOTE for the owner: `app` is still at `6fce45d` and does not yet
have Wave 0 or Wave 1 - everything lives on `setup/agent-team`. Before Wave 2's
dependent work (board/phone draw from `legal/`), `legal/` must be on whatever base
those worktrees branch from.
