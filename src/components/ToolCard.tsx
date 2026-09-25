"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { useFavorites } from "@/lib/storage";
import ToolIcon from "@/components/ToolIcon";
import type { ToolMeta } from "@/tools/types";
import { cn } from "@/lib/utils";

export default function ToolCard({
  locale,
  tool,
}: {
  locale: Locale;
  tool: ToolMeta;
}) {
  const { favorites, toggle } = useFavorites();
  const starred = favorites.includes(tool.id);

  return (
    <div className="group relative">
      <Link
        href={`/${locale}/${tool.id}`}
        className="flex h-full flex-col gap-1.5 rounded-lg border p-4 pr-10 transition-colors hover:border-foreground/25 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ToolIcon
            name={tool.icon}
            className="size-4 shrink-0 text-muted-foreground"
          />
          {pick(locale, tool.name)}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {pick(locale, tool.blurb)}
        </span>
      </Link>

      {/* Outside the link, or a star would follow it. Visible once starred,
          otherwise only on hover and on keyboard focus. */}
      <button
        type="button"
        onClick={() => toggle(tool.id)}
        title={t(locale, starred ? "tool.unfavorite" : "tool.favorite")}
        aria-label={t(locale, starred ? "tool.unfavorite" : "tool.favorite")}
        aria-pressed={starred}
        className={cn(
          "absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:opacity-100",
          starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <Star
          className={cn("size-3.5", starred && "fill-current text-warning")}
        />
      </button>
    </div>
  );
}
