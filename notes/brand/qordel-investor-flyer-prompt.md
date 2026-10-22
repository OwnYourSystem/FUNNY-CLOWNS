# Prompt: Qordel investor flyer and pitch

Written 2026-10-21 for the live build 6f03082. Replaces `investor-flyer-prompt.md` (2026-10-18, old
name and old features). Copy everything below the line into the other AI.

---

## Your role

You are a senior pitch writer and information designer. You write for early-stage investors who read
fast, distrust hype and check claims. Make one product clear, credible and memorable on one page, then
give the founder a short spoken pitch to go with it.

## What to produce

1. **An investor flyer**: one page, A4 portrait, also readable as a phone image. Final copy for every
   block, and a layout description precise enough for a designer or an image tool to build it
   (position, size order, colours, type).
2. **A 90-second spoken pitch**: the founder's words, about 220 words, plain and calm.
3. **A 6-slide outline**: a headline and 3 short points per slide, the same facts as the flyer.
4. **A claims list**: every factual claim you used, each marked **live**, **built, not proven** or
   **planned**. Nothing goes on the flyer that is not on this list.

## Hard rules (do not break these)

1. **Use only the facts in this prompt.** Do not invent users, revenue, growth, market size, ratings,
   partners, awards or quotes. Where a pitch would normally have a number that is not given, write a
   visible placeholder in square brackets, for example `[market size: add from a checked source]`.
2. **Keep the status words exact.** "Live" means it runs at funny-clowns.vercel.app today.
   "Proven" means it worked for a real person on a real device. "Built" means the automated tests pass.
   Never write "proven" for something that is only built or live.
3. **Not a medical or mental-health product.** It is designed to stay calm on hard days and to be
   usable by people who live with stress. It does not diagnose, treat or cure anything. No health claims.
4. **The AI is real and central, and it is described honestly.** Say what it does (below). Do not
   write "AI-powered" as an empty label, and do not claim the AI decides for the person: the person
   decides, and nothing it learns is kept without their yes.
5. **No em dashes.** Use periods, commas, colons or parentheses.
6. **Words to avoid:** revolutionary, game-changer, disrupt, crush it, hustle, 10x, guaranteed, streak,
   productivity hack, deadline (except in the comparison), overdue, "studies show".
7. **Words to use where they fit:** one step, in the right order, your energy, nothing is needed now,
   delivery day, you decide, it asks first, your data stays with you, updated often.

## The voice

Plain English in the spirit of ASD-STE100: short sentences, active voice, one meaning per word, digits
for numbers. Specific beats vague. Proof beats hype. Calm beats punchy. The tone of a builder who tells
you exactly what works and what does not yet.

## The brand

- **Product:** Qordel. **Maker:** OwnYourSystem. In the app: "Powered by OwnYourSystem".
- **Tagline:** One step. In the right order.
- **Line:** A planner that adjusts to your day and shows what matters next.
- **Company idea:** OwnYourSystem builds calm products that give people judgment and direction, keep
  their data with them, and tell the truth about what they can and cannot do.
- **Wordmark:** QORDEL in capitals, Schibsted Grotesk SemiBold, letter-spacing -0.02em. Never set it
  in another font. The app icon is QORDEL in white on Moonlit Plum.
- **Colour:** Moonlit Plum `#2C1332` for buttons, the icon and one accent. Plain greys for grounds
  (`#F2F2F7` light, `#000000` dark), white cards (`#FFFFFF` light, `#1C1C1E` dark), black text. Red
  only for a warning, never for decoration.
- **Type:** Schibsted Grotesk for everything; DM Mono only for times and small numbers.
- **Look:** flat, calm, lots of space, one idea per block. No stock photos of people at laptops, no
  gradients, no confetti, no 3D.

## The product in one sentence

A daily planner that gives a person one step at a time, in the right order, sized to the energy they
have today, with a personal AI tutor that plans with them and learns how they work, and no deadlines
and no pressure.

## The problem

- Most planners ask for the same effort every day. They are built for the best day and fail on the worst.
- Deadlines and long lists make people feel behind. After a bad week they stop opening the app.
- People with stress, low energy or a disability are the first to drop out, and most planners need a
  lot of typing to set up.

## How it works (live, except where marked)

- **One step, with the reason.** Now shows one step and says in plain words why this one.
- **5 simple rules choose it:**
  1. The person sets their energy (4 levels). Not set, it stays at Good.
  2. Very low energy, the last 90 minutes of the day, or outside the day: no step at all. "Nothing is
     needed now", and the person's own easy things instead.
  3. Low energy: only their easy things, or a step they marked Easy.
  4. Good or Full: the next step, in order, of the goal with the nearest delivery day; then the goal
     that matters most; then the top of the list.
  5. Work goals only in work hours; the others only outside them.
- **Sequence, not deadlines.** Steps go in their order. A goal has one optional delivery day, shown as
  pace ("about 2 a day"), never as "overdue". A passed day is asked about once: "Nothing is lost."
- **My easy things.** The person's own list (an audiobook, a short walk). On a hard day one of them
  counts the day.
- **A personal AI tutor (Talk).** The person types or speaks in plain words; the tutor changes the
  board for them (add, move, plan today, set energy) and answers from their own numbers. Anything that
  deletes waits for a button press. It runs on Claude models from Anthropic. Status: built; plain
  commands work today without the AI; the hosted tutor is live once its key is confirmed:
  `[confirm the tutor is switched on]`.
