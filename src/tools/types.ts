import type { IconName } from "./icons";
import type { Locale, Localized } from "@/i18n";

export type CategoryId =
  | "encode"
  | "crypto"
  | "jwt"
  | "format"
  | "convert"
  | "text"
  | "validate"
  | "time"
  | "number"
  | "network"
  | "generate"
  | "image"
  | "reference"
  | "playground";

export type Category = {
  id: CategoryId;
  name: Localized;
  icon: IconName;
};

/**
 * What the shell knows about a tool without loading it.
 *
 * Search, the command palette, the home page, `sitemap.ts` and the per-page
 * metadata are all generated from these objects, so a tool is registered in
 * exactly one place. The component itself is loaded separately and lazily —
 * see `components.ts` — because half of them pull a parser or a wasm module
 * that has no business being in the bundle of a page that does not use it.
 */
export type ToolMeta = {
  /** URL slug. Stable: it is what a shared link points at. */
  id: string;
  category: CategoryId;
  name: Localized;
  /** One line, shown under the name on cards and as the meta description. */
  blurb: Localized;
  /**
   * Extra search terms. The name is always searched, so this is for what
   * someone would type instead of the name — including the other language's
   * word for it, since a Turkish speaker searching in English is the common
   * case and not the other way round.
   */
  keywords: Record<Locale, string[]>;
  icon: IconName;
  /** Slugs shown at the bottom of the page. */
  related?: string[];
  /**
   * The tool sends a request to a third-party API. Everything else is pure
   * client-side work, and the footer's privacy line depends on that being
   * true, so the few exceptions are marked and labelled on the page.
   */
  network?: boolean;
};
