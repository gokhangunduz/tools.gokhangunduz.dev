import type { Localized } from "@/i18n";

/**
 * The contract for a reference page: a table you search rather than a
 * conversion you run.
 *
 * HTTP status codes, MIME types, git commands. The value is having them
 * filterable in one place with no network round-trip, which is the one thing
 * a search engine cannot offer.
 */
export type ReferenceSpec = {
  columns: Localized[];
  rows: string[][];
  /** Rows whose first cell starts with this get a section heading instead. */
  groups?: { label: Localized; match: (row: string[]) => boolean }[];
};
