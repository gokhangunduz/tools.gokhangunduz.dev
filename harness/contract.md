Development here is agent-driven. The rules below are not style preferences —
they are the things that break silently and that no type-checker will catch for
you.

Every rule that can be checked is enforced by a script under `verify/`. If a
rule is not enforced, it is a suggestion, and suggestions get skipped. Add the
check when you add the rule.

---

## What this site is

A public collection of developer tools — encoders, hashes, formatters,
converters, generators. Turkish and English, light and dark, no account, no
ads.

**The promise the site makes: nothing the visitor types leaves their browser.**
Every tool is pure client-side work. The handful that genuinely need a
third-party API (DNS-over-HTTPS, RDAP, IP geolocation) set `network: true` and
`networkService` in their metadata, which prints a warning on the page. Do not
add a server action, an API route, a proxy or a third-party script to make a
tool "work better"; if it cannot be done in the browser, it does not ship.

The site is a static export (`output: "export"` → `out/`), deployed by
Cloudflare Pages from the Git repository. There is no server to fall back on:
anything that needs one does not exist in production, however well it works
under `next dev`.

---

## Starting a task

The first two minutes decide most of the accuracy. Do these in order, and stop
at the first one that gives you a reason to ask instead of act.

**1. Say back what you were asked for, in one line.** If you cannot, you do not
have the task yet — ask. A task you restate wrongly is one you will finish
wrongly and verify wrongly.

**2. Find the ground truth before forming a plan.** Read the two or three files
nearest the change, and whatever check already covers it. Do not plan from the
file names, and do not plan from what a document says the code does. This
Next.js version has breaking changes from what you may remember: read the
relevant guide in `node_modules/next/dist/docs/` before using an API you have
not seen used in this repository.

**3. Declare the scope.** `bin/harness scope "<intent>" <path>...` Naming the
paths forces you to decide what the change actually touches, which is where an
under-scoped plan falls apart — before any code is written rather than after.

**4. Pick the cheapest rung that would catch you being wrong**, and know it
before you start. If nothing would, that is the first thing to say: work with no
check behind it is work nobody can trust, including you.

**5. Then write.** Whole change, not a sketch, and three rules while you do:

- **Match the neighbours** — naming, comment density, folder placement, test
  style. `src/tools/base64-text/` is the reference shape for a tool.
- **Smallest change that fully solves the problem.** No refactor you were not
  asked for, no abstraction for a second case that does not exist, no dead code
  behind a flag.
- **No placeholder work.** No `TODO` standing in for a decision, no stub
  returning a fake value, no test asserting `true`. If something genuinely
  cannot be finished, leave it out and say what is missing and why.

Two exceptions worth knowing. A one-line fix to a file you were handed does not
need a declared scope — the ceremony would cost more than the drift. And a
question ("why does X do Y?") is not a task: answer it, do not start editing.

---

## One task at a time

The most expensive failure mode here is not a wrong line of code — it is drift.
You are asked for A, you notice B on the way, you fix B, B reveals C, and three
hours later nothing is finished and the diff cannot be reviewed. This section is
the rule that prevents it, and `verify/scope.sh` is the gate that enforces it.

```sh
bin/harness scope "add the xml formatter" src/tools/xml-format src/tools/registry.ts src/tools/components.ts
bin/harness note "<defect>" <file>:<line> --type … --area … \
    --failure … --repro … --evidence … --fix …   # something else you found — all flags required
bin/harness done                                  # the task is finished
```

**Declare the scope before you touch anything.** From then on, a write outside
those paths is a defect in your process, not a bonus.

**When you notice something else, reproduce it, log it, and keep going.** Never
fix it inline. `note` opens a GitHub issue labelled `agent-finding` (or appends
to `FINDINGS.md` when there is no remote), and refuses a finding you have not
reproduced. Then return to A.

**Finish, verify, hand back, then take the next one.** A finding is only worth
acting on after the current task is closed — and by then you have a queue you
can sort, instead of a diff you cannot review.

Three things are always in scope and never need declaring: the file you were
asked to change, the tests that cover it, and the translations it needs. A type
error caused by your own edit is also in scope — that is finishing A, not
starting B.

If the task genuinely cannot be done without changing something else first, stop
and say so in one sentence, with what the prerequisite is. Do not silently widen
the work. Widening scope is a decision to escalate, never one to take unasked.

