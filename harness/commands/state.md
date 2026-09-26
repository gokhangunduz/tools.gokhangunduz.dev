---
description: Report what state the project is actually in — the ladder, open work, scope, and which rules have no gate.
---

Establish the state before saying anything about it. Run these and report what
they printed, not what you expected:

```sh
bin/harness scope --show
git status --short && git log --oneline -5
cat .harness/last-verify.json 2>/dev/null || echo "no ladder stamp"
gh issue list --state open --limit 20 2>/dev/null || cat FINDINGS.md 2>/dev/null
zsh verify/quick.sh
```

Then answer in this shape and stop:

```text
Ladder:      quick <pass|fail> · last all.sh <on this tree | on an older tree | never>
Open work:   <issues or findings, by priority>
Scope:       <declared intent, or none>
Unenforced:  <rules currently held by goodwill, from the project-manager skill>
```

Rules for this report:

- Numbers, not impressions.
- Drift is reported, never silently reconciled.
- Name the rules that currently have no automated gate. That list is the most
  valuable line here and it is invisible unless someone says it.
