"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import ToolIcon, { IconBadge } from "@/components/ToolIcon";
import { useFavorites } from "@/lib/storage";
import { CATEGORIES } from "@/tools/categories";
import { TOOL_BY_ID, TOOLS } from "@/tools/registry";
import type { ToolMeta } from "@/tools/types";
import { cn } from "@/lib/utils";

/** Every tool, grouped, with the current one marked. Used as the desktop rail and inside the mobile drawer. */
export default function Sidebar({
  locale,
  onNavigate,
}: {
  locale: Locale;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = pathname.split("/")[2] ?? null;
  const { favorites } = useFavorites();

  const starred = favorites
    .map((id) => TOOL_BY_ID.get(id))
    .filter((tool): tool is ToolMeta => tool !== undefined);

  const groups = CATEGORIES.map((category) => ({
    category,
    tools: TOOLS.filter((tool) => tool.category === category.id),
  })).filter((group) => group.tools.length > 0);

  return (
    <nav className="flex flex-col gap-6 px-3 py-4 text-sm">
      {starred.length > 0 && (
        <Group
          title={t(locale, "home.favorites")}
          icon={
            <span className="inline-flex size-5 items-center justify-center rounded-[5px] bg-warning/12 text-warning">
              <Star className="size-3 fill-current" />
            </span>
          }
        >
          {starred.map((tool) => (
            <Item
              key={tool.id}
              locale={locale}
              tool={tool}
              active={tool.id === current}
              onNavigate={onNavigate}
            />
          ))}
        </Group>
      )}

      {groups.map(({ category, tools }) => (
        <Group
          key={category.id}
          title={pick(locale, category.name)}
          tint={`cat-${category.id}`}
          icon={<IconBadge name={category.icon} size="sm" />}
        >
          {tools.map((tool) => (
            <Item
              key={tool.id}
              locale={locale}
              tool={tool}
              active={tool.id === current}
              onNavigate={onNavigate}
            />
          ))}
        </Group>
      ))}
    </nav>
  );
}

/** The desktop rail. Tool routes only: the home page is the index itself. */
export function SidebarRail({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!pathname.split("/")[2]) return null;
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r lg:flex">
      {children}
    </aside>
  );
}

function Group({
  title,
  icon,
  tint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", tint)}>
      <h3 className="mb-1.5 flex items-center gap-2 px-2 text-[13px] font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-px">{children}</ul>
    </div>
  );
}

function Item({
  locale,
  tool,
  active,
  onNavigate,
}: {
  locale: Locale;
  tool: ToolMeta;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li className={`cat-${tool.category}`}>
      <Link
        href={`/${locale}/${tool.id}`}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
          active
            ? "bg-tint/10 font-medium text-tint"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <ToolIcon
          name={tool.icon}
          className={cn(
            "size-4 shrink-0 transition-colors",
            active
              ? "text-tint"
              : "text-muted-foreground/70 group-hover:text-tint",
          )}
        />
        <span className="truncate">{pick(locale, tool.name)}</span>
      </Link>
    </li>
  );
}
