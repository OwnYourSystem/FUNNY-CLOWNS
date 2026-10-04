# Checklist: the useful points of both reports, for the board as it is today

Written 2026-10-04. Sources: `science-individual-recovery.md` (report 1) and
`science-time-management.md` (report 2, cut off partway). Numbers in brackets
(#4, #13 and so on) point to the rows of `science-source-map.md`.

## How to read it

Evidence tags. They describe the research behind the point, not the point's value.

- **A** A study I found supports it as stated.
- **B** A study I found points the same way, but the report says more than that study showed.
- **C** The claim, or its number, could not be found.
- **D** It is design reasoning, with no research behind it that I found.

None of the sources was opened (scholarly sites are blocked here), so every tag is
provisional. "Board today" was checked against the code.

Rule for the library: a point from these reports cannot become an `EVIDENCE` entry
until its paper has been checked (see `evidence-candidates.md`). Until then a
feature may exist, but the board must not say research backs it.

## A. Already in the board

- [x] **One chosen next action, not a list.** "Do this now", One Task A Day.
  Report 2 (prioritising; the "decision" idea). Evidence: **B** for prioritising
  (#12, mostly student samples); **B** for the decision-fatigue mechanism (#16,
  contested). The design stands on less friction, not on that mechanism.
- [x] **A plan at the start of the day.** Today's Plan, and the morning brief at the
  set time. Report 2. Evidence: **B**. The planning review is mostly about students
  (#12), and the field experiment tested a weekly plan (#13).
- [x] **Tasks live outside your head.** Goals, steps and the Backlog hold them, and
  "I need to ..." in the chat adds one. Report 2 (offloading). Evidence: **C** for
  its numbers (#14); the mechanism is partly supported by plan-making research
  (candidates 6 and 17, not read).
- [x] **The day has an end.** "Your day ends at": training is ruled out after it and
  the picks go quiet. Report 1 (detachment). Evidence: **A/B** (#1, #2): the
  direction is supported, "causal" is overstated.
- [x] **A low day is allowed, and is not blamed.** Dose sizing, "Rough day", a miss
  as data, the check-in after three low days. Report 1 (the warning against
  "responsibilization"). Evidence: **D**.
- [x] **The person keeps control.** Nothing the board notices is used before a yes;
  experiments are started by the person; "Not now" is always there. Report 2
  (autonomy). Evidence: not checked (#17).
- [x] **The person can see their own progress.** Done Today, "you finished something
  on N of the last 14 days", the event log. Report 2 (competence, perceived
  control). Evidence: **C** (#18 not confirmed, and correlational where found).
- [x] **Claims stay inside the evidence.** Library statuses, the reply check, these
  source maps. Both reports state things more strongly than the sources found
  (section C).
- [x] **Your own numbers decide, not a rule of thumb.** Experiments compare your
  days before and after and say "not enough" when that is true. Report 2 (measure
  what works). Evidence: **D**.

## B. Worth adding (nothing here is built)

- [ ] **Stop notifying after the day ends.** The reminders do not read "your day
  ends at": the brief can fire at 23:00 if the board is first opened late, and the
  afternoon check fires at any hour after 15:00. Report 1 (after-hours availability
  and detachment, #9). Evidence: **B**. This is a small gap in our own code (one
  guard in `checkRemind`) and it needs no evidence claim. *Suggested first.*
- [ ] **A short "close the day" step.** At the day's end: park what is unfinished and
  name tomorrow's first step. Reports 1 and 2. Evidence: **B/C** (plan-making and
  bedtime-list studies, candidates 6 and 17, not read). Medium. Best offered first
  as an experiment the person starts, not as a default.
- [ ] **An optional morning "get it all out" capture.** Ten minutes into the Backlog.
  Report 2. Evidence: **C** (the 43% figure was not found). Small to medium. An
  experiment, with no number quoted.
- [ ] **A weekly plan prompt.** Goals for the week, the steps, the obstacles and what
  to do if they happen. Report 2 (#13). Evidence: **B** (fewer unfinished tasks and
  less rumination in a field experiment; effect sizes not seen). Medium. A Monday
  hint that opens the Planner.
- [ ] **A "too much on the plate" signal.** Open and overdue goals against the day's
  dose, suggesting that something comes off, not another coping tool. Report 1
  (responsibilization, JD-R). Evidence: **B/D** (#10 is mixed). Medium. A hint kind
  that cites `E-ONE-01`.
- [ ] **A short break suggestion between steps.** Report 1 (micro-breaks, #4: one
  diary study, 124 employees, one workday). Evidence: **B**. Small. Offered as
  something to try, never as health advice, and without the breathing, muscle or
  nature claims.
- [ ] **A weekly one-tap "how in control of your time did you feel, 1 to 5".** The
  person's own measure, and a before and after outcome for experiments. Report 2
  (perceived control). Evidence: **C** (#18). Small. Optional, at most once a week.

## C. Handle with care, do not adopt

- [ ] Do not quote "up to 43% less anxiety" or "up to 50% lower cortisol" (#14, #15:
  not found; the 50% traced to a blog post).
- [ ] Do not present "decision fatigue" as an established mechanism (#16: contested).
- [ ] Do not use the reports' wording "causal", "definitively", "consensus" or
  "immediate and measurable" (#1, #10, #13: stronger than the sources found).
- [ ] Mindfulness programmes, internet CBT, box breathing and muscle relaxation are
  treatment-like. Out of the board's scope.
- [ ] Employer-level measures (compressed weeks, formal right-to-disconnect policies,
  leadership training) are not for a personal board, and the evidence is mixed (#8, #9).
- [ ] Who was studied: mostly students (#12), employees and nurses (#7). Not general
  planner users, and not people with a health problem.
- [ ] Report 2 is incomplete: the methods, procrastination and outcomes sections are
  missing from the Doc.

## D. For our talk

1. Do we add the after-hours guard now? It is small and needs no research.
2. Of the seven ideas in B, which do we want, and as plain features or as experiments?
3. Which papers do we check first? My order: Uhlig 2023 (weekly planning), the 2025
   planning review, the micro-breaks diary study, then the plan-making and
   bedtime-list studies.
4. Can you paste the rest of report 2, and the reference list from the Gemini chat?
5. Until a paper is checked, does the board keep calling these ideas "practitioner
   opinion" or "no evidence claimed"? I suggest the second.
