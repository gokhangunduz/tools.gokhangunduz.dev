---
name: add-tool
description: The standard way to add a tool to tools.gokhangunduz.dev — slug, logic, tests, spec or component, metadata, icon, registration, verification. Load for "add an X tool", "add X to the site".
---

# Adding a tool

A tool is one folder under `src/tools/` plus one line each in the registry and
the component map. `src/tools/base64-text/` is the complete reference shape;
`src/tools/text-tool.ts` is the contract most tools are declared with.

Declare the scope first:

```sh
bin/harness scope "add the <name> tool" src/tools/<slug> src/tools/registry.ts src/tools/components.ts src/tools/icons.ts
```

## In order

1. **Pick the slug.** Lowercase, hyphenated, English, stable — it is the URL
   people share (`base64-text`, `jwt-decode`, `json-yaml`). It never changes
   afterwards. Check `registry.ts` that no existing tool already does this job;
   a second tool for the same job is a search result that confuses.

2. **`src/tools/<slug>/logic.ts`** — the actual work, as pure functions. No
   React, no DOM, no `window`, no `document`. Throw `ToolError` (from
   `../text-tool`) with a `{ tr, en }` message for anything the visitor did
   wrong — with `at` (1-based line/column, `positionAt()` computes it) when the
   error points into the input, `field` when an option is wrong, and `action`
   when there is a one-click fix (another direction, other option values). Let a
   genuine bug throw normally.

3. **`src/tools/<slug>/logic.test.ts`** — vitest. Cover what a naive
   implementation gets wrong: Turkish characters and emoji (UTF-8, not
   Latin-1), empty input, input that must be rejected (assert it throws
   `ToolError`, and where it points), very long input if the tool chunks, and
   the round-trip if the tool has an inverse. A test that only asserts "hello"
   works proves nothing.

4. **Pick the contract** — a spec is data; the runner does the chrome, the
   debounce, copy, download, the shared link and the keyboard shortcuts:

   | Shape | Contract | Runner |
   |---|---|---|
   | text in, text out (with directions and options) | `TextToolSpec` in `text-tool.ts` | `TextTool` |
   | two inputs, one output (a diff, a comparison) | `DualToolSpec` in `dual-tool.ts` | `DualTool` |
   | a file in, text or a file out | `FileToolSpec` in `file-tool.ts` | `FileTool` |
   | nothing in, generated values out | `GeneratorSpec` in `generator-tool.ts` | `GeneratorTool` |

   Put the spec in `spec.ts`. Useful `TextToolSpec` features before you reach
   for a custom UI: `directions` with `sample`/`sampleOptions`/`placeholder`,
   `options` (`switch`, `select`, `text` with `primary`/`sensitive`/`secret`),
   `inverse` (the output becomes the next input), `input: "line"` for a
   one-line value, `code` for a gutter and no wrap, `preview: "svg"`,
   `acceptFile` for dropping a text file, `headline`/`footnote`/`hint` per
   direction, rows and groups in a `TextResult`, `share: false` for a tool whose
   input is a secret, `trigger: "submit"` and `runOnEmpty` for network tools,
   `debounce` for slow work.

5. **`src/tools/<slug>/Tool.tsx`** — `"use client"`, its only prop `locale`.
   Either a few lines wrapping the runner with the spec and `toolId`, or — when
   no contract fits (a live table, an editor) — a bespoke component built from
   `src/components/Panel.tsx` (`Frame`, `Split`, `Pane`, `PaneFooter`,
   `PaneButton`, `PaneTextarea`, `PaneError`, `KeyValueList`, `Segmented`).
   Never from scratch: the copy button stays where it is on every other tool,
   and the page must not scroll — the panes do.

6. **`src/tools/<slug>/meta.ts`** — a `ToolMeta` (`src/tools/types.ts`):
   - `id` — the slug.
   - `category` — one of `encode`, `data`, `text`, `crypto`, `time`,
     `network`, `image` (`src/tools/categories.ts`). It decides the tint.
   - `icon` — a key of `ICONS` in `src/tools/icons.ts`. Pick one that says what
     this tool does; if lucide has a better one than the map holds, add it
     there (import it, add the key).
   - `name`, `blurb` — `{ tr, en }`. The blurb is one line; it is the card text
     and the meta description.
   - `keywords` — `{ tr: [...], en: [...] }`: what someone types *instead of*
     the name, in either language, including the other language's word. This
     is most of how a tool gets found.
   - `network: true` and `networkService: "<host>"` only if it calls a
     third-party API — which needs a reason, and the `networking` skill.
   - `weight` only to break a search tie, set in `registry.ts`, not here.

   Nothing heavy is imported at the top of `meta.ts`: the metadata of every tool
   is loaded by the home page and the command palette at once.

7. **Register it.** In `src/tools/registry.ts`, import the meta and add it to
   `TOOLS`. In `src/tools/components.ts`, a literal
   `"<slug>": dynamic(() => import("./<slug>/Tool"))` — a computed path would
   bundle every tool together.

8. **Copy.** Every visible string in both languages. Turkish keeps the English
   developer terms a Turkish developer uses (*encode*, *decode*, *hash*,
   *token*, *payload*, *regex*) inside a Turkish sentence; see the
   `localization` skill.

9. **Check it.**

   ```sh
   zsh verify/tests.sh <slug>     # the logic
   zsh verify/quick.sh            # types, both languages, colours, generated files, scope
   zsh verify/build.sh            # the page prerenders in /tr and /en
   zsh verify/smoke.sh            # Sample produces output, no console error, in both languages
   ```

   Then look at the page in Turkish and English, light and dark, at phone and
   desktop width. The smoke run treats a file-input tool and a network tool
   specially (`FILE_INPUT`, `NETWORK` in `scripts/smoke.mjs`); a new tool of
   either kind needs its id added there, which is a change to report, not to
   slip in.

10. `bin/harness done`.

## Heavy work

A parser, a wasm module, a large table: never at the top of `meta.ts`, which
every page loads. A top-level import in `logic.ts` or `spec.ts` lands in the
tool's own chunk — fine for a small library, wrong for a large one that only one
direction or one option needs; import that one with `await import()` inside an
async `run`. Work that can take longer
than a frame on realistic input runs in a worker — `json-viewer/worker.ts` and
`regex-test/worker.ts` are the pattern.
