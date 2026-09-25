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
  /**
   * The column whose cells are written as "Türkçe / English" and should be
   * split to the active language.
   *
   * Declared rather than detected: a cell like "Windows 10 / 11" would be cut
   * in half by a rule that guessed, and these tables are the one place where
   * a silent mangling would go unnoticed for a long time.
   */
  bilingualColumn?: number;
};
