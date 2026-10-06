# Version 2 planning table: web and phone

Written 2026-10-06. A starting plan, not a commitment. Nothing here is built.

**Sizes** are rough, for one developer working with AI help: S = up to 2 days, M = 3 to 7 days, L = 1 to 3 weeks.
**Status:** Ready = can start. Needs yes = waits for your decision. Blocked = waits for another task.

## The summit (decided 2026-10-06)

> **When life does not go to plan, people still know their next step and every day still counts; over months, they grow in what matters to them without losing their rest, health or people.**

How it is checked, each with the person's consent and on the device:
1. **Next step on hard days:** how often people come back and act after a low day or a sudden change.
2. **Every day counts:** days met through the day's size or the minimum day, never a streak that resets.
3. **Growth without loss:** the weekly check-in trend (energy, calm, getting through the day) beside output, and balance across life areas once W9 exists.

Why it stands apart: conventional planners measure finished tasks and assume a predictable day. This measures whether a person stays steady and keeps growing when the day is not predictable.

**The principles every task must pass:**
1. One decision on screen. The reason is one tap away.
2. Attentive: it remembers, notices, follows up once.
3. Caring: kind, never scolds, shrinks when life is hard.
4. Honest: no claimed feelings, no pretending to be human, no guilt to keep you.
5. You decide: accept or change in one tap.
6. Knows its limits: heavy events get care and a pointer to people.

## Shared foundation (both depend on it)

| ID | Task | Why | Depends on | Size | Status |
|---|---|---|---|---|---|
| F1 | Write the v2 brief: summit sentence, principles, ideas accepted or rejected | One source of truth before building | none (all inputs decided) | S | Ready |
| F2 | Split the single file into a shared engine (day size, picks, reasons, stats, tools) and two screen shells | Two designs on one brain | F1 | L | Blocked |
| F3 | Sync item by item, with a rule for edits on both devices | Today the last device to save wins; two devices will lose edits | F2 | L | Blocked |
| F4 | Shared design tokens: colours, type, spacing, component names | Web and phone look like one product | F1 | M | Blocked |
| F5 | Versioned stored data with safe migrations | Every update must read last month's data | F2 | M | Blocked |
| F6 | Undo for any change, including the assistant's | Biggest trust gap | F2 | M | Blocked (agreed) |
| F7 | Delete my data on the server | EU right to erasure | none | S | Ready (agreed) |
| F8 | Error reporting from real devices, and monitoring of the push job | Failures are invisible today | none | S | Ready (agreed) |
| F9 | Privacy policy, terms, imprint | Required before publishing in the EU | Drafts by us, legal review by a professional | S | Ready (agreed) |
| F10 | Calendar, read-only, Google first | Judgment is wrong without it | F3; Google app verification | L | Blocked |
| F11 | AI requirements and a test set of about 50 conversations, weighted toward unusual events | Write before build | F1 | M | Blocked |
| F12 | AI tutor service: Claude Haiku 4.5 behind a swappable server, consent and "this is AI" notice | The core of v2 | F11, F7, F9 | L | Blocked |
| F13 | Long-term memory for the tutor, visible and erasable | What "attention" means technically | F12 | M | Blocked |
| F14 | Weekly report computed on the device: output, check-in, balance | Growth you can see, data stays home | F2 | M | Blocked |
| F15 | Release basics: version numbers, "what changed" note, feature switches | Frequent updates without breaking habits | F2 | M | Blocked |

## Web application: the place to plan and look back

