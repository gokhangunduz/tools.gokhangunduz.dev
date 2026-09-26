#!/usr/bin/env zsh
# Both languages everywhere, and colours only from the tokens. No build, ~1 second.
source "${0:A:h}/config.sh"
require_modules tsc
node "$ROOT/verify/invariants.mjs"
