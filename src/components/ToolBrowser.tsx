"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Search, X } from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Input } from "@/components/ui/input";
import PinnedTools from "@/components/PinnedTools";
import { HOME_SEARCH_ID } from "@/components/SiteHeader";
import ToolCard from "@/components/ToolCard";
import ToolGrid from "@/components/ToolGrid";
import { CATEGORIES } from "@/tools/categories";
import { encodeShared } from "@/lib/share";
import { detect } from "@/tools/detect";
import { getTool, searchTools, TOOLS } from "@/tools/registry";
import type { ToolMeta } from "@/tools/types";

const COPY = {
  pasted: {
    tr: "yapıştırılan içerik ({count} satır)",
    en: "pasted content ({count} lines)",
  },
  clearSearch: { tr: "Aramayı temizle", en: "Clear search" },
} satisfies Record<string, Localized>;

const LISTBOX_ID = "home-results";

type Result = { tool: ToolMeta; href: string; note?: React.ReactNode };

function resultsFor(
  query: string,
  pasted: string | null,
  locale: Locale,
): Result[] {
  const value = pasted ?? query;
  const found = detect(value);
  const detectedTool = found ? getTool(found.toolId) : undefined;
  const matches = pasted || !query.trim() ? [] : searchTools(query, locale);

  const results: Result[] = matches
    .filter((tool) => tool.id !== detectedTool?.id)
    .map((tool) => ({ tool, href: `/${locale}/${tool.id}` }));

  if (found && detectedTool) {
    const encoded = encodeShared(value.trim());
    results.unshift({
      tool: detectedTool,
      href: `/${locale}/${detectedTool.id}${encoded ? `#i=${encoded}` : ""}`,
      note: (
        <>
          {t(locale, "search.detected")}{" "}
          <span className="font-medium text-foreground">
            {pick(locale, found.label)}
          </span>
        </>
      ),
    });
  }
  return results;
}

export default function ToolBrowser({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pasted, setPasted] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const [cursor, setCursor] = useState({ key: "", index: 0 });

  const searching = pasted !== null || deferred.trim().length > 0;
  const key = pasted ?? query;

  const results = useMemo(
    () => resultsFor(deferred, pasted, locale),
    [deferred, pasted, locale],
  );

  const groups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        tools: TOOLS.filter((tool) => tool.category === category.id),
      })).filter((group) => group.tools.length > 0),
    [],
  );

  const active =
    cursor.key === key ? Math.min(cursor.index, results.length - 1) : 0;

  function clear() {
    setQuery("");
    setPasted(null);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (query || pasted !== null) {
        event.preventDefault();
        clear();
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (active + step + results.length) % results.length;
      setCursor({ key, index: next });
      document
        .getElementById(optionId(results[next].tool))
        ?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (event.key === "Enter") {
      const current =
        deferred === query
          ? results[active]
          : resultsFor(query, pasted, locale)[0];
      if (!current) return;
      event.preventDefault();
      router.push(current.href);
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\n") && text.length <= 200) return;
    event.preventDefault();
    setPasted(text);
    setQuery("");
  }

  const pastedLines = pasted?.replace(/\s+$/, "").split(/\r?\n/).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {pasted !== null && (
          <span className="pointer-events-none absolute left-11 top-1/2 inline-flex max-w-[calc(100%-6rem)] -translate-y-1/2 items-center gap-1.5 rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
            <ClipboardPaste className="size-3.5 shrink-0" />
            <span className="truncate tabular">
              {pick(locale, COPY.pasted).replace(
                "{count}",
                String(pastedLines),
              )}
            </span>
          </span>
        )}
        <Input
          id={HOME_SEARCH_ID}
          value={query}
          onChange={(event) => {
            setPasted(null);
            setQuery(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={pasted === null ? t(locale, "search.placeholder") : ""}
          className="h-12 rounded-xl bg-card pl-11 pr-10 text-base shadow-soft focus-visible:border-tint/50 focus-visible:ring-4 focus-visible:ring-tint/10"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={searching}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={
            searching && results[active]
              ? optionId(results[active].tool)
              : undefined
          }
          aria-label={t(locale, "nav.openPalette")}
        />
        {(query || pasted !== null) && (
          <button
            type="button"
            onClick={clear}
            aria-label={t(locale, "tool.clear")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {!searching && (
        <div className="flex min-h-7 items-center gap-4">
          <div className="min-w-0 flex-1">
            <PinnedTools locale={locale} fallback={null} />
          </div>
        </div>
      )}

      {!searching ? (
        <ToolGrid locale={locale} groups={groups} />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <p>{t(locale, "search.empty")}</p>
          <button
            type="button"
            onClick={clear}
            className="rounded-md border bg-card px-3 py-1.5 text-foreground transition-colors hover:bg-accent"
          >
            {pick(locale, COPY.clearSearch)}
          </button>
        </div>
      ) : (
        <section className="flex flex-col gap-1 rounded-xl border bg-card p-2 shadow-soft">
          <h2 className="px-2 pt-1 text-xs font-medium text-muted-foreground tabular">
            {t(locale, "nav.toolCount", { count: results.length })}
          </h2>
          <ul
            id={LISTBOX_ID}
            role="listbox"
            aria-label={t(locale, "nav.allTools")}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {results.map((result, index) => (
              <ToolCard
                key={result.tool.id}
                id={optionId(result.tool)}
                locale={locale}
                tool={result.tool}
                href={result.href}
                note={result.note}
                active={index === active}
                option
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function optionId(tool: ToolMeta): string {
  return `home-option-${tool.id}`;
}
