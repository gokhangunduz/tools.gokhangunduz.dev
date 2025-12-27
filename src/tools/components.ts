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
 */
export const TOOL_COMPONENTS: Record<
  string,
  ComponentType<ToolComponentProps>
> = {
  "base64-text": dynamic(() => import("./base64-text/Tool")),
};
