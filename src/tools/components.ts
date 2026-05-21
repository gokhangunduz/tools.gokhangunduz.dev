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
  "hash-text": dynamic(() => import("./hash-text/Tool")),
  "jwt-decode": dynamic(() => import("./jwt-decode/Tool")),
  "jwt-generate": dynamic(() => import("./jwt-generate/Tool")),
  "format-code": dynamic(() => import("./format-code/Tool")),
  "sql-format": dynamic(() => import("./sql-format/Tool")),
  "json-yaml": dynamic(() => import("./json-yaml/Tool")),
  "json-csv": dynamic(() => import("./json-csv/Tool")),
  "json-to-types": dynamic(() => import("./json-to-types/Tool")),
  "case-convert": dynamic(() => import("./case-convert/Tool")),
  "text-diff": dynamic(() => import("./text-diff/Tool")),
  "json-diff": dynamic(() => import("./json-diff/Tool")),
  "regex-test": dynamic(() => import("./regex-test/Tool")),
  timestamp: dynamic(() => import("./timestamp/Tool")),
  cron: dynamic(() => import("./cron/Tool")),
  timezone: dynamic(() => import("./timezone/Tool")),
  uuid: dynamic(() => import("./uuid/Tool")),
  password: dynamic(() => import("./password/Tool")),
  cidr: dynamic(() => import("./cidr/Tool")),
  "dns-lookup": dynamic(() => import("./dns-lookup/Tool")),
  rdap: dynamic(() => import("./rdap/Tool")),
  "ip-geo": dynamic(() => import("./ip-geo/Tool")),
  "image-convert": dynamic(() => import("./image-convert/Tool")),
  exif: dynamic(() => import("./exif/Tool")),
  "image-base64": dynamic(() => import("./image-base64/Tool")),
  "qr-generate": dynamic(() => import("./qr-generate/Tool")),
  "json-viewer": dynamic(() => import("./json-viewer/Tool")),
  "markdown-editor": dynamic(() => import("./markdown-editor/Tool")),
};
