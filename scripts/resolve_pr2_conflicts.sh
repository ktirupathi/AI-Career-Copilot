#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/resolve_pr2_conflicts.sh <base-branch> <feature-branch>
# Example:
#   scripts/resolve_pr2_conflicts.sh main work

BASE_BRANCH=${1:-main}
FEATURE_BRANCH=${2:-work}

echo "[1/6] Checking git status"
git status --short

echo "[2/6] Switching to feature branch: ${FEATURE_BRANCH}"
git checkout "${FEATURE_BRANCH}"

echo "[3/6] Updating local refs (if remotes are configured)"
if git remote | grep -q .; then
  git fetch --all --prune || true
else
  echo "No git remotes configured locally. Skipping fetch."
fi

echo "[4/6] Attempting merge from ${BASE_BRANCH}"
set +e
git merge "${BASE_BRANCH}"
MERGE_EXIT=$?
set -e

if [[ ${MERGE_EXIT} -ne 0 ]]; then
  echo "Merge reported conflicts. Listing files:"
  git diff --name-only --diff-filter=U || true
  echo
  echo "Search for conflict markers with:"
  echo "  rg -n '^<<<<<<<|^=======|^>>>>>>>'"
  echo
  echo "After manual edits, run:"
  echo "  git add <resolved-files>"
  echo "  git commit -m 'Resolve merge conflicts with ${BASE_BRANCH}'"
  exit 1
fi

echo "[5/6] Merge succeeded without conflicts"

echo "[6/6] Optional checks"
echo "Run project checks, then push:"
echo "  git push"
