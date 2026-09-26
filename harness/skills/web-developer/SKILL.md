---
name: web-developer
description: Writing and changing the site's code — Next.js 16 App Router with a static export, React 19 client components, strict TypeScript, the four tool contracts and their runners, the i18n shell. Load before feature work, a refactor, a type error or a build failure under src/.
---

# Web developer

The site is a folder of static files. Next.js renders every page at build time
into `out/`, Cloudflare Pages serves the folder, and everything a tool does
happens in the visitor's browser. Most mistakes here are code that works under
`next dev` and has nothing to run on in production.

**Reasoning tier: high.** The Next.js version here is newer than most training
data. A confident wrong assumption about an API costs more than reading the
guide.

## Read the guide first

`node_modules/next/dist/docs/` holds the documentation for the installed
version. Before using a Next.js API that is not already used in this repository,
read its page there. Heed deprecation notices — `middleware` became `proxy`,
caching and `params` semantics have moved between majors, and what you remember
may be two versions old.

## The static export

`next.config.ts` sets `output: "export"`. Consequences:

| Not available in production | Use instead |
|---|---|
| Route handlers (`app/**/route.ts`) other than static metadata routes | nothing — the work belongs in the browser |
| Server actions, `cookies()`, `headers()`, `draftMode()` | client state, the URL fragment, `localStorage` |
| Middleware / `proxy.ts` | `public/index.html` picks the language for `/` |
| Dynamic routes without `generateStaticParams` | every `[locale]` and `[tool]` is enumerated from `LOCALES` and `TOOLS` |
| `next/image` optimisation | plain `<img>` or `unoptimized` |
| ISR / revalidation | a new deploy |

`sitemap.ts`, `robots.ts` and `manifest.ts` are static metadata routes and are
fine. If `verify/build.sh` passes and `out/` holds the page, it exists; if the
build had to skip it, it does not.

## Where code goes

- **`logic.ts`** — pure functions, no React, no DOM. This is what is tested.
- **`spec.ts`** — data: a `TextToolSpec`, `DualToolSpec`, `FileToolSpec` or
  `GeneratorSpec` that points at the logic.
- **`Tool.tsx`** — `"use client"`, props `{ locale }`, a thin wrapper over a
  runner or a bespoke component built from `Panel.tsx`.
- **`meta.ts`** — a `ToolMeta`, serialisable, nothing heavy imported.
- **`src/components/`** — the shell and the runners. A change to a runner
  changes every tool that uses it: check them all (`grep -l <Runner>
  src/tools/*/Tool.tsx`) and run the smoke rung.
- **`src/lib/`** — small shared helpers (clipboard, storage, share links,
  theme). Keep them free of tool knowledge.

Extend a contract (a new field on `TextToolSpec`) only when a second tool needs
the same thing; otherwise the tool gets its own component.

## React on this site

- **Server by default, client where it must be.** Pages and layouts are server
  components; every tool is a client component loaded through
  `components.ts`. A component cannot cross that boundary as a prop; tool
  metadata can, which is why icons are names.
- **No hydration mismatches.** Nothing read during render may differ between
  the build and the browser: no `Date.now()`, `Math.random()`, `window`,
  `localStorage` or locale-dependent formatting of "now" in render. Read them in
  an effect, or through `useSyncExternalStore` with a server snapshot.
- **Async results can arrive out of order.** A run that resolves after a newer
  one must not overwrite it; the runners guard this — a bespoke component must
  too.
- **Effects clean up.** Workers are terminated, object URLs revoked, listeners
  removed.

## TypeScript

Strict, with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`. A
parameter kept for its position starts with `_`. Never silence a diagnostic
with `any`, `@ts-ignore` or an `eslint-disable` — fix the type.

## Strings and errors

- Shell text: `t(locale, "key.path")`, keys in both `src/i18n/tr.json` and
  `en.json` (`en.json` is type-checked against `tr.json`'s shape).
- Tool text: a `Localized` (`{ tr, en }`) in the tool's files; `pick(locale,
  value)` renders it. A block of component copy is a `const COPY = { … }
  satisfies Record<string, Localized>`.
- Errors for the visitor: `ToolError` from `src/tools/text-tool.ts`. Never show
  `error.message` from a library.

## Dependencies

Before adding one: can twenty lines do it? Does it run in the browser without
fetching anything (fonts, wasm, telemetry)? Is it tree-shakable, and will it be
imported only by the tool that needs it? Say the answers in the change.

## Verifying

```sh
zsh verify/quick.sh     # types, both languages, colours, generated files, scope
zsh verify/tests.sh     # the logic
zsh verify/lint.sh      # eslint + prettier
zsh verify/build.sh     # every page prerenders into out/
zsh verify/smoke.sh     # every tool in a real browser over out/
```

Then the page itself, in both languages and both themes.
