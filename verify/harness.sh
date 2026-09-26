#!/usr/bin/env zsh
# Generated agent files still match harness/.
source "${0:A:h}/config.sh"
node bin/harness sync --check
