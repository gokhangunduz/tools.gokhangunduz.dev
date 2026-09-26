---
description: Declare the scope of the current task, so anything else found gets filed instead of fixed.
argument-hint: "<intent>" <path>...
---

Declare the scope for what we are about to do, then work only inside it.

1. Run `bin/harness scope $ARGUMENTS` — unquoted, so the quoted intent stays
   the first argument and the paths stay separate arguments.
2. Work only in those paths. Three things are always in scope without declaring:
   the file asked about, the tests covering it, and the translations it needs.
   A new tool's scope includes `src/tools/registry.ts`, `src/tools/components.ts`
   and, if it needs a new icon, `src/tools/icons.ts` — name them.
3. If you notice something else, **do not fix it**. Reproduce it, then
   `bin/harness note` it, then return to the task. If you cannot reproduce it,
   say "I suspect X, did not verify" in one line and carry on.
4. When it is finished: run the matching rungs, then `bin/harness done`.

If the task cannot be done without changing something outside the scope, stop
and say so in one sentence, naming the prerequisite. Widening scope is a decision to escalate, not to take unasked.