| ID | Task | Why | Depends on | Size | Status |
|---|---|---|---|---|---|
| W1 | Hide tools behind "More": tags, archive, experiments, evidence entries, animation; news off by default | Subtract before adding | none | S | Ready |
| W2 | Front page: one decision and its reason, with Today and Waiting under it | Principle 1 | W1 | M | Ready |
| W3 | One settings page, replacing settings spread over panels | Simple | W1 | S | Ready |
| W4 | First use without the interview: defaults, questions later in context | Under 3 seconds to first action | F2 | M | Blocked |
| W5 | Week planner showing calendar events | Plan around real time | F10 | M | Blocked |
| W6 | Connect-calendar page | Access for F10 | F10 | S | Blocked |
| W7 | Weekly direction review: where you are heading, one next step | Direction, not only today | F14 | M | Blocked |
| W8 | Reports page: output beside check-in and balance | Growth shown honestly | F14 | M | Blocked |
| W9 | Life areas (work, health, people, learning, rest) and a balance view | The heart of a balance tool | F14 | L | Blocked (agreed) |
| W10 | Tutor panel for longer talks and reflection | The tutor on a big screen | F12 | M | Blocked |
| W11 | Accessibility check to WCAG AA, the web accessibility standard, and fixes | Usable by everyone, needed for publishing | W2 | M | Blocked |

## Phone app: the companion for now

| ID | Task | Why | Depends on | Size | Status |
|---|---|---|---|---|---|
| P1 | Design the phone from scratch: wireframes, at most 4 tabs (for example Now, Talk, Week, You) | Not a squeezed web page | F1, F4 | M | Blocked |
| P2 | "Now" screen: one decision, accept or change in one tap, reason one tap away | Principle 1 and 5 | P1, F2 | M | Blocked |
| P3 | Quick capture: one field, reachable from every screen | Get it out of your head in seconds | P1 | S | Blocked |
| P4 | Minimum day ticks on the Now screen | The floor is always in reach | P2 | S | Blocked |
| P5 | Talk screen: typed assistant now, AI tutor later | One place to talk | P1; F12 for the AI | M | Blocked |
| P6 | Weekly check-in and a short weekly report | Growth in your pocket | F14 | M | Blocked |
| P7 | First use in one tap, measured under 3 seconds | Make it easy | F2 | M | Blocked |
| P8 | Small celebration on done; "days that count" as "5 of the last 7", with the minimum day counting | Satisfying without streak guilt | P2 | S | Blocked |
| P9 | Prove push on a real phone | Built, not yet proven | Your test | S | Ready |
| P10 | A cue after a calendar meeting ends | Contextual cue that works | F10, P9 | M | Blocked |
| P11 | Play Store listing through a web-app wrapper | Easy to find and install | F9, P2; a Google Play developer account in your name | M | Deferred by owner (agreed, not soon) |
| P12 | Decide on a native shell for iPhone haptics, widgets and the App Store, after 3 to 4 weeks of use | Native only when the design is proven | P2 to P8 in use | S | Blocked |
| P13 | Home-screen widget: today's one thing | The strongest daily cue a phone offers | P12 = yes | L | Blocked |

## Suggested order

| Phase | Tasks | Result |
|---|---|---|
| 0 Decide | Your test of the current version, F1, the "Needs yes" items | A brief and a yes or no on each open item |
| 1 Foundation | F2, F4, F5, then F3, F6, F7, F8 | One engine, safe data, two devices in sync |
| 2 Simplify and the new phone | W1, W2, W3, W4, P1 to P4, P7, P8 | The judgment up front on both screens |
| 3 Calendar | F10, W5, W6, P10 | Advice that knows your real time |
| 4 The tutor | F11, F12, F13, P5, W10 | Judgment in your own words |
| 5 Growth | F14, P6, W7, W8, W9 | Direction and balance you can see |
| 6 Publish | F9, F15, W11, P11, then P12 and P13 | Public, updatable, findable |

W1 to W3 and P9 can start now, before the foundation, because they touch only the current version.

## Decisions (all agreed 2026-10-06)

1. The summit sentence: decided, see the top.
2. **"Care and attention"** replaces "love and intimacy". The tutor never claims feelings or pretends to be human.
3. **Yes** to undo (F6), delete my data (F7), monitoring (F8), legal pages (F9) and the Play Store listing (P11).
4. **Life areas** for W9: work, health, people, learning, rest. They can be renamed later.

Notes on two of them:
- F9: we draft the texts; a legal professional reviews them before publishing. The owner confirmed on 2026-10-06: full compliance is required.
- P11: deferred by the owner on 2026-10-06, "not that soon". When it starts, it needs a Google Play developer account in the owner's name (a one-time fee) and a store review.
