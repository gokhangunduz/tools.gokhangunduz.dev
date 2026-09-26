#!/usr/bin/env zsh
# Shared settings for every rung. Sourced, never run directly.
set -euo pipefail

ROOT="${0:A:h:h}"
cd "$ROOT"

BIN="$ROOT/node_modules/.bin"

RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; DIM=$'\e[2m'; OFF=$'\e[0m'
fail() { print -u2 "${RED}✗${OFF} $1"; exit 1 }
pass() { print "${GREEN}✓${OFF} $1" }
note() { print "${DIM}  $1${OFF}" }

# Every rung past `harness` runs a tool from node_modules. Saying so beats a
# "command not found" that reads like a broken rung.
require_modules() {
  [[ -x "$BIN/${1:-next}" ]] || fail "node_modules is missing ${1:-next} — run npm install (or npm ci)"
}
