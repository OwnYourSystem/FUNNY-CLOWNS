# Evidence candidates: not in the app, not verified

Written 2026-10-02. Nothing here may be used by the tutor. The app's library
(`EVIDENCE` in `delivery-board.html`) holds only entries that can be checked:
practitioner quotes found word for word in the two saved notes. A paper goes in
only after a person has checked it, as described at the end of this file.

## What I could not do, and why

I could not open a single scholarly source from the session that built this.
Crossref, PubMed, Semantic Scholar and the White Rose repository all came back
`EGRESS_BLOCKED` from the network proxy. Web search works, but it returns a
summary written by a model, not the paper. So every citation below is from my
memory, and any detail in it (authors, pages, DOI, a number) may be wrong.
Treat each line as a thing to look up, not a fact.

The one exception is partial: a web search for Harkin 2016 returned a summary
that agreed with what I remembered (138 experiments, 19,951 participants,
d+ = 0.40 on goal attainment, larger when progress was recorded or made public).
That is a secondary summary, so it still counts as unchecked.

## Candidates

| # | Citation (from memory) | What it could back on the board | Claim to check |
|---|---|---|---|
| 1 | Harkin, Webb, Chang, et al. (2016). Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence. *Psychological Bulletin*, 142(2), 198-229. DOI 10.1037/bul0000025 | The event log, progress bars, "log what you did" | Monitoring progress improves goal attainment, more when it is recorded or shared |
| 2 | Gollwitzer & Sheeran (2006). Implementation intentions and goal achievement: a meta-analysis of effects and processes. *Advances in Experimental Social Psychology*, 38, 69-119. DOI 10.1016/S0065-2601(06)38002-1 | Planning when and where a step happens (the plan dock, "where") | If-then plans raise the chance a goal is achieved |
| 3 | Lally, van Jaarsveld, Potts & Wardle (2010). How are habits formed: modelling habit formation in the real world. *European Journal of Social Psychology*, 40(6), 998-1009. DOI 10.1002/ejsp.674 | Repeating subtasks, streaks, "a miss is not a reset" | Time to automaticity varies widely; one missed day did not change the course |
| 4 | Buehler, Griffin & Ross (1994). Exploring the planning fallacy. *Journal of Personality and Social Psychology*, 67(3), 366-381. DOI 10.1037/0022-3514.67.3.366 | A smaller dose, plan size caps | People underestimate how long their own tasks take |
| 5 | Breines & Chen (2012). Self-compassion increases self-improvement motivation. *Personality and Social Psychology Bulletin*, 38(9), 1133-1143. DOI 10.1177/0146167212445599 | "A miss is data, not a verdict" | Self-compassion after a failure raises motivation to improve |
| 6 | Masicampo & Baumeister (2011). Consider it done! Plan making can eliminate the cognitive effects of unfulfilled goals. *Journal of Personality and Social Psychology*, 101(4), 667-683. DOI 10.1037/a0024192 | The backlog, parking a goal with a plan | Making a specific plan reduces the mental pull of an unfinished goal |
| 7 | Locke & Latham (2002). Building a practically useful theory of goal setting and task motivation: a 35-year odyssey. *American Psychologist*, 57(9), 705-717. DOI 10.1037/0003-066X.57.9.705 | Specific subtasks and deadlines | Specific, challenging goals beat "do your best" |

## How to promote a candidate to `checked`

1. Get the abstract from the publisher or a repository, and confirm authors,
   year, journal, volume, pages and DOI against that record. Send it to me as a
   paste, a PDF or a link I can open, or add it yourself.
2. Copy the abstract into the entry's `abstract` field exactly.
3. Choose the one sentence in it that supports the claim and put it in `quote`.
4. Write the `claim` using only numbers that appear in the abstract.
5. Write `limits` from the paper itself: who was studied, how many, what kind of
   outcome. A result from one population is not a result for everyone.
6. Set `status` to `checked`, and fill `doi`, `checkedBy` and `checkedOn`.
7. Run `tests/evidence.mjs`. It fails if the abstract, DOI, name or date is
   missing, if the quote is not in the abstract, or if a number in the claim is
   not in the abstract.

A checked entry still says what it is: a meta-analysis, a trial, a survey. It
shows the sample and its limits next to the claim, and the tutor may cite it
only by its id.


## Added 2026-10-04: candidates from the Gemini report

Seven more studies came out of `science-source-map.md`. All are unchecked, and
the same rules apply. Full details, links and what each search said are in that
file; only the identifying records are listed here.

| # | Citation (as the search results gave it) | What it could back on the board |
|---|---|---|
| 8 | Zacher, Brailsford & Parker (2014). Micro-breaks matter: a diary study on the effects of energy management strategies on occupational well-being. *Journal of Vocational Behavior*, 85(3), 287-297 | A hint about short breaks between tasks (one workday, 124 people) |
| 9 | Sonnentag & Fritz (2015). Recovery from job stress: the stressor-detachment model as an integrative framework. *Journal of Organizational Behavior*, 36, S72-S103 | Stopping at "your day ends at" |
| 10 | "Detach to Thrive: Psychological Detachment from Work and Employee Well-Being", *Journal of Happiness Studies*, 2025 (authors to confirm), doi 10.1007/s10902-025-00883-7 | The same, from panel data; the document calls it "causal", which needs checking |
| 11 | Demerouti, Bakker, Nachreiner & Schaufeli (2001). The job demands-resources model of burnout. *Journal of Applied Psychology* | A framework for a "too much on the plate" signal |
| 12 | "Mindfulness-Based Programs in the Workplace: a Meta-Analysis of Randomized Controlled Trials", *Mindfulness*, 2020 (authors to confirm), doi 10.1007/s12671-020-01328-3 | Out of the board's scope (treatment-like) unless the owner decides otherwise |
| 13 | "The consequences of a compressed workweek: a systematic literature review", *Int Arch Occup Environ Health*, 2025 (authors to confirm), doi 10.1007/s00420-025-02153-8 | Not for the board; shows the document overstates this claim |
| 14 | Smartphone-based stress management for hospital nurses in Vietnam and Thailand: JMIR 2024;26:e50071 and J Occup Health 2025;67(1):uiaf061 (authors to confirm) | Not for the board; shows the document omits that the effects were small and secondary |
