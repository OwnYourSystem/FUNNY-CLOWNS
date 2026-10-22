#!/usr/bin/env bash
# Print the owner of a path, read from .claude/owners (first match wins).
# Prints "none" when no rule matches. Used by the edit guard and by CI.
#   .claude/hooks/owner-of.sh source/parts/280-editing.js   ->  engine
# Works in the main checkout and in an agent's worktree: the path is made
# relative to the git checkout that holds it, and that checkout's own
# .claude/owners is read.
set -euo pipefail
target="$1"
# Windows (Git Bash): turn C:\a\b or C:/a/b into /c/a/b. No cygpath on Linux/CI.
if command -v cygpath >/dev/null 2>&1; then target="$(cygpath -u "$target")"; fi
case "$target" in /*) ;; *) target="$PWD/$target" ;; esac

# nearest folder that exists (a file being created may sit in a new folder)
dir="$(dirname "$target")"
while [[ ! -d "$dir" ]]; do dir="$(dirname "$dir")"; done
top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$top" ]]; then echo "outside"; exit 0; fi   # not in the repo (scratch files)

# Build the repo-relative path from git's own prefix, not by cutting $top off
# $target: on Windows (Git Bash) git prints C:/... while $PWD says /c/...
prefix="$(git -C "$dir" rev-parse --show-prefix)"
rel="${prefix}${target#"$dir"/}"
owners="$top/.claude/owners"
# a worktree made before the owners file was committed: use the main checkout's
[[ -f "$owners" ]] || owners="${CLAUDE_PROJECT_DIR:-}/.claude/owners"
[[ -f "$owners" ]] || { echo "none"; exit 0; }

while read -r glob owner _; do
  [[ -z "${glob:-}" || "$glob" == \#* ]] && continue
  # shellcheck disable=SC2053   (the glob must stay unquoted to match)
  if [[ "$rel" == $glob ]]; then echo "$owner"; exit 0; fi
done < "$owners"
echo "none"
