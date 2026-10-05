---
name: minimum-deliveries-ui
description: Build a page in the Minimum Deliveries interface — a dark-first, single-file dashboard with movable panels, drag-and-drop docks, a plain typed assistant and depth on scroll. Use when asked to build, extend or restyle anything in this house style, when a request names "the board", "the deliveries interface", "OYS style" or points at delivery-board.html,
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
off the page: a dragged card, a floating sheet.

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
   the background: the needs-attention badge and the assistant panel keep a solid fill.

**The moulded block goes last in the stylesheet.** It sits after the phone
strip block, which is also `max-width:820px`. Placed before it, the strip's
`border` and `border-radius` win at equal specificity and the goal cards
quietly keep the desktop's outlined look.

**One signal per state.** A picked card was saying so three times at once: a
red border, a red wash, and a red bar poking out of the rounded corner.
Pressed in is the whole signal here.

## Two devices, one board

The board lives in localStorage, which is one browser on one machine. What
carries it between them is an account: one row per user in a `boards` table,
the whole state as JSON, pushed on a 1.5s debounce after every save.

**Which copy wins is the whole problem.** Never compare the account against
"when this browser last saved". That stamp moves on almost every
interaction, so a device that has just booted always looks newer, and
signing in on a phone pushes its empty starter board over the real one. It
looks like a save and it is a deletion.

Compare against **when this device last wrote to the account**:

```
no row in the account        this board is the first, push it
this device never pushed     the account's copy is the real one, take it
account moved since my push  somebody else changed it, take it
otherwise                    mine is the newest, push it
```

Take the stamp from the server's own `updated_at`, not `Date.now()`, so two
devices compare the same numbers however far their clocks have drifted.

**Taking the account's copy always keeps a way back.** The copy that was on
the device goes to a `before-sync` key and a Restore button brings it back.
A rule that guesses must never guess finally.

**The table is the only thing between one account and another,** because the
publishable key is in the page source. Row-level security on every verb,
checking `auth.uid() = user_id`, and prove it with two users rather than
trusting that the policies exist.

## The planner decides, it does not rank

The board answers one question: what do I do now. One task, named, with the
reason, at the top of the page. Not a shortlist. A ranking is a decision
handed back to the person who opened the board to avoid making one.

**One scorer.** `verdict()` is the only thing that ranks. The dock, the
assistant and the card all call it. Two scorers means the board argues with
itself in front of the person using it.

**Two rankings, kept apart.** Goals are compared with goals, subtasks with
their own siblings. `goalScore()` reads only goal-level facts: the deadline,
the flag on the goal, how far behind it is, how long since anything in it
moved, the window, the north star. `subScore()` reads only the step: its own
priority, a repeat due today, how far along, how stale. A subtask marked
high inside a quiet goal wins inside that goal and never drags the goal past
one that is overdue. `verdict()` picks the goal, then the step, in that
order, and `worstIn()` uses the same within-goal ranking so the alarm and
the verdict never point at different steps of one goal.

**The dose is guessed, never asked.** `doseNow()` sizes the day from what the
board already holds: done over planned for the last three planned days, and
the person's own recent overrides. Under 40% is a low day. A low day caps the
urgency term and favours the step already started, so the overdue goal stays
on the board and stops shouting. With no history it returns normal and the
board behaves exactly as it did before; keep that true. The only controls are
quiet overrides ("Rough day", "More", "Back to auto") and each tap is logged
in `capLog` next to what the board guessed. Do not add a daily mood prompt.

**The board keeps a log, and the tutor reads it with tools, never from memory.**
`state.ev` is a ring buffer of at most 800 events. `save()` notices what changed
(a percent moved, a card entered or left a dock) and writes it; skips and dose
taps are written where they happen. An event holds ids and a time, never a name,
so a rename or delete cannot leave a stale one behind. `stats`, `compare`,
`trend` and `events` are read-only, do their own arithmetic and return the sample
size and `enough`. Under eight observations the answer is "not enough yet", not
an estimate. The tutor has no web tool and no other source: do not add one.

**Outside the artifact the tutor would go through `api/tutor.js` (parked: the
`TUTOR_PROXY` flag is false and nothing calls it), and the page never holds a
key.** The function owns the rules, the model, the thinking settings
and the token ceiling; the page sends a transcript and the tools it can run,
and runs them itself. A tool with a `type` (web search, fetch, code execution,
MCP), a tool not on the function's list, a `system` message, an image: all
refused. If you add a tool to `botTools()`, add its name to `TOOLS` in
`api/tutor.js` (a test fails until you do). Keep the transcript append-only:
the model's reasoning blocks are signed against everything before them. Open
conversation must not run `guessIntent()`: when a model is there, only the
exact patterns act and everything else is chat.

