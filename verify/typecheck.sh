#!/usr/bin/env zsh
# tsc --noEmit over the whole project. Seconds, not a build.
source "${0:A:h}/config.sh"
require_modules tsc

# A fresh checkout has no next-env.d.ts (it is gitignored); `next typegen`
# writes it and the route types without building.
[[ -f next-env.d.ts ]] || "$BIN/next" typegen > /dev/null

log=$(mktemp)
if ! "$BIN/tsc" --noEmit > "$log" 2>&1; then
  head -40 "$log" >&2
  fail "typecheck: $(grep -c 'error TS' "$log" || true) error(s)"
fi
pass "typecheck: clean"
