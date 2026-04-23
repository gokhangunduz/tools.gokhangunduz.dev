"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Input } from "@/components/ui/input";
import type { ReferenceSpec } from "@/tools/reference-tool";

/**
 * A searchable table.
 *
 * The filter matches any cell, because the way these are used is "what was
 * the code for conflict" as often as "what does 409 mean". Accents and
 * Turkish casing are normalised so that typing without them still finds
 * the row.
 */
export default function ReferenceTool({
  locale,
  spec,
}: {
  locale: Locale;
  spec: ReferenceSpec;
}) {
  const [query, setQuery] = useState("");

  // Split to the active language first, then filtered — so a search matches
  // what is on screen rather than the other language's half of the cell.
  const localized = useMemo(
    () =>
      spec.rows.map((row) =>
        row.map((cell, index) =>
          index === spec.bilingualColumn ? split(cell, locale) : cell,
        ),
      ),
    [spec.rows, spec.bilingualColumn, locale],
  );

  const rows = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return localized;
    return localized.filter((row) =>
      row.some((cell) => normalize(cell).includes(needle)),
    );
  }, [localized, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(locale, "reference.filter")}
          className="h-10 pl-9"
          autoFocus
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t(locale, "search.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                {spec.columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {pick(locale, column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b last:border-0 hover:bg-accent/40"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={
                        cellIndex === 0
                          ? "whitespace-nowrap px-3 py-2 font-mono text-xs tabular"
                          : "px-3 py-2 align-top"
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground tabular">
        {t(locale, "reference.count", {
          shown: rows.length,
          total: spec.rows.length,
        })}
      </p>
    </div>
  );
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");
}

/**
 * Takes one side of a "Türkçe / English" cell.
 *
 * Only the first separator counts: the English half often contains a slash of
 * its own, as in `application/json`.
 */
function split(cell: string, locale: Locale): string {
  const at = cell.indexOf(" / ");
  if (at === -1) return cell;
  return locale === "tr" ? cell.slice(0, at) : cell.slice(at + 3);
}
