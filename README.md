<div align="center">

# tools.gokhangunduz.dev

**Developer tools that run entirely in your browser.**

Encoders, hashes, formatters, converters and generators. English and Turkish, light and dark. No account, no ads, no tracking.

[**Open the site →**](https://tools.gokhangunduz.dev)

[![CI](https://github.com/gokhangunduz/tools.gokhangunduz.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/gokhangunduz/tools.gokhangunduz.dev/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/gokhangunduz/tools.gokhangunduz.dev)](https://github.com/gokhangunduz/tools.gokhangunduz.dev/releases)
[![License: MIT](https://img.shields.io/github/license/gokhangunduz/tools.gokhangunduz.dev)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D24-339933)](.node-version)

</div>

---

## Why this exists

Most online "paste your token here" tools send what you paste to a server you know nothing about. These don't. Every conversion is plain client-side code, so you can decode a production JWT or hash a secret without wondering where it went.

- **Private by construction.** Nothing you type leaves the page. There is no backend, no analytics, and no third-party script or font.
- **Fast to reach.** `⌘K` / `Ctrl K` opens a command palette that finds any tool by name or keyword.
- **Shareable.** Your input lives in the URL fragment, so a link reproduces exactly what you see. A fragment is never sent to a server.
- **Works offline.** After the first visit a service worker keeps the site available, so the tools open on a plane.
- **Bilingual.** Every string exists in English and Turkish.

## Tools

Thirty tools in seven categories. Each one links to the live page.

### JSON & data

| Tool | What it does |
|---|---|
| [Format code](https://tools.gokhangunduz.dev/en/format-code) | JS, TS, JSON, CSS, HTML, Markdown, YAML and GraphQL, with Prettier itself running in the browser. |
| [JSON ↔ CSV](https://tools.gokhangunduz.dev/en/json-csv) | Uses the header row as keys and types the values; comma, semicolon or tab. |
| [JSON diff](https://tools.gokhangunduz.dev/en/json-diff) | Compares structure, so key order and formatting are not changes; differences are listed by path. |
| [JSON to types](https://tools.gokhangunduz.dev/en/json-to-types) | Turns a JSON sample into a TypeScript interface, a Zod schema, a Go struct or JSON Schema. |
| [JSON tree viewer](https://tools.gokhangunduz.dev/en/json-viewer) | Shows a large JSON as a collapsible tree, with each row's JSONPath one click away. |
| [JSON ↔ YAML](https://tools.gokhangunduz.dev/en/json-yaml) | Converts both ways, reading YAML without turning `no`, `off` or `22:30` into something else. |
| [Format SQL](https://tools.gokhangunduz.dev/en/sql-format) | Turns a one-line query into something readable, with dialect-aware keywords. |

### Encode & decode

| Tool | What it does |
|---|---|
| [Base64](https://tools.gokhangunduz.dev/en/base64-text) | Text to Base64 and back. UTF-8 throughout, with the URL-safe alphabet. |
| [JWT decode / verify](https://tools.gokhangunduz.dev/en/jwt-decode) | Reads a token without any key and turns its timestamps into dates; verifies the signature if you give one. |
| [URL encode / decode](https://tools.gokhangunduz.dev/en/url-encode) | Percent-encoding, with the right scope for a query value or a whole URL. |
| [URL parser](https://tools.gokhangunduz.dev/en/url-parse) | Breaks a URL into its parts and lists the query parameters decoded. |

### Text

| Tool | What it does |
|---|---|
| [Convert case](https://tools.gokhangunduz.dev/en/case-convert) | camelCase, snake_case, kebab-case and the rest, with Turkish İ/ı handled correctly. |
| [Markdown editor](https://tools.gokhangunduz.dev/en/markdown-editor) | Type on the left, see it on the right. Tables, task lists and fenced code included. |
| [RegExp tester](https://tools.gokhangunduz.dev/en/regex-test) | Lists matches with their position and capture groups; replace and split are on the same page. |
| [Text diff](https://tools.gokhangunduz.dev/en/text-diff) | Compares two texts by line, word or character, and does not trip over CRLF. |

### Security & IDs

| Tool | What it does |
|---|---|
| [Hash text](https://tools.gokhangunduz.dev/en/hash-text) | MD5, SHA-1, SHA-256/384/512, SHA-3 and CRC32 side by side, checked against an expected hash. |
| [JWT generator](https://tools.gokhangunduz.dev/en/jwt-generate) | Signs a JSON payload with HS256/384/512, for producing a token to test against. |
| [Password generator](https://tools.gokhangunduz.dev/en/password) | Prints the entropy and the crack time beside it, with unbiased character selection. |
| [UUID / ULID generator](https://tools.gokhangunduz.dev/en/uuid) | v4, v7, ULID and Nano ID. v7 carries a timestamp, so it sorts. |

### Time

| Tool | What it does |
|---|---|
| [Cron explainer](https://tools.gokhangunduz.dev/en/cron) | Turns the expression into a sentence and lists the next runs in your time zone. |
| [Timestamp converter](https://tools.gokhangunduz.dev/en/timestamp) | Works out seconds from milliseconds on its own, then prints ISO, RFC, local and relative time. |
| [Time zone converter](https://tools.gokhangunduz.dev/en/timezone) | Reads your time in the zone you name, DST included, and shows it everywhere else. |

### Network

| Tool | What it does |
|---|---|
| [IPv4 CIDR calculator](https://tools.gokhangunduz.dev/en/cidr) | Network, broadcast, first and last host and usable host count, `/31` and `/32` included. |
| [DNS lookup](https://tools.gokhangunduz.dev/en/dns-lookup) ¹ | A, MX, TXT and the rest, from Cloudflare's DNS-over-HTTPS resolver. |
| [IP location and ASN](https://tools.gokhangunduz.dev/en/ip-geo) ¹ | An address's country, city, time zone and network. Leave it empty to see your own. |
| [WHOIS / RDAP lookup](https://tools.gokhangunduz.dev/en/rdap) ¹ | A domain's registrar, registration and expiry dates, nameservers and DNSSEC, over RDAP. |

### Image

| Tool | What it does |
|---|---|
| [EXIF editor](https://tools.gokhangunduz.dev/en/exif) | Reads, edits and writes a JPEG's EXIF fields, warns if it carries a location, and strips it all in one click. |
| [Image to Base64](https://tools.gokhangunduz.dev/en/image-base64) | Produces a data URI ready for CSS, HTML or JSX, and says how much larger it got. |
| [Convert and resize images](https://tools.gokhangunduz.dev/en/image-convert) | Converts to WebP, JPEG or PNG, caps the size, and reports the bytes saved. |
| [QR code generator](https://tools.gokhangunduz.dev/en/qr-generate) | Produces SVG, so it stays sharp in print and on screen, and shows the capacity. |

¹ **Needs the network.** These three can't be done in the browser alone, so they query a public API. The page says so, naming the service, before anything is sent. Every other tool makes no requests.

## Privacy model

| | |
|---|---|
| Where the work happens | In your browser, in plain JavaScript. There is no server to receive it. |
| Shared links | Input is stored after the `#` in the URL. Browsers never send the fragment to a server. |
| Secrets | Tools that handle keys or passwords keep them out of the shared link. |
| Third-party requests | Only the three tools marked above, and only when you press the button. |
| Third-party scripts | None. No analytics, no tag manager, no hosted fonts. |

Found a way for input to leave the page? That is the most serious kind of bug here. Please open an issue.

## Run it locally

Requires Node.js 24.

```bash
git clone https://github.com/gokhangunduz/tools.gokhangunduz.dev.git
cd tools.gokhangunduz.dev
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Unit tests for every tool's logic (Vitest) |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier |
| `npm run build` | Static export into `out/` |
| `npm run verify` | Everything: invariants, types, tests, lint, build, and a browser smoke run over every tool in both languages |

## How it's built

**Next.js 16** (App Router, static export) · **React 19** · **TypeScript** (strict) · **Tailwind CSS v4** · **shadcn/ui** · **Geist** · **Vitest** · **Playwright**

The site is exported to plain HTML and deployed on Cloudflare Pages straight from this repository. There is no server, so a feature that needs one doesn't exist.

```
src/
  app/          routes, layout and global styles
  components/   shared editor chrome and the runners every tool is built from
  i18n/         interface strings (en.json, tr.json)
  tools/        one folder per tool, plus the registry
verify/         the checks behind `npm run verify`
scripts/        the browser smoke test
```

Each tool is a folder under `src/tools/<id>/`:

| File | Role |
|---|---|
| `logic.ts` | The conversion, as a pure function. No React, no DOM. |
| `logic.test.ts` | Tests: non-ASCII input, empty input, rejected input, round trips. |
| `spec.ts` / `Tool.tsx` | The interface, built from the shared panels. |
| `meta.ts` | Name, description, keywords and category, in both languages. |

The home page, search, command palette, sidebar and sitemap are all generated from one registry, `src/tools/registry.ts`, so adding a tool is one folder and one line.

## Contributing

Bug reports, tool ideas and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), which covers the ground rules and how to add a tool. Questions and ideas are welcome in [Discussions](https://github.com/gokhangunduz/tools.gokhangunduz.dev/discussions).

## License

[MIT](LICENSE) © 2025–2026 Gökhan Gündüz