**Advice comes from `EVIDENCE`, by id, or not at all.** Every entry is either
`practitioner` (a sentence taken word for word from a saved note, with the
quote in the entry and a test that finds it in the note) or `checked` (a paper,
with its abstract, DOI, who checked it and when, and only numbers that appear
in the abstract). Anything unconfirmed lives in `notes/evidence-candidates.md`,
never in the page. Do not add an entry from memory. `replyCheck()` holds back
any reply that cites an id not in the library, says what research shows with
no citation, uses a clinical word, or quotes a number no tool returned. The
page does not stream a reply: it is read by the check first.

**An experiment is started by the person, one at a time, with its outcome fixed in
the library.** `expStart()` refuses an entry whose `tryit.outcome` is null. The
result compares the experiment's days with the same number of days just before,
on active days only, using a seeded permutation test and bootstrap range, so the
same days always give the same answer. It says "not enough" under 5 active days
on either side or when the 800-event log does not reach back to the baseline, and
it always says it is two stretches of one life, not a trial. Do not add a second
outcome after the fact, and do not start an experiment from the tutor unasked.

**The board learns only what you say yes to.** `memTick()` runs once a day, looks
for one clear pattern (finishing hours, a normal day's size, a reliably lighter
weekday, a skip reason that keeps coming up), and asks, with the numbers.
Nothing is used before a yes. A yes changes one setting and is listed in the
Planner with where it came from; Remove puts the setting back. Learned and
tutor-suggested items lapse after 60 days unless seen again; what the person
typed stays. No moods, no health, nothing about who they are: `memOk()` refuses
those from the tutor and the board. Only kept items reach the tutor, through
`get_memory` and the snapshot. One question at a time, never a second before the
first is answered.

**One hint a day, built from the person's own numbers or the library, and it
learns which kind helps.** `hintCands()` makes candidates (days finished, a goal
that stopped moving, a library entry that fits today); each must pass
`replyCheck()` against the facts it was built from before it is shown. At most
one a day; the person answers helpful, not for me or later, and starting the
experiment a hint suggests counts as acting on it. `hintChoose()` tries each kind
once, then favours the best record; three refusals and no help silences a kind.
It becomes a reminder only when reminders are on and the board is open: a
browser cannot wake a closed page. Do not claim background delivery; it needs a
server (`notes/push-design.md`).

**Distress is answered by a fixed message before anything else reads the sentence.**
`botAsk()` checks `DISTRESS` first: a short list of plain phrases, answered with
`SAFE_REPLY`, with no model call, no tool, no command and nothing logged or sent.
It is a net with large holes, not a detector; subtler wording goes to the model,
whose rules carry the same sentence as `api/tutor.js` (a test checks they match).
Keep injuries and idioms out of it ("killing it", "cut myself some slack"), and
never let the command guesser see a sentence like "I want to ...".

**After three low days in a row the board asks what is in the way, once.**
`barTouch()` records the band the board showed each day it was opened;
`barStreak()` counts low days in a row ending today (a gap of up to 3 unopened
days does not break it). The question has five plain answers (can't, afraid,
don't know how, don't want to, a rough patch), and each answer offers different
library entries, never a cause. It asks again no sooner than 14 days (7 after
"Not now"), adds a line about talking to someone you trust when the run reaches
5 days or it has been asked twice in 28 days, and can be turned off in the
Planner. The tutor does not ask it; `barrier_status` is read-only. Do not make a
low day shrink the dose further without asking.

**Nothing is sent after the day is meant to be over.** `pastDayEnd(me, mins)` is
true from "your day ends at" until 04:00 (a day that ends after midnight is over
only from that time to 04:00). `nowCtx().wound` and `checkRemind()` both use it, so
the morning brief, the hint and the afternoon check stay quiet at night. A skipped
reminder is not marked as sent. `checkRemind(at)` takes an optional `Date` so a
test can set the hour.

**A question that has to be answered is a native `<dialog>`, never a new window.**
`askUser({title, body, fields, ok, cancel, danger, check})` returns a promise: `false`
(or `null` with fields) on Not now, Escape or a click outside, `true` (or the field
values) on yes. `showModal()` makes the page behind inert and gives Escape; `trapTab`
keeps Tab inside; focus returns to what was pressed. Rules: it opens only from the
person's own action (never from the tutor, a hint, a timer or a notification); a
destructive question puts focus on the way out and Enter on it does nothing; questions
queue; under 820px it is a bottom sheet; text is escaped. Use it for first-run setup,
the notification explainer shown before the browser's own prompt, irreversible actions
(reset, erase memory, forget hints, restore a day), starting an experiment, reading its
result, and the backup box. Small undoable actions keep the two-press `armGate`. The
hand-built overlays (interview, account) call `pageLockOn/Off` for the same inert
background, focus and role. The board never calls `alert`, `confirm`, `prompt` or
`window.open`: a test fails if it does. A literal second window would need
`window.open` from a click, would not work in the artifact or an installed app, and
would add a second writer to one `localStorage` blob.

