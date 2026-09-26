---
name: networking
description: The few tools on tools.gokhangunduz.dev that call a third-party API (DNS-over-HTTPS, RDAP, IP geolocation) — when one is justified, network and networkService metadata, trigger submit, CORS-only public endpoints, timeouts, failure copy, and testing without the network. Load before adding or changing any request a tool makes.
---

# Networking

Almost every tool here makes no request at all. A network tool is the exception
that has to earn its place, because it is the one place the site's promise has
a hole in it, and the page has to say so.

## When a request is justified

Only when the answer genuinely lives elsewhere — the DNS records of a domain,
the registration of a name, where an IP is — *and* no browser API can produce
it. "A library would be big" is not a reason; lazy-load the library.

## The contract

- `meta.ts`: `network: true` and `networkService: "<host>"`. The page prints a
  warning naming that host.
- `spec.ts`: `trigger: "submit"` (the default for network tools) — nothing is
  sent while the visitor is still typing. `runOnEmpty: true` only for a lookup
  of the visitor's own data (their IP), and only after they asked.
- The endpoint is **public, keyless and CORS-enabled**. There is no server to
  hold a key or proxy a request; a key in client code is a published key.
- Only the one host. Following a link in a response to another host is a second
  service the page does not name.

## Writing the request

- Keep parsing pure: `logic.ts` exports `parseResponse(json)` (tested with
  fixtures captured from the real service) separately from the `fetch`.
- `AbortSignal.timeout(…)` on every request; a hung request is a hung tool.
- Every failure is a `ToolError` in both languages that says what the visitor
  can do: not found, rate-limited, the service is down, the input is not a
  domain/IP. Never show the response body or `error.message` raw.
- `cache: "no-store"` only when freshness matters; otherwise let the browser
  cache.

## Testing

- Unit tests cover the input validation and the response parser with recorded
  fixtures. No test touches the network.
- `scripts/smoke.mjs` opens network tools (the `NETWORK` set) and checks for
  errors but does not require output, because a failing third-party service is
  not a bug here. A new network tool is added to that set.
- Before handing back, use it once for real from `out/` with the network log
  open: one request, to the declared host, after submit.
