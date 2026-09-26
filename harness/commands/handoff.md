---
description: Write down the state of the work so the next session can pick it up cold.
---

Produce a handoff for whoever continues this — which may be you, tomorrow, with
none of the context you have now.

Run these first, so the handoff states facts rather than recollection:

```sh
bin/harness scope --show
git status --short && git log --oneline -3
cat .harness/last-verify.json 2>/dev/null
```

Then write exactly this — into `.harness/handoff.md` (with the Write tool),
and echo the same text in your reply. The `SessionStart` hook prints that file
next time, so the handoff reaches the next session instead of dying in this
transcript:

```text
Task:      <the one line it was asked as>
Done:      <what is finished and verified — name the rung>
Not done:  <what remains, in the order it should be picked up>
Verified:  <which rungs ran, and what they printed>
Found:     <issues filed, or "nothing">
Blocked:   <the prerequisite, or "nothing">
Next:      <the single next action, concretely enough to start on>
```

Rules that make a handoff worth reading:

- **State what you verified, not what you believe works.** "Type-checks" and
  "builds" and "works in the browser" are different claims, and the next person
  cannot tell which you meant.
- **Leave the scope open** if the task is not finished. `bin/harness done` says
  it is over, and the `SessionStart` hook will surface an open scope next time —
  which is exactly the reminder that is wanted.
- **Do not tidy up first.** A half-finished diff described honestly is easier to
  resume than a reverted one described optimistically.
