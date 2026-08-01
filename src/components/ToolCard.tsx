"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { useFavorites } from "@/lib/storage";
import type { ToolMeta } from "@/tools/types";
import { cn } from "@/lib/utils";

export default function ToolCard({
  locale,
  tool,
  href = `/${locale}/${tool.id}`,
  note,
  id,
  active = false,
  option = false,
}: {
  locale: Locale;
  tool: ToolMeta;
  href?: string;
  note?: React.ReactNode;
  id?: string;
  active?: boolean;
  option?: boolean;
}) {
  const { favorites, toggle } = useFavorites();
  const starred = favorites.includes(tool.id);
  const label = t(locale, starred ? "tool.unfavorite" : "tool.favorite");

  return (
    <li
      id={id}
      role={option ? "option" : undefined}
      aria-selected={option ? active : undefined}
      className={cn("group relative", `cat-${tool.category}`)}
    >
      <Link
        href={href}
        tabIndex={option ? -1 : undefined}
        className={cn(
          "flex min-w-0 flex-col rounded-md px-2 py-2 pr-9 transition-colors hover:bg-tint/10 focus-visible:bg-tint/10 focus-visible:outline-none sm:py-0.5",
          active && "bg-tint/10",
        )}
      >
        <span
          className={cn(
            "truncate text-sm font-medium group-hover:text-tint",
            active && "text-tint",
          )}
        >
          {pick(locale, tool.name)}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {note ?? pick(locale, tool.blurb)}
        </span>
      </Link>

      {active && option && (
        <kbd
          title={t(locale, "search.hint")}
          className="pointer-events-none absolute right-9 top-1/2 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline"
        >
          ↵
        </kbd>
      )}

      <button
        type="button"
        onClick={() => toggle(tool.id)}
        title={label}
        aria-label={label}
        aria-pressed={starred}
        tabIndex={option ? -1 : undefined}
        className={cn(
          "absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:pointer-events-auto focus-visible:opacity-100",
          starred
            ? "opacity-100"
            : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-60",
        )}
      >
        <Star
          className={cn("size-3.5", starred && "fill-current text-warning")}
        />
      </button>
    </li>
  );
}
