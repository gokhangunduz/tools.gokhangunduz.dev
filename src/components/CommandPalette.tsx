"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { pick, t, type Locale } from "@/i18n";
import { CATEGORY_BY_ID } from "@/tools/categories";
import ToolIcon from "@/components/ToolIcon";
import { searchTools } from "@/tools/registry";

/**
 * Cmd+K, and the header's search button.
 *
 * Ranking is `searchTools`, not cmdk's built-in matcher, because the ordering
 * here is deliberate — an exact name beats a keyword beats a blurb, and both
 * languages are searched whatever the interface is set to. `shouldFilter` is
 * off so the list shows exactly what that function returned, in its order.
 */
export default function CommandPalette({
  locale,
  open,
  onOpenChange,
}: {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchTools(query, locale), [query, locale]);

  // Cleared as it closes rather than as it opens, so the list does not flash
  // the previous search's results on the way out.
  function handleOpenChange(next: boolean) {
    if (!next) setQuery("");
    onOpenChange(next);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label={t(locale, "nav.openPalette")}
      shouldFilter={false}
      loop
      className="fixed inset-0 z-50"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => handleOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[12vh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border bg-popover shadow-2xl">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder={t(locale, "search.placeholder")}
          className="h-12 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t(locale, "search.empty")}
          </Command.Empty>
          {results.map((tool) => (
            <Command.Item
              key={tool.id}
              value={tool.id}
              onSelect={() => {
                handleOpenChange(false);
                router.push(`/${locale}/${tool.id}`);
              }}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
            >
              <ToolIcon
                name={tool.icon}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate">{pick(locale, tool.name)}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {pick(locale, CATEGORY_BY_ID[tool.category].name)}
              </span>
            </Command.Item>
          ))}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
