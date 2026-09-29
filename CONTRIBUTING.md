# Contributing

Thanks for helping. Bug reports, tool ideas and pull requests are all welcome.

## Ground rules

- **Nothing a visitor types may leave the browser.** No API routes, no server actions, no analytics, no third-party scripts or fonts. A tool that genuinely needs a third-party API sets `network: true` and names the host in `networkService`, which shows a warning on the page.
- **Every string exists in English and Turkish.** Interface text goes in `src/i18n/en.json` and `tr.json`; a tool's own text is a `{ tr, en }` pair in its files.
- **Colours come from the tokens** in `src/app/globals.css`. No hex values in components. Both themes must work.
- **The work is a pure function with tests.** A tool's conversion lives in `logic.ts` with `logic.test.ts` beside it. Cover non-ASCII input, empty input, input that must be rejected, and the round trip if there is an inverse.

## Adding a tool

1. Create `src/tools/<id>/` with `logic.ts`, `logic.test.ts`, `meta.ts` and a `spec.ts` or `Tool.tsx`. `src/tools/base64-text/` is a complete example.
2. Add one line to `src/tools/registry.ts` and one lazy `import()` to `src/tools/components.ts`.
3. Add the icon to `src/tools/icons.ts` if it is missing.

A tool's `id` is its URL and must not change once shipped.

## Before you open a pull request

```bash
npm run verify
```

This runs the invariants, type check, tests, lint, the static build and a browser smoke test over every tool. Pull requests should stay focused on one change.

## Commit messages

`<type>(<scope>): <subject>`, in the imperative, for example `feat(tools): add the xml formatter`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
