---
name: add-tool
description: The standard way to add a tool to tools.gokhangunduz.dev. Use for "add an X tool", "add X to the site".
---

A tool is one folder under `src/tools/` plus one line in the registry. In order:

1. **Pick the slug.** Lowercase, hyphenated, English, stable — it is the URL people share (`base64-text`, `jwt-decode`, `cron-builder`). It never changes afterwards.

2. **`src/tools/<slug>/logic.ts`** — the actual work, as pure functions. No React, no DOM, no `window`. Throw `ToolError` (from `../text-tool`) with a `{ tr, en }` message for anything the user did wrong; let a genuine bug throw normally.

3. **`src/tools/<slug>/logic.test.ts`** — vitest, run with `npm test`. Cover what a naive implementation gets wrong: non-ASCII input, empty input, input that must be rejected, and a round-trip if the tool has an inverse.

4. **`src/tools/<slug>/spec.ts`** — for a text-in/text-out tool, a `TextToolSpec`: its directions (encode/decode, and their samples and placeholders) and its options. Skip this file if the tool needs its own UI (two inputs, a file drop, a live table) and write that component instead.

5. **`src/tools/<slug>/Tool.tsx`** — `"use client"`, and either six lines wrapping `TextTool` with the spec, or the bespoke component. Its only prop is `locale`.

6. **`src/tools/<slug>/meta.ts`** — id, category, `icon` (a name from `src/tools/icons.ts`; add one there if it is missing), `name`, `blurb` and `keywords` in both languages, and `related` slugs. Keywords are what someone types *instead of* the name, in either language — this is most of how the tool gets found.

7. **Register it** in `src/tools/registry.ts` (import the meta, add it to `TOOLS`) and in `src/tools/components.ts` (a literal `dynamic(() => import("./<slug>/Tool"))` — a computed path would bundle every tool together).

8. **Check it**: `npm test`, `npm run build`, then the page itself in both languages and both themes.

Reference: `src/tools/base64-text/` is the complete shape, and `src/tools/text-tool.ts` is the contract.

Anything heavy (a wasm module, a parser, a large table) is imported lazily *inside* the tool, never at the top of `meta.ts` — the metadata is loaded by the home page and the command palette for every tool at once.
