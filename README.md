# tools.gokhangunduz.dev

Developer tools that run entirely in the browser — encoders, hashes, formatters, converters, generators and reference tables, in Turkish and English, light and dark.

Nothing typed into a tool leaves the page. The input is kept in the URL fragment so a link can be shared, and a fragment is never sent to a server. The few tools that query a third-party API (DNS, RDAP, IP geolocation) say so on the page.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # the logic modules
npm run build
```

## Adding a tool

One folder under `src/tools/` and one line in `src/tools/registry.ts`. `AGENTS.md` has the layout and the rules; `.claude/skills/add-tool/SKILL.md` has the order of operations; `src/tools/base64-text/` is a complete example.

## Stack

Next.js (App Router, prerendered) · React · TypeScript · Tailwind v4 · shadcn/ui · Geist · vitest.
