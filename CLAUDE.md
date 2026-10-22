# Qordel (Minimum Deliveries Board)

Work on branch `app`. Start a team session with `claude --agent lead`.

## The team
11 agents in `.claude/agents/`. Every path has one owner in `.claude/owners`;
the guard in `.claude/hooks/guard.sh` blocks writes outside it, and CI checks
again on every pull request. Reviewers (design-review, principles-review,
security-review) never edit.

## The build
The page ships as one file. Edit `source/parts/*.js` (and `source/styles/`
once split), never `index.html`. Only Lead runs `source/build.sh`.

## Contracts
- Shared edit functions in `280-editing.js` change in engine first.
- Only Lead gives out part numbers.
- Board and Phone call shared functions, never copy logic.
- Maximum 3 writers at the same time.
- Every task has a card in `tasks/` before work starts.

## Words
"Built" means tests pass. "Proven" means it worked for a real person on a
real device. Write plain, short English. No em dashes.
