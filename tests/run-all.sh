#!/bin/bash
# Every suite in one go. APP_ROOT is a checkout of the app branch (the board
# being tested), served on :8731. Usage:
#   (cd "$APP_ROOT" && python3 -m http.server 8731 &) ; APP_ROOT=/path/to/app bash tests/run-all.sh
# EXTRA="journal-progress" adds suites that only a feature branch passes; BOARD_URL
# points the browser suites at another server (default :8731).
# Every browser starts today at 18:00 (tests/_clock.mjs); TEST_CLOCK=off uses the real time.
# Known debt: modals, inputs and floor can fail on timing in a
# full run; run the suite alone before calling it a break.
T=$(cd "$(dirname "$0")" && pwd)
: "${APP_ROOT:?set APP_ROOT to a checkout of the app branch}"; export APP_ROOT
export NODE_OPTIONS="--import $T/_clock.mjs $NODE_OPTIONS"
C=$(mktemp -d)
cd "$T"
for f in safety reminders modals inputs pending floor week today assistant push push-schedule notices journal voice phone classic-editor journal-progress phone-pages brand day-start hig2 guide backup backup-reminder energy sequence drag desktop-parity rules memory order-api order-ui read-aloud a11y what-changed-demo examples server-rules $EXTRA; do
  [ -f $f.mjs ] || continue
  echo "== $f"; timeout 280 node $f.mjs 2>&1 | grep -E "^(PASS|FAIL)" | awk '/FAIL/{print substr($0,1,300)} {c[$1]++} END{print c["PASS"]+0" pass, "c["FAIL"]+0" fail"}'
done
for f in dose events-golden events-rollover; do cp "$T/$f.js" "$C/$f.cjs"; done
cd "$C"; for f in dose events-golden events-rollover; do echo "== $f"; timeout 200 node $f.cjs 2>&1 | grep -E "ERRORS=|G_ERRORS=|Error" | head -3; done
cd "$T"; echo "== tutor-api"; timeout 200 node tutor-api.mjs 2>&1 | grep -E "^(PASS|FAIL)" | awk '/FAIL/{print substr($0,1,300)} {c[$1]++} END{print c["PASS"]+0" pass, "c["FAIL"]+0" fail"}'
echo "== tutor-e2e"; TUTOR_ON=1 timeout 250 node tutor-e2e.mjs 2>&1 | grep -E "^(PASS|FAIL)" | awk '/FAIL/{print substr($0,1,300)} {c[$1]++} END{print c["PASS"]+0" pass, "c["FAIL"]+0" fail"}'
echo "== purity"; node "$T/engine-purity.cjs" | tail -1
rm -rf "$C"; echo ALLDONE
