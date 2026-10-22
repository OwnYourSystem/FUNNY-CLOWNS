# Hosted tutor: parked, 2026-10-02

Decision: leave the hosted-API tutor for later. A model tuned for this
solution should sit behind it, and that model is not chosen yet.

## State

- `api/tutor.js` is built, tested against a scripted stand-in, and deployed.
  With no `ANTHROPIC_API_KEY` it answers 503 `not_configured`; without a
  signed-in session it answers 401. It costs nothing and does nothing.
- The page's chat loop (`proxyChat`) is in the file behind `TUTOR_PROXY=false`.
  Nothing calls it. Sentences are read exactly as before step 2, including the
  old command guesser, because that guesser is only switched off when a model
  is present.
- Tests: `tests/tutor-api.mjs` (proxy), `tests/tutor-e2e.mjs` (page + proxy, run
  with `TUTOR_ON=1`), `tests/tutor-parked.js` (flag off: no call is ever made).

## What carries over to any model

The contract is model-neutral: the page sends a transcript and the tools it can
run; the function returns content blocks; the page runs the tools locally. A
self-hosted or tuned model replaces only `ask()` in `api/tutor.js`. The tool
set, the closed allowlist, the append-only transcript, the "enough: false"
rule and the history tools all stay.

## Questions to settle before turning it on

1. Which model? I am not aware of fine-tuning being offered for the current
   Claude models on the Claude API; check before relying on it. The other route
   is an open-weight model fine-tuned and self-hosted (hosting, GPU cost, and
   the safety and tool-calling quality become ours to own).
2. What would tuning teach it? Conduct (short answers, no diagnosing, asks one
   question, calls the history tools instead of guessing, says "not enough
   data"), not facts about the person. One person's history is far too small to
   tune on, and it should stay in the tools anyway.
3. What is the eval? Gold dialogues with expected tool calls and expected
   refusals, scored automatically. Without it there is no way to tell a tuned
   model from the base one. The golden event history in `tests/` is the start.
4. Where does the data go? A self-hosted model keeps it on our side; a hosted
   one does not. This belongs to the governance phase.

## To turn it on

Flip `TUTOR_PROXY` to true, set the key (or point `ask()` at the new model),
set a spend limit, run all three tests.
