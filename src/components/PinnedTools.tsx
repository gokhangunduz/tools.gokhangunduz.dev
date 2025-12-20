"use client";

import { t, type Locale } from "@/i18n";
import { useFavorites, useRecent } from "@/lib/storage";
import { TOOL_BY_ID } from "@/tools/registry";
import type { ToolMeta } from "@/tools/types";
import ToolGrid from "@/components/ToolGrid";

/**
 * The two personal rows at the top of the home page.
 *
 * Both live in localStorage, so they render nothing on the server and nothing
 * on a first visit — no empty-state box for a feature the visitor has not used
 * yet, and no layout shift beyond the row appearing once it has content.
 */
export default function PinnedTools({ locale }: { locale: Locale }) {
  const { favorites } = useFavorites();
  const recent = useRecent();

  const starred = resolve(favorites);
  // A tool already starred does not need a second row of its own.
  const visited = resolve(recent.filter((id) => !favorites.includes(id))).slice(
    0,
    4,
  );

  if (starred.length === 0 && visited.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {starred.length > 0 && (
        <Section title={t(locale, "home.favorites")}>
          <ToolGrid locale={locale} tools={starred} />
        </Section>
      )}
      {visited.length > 0 && (
        <Section title={t(locale, "home.recent")}>
          <ToolGrid locale={locale} tools={visited} />
        </Section>
      )}
    </div>
  );
}

function resolve(ids: string[]): ToolMeta[] {
  return ids
    .map((id) => TOOL_BY_ID.get(id))
    .filter((tool): tool is ToolMeta => tool !== undefined);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
