/**
 * tests/split-phone-102.mjs
 * One test per acceptance line in tasks/102-split-phone.md
 *
 * Run:
 *   node tests/split-phone-102.mjs
 *   APP_ROOT=/path node tests/split-phone-102.mjs
 *
 * Playwright smoke (tab 5) requires:
 *   PW_MODULE  - path to playwright node_modules (default /opt/node22/lib/node_modules/playwright)
 *   PW_CHROMIUM - path to chrome executable    (default /opt/pw-browsers/chromium-1194/chrome-linux/chrome)
 *   BOARD_URL   - URL the page is served from  (default http://localhost:8731)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.APP_ROOT || path.join(__dir, "..");
const SRC = path.join(ROOT, "source");
const PARTS = path.join(SRC, "parts");

const SPLIT_FILES = [
  "595-1-now.js",
  "595-2-talk.js",
  "595-3-journal.js",
  "595-4-you.js",
  "595-5-onboarding.js",
];

const ORIG_COMMIT = "1d973c6";
const ORIG_PATH = "source/parts/595-the-phone.js";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    pass++;
    console.log("PASS", name);
  } catch (e) {
    fail++;
    failures.push({ name, msg: e.message });
    console.log("FAIL", name, "-", e.message);
  }
}

// ---------------------------------------------------------------------------
// Acceptance line 1: The five files joined in name order are byte-identical
// to the old 595 file (retrieved from git at 1d973c6).
// ---------------------------------------------------------------------------
check("AC1: five files joined in name order are byte-identical to original 595", () => {
  const orig = execSync(`git show ${ORIG_COMMIT}:${ORIG_PATH}`, { cwd: ROOT });

  const bufs = SPLIT_FILES.map((f) =>
    fs.readFileSync(path.join(PARTS, f))
  );
  const joined = Buffer.concat(bufs);

  assert.equal(
    joined.length,
    orig.length,
    `byte count: joined=${joined.length} original=${orig.length}`
  );
  assert.ok(
    joined.equals(orig),
    "concatenated bytes do not match the original file"
  );
});

// ---------------------------------------------------------------------------
// Acceptance line 2: index.html after a rebuild is byte-identical to the
// committed index.html (durable: build from source/parts and compare to
// HEAD:index.html after normalising CRLF, since git stores LF but Windows
// checkout may add CR).
// ---------------------------------------------------------------------------
check("AC2: rebuild from source parts matches committed index.html (CRLF-normalised)", () => {
  const norm = (s) => (typeof s === "string" ? s : s.toString("utf8")).replace(/\r\n/g, "\n");

  const head = fs.readFileSync(path.join(SRC, "head.html"), "utf8");
  const headEnd = fs.readFileSync(path.join(SRC, "head-end.html"), "utf8");
  const tail = fs.readFileSync(path.join(SRC, "tail.html"), "utf8");

  const styleFiles = fs.readdirSync(path.join(SRC, "styles")).sort();
  const styles = styleFiles.map((f) =>
    fs.readFileSync(path.join(SRC, "styles", f), "utf8")
  ).join("");

  const partFiles = fs.readdirSync(PARTS).sort();
  const parts = partFiles.map((f) =>
    fs.readFileSync(path.join(PARTS, f), "utf8")
  ).join("");

  const built = norm(head + styles + headEnd + parts + tail);
  const committed = norm(
    execSync("git show HEAD:index.html", { cwd: ROOT })
  );

  assert.equal(
    built.length,
    committed.length,
    `char count after normalisation: built=${built.length} committed=${committed.length}`
  );
  assert.ok(built === committed, "rebuilt content does not match committed index.html");
});

// ---------------------------------------------------------------------------
// Acceptance line 3: Each file is a whole run of code split at a tab
// boundary, not mid-statement.
//
// Rules:
//   - Files 2-4 must have balanced braces and parens (delta = 0) so they
//     are self-contained fragments.
//   - File 1 must contain the opening of the phone IIFE: (function(){
//   - File 5 must close the IIFE with })(); at the very end.
//   - The combined brace/paren delta of all five files must equal that of
//     the original 595 file (AC1 already proves byte identity; here we
//     confirm no split is mid-statement by checking each file fragment is
//     individually balanced, and files 1+5 together form a closed IIFE).
//
// The counter skips single-line // comments, block comments, and string
// literals so stray characters in comments/strings do not confuse it.
// ---------------------------------------------------------------------------
check("AC3: each file is a whole-run split at a tab boundary, not mid-statement", () => {
  const BACKTICK = String.fromCharCode(96);

  function braceParenDelta(src) {
    let braces = 0;
    let parens = 0;
    let i = 0;
    const len = src.length;

    while (i < len) {
      const ch = src[i];

      // single-line comment
      if (ch === "/" && src[i + 1] === "/") {
        i += 2;
        while (i < len && src[i] !== "\n") i++;
        continue;
      }
      // block comment
      if (ch === "/" && src[i + 1] === "*") {
        i += 2;
        while (i < len && !(src[i] === "*" && src[i + 1] === "/")) i++;
        i += 2;
        continue;
      }
      // template literal
      if (ch === BACKTICK) {
        i++;
        while (i < len && src[i] !== BACKTICK) {
          if (src[i] === "\\") i++;
          i++;
        }
        i++;
        continue;
      }
      // string literals
      if (ch === '"' || ch === "'") {
        const q = ch;
        i++;
        while (i < len && src[i] !== q) {
          if (src[i] === "\\") i++;
          i++;
        }
        i++;
        continue;
      }

      if (ch === "{") braces++;
      else if (ch === "}") braces--;
      else if (ch === "(") parens++;
      else if (ch === ")") parens--;
      i++;
    }
    return { braces, parens };
  }

  // Compute expected delta from the original file (AC1 proved byte-identity
  // so this is the ground truth: whatever the original has, the split must have).
  const origSrc = execSync(
    `git show ${ORIG_COMMIT}:${ORIG_PATH}`,
    { cwd: ROOT }
  ).toString();
  const origDelta = braceParenDelta(origSrc);

  const results = SPLIT_FILES.map((f) => {
    const src = fs.readFileSync(path.join(PARTS, f), "utf8");
    return { file: f, src, ...braceParenDelta(src) };
  });

  let totalBraces = 0;
  let totalParens = 0;
  for (const r of results) {
    totalBraces += r.braces;
    totalParens += r.parens;
  }

  // files 2-4 must be fully balanced fragments (neither opens nor closes
  // cross-file braces/parens)
  for (const r of results.slice(1, 4)) {
    assert.equal(
      r.braces, 0,
      `${r.file}: expected brace delta 0 for a balanced fragment, got ${r.braces}`
    );
    assert.equal(
      r.parens, 0,
      `${r.file}: expected paren delta 0 for a balanced fragment, got ${r.parens}`
    );
  }

  // file 1 must contain the phone IIFE opener
  assert.ok(
    results[0].src.includes("(function(){") || results[0].src.includes("(function () {"),
    "595-1-now.js must contain the phone IIFE opening (function(){"
  );

  // file 5 must close the IIFE
  const last5 = results[4].src.trimEnd();
  assert.ok(
    last5.endsWith("})();") || last5.endsWith("})()"),
    "595-5-onboarding.js must end with })(); closing the phone IIFE"
  );

  // combined balance must match the original (the split preserves the
  // structural integrity of the original file exactly)
  assert.equal(
    totalBraces, origDelta.braces,
    `all five files combined: brace delta must match original (${origDelta.braces}), got ${totalBraces}`
  );
  assert.equal(
    totalParens, origDelta.parens,
    `all five files combined: paren delta must match original (${origDelta.parens}), got ${totalParens}`
  );
});

// ---------------------------------------------------------------------------
// Acceptance line 4: No var moved below a part that reads it while the
// page loads.
//
// Rules:
//   - Every `var PH_*` global declaration (lines starting /^\s*var PH_/)
//     must live in 595-1-now.js only, NOT in files 2, 3, or 4.
//   - var PH_ONB_LAST and var PH_EX are the two declarations allowed in
//     595-5-onboarding.js (they are declared and used within that file
//     only).
//   - Files 2-4 must not declare any var PH_ at all.
// ---------------------------------------------------------------------------
check("AC4: all global var PH_* declarations are in 595-1-now.js; none in files 2-4", () => {
  const VarPH = /^\s*var\s+PH_/m;

  // files 2-4 must not declare var PH_*
  for (const f of SPLIT_FILES.slice(1, 4)) {
    const src = fs.readFileSync(path.join(PARTS, f), "utf8");
    assert.ok(
      !VarPH.test(src),
      `${f}: must not declare var PH_* (found global var declaration that belongs in 595-1-now.js)`
    );
  }

  // file 1 must have at least some var PH_ declarations
  const src1 = fs.readFileSync(path.join(PARTS, SPLIT_FILES[0]), "utf8");
  assert.ok(
    VarPH.test(src1),
    "595-1-now.js: must contain var PH_* global declarations"
  );

  // file 5 may declare var PH_ONB_LAST and var PH_EX (local to that tab)
  // but must NOT declare any other var PH_* that belongs to the shared globals
  const src5 = fs.readFileSync(path.join(PARTS, SPLIT_FILES[4]), "utf8");
  const ph5 = src5.match(/^\s*var\s+(PH_\w+)/gm) || [];
  const allowed5 = new Set(["PH_ONB_LAST", "PH_EX"]);
  for (const decl of ph5) {
    const m = decl.match(/var\s+(PH_\w+)/);
    if (m) {
      assert.ok(
        allowed5.has(m[1]),
        `595-5-onboarding.js: unexpected global var declaration: ${m[1]} (only PH_ONB_LAST and PH_EX are local to this tab)`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${pass} pass, ${fail} fail`);
if (failures.length) {
  console.log("\nFailed tests:");
  failures.forEach((f) => console.log(" -", f.name, ":", f.msg));
  process.exit(1);
}
