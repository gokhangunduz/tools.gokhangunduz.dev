#!/usr/bin/env zsh
# Everything, cheapest first. Run before handing work back.
source "${0:A:h}/config.sh"

rungs=(invariants typecheck tests lint build smoke)

typeset -i failed=0
for rung in $rungs; do
  print "${DIM}── $rung${OFF}"
  zsh "$ROOT/verify/$rung.sh" || { failed=1; break }
done

(( failed )) && fail "ladder stopped at $rung — fix it before handing back"

pass "all rungs passed"
