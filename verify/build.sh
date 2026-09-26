#!/usr/bin/env zsh
# The static export: next build into out/, and every page it must contain.
source "${0:A:h}/config.sh"
require_modules next

log=$(mktemp)
if ! "$BIN/next" build > "$log" 2>&1; then
  tail -40 "$log" >&2
  fail "build failed — full log: $log"
fi

[[ -f out/index.html ]] || fail "out/index.html is missing — / has nothing to send visitors to a language"
languages=($(node -e "process.stdout.write(require('./harness/manifest.json').project.languages.join(' '))"))
tools=("${(f)$(sed -nE 's/^[[:space:]]+"?([a-z0-9-]+)"?:[[:space:]]*dynamic.*/\1/p' src/tools/components.ts)}")
(( ${#tools} )) || fail "no tools found in src/tools/components.ts"

missing=()
for locale in $languages; do
  [[ -f "out/$locale.html" ]] || missing+=("out/$locale.html")
  for tool in $tools; do
    [[ -f "out/$locale/$tool.html" ]] || missing+=("out/$locale/$tool.html")
  done
done
if (( ${#missing} )); then
  print -l -- $missing | head -20 >&2
  fail "build: ${#missing} page(s) missing from out/ — a tool registered without a prerendered page"
fi
note "log: $log"
pass "build: out/ holds / and ${#tools} tool(s) in ${#languages} language(s)"