**Two optional notes on a step: when, and about how long.** Both are asked in a
dialog from buttons on the Today pick and the planner card ("When?", "How long?").
`state.when[stepId]={t,d}` is a moment the person will notice (under 80 characters,
shown beside the step, never a reminder; it lapses when the step is done or after 14
days, and at most 12 are kept). `state.est={items,pairs,ask}` holds a guess in minutes
per step; finishing a step that has a guess sets `ask`, and a quiet line under the pick
asks how long it took (Tell the board, or Skip). From 5 pairs `estRatio()` gives the
middle of actual over guess, and the board says so in the person's own numbers
("about 1.5 times your guess, so a guess of 25 minutes has meant about 40"). No flat
"+50%", no study cited, no claim about other people. The event log records that one
was set or answered, never the words or the minutes.

**The tutor can ask to remove a step or clear a dock, never do it.** `remove_subtask`
and `clear_dock` are wrapped in `recordTools`: they call `pendStage`, which resolves the
name now (an unknown or ambiguous name is an error, nothing staged), sets `PEND` and
returns "Ready: ... Nothing has changed". `#bot-pend` in the chat shows what would
happen with two buttons (Remove it / Clear it, Keep it); only `pendYes` runs it, through
`toolRun`. A new sentence, Clear in the chat, or two minutes drops it. What you type is
your own word and runs at once; a spoken sentence (`botAsk(said,{spoken:true})`) is staged
too, because speech is misheard and names match loosely. The tool descriptions and
`BOT_RULES` tell the model to say it is waiting, never that it is done. Do not add a
destructive tool to the tutor without adding it to `PEND_TOOLS`.

**A minimum day is a floor the person writes, never one the board decides.**
`state.floor={items:[{id,t}],log:{date:{d:[ids],n}}}`: up to four anchors in the
person's own words (60 characters each), set in a dialog from the strip at the top of
One Task A Day. The four suggested kinds in the placeholders (body, one thing you owe,
a small step on something you are growing, a way to recover) come from the first note
and are only prompts. Each anchor is a tap for today; the board never ticks one. A day
is met when every anchor is ticked; the strip says "Met on N of the last 14 days", counts
only days it was opened, and on a low day says "these are enough". The event log records
a tick by anchor id, never the words. It stays hidden until the planner has met the
person, and an empty strip is one quiet line. Do not turn it into a streak or a score.

**The weekly check-in is kept apart from everything else on purpose.** Five taps, 1 to
5, all worded so higher is better (energy, mood, calm, getting through the day,
something that mattered), once a week if the person likes. It lives under its own key
`oys-min-deliveries-v1.week`, never in `state`, so it stays out of account sync, the
backup text, `botSnapshot`, every tutor tool, the memory and the hints. Keep it that
way: do not add it to `state`, a tool, a hint candidate or a memory finding. It opens
only when pressed (a quiet line on the board shows when one is due, 7 days after the
last), it is deleted whole from the Planner, and Reset removes it. The event log
records that one was set, never the numbers. The board says only two things, only when
true: output rose by 2 or more while at least three of energy, mood, calm and getting
through the day fell; and mood and calm both at 2 or below at two check-ins in a row,
which points to someone you trust or a doctor and says the board can only help with the
board. No score, no streak, no diagnosis, no advice beyond that.

**A subtask's priority pill only shows when it is not the middle.** A board
of defaults should stay quiet; a row with four badges reads as noise.

**The hour is a veto, not a weight.** A profile (`state.me`: working days,
hours, commute, when you train, when your day ends) plus a context on each
goal (`g.where`: anywhere, at a screen, at work, at home, training, out and
about) decides what is *possible* in the next hour. `feasible(g, ctx)`
returns a no with the reason in plain words, and nothing vetoed can reach
the top however loudly it is shouting. At one o'clock on a Monday an hour on
an airbike is not a suggestion, it is noise.

**The same hour promotes.** A goal that fits the window you are in beats one
that merely could be done: training when the training window is open, work
things while you are at work.

