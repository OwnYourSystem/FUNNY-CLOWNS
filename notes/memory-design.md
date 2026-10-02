# Memory: what the board learns, and the rules it follows

Written 2026-10-02. Code: the `mem*` functions in `delivery-board.html`.
Tests: `tests/memory.mjs`.

## What it looks for (once a day, one question at a time)

| Finding | Needs | What a yes changes | What Remove does |
|---|---|---|---|
| Finishing hours | 8 or more finished items in 30 days, one part of the day holding 55% or more, and it differs from your "sharpest" | your sharpest time | puts the old one back |
| A normal day's size | 7 or more active days in 4 weeks, and the median differs from the current normal day | the number a normal day holds (and a good day becomes that plus 2) | puts the old number back |
| A lighter weekday | 4 or more of that weekday and 10 other days in 8 weeks, a 90% range for the difference that excludes zero, p below 0.10, and at most 60% of your other days | that weekday starts as a low day | stops it |
| A skip reason that repeats | 8 or more skips in 30 days, one reason at 50% or more | nothing: it suggests an experiment from the library | n/a |

The weekday test is the same permutation test and bootstrap range the
experiments use. A finding is never applied until you say yes, and "Not now"
silences that question for 30 days.

## What it keeps

- A note is one short sentence, 140 characters at most, 20 at most.
- What you type yourself is kept until you remove it.
- What the board learned, or the tutor suggested and you kept, lapses after 60
  days unless the pattern shows up again (the daily check refreshes a kept
  finding that is still true). Lapsing puts any setting back.
- Never anything about moods, health or personal details: the board and the
  tutor are refused those. You can type anything you like about your own work.
- Learning can be switched off. Erase everything removes every note and puts
  every learned setting back.

## Who sees it

- The notes live in the board's own state: on this device, and in your account
  if you sign in (the same document the rest of the board syncs).
- The tutor reads kept notes when you chat with it: in the artifact through
  Claude's own runtime, and through the hosted tutor if that is ever switched on.
  Proposals that are waiting for your answer are not shown to it.
- The tutor can only propose. A proposal is shown to you and is kept only on
  your Keep.

## What this does not do

It learns nothing from what you write in chat except what the tutor proposes and
you keep. It does not learn across people. It does not tune any model: the
learned values only change this board's own settings and the text the tutor is
shown.
