# The defect taxonomy

Read this when you are looking, not before. The order is roughly the cost of the
defect reaching a person multiplied by how likely it is to survive to that point.

### 1. Input leaving the browser

The most expensive class: the site's only promise, broken silently.

| Pattern | Why it matters |
|---|---|
| a `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon` or `<img src>` built from input in a tool without `network: true` | the page says the input stays local, and it does not |
| a network tool that requests a host other than its `networkService` | the warning names the wrong party |
| an option holding a key, password or token without `secret: true` | it is written into the shared link and into `localStorage` |
| a tool whose main input is a secret without `share: false` | the secret goes into the URL fragment, into browser history and into every link copied |
| input moved from the fragment into `?query` | a query string *is* sent to the server, and logged |
| a dependency that loads a font, wasm file or script from a CDN, or reports errors | a third-party request on every use |

### 2. Wrong output on real input

- Text treated as Latin-1: `btoa`/`atob` on non-ASCII, `charCodeAt` where code
  points are meant, `.length` where grapheme or byte count is meant, `split("")`
  over an emoji.
- A conversion that "succeeds" on invalid input instead of throwing a
  `ToolError` — the visitor copies garbage believing it is correct.
- Number precision: a 64-bit integer through `Number`, a timestamp in seconds
  read as milliseconds, a time zone assumed to be the build machine's.
- An inverse that does not round-trip (`decode(encode(x)) !== x`).
- Very large input: `String.fromCharCode(...bytes)` over ~100 KB overflows the
  argument limit; a regex with catastrophic backtracking on the main thread.

### 3. React lifecycle

- **Hydration mismatch** — anything read during render that differs between
  build and browser: `Date.now()`, `new Date()` formatted, `Math.random()`,
  `crypto.randomUUID()`, `window`, `localStorage`, `navigator.language`.
- **Stale async result** — a slow run resolving after a newer one and
  overwriting it.
- **Effect without cleanup** — a worker never terminated, an object URL never
  revoked, a listener never removed; each grows with every visit.
- **Effect with a stale closure** — a handler registered once that reads the
  first render's options forever.

### 4. Broken invariants

These are this repository's specific ways of failing. Check them against
`AGENTS.md`; each is there because it has already cost someone.

- A string in one language only, or empty in one.
- A hex or `rgb()` colour in a component, or a `dark:` colour picked by hand.
- A raw exception message shown to the visitor instead of a `ToolError`.
- A heavy import at the top of `meta.ts`, or a computed `import()` path in
  `components.ts`.
- A renamed tool `id` — every saved link to the old one now 404s.
- A tool page that scrolls instead of its panes.
- Anything that needs a server: a route handler, a server action, `proxy.ts`.
- A check weakened, a test deleted, or a suite skipped to turn a run green.
  **This one is not a style question.** Look at what the check was catching
  before you accept that it was noise.

### 5. Wrong logic

Off-by-one, inverted condition, an early return that skips cleanup, a `catch`
that swallows the error and returns an empty string, a `switch` that falls
through to the wrong direction.
