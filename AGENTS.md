<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# tools.gokhangunduz.dev

A public collection of developer tools — encoders, hashes, formatters, converters, generators, reference tables. Turkish and English, light and dark, no account, no ads.

**The promise the site makes: nothing the visitor types leaves their browser.** Every tool is pure client-side work. The handful that genuinely need a third-party API (DNS-over-HTTPS, RDAP, IP geolocation) set `network: true` in their metadata, which prints a warning on the page. Do not add a server action, an API route or a proxy to make a tool "work better"; if it cannot be done in the browser, it does not ship.

## Layout

| Path | What lives there |
|---|---|
| `src/tools/registry.ts` | The list of every tool. One line per tool; nothing else enumerates them. |
| `src/tools/components.ts` | Lazy `import()` per tool, so listing tools never loads their code. |
| `src/tools/<id>/` | `meta.ts` (registry entry), `spec.ts` or `Tool.tsx` (the UI), `logic.ts` + `logic.test.ts` (the pure work). |
| `src/tools/text-tool.ts` | The "text in, text out" contract most tools are declared with. |
| `src/components/TextTool.tsx` | Renders that contract: panes, options, errors, copy, download, shared link. |
| `src/i18n/` | Shell strings only (`tr.json`, `en.json`, both type-checked against each other). Tool copy lives in the tool's `meta.ts`. |
| `src/app/[locale]/` | Root layout, home page, `[tool]/page.tsx`. All prerendered. |
| `src/proxy.ts` | Sends `/` to a language. Nothing else is proxied. |

## Rules

- **Tailwind v4 + shadcn/ui.** Need a component? `npx shadcn@latest add <name>`, then point its imports at `@/lib/utils`. Do not add a second component library.
- The design language is **Vercel / Geist**: near-monochrome, hairline borders instead of shadows, small radii, colour only where it carries meaning. When in doubt, remove decoration rather than add it. The page is the tool; chrome around it is noise.
- Colours always come from the tokens in `src/app/globals.css` (`bg-card`, `text-muted-foreground`, `border-border`, `text-destructive`, `text-success`). Never hardcode a hex value. Both themes are first-class: check a change in light *and* dark.
- Every string is in both languages. Shell text goes through `t(locale, key)`; tool text is a `Localized` (`{ tr, en }`) in the tool's own files. A string that exists in one language only is a bug.
- The conversion itself lives in `logic.ts` as pure functions with no React and no DOM, and is unit-tested with vitest. The component is a wrapper. If a tool has no test, it is not done.
- Errors shown to the user are `ToolError` with both languages. Never surface a raw exception message.
- Anything heavier than a few milliseconds (a wasm parser, a large file) loads lazily inside the tool and runs off the main thread. It must never end up in the shared bundle.
- Icons are named (`icon: "binary"`), resolved through `src/tools/icons.ts`. A component cannot cross the server/client boundary, and tool metadata does.
- Numbers that get compared by eye take the `.tabular` utility.
- No comments in code; only a single line for a genuinely non-obvious decision.

## Commands

```
npm run dev     # next dev
npm run build   # must pass before anything is called done
npm run lint
npm test        # vitest, the logic modules
```