No scope declared means the gate is inert — it never blocks work that nobody
scoped. But `verify/all.sh` will not certify a diff that spilled outside a scope
you did in fact declare.

---

## Never claim what you have not reproduced

Calling something a bug when it is not costs more than missing it. The reader
stops what they are doing, goes and looks, and finds nothing — and the next real
finding gets the same shrug.

So: **reading code is not evidence.** Before the word "bug", "broken", "race" or
"leak" leaves your report, run something that shows it — a vitest case, the
page in a browser, the command — and keep the output.

- Reproduced, with the command and its output → say it plainly, or file it with
  `bin/harness note`, which will not accept a finding without both.
- Suspected but not reproduced → say exactly that: *"I suspect X but did not
  verify it."* One sentence, no issue, no ceremony.
- Cannot even describe the failure concretely → it is not a finding. Drop it.

The same bar applies to your own work: "it builds" is a claim about a command
you ran, not a feeling. If you did not run it, do not say it.

---

## Verify before you claim

Never report work as done without running the matching check. In order of cost:

| Command | Covers | Cost |
|---|---|---|
| `zsh verify/quick.sh` | generated files, invariants, scope, types — what the `pre-commit` hook runs | seconds |
| `zsh verify/tests.sh [pattern]` | the logic modules (vitest) | seconds |
| `zsh verify/lint.sh` | eslint and prettier | about a minute |
| `zsh verify/build.sh` | the static export: every page prerenders into `out/` | a minute or two |
| `zsh verify/smoke.sh` | every tool opened in a real browser over `out/`, in both languages | minutes |
| `zsh verify/all.sh` | all of the above, cheapest first — before handing work back | minutes |

`npm run verify` is `zsh verify/all.sh`. Each rung is listed with what it
catches in the `test-manager` skill.

Rules that hold for every rung:

- **The bar is zero errors *and* zero warnings.** A new lint warning or console
  error is a regression; fix it rather than noting it.
- **`smoke.sh` runs against `out/`, so it needs a fresh `build.sh` first.**
  `all.sh` runs them in that order. A smoke run over a stale `out/` verifies the
  previous code.
- **A dev server may be running** (`next dev`). Building beside it is fine; do
  not kill a server you did not start.
- **Never substitute a cheaper rung for a more expensive one.** A type-check is
  not a build; a build is not a browser run. If a check cannot run in your
  environment, say so explicitly and say what you did instead.
- **A failing rung is the answer.** Do not re-run it hoping for a different
  result, and do not weaken the check to make it pass.
- **Both themes, both languages.** Anything visible is checked in light *and*
  dark, in Turkish *and* English, before it is called done. No rung does this
  for you; say that you looked, or say that you did not.

---

## When you are stuck

Being stuck is a normal state. Hiding it is what costs time — an agent that
quietly narrows the task until something passes has produced a green run and no
work, and nobody finds out until later.

**After two failed attempts at the same thing, stop and change something.** Not
a third variation of the same approach: a different approach, or a question.

The order to try:

1. **Read the actual error again**, all of it, and the first one rather than the
   last. Most second attempts fail because the first error was skimmed.
2. **Reproduce it smaller.** One test, one file, one command. A failure you can
   trigger in two seconds is a failure you can understand.
3. **Check your assumption about the code**, not about the tool. Open the file
   and read it — and for a framework API, the guide in
   `node_modules/next/dist/docs/` — rather than reasoning about what it probably
   says.
4. **Ask.** One sentence: what you were doing, what happened, what you tried,
   and the specific thing you need decided.

**Never do these to get unstuck:** weaken a check, delete a failing test, skip a
suite, add `// @ts-ignore`, `as any` or an `eslint-disable` to silence a real
diagnostic, `--no-verify` a commit, or retry a flaky run until it passes. Each
one converts a visible problem into an invisible one, and the invisible one is
found by someone who cannot fix it.

If you genuinely cannot finish, hand back what is real: what works, what does
not, what you verified, and what you would try next. A partial result reported
honestly is worth more than a complete one that is not true.

---

## Invariants — breaking these is a bug, not a style change

