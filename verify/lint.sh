#!/usr/bin/env zsh
# eslint with zero warnings, and prettier --check over the sources it formats.
source "${0:A:h}/config.sh"
require_modules eslint

log=$(mktemp)
if ! "$BIN/eslint" --max-warnings 0 > "$log" 2>&1; then
  head -60 "$log" >&2
  fail "lint: eslint reported problems (the bar is zero warnings)"
fi

# The same glob as `npm run format:check`.
if ! "$BIN/prettier" --check "src/**/*.{ts,tsx,json,css}" > "$log" 2>&1; then
  grep -E '^\[warn\]' "$log" >&2 || cat "$log" >&2
  fail "lint: prettier found formatting drift — npx prettier --write <file>"
fi
pass "lint: eslint and prettier clean"
