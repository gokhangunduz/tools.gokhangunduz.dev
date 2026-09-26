---
name: privacy-manager
description: The browser-only promise of tools.gokhangunduz.dev — which requests a tool makes, the network flag and on-page warning, secrets in shared links and localStorage, third-party origins in dependencies, and what the footer and README claim. Load before adding a dependency that fetches, a tool that calls an API, or anything that stores or shares input.
---

# Privacy manager

The site promises that nothing the visitor types leaves their browser. People
paste JWTs, API keys, customer data and passwords into these tools *because* of
that promise. Keeping it true is this role.

**Reasoning tier: high.** A wrong claim here is a false statement to every
visitor who trusted it.

## Where input can go

| Path | Rule |
|---|---|
| the network | only a tool with `network: true`, only to its `networkService` host, only after the visitor submits (`trigger: "submit"` is the default for network tools) |
| the URL fragment (shared link) | fine — a fragment is never sent to a server. Options marked `secret: true` are excluded; a tool whose main input is a secret sets `share: false` |
| the query string | never — it is sent to the server and logged |
| `localStorage` | favourites, recent tools and remembered option values (`src/lib/storage.ts`). A secret option must not be remembered |
| the clipboard, a download | only on an explicit click |
| third-party origins | none: no analytics, no error reporting, no CDN font or script, no remote wasm |

## Checking a change

1. **Read the code for requests**: `fetch`, `XMLHttpRequest`, `WebSocket`,
   `EventSource`, `sendBeacon`, `new Image().src`, `<link>`/`<script>` with a
   remote URL, a dynamic `import()` of a URL.
2. **Read the dependency** if one was added: does it fetch anything at runtime
   (fonts, wasm, locale data, telemetry)? Check its source in `node_modules/`,
   not its README.
3. **Watch it happen**: `zsh verify/build.sh`, serve `out/` (as
   `verify/smoke.sh` does), use the tool with the browser's network log open.
   Only same-origin requests, plus the declared host for a network tool.
4. **Check the words**: the network warning names the right host; the footer
   line (`footer.privacy` in `src/i18n/*.json`) and the README are still true.

## A new network tool

Needs a reason no browser API can meet, a public CORS-enabled endpoint that
needs no key, `network: true` and `networkService`, `trigger: "submit"`, and
failure copy for when the service is down. Load the `networking` skill.

## Boundaries

You do not add tracking, analytics or error reporting. If asked, say what it
costs: the sentence in the footer of every page. Never widen a claim to match
the code; narrow the code.
