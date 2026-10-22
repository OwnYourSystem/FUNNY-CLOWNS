# OwnYourDay against the Apple principles, 2026-10-19

Build: production 3aeac1e, plus the first-time guide on `claude/phone-onboarding-guide`.

## The kill question first: the morning-after test

If the person stops using OwnYourDay tonight, what is gone tomorrow morning?

- The one next step with its reason, sized to how the day is going. No other app on the phone does this for them.
- The morning brief, which arrives at their time.
- Their board: goals, steps, Today, Waiting, the minimum day, the history of what got done (the event log).
- The journal with "where you left off", the weekly check-ins, what the board learned.

That is real personal value: **a data moat (history, journal, learned patterns) and the start of an infrastructure moat (the morning brief runs part of the morning)**. The habit moat is weak by design: no streaks. The loop breaks at reliability (principle 6): most of that value lives only in one phone's browser storage, and the most personal parts are never backed up.

## The table

| # | Principle | Test | Where OwnYourDay stands (as built) | Verdict | Next move |
|---|---|---|---|---|---|
| 5 | Switching cost through accumulated value | If they cancel tonight, what do they lose tomorrow? | Board, event history, journal, weekly check-ins, learned patterns and reminders all build up with use. Deliberately no streaks. | **Pass, partly.** Data and infrastructure moats exist. Habit moat is thin. | Make the history visible: a month and a year view of "days that counted", so the value is felt. A kind habit signal ("12 days with a step done this month"), never a streak that resets. |
| 6 | Reliability as identity | Is the worst data loss impossible? | Board in browser storage; sync only with optional sign-in. Journal, check-ins and photo never leave the phone and are not in the backup file. iOS can clear a website's storage after weeks without use, and a cleared browser cache loses it all. | **Fail.** The worst case (a lost phone or cleared storage) loses the journal and check-ins for good. | Private, encrypted backup of the journal and check-ins (the key stays on the phone), or at least put them in the backup file. A quiet monthly "Back up now" if nothing is synced. Make losing a day of data impossible before charging money. |
| 1 | Hide complexity, show simplicity | Could a first-time user reach the core value with no instructions? | Now has one card, one action ("Start it"), a reason in plain words. The engine (day sizing, where, hours, evidence) stays hidden. 4 tabs. | **Pass.** | Keep Now at one decision. Resist adding cards to it. |
| 2 | Ready to go, instantly useful | What does a new user get in the first 60 seconds, logged out? | No account needed: pass. But the new first-time guide puts 4 setup screens (day, work, how you work, what matters) before the first goal and the first "Do this now". The defaults are good, so Next is one tap each, but it is still setup before value. | **At risk** (new today). | Value first, setup second: welcome, first goal, then straight to Now with a real next step. Show the "Set up your week" card on Now right away; it stays until done (so it is not overlooked), with Later for today. The guide is already built to run from that card. |
| 3 | Opinionated defaults instead of options | Could we decide this for the user? | Strong: one next step, Today capped at 1, 3 or 5, at most 2 reminders, every answer prefilled. But You and Planner now hold about 20 settings (hints, learning, low-day check-in, travel, sharpest, training, theme, photo switch, reminders...). | **Pass, with drift.** | Fold the switches that most people never touch (hint reminder, low-day check-in, learning) under one "Advanced" row. Show only day start and end, reminders and sign-in up front. |
| 4 | Define expectations, don't chase features | Does it exist because users need it, or because a rival has it? | The phone cut hard: 4 tabs, no Classic view. The engine behind it is big: evidence library, experiments, hints, tutor, interview, tags, backlog, archive, planner, news banner (desktop). | **Partly.** The phone reads deliberate; the codebase is feature-heavy. | Keep saying no on the phone. Before adding anything, remove one thing. Candidates: the news banner and tags. |
| 7 | Charge for the whole, not the parts | Can the pricing be explained in one sentence? | No price yet. | **Not yet testable.** | One price, one promise: "OwnYourDay plans the right next step for the day you really have, and keeps it yours." No paywalled parts; sync and backup included, since they protect the data that is the moat. |

## Verdict

The loop closes from effortless (1) to judgment (3) to personal value (5), and breaks at trust (6). The product holds data that matters, but cannot yet promise it will not lose it. Fix reliability before price. Second, keep the first minute about value: the new guide should come right after the first "Do this now", not before it.
