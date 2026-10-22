# Experiments: how a result is worked out, and what it cannot tell you

Written 2026-10-02. Code: `expStart`, `expResult`, `expTest` in `delivery-board.html`.
Tests: `tests/experiments.mjs`.

## The design

- The person starts it. The board and the tutor never do.
- One at a time, so a change can be put down to one cause.
- The outcome is fixed in the library entry (`tryit.outcome`) before it starts.
  There is exactly one, so nobody can go looking afterwards for something that
  moved. An entry with no measurable outcome is refused as an experiment.
- Window: N days from the day it starts (7, 14 or 28, from the entry), compared
  with the N days immediately before.
- Only active days count: a day with any event. A day the board was not opened is
  not a bad day. Each side needs at least 5 active days, or the answer is
  "not enough".
- If the event log (last 800 events) is full and does not reach back to the start
  of the baseline, the answer is "not enough", with that reason.

## The statistic

One number per active day (for example 1 if anything was finished that day, else
0; or the count of skips). Then:

- the difference in means (during minus before);
- a permutation test, 4,000 shuffles of the day labels, for how often a
  difference this large turns up by chance;
- a bootstrap, 4,000 resamples of each side, for a 90% range on the difference.

The verdict is "better" or "worse" only if the 90% range excludes zero and the
permutation p is below 0.10. Otherwise it is "unclear". A generator seeded from
the experiment makes the answer the same every time for the same days.

## What the tests found

- With no real change (200 simulated pairs of 10 days each) a clear call came up
  in at most 12% of runs. That is close to the 10% the rules aim for.
- With a large real change (20% against 90%, 100 runs) it was found in at least
  80% of runs.
- A small change over 7 to 14 days will usually come back "unclear". That is the
  honest answer, not a failure.

## What it cannot tell you

- It is not randomised. The two stretches are one after the other, so anything
  else that changed in your life is mixed in: work load, sleep, a holiday.
- People often start an experiment after a bad stretch. A bad stretch tends to be
  followed by a better one anyway ("regression to the mean"), so a rise can be
  partly that.
- Novelty: a new routine often works for a week for no deeper reason.
- Days are not independent (a good Monday makes a good Tuesday more likely), which
  makes the range somewhat too narrow.
- One person, one run. A result is a hint about you, now. It is not evidence for
  anyone else, and it is not a reason to change a decision about health.

Every result says the first of these in its own sentence.
