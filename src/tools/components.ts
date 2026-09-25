import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Locale } from "@/i18n";

export type ToolComponentProps = { locale: Locale };

/**
 * The lazy half of the registry.
 *
 * Kept apart from `registry.ts` so that listing tools — which the home page,
 * the palette and the sitemap all do — never pulls a single tool's code, let
 * alone the parsers and wasm modules some of them carry. The literal
 * `import()` calls are what let the bundler split them; a computed path would
 * defeat that and bundle every tool into one chunk.
 *
 * Each entry points at a `Tool.tsx` rather than at a factory call, because
 * this map is read on the server and a client component can only be
 * referenced from there, never invoked.
 */
export const TOOL_COMPONENTS: Record<
  string,
  ComponentType<ToolComponentProps>
> = {
  "base64-text": dynamic(() => import("./base64-text/Tool")),
  "url-encode": dynamic(() => import("./url-encode/Tool")),
  "url-parse": dynamic(() => import("./url-parse/Tool")),
  "html-entity": dynamic(() => import("./html-entity/Tool")),
  "unicode-escape": dynamic(() => import("./unicode-escape/Tool")),
  "hex-text": dynamic(() => import("./hex-text/Tool")),
  "binary-text": dynamic(() => import("./binary-text/Tool")),
  gzip: dynamic(() => import("./gzip/Tool")),
  "hash-text": dynamic(() => import("./hash-text/Tool")),
  hmac: dynamic(() => import("./hmac/Tool")),
  bcrypt: dynamic(() => import("./bcrypt/Tool")),
  aes: dynamic(() => import("./aes/Tool")),
  "jwt-decode": dynamic(() => import("./jwt-decode/Tool")),
  "jwt-generate": dynamic(() => import("./jwt-generate/Tool")),
  "format-code": dynamic(() => import("./format-code/Tool")),
  "sql-format": dynamic(() => import("./sql-format/Tool")),
  "xml-format": dynamic(() => import("./xml-format/Tool")),
  minify: dynamic(() => import("./minify/Tool")),
  "json-yaml": dynamic(() => import("./json-yaml/Tool")),
  "json-toml": dynamic(() => import("./json-toml/Tool")),
  "json-xml": dynamic(() => import("./json-xml/Tool")),
  "json-csv": dynamic(() => import("./json-csv/Tool")),
  "json-to-types": dynamic(() => import("./json-to-types/Tool")),
  "markdown-html": dynamic(() => import("./markdown-html/Tool")),
  "html-jsx": dynamic(() => import("./html-jsx/Tool")),
  "curl-fetch": dynamic(() => import("./curl-fetch/Tool")),
  "docker-run-compose": dynamic(() => import("./docker-run-compose/Tool")),
  "env-json": dynamic(() => import("./env-json/Tool")),
  "case-convert": dynamic(() => import("./case-convert/Tool")),
  slugify: dynamic(() => import("./slugify/Tool")),
  "text-lines": dynamic(() => import("./text-lines/Tool")),
  "text-stats": dynamic(() => import("./text-stats/Tool")),
  "text-diff": dynamic(() => import("./text-diff/Tool")),
  "json-diff": dynamic(() => import("./json-diff/Tool")),
  "list-compare": dynamic(() => import("./list-compare/Tool")),
  "regex-test": dynamic(() => import("./regex-test/Tool")),
  jsonpath: dynamic(() => import("./jsonpath/Tool")),
  validate: dynamic(() => import("./validate/Tool")),
  "json-schema-validate": dynamic(() => import("./json-schema-validate/Tool")),
  timestamp: dynamic(() => import("./timestamp/Tool")),
  cron: dynamic(() => import("./cron/Tool")),
  duration: dynamic(() => import("./duration/Tool")),
  timezone: dynamic(() => import("./timezone/Tool")),
  "number-base": dynamic(() => import("./number-base/Tool")),
  bitwise: dynamic(() => import("./bitwise/Tool")),
  ieee754: dynamic(() => import("./ieee754/Tool")),
  "byte-size": dynamic(() => import("./byte-size/Tool")),
  chmod: dynamic(() => import("./chmod/Tool")),
  semver: dynamic(() => import("./semver/Tool")),
};
