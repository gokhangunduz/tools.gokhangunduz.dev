"use client";

import { useState } from "react";
import type { Locale } from "@/i18n";
import { pick, t } from "@/i18n";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { OptionValue, OptionValues, ToolOption } from "@/tools/text-tool";
import { cn } from "@/lib/utils";

const TEXT_WIDTH = {
  sm: "sm:w-20",
  md: "sm:w-44",
  fill: "sm:min-w-48 sm:flex-1",
};

const INVALID = "border-destructive focus-visible:border-destructive";

/**
 * The options strip above the input.
 *
 * Plain controls rather than a settings panel: there are never more than four
 * of them, and a tool whose switches are hidden behind a disclosure is a tool
 * whose switches nobody finds. Below `sm` they line up as a two-column grid.
 *
 * The caller passes only the options that apply right now (`visibleOptions`).
 */
export default function OptionRow({
  locale,
  options,
  values,
  onChange,
  invalidField,
  sharing = false,
}: {
  locale: Locale;
  options: ToolOption[];
  values: OptionValues;
  onChange: (id: string, value: OptionValue) => void;
  /** The option a ToolError names as the problem. */
  invalidField?: string;
  /** The tool writes a link, so a filled secret option gets a note that it is left out. */
  sharing?: boolean;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  if (options.length === 0) return null;

  const ordered = [
    ...options.filter((o) => o.kind === "text" && o.primary),
    ...options.filter((o) => !(o.kind === "text" && o.primary)),
  ];
  const wide = options.some(
    (o) => o.kind === "text" && (o.primary || o.width === "fill"),
  );
  const unshared = sharing
    ? options.filter((o) => o.secret && values[o.id] !== o.default)
    : [];

  return (
    <div
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-3",
        !wide && "sm:w-auto",
      )}
    >
      {ordered.map((option) => {
        const label = pick(locale, option.label);
        const invalid = option.id === invalidField;
        const described = option.hint
          ? {
              title: pick(locale, option.hint),
              "aria-description": pick(locale, option.hint),
            }
          : {};

        if (option.kind === "switch") {
          return (
            <label
              key={option.id}
              className="col-span-2 grid select-none grid-cols-subgrid items-center text-sm text-muted-foreground hover:text-foreground sm:flex sm:flex-row-reverse sm:gap-2"
            >
              {label}
              <Switch
                checked={Boolean(values[option.id])}
                onCheckedChange={(checked) => onChange(option.id, checked)}
                aria-invalid={invalid || undefined}
                className={cn("justify-self-start", invalid && INVALID)}
                {...described}
              />
            </label>
          );
        }

        if (option.kind === "select") {
          return (
            <label
              key={option.id}
              className="col-span-2 grid grid-cols-subgrid items-center text-sm text-muted-foreground sm:flex sm:gap-2"
            >
              {label}
              <span className="relative w-full sm:w-auto">
                <select
                  value={String(values[option.id])}
                  onChange={(e) => onChange(option.id, e.target.value)}
                  aria-invalid={invalid || undefined}
                  {...described}
                  className={cn(
                    "h-8 w-full appearance-none rounded-md border bg-background pl-2.5 pr-7 text-sm text-foreground outline-none transition-colors sm:w-auto",
                    "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25",
                    invalid && INVALID,
                  )}
                >
                  {option.choices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {pick(locale, choice.label)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </span>
            </label>
          );
        }

        const masked = option.sensitive && !revealed[option.id];
        const toggleLabel = t(
          locale,
          masked ? "tool.showValue" : "tool.hideValue",
        );
        return (
          <label
            key={option.id}
            className={cn(
              "col-span-2 items-center text-sm text-muted-foreground sm:flex sm:gap-2",
              option.primary
                ? "flex gap-2 sm:basis-full"
                : "grid grid-cols-subgrid",
              !option.primary && option.width === "fill" && "sm:flex-1",
            )}
          >
            {label}
            <span
              className={cn(
                "relative w-full",
                option.primary
                  ? "min-w-0 flex-1"
                  : TEXT_WIDTH[option.width ?? "md"],
              )}
            >
              <Input
                type={masked ? "password" : "text"}
                value={String(values[option.id])}
                placeholder={
                  option.placeholder
                    ? pick(locale, option.placeholder)
                    : undefined
                }
                onChange={(e) => onChange(option.id, e.target.value)}
                aria-invalid={invalid || undefined}
                {...described}
                {...(option.sensitive
                  ? {
                      autoComplete: "off",
                      spellCheck: false,
                      autoCapitalize: "off",
                      autoCorrect: "off",
                      "data-1p-ignore": true,
                      "data-lpignore": "true",
                    }
                  : {})}
                className={cn(
                  "font-mono text-sm text-foreground placeholder:font-sans placeholder:text-muted-foreground",
                  option.primary ? "h-9" : "h-8",
                  option.sensitive && "pr-8",
                  invalid && INVALID,
                )}
              />
              {option.sensitive && (
                <button
                  type="button"
                  onClick={() =>
                    setRevealed((current) => ({
                      ...current,
                      [option.id]: !current[option.id],
                    }))
                  }
                  title={toggleLabel}
                  aria-label={toggleLabel}
                  aria-pressed={!masked}
                  className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {masked ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </button>
              )}
            </span>
          </label>
        );
      })}
      {unshared.length > 0 && (
        <p className="col-span-2 text-xs text-muted-foreground sm:basis-full">
          {t(locale, "tool.secretNotShared", {
            name: unshared.map((o) => pick(locale, o.label)).join(", "),
          })}
        </p>
      )}
    </div>
  );
}
