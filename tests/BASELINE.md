# Test baseline - 2026-10-24

Machine: Windows 11 Pro, this machine (behnam@ownyoursystem.com)
Node: v24.12.0
Playwright: local devDependency (./node_modules/playwright)
Chrome: C:/Program Files/Google/Chrome/Application/chrome.exe
Server: python -m http.server 8731 (Python 3.13, C:\Python313)
Branch: setup/agent-team

## Results

| Suite | Checks | Fail | Type |
|---|---|---|---|
| engine-purity | 259 | 0 | CJS/Node |
| push-schedule | 15 | 0 | ESM/Node |
| server-rules | 10 | 0 | ESM/Node |
| tutor-api | 27 | 0 | ESM/Node |
| dose | 0 errors | 0 | CJS/browser |
| events-golden | 0 errors | 0 | CJS/browser |
| events-rollover | 0 errors | 0 | CJS/browser |
| safety | 7 | 0 | browser |
| reminders | 10 | 0 | browser |
| modals | 16 | 0 | browser |
| inputs | 15 | 0 | browser |
| pending | 12 | 0 | browser |
| floor | 17 | 0 | browser |
| week | 17 | 0 | browser |
| today | 18 | 0 | browser |
| assistant | 25 | 0 | browser |
| push | 24 | 0 | browser |
| notices | 11 | 0 | browser |
| journal | 19 | 0 | browser |
| voice | 16 | 0 | browser |
| phone | 54 | 0 | browser |
| classic-editor | 8 | 0 | browser |
| journal-progress | 20 | 0 | browser |
| phone-pages | 17 | 0 | browser |
| brand | 15 | 0 | browser |
| day-start | 12 | 0 | browser |
| hig2 | 6 | 0 | browser |
| guide | 9 | 0 | browser |
| backup | 9 | 0 | browser |
| backup-reminder | 8 | 0 | browser |
| energy | 10 | 0 | browser |
| sequence | 15 | 0 | browser |
| drag | 8 | 0 | browser |
| desktop-parity | 11 | 0 | browser |
| rules | 15 | 0 | browser |
| memory | 19 | 0 | browser |
| order-api | 14 | 0 | browser+node |
| order-ui | 10 | 0 | browser |
| read-aloud | 12 | 0 | browser |
| a11y | 47 | 0 | browser |
| what-changed-demo | 12 | 0 | browser |
| examples | 6 | 0 | browser |
| unseed | 9 | 0 | browser |
| calendar | 26 | 0 | browser |
| web | 13 | 0 | browser |
| talk-sense | 12 | 0 | browser |
| tour | 14 | 0 | browser |
| tutor-e2e | 21 | 0 | browser+server |

**47 suites. 941 checks. 0 failures.**
(dose, events-golden, events-rollover report error arrays, not check counts: all empty.)

## Flaw 13 confirmed

`tests/_sample-seed.js` line 1: "No real goal is in it."
15 goals, all generic (Home repairs, Garden, Kitchen refit, etc.).
All step names are "Sample step N" or placeholder text.
No owner name, no OwnYourSystem, no Qordel, no personal goal.
A fresh seed holds no owner goal. Flaw 13 confirmed.

## What was changed (Windows compatibility)

The suites used hard-coded `/opt/node22` paths. Seven files were patched
to read paths from env vars and to convert Windows file URLs correctly:

| File | Change |
|---|---|
| tests/engine-purity.cjs | Replaced `execSync(LC_ALL=C sh -c 'cat...')` with pure Node.js `readFileSync` concat |
| tests/server-rules.mjs | `URL.pathname` on Windows returns `/C:/...`; fixed with `decodeURIComponent(u.pathname.replace(/^\/([A-Za-z]:)/, "$1"))` |
| tests/tutor-api.mjs | Added `pathToFileURL` for dynamic ESM imports; `fileURLToPath` for `readFileSync` paths |
| tests/safety.mjs | `pathname` -> `fileURLToPath(import.meta.url)` |
| tests/assistant.mjs | `pathname` -> `fileURLToPath(...)` |
| tests/calendar.mjs | `pathname` -> `fileURLToPath(...)` |
| tests/journal-progress.mjs | `pathname` -> `fileURLToPath(...)` for photo path |
| tests/tutor-e2e.mjs | `pathname` -> `fileURLToPath(...)`; dynamic `import()` -> `pathToFileURL(path.join(...)).href` |
| tests/unseed.mjs | `pathname` -> `fileURLToPath(...)` |

All suites already used `process.env.PW_MODULE` and `process.env.CHROME_PATH`
(or the `.mjs` suites use `createRequire` + `PW_MODULE`). No hard-coded
`/opt/node22` path remains in any suite.

## How to run on this machine

```bash
cd <repo>
# Start server (keep running):
/c/Python313/python -m http.server 8731 &

# Run all suites:
T_URL=$(node -e "const {pathToFileURL}=require('url'); console.log(pathToFileURL('$(pwd)/tests/').href)")
PW_MODULE="$(pwd)/node_modules/playwright"
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
BOARD_URL="http://localhost:8731"
export NODE_OPTIONS="--import ${T_URL}_clock.mjs --import ${T_URL}_sample.mjs"
export PW_MODULE CHROME_PATH BOARD_URL
cd tests
for f in safety reminders modals inputs pending floor week today assistant push push-schedule notices journal voice phone classic-editor journal-progress phone-pages brand day-start hig2 guide backup backup-reminder energy sequence drag desktop-parity rules memory order-api order-ui read-aloud a11y what-changed-demo examples server-rules unseed calendar web talk-sense tour; do
  echo "== $f"; timeout 280 node $f.mjs 2>&1 | grep -E "^(PASS|FAIL)" | awk '/FAIL/{print substr($0,1,300)} {c[$1]++} END{print c["PASS"]+0" pass, "c["FAIL"]+0" fail"}'
done
C=$(mktemp -d)
for f in dose events-golden events-rollover; do cp "$f.js" "$C/$f.cjs"; done
cd "$C"; for f in dose events-golden events-rollover; do echo "== $f"; timeout 200 node "$f.cjs" 2>&1 | grep -E "ERRORS=|G_ERRORS="; done
cd ../
TUTOR_ON=1 timeout 250 node tutor-e2e.mjs 2>&1 | grep -E "^(PASS|FAIL)" | awk '/FAIL/{print substr($0,1,300)} {c[$1]++} END{print c["PASS"]+0" pass, "c["FAIL"]+0" fail"}'
node engine-purity.cjs | tail -1
node tutor-api.mjs 2>&1 | grep -E "^(PASS|FAIL)" | awk '{c[$1]++} END{print c["PASS"]+0" pass, "c["FAIL"]+0" fail"}'
```
