#!/usr/bin/env zsh
# Did the diff stay inside the declared scope? Inert when no scope is declared.
source "${0:A:h}/config.sh"

scope=".harness/scope.json"
[[ -f "$scope" ]] || { note "no scope declared — gate inert"; exit 0 }

intent=$(node -p "JSON.parse(require('fs').readFileSync('$scope','utf8')).intent")
paths=($(node -p "JSON.parse(require('fs').readFileSync('$scope','utf8')).paths.join('\n')"))

# Porcelain's first three columns are status; `awk '{print $NF}'` would break
# any path containing a space and print only the tail of a rename. Match the
# parsing in bin/harness: strip the columns, take the new side of a rename,
# and unquote.
changed=("${(f)$(git status --porcelain | cut -c4- \
  | sed -e 's/.* -> //' -e 's/^"//' -e 's/"$//')}")
changed=(${changed:#})
(( ${#changed} )) || { pass "scope: nothing changed yet"; exit 0 }

# Always in scope: the verification ladder's own records and the findings queue.
always=(".harness/" "FINDINGS.md")

# A harness/ edit auto-syncs ~40 vendor files (bin/harness post-edit → sync);
# they are the build output of an in-scope edit. Exempt them exactly as
# bin/harness inScope() does, or this rung contradicts the git-add guard and
# the Stop gate, which both treat them as in scope. The prefix list comes from
# bin/harness itself, so the two can never drift apart.
for p in $paths; do
  if [[ "${p%/}" == "harness" || "$p" == harness/* ]]; then
    always+=("${(f)$(node "$ROOT/bin/harness" generated-prefixes)}")
    break
  fi
done

# Component-boundary match, mirroring bin/harness inScope(): an allowed `plugin`
# admits `plugin/x` but not `plugins/x`, and `AGENTS.md` does not admit
# `AGENTS.md.bak`. A trailing slash on a prefix means "this dir and below".
outside=()
for file in $changed; do
  ok=0
  for allowed in $paths $always; do
    base="${allowed%/}"
    [[ "$file" == "$base" || "$file" == "$base"/* ]] && { ok=1; break }
  done
  (( ok )) || outside+=("$file")
done

if (( ${#outside} )); then
  print -u2 "${RED}✗${OFF} ${#outside} file(s) outside the scope \"$intent\":"
  for f in $outside; do print -u2 "    $f"; done
  print -u2 ""
  print -u2 "  Either it belongs to this task — widen with bin/harness scope —"
  print -u2 "  or revert it and file it with bin/harness note."
  exit 1
fi
pass "scope: ${#changed} file(s), all inside \"$intent\""
