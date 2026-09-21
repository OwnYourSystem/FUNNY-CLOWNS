---
name: minimum-deliveries-ui
description: Build a page in the Minimum Deliveries interface — a dark-first, single-file dashboard with movable panels, drag-and-drop docks, a press-and-talk voice tutor and depth on scroll. Use when asked to build, extend or restyle anything in this house style, when a request names "the board", "the deliveries interface", "OYS style" or points at delivery-board.html,
---

# The Minimum Deliveries interface

One HTML file. No build step, no framework, no runtime network call except
the app's own `/api`. It opens offline, installs to a home screen, and every
byte it needs is inside it. Keep it that way: a dependency is a thing that
can be down when the user is not.

## The rules that matter

**One file.** Styles in one `<style>`, code in one `<script>` wrapped in an
IIFE with `"use strict"`. Fonts embedded as base64 woff2 data URIs. If you
reach for a CDN, stop: you have just made the app fail on a train.

**ES5 in the body, modern where it pays.** `var`, `function`, no build. Use
`async`/`await` and `Promise` freely. No JSX, no modules, no transpiler.

**State is one JSON document** in `localStorage` under one key. Every write
goes through `save()`. Every read of the board goes through the same object.
A seed merge engine (`SEED_REV`, `state.ue{}`, `state.killed[]`) folds new
shipped data in without ever overwriting what the person edited.

**Never `alert()`, `confirm()` or `prompt()`.** An embedded frame refuses
them silently and the button just dies. Use a two-press arm on the button
itself: first press turns it red and says what it will do, second press does
it, and it disarms after 4 seconds.

## Colour

Tokens on `:root`, redefined under `@media (prefers-color-scheme: light)`
and again under `:root[data-theme="light"]`. Never hard-code a colour in
markup or script; reach for a token.

```
--ground  #08080A   the page          --ink    #ECECEF   text
--panel   #0F0F12   a surface         --ink-2  #9A9AA6   secondary text
--raised  #16161B   a surface on one  --muted  #61616C   labels
--hair    rgba(255,255,255,.075)      --rule   rgba(255,255,255,.17)
--accent  #FF3B30   attention only    --run    #FF8A3D   work under way
--win     #3FCF8E   work finished     --accent-wash  rgba(255,59,48,.10)
```

Light theme: `--accent #E42418`, `--run #C75A00`, `--win #127D51`.

**Three theme states, not two.** System, Light, Dark, in that order, on one
button in the masthead. System removes `data-theme` and lets the media query
decide. The choice lives in its own key, `oys-theme`, not in the board state,
so a snippet at the very top of the body can read it before anything paints
and a board import cannot wipe it. Changing it also rewrites the bare
`<meta name="theme-color">` and re-runs whatever samples the tokens.

**Red means something wants you.** Blocked, stalled, overdue, destructive.
Progress is orange. Done is green. A board where everything is red says
nothing at all.

**Never colour alone.** Every status carries a dot *and* a word: `● DOING`,
`● BLOCKED`. Someone who cannot tell the two apart still reads the board.

## Type

```
--font  "Schibsted Grotesk", system-ui, sans-serif
--mono  "DM Mono", ui-monospace, monospace
```

Mono for anything a machine produced: numbers, percentages, timestamps,
status words, labels. Sans for anything a person wrote. Labels are 10.5px,
uppercase, `letter-spacing:.2em`. The one lead figure per panel is huge
(`clamp(52px,6.2vw,76px)`, `letter-spacing:-.05em`); everything else is
quiet. One loud number beats four medium ones.

## Shape

Radius 20px for a panel, 14-16px for a card, 999px for a pill or a button.
Panels are `color-mix(in srgb, var(--panel) 82%, transparent)` with
`backdrop-filter: blur(22px) saturate(1.3)` and a `--hair` border. Dividers
are hairlines, never boxes. Nothing has a drop shadow unless it is lifted
off the page: a dragged card, a floating sheet, the orb.

## The phone shell is moulded, not drawn

Below 820px the board changes its lighting, never its values. Everything is
the one colour, `--nm-bg`, and what separates a thing from the page is light:

```
--nm-out     -6px -6px 14px var(--nm-hi), 6px 6px 14px var(--nm-lo)
--nm-in      inset, the same two shadows the other way round
--nm-bg      #17171D dark, #E7E7E2 light
```

Raised: panels, cards, the bottom bar, a button at rest. Sunken: anything you
type into, a progress groove, a button that is on. Borders and translucency
go. Three rules keep it from turning to mush.

1. **One flat ground.** A moulded surface needs a single colour to be moulded
   out of, so the decorative canvas behind the board drops to `opacity:.12`
   and the grain layer to nothing.
2. **Type keeps its contrast.** A soft surface is no excuse for soft text.
   `--ink`, `--ink-2` and the five progress bands do not change.
