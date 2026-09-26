#!/usr/bin/env zsh
# Everything, cheapest first. Run before handing work back.
source "${0:A:h}/config.sh"

rungs=(harness invariants scope typecheck tests lint build smoke)

typeset -i failed=0
for rung in $rungs; do
  print "${DIM}── $rung${OFF}"
  zsh "$ROOT/verify/$rung.sh" || { failed=1; break }
done

(( failed )) && fail "ladder stopped at $rung — fix it before handing back"

# Record what was verified and the exact tree it was verified on. The Stop hook
# reads this to tell "the ladder ran" from "the ladder ran on *this* code".
node "$ROOT/bin/harness" stamp-verify $rungs
pass "all rungs passed"
