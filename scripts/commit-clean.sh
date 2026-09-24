#!/usr/bin/env bash
# Crea commits con git commit-tree (evita Co-authored-by del wrapper de Cursor).
set -euo pipefail

MESSAGE="${1:?Uso: ./scripts/commit-clean.sh \"mensaje del commit\" [parent-sha]}"
PARENT="${2:-}"

if [[ -n "${GIT_EXE:-}" ]]; then
  GIT="$GIT_EXE"
elif [[ -x "/c/Program Files/Git/cmd/git.exe" ]]; then
  GIT="/c/Program Files/Git/cmd/git.exe"
else
  GIT="git"
fi

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-MauDevVR}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-MauDevVR@users.noreply.github.com}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"

"$GIT" add -A
TREE=$("$GIT" write-tree)

if [[ -n "$PARENT" ]]; then
  NEW=$("$GIT" commit-tree "$TREE" -p "$PARENT" -m "$MESSAGE")
else
  NEW=$("$GIT" commit-tree "$TREE" -m "$MESSAGE")
fi

BRANCH=$("$GIT" symbolic-ref --short HEAD 2>/dev/null || true)
if [[ -n "$BRANCH" ]]; then
  "$GIT" update-ref "refs/heads/$BRANCH" "$NEW"
else
  "$GIT" update-ref HEAD "$NEW"
fi

echo "Commit: $NEW"
"$GIT" log --format=fuller -1 "$NEW"