**1. Nothing the visitor types leaves the browser.** No API route, no server
action, no proxy, no analytics, no script or font from a third-party origin.
A tool that calls a third-party API declares `network: true` and names the host
in `networkService`; the page warns before anything is sent. A secret option
(`secret: true`) and a tool with `share: false` stay out of the shared link.
The input lives in the URL fragment precisely because a fragment is never sent
to a server — do not move it into a query string.

**2. Every string exists in Turkish and English.** Shell text goes through
`t(locale, key)` with a key in both `src/i18n/tr.json` and `src/i18n/en.json`;
tool text is a `Localized` (`{ tr, en }`) in the tool's own files. A string that
exists in one language only, or is empty in one, is a bug.
`verify/invariants.sh` checks both. Turkish copy keeps the English developer
terms a Turkish developer actually uses — *encode*, *decode*, *hash*, *token*,
*payload*, *regex*, *timestamp* — rather than inventing a translation nobody
searches for; the surrounding sentence is Turkish.

**3. Colours come from the tokens.** Every colour is a token in
`src/app/globals.css` (`bg-card`, `text-muted-foreground`, `border-border`,
`text-destructive`, `text-success`, `bg-tint`, `text-tint`, `bg-tint/15`). Never
a hex value, an `rgb()` or an arbitrary `bg-[#…]` in a component. Both themes are
first-class. `verify/invariants.sh` rejects a hex colour in `src/` outside
`globals.css`; the exceptions (a `<meta name="theme-color">` cannot read a CSS
variable) are frozen in `verify/allowed-hex.txt`, and adding a line there is a
decision, not a way to silence the check.

**4. The work is a pure function, and it is tested.** A tool's conversion lives
in `logic.ts` — no React, no DOM, no `window` — with `logic.test.ts` beside it
in vitest. The component is a wrapper. A tool with no test is not done, and a
test that only checks the happy path proves nothing: cover non-ASCII input,
empty input, input that must be rejected, and the round-trip if there is an
inverse.

**5. Errors are `ToolError`, in both languages.** Anything the visitor did
wrong is thrown as `ToolError({ tr, en }, { at, field, action })` from
`src/tools/text-tool.ts`. Never surface a raw exception message; a genuine bug
may throw normally and is caught by the shell.

**6. Heavy work never reaches the shared bundle.** Anything heavier than a few
milliseconds — a parser, a wasm module, a large table — is imported lazily
inside the tool, and long work runs off the main thread (a worker, as in
`json-viewer` and `regex-test`). Never import it at the top of `meta.ts`: the
metadata of every tool is loaded by the home page and the command palette at
once. `src/tools/components.ts` uses one literal `import()` per tool; a computed
path would bundle every tool together.

**7. One registry, one component map.** A tool is one folder under `src/tools/`,
one line in `src/tools/registry.ts` and one line in `src/tools/components.ts`.
Nothing else enumerates tools; the home page, search, palette, sidebar, sitemap
and page metadata are all derived from `TOOLS`. A tool's `id` is its URL and
never changes once shipped — a renamed id breaks every link someone saved.

**8. One chrome, from `Panel.tsx`.** Tools are built from
`src/components/Panel.tsx` (`Frame`, `Split`, `Pane`, `PaneFooter`,
`PaneButton`, `PaneTextarea`, `PaneError`, `KeyValueList`, `Segmented`) or from
the shared runners over it (`TextTool`, `DualTool`, `FileTool`,
`GeneratorTool`), so moving between tools never moves the copy button. The
design language is neutral surfaces coloured by category: every category has a
hue (`--cat-<id>`), and a tool page, card or sidebar group sets `cat-<id>` so its
badges, active states and focus use `--tint`. Soft shadows (`shadow-soft`,
`shadow-lift`), rounded cards (`rounded-xl`). Components come from shadcn/ui
(`npx shadcn@latest add <name>`, imports pointed at `@/lib/utils`); there is no
second component library.

**9. A tool page does not scroll; its panes do.** On a desktop viewport the tool
fills the space under the header and the page itself never scrolls — the
`Frame` sizes (`fill`, `content`, `split`) shrink to the space there is and the
panes scroll inside it. A page that scrolls to reach the output has lost the
point of the side-by-side layout.

**10. Icons are named, not imported, in metadata.** A tool's `icon` is a key of
`ICONS` in `src/tools/icons.ts`; add the lucide icon there if it is missing. A
component cannot cross the server/client boundary and tool metadata does.