- **AI suggests an order.** For a goal's steps, with Claude Haiku 5.5. It sends only the goal and step
  names, after the person agrees once. The person uses the order or keeps theirs, with Undo.
- **It learns from what the person does.** Once a day it may notice a pattern: when they finish
  things, how many steps a good day holds, a lighter weekday, a step they keep skipping. It shows the
  numbers and asks "Keep it" or "Not now". What they keep goes to the tutor, so its suggestions fit
  this person. Learning can be switched off.
- **For people who cannot or do not want to type:** example goals to tap, a Speak button on every box,
  and a speaker button that reads any card or answer aloud.
- **Quiet on purpose.** At most 2 reminders a day, never before the day starts or after it ends.
- **Private by default.** The board lives on the phone; sign-in is optional. The journal, the weekly
  check-in and the photo never leave the phone and are never shown to the AI.
- **Phone and desktop**, the same rules, two interfaces. It installs from the browser to the home screen.
- **Updated often, by design.** Small releases. A person's board survives every update, and a
  change is said plainly in the app ("What changed in Qordel").

## Why it is different

1. **It shrinks; it does not scold.** On a very low day it asks for nothing. No streaks, no guilt.
2. **It shows its reasoning.** Every step says why.
3. **The person decides.** The AI suggests and learns; nothing is kept or changed without a yes.
4. **Built for the people other planners lose:** low energy, stress, no typing, screen readers.
5. **Data stays with the person.**

## The market gap (from a comparison made on 5 October 2026, vendor sites and reviews)

| | Qordel | Motion | Sunsama |
|---|---|---|---|
| A low-energy day built in | Yes: very low energy asks for nothing; one easy thing counts the day | None found | None found |
| Says why for each suggestion | Yes | Reviews call it a black box | Partly: no per-task reasons found |
| Protects against over-commitment | Yes: a good day holds the number of steps the person chooses | Partly: fits tasks into free time, needs good estimates | Yes: a daily hour limit |
| Plan by talking in plain words | Yes: typed or spoken words change the board | Partly: AI chat, re-planning from chat not verified | Partly: a guided flow |
| Data stays on the device | Yes, sign-in optional | Not verified | Strong policy, SOC 2 audited |
| Price for one person | Not priced yet | $19 a month ($12.73 yearly) | About $20 to $25 a month |

**The open position:** the sources suggest neither rival has a low-energy mode. "One step, in the right
order, on the day you actually have" is a position no one else holds.

**Where Qordel is behind, said openly:** not in an app store, no calendar links yet, English only, no
independent security audit, no track record, no user research yet.

## Proof and status (keep these exact)

- **Live:** the product above, at funny-clowns.vercel.app, since 21 October 2026. The AI order
  suggestion is switched on (Claude Haiku 5.5). The hosted AI tutor: `[confirm before using the word live]`.
- **Proven:** the board works on the founder's own Android phone; the morning push reminder arrived on
  it through the full path on 6 October 2026.
- **Quality (built, automated):** 836 automated behaviour checks and 239 code-structure checks pass on
  the live build. Every page passes an automated WCAG 2.2 AA accessibility audit in light and dark
  (47 checks).
- **Not proven yet:** iPhone reminders, a screen-reader walk-through on real phones, reliability over
  weeks, and sessions with people who live with stress. The test scripts for the last two are written.
- **Planned, not built:** app-store listing, calendar links, a second language, payments, a security audit.
- **Stage:** pre-revenue. One founder-developer. Users: `[add a number only when true]`.

## Who it is for

People whose days do not go to plan: managers, parents, people in care roles, people coming back after
illness or burnout, people who live with stress or a disability, and anyone who started a planner and
dropped it.

## How it will make money (frame as intent, not as fact)

People pay for judgment and direction, not for a number of tools: a personal subscription priced on the
decision it saves each day. Price: `[to be set]`. Do not invent tiers or prices.

## The founder

`[founder name]`, OwnYourSystem. A systems generalist: data engineering, system design, platform
management and business intelligence. Writes the principles, privacy and reliability rules before the
code, and does not call anything proven until it works on a real device. Use this as one short line.

## The ask

`[amount]` for `[use of funds, for example: user research, app-store launch, a security audit, a
second language, first 1,000 users]`. Contact: `[email]`, `[link]`. Leave these as placeholders.

## Flyer structure (top to bottom)

1. **Wordmark** QORDEL with "by OwnYourSystem", top left. **Headline:** "One step. In the right order."
   **Subhead:** one sentence on the problem.
2. **The problem:** 3 short lines.
3. **How it works:** 4 points with small line icons: one step and why; sized to your energy (nothing
   is needed on a very low day); no deadlines, steps in order; a personal AI tutor that learns and asks first.
4. **Why it is different:** 3 points: shrinks not scolds; you decide; built for the people other planners lose.
5. **The gap:** the comparison table, 3 rows at most, and the open-position line.
6. **Where it stands:** live, proven, next, in 3 plain lines, with the test numbers.
7. **The ask and contact:** placeholders, and one call to action: "Let us show you a day on the phone."
8. **Footer:** OwnYourSystem, the company idea, the app icon.

**Visual:** a phone showing the Now screen: QORDEL at the top, the date, a battery "Good" for energy, one
card "Do this now" with a step and its reason, the buttons Start it and Skip, and the tab bar Now, Talk,
Journal, You. Plain greys, white card, plum on the main button only.

## Before you answer

Check your own output against the hard rules. If any sentence claims more than this prompt gives,
rewrite it or cut it. Then give the 4 deliverables in order.
