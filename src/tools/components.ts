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
};
