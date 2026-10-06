# F2: one engine, two screens

Started 2026-10-06. This note says what is done, how it is checked, and what is next.

## Why

Two designs (web and phone) must share one brain. The board was one file of about
6,500 lines where the rules and the drawing were mixed. A phone screen could not
reuse the rules without copying them.

## The rule

The **engine** decides: the size of the day, the picks, the reasons, the numbers,
the tools. It never touches the page, the browser storage or a timer. A **screen**
draws and listens. A **store** reads and writes the device.

## How the source is laid out now

    source/head.html          everything before the main script
    source/parts/NNN-x.js           engine code for one section
    source/parts/NNN-x.store.js     storage functions of that section
    source/parts/NNN-x.screen.js    drawing and event code of that section
    source/tail.html          everything after it
    source/build.sh           joins the parts, in name order, into one file

The page still ships as **one file**. `build.sh` writes `source/delivery-board.html`
and `index.html`. After a change, run `source/build.sh`, never edit `index.html`.

A `.store.js` or `.screen.js` file sits right after its engine file in the build
order, so each section reads the same as before.

## What is done (step 1 and step 2)

- Step 1: the file was cut into 60 parts. The build was byte for byte the same as the old file. Checked with `cmp`.
- Step 2: in the engine region (parts 010 to 200: seed to clock), every function that touches the page, the storage or a timer was moved to a `.screen.js` or `.store.js` file.
  - 421 top-level functions in the whole file: 292 engine, 113 screen, 16 store.
  - In the engine region, 199 functions and 53 top-level statements are clean.
  - The move used a real JavaScript parser (acorn), not text matching. The new build parses, and has exactly the same lines as before, only in a new order.
  - One load-time timer (`tick(); setInterval(tick,1000)`) was found in an engine file and moved to the screen file.

## How it is checked

`tests/engine-purity.cjs` fails if:
1. an engine function or top-level statement in parts 010 to 200 touches the page, storage or a timer;
2. a store file touches the page;
3. `index.html` or `source/delivery-board.html` is not what the parts build (someone edited by hand).

The full regression (about 330 checks) must stay green. It was green on the new build.

## What is not done

- Parts 210 and later (render, docks, editing, drag and drop, the assistant, sync, pages) are still mixed. Many rules are inside them: the assistant tools, the sync merge, reminders. Each needs the same move.
- A function that calls a screen function by name (for example `pendStage` calls `pendRender`) still counts as engine. Step 3 removes that: the engine reports a change, the screen listens.
- No `Engine` object yet. Step 3 puts day size, picks, reasons, stats and tools behind one surface that the web screen uses now and the phone screen uses later (P1, P2).

## Known weak spots

- Two tests failed once each in a full run (`memory` "Erase everything asks first", `hints` "Forget what helps asks first") and once `tutor-api` "per-minute limit". Each passed on rerun, twice, alone. They look like timing flakes when the machine is busy. They are real test debt, not a product bug I can show. I will make them wait for the dialog instead of the clock.
- The purity test finds screen code by name (`document`, `$`, `localStorage`, timers and a list of element properties). Code that gets a page object passed in from outside would slip through. Step 3 closes that gap by giving the engine no page object at all.
