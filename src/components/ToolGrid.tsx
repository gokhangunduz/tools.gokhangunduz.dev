import Link from "next/link";
import { pick, type Locale } from "@/i18n";
import type { Category, ToolMeta } from "@/tools/types";
import { IconBadge } from "@/components/ToolIcon";
import { cn } from "@/lib/utils";

export default function ToolGrid({
  locale,
  groups,
}: {
  locale: Locale;
  groups: { category: Category; tools: ToolMeta[] }[];
}) {
  return (
    <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
      {groups.map(({ category, tools }, index) => (
        <section
          key={category.id}
          id={category.id}
          className={cn(
            `flex scroll-mt-4 flex-col gap-2 cat-${category.id}`,
            index === 0 && "lg:col-span-2",
          )}
        >
          <h2 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-tint" />
            {pick(locale, category.name)}
          </h2>
          <ul
            className={cn(
              "grid grid-cols-1 gap-2 sm:grid-cols-2",
              index === 0 && "lg:grid-cols-4",
            )}
          >
            {tools.map((tool) => (
              <li key={tool.id}>
                <Link
                  href={`/${locale}/${tool.id}`}
                  title={pick(locale, tool.blurb)}
                  className="group flex items-center gap-3 rounded-lg border bg-card px-2.5 py-2 shadow-soft transition-all hover:-translate-y-px hover:border-tint/40 hover:shadow-lift focus-visible:border-tint/60 focus-visible:outline-none"
                >
                  <IconBadge name={tool.icon} />
                  <span className="truncate text-sm font-medium">
                    {pick(locale, tool.name)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
