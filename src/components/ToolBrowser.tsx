"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Input } from "@/components/ui/input";
import ToolCard from "@/components/ToolCard";
import ToolIcon from "@/components/ToolIcon";
import { CATEGORIES } from "@/tools/categories";
import { searchTools, TOOLS } from "@/tools/registry";
import type { CategoryId } from "@/tools/types";
import { cn } from "@/lib/utils";

/**
 * The home page's index: a search box, category filters, and the grid.
 *
 * With eighty tools, a page that is only fourteen stacked sections is a page
 * nobody reaches the bottom of. Typing filters everything at once, which is
 * how most visits will end — and the filter runs against both languages, so
 * a Turkish interface still finds a tool someone knows by its English name.
 */
export default function ToolBrowser({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  // The list is redrawn on every keystroke; deferring it keeps the input
  // itself responsive when the result set is large.
  const deferred = useDeferredValue(query);

  const matches = useMemo(() => {
    const found = deferred.trim() ? searchTools(deferred, locale) : TOOLS;
    return category
      ? found.filter((tool) => tool.category === category)
      : found;
  }, [deferred, locale, category]);

  const grouped = useMemo(() => {
    return CATEGORIES.map((entry) => ({
      category: entry,
      tools: matches.filter((tool) => tool.category === entry.id),
    })).filter((group) => group.tools.length > 0);
  }, [matches]);

  const searching = deferred.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(locale, "search.placeholder")}
          className="h-12 rounded-xl pl-10 pr-10 text-base"
          autoFocus
          aria-label={t(locale, "nav.openPalette")}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t(locale, "tool.clear")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip
          active={category === null}
          onClick={() => setCategory(null)}
          label={t(locale, "nav.allTools")}
          count={TOOLS.length}
        />
        {CATEGORIES.map((entry) => {
          const count = TOOLS.filter(
            (tool) => tool.category === entry.id,
          ).length;
          if (count === 0) return null;
          return (
            <Chip
              key={entry.id}
              active={category === entry.id}
              onClick={() =>
                setCategory(category === entry.id ? null : entry.id)
              }
              label={pick(locale, entry.name)}
              count={count}
              icon={<ToolIcon name={entry.icon} className="size-3.5" />}
            />
          );
        })}
      </div>

      {matches.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {t(locale, "search.empty")}
        </p>
      ) : searching || category ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(locale, "nav.toolCount", { count: matches.length })}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((tool) => (
              <ToolCard key={tool.id} locale={locale} tool={tool} />
            ))}
          </div>
        </section>
      ) : (
        grouped.map(({ category: entry, tools }) => (
          <section
            key={entry.id}
            id={entry.id}
            className="flex scroll-mt-20 flex-col gap-3"
          >
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <ToolIcon
                name={entry.icon}
                className="size-4 text-muted-foreground"
              />
              {pick(locale, entry.name)}
              <span className="text-xs font-normal text-muted-foreground tabular">
                {tools.length}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} locale={locale} tool={tool} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "tabular",
          active ? "opacity-70" : "text-muted-foreground/70",
        )}
      >
        {count}
      </span>
    </button>
  );
}
