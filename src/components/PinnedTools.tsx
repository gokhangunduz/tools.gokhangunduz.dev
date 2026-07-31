"use client";

import Link from "next/link";
import { History, Star } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { useFavorites, useRecent } from "@/lib/storage";
import { TOOL_BY_ID } from "@/tools/registry";
import type { ToolMeta } from "@/tools/types";
import ToolIcon from "@/components/ToolIcon";

export default function PinnedTools({
  locale,
  fallback,
}: {
  locale: Locale;
  fallback: React.ReactNode;
}) {
  const { favorites } = useFavorites();
  const recent = useRecent();

  const starred = resolve(favorites);
  const visited = resolve(recent.filter((id) => !favorites.includes(id))).slice(
    0,
    3,
  );

  if (starred.length === 0 && visited.length === 0) return fallback;

  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
      {starred.length > 0 && (
        <Label icon={<Star className="size-3.5" />}>
          {t(locale, "home.favorites")}
        </Label>
      )}
      {starred.map((tool) => (
        <Chip key={tool.id} locale={locale} tool={tool} />
      ))}
      {visited.length > 0 && (
        <Label icon={<History className="size-3.5" />}>
          {t(locale, "home.recent")}
        </Label>
      )}
      {visited.map((tool) => (
        <Chip key={tool.id} locale={locale} tool={tool} />
      ))}
    </div>
  );
}

function resolve(ids: string[]): ToolMeta[] {
  return ids
    .map((id) => TOOL_BY_ID.get(id))
    .filter((tool): tool is ToolMeta => tool !== undefined);
}

function Label({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 pr-0.5 text-xs text-muted-foreground [&:not(:first-child)]:ml-2">
      {icon}
      {children}
    </span>
  );
}

function Chip({ locale, tool }: { locale: Locale; tool: ToolMeta }) {
  return (
    <Link
      href={`/${locale}/${tool.id}`}
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border bg-card px-2 text-xs transition-colors hover:border-tint/40 hover:text-tint cat-${tool.category}`}
    >
      <ToolIcon name={tool.icon} className="size-3.5 text-tint" />
      {pick(locale, tool.name)}
    </Link>
  );
}
