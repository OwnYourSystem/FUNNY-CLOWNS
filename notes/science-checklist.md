# Checklist: the useful points of both reports, for the board as it is today

Written 2026-10-04. Sources: `science-individual-recovery.md` (report 1) and
`science-time-management.md` (report 2, complete since the Doc was fixed on
2026-10-04 14:00 UTC). Numbers in brackets (#4, #13, #24 and so on) point to the rows
of `science-source-map.md`. Updated the same day to cover the full report 2.

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
- [x] **Hard steps at your sharp time.** The "sharpest" setting (morning, afternoon,
  evening) and the memory finding about your hours. Report 2 (chronobiology).
  Evidence: **B/C** (#21: people do differ in when they are sharp; the "300%" figure
  was not found). The board uses the idea for one person's own pattern only.
- [x] **A could-do list.** The Backlog ("Something for a free hour") holds what is not
  today's job, with no pressure to do it. Report 2 (#25). Evidence: **D**.
- [x] **Plans sized from your own days, not from hope.** Dose sizing reads your last
  planned days. Report 2 (planning fallacy, #24: the bias is well documented, the
  "25% to 50%" and "+50%" are not). Evidence: **B** for the bias, **D** for our fix.
- [x] **Your own numbers decide, not a rule of thumb.** Experiments compare your
  days before and after and say "not enough" when that is true. Report 2 (measure
  what works). Evidence: **D**.

## B. Worth adding (nothing here is built)

- [x] **Stop notifying after the day ends.** *Built 2026-10-04 (`25f1f99`).* The reminders do not read "your day
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
- [ ] **A weekly plan prompt, with a short weekly look back.** Goals for the week, the
  steps, the obstacles and what to do if they happen; then, at the week's end, what
  moved and what to drop. Report 2 (#13, #31: the "30 minute weekly session" is
  advice, not a result). Evidence: **B** (fewer unfinished tasks and less rumination
  in a field experiment; effect sizes not seen). Medium. A Monday hint that opens the
  Planner, and the 14-day view as the look back.
- [x] **"When X, I will do this step."** *Built 2026-10-04 (`9845a8b`), as a plain feature.* An optional line on a today pick: when or
  where the person will do it (an implementation intention). Report 2 (#26). Evidence:
  **A/B** (a meta-analysis of 94 tests, mean d = 0.65, as the search reported it; not
  read). The best-supported idea in report 2. Small. Offered as an experiment, with
  no number quoted. A reminder at that time would stay off by default.
- [x] **Estimate against actual, in the person's own numbers.** *Built 2026-10-04 (`9845a8b`); the owner said yes.*
  The board has no time estimates today. If it gets an optional "about how long",
  it could say "your steps usually take about 1.6 times your guess", from the
  person's own days, never from "+50%". Report 2 (#24). Evidence: **B** for the bias;
  the buffer numbers are **C**. Large, and it adds a time field to a board that is
  built around one next action. Probably not worth it unless you want it.
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
- [ ] Do not quote "40% better completion with visual timelines", "300% more
  productivity", "80% better plan adherence", "25% to 50% underestimate" or "add 50%"
  (#20, #21, #31, #24: none found).
- [ ] Pomodoro, time blocking, Kanban, GTD, RPM and "eat the frog" are methods people
  use, not results. Only the Pomodoro review (student RCTs, about 20% less fatigue,
  #23) had numbers, and they came from a model's summary. Out of scope: a timer.
- [ ] Do not ask about, infer or plan around the menstrual cycle (#22). Sensitive, and
  the named paper was not found.
- [ ] "Dopamine rewards the habit" and "the prefrontal cortex allocates resources" are
  mechanism claims stated as fact (#27, #14). Do not repeat them.
- [ ] Meetings, delegation, decluttering and team-level findings (#28, #32) are not for
  a personal board.
- [ ] The strongest source in report 2 is the Aeon meta-analysis (#19), and it shows an
  association with well-being, not that planning causes it. The report's conclusion
  ("unequivocal", "empirical consensus") says more.

## D. Decided (2026-10-04, the owner's answers)

1. **After-hours guard: yes, now.** Built (commit `25f1f99` on `app`): the brief, the
   hint and the afternoon check stay quiet from "your day ends at" until 04:00. Test:
   `tests/reminders.mjs`.
2. **"When X, I will do this step": built** as an optional "When?" button on the
   "Do this now" card. The person types a moment they will notice; the board shows it
   beside the step, does not remind, and drops it when the step is done or after 14
   days. It is a plain feature, not an experiment: the experiment engine only runs
   library entries, and a library entry needs a paper that has been checked. The event
   log notes that one was set, never the words. No study is cited anywhere in the UI.
3. **Time estimates: built** as an optional "How long?" button. A guess is kept per
   step. When a step with a guess is finished, the board asks once, quietly, how long it
   took. From 5 such pairs it says how the person's guesses compare with what happened
   ("about 1.5 times your guess, so a guess of 25 minutes has meant about 40"), in their
   own numbers only. Never "+50%". Skip is always there.
4. **Paper check order: agreed** (Aeon 2021, Gollwitzer and Sheeran 2006, Uhlig 2023,
   the 2025 planning review, the micro-breaks diary study). Still blocked from here:
   the abstracts have to be pasted or opened together.
5. **Gemini reference list: received as a screenshot.** The "Sources used in the
   report" panel lists exactly the same 10 sources as the works-cited list in the Doc
   (Align blog, Marquette nursing paper, CAES field report, UPenn page, "Journal
   Development Manecos", "Everyday planning", Plantae, the 2025 Frontiers review, the
   Aeon meta-analysis, the Uhlig field experiment). So Gemini had no other source for
   the 43%, 50%, 40%, 300% and 80% figures: they most likely come from the Align blog,
   which nobody has read yet. Gemini's "Thoughts" panel says it searched for
   "sociological and academic databases", and the first source it opened was the Align
   blog.
6. **Wording: "no evidence claimed"** until a paper is checked.

## E. What is left (updated 2026-10-04, after the dialog work)

**From section B, not built (6):** a "close the day" step; an optional morning capture; a
weekly plan prompt with a look back; a "too much on the plate" signal; a break
suggestion between steps; a weekly 1 to 5 "how in control did you feel" tap.

**From the earlier product plan (`values-vs-board.md`):**
- [ ] **A minimum-day strip (V3):** three anchors that count even when nothing else moves.
- [ ] **Weekly measures (V8):** energy, mood, anxiety, functioning, meaningful action.
  Sensitive: it must be the person's own optional tap, never inferred, and never passed to
  the tutor or the memory, which refuse mood and health text.
- [x] **Confirmation on the tutor's remove and clear tools.** *Built 2026-10-04.* The
  tutor stages the request and the chat shows two buttons; only the person pressing
  the first one does it. Typed commands run at once, spoken ones are staged.
- [ ] **Dialogs not yet done:** the interview does not open by itself on first run
  (deliberate); the "No" rows (hints, memory findings, distress reply, tutor chat, the
  barrier question) stay as cards.

**Parked decisions, not started:**
- [ ] A hosted or tuned model for the tutor: an API key and an evaluation set first.
- [ ] Check the papers (Aeon 2021, Gollwitzer and Sheeran 2006, Uhlig 2023, the 2025
  planning review): the abstracts have to be pasted in, since scholarly sites are blocked here.
- [ ] Background push (needs a push server and a key per device).
- [ ] Reliability, security, data governance and AI compliance.
