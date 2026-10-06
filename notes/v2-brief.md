# Version 2 brief

Written 2026-10-06. Task F1 of `v2-plan.md`. It replaces nothing in the live app. The version being tested (`app` branch, `14877b7`) stays frozen.

## 1. Purpose and summit

The board stops being a planner and becomes a tool for steadiness and growth in an unpredictable life.

> **When life does not go to plan, people still know their next step and every day still counts; over months, they grow in what matters to them without losing their rest, health or people.**

How it is checked, on the device and with consent:
1. How often people come back and act after a low day or a sudden change.
2. Days that count, through the day's size or the minimum day. No streak that resets.
3. The weekly check-in trend (energy, calm, getting through the day) beside output, and balance across life areas once they exist.

The engine is the asset: it judges how big the day is, what to do now, and why. People pay for the judgment and direction. Everything else is secondary.

## 2. Principles (every feature must pass all six)

1. One decision on screen. The reason is one tap away.
2. Attentive: it remembers, notices, follows up once.
3. Caring: kind, never scolds, shrinks when life is hard.
4. Honest: no claimed feelings, no pretending to be human, no guilt to keep you. Care and attention, not love or intimacy.
5. You decide: accept or change in one tap.
6. Knows its limits: heavy events get care and a pointer to people, not a plan.

Tools go into a hidden box. The reasoning never does.

## 3. The product in two parts

| | Web application | Phone application |
|---|---|---|
| Job | Plan and look back | Companion for the day |
| Contains | Board, Today and Waiting, planner, week and reports, life areas, settings, tutor panel | Now (one decision), Talk, Week, You. Quick capture. At most 4 tabs |
| Shared | One engine, one set of data, one visual language, the same words | |

The phone is designed from scratch. It is not a squeezed web page.

## 4. Decisions on the ideas raised

| Idea | Decision | Notes |
|---|---|---|
| Calendar integration | **Yes, read-only, Google first** | Needs a server holding sign-in tokens and Google app verification. Ends "local first" for signed-in users. |
| Email integration | **Parked** | Most sensitive data there is. Small benefit. Revisit later. |
| Local news | **Off by default** | Works against calm. Not a feature of v2. |
| Background growth measuring | **Yes: weekly, computed on the device** | Output beside check-in beside balance. "Not enough data" stated. A bad week never lowers a score. No passive tracking. |
| One action at the centre | **Yes** | The first requirement of the phone design. |
| Push cue after closing another app | **Not possible** | Web cannot see other apps. Cues that work: after a calendar event, a time you pick, your own "When" note. Cap stays at 2 a day. |
| Unlock features by finishing tasks | **Rejected** | Punishes low days. |
| Leaderboards | **Rejected** | Comparison works against balance. Needs a social layer and shared data. |
| Zero-setup first use | **Yes** | Under 3 seconds to the first action, as a tested requirement. |
| Pre-filled tasks from patterns | **Later, as suggestions to accept** | Never inserted. Part of the AI work. |
| Micro-celebration and progress ring | **Yes** | iPhone vibration needs a native shell. |
| Streak chain with "never miss twice" | **Reshaped** | "Days that count": 5 of the last 7, a minimum day counts. No reset to zero. |
| Publish with frequent updates | **Yes** | After the release basics. Play Store deferred by the owner. |
| New phone design | **Yes** | Fix sync first. Native shell only after weeks of use. |

Marked "proposed" until the owner confirms: email parked, news off by default, no leaderboards, no unlocks.

## 5. Technical direction

- **Shared engine, two screen shells.** Day size, picks, reasons, statistics and the 43 tools move out of the single file. The shells are thin.
- **Item-by-item sync** with a rule for edits made on both devices. Today the last device to save wins.
- **Versioned stored data** with safe migrations. Every update must read last month's data.
- **Calendar, read-only,** behind a server that holds tokens. The server holds only what it needs.
- **AI tutor behind a swappable server boundary.** First model: Claude Haiku 4.5. Tuning is decided later, once there is a test set and consented examples. English only at launch.
- **Weekly report computed on the device.**
- **Undo, delete my data, monitoring, release basics** (versions, "what changed", feature switches).
- **Native shell for the phone is a later decision,** after 3 to 4 weeks of use of the new design.

## 6. The AI tutor: scope for v2

- It listens to an informal day and changes the plan with the board's own tools.
- Anything that deletes waits for the person's button press. Anything big is proposed first.
- Unusual events (illness, grief, job loss, crisis) get care, a day shrunk to almost nothing, and a pointer to people or services. It does not coach through them.
- It never claims feelings or pretends to be human, and it says it is AI.
- Memory is visible and erasable.
- The test set of about 50 conversations is weighted toward unusual events. No model change ships unless it passes.

## 7. Constraints

- **Compliance is required.** EU data law applies, and mood and energy data may count as health data. Privacy policy, terms and imprint are drafted by us and reviewed by a legal professional before publishing.
- **No medical claims.** The board is not a medical or mental-health tool. The fixed reply for distress stays.
- **No outcome claims without evidence.** "No evidence claimed" stays as a rule. Practitioner opinion is labelled as such.
- **Privacy:** weekly check-ins stay on the device and are never read by the tutor. Reports are made on the device.
- **Only agreed features are built.** Dialogs open only on the person's own action. Notifications: at most 2 a day, never after the day end.
- **Play Store listing is deferred** by the owner.

## 8. Phases

0 Decide and test. 1 Foundation (engine, data, sync, undo, delete, monitoring). 2 Simplify and the new phone. 3 Calendar. 4 The tutor. 5 Growth and balance. 6 Publish. Details, sizes and dependencies are in `v2-plan.md`.

## 9. Risks the owner should know about

- **v2 is a rebuild of the base,** not a polish. The foundation work is the largest block.
- **Calendar and later AI make this a server product.** More responsibility for data, support and uptime.
- **The empty top-right of the position map is an opening or a sign of low demand.** Only real users can say. A small tester group before heavy investment.
- **A tutor on a bad day is the highest-risk feature.** It gets the most testing and the least freedom.
- **One developer.** Sizes in the plan are rough.

## 10. Working method and an open point on tooling

- The `app` branch is frozen until the owner finishes testing the current version.
- Notes go to the dashboard branch. Each task gets its requirements written before its code, as with push.
- **Coding with the TypeSafe skill** (to save tokens): suited to small judgment steps such as routing a sentence to a tool or classifying an event. It is not needed for the rest. **Open point:** it relies on a different AI vendor than the one chosen for the tutor. Before using it, decide what data would reach that vendor, whether it can be covered by the data-processing record, and whether the extra provider is worth the extra legal surface. Until then it stays unused.

## 11. To confirm

1. The "proposed" rows in section 4: email parked, news off by default, no leaderboards, no unlocks.
2. That v2 starts from the foundation (F2), not from the screens.
3. Whether the TypeSafe skill may be used, once its data question is answered.
