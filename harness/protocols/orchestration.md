## Working as several agents

Parallel agents are useful when the work genuinely splits. They corrupt the repo
when it does not. The rules:

**One writer per path.** Two agents editing the same folder will overwrite each
other silently — the second write wins and nobody sees the loss. Split by
folder, give each writer its own `bin/harness scope`, and if the split is not
clean, run them in sequence instead.

**Read-only agents fan out freely.** `review-manager` and `test-manager` never write, so any
number can run at once over anything. Reviewing four areas in parallel is the
cheapest way to be thorough.

**One build per checkout.** `next build` writes `.next/` and `out/`; two
concurrent builds in one checkout corrupt each other's output, and `smoke.sh`
then tests a half-written `out/`. Parallel writers do not each run the ladder —
the orchestrator runs it once, after the merge. Cheap rungs (`quick`, `tests`)
can run anywhere, any number at once.

**The shared tool files are one path.** `src/tools/registry.ts`,
`src/tools/components.ts` and `src/tools/icons.ts` are touched by every new
tool. Two agents adding tools in parallel each write their own
`src/tools/<id>/`, and the orchestrator adds the registry lines after.

**The orchestrator owns integration.** Subagents report; they do not commit, tag
or push. Whoever is coordinating merges the work, runs `verify/all.sh` on the
combined result, and writes the commit.

**Isolate writers that must overlap.** If two writers really must touch the same
tree, give each a `git worktree` and merge deliberately. Never let them share
one checkout.

**Hand back in a fixed shape.** Every agent, every time:

```text
Did:      <one line>
Changed:  <paths, or "nothing">
Verified: <rung> → <pass/fail, with the number or message>
Found:    <issue links, or "nothing">
Left:     <what remains, or "nothing">
```

Five lines. If a section is empty, write "nothing" — an omitted line reads as
forgotten, not as clean.
