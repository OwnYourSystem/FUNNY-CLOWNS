#!/usr/bin/env bash
# PreToolUse guard. Every agent may write only the paths it owns in
# .claude/owners. A session with no agent (you, at the keyboard) is not
# limited. Reviewers own nothing, so they can write nothing.
# Blocks by exit code 2; the message on stderr goes back to the agent.
set -euo pipefail
input="$(cat)"
tool="$(jq -r '.tool_name // empty' <<<"$input")"
agent="$(jq -r '.agent_type // empty' <<<"$input")"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ -z "$agent" ]] && exit 0          # the human session: no limit

deny() { echo "BLOCKED for $agent: $1" >&2; exit 2; }

case "$tool" in
  Edit|Write|NotebookEdit|MultiEdit)
    file="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")"
    [[ -z "$file" ]] && exit 0
    owner="$("$here/owner-of.sh" "$file")"
    [[ "$owner" == "outside" ]] && exit 0                 # scratch files
    [[ "$owner" == "$agent" ]] && exit 0
    if [[ "$owner" == "none" ]]; then
      deny "$file has no owner in .claude/owners. Ask Lead for a part number and an owner rule."
    fi
    deny "$file belongs to $owner. Report what you need changed to Lead; do not edit it."
    ;;
  Bash)
    [[ "$agent" == "lead" ]] && exit 0
    cmd="$(jq -r '.tool_input.command // empty' <<<"$input")"
    if grep -Eq '(^|[^[:alnum:]_])build(-app)?\.sh' <<<"$cmd"; then
      deny "only Lead runs the build. Commit your source parts; Lead builds after the merge."
    fi
    if grep -Eq 'git[[:space:]]+(push|merge|rebase|reset[[:space:]]+--hard|checkout[[:space:]]+app|switch[[:space:]]+app)' <<<"$cmd"; then
      deny "only Lead pushes, merges or rebases. Commit on your own branch and report back."
    fi
    if grep -Eq '(>|>>|tee|sed[[:space:]]+-i|cp|mv)[^|;&]*index\.html' <<<"$cmd"; then
      deny "index.html is built, never written by hand."
    fi
    exit 0
    ;;
esac
exit 0