3. **The red stays flat.** The one thing allowed to shout is not moulded into
   the background: the alarm badge and the assistant orb keep a solid fill.

## The banner under the date

What needs a look runs across the top on a loop rather than waiting to be
scrolled to. Badge on the left holding still, items moving right to left,
the same alarms in the same order the panel puts them.

- The strip is printed **twice** inside the runner and the animation slides
  it `-50%`. That is the only way the loop has no seam.
- Speed is fixed in pixels a second (80), and the duration is computed from
  the measured lap: `run.scrollWidth / 2 / 80`. A long list and a short one
  move at the same pace, not in the same time.
- It pauses on `:hover` and on a `.held` class, because a phone has no hover.
- Each item is a button carrying `data-goto-goal` and `data-goto-sub`, so
  pressing it lands on the work.
- The banner carries only what decides whether to press it: how late, how far
  along. The full reason stays in the panel.

## Motion

`--ease: cubic-bezier(.22,.61,.36,1)`. Transitions 250-400ms. Everything
inside `@media (prefers-reduced-motion: no-preference)` or guarded by a
`REDUCE` flag read once at boot.

**Depth on scroll.** Each panel answers the same scroll at its own rate:
`transform: translate3d(0, calc(var(--par) + var(--lag)), 0)`, set from a
rAF loop. `--par` is position parallax (factor by panel, capped at 46px),
`--lag` is velocity lag (capped at 18px, zeroed the instant anything is
grabbed). Deeper panels move more.

**Lean by moving, never by shearing.** A `skewY` shifts an element further
the further across it you are, so a 28px drag handle ends up 18px from
where it is drawn. A translate keeps every box square to the screen.

**No glide.** An earlier version held the content by the window and moved it
by a transform chasing the scroll, Lusion style. It reads beautifully and it
broke dragging outright: a page that arrives half a second after the hand
fights the hand. It was cut. Keep the lag, lose the lag on the scroll itself.

## Interaction

**Pointer Events only.** One code path for mouse, pen and touch:
`pointerdown`/`move`/`up` plus `setPointerCapture`, `touch-action:none` on
anything draggable, and a movement threshold (36px²) before a drag starts
so a tap stays a tap.

**Drag maths uses layout, not paint.** `offsetLeft`/`offsetTop` plus pointer
deltas. Never `getBoundingClientRect` for a drag: a transformed ancestor
makes it lie. Add `html{overflow-anchor:none}` or scroll anchoring will
feed the drag back into itself.

**A drag ghost is `position:fixed; left:0; top:0`** and moved by transform.
Leave the offsets as `auto` and it resolves to its static position, which
is usually far down the page and invisible — this exact bug reads to the
user as "drag is broken".

**Edge auto-scroll** during a drag, on a rAF loop, when the pointer is
within 80px of the top or bottom.

**Panels move and resize, and never overlap.** A resolve pass after every
drop pushes whatever was landed on out below, and the panel just moved
keeps its place.

## The voice tutor

One orb, `position:fixed`, draggable, 66px (62 on a phone). **Press it and
it listens. That is all it does.** It never throws a panel over the board.

- What it heard and what it did appear on a small strip beside the orb,
  two lines, gone by itself.
- Press the strip, or hold the orb for 450ms, to open the full thread.
- The thread only opens itself when the microphone cannot be had, because
  then typing is the way through.

**Ask `getUserMedia({audio:true})` before `SpeechRecognition.start()`.**
Recognition can be refused with no dialog at all; `getUserMedia` is the call
that raises the permission prompt. Read
`document.featurePolicy.allowsFeature("microphone")` to say which refusal
it was, and never send a desktop user looking for a keyboard mic key that
does not exist.

**The page understands its own commands**, with no model behind it: a table
of regexes over a normalised sentence, a table of the mishearings speech
keeps producing (`test` → `task`), name matching by word overlap because
speech never returns a name exactly, and `it` meaning the thing just named.
A model, where one is reachable, only gets the sentences the table missed.

## Writing

Short sentences. One idea each. Say what happened, not what might.

- "Bronze Database is now 40%." Not "Successfully updated the progress."
- "No main task matches 'alchmy'." Not "Error: not found."
- A refusal names its cause and what to do instead, in one line.

Never an emoji in the interface. Never "Oops". Never an exclamation mark.

## Layout

Two columns at 1200px max width, one column under 900px. Under 820px a long
master list becomes a strip you swipe sideways so the detail stays on the
same screen: master and detail together beats a 1600px scroll.

## One page

There is one page. There was a rail with four, three of them placeholders, and
they were cut: half built is not a feature, and a visitor could not tell what
the app was for. If a new page is genuinely earned, it does not arrive behind
a nav as a stub.

## What to verify before saying it works

Drive it with a real browser, not a claim. Drag a card between docks, drag a
panel and check nothing overlaps, press the orb and check it listens, load
it at 412px wide, and read the console. Every bug in this app's history was
found by pressing it and lost by assuming.
