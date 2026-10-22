# Qordel: principles that do not change without the owner

Recorded 2026-10-21, after the AI was removed by mistake on 2026-10-20 and restored. Principle 6 added the same day.
Read this before removing or simplifying anything.

1. **The AI is the personal tutor, the coordinator and the personal planner.** It is one
   point of the whole system. It talks with the person (Talk), changes the board for them,
   suggests an order for a goal's steps, and remembers what they keep about how they work.
2. **The AI learns from the person's behaviour, to give customized recommendations.** From
   the beginning of the project. The board finds patterns in what the person finishes and
   skips, asks once whether to keep what it noticed, and the tutor uses what was kept and the
   history tools to fit every suggestion to this person.
3. **The person decides.** Nothing learned is kept, and no setting changes, without their yes.
   Learning can be switched off. Notes can be read and removed in Talk.
4. **The 5 rules choose the next step** (owner, 2026-10-20). Learning and the AI shape the
   suggestions around them; they do not replace them.
5. **Sequence, not deadlines.** Steps go in their order; a goal has one optional delivery day.
6. **Qordel evolves in small steps after it goes live, and is updated often. This is by design**
   (owner, 2026-10-21). Launch is a start, not an end. What this asks of every change:
   - Small releases, each one working on its own. Ship a step, learn from it, then the next.
   - A person's board survives every update: old saved data must load in the new version
     (migrate it, never drop it), and every change keeps the backup format readable.
   - Updates arrive without effort: the page comes from the network first, so a new version
     shows on the next open. No "please update" screens.
   - No surprise for the person: a change to how the next step is chosen, or to what is
     learned or sent, is said plainly in the app before or when it happens. Never a
     change that adds pressure.
   - Every release keeps the full test suite green and has a rollback named in
     notes/deploying.md.

Working rule for whoever builds: never remove an AI feature, or any part of the learning,
as part of a wider change. Name it to the owner and ask first.
