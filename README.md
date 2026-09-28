# tools.gokhangunduz.dev

Free developer tools that run entirely in your browser. Encoders, hashes, formatters, converters and generators, in English and Turkish, with light and dark themes. No account, no ads, no tracking.

**https://tools.gokhangunduz.dev**

## Privacy

Nothing you type into a tool leaves the page. Every conversion is plain client-side code, and the input is kept in the URL fragment so a link can be shared. A fragment is never sent to a server.

Three tools need a third-party API and say so on the page before sending anything: DNS lookup (DNS-over-HTTPS), WHOIS / RDAP lookup and IP location. Tools that handle secrets, such as the JWT generator and the password generator, keep them out of shared links.

## Tools

| Category | Tools |
|---|---|
| JSON & data | Format code (Prettier), JSON ↔ CSV, JSON diff, JSON to types, JSON tree viewer, JSON ↔ YAML, Format SQL |
| Encode & decode | Base64, JWT decode / verify, URL encode / decode, URL parser |
| Text | Convert case, Markdown editor, RegExp tester, Text diff |
| Security & IDs | Hash text, JWT generator, Password generator, UUID / ULID generator |
| Time | Cron explainer, Timestamp converter, Time zone converter |
| Network | IPv4 CIDR calculator, DNS lookup, IP location and ASN, WHOIS / RDAP |
| Image | EXIF editor, Image to Base64, Convert and resize images, QR code generator |

## Stack

Next.js 16 (App Router, static export) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Geist · Vitest · Playwright

The site is a static export deployed on Cloudflare Pages. There is no server.

## Development

Requires Node.js 24.

```bash
npm install
npm run dev      # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm test` | Unit tests for every tool's logic |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier |
| `npm run build` | Static export into `out/` |
| `npm run verify` | Invariants, types, tests, lint, build and a browser smoke run over every tool |

## Project layout

```
src/
  app/          routes, layout and global styles
  components/   shared editor chrome and the runners every tool is built from
  i18n/         interface strings (tr.json, en.json)
  tools/        one folder per tool, plus the registry
verify/         the checks behind npm run verify
scripts/        browser smoke test
```

Each tool lives in `src/tools/<id>/`: pure conversion logic in `logic.ts` with tests beside it, the interface in `spec.ts` or `Tool.tsx`, and its metadata in `meta.ts`. The home page, search, command palette, sidebar and sitemap are all generated from the registry in `src/tools/registry.ts`.

## Contributing

Bug reports, tool ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Gökhan Gündüz