**11. Generated agent files are generated.** `AGENTS.md`, `CLAUDE.md`,
`GEMINI.md`, `.claude/agents|skills|commands/`, `.claude/settings.json`,
`.cursor/rules/`, `.github/copilot-instructions.md` and
`.github/ISSUE_TEMPLATE/` are produced from `harness/` by `bin/harness sync`.
Edit the source under `harness/`, run the sync, commit both.
`verify/harness.sh` fails if they drift. The Next.js block at the top of
`AGENTS.md` is emitted by the sync from the installed `next` package, so
`next dev` finds it current and leaves the file alone.

Smaller rules, same force: numbers compared by eye take the `.tabular` utility;
no comments in code beyond a single line for a genuinely non-obvious decision.

---

## Working as several agents

Parallel agents are useful when the work genuinely splits and corrupt the repo
when it does not. Two rules are load-bearing enough to state here:

- **One writer per path.** Two agents editing the same folder overwrite each
  other silently — the second write wins and nobody sees the loss. The shared
  files every tool touches (`registry.ts`, `components.ts`, `icons.ts`) are one
  path: two agents adding tools in parallel must serialise those edits.
- **One build per checkout.** `next build` writes `.next/` and `out/`; two
  concurrent builds in one checkout corrupt each other's output.

Before coordinating anything, read **`harness/protocols/orchestration.md`**: how
to split the work, when to isolate with a worktree, who owns integration, and
the five-line shape every agent hands back in.

---

## Delegating

The specialists exist to keep work out of this conversation, not to look
thorough. Both mistakes are expensive: delegating everything spends tokens and
loses context, delegating nothing fills the main window with file contents that
mattered for ninety seconds.

**Delegate when the work is read-heavy and the answer is small.** A review that
must open forty files and report five findings is the ideal case — the reading
happens somewhere else and only the conclusion comes back.

| Delegate | Do it here |
|---|---|
| Reviewing a diff across many files | Reviewing three lines you just wrote |
| Diagnosing a failure whose cause is unknown | Running a rung you expect to pass |
| Sweeping for a pattern across the repo | Editing a file you already have open |
| Adding a whole tool end to end (`tool-author`) | Adjusting one option of an existing tool |

**Never delegate the writing of the change you are in the middle of.** The
subagent does not have what you know, and merging its guess with your half-done
edit costs more than doing it yourself.

**Give a question, not a task list.** "Can this diff send the input to a
server?" produces a better answer than "check privacy" — the first can be
answered wrongly and you will see it, the second cannot be checked at all.

Read-only specialists — `review-manager`, `test-manager` — can run in parallel
over anything, any number at once. Writers cannot: see
`harness/protocols/orchestration.md`.

---

## Git

**One declared task, one commit.** Messages are
`<type>(<scope>): <emoji> <subject>` — imperative, under 72 characters, no
trailing period. **Never add an AI co-author or attribution trailer**; every
commit is authored by the local git user and nobody else. The `commit-msg` hook
enforces both, so you will find out immediately either way.

Before committing, read **`harness/protocols/git.md`**: the type table, what
belongs in a body, and what never to do to history.

---

## How to report

Short, plain, and led by the outcome. The person reading has one question —
*what happened?* — and it gets answered in the first line. One sentence per
progress note. Bad news first, with the exact message. Recommend rather than
survey.

**`harness/protocols/reporting.md`** has the detail, including the shape to hand
work back in.

---

## What is a gate and what is goodwill

Rules here are enforced by one of three things, and it is worth knowing which:

| Mechanism | Runs | Example |
|---|---|---|
| **A rung** under `verify/` | when you run it, and in CI | language parity, hex colours, types, tests, the static export, the browser smoke run, scope |
| **A hook** | automatically, whether or not anyone remembers | the commit convention, the scope warning, the Stop check, the refusal to edit a generated file, the state written before a compaction or a session ending |
| **Nobody** | never | no page scroll on a tool page; heavy work kept out of the shared bundle; no third-party request from a tool without `network: true`; Turkish copy that keeps the English developer terms |

The third row is the honest one. Some rules cannot be checked cheaply, and
pretending otherwise is worse than saying so. `project-manager` audits that list
and names it in every state report — a rule that quietly lost its gate is
indistinguishable from a rule nobody broke.

