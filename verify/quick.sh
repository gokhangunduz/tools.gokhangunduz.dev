#!/usr/bin/env zsh
# The cheap checks to run before every commit, in a few seconds.
#
# Deliberately does not lint, test or build: a check that takes a minute is one
# people learn to skip.
source "${0:A:h}/config.sh"

rungs=(invariants typecheck)

typeset -i failed=0
for rung in $rungs; do
  zsh "$ROOT/verify/$rung.sh" > /dev/null 2>&1 || { failed=1; break }
done

if (( failed )); then
  print -u2 ""
  zsh "$ROOT/verify/$rung.sh" >&2 || true
  print -u2 ""
  print -u2 "${RED}✗${OFF} stopped by verify/$rung.sh"
  print -u2 "  Fix it, or run the full ladder to see what else moved: zsh verify/all.sh"
  exit 1
fi
pass "quick: ${#rungs} rung(s) passed (${(j:, :)rungs})"
