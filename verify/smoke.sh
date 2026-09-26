#!/usr/bin/env zsh
# Every tool opened in a real browser over the static export in out/.
# Needs a fresh out/ — run verify/build.sh first (all.sh does).
source "${0:A:h}/config.sh"
require_modules playwright

[[ -f out/index.html ]] || fail "out/ is empty — run zsh verify/build.sh first"

serverlog=$(mktemp)
node "$ROOT/verify/serve.mjs" out > "$serverlog" 2>&1 &
server=$!
trap 'kill $server 2> /dev/null || true' EXIT INT TERM

url=""
for _ in {1..50}; do
  url=$(sed -nE 's/^listening (http[^ ]+)$/\1/p' "$serverlog")
  [[ -n "$url" ]] && break
  kill -0 $server 2> /dev/null || { cat "$serverlog" >&2; fail "the static server exited before listening" }
  sleep 0.1
done
[[ -n "$url" ]] || { cat "$serverlog" >&2; fail "the static server did not start" }
note "serving out/ at $url"

log=$(mktemp)
if ! node scripts/smoke.mjs "$url" > "$log" 2>&1; then
  tail -40 "$log" >&2
  fail "smoke: $(sed -nE 's/.* ([0-9]+) with problems.*/\1/p' "$log" | tail -1) page(s) with problems — full log: $log"
fi
pass "smoke: $(sed -nE 's/^([0-9]+ pages checked).*/\1/p' "$log" | tail -1), none with problems"