If you add a rule, add its check in the same change. A rule with no gate is a
suggestion, and suggestions get skipped.

---

## Where things live

| Path | Holds |
|---|---|
| `src/tools/registry.ts` | the list of every tool — one line per tool; nothing else enumerates them |
| `src/tools/components.ts` | one lazy `import()` per tool, so listing tools never loads their code |
| `src/tools/<id>/` | `meta.ts` (registry entry), `spec.ts` and/or `Tool.tsx` (the UI), `logic.ts` + `logic.test.ts` (the pure work) |
| `src/tools/types.ts` | `ToolMeta`, `CategoryId` (`encode`, `data`, `text`, `crypto`, `time`, `network`, `image`) |
| `src/tools/text-tool.ts` | the "text in, text out" contract (`TextToolSpec`) and `ToolError` |
| `src/tools/{dual,file,generator}-tool.ts` | the other three contracts: two inputs, a file, a generator |
| `src/tools/categories.ts`, `icons.ts` | the category list and order; the named icon map |
| `src/components/Panel.tsx` | the editor chrome every tool is built from |
| `src/components/{Text,Dual,File,Generator}Tool.tsx` | the runners that render each contract |
| `src/components/ui/` | shadcn/ui primitives |
| `src/i18n/` | shell strings only (`tr.json`, `en.json`); tool copy lives in the tool |
| `src/app/[locale]/` | root layout, home page, `[tool]/page.tsx` — all prerendered |
| `src/app/globals.css` | every colour token, both themes, the category hues |
| `public/index.html` | sends `/` to a language; there is no server to do it |
| `scripts/smoke.mjs` | opens every tool in a real browser and presses its sample |
| `harness/` | the agent harness — the source every tool's config is generated from |
| `harness/protocols/` | the procedures that are only needed some of the time: orchestration, git, reporting |
| `verify/` | the verification ladder |
| `bin/harness` | the harness itself: sync, scope, note, hooks, doctor |

Every path under `src/` has an owning specialist. **`harness/`, `bin/` and
`verify/` belong to whoever is coordinating** — the main session, not a
specialist. A worker does not rewrite its own instructions mid-task; if a
specialist finds the harness wrong, that is a finding to report.

---

## Specialists

Nine roles carry the deep knowledge. Load the matching skill rather than
improvising, and delegate to the agent when the work is large enough to deserve
its own context.

| Role | Owns |
|---|---|
| `web-developer` | `src/` — Next.js, React, TypeScript, the tool contracts and the shell |
| `tool-author` | one new tool end to end: logic, tests, metadata, registration |
| `ui-ux-designer` | the chrome, the tokens, the category tints, layout in both themes |
| `review-manager` | correctness review of a diff; finds bugs, not style opinions |
| `test-manager` | the verification ladder, vitest design, the browser smoke run |
| `project-manager` | the README, the issue queue, and whether the rules still have gates |
| `accessibility-manager` | keyboard, screen reader, contrast, focus — cross-cutting |
| `performance-manager` | bundle size, lazy loading, main-thread work — cross-cutting |
| `privacy-manager` | the browser-only promise: what leaves the page, and what says so |

`review-manager` and `test-manager` are read-only by design: they investigate
broadly and report, they do not edit. `accessibility-manager`,
`performance-manager` and `privacy-manager` are cross-cutting — they own no
folder, are called in over whatever needs them, and hand a fix inside a tool
back to the writer who owns it. Give any of them a target and a question, not a
task list.

Four skills have no role of their own; the writers load them when the work
calls for it:

- **`add-tool`** — the order of operations for a new tool; `tool-author`'s
  skill, and the one to load for "add an X tool".
- **`localization`** — Turkish and English copy, the shell dictionaries versus
  a tool's `Localized`, which developer terms stay in English.
- **`networking`** — the few tools that call a third-party API: `network: true`,
  `trigger: "submit"`, CORS-only endpoints, failure copy.
- **`security`** — secrets in a tool (keys, tokens, passwords), WebCrypto, the
  shared link, rendering untrusted input.

And one note that is not a role: **deploys** are Cloudflare Pages building
`main` from Git (`npm run build` → `out/`). There is no deploy script and no
deploy workflow; what reaches `main` is what ships, which is why `verify/all.sh`
runs before a merge rather than after.

Load each the way you load any skill.