**Say what lost, and when it opens again.** "Shredding and Mastering is
louder, and it waits: you are out until about 16:30." A refusal you can
argue with is worth more than a suggestion you cannot act on.

**One line overrides.** What the person typed as mattering most is an
override, `sc*1.5 + 70`, not a nudge, and it is matched on whole words
against the goal, its tags and the candidate subtask. It still cannot beat a
veto. A flat bonus lost to anything already at 45%, which is the board
arguing with a decision already made.

**Ask in an interview, not a form.** Eight questions, one screen each, Back
works, nothing is written until the last answer. Eight fields on one screen
is a form, and a form is what nobody fills in. Everything is editable
afterwards on the Planner page, in place, with the held-back list under it
so the person can see exactly what their answers cost them.

## The verdict is a badge, not a panel

One sentence gets one line: an icon, the words DO THIS NOW, the task, where
it can be done, an arrow. Pressing the task lands on the work; pressing the
arrow opens the Planner and the whole reasoning. Made a panel, the one thing
the board exists for reads as another section to be got through.

The icon is the person's own picture, chosen from their camera roll or
their files. It is squared off and redrawn at 128px before it is stored,
because a photo off a phone is three megabytes and this shares localStorage
with the board.

## The layout is not yours to maintain

Panels are a grid and stay one. Dragging and resizing them was removed
along with the Tidy up button that existed to undo the mess they made. The
grid already reflows at every width; a layout a person has to repair is a
chore dressed as a feature.

## One goal open, the rest stepped back

Above 820px, `.bars:has(.row.sel) .row.pick:not(.sel)` drops to `opacity:.42`
and `saturate(.55)`. The subtask panel beside the list belongs to one row,
and the eye should not have to hunt for the accent bar to find which. They
stay readable, stay one press away, and come back to full strength on hover
or focus. Dragging clears the fade, so a row never dims under the hand.

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
- **It reports on the board, so it lives on the board.** Hidden on every
  other page, where it would be reporting on something you are not looking at.
- **It can carry the news too**, chosen in the interview and off by default.
  A browser cannot read an RSS feed from this origin, so a small same-origin
  function fetches it and returns titles; the service worker must skip
  `/api/`, because its cache lookup ignores query strings and would serve
  one set of topics for another. News items are spans, not buttons: the
  board's own items are the ones worth pressing.

## Today and Waiting, and what needs attention

**There are two lists, not three.** Today is the top panel, sized to the
day's dose (1 on a low day, 3 normal, 5 high) and filled from the board's
picks. Every card says why it is there, or "Carried over from MM-DD".
Waiting is the carry-over queue: it shows the first 4 and a "more" line.
Done today is the third dock. At the end of a day what is unfinished in Today
moves to Waiting, and Waiting never counts as planned, so a long carried pile
cannot make every day look like a low one.

**"Needs attention" is the old Alarm.** It lists what is late or due soon,
and it goes quiet on a low day: the KPI shows "paused on a low day" and no
siren plays. A rough day is not a day to be shown a pile of overdue things.

## Two reminders a day, carrying the decision

The morning brief fires at a time the person sets, once, with the task, why
it and not the next one, and what is held back until later. An afternoon one
says what is still open.

Two kinds only, at most 2 a day: the brief at the person's time and a check
at 15:00. Nothing after the day end.

**Push reaches a closed page, and says what it can and cannot promise.** A
small server (Supabase function `push`, a once-a-minute database job) sends
the single word `am` or `pm`. It holds a device address, a time zone and two
clock times, never a task or the words of a notification. The service worker
writes the words from a short summary the page leaves in the device cache
(`board-digest`), and shows a plain line, never old numbers, if the summary
is not from today. The Reminders button says the truth: "(push)" only after
the server confirmed this device, "(while open)" otherwise. Pressing it for
the first time asks first and names what the server keeps. Requirements and
the list of what is not tested are in `notes/push-nfr.md`. Delivery to a real
phone cannot be tested from the build machine; say so.

## Motion

`--ease: cubic-bezier(.22,.61,.36,1)`. Transitions 250-400ms. Everything
inside `@media (prefers-reduced-motion: no-preference)` or guarded by a
`REDUCE` flag read once at boot.

**The panels hold still.** Nothing about the grid moves for scroll, for a
pointer, or for a device tilt, on any device. This was not always true and
is worth knowing why it is now.

An earlier version gave every panel `transform: translate3d(0, calc(var(--par)
+ var(--lag)), 0)` from a rAF loop, `--par` capped at 46px of scroll
parallax, `--lag` capped at 18px of velocity lag, deeper panels moving
more, plus a `rotateX`/`rotateY` bank on the whole canvas from a real
device tilt. On a desktop that read as depth. On a phone it read as
seasickness, so it was gated off below 820px width, on the reasoning that
a phone is held and a held thing is never level: banking the board to
follow the hand meant it never held still under the thumb.

