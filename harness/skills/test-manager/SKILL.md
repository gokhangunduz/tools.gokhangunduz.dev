---
name: test-manager
description: The verification ladder for tools.gokhangunduz.dev, vitest design for the logic modules, the browser smoke run over out/, and diagnosing a failing rung — type errors, prerender failures, hydration warnings, flaky smoke pages. Load before writing tests, running a rung, or investigating a failure.
---

# Test manager

You own verification: the ladder, the tests, and the diagnosis when something
fails. You do not edit application code — when a test reveals a bug, you report
it and someone else fixes it.

**Reasoning tier: high.** Running the ladder is mechanical; *diagnosis* is not.
A prerender failure names the page, not the line; a hydration warning names the
element, not the value that differed.

---

## The ladder

Run the cheapest rung that could fail. Every rung is `zsh verify/<rung>.sh`.

| Rung | Catches | Cost |
|---|---|---|
| `harness` | generated agent files that drifted from `harness/` | <1 s |
| `invariants` | a shell key in one of `tr.json`/`en.json` only or empty; a `Localized` with `tr` or `en` missing or empty in `src/`; a hex colour outside `globals.css` (allow-list: `verify/allowed-hex.txt`) | ~1 s |
| `scope` | a diff that spilled outside the declared scope (inert with none declared) | <1 s |
| `typecheck` | `tsc --noEmit` over the whole project | a few s |
| `quick` | the four above — what the `pre-commit` hook runs | seconds |
| `tests [pattern]` | vitest over `src/**/*.test.ts`; fails if zero tests ran | seconds |
| `lint` | eslint (zero warnings) and prettier `--check` over `src/` | about a minute |
| `build` | `next build` into `out/`; checks `index.html`, `tr.html`, `en.html` and one page per tool in each language | a minute or two |
| `smoke` | serves `out/` locally and runs `scripts/smoke.mjs`: every tool, both languages, Sample pressed, no console error, no error line, non-empty output | minutes |
| `all` | everything above in order; stamps the tree for the Stop hook | minutes |

### Rules that hold for every rung

- **Never weaken a check to make it pass.** Not a deleted test, a `.skip`, a
  loosened assertion, a line added to `verify/allowed-hex.txt` to silence a real
  colour, or a longer timeout to paper over a race. A failing rung is the
  answer.
- **A cheaper rung is not a substitute for a dearer one.** `typecheck` is not
  `build` — a page can type-check and still fail to prerender. `build` is not
  `smoke` — a page can prerender and still throw on hydration.
- **`smoke` needs a fresh `build`.** It serves whatever is in `out/`.
- **A dev server may be running.** `build` beside `next dev` is fine; do not kill
  a server you did not start.

---

## Writing a test that earns its runtime

Only the logic modules are tested (`vitest.config.ts` includes
`src/**/*.test.ts`); the components are thin wrappers and testing them would be
testing React. A good test here:

- **Tests a pure function** in `logic.ts` (or a contract helper in
  `text-tool.ts`, `file-tool.ts`, …).
- **Fails for exactly one reason**, named in `it("…")` for the case, not the
  method: `it("encodes UTF-8 rather than Latin-1")`.
- **Covers what a naive implementation gets wrong**: Turkish characters and
  emoji, empty input, input that must be rejected, a round-trip for an inverse,
  a size boundary (76-character wrap, 100 KB chunking).
- **Asserts on structure for errors**: `toThrow(ToolError)`, `error.at`,
  `error.field`, `error.detail.tr` containing the offending token. Asserting the
  whole translated sentence couples the test to copy that will improve.
- **Owns its fixtures.** No order dependence, no shared mutable state, no
  network, no `Date.now()` without a fixed input.

`src/tools/base64-text/logic.test.ts` is the reference.

### What not to test

- React components, layout, Tailwind classes.
- What TypeScript already guarantees.
- A library's own behaviour (that `js-yaml` parses YAML) — test *your* use of it.
- Four variations of one branch.

---

## Diagnosing

Read the *first* error. The rest are usually its shrapnel.

| Message | What it actually means |
|---|---|
| `Error occurred prerendering page "/tr/<id>"` | something in that tool's module graph throws at import or during server render — usually `window`/`document`/`localStorage` touched at module top level or in render |
| `Hydration failed because the server rendered text didn't match` | a value read during render differs between build and browser: time, randomness, locale, storage |
| `Page "/[locale]/[tool]" is missing "generateStaticParams()"` / a route skipped under `output: "export"` | a dynamic segment not enumerated, or an API the static export does not support |
| smoke: `output stayed empty after the sample` | the spec's option ids do not match what `run` reads, the Sample needs `sampleOptions`, or the run is async and slower than the wait |
| smoke: `error shown: …` on one language only | a `Localized` or `sampleOptions` that differs by language, or locale-dependent logic |
| smoke: `threw: page.goto: net::ERR_CONNECTION_REFUSED` | the static server did not start — read the server line in the rung output |
| `tests: vitest exited 0 but no test ran` | the pattern matched no file |

**Reproduce before you diagnose.** A smoke page that fails once and passes on
re-run is a flake — usually a fixed wait racing an async run or a network tool
that reached its API. Name it; do not retry until green.

---

## Reporting

```text
Ran: quick → pass · tests → 558 passed · build → pass · smoke → 1 of 60 failed
/en/json-yaml: output stayed empty after the sample
Cause: spec option "indent" renamed to "spaces" in spec.ts; run() still reads options.indent.
Fix (for whoever owns src/tools/json-yaml): read options.spaces in spec.ts:42.
```

Which rungs ran, what each printed, and for a failure: the exact message, the
real cause, and the smallest change that would fix it — for someone else to
make. Never present a rung you skipped as one that passed.
