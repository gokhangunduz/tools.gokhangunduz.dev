#!/usr/bin/env zsh
# vitest over the logic modules. An argument is a file filter: a tool id, a path.
source "${0:A:h}/config.sh"
require_modules vitest

log=$(mktemp)
if ! "$BIN/vitest" run ${1:+"$1"} > "$log" 2>&1; then
  grep -vE '^\s*$' "$log" | tail -60 >&2
  fail "tests failed${1:+ for \"$1\"}"
fi

# Zero executed tests is a failure, not a quiet success: a filter that matches
# nothing must not read as green.
count=$(sed -nE 's/.*Tests +([0-9]+) passed.*/\1/p' "$log" | tail -1)
[[ -n "$count" && "$count" -gt 0 ]] || { tail -20 "$log" >&2; fail "vitest exited 0 but no test ran${1:+ for \"$1\"}" }
pass "tests: $count passed${1:+ ($1)}"