That gate used screen width as a stand-in for "is this device held in the
hand," and the stand-in was wrong. A tablet is wide enough to pass the
820px test the same way a desktop does, in portrait or landscape, and it
is held in the hand the same way a phone is. It floated exactly the same
way a phone did, on a screen even less likely to be sitting on a desk.
Rather than find a better test (`pointer:fine` without `any-hover` gets
closer, but a touchscreen laptop still has a trackpad and still sits on a
desk, so even that is not clean), the whole system was cut. `DEPTH`,
`parRAF`/`SKY`, `wideMotion`/`flying`, `parallax`/`levelOut`, `setLag`/
`driftFrame`, the `.par-sky` layer, `applyCam`/`camLoop`/`holdCam`: gone.
The grid is a grid; a goal does not move while you are reading it,
anywhere.

**Lean by moving, never by shearing.** A `skewY` shifts an element further
the further across it you are, so a 28px drag handle ends up 18px from
where it is drawn. Kept as a rule for anything that still leans, even
though the one thing it used to guard (the panel drift above) is gone.

**The river still breathes.** The decorative canvas behind the board
(`riverFrame`) is a background, not the content, and it keeps its own
gentle drift: `cam.tx`/`cam.ty` ease toward a real device tilt if one
arrives (`onTilt`) and sway on their own otherwise (`driftCam`), feeding
only the river's vanishing point. It never touches a panel. A background
is allowed to move in a way the goals you are reading are not, and Flight
on/off still gates it, honestly this time: `motionOn` controls exactly
one thing now.

**Anything read during boot is declared above `var state=boot()`.** This has
now bitten three times: `DAYS_SHORT`, then `FEEDS`, then `SUB_W`. A `var`
assigned below that line is `undefined` when `toGoals()` migrates against it,
and the whole script dies there with the board blank.

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

## The assistant

**There is no microphone anywhere.** No orb, no dictation, no
`SpeechRecognition`, no `getUserMedia`, and the `Permissions-Policy` header
says `microphone=()`. A test fails if any of them comes back. Voice was a
fancy way in that failed often (permissions, mishearing, the browser) and
the person asked for a plain one.

**It is a chat, opened by a button in the header.** The "Assistant" button
(`aria-expanded`, `aria-controls="botsheet"`) opens a fixed panel at the
bottom right (full width above the tab bar on a phone). Escape closes it.
It never opens by itself. Notices that used to be a toast are a quiet
`role="status"` line (`#flashnote`).

**It can change everything a person can change by hand.** Every list and
setting has a tool and a plain-words command: Today and Waiting, step
priority, deadline, tag, When and How long, goal name, priority, deadline,
place, tags, archive, backlog, restore and remove, hours, work days,
commute, sharpest time, training, day end, brief time, what matters most,
hints, hint reminders, the low-day question, learning, theme, animation,
the minimum day and its ticks, pages and search. The one thing it cannot see
or change is the weekly check-in, which is private. It opens the check-in
dialog and says so.

**The parts, in order of reading a sentence:**

1. Distress words get the one fixed calm reply, before anything else.
2. `assist()`: a table of actions (`ACT`), each with trigger patterns, the
   details it needs (`take`), a question for each (`ask`), and what it runs.
   A sentence that names the change but not the value gets a question back
   ("What time does your day end?"), and the next message is read as the
   answer. `cancel` stops. Memory, evidence and experiment sentences are
   left to their own readers (`NOT_MINE`).
3. The older command table (`BRAIN`), then the guesser, which is skipped
   when a model is there to talk.
4. A sentence nothing could place gets the closest things it can do
   (`suggestFor`), never a guess and never a change. A name that matches
   nothing gets the nearest real names.

**Typed words keep their capitals** (`asTyped`) and `Type ...` is the verb in
every message, not `Say ...`.

**The tools are the model's API too.** `botTools()` is the list a hosted
model is handed, and `api/tutor.js` carries an allowlist that a test compares
with it, name for name. Removing a step, removing a goal and clearing a list
are staged: the chat shows what would happen and two buttons, and nothing
changes until the person presses the first.

**A model is optional.** Where Claude is reachable it takes only the
sentences the board could not place. The hosted proxy is parked
(`TUTOR_PROXY=false`).

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
panel and check nothing overlaps, type a command to the assistant and check the board changed, load
it at 412px wide, and read the console. Every bug in this app's history was
found by pressing it and lost by assuming.